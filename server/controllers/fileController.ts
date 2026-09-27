import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileProcessingService } from '../services/fileProcessingService';
import { db } from '../config/db';
import { verifyToken } from './authController';

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration with 50MB limit
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}_${safeName}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

function getUserIdFromReq(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const decoded = verifyToken(authHeader.substring(7));
    return decoded?.id;
  }
  return undefined;
}

export const fileController = {
  async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file was uploaded.' });
      }

      const userId = getUserIdFromReq(req);
      const filesCol = db.collection('files');

      const fileRecord = await filesCol.insertOne({
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        downloadUrl: `/api/files/download/${req.file.filename}`,
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
      const userId = getUserIdFromReq(req);
      const filesCol = db.collection('files');
      // If user is logged in, show their files, else recent files
      const query = userId ? { userId } : {};
      const files = await filesCol.find(query, { createdAt: -1 }, 25);
      return res.json({ files });
    } catch (err: any) {
      console.error('File list error:', err);
      return res.status(500).json({ error: 'Failed to retrieve workspace files.' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const filesCol = db.collection('files');
      const file = await filesCol.findOne({ id });
      if (!file) {
        return res.status(404).json({ error: 'File not found.' });
      }

      const filePath = path.join(uploadsDir, file.filename);
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
    try {
      const { filename } = req.params;
      const safeFilename = path.basename(filename);

      // Check uploads directory or uploads/processed directory
      let targetPath = path.join(uploadsDir, safeFilename);
      if (!fs.existsSync(targetPath)) {
        targetPath = path.join(uploadsDir, 'processed', safeFilename);
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

      const pageRange = req.body.pageRange || '1';
      const result = await fileProcessingService.splitPdf(req.file.path, pageRange, req.file.originalname);
      return res.json(result);
    } catch (err: any) {
      console.error('Split PDF error:', err);
      return res.status(500).json({ error: 'Failed to split PDF.' });
    }
  },

  async inspect(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required.' });
      }

      const metadata = await fileProcessingService.inspectMetadata(
        req.file.path,
        req.file.originalname,
        req.file.mimetype
      );
      return res.json({ metadata });
    } catch (err: any) {
      console.error('Inspect file error:', err);
      return res.status(500).json({ error: 'Failed to inspect file.' });
    }
  },
};
