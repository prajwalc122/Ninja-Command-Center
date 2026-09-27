import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authController } from '../controllers/authController';
import { fileController, uploadMiddleware } from '../controllers/fileController';
import { historyController } from '../controllers/historyController';
import { workflowController } from '../controllers/workflowController';
import { adminController } from '../controllers/adminController';
import { TOOLS } from '../../shared/constants/tools';

export const apiRouter = Router();

// --- TOOLS PUBLIC METADATA ---
apiRouter.get('/tools', (_req, res) => {
  res.json({ tools: TOOLS });
});

apiRouter.get('/tools/:id', (req, res) => {
  const tool = TOOLS.find((t) => t.id === req.params.id || t.slug === req.params.id);
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found.' });
  }
  return res.json({ tool });
});

// --- AI COMMAND & TOOLS ---
apiRouter.post('/ai/command', aiController.interpretCommand);
apiRouter.post('/ai/chat', aiController.chat);
apiRouter.post('/ai/assistant', aiController.chat);
apiRouter.post('/ai/summarize', aiController.summarize);
apiRouter.post('/ai/translate', aiController.translate);
apiRouter.post('/ai/rewrite', aiController.rewrite);
apiRouter.post('/ai/resume', aiController.generateResume);

// --- AUTHENTICATION ---
apiRouter.post('/auth/register', authController.register);
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/logout', authController.logout);
apiRouter.get('/user/me', authController.me);

// --- FILE PROCESSING & WORKSPACE ---
apiRouter.post('/files/upload', uploadMiddleware.single('file'), fileController.upload);
apiRouter.get('/files', fileController.list);
apiRouter.delete('/files/:id', fileController.delete);
apiRouter.get('/files/download/:filename', fileController.download);
apiRouter.post('/files/compress-pdf', uploadMiddleware.single('file'), fileController.compressPdf);
apiRouter.post('/files/split-pdf', uploadMiddleware.single('file'), fileController.splitPdf);
apiRouter.post('/files/inspect', uploadMiddleware.single('file'), fileController.inspect);

// --- HISTORY ---
apiRouter.post('/history', historyController.add);
apiRouter.get('/history', historyController.list);
apiRouter.delete('/history/:id', historyController.deleteOne);
apiRouter.delete('/history', historyController.clearAll);

// --- WORKFLOWS ---
apiRouter.get('/workflows', workflowController.list);
apiRouter.post('/workflows', workflowController.create);
apiRouter.delete('/workflows/:id', workflowController.delete);

// --- ADMIN PANEL ---
apiRouter.get('/admin/stats', adminController.getStats);
apiRouter.get('/admin/tools', adminController.getToolsConfig);
apiRouter.post('/admin/tools/toggle', adminController.toggleTool);
