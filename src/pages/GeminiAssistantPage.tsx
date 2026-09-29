import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  ArrowRight,
  RefreshCw,
  Languages,
  Zap,
  Code,
  FileText,
  Calculator,
  Globe,
  ExternalLink,
  MapPin,
  Navigation,
  Compass,
  Cpu,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserProfile } from '@/shared/types/ninja';

export interface MapsPlaceItem {
  title: string;
  uri: string;
  text?: string;
  placeId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; url: string }>;
  searchQueries?: string[];
  mapsPlaces?: MapsPlaceItem[];
  grounded?: boolean;
  groundingType?: 'maps' | 'search' | 'none';
  modelUsed?: string;
  roleUsed?: string;
  timestamp: string;
}

export type ChatbotRole = 'maps_guide' | 'general' | 'coder' | 'fast';
export type GeminiModel = 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';

interface Props {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSelectTool: (toolId: string) => void;
}

const ROLE_DEFINITIONS: Record<
  ChatbotRole,
  {
    name: string;
    description: string;
    model: GeminiModel;
    icon: any;
    color: string;
    defaultSystemInstruction: string;
  }
> = {
  maps_guide: {
    name: 'Google Maps Local Guide',
    description: 'Accurate geospatial navigation, landmarks, restaurants & places powered by Google Maps Grounding',
    model: 'gemini-3.5-flash',
    icon: MapPin,
    color: '#34A853',
    defaultSystemInstruction:
      'You are NINJA Maps Navigator & Geospatial Intelligence Specialist. You are powered by Gemini 3.5 Flash with Google Maps Grounding. Provide up-to-date, accurate location-based answers. When users ask for places, restaurants, cafes, attractions, routes, landmarks, or addresses (e.g. in Bengaluru, New York, Tokyo, or any city worldwide), pinpoint exact venues, addresses, operating details, and how to get there. Support multilingual inquiries including Kannada (ಕನ್ನಡ), English, and Hindi. Format recommendations with clean bold titles and bulleted highlights.',
  },
  general: {
    name: 'General Assistant',
    description: 'Everyday Q&A, research, writing, calculations & multilingual assistance',
    model: 'gemini-3.5-flash',
    icon: Sparkles,
    color: '#10B981',
    defaultSystemInstruction:
      'You are NINJA Gemini Assistant, the central intelligence of NINJA Personal Web Command Center. You are powered by Gemini 3.5 Flash with live Google Grounding. You are articulate, helpful, highly capable, and multilingual (fluent in Kannada ಕನ್ನಡ, Manglish, English, Hindi). You assist with research, writing, calculations, tool navigation, and daily productivity.',
  },
  coder: {
    name: 'Senior Systems Architect',
    description: 'Particularly complex engineering, software architecture, algorithm design & deep debugging',
    model: 'gemini-3.1-pro-preview',
    icon: Cpu,
    color: '#8B5CF6',
    defaultSystemInstruction:
      'You are NINJA Senior Systems Architect & Lead Software Engineer. You are powered by Gemini 3.1 Pro Preview for complex engineering, algorithmic, and architectural challenges. Deliver production-grade, performant, elegant code (TypeScript, Python, React, Go, Rust, SQL) with clean architecture, error handling, and concise explanations.',
  },
  fast: {
    name: 'Speed Specialist',
    description: 'Sub-second, low-latency productivity, rapid summaries & quick answers',
    model: 'gemini-3.1-flash-lite',
    icon: Zap,
    color: '#F59E0B',
    defaultSystemInstruction:
      'You are NINJA Speed Specialist, powered by Gemini 3.1 Flash-Lite. You are optimized for sub-second, low-latency productivity. Deliver crisp, direct, highly focused answers without fluff.',
  },
};

export const GeminiAssistantPage: React.FC<Props> = ({
  user,
  onOpenAuth,
  onSelectTool,
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatbotRole>('maps_guide');
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-3.5-flash');
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>(
    ROLE_DEFINITIONS.maps_guide.defaultSystemInstruction
  );
  const [showPromptConfig, setShowPromptConfig] = useState(false);
  const [enableMapsGrounding, setEnableMapsGrounding] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `ನಮಸ್ಕಾರ! Welcome to **NINJA Gemini Multi-Turn Assistant** 🌟

I am equipped with **Google Maps Grounding** and multi-model intelligence:
• 🗺️ **Google Maps Grounding** (\`gemini-3.5-flash\` with \`googleMaps\` tool): Ask for places, cafes, landmarks, directions, and locations worldwide.
• 🧠 **Complex Tasks** (\`gemini-3.1-pro-preview\`): Deep reasoning, algorithms, and system design.
• ⚡ **Fast Tasks** (\`gemini-3.1-flash-lite\`): High-speed, instant responses.
• 🌐 **Multilingual Support**: Fluent in **English, ಕನ್ನಡ (Kannada), Manglish, and Hindi**.

Select a chatbot role above or ask me about any place or topic!`,
      grounded: true,
      groundingType: 'maps',
      modelUsed: 'gemini-3.5-flash',
      roleUsed: 'maps_guide',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update default system prompt and model when role changes
  const handleRoleChange = (role: ChatbotRole) => {
    setSelectedRole(role);
    const def = ROLE_DEFINITIONS[role];
    setSelectedModel(def.model);
    setCustomSystemPrompt(def.defaultSystemInstruction);
    if (role === 'maps_guide') {
      setEnableMapsGrounding(true);
    }
  };

  const suggestedPrompts = [
    {
      label: '🗺️ Bengaluru Historic Landmarks (Maps)',
      prompt: 'What are the top 4 historic landmarks and botanical gardens in Bengaluru? Include locations and highlights with Google Maps grounding.',
      role: 'maps_guide' as ChatbotRole,
    },
    {
      label: '☕ Cafes near Indiranagar (Maps)',
      prompt: 'Find the best specialty coffee roasters and rooftop cafes in Indiranagar, Bengaluru with their addresses.',
      role: 'maps_guide' as ChatbotRole,
    },
    {
      label: '🧠 Architect Scalable Cache (Pro)',
      prompt: 'Architect a production-ready TypeScript React debounce hook with immediate flush and memory-safe cleanup.',
      role: 'coder' as ChatbotRole,
    },
    {
      label: '⚡ Concurrency vs Parallelism (Lite)',
      prompt: 'Explain the difference between Concurrency and Parallelism in exactly 2 bullet points.',
      role: 'fast' as ChatbotRole,
    },
    {
      label: '🌺 ಕನ್ನಡದಲ್ಲಿ ಮೈಸೂರು ಮಾಹಿತಿ (Maps)',
      prompt: 'ಮೈಸೂರಿನ ಪ್ರಮುಖ ಪ್ರವಾಸಿ ತಾಣಗಳು ಮತ್ತು ಅರಮನೆಯ ಇತಿಹಾಸವನ್ನು ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ವಿವರಗಳೊಂದಿಗೆ ತಿಳಿಸಿ.',
      role: 'maps_guide' as ChatbotRole,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string, overrideRole?: ChatbotRole) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const roleToUse = overrideRole || selectedRole;
    if (overrideRole && overrideRole !== selectedRole) {
      handleRoleChange(overrideRole);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation payload preserving multi-turn thread
      const historyPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          model: selectedModel,
          role: roleToUse,
          systemPrompt: customSystemPrompt,
          enableMaps: enableMapsGrounding || roleToUse === 'maps_guide',
        }),
      });

      const data = await res.json();
      const replyText = data.reply || 'No response generated.';

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        sources: data.sources || [],
        searchQueries: data.searchQueries || [],
        mapsPlaces: data.mapsPlaces || [],
        grounded: data.grounded || false,
        groundingType: data.groundingType || 'none',
        modelUsed: data.modelUsed || selectedModel,
        roleUsed: data.roleUsed || roleToUse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      const errorMsg: Message = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content:
          '⚠️ Connection interrupted. Reconnecting to NINJA Gemini engine...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-fresh',
        role: 'assistant',
        content: `Conversation refreshed. I am ready in **${ROLE_DEFINITIONS[selectedRole].name}** mode. What would you like to explore?`,
        grounded: enableMapsGrounding,
        groundingType: enableMapsGrounding ? 'maps' : 'none',
        modelUsed: selectedModel,
        roleUsed: selectedRole,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render markdown structure
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-emerald-400 text-base mt-3 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-white text-lg mt-4 mb-1">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h2 key={idx} className="font-extrabold text-white text-xl mt-4 mb-2">
                {line.replace('# ', '')}
              </h2>
            );
          }
          if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
            const bulletText = line.trim().replace(/^[•-]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-400 font-bold shrink-0">•</span>
                <span>{renderInlineStyles(bulletText)}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-400 font-semibold shrink-0">
                  {line.trim().match(/^\d+\./)?.[0]}
                </span>
                <span>{renderInlineStyles(line.trim().replace(/^\d+\.\s*/, ''))}</span>
              </div>
            );
          }
          if (line.trim().startsWith('```')) {
            return null;
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-xs border border-slate-700/60">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Role & Model Header Bar */}
      <div className="rounded-3xl border border-slate-800 bg-[#0d1322]/95 backdrop-blur-xl p-4 sm:p-5 mb-4 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  NINJA Gemini Multi-Turn Chatbot
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Maps Grounded
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Persona-driven conversations with Google Maps & Search Grounding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptConfig(!showPromptConfig)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                showPromptConfig
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
              title="Configure system instruction"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Role Prompt</span>
              {showPromptConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition cursor-pointer"
              title="Clear conversation thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Chatbot Persona Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(ROLE_DEFINITIONS) as ChatbotRole[]).map((rKey) => {
            const def = ROLE_DEFINITIONS[rKey];
            const Icon = def.icon;
            const isSelected = selectedRole === rKey;
            return (
              <button
                key={rKey}
                onClick={() => handleRoleChange(rKey)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/30'
                    : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className="h-7 w-7 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${def.color}20`, color: def.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {def.model}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">{def.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{def.description}</div>
              </button>
            );
          })}
        </div>

        {/* Collapsible System Instruction Editor */}
        {showPromptConfig && (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                System Instruction for "{ROLE_DEFINITIONS[selectedRole].name}"
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as GeminiModel)}
                  className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (General & Maps)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
                </select>
              </div>
            </div>

            <textarea
              rows={3}
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono resize-none"
              placeholder="Provide a custom system instruction to customize the chatbot's role and behavior..."
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setCustomSystemPrompt(ROLE_DEFINITIONS[selectedRole].defaultSystemInstruction)}
                className="text-emerald-400 hover:underline"
              >
                Reset to Role Default
              </button>
              <span>Takes effect on your next message</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Stream (Scrollable Thread) */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                {msg.groundingType === 'maps' ? (
                  <MapPin className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            )}

            <div
              className={`group relative max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-md ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-900/95 text-slate-200 border border-slate-800/90 rounded-tl-none'
              }`}
            >
              {/* Message Header with Model and Grounding Indicator */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800/60 text-[10px] font-mono text-slate-400">
                  <span className="text-emerald-400 font-semibold">
                    {msg.roleUsed === 'maps_guide' ? 'Google Maps Navigator' : msg.roleUsed === 'coder' ? 'Senior Architect' : 'Gemini AI'}
                  </span>
                  <span>•</span>
                  <span className="text-slate-500">{msg.modelUsed || 'gemini-3.5-flash'}</span>
                  {msg.groundingType === 'maps' && (
                    <span className="ml-auto inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <MapPin className="w-2.5 h-2.5" />
                      Maps Grounded
                    </span>
                  )}
                </div>
              )}

              {renderMessageContent(msg.content)}

              {/* Google Maps Grounded Places Cards */}
              {msg.mapsPlaces && msg.mapsPlaces.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/70 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Locations & Google Maps Places:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.mapsPlaces.map((place, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-emerald-500/40 transition space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-xs text-white line-clamp-1">
                            {place.title}
                          </div>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                            Place
                          </span>
                        </div>

                        {place.text && (
                          <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {place.text}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/40">
                          <a
                            href={place.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-semibold transition"
                          >
                            <Navigation className="w-3 h-3 text-emerald-400" />
                            <span>View on Maps</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                          >
                            <Compass className="w-3 h-3 text-blue-400" />
                            <span>Directions</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Web Search Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-400">
                    <Globe className="w-3 h-3" />
                    <span>Sources from Google Search:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700/60 transition"
                      >
                        <span className="truncate max-w-[200px]">{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer details */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/40 text-[10px] text-slate-400">
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.content, msg.id)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="h-8 w-8 rounded-xl object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
            <div className="rounded-2xl p-4 bg-slate-900/90 border border-slate-800 rounded-tl-none flex items-center gap-2 text-slate-400 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-75" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-150" />
              <span className="ml-1 text-slate-400">
                {selectedRole === 'maps_guide'
                  ? 'Retrieving Google Maps data & places...'
                  : selectedRole === 'coder'
                  ? 'Gemini 3.1 Pro is reasoning & architecting...'
                  : 'Gemini is generating response...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length <= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          {suggestedPrompts.slice(0, 3).map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.prompt, item.role)}
              disabled={loading}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 text-left transition cursor-pointer group"
            >
              <div className="flex-1 truncate">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition truncate">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {item.prompt}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 rounded-2xl border border-slate-800 bg-[#0d1322] shadow-2xl relative">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedRole === 'maps_guide'
                ? 'Ask for locations, cafes, landmarks, directions... (e.g. "Where is Lalbagh Garden in Bengaluru?")'
                : selectedRole === 'coder'
                ? 'Ask for system design, algorithms, debugging, code... (e.g. "Write a debounce hook")'
                : 'Ask Gemini anything... (English, ಕನ್ನಡ, ಅಥವಾ Manglish ನಲ್ಲಿ ಕೇಳಿ)'
            }
            className="flex-1 max-h-32 min-h-[44px] p-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/80 resize-none font-sans placeholder:text-slate-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500 font-mono">
          <span>Active Role: <strong className="text-emerald-400">{ROLE_DEFINITIONS[selectedRole].name}</strong> ({selectedModel})</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Google Maps Grounding Enabled
          </span>
        </div>
      </div>
    </div>
  );
};
