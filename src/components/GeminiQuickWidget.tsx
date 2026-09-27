import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, Maximize2, Minimize2 } from 'lucide-react';

interface Props {
  onOpenFullAssistant: () => void;
}

export const GeminiQuickWidget: React.FC<Props> = ({ onOpenFullAssistant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'ನಮಸ್ಕಾರ! I am your quick Gemini Assistant. How can I help you right now? (English, ಕನ್ನಡ, Manglish)',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant' as const, content: data.reply || 'No response generated.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant' as const, content: 'Sorry, I encountered a connection error.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Expanded Quick Chat Window */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 h-[460px] rounded-3xl border border-slate-800 bg-[#0d1322] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Gemini Assistant</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400">Google Gemini 3.8 Flash</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullAssistant();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Expand to Full Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="h-5 w-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Sparkles className="w-3 h-3 animate-spin text-emerald-400" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-900/80 flex items-center gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything (Kannada or English)..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-8 w-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-emerald-400/40"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="tracking-wide">Gemini Assistant</span>
      </button>
    </div>
  );
};
