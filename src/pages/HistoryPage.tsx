import React, { useState, useEffect } from 'react';
import { CommandHistoryItem } from '@/shared/types/ninja';
import { History, Play, Trash2, CheckCircle2, Clock, Terminal } from 'lucide-react';

interface Props {
  onRerunCommand: (cmd: string) => void;
}

export const HistoryPage: React.FC<Props> = ({ onRerunCommand }) => {
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error('Failed to delete history item:', e);
    }
  };

  const handleClearAll = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  // Group by Today / Earlier
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const todayItems = history.filter((h) => isToday(h.createdAt || h.timestamp));
  const earlierItems = history.filter((h) => !isToday(h.createdAt || h.timestamp));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Command History</h1>
          </div>
          <p className="text-xs text-slate-400">
            Review past executions, query routing results, and rerun actions with one click.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading command logs...</div>
      ) : history.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-slate-800 bg-[#0d1322] space-y-3">
          <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No command history recorded yet</h3>
          <p className="text-xs text-slate-500">
            Execute actions from the home command center to populate your activity log.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today Group */}
          {todayItems.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block font-mono">
                Today
              </span>
              <div className="rounded-2xl border border-slate-800 bg-[#0d1322] divide-y divide-slate-800/80 overflow-hidden">
                {todayItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white truncate max-w-sm sm:max-w-md">
                          "{item.command}"
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          {item.toolName}
                        </span>
                      </div>
                      {item.resultPreview && (
                        <p className="text-xs text-slate-400 truncate max-w-lg">{item.resultPreview}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt || item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <button
                        onClick={() => onRerunCommand(item.command)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition cursor-pointer"
                        title="Rerun command"
                      >
                        <Play className="w-3 h-3 fill-slate-200" />
                        <span>Run Again</span>
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earlier Group */}
          {earlierItems.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                Earlier
              </span>
              <div className="rounded-2xl border border-slate-800 bg-[#0d1322] divide-y divide-slate-800/80 overflow-hidden">
                {earlierItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white truncate max-w-sm sm:max-w-md">
                          "{item.command}"
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          {item.toolName}
                        </span>
                      </div>
                      {item.resultPreview && (
                        <p className="text-xs text-slate-400 truncate max-w-lg">{item.resultPreview}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(item.createdAt || item.timestamp).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => onRerunCommand(item.command)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-slate-200" />
                        <span>Run Again</span>
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
