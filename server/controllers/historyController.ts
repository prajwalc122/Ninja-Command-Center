import { Request, Response } from 'express';
import { db } from '../config/db';
import { verifyJwtToken } from '../middleware/security';

function getUserIdFromReq(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const decoded = verifyJwtToken(authHeader.substring(7));
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
        userId: userId || null,
        command: typeof command === 'string' ? command.slice(0, 500) : 'Command executed',
        toolId: typeof toolId === 'string' ? toolId.slice(0, 100) : 'generic',
        toolName: typeof toolName === 'string' ? toolName.slice(0, 100) : 'Tool',
        status: status === 'error' ? 'error' : 'success',
        resultPreview: typeof resultPreview === 'string' ? resultPreview.slice(0, 1000) : '',
        parameters: parameters && typeof parameters === 'object' ? parameters : {},
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

      // Isolated per-user history
      const query = userId ? { userId } : { userId: null };
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
      const userId = getUserIdFromReq(req);
      const historyCol = db.collection('commandHistory');

      const item = await historyCol.findOne({ id });
      if (!item) {
        return res.status(404).json({ error: 'History item not found.' });
      }

      // Check ownership
      if (item.userId && (!userId || item.userId !== userId)) {
        return res.status(403).json({ error: 'Unauthorized to delete this item.' });
      }

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
      } else {
        const anonItems = await historyCol.find({ userId: null });
        for (const item of anonItems) {
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
