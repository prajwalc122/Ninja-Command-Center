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
} from 'lucide-react';
import { UserProfile } from '@/shared/types/ninja';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Props {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSelectTool: (toolId: string) => void;
}

export const GeminiAssistantPage: React.FC<Props> = ({
  user,
  onOpenAuth,
  onSelectTool,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `ನಮಸ್ಕಾರ! Welcome to **NINJA Gemini Assistant** 🌟

I am your personal AI assistant powered by **Google Gemini 3.8 Flash**. I can help you in **English, ಕನ್ನಡ (Kannada), Manglish, and Hindi**.

Here is what you can ask me:
• 🧠 **General Knowledge & Science**: Ask anything from physics to history.
• 💻 **Code & Debugging**: Write Python scripts, React hooks, SQL queries, or fix bugs.
• 🛠️ **NINJA Tools**: Ask how to compress PDFs, generate QR codes, calculate EMI, or resize images.
• ✍️ **Writing & Translation**: Draft professional emails, translate languages, or summarize complex articles.

What would you like to explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedPrompts = [
    {
      label: 'ಕನ್ನಡದಲ್ಲಿ ಕಥೆ ಅಥವಾ ಕವಿತೆ',
      prompt: 'ಕನ್ನಡದಲ್ಲಿ ಪ್ರಕೃತಿ ಮತ್ತು ತಂತ್ರಜ್ಞಾನದ ಬಗ್ಗೆ ಒಂದು ಸುಂದರ ಕವಿತೆ ಅಥವಾ ಚಿಕ್ಕ ಕಥೆ ಬರೆಯಿರಿ.',
      icon: Languages,
    },
    {
      label: 'Code a React Custom Hook',
      prompt: 'Write a production-ready TypeScript React custom hook for debouncing an input value with cleanup.',
      icon: Code,
    },
    {
      label: 'Explain EMI Formula',
      prompt: 'Explain how home loan EMI is calculated with the mathematical formula and an example of ₹50,00,000 at 8.5% for 20 years.',
      icon: Calculator,
    },
    {
      label: 'Compress PDF in NINJA',
      prompt: 'How do I compress a large PDF file inside NINJA command center and what are the best settings?',
      icon: FileText,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

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
      const historyPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || 'No response generated.';

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      const errorMsg: Message = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Unable to connect to Gemini Assistant right now. Please check your internet connection and try again.',
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
        content: `Conversation cleared. How can I help you today? (English, ಕನ್ನಡ, ಅಥವಾ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ!)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render formatted markdown
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          // Headers
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

          // Bullet points
          if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
            const bulletText = line.trim().replace(/^[•-]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-emerald-400 font-bold shrink-0">•</span>
                <span>{renderInlineStyles(bulletText)}</span>
              </div>
            );
          }

          // Numbered list
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

          // Code block markers
          if (line.trim().startsWith('```')) {
            return null; // Handle code separately or render as block
          }

          // Standard paragraph
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (text: string) => {
    // Quick regex inline bolding and code
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
      {/* Top Header Card */}
      <div className="flex items-center justify-between p-4 mb-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0d1322] to-slate-900/90 border border-slate-800/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/10">
            <div className="h-full w-full rounded-[10px] bg-[#090d16] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                NINJA Gemini Assistant
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multilingual AI Assistant • Fluent in ಕನ್ನಡ, English & Hindi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div
              className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-md ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none'
              }`}
            >
              {renderMessageContent(msg.content)}

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
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            </div>
            <div className="rounded-2xl p-4 bg-slate-900/90 border border-slate-800 rounded-tl-none flex items-center gap-2 text-slate-400 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-75" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-150" />
              <span className="ml-1 text-slate-400">Gemini is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (when only 1 or 2 messages) */}
      {messages.length <= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {suggestedPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                disabled={loading}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 text-left transition cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {item.prompt}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition shrink-0" />
              </button>
            );
          })}
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
            placeholder="Ask Gemini anything... (English, ಕನ್ನಡ, ಅಥವಾ Manglish ನಲ್ಲಿ ಕೇಳಿ)"
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
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Gemini Online
          </span>
        </div>
      </div>
    </div>
  );
};
