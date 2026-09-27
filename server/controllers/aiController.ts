import { Request, Response } from 'express';
import { geminiService } from '../services/geminiService';
import { db } from '../config/db';

export const aiController = {
  async interpretCommand(req: Request, res: Response) {
    try {
      const { command, fileInfo } = req.body;
      if (!command || typeof command !== 'string' || !command.trim()) {
        return res.status(400).json({ error: 'Command text is required.' });
      }

      const result = await geminiService.interpretCommand(command.trim(), fileInfo);

      // Increment tool usage stats
      try {
        const statsCol = db.collection('usageStats');
        const existing = await statsCol.findOne({ id: 'global_stats' });
        const usageCounts = existing?.toolUsageCounts || {};
        usageCounts[result.toolId] = (usageCounts[result.toolId] || 0) + 1;

        if (existing) {
          await statsCol.updateOne(
            { id: 'global_stats' },
            {
              totalCommands: (existing.totalCommands || 0) + 1,
              toolUsageCounts: usageCounts,
              aiRequestsCount: (existing.aiRequestsCount || 0) + 1,
            }
          );
        } else {
          await statsCol.insertOne({
            id: 'global_stats',
            totalCommands: 1,
            toolUsageCounts: usageCounts,
            aiRequestsCount: 1,
          });
        }
      } catch (statErr) {
        console.warn('Stat tracking warning:', statErr);
      }

      return res.json(result);
    } catch (err: any) {
      console.error('Command interpretation error:', err);
      return res.status(500).json({ error: 'Could not interpret command. Please try again.' });
    }
  },

  async summarize(req: Request, res: Response) {
    try {
      const { text, format } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content is required for summarization.' });
      }

      const summary = await geminiService.summarize(text, format || 'bullets');
      return res.json({ summary });
    } catch (err: any) {
      console.error('Summarize error:', err);
      return res.status(500).json({ error: 'Failed to summarize text.' });
    }
  },

  async translate(req: Request, res: Response) {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Text and targetLanguage are required.' });
      }

      const translation = await geminiService.translate(text, targetLanguage);
      return res.json({ translation, targetLanguage });
    } catch (err: any) {
      console.error('Translate error:', err);
      return res.status(500).json({ error: 'Translation failed.' });
    }
  },

  async rewrite(req: Request, res: Response) {
    try {
      const { text, tone } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required.' });
      }

      const rewritten = await geminiService.rewrite(text, tone || 'professional');
      return res.json({ rewritten, tone });
    } catch (err: any) {
      console.error('Rewrite error:', err);
      return res.status(500).json({ error: 'Rewrite failed.' });
    }
  },

  async generateResume(req: Request, res: Response) {
    try {
      const { name, role, skills, experience } = req.body;
      const resume = await geminiService.generateResume({ name, role, skills, experience });
      return res.json({ resume });
    } catch (err: any) {
      console.error('Resume builder error:', err);
      return res.status(500).json({ error: 'Failed to generate resume.' });
    }
  },

  async chat(req: Request, res: Response) {
    try {
      const { messages, userMessage, systemPrompt } = req.body;
      let messageList: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      if (Array.isArray(messages) && messages.length > 0) {
        messageList = messages;
      } else if (userMessage) {
        messageList = [{ role: 'user', content: String(userMessage) }];
      } else {
        return res.status(400).json({ error: 'messages array or userMessage string is required.' });
      }

      const reply = await geminiService.chat(messageList, systemPrompt);
      return res.json({ reply });
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      return res.status(500).json({ error: 'Failed to communicate with Gemini Assistant.' });
    }
  },
};
