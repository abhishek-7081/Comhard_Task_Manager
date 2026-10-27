import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Check, 
  RotateCcw, 
  ArrowRight,
  MoreVertical
} from 'lucide-react';
import { calculateLiveStageDuration, formatDurationMs } from '../utils/timeFormat';
import { getSlaDisplayInfo, getPriorityBadgeClass } from '../utils/slaUtils';
import { useWorkspace } from '../context/WorkspaceContext';

export const TaskCard = ({ task, onSelect, onTransition, draggable = false, onDragStart }) => {
  const { canEditWorkspace } = useWorkspace();
  const [nowTime, setNowTime] = useState(Date.now());

  // Real-time ticker for live stage durations
  useEffect(() => {
    // Only tick if ongoing (Allocated or Working); Done tasks do not have active stage timer
    if (task.currentStage === 'Done') return;

    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [task.currentStage]);

  const liveDurations = calculateLiveStageDuration(task, nowTime);
  const slaInfo = getSlaDisplayInfo(task, nowTime);

  const handleStageChange = (e, targetStage) => {
    e.stopPropagation();
    onTransition(task._id, targetStage);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, task._id)}
      onClick={() => onSelect(task._id)}
      className="bg-white rounded-xl p-4 border border-edge hover:border-ocean-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group"
    >
      <div>
        {/* Top header: Section badge & Priority */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-ink-muted bg-canvas px-2.5 py-0.5 rounded-md border border-edge truncate max-w-[130px]">
            {task.section?.name || 'Section'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        {/* Task Title */}
        <h4 className="text-sm font-semibold text-ink-main group-hover:text-ocean-700 transition line-clamp-2 leading-snug">
          {task.title}
        </h4>

        {/* Description snippet */}
        {task.description && (
          <p className="text-xs text-ink-muted line-clamp-2 mt-1.5 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Timing and SLA Section */}
      <div className="space-y-2 pt-2 border-t border-edge/60 text-xs">
        {/* Stage Timer */}
        <div className="flex items-center justify-between text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${task.currentStage === 'Working' ? 'text-ocean-600 animate-pulse' : 'text-earth-600'}`} />
            <span>
              {task.currentStage === 'Done' ? 'Completed in:' : `In ${task.currentStage}:`}
            </span>
          </div>
          <span className="font-mono font-semibold text-ink-main">
            {task.currentStage === 'Done'
              ? formatDurationMs(task.completionDurationMs || 0)
              : liveDurations.currentStageDuration}
          </span>
        </div>

        {/* SLA Status Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink-muted">SLA Target:</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${slaInfo.badgeClass}`}>
            {slaInfo.status === 'overdue' && <AlertTriangle className="w-3 h-3 text-red-600" />}
            {slaInfo.status === 'completed_within_sla' && <CheckCircle2 className="w-3 h-3 text-forest-600" />}
            {slaInfo.text}
          </span>
        </div>

        {/* Assignee & Due Date */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {task.assignee ? (
              <div 
                className="w-5 h-5 rounded-full bg-forest-100 text-forest-700 font-bold text-[10px] flex items-center justify-center border border-forest-200"
                title={`Assigned to ${task.assignee.name}`}
              >
                {task.assignee.name?.charAt(0)}
              </div>
            ) : (
              <span className="text-[11px] text-ink-muted italic">Unassigned</span>
            )}
            <span className="text-xs text-ink-main truncate max-w-[80px]">
              {task.assignee?.name}
            </span>
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1 text-[11px] text-ink-muted">
              <Calendar className="w-3 h-3 text-ink-muted" />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stage Transition Actions */}
      {canEditWorkspace && (
        <div className="pt-2 border-t border-edge/60 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {task.currentStage === 'Allocated' && (
            <button
              onClick={(e) => handleStageChange(e, 'Working')}
              className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-ocean-700 bg-ocean-50 hover:bg-ocean-100 rounded-lg border border-ocean-200 transition"
            >
              <Play className="w-3 h-3" />
              <span>Start Working</span>
            </button>
          )}

          {task.currentStage === 'Working' && (
            <div className="flex items-center gap-1.5 w-full">
              <button
                onClick={(e) => handleStageChange(e, 'Allocated')}
                className="flex-1 px-2 py-1.5 text-[11px] font-medium text-ink-muted bg-canvas hover:bg-earth-50 rounded-lg border border-edge transition text-center"
              >
                Back to Allocated
              </button>
              <button
                onClick={(e) => handleStageChange(e, 'Done')}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 rounded-lg border border-forest-200 transition"
              >
                <Check className="w-3 h-3" />
                <span>Mark Done</span>
              </button>
            </div>
          )}

          {task.currentStage === 'Done' && (
            <button
              onClick={(e) => handleStageChange(e, 'Working')}
              className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-earth-700 bg-earth-50 hover:bg-earth-100 rounded-lg border border-earth-200 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reopen Task</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
