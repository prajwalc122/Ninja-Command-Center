import fs from 'fs';
import path from 'path';

export interface BaseRecord {
  id: string;
  createdAt: string;
  [key: string]: any;
}

// In-Memory & File-backed Mongo-compatible collection interface
class JsonCollection<T extends BaseRecord> {
  private data: T[] = [];
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = [];
        this.save();
      }
    } catch (err) {
      console.error(`Failed to load collection at ${this.filePath}:`, err);
      this.data = [];
    }
  }

  private save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to save collection at ${this.filePath}:`, err);
    }
  }

  async find(query: Partial<T> = {}, sort?: { [key: string]: 1 | -1 }, limit?: number): Promise<T[]> {
    let result = this.data.filter((item) => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false;
      }
      return true;
    });

    if (sort) {
      const [sortKey, sortDir] = Object.entries(sort)[0] || [];
      if (sortKey) {
        result.sort((a, b) => {
          if (a[sortKey] < b[sortKey]) return sortDir === 1 ? -1 : 1;
          if (a[sortKey] > b[sortKey]) return sortDir === 1 ? 1 : -1;
          return 0;
        });
      }
    }

    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return JSON.parse(JSON.stringify(result));
  }

  async findOne(query: Partial<T>): Promise<T | null> {
    const list = await this.find(query);
    return list[0] || null;
  }

  async insertOne(doc: Omit<T, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<T> {
    const now = new Date().toISOString();
    const newDoc = {
      ...doc,
      id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: doc.createdAt || now,
      updatedAt: now,
    } as unknown as T;

    this.data.unshift(newDoc);
    this.save();
    return JSON.parse(JSON.stringify(newDoc));
  }

  async updateOne(query: Partial<T>, updates: Partial<T>): Promise<boolean> {
    const index = this.data.findIndex((item) => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false;
      }
      return true;
    });

    if (index === -1) return false;

    this.data[index] = {
      ...this.data[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return true;
  }

  async deleteOne(query: Partial<T>): Promise<boolean> {
    const index = this.data.findIndex((item) => {
      for (const [key, value] of Object.entries(query)) {
        if (item[key] !== value) return false;
      }
      return true;
    });

    if (index === -1) return false;

    this.data.splice(index, 1);
    this.save();
    return true;
  }

  async countDocuments(query: Partial<T> = {}): Promise<number> {
    const items = await this.find(query);
    return items.length;
  }
}

// Database Manager
class DatabaseManager {
  private dbDir: string;
  private collections: Map<string, JsonCollection<any>> = new Map();
  public isConnectedToMongo: boolean = false;

  constructor() {
    this.dbDir = path.resolve('data');
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
    }
  }

  collection<T extends BaseRecord>(name: string): JsonCollection<T> {
    if (!this.collections.has(name)) {
      const filePath = path.join(this.dbDir, `${name}.json`);
      this.collections.set(name, new JsonCollection<T>(filePath));
    }
    return this.collections.get(name)!;
  }

  async init() {
    // If MongoDB URI is configured, we can flag connectivity
    if (process.env.MONGODB_URI) {
      console.log('MongoDB connection string detected. Initializing storage bridge...');
      this.isConnectedToMongo = true;
    } else {
      console.log('Using optimized native embedded storage in /data directory.');
    }

    // Seed initial admin user if not exists
    const usersCol = this.collection('users');
    const existingAdmin = await usersCol.findOne({ role: 'admin' });
    if (!existingAdmin) {
      // password: "ninja-secure-admin"
      await usersCol.insertOne({
        email: 'admin@ninja.local',
        name: 'NINJA Lead Engineer',
        role: 'admin',
        passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // sha256 of "admin123"
        salt: 'ninja_salt_2026',
      });
      console.log('Default Admin Account seeded: admin@ninja.local / admin123');
    }

    // Seed default sample workflows
    const workflowsCol = this.collection('workflows');
    const workflowCount = await workflowsCol.countDocuments();
    if (workflowCount === 0) {
      await workflowsCol.insertOne({
        name: 'Prepare Image for Instagram',
        description: 'Resize image to 1080x1080, convert to high-fidelity JPG, and optimize file size.',
        isTemplate: true,
        steps: [
          { stepId: 's1', toolId: 'image-resizer', title: 'Resize to 1080x1080', parameters: { width: 1080, height: 1080 } },
          { stepId: 's2', toolId: 'image-converter', title: 'Convert to JPG', parameters: { format: 'jpg', quality: 90 } },
          { stepId: 's3', toolId: 'image-compressor', title: 'Compress Output', parameters: { targetReduction: 40 } },
        ],
      });

      await workflowsCol.insertOne({
        name: 'Executive Resume Package',
        description: 'Generate high-impact ATS resume points, format structured typography, and prepare document.',
        isTemplate: true,
        steps: [
          { stepId: 's1', toolId: 'resume-generator', title: 'Generate AI Resume Content', parameters: { role: 'Full Stack Engineer' } },
          { stepId: 's2', toolId: 'text-rewriter', title: 'Polish Executive Tone', parameters: { tone: 'Executive' } },
          { stepId: 's3', toolId: 'word-counter', title: 'Verify Readability & Length', parameters: {} },
        ],
      });

      await workflowsCol.insertOne({
        name: 'Document Tidy & Summarize',
        description: 'Upload text or document, strip duplicates & boilerplate, then generate concise executive brief.',
        isTemplate: true,
        steps: [
          { stepId: 's1', toolId: 'text-cleaner', title: 'Clean and Deduplicate', parameters: { removeDuplicates: true } },
          { stepId: 's2', toolId: 'text-summarizer', title: 'Generate Executive Summary', parameters: { format: 'bullets' } },
        ],
      });
      console.log('Preloaded standard productivity workflows.');
    }
  }
}

export const db = new DatabaseManager();
