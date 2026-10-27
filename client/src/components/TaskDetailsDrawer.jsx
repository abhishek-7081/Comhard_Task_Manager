import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { 
  X, 
  Clock, 
  Calendar, 
  User, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Check, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  Send,
  History,
  FolderSync
} from 'lucide-react';
import { calculateLiveStageDuration, formatDurationMs } from '../utils/timeFormat';
import { getSlaDisplayInfo, getPriorityBadgeClass } from '../utils/slaUtils';

export const TaskDetailsDrawer = ({ taskId, onClose, onTaskUpdated, onEditTask, onDeleteTask }) => {
  const { canEditWorkspace } = useWorkspace();
  const toast = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [nowTime, setNowTime] = useState(Date.now());

  // Load complete task record
  const fetchTaskDetails = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const res = await api.get(`/tasks/${taskId}`);
      if (res.data.success) {
        setTask(res.data.task);
      }
    } catch (err) {
      toast.error('Failed to load task details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  // Live timer tick for ongoing tasks (Allocated or Working)
  useEffect(() => {
    if (!task || task.currentStage === 'Done') return;

    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [task?.currentStage]);

  if (!taskId) return null;

  const liveDurations = task ? calculateLiveStageDuration(task, nowTime) : null;
  const slaInfo = task ? getSlaDisplayInfo(task, nowTime) : null;

  const handleStageTransition = async (targetStage) => {
    try {
      const res = await api.post(`/tasks/${task._id}/transitions`, { stage: targetStage });
      if (res.data.success) {
        toast.success(`Task moved to ${targetStage}`);
        setTask(res.data.task);
        onTaskUpdated && onTaskUpdated(res.data.task);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transition stage');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.post(`/tasks/${task._id}/comments`, { text: commentText });
      if (res.data.success) {
        setTask((prev) => ({ ...prev, comments: res.data.comments }));
        setCommentText('');
        toast.success('Comment added');
      }
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-main/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-edge flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-canvas/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-edge text-ink-muted">
              {task?.section?.name || 'Section'}
            </span>
            {task && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(task.priority)}`}>
                {task.priority}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEditWorkspace && task && (
              <>
                <button
                  onClick={() => onEditTask(task)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ocean-600 hover:bg-ocean-50 transition"
                  title="Edit Task"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteTask(task._id)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 transition"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink-main hover:bg-canvas transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600"></div>
          </div>
        ) : task ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Stage Control */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-ink-main leading-snug">{task.title}</h2>
              {task.description && (
                <p className="text-sm text-ink-muted whitespace-pre-line leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Three-Stage Workflow Action Buttons */}
              {canEditWorkspace && (
                <div className="bg-canvas p-3 rounded-xl border border-edge flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Current Stage:
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        task.currentStage === 'Allocated'
                          ? 'badge-allocated'
                          : task.currentStage === 'Working'
                          ? 'badge-working'
                          : 'badge-done'
                      }`}
                    >
                      {task.currentStage}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.currentStage === 'Allocated' && (
                      <button
                        onClick={() => handleStageTransition('Working')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-ocean-600 hover:bg-ocean-700 rounded-lg transition"
                      >
                        <Play className="w-3.5 h-3.5" /> Move to Working
                      </button>
                    )}
                    {task.currentStage === 'Working' && (
                      <>
                        <button
                          onClick={() => handleStageTransition('Allocated')}
                          className="px-2.5 py-1.5 text-xs font-medium text-ink-muted bg-white hover:bg-earth-50 rounded-lg border border-edge transition"
                        >
                          Return to Allocated
                        </button>
                        <button
                          onClick={() => handleStageTransition('Done')}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Complete Task (Done)
                        </button>
                      </>
                    )}
                    {task.currentStage === 'Done' && (
                      <button
                        onClick={() => handleStageTransition('Working')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-earth-700 bg-earth-100 hover:bg-earth-200 rounded-lg transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reopen Task
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Time Tracking & SLA Breakdown Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Authoritative Stage Timing */}
              <div className="bg-canvas p-4 rounded-xl border border-edge space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-ink-main uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-forest-600" />
                  <span>Stage Timing</span>
                </div>
                <div className="text-sm">
                  {task.currentStage === 'Done' ? (
                    <div>
                      <span className="text-xs text-ink-muted">Total Completion Duration:</span>
                      <div className="text-lg font-mono font-bold text-forest-700">
                        {formatDurationMs(task.completionDurationMs || 0)}
                      </div>
                      <div className="text-[11px] text-ink-muted mt-1">
                        Allocated: {formatDurationMs(task.allocatedDurationMs || 0)} | Working: {formatDurationMs(task.workingDurationMs || 0)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-ink-muted">Current Active Stage Timer:</span>
                      <div className="text-lg font-mono font-bold text-ocean-700">
                        {liveDurations?.currentStageDuration}
                      </div>
                      <div className="text-[11px] text-ink-muted mt-1">
                        Cumulative {task.currentStage}: {liveDurations?.totalStageDuration}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SLA Status Indicator */}
              <div className="bg-canvas p-4 rounded-xl border border-edge space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-main uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-ocean-600" />
                    <span>SLA Tracking</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${slaInfo?.badgeClass}`}>
                    {slaInfo?.text}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-ink-muted">
                  <div>Target Duration: <span className="font-semibold text-ink-main">{formatDurationMs((task.slaTargetMinutes || 120) * 60000)}</span></div>
                  <div>SLA Deadline: <span className="font-semibold text-ink-main">{task.slaDeadline ? new Date(task.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span></div>
                  {task.completedAt && (
                    <div>Completed At: <span className="font-semibold text-ink-main">{new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Stage Transition History Table (Section 6 Requirement) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ink-main uppercase tracking-wider">
                <History className="w-4 h-4 text-ink-muted" />
                <span>Stage Transition History ({task.stageHistory?.length || 0})</span>
              </div>
              <div className="border border-edge rounded-xl overflow-hidden bg-white text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas/70 border-b border-edge text-ink-muted font-semibold">
                      <th className="p-2.5">Stage</th>
                      <th className="p-2.5">Entered At</th>
                      <th className="p-2.5">Exited At</th>
                      <th className="p-2.5">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {task.stageHistory && task.stageHistory.length > 0 ? (
                      task.stageHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-canvas/30">
                          <td className="p-2.5 font-semibold text-ink-main">{item.stage}</td>
                          <td className="p-2.5 text-ink-muted">
                            {new Date(item.enteredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-2.5 text-ink-muted">
                            {item.exitedAt
                              ? new Date(item.exitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : <span className="text-ocean-600 font-semibold">Active Now</span>}
                          </td>
                          <td className="p-2.5 font-mono text-ink-main">
                            {item.exitedAt ? formatDurationMs(item.durationMs) : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-ink-muted italic">
                          No stage transitions recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section Transition History (if task was moved between sections) */}
            {task.sectionHistory && task.sectionHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-ink-main uppercase tracking-wider">
                  <FolderSync className="w-4 h-4 text-ink-muted" />
                  <span>Section Move History ({task.sectionHistory.length})</span>
                </div>
                <div className="border border-edge rounded-xl p-3 bg-white space-y-2 text-xs">
                  {task.sectionHistory.map((sh, idx) => (
                    <div key={idx} className="flex items-center justify-between text-ink-muted">
                      <span>Moved to <strong className="text-ink-main">{sh.toSection?.name || 'Section'}</strong></span>
                      <span>{new Date(sh.transitionedAt).toLocaleDateString()} {new Date(sh.transitionedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Thread */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-ink-main uppercase tracking-wider">
                Comments ({task.comments?.length || 0})
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {task.comments?.map((c, idx) => (
                  <div key={idx} className="bg-canvas p-3 rounded-xl border border-edge text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink-main">{c.user?.name || 'User'}</span>
                      <span className="text-[10px] text-ink-muted">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-ink-muted leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              {canEditWorkspace && (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or note..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-edge rounded-xl focus:border-forest-600 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="px-3.5 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 disabled:opacity-50 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
