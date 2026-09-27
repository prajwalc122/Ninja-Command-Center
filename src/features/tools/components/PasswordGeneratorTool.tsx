import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, ShieldCheck, KeyRound } from 'lucide-react';

interface Props {
  initialParameters?: { length?: number };
  onRecordHistory?: (result: any) => void;
}

export const PasswordGeneratorTool: React.FC<Props> = ({ initialParameters, onRecordHistory }) => {
  const [length, setLength] = useState<number>(initialParameters?.length || 18);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    let charset = '';
    if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz0123456789';

    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    setPassword(result);
  };

  useEffect(() => {
    generate();
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols]);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (onRecordHistory) {
      onRecordHistory({
        command: `Generated ${length}-character password`,
        toolId: 'password-generator',
        toolName: 'Password Generator',
        status: 'success',
        resultPreview: 'Copied secure cryptographic password to clipboard',
      });
    }
  };

  // Entropy calculation
  let poolSize = 0;
  if (includeUpper) poolSize += 26;
  if (includeLower) poolSize += 26;
  if (includeNumbers) poolSize += 10;
  if (includeSymbols) poolSize += 30;
  const entropy = Math.round(length * Math.log2(Math.max(2, poolSize)));

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-rose-500 text-rose-400';
  if (entropy > 80) {
    strengthLabel = 'Military Grade (Unbreakable)';
    strengthColor = 'bg-emerald-500 text-emerald-400';
  } else if (entropy > 55) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-teal-500 text-teal-400';
  } else if (entropy > 35) {
    strengthLabel = 'Moderate';
    strengthColor = 'bg-amber-500 text-amber-400';
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Password display box */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 flex items-center justify-between gap-3 shadow-xl">
        <div className="font-mono text-lg font-bold text-white tracking-wider break-all select-all">
          {password}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={generate}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title="Generate new password"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Entropy indicator */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Security Entropy: ~{entropy} bits</span>
          <span className={`font-semibold ${strengthColor.split(' ')[1]}`}>{strengthLabel}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${strengthColor.split(' ')[0]} transition-all duration-300`}
            style={{ width: `${Math.min(100, (entropy / 100) * 100)}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-6 space-y-5">
        <div>
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-slate-400 uppercase tracking-wider">Password Length</span>
            <span className="font-mono text-emerald-400 text-sm font-bold">{length} characters</span>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { label: 'Uppercase (A-Z)', val: includeUpper, set: setIncludeUpper },
            { label: 'Lowercase (a-z)', val: includeLower, set: setIncludeLower },
            { label: 'Numbers (0-9)', val: includeNumbers, set: setIncludeNumbers },
            { label: 'Symbols (!@#$%)', val: includeSymbols, set: setIncludeSymbols },
          ].map((item) => (
            <label
              key={item.label}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition text-xs text-slate-300"
            >
              <input
                type="checkbox"
                checked={item.val}
                onChange={(e) => item.set(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
