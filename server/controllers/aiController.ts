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

      // Input length limit
      const sanitizedCommand = command.trim().slice(0, 500);
      const result = await geminiService.interpretCommand(sanitizedCommand, fileInfo);

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

      const sanitizedText = text.slice(0, 25000);
      const summary = await geminiService.summarize(sanitizedText, format || 'bullets');
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

      const sanitizedText = String(text).slice(0, 25000);
      const sanitizedLang = String(targetLanguage).slice(0, 50);
      const translation = await geminiService.translate(sanitizedText, sanitizedLang);
      return res.json({ translation, targetLanguage: sanitizedLang });
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

      const sanitizedText = String(text).slice(0, 25000);
      const validTones = ['casual', 'concise', 'persuasive', 'professional'] as const;
      const selectedTone = validTones.includes(tone) ? tone : 'professional';
      const rewritten = await geminiService.rewrite(sanitizedText, selectedTone);
      return res.json({ rewritten, tone: selectedTone });
    } catch (err: any) {
      console.error('Rewrite error:', err);
      return res.status(500).json({ error: 'Rewrite failed.' });
    }
  },

  async generateResume(req: Request, res: Response) {
    try {
      const { name, role, skills, experience } = req.body;
      const resume = await geminiService.generateResume({
        name: typeof name === 'string' ? name.slice(0, 100) : '',
        role: typeof role === 'string' ? role.slice(0, 100) : '',
        skills: typeof skills === 'string' ? skills.slice(0, 2000) : '',
        experience: typeof experience === 'string' ? experience.slice(0, 5000) : '',
      });
      return res.json({ resume });
    } catch (err: any) {
      console.error('Resume builder error:', err);
      return res.status(500).json({ error: 'Failed to generate resume.' });
    }
  },

  async chat(req: Request, res: Response) {
    try {
      const { messages, userMessage, systemPrompt, model, role, enableMaps } = req.body;
      let messageList: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      if (Array.isArray(messages) && messages.length > 0) {
        // Enforce maximum 25 turns in conversation history and max 4000 chars per message
        messageList = messages.slice(-25).map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: typeof m.content === 'string' ? m.content.slice(0, 4000) : '',
        }));
      } else if (userMessage) {
        messageList = [{ role: 'user', content: String(userMessage).slice(0, 4000) }];
      } else {
        return res.status(400).json({ error: 'messages array or userMessage string is required.' });
      }

      const result = await geminiService.chat(messageList, {
        model,
        role,
        customSystemInstruction: typeof systemPrompt === 'string' ? systemPrompt.slice(0, 2000) : undefined,
        enableMaps: Boolean(enableMaps),
      });

      return res.json({
        reply: result.reply,
        sources: result.sources || [],
        searchQueries: result.searchQueries || [],
        mapsPlaces: result.mapsPlaces || [],
        grounded: result.grounded || false,
        groundingType: result.groundingType || 'none',
        modelUsed: result.modelUsed,
        roleUsed: result.roleUsed,
      });
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      return res.status(500).json({ error: 'Failed to communicate with Gemini Assistant.' });
    }
  },
};
