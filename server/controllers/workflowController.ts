import { Request, Response } from 'express';
import { db } from '../config/db';
import { verifyJwtToken } from '../middleware/security';

function getRequester(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyJwtToken(authHeader.substring(7));
  }
  return null;
}

export const workflowController = {
  async list(req: Request, res: Response) {
    try {
      const user = getRequester(req);
      const workflowsCol = db.collection('workflows');
      // Return system templates + user's own workflows
      const all = await workflowsCol.find({}, { createdAt: -1 });
      const workflows = all.filter((w) => w.isTemplate || (user && w.userId === user.id));
      return res.json({ workflows });
    } catch (err: any) {
      console.error('Workflows list error:', err);
      return res.status(500).json({ error: 'Failed to fetch workflows.' });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, description, steps } = req.body;
      if (!name || typeof name !== 'string' || !Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({ error: 'Workflow name and at least one step are required.' });
      }

      const user = getRequester(req);
      const workflowsCol = db.collection('workflows');

      const workflow = await workflowsCol.insertOne({
        userId: user?.id || null,
        name: name.trim().slice(0, 100),
        description: typeof description === 'string' ? description.trim().slice(0, 300) : 'Custom automated workflow',
        steps: steps.slice(0, 20),
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
      const user = getRequester(req);
      const workflowsCol = db.collection('workflows');
      const item = await workflowsCol.findOne({ id });

      if (!item) {
        return res.status(404).json({ error: 'Workflow not found.' });
      }

      if (item.isTemplate) {
        return res.status(403).json({ error: 'System template workflows cannot be deleted.' });
      }

      // Check ownership
      if (item.userId && (!user || (user.id !== item.userId && user.role !== 'admin'))) {
        return res.status(403).json({ error: 'Unauthorized to delete this workflow.' });
      }

      await workflowsCol.deleteOne({ id });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('Workflow delete error:', err);
      return res.status(500).json({ error: 'Failed to delete workflow.' });
    }
  },
};
