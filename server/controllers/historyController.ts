import { Request, Response } from 'express';
import { db } from '../config/db';
import { verifyToken } from './authController';

function getUserIdFromReq(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const decoded = verifyToken(authHeader.substring(7));
    return decoded?.id;
  }
  return undefined;
}

export const historyController = {
  async add(req: Request, res: Response) {
    try {
      const { command, toolId, toolName, status, resultPreview, parameters, outputData } = req.body;
      const userId = getUserIdFromReq(req);
      const historyCol = db.collection('commandHistory');

      const entry = await historyCol.insertOne({
        userId,
        command: command || 'Command executed',
        toolId: toolId || 'generic',
        toolName: toolName || 'Tool',
        status: status || 'success',
        resultPreview: resultPreview || '',
        parameters: parameters || {},
        outputData: outputData || null,
      });

      return res.status(201).json({ item: entry });
    } catch (err: any) {
      console.error('History add error:', err);
      return res.status(500).json({ error: 'Failed to record history.' });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const userId = getUserIdFromReq(req);
      const historyCol = db.collection('commandHistory');
      const query = userId ? { userId } : {};
      const history = await historyCol.find(query, { createdAt: -1 }, 40);
      return res.json({ history });
    } catch (err: any) {
      console.error('History list error:', err);
      return res.status(500).json({ error: 'Failed to retrieve history.' });
    }
  },

  async deleteOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const historyCol = db.collection('commandHistory');
      await historyCol.deleteOne({ id });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('History delete error:', err);
      return res.status(500).json({ error: 'Failed to delete history item.' });
    }
  },

  async clearAll(req: Request, res: Response) {
    try {
      const userId = getUserIdFromReq(req);
      const historyCol = db.collection('commandHistory');
      if (userId) {
        const userItems = await historyCol.find({ userId });
        for (const item of userItems) {
          await historyCol.deleteOne({ id: item.id });
        }
      }
      return res.json({ success: true, message: 'History cleared.' });
    } catch (err: any) {
      console.error('History clear error:', err);
      return res.status(500).json({ error: 'Failed to clear history.' });
    }
  },
};
