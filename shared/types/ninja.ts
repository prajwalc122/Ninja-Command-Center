export type ToolCategory =
  | 'file'
  | 'text'
  | 'generators'
  | 'calculators'
  | 'developer'
  | 'ai'
  | 'web';

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  detailedDescription: string;
  category: ToolCategory;
  acceptedInputs: ('text' | 'file' | 'number' | 'none')[];
  fileTypes?: string[];
  icon: string;
  badge?: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  faqs?: { question: string; answer: string }[];
  defaultParameters?: Record<string, any>;
  webUrl?: string; // For web action tools (WhatsApp, YouTube, etc.)
}

export interface CommandIntentResult {
  intent: string;
  confidence: number;
  toolId: string;
  parameters: Record<string, any>;
  explanation?: string;
  originalQuery: string;
  needsFile?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  photoURL?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export interface CommandHistoryItem {
  id: string;
  userId?: string;
  command: string;
  toolId: string;
  toolName: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  status: 'success' | 'failed' | 'pending';
  resultPreview?: string;
  executionDurationMs?: number;
  parameters?: Record<string, any>;
  outputData?: any;
}

export interface StoredFile {
  id: string;
  userId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  downloadUrl: string;
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  stepId: string;
  toolId: string;
  title: string;
  parameters?: Record<string, any>;
}

export interface Workflow {
  id: string;
  userId?: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isTemplate?: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalCommands: number;
  totalFilesProcessed: number;
  storageUsedBytes: number;
  toolUsageCounts: Record<string, number>;
  aiRequestsCount: number;
  uptime: number;
  recentActivity: CommandHistoryItem[];
  securityLogs?: Array<{
    timestamp: string;
    eventType: string;
    ip: string;
    email?: string;
    details?: Record<string, any>;
  }>;
  systemHealth: {
    status: 'healthy' | 'degraded' | 'error';
    database: string;
    geminiApi: string;
    fileStorage: string;
    memoryUsageMB: number;
  };
}
