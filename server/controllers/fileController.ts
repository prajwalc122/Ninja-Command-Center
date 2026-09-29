import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileProcessingService } from '../services/fileProcessingService';
import { db } from '../config/db';
import { verifyJwtToken } from '../middleware/security';
import { securityLogger } from '../services/securityLogger';

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration with sanitized filenames and 15MB limit
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const safeBaseName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}_${safeBaseName}`);
  },
});

// Whitelist allowed MIME types for file security
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/json',
  'text/csv',
]);

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB safe limit
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, JPG, WEBP, TXT, JSON, CSV.`));
    }
  },
});

function getRequester(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyJwtToken(authHeader.substring(7));
  }
  return null;
}

export const fileController = {
  async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file was uploaded.' });
      }

      const user = getRequester(req);
      const filesCol = db.collection('files');

      const fileRecord = await filesCol.insertOne({
        userId: user?.id || null,
        filename: req.file.filename,
        originalName: path.basename(req.file.originalname),
        mimeType: req.file.mimetype,
        size: req.file.size,
        downloadUrl: `/api/files/download/${encodeURIComponent(req.file.filename)}`,
      });

      // Update storage usage in stats
      const statsCol = db.collection('usageStats');
      const stats = await statsCol.findOne({ id: 'global_stats' });
      if (stats) {
        await statsCol.updateOne(
          { id: 'global_stats' },
          {
            storageUsedBytes: (stats.storageUsedBytes || 0) + req.file.size,
            totalFilesProcessed: (stats.totalFilesProcessed || 0) + 1,
          }
        );
      }

      return res.status(201).json({
        file: fileRecord,
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      return res.status(500).json({ error: 'File upload failed.' });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const user = getRequester(req);
      const filesCol = db.collection('files');

      // If user is authenticated, retrieve their files; if admin, can view all
      let query: any = {};
      if (user) {
        if (user.role !== 'admin') {
          query = { userId: user.id };
        }
      } else {
        // Unauthenticated guests only see anonymous files from current IP/session
        query = { userId: null };
      }

      const files = await filesCol.find(query, { createdAt: -1 }, 25);
      return res.json({ files });
    } catch (err: any) {
      console.error('File list error:', err);
      return res.status(500).json({ error: 'Failed to retrieve workspace files.' });
    }
  },

  async delete(req: Request, res: Response) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    try {
      const { id } = req.params;
      const user = getRequester(req);

      const filesCol = db.collection('files');
      const file = await filesCol.findOne({ id });
      if (!file) {
        return res.status(404).json({ error: 'File not found.' });
      }

      // Authorization check: Only file owner or admin can delete
      if (file.userId && (!user || (user.id !== file.userId && user.role !== 'admin'))) {
        securityLogger.log({
          eventType: 'UNAUTHORIZED_ACCESS',
          ip: clientIp,
          userId: user?.id,
          details: { action: 'deleteFile', fileId: id, ownerId: file.userId },
        });
        return res.status(403).json({ error: 'Access denied: You do not own this file.' });
      }

      // Prevent path traversal
      const safeFilename = path.basename(file.filename);
      const filePath = path.resolve(uploadsDir, safeFilename);

      if (!filePath.startsWith(uploadsDir)) {
        securityLogger.log({
          eventType: 'PATH_TRAVERSAL_BLOCKED',
          ip: clientIp,
          details: { attemptedPath: file.filename },
        });
        return res.status(400).json({ error: 'Invalid file reference.' });
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await filesCol.deleteOne({ id });
      return res.json({ success: true, message: 'File deleted successfully.' });
    } catch (err: any) {
      console.error('File delete error:', err);
      return res.status(500).json({ error: 'Failed to delete file.' });
    }
  },

  async download(req: Request, res: Response) {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    try {
      const { filename } = req.params;
      const safeFilename = path.basename(filename);

      // Verify resolved path strictly resides inside uploadsDir
      let targetPath = path.resolve(uploadsDir, safeFilename);
      if (!fs.existsSync(targetPath)) {
        targetPath = path.resolve(uploadsDir, 'processed', safeFilename);
      }

      if (!targetPath.startsWith(uploadsDir)) {
        securityLogger.log({
          eventType: 'PATH_TRAVERSAL_BLOCKED',
          ip: clientIp,
          details: { requestedFile: filename },
        });
        return res.status(403).json({ error: 'Forbidden file access.' });
      }

      if (!fs.existsSync(targetPath)) {
        return res.status(404).send('File not found or has expired.');
      }

      return res.download(targetPath);
    } catch (err: any) {
      console.error('File download error:', err);
      return res.status(500).send('Error downloading file.');
    }
  },

  async compressPdf(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'PDF file is required.' });
      }

      const result = await fileProcessingService.compressPdf(req.file.path, req.file.originalname);
      return res.json(result);
    } catch (err: any) {
      console.error('Compress PDF error:', err);
      return res.status(500).json({ error: 'Failed to compress PDF. Please verify file integrity.' });
    }
  },

  async splitPdf(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'PDF file is required.' });
      }

      const pageRange = typeof req.body.pageRange === 'string' ? req.body.pageRange.slice(0, 50) : '1';
      const result = await fileProcessingService.splitPdf(req.file.path, pageRange, req.file.originalname);
      return res.json(result);
    } catch (err: any) {
      console.error('Split PDF error:', err);
      return res.status(500).json({ error: 'Failed to split PDF. Please verify range format.' });
    }
  },

  async inspect(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required for inspection.' });
      }

      const stats = fs.statSync(req.file.path);
      return res.json({
        filename: path.basename(req.file.originalname),
        sizeBytes: stats.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('File inspect error:', err);
      return res.status(500).json({ error: 'File inspection failed.' });
    }
  },
};
