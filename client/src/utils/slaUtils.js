import { formatDurationMs } from './timeFormat';

export const getSlaDisplayInfo = (task, nowTime = Date.now()) => {
  if (!task) return { text: 'No SLA', badgeClass: 'bg-gray-100 text-gray-700' };

  const targetMinutes = task.slaTargetMinutes || 120;
  const startedAt = new Date(task.slaStartedAt || task.workflowStartedAt || task.createdAt || nowTime).getTime();
  const deadline = task.slaDeadline ? new Date(task.slaDeadline).getTime() : (startedAt + targetMinutes * 60 * 1000);

  // If completed
  if (task.currentStage === 'Done' && task.completedAt) {
    const isMet = task.slaMet !== undefined ? task.slaMet : (new Date(task.completedAt).getTime() <= deadline);
    return {
      status: isMet ? 'completed_within_sla' : 'completed_after_breach',
      text: isMet ? 'Completed Within SLA' : 'Completed Late (Breached)',
      badgeClass: isMet
        ? 'bg-forest-50 text-forest-700 border-forest-200'
        : 'bg-red-50 text-red-700 border-red-200',
      iconType: isMet ? 'check' : 'alert',
      isOverdue: !isMet
    };
  }

  // Ongoing task
  const remainingMs = deadline - nowTime;
  const isOverdue = remainingMs <= 0;
  const targetMs = targetMinutes * 60 * 1000;
  const isApproaching = !isOverdue && remainingMs <= 0.20 * targetMs;

  if (isOverdue) {
    const exceededMs = Math.abs(remainingMs);
    return {
      status: 'overdue',
      text: `Overdue by ${formatDurationMs(exceededMs)}`,
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      iconType: 'alert',
      isOverdue: true
    };
  }

  if (isApproaching) {
    return {
      status: 'approaching_deadline',
      text: `${formatDurationMs(remainingMs)} remaining`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      iconType: 'warning',
      isOverdue: false
    };
  }

  return {
    status: 'within_sla',
    text: `${formatDurationMs(remainingMs)} remaining`,
    badgeClass: 'bg-forest-50 text-forest-700 border-forest-200',
    iconType: 'clock',
    isOverdue: false
  };
};

export const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'Critical':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'High':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Medium':
      return 'bg-ocean-50 text-ocean-700 border-ocean-200';
    case 'Low':
    default:
      return 'bg-forest-50 text-forest-700 border-forest-200';
  }
};
