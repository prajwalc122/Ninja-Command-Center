import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authController } from '../controllers/authController';
import { fileController, uploadMiddleware } from '../controllers/fileController';
import { historyController } from '../controllers/historyController';
import { workflowController } from '../controllers/workflowController';
import { adminController } from '../controllers/adminController';
import { TOOLS } from '../../shared/constants/tools';
import {
  authenticateToken,
  requireRole,
  optionalAuth,
  authLimiter,
  aiLimiter,
  fileLimiter,
  adminLimiter,
  createRateLimitMiddleware,
} from '../middleware/security';

export const apiRouter = Router();

// --- TOOLS PUBLIC METADATA ---
apiRouter.get('/tools', (_req, res) => {
  res.json({ tools: TOOLS });
});

apiRouter.get('/tools/:id', (req, res) => {
  const safeId = String(req.params.id || '').slice(0, 50);
  const tool = TOOLS.find((t) => t.id === safeId || t.slug === safeId);
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found.' });
  }
  return res.json({ tool });
});

// --- AI COMMAND & TOOLS (Rate-Limited) ---
const aiRateLimitMiddleware = createRateLimitMiddleware(aiLimiter, 'ai');
apiRouter.post('/ai/command', aiRateLimitMiddleware, aiController.interpretCommand);
apiRouter.post('/ai/chat', aiRateLimitMiddleware, aiController.chat);
apiRouter.post('/ai/assistant', aiRateLimitMiddleware, aiController.chat);
apiRouter.post('/ai/summarize', aiRateLimitMiddleware, aiController.summarize);
apiRouter.post('/ai/translate', aiRateLimitMiddleware, aiController.translate);
apiRouter.post('/ai/rewrite', aiRateLimitMiddleware, aiController.rewrite);
apiRouter.post('/ai/resume', aiRateLimitMiddleware, aiController.generateResume);

// --- AUTHENTICATION (Rate-Limited) ---
const authRateLimitMiddleware = createRateLimitMiddleware(authLimiter, 'auth');
apiRouter.post('/auth/register', authRateLimitMiddleware, authController.register);
apiRouter.post('/auth/login', authRateLimitMiddleware, authController.login);
apiRouter.post('/auth/forgot-password', authRateLimitMiddleware, authController.forgotPassword);
apiRouter.post('/auth/reset-password', authRateLimitMiddleware, authController.resetPassword);
apiRouter.post('/auth/logout', optionalAuth, authController.logout);
apiRouter.get('/user/me', authenticateToken, authController.me);

// --- FILE PROCESSING & WORKSPACE (Rate-Limited) ---
const fileRateLimitMiddleware = createRateLimitMiddleware(fileLimiter, 'files');
apiRouter.post('/files/upload', fileRateLimitMiddleware, optionalAuth, uploadMiddleware.single('file'), fileController.upload);
apiRouter.get('/files', optionalAuth, fileController.list);
apiRouter.delete('/files/:id', optionalAuth, fileController.delete);
apiRouter.get('/files/download/:filename', fileController.download);
apiRouter.post('/files/compress-pdf', fileRateLimitMiddleware, uploadMiddleware.single('file'), fileController.compressPdf);
apiRouter.post('/files/split-pdf', fileRateLimitMiddleware, uploadMiddleware.single('file'), fileController.splitPdf);
apiRouter.post('/files/inspect', fileRateLimitMiddleware, uploadMiddleware.single('file'), fileController.inspect);

// --- HISTORY (Isolated Per-User) ---
apiRouter.post('/history', optionalAuth, historyController.add);
apiRouter.get('/history', optionalAuth, historyController.list);
apiRouter.delete('/history/:id', optionalAuth, historyController.deleteOne);
apiRouter.delete('/history', optionalAuth, historyController.clearAll);

// --- WORKFLOWS ---
apiRouter.get('/workflows', optionalAuth, workflowController.list);
apiRouter.post('/workflows', optionalAuth, workflowController.create);
apiRouter.delete('/workflows/:id', optionalAuth, workflowController.delete);

// --- ADMIN PANEL (Strict RBAC & Rate-Limited) ---
const adminRateLimitMiddleware = createRateLimitMiddleware(adminLimiter, 'admin');
apiRouter.get('/admin/stats', adminRateLimitMiddleware, authenticateToken, requireRole('admin'), adminController.getStats);
apiRouter.get('/admin/tools', adminRateLimitMiddleware, authenticateToken, requireRole('admin'), adminController.getToolsConfig);
apiRouter.post('/admin/tools/toggle', adminRateLimitMiddleware, authenticateToken, requireRole('admin'), adminController.toggleTool);
apiRouter.get('/admin/security-logs', adminRateLimitMiddleware, authenticateToken, requireRole('admin'), adminController.getSecurityLogs);
