import React, { useState } from 'react';
import { Briefcase, Copy, Check, Download, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  onRecordHistory?: (result: any) => void;
}

export const ResumeGeneratorTool: React.FC<Props> = ({ onRecordHistory }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Full Stack Software Engineer');
  const [skills, setSkills] = useState('TypeScript, React, Node.js, Express, MongoDB, Tailwind CSS, System Architecture');
  const [experience, setExperience] = useState('Built personal command center web application with sub-second command routing. Optimized file processing workflows saving 70% storage.');
  const [resume, setResume] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Software Engineer',
          role: role.trim(),
          skills: skills.trim(),
          experience: experience.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate resume.');
      }

      setResume(data.resume);

      if (onRecordHistory) {
        onRecordHistory({
          command: `Generated resume for ${role}`,
          toolId: 'resume-generator',
          toolName: 'AI Resume Architect',
          status: 'success',
          resultPreview: `Generated ATS resume package for ${role}`,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error generating resume.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!resume) return;
    navigator.clipboard.writeText(resume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!resume) return;
    const blob = new Blob([resume], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${(name || 'candidate').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Form Inputs */}
        <div className="md:col-span-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Candidate Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Job Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Frontend Architect"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Key Technical Skills & Tools
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Node.js, GraphQL, PostgreSQL..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Core Achievements & Experience Notes
            </label>
            <textarea
              rows={4}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Rough bullet points or highlights of your work..."
              className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Crafting ATS Resume with Gemini...</span>
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4" />
                <span>Generate ATS Resume</span>
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="md:col-span-6 rounded-2xl border border-slate-800 bg-[#0d1322] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resume Preview</h4>
            {resume && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy MD'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>

          <div className="min-h-[300px] max-h-[420px] overflow-y-auto text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap p-2">
            {resume || (
              <div className="h-[280px] flex items-center justify-center text-slate-500 text-center italic font-sans text-xs">
                Fill details on the left and click 'Generate ATS Resume'.
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
