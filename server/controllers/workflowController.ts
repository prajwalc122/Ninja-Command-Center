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

export const workflowController = {
  async list(req: Request, res: Response) {
    try {
      const userId = getUserIdFromReq(req);
      const workflowsCol = db.collection('workflows');
      // Return system templates + user workflows
      const all = await workflowsCol.find({}, { createdAt: -1 });
      const workflows = all.filter((w) => w.isTemplate || (userId && w.userId === userId));
      return res.json({ workflows });
    } catch (err: any) {
      console.error('Workflows list error:', err);
      return res.status(500).json({ error: 'Failed to fetch workflows.' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, description, steps } = req.body;
      if (!name || !Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ error: 'Workflow name and at least one step are required.' });
      }

      const userId = getUserIdFromReq(req);
      const workflowsCol = db.collection('workflows');

      const workflow = await workflowsCol.insertOne({
        userId,
        name: name.trim(),
        description: description?.trim() || 'Custom automated workflow',
        steps,
        isTemplate: false,
      });

      return res.status(201).json({ workflow });
    } catch (err: any) {
      console.error('Workflow create error:', err);
      return res.status(500).json({ error: 'Failed to create workflow.' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const workflowsCol = db.collection('workflows');
      const item = await workflowsCol.findOne({ id });
      if (!item) {
        return res.status(404).json({ error: 'Workflow not found.' });
      }

      if (item.isTemplate) {
        return res.status(403).json({ error: 'System template workflows cannot be deleted.' });
      }

      await workflowsCol.deleteOne({ id });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Workflow delete error:', err);
      return res.status(500).json({ error: 'Failed to delete workflow.' });
    }
  },
};
