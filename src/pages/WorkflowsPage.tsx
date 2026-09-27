import React, { useState, useEffect } from 'react';
import { Workflow, WorkflowStep } from '@/shared/types/ninja';
import { TOOLS } from '@/shared/constants/tools';
import { GitFork, ArrowRight, Play, CheckCircle2, Plus, Trash2, Layers } from 'lucide-react';

interface Props {
  onExecuteTool: (toolId: string, params?: Record<string, any>) => void;
  onRecordHistory: (record: any) => void;
}

export const WorkflowsPage: React.FC<Props> = ({ onExecuteTool, onRecordHistory }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Create workflow modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [selectedSteps, setSelectedSteps] = useState<string[]>(['image-resizer', 'image-converter']);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      if (data.workflows) {
        setWorkflows(data.workflows);
        if (data.workflows.length > 0 && !selectedWorkflow) {
          setSelectedWorkflow(data.workflows[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load workflows:', e);
    }
  };

  const handleStartWorkflow = (wf: Workflow) => {
    setSelectedWorkflow(wf);
    setActiveStepIndex(0);
    setCompletedSteps([]);
    setIsRunning(true);
  };

  const handleNextStep = () => {
    if (!selectedWorkflow) return;
    const currentStep = selectedWorkflow.steps[activeStepIndex];
    setCompletedSteps((prev) => [...prev, currentStep.stepId]);

    if (activeStepIndex + 1 < selectedWorkflow.steps.length) {
      setActiveStepIndex((prev) => prev + 1);
    } else {
      setIsRunning(false);
      onRecordHistory({
        command: `Completed Workflow: ${selectedWorkflow.name}`,
        toolId: 'workflow-runner',
        toolName: 'Workflow Automation',
        status: 'success',
        resultPreview: `Finished all ${selectedWorkflow.steps.length} sequential operations`,
      });
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim() || selectedSteps.length === 0) return;

    try {
      const stepsPayload: WorkflowStep[] = selectedSteps.map((tid, idx) => {
        const t = TOOLS.find((item) => item.id === tid);
        return {
          stepId: `step_${idx + 1}`,
          toolId: tid,
          title: t?.name || tid,
        };
      });

      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWorkflowName.trim(),
          description: newWorkflowDesc.trim() || 'Custom automated workflow sequence',
          steps: stepsPayload,
        }),
      });

      const data = await res.json();
      if (data.workflow) {
        setWorkflows((prev) => [data.workflow, ...prev]);
        setSelectedWorkflow(data.workflow);
        setShowCreateModal(false);
        setNewWorkflowName('');
        setNewWorkflowDesc('');
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold mb-2">
            <GitFork className="w-3.5 h-3.5" />
            <span>NINJA Pipelines</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Automated Workflows</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Chain multiple discrete utilities together into automated sequences.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Create Workflow</span>
        </button>
      </div>

      {/* Main Workflow Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Workflow List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Available Workflows
          </span>
          {workflows.map((wf) => {
            const isSelected = selectedWorkflow?.id === wf.id;
            return (
              <div
                key={wf.id}
                onClick={() => {
                  setSelectedWorkflow(wf);
                  setActiveStepIndex(0);
                  setCompletedSteps([]);
                  setIsRunning(false);
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500/50 bg-[#0f172a] shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800 bg-[#0d1322] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{wf.name}</h4>
                  {wf.isTemplate && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      Preset
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {wf.description}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-[11px] font-mono text-emerald-400">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{wf.steps.length} sequential steps</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Visual Pipeline & Execution Stage */}
        <div className="lg:col-span-8 space-y-6">
          {selectedWorkflow ? (
            <div className="rounded-3xl border border-slate-800 bg-[#0d1322] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedWorkflow.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{selectedWorkflow.description}</p>
                </div>

                <button
                  onClick={() => handleStartWorkflow(selectedWorkflow)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition cursor-pointer shadow-lg shadow-emerald-500/10 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Run Workflow</span>
                </button>
              </div>

              {/* Visual Connected Pipeline */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Workflow Pipeline
                </span>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  {selectedWorkflow.steps.map((step, idx) => {
                    const isStepActive = isRunning && activeStepIndex === idx;
                    const isStepDone = completedSteps.includes(step.stepId);
                    const toolObj = TOOLS.find((t) => t.id === step.toolId);

                    return (
                      <React.Fragment key={step.stepId}>
                        <div
                          className={`flex-1 p-4 rounded-2xl border transition ${
                            isStepActive
                              ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                              : isStepDone
                              ? 'border-emerald-500/30 bg-[#090d16]'
                              : 'border-slate-800 bg-[#090d16]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              Step {idx + 1}
                            </span>
                            {isStepDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : isStepActive ? (
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                            ) : null}
                          </div>
                          <div className="text-xs font-bold text-white truncate">{step.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate font-mono">
                            {toolObj?.name || step.toolId}
                          </div>
                        </div>

                        {idx < selectedWorkflow.steps.length - 1 && (
                          <div className="flex items-center justify-center text-slate-600">
                            <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Live Step Runner if active */}
              {isRunning && (
                <div className="rounded-2xl border border-emerald-500/30 bg-[#090d16] p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-emerald-400">
                        Active Step {activeStepIndex + 1} of {selectedWorkflow.steps.length}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {selectedWorkflow.steps[activeStepIndex].title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onExecuteTool(
                            selectedWorkflow.steps[activeStepIndex].toolId,
                            selectedWorkflow.steps[activeStepIndex].parameters
                          )
                        }
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition cursor-pointer"
                      >
                        Open In Workspace
                      </button>

                      <button
                        onClick={handleNextStep}
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition cursor-pointer"
                      >
                        {activeStepIndex + 1 === selectedWorkflow.steps.length ? 'Complete Pipeline' : 'Next Step →'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl border border-slate-800 bg-[#0d1322] text-slate-400">
              Select a workflow from the left column to inspect its pipeline.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Workflow */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0d1322] p-7 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white">Create Custom Workflow</h3>

            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Workflow Name
                </label>
                <input
                  type="text"
                  required
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="e.g. Social Media Media Prep"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newWorkflowDesc}
                  onChange={(e) => setNewWorkflowDesc(e.target.value)}
                  placeholder="Describe the objective of this sequence..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Tools in Sequence (Click to toggle)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {TOOLS.slice(0, 12).map((t) => {
                    const isPicked = selectedSteps.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isPicked) {
                            setSelectedSteps((prev) => prev.filter((id) => id !== t.id));
                          } else {
                            setSelectedSteps((prev) => [...prev, t.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs text-left truncate transition cursor-pointer ${
                          isPicked
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={!newWorkflowName.trim() || selectedSteps.length === 0}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition cursor-pointer disabled:opacity-50"
                >
                  Save Workflow
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
