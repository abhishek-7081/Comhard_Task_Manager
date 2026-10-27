/**
 * SLA calculation utilities adhering strictly to section 7 requirements.
 */

export const computeSlaStatus = (task, now = new Date()) => {
  const currentTime = new Date(now).getTime();
  const startedAt = new Date(task.slaStartedAt || task.workflowStartedAt || task.createdAt || now).getTime();
  const targetMinutes = task.slaTargetMinutes || 120;
  const targetMs = targetMinutes * 60 * 1000;
  const deadline = task.slaDeadline ? new Date(task.slaDeadline).getTime() : (startedAt + targetMs);
  const approachingThresholdMs = 0.20 * targetMs; // 20% remaining threshold

  const isCompleted = task.currentStage === 'Done' && task.completedAt;
  const completedTime = isCompleted ? new Date(task.completedAt).getTime() : null;

  if (isCompleted) {
    const met = completedTime <= deadline;
    const actualDurationMs = completedTime - startedAt;
    const timeDiffMs = deadline - completedTime; // positive if met, negative if late

    return {
      status: met ? 'completed_within_sla' : 'completed_after_breach',
      label: met ? 'Completed Within SLA' : 'Completed Late (Breached)',
      isBreached: !met,
      isCompleted: true,
      deadline: new Date(deadline),
      targetMinutes,
      actualDurationMs,
      timeDiffMs: Math.abs(timeDiffMs),
      exceededMs: met ? 0 : (completedTime - deadline)
    };
  }

  // Task is ongoing (Allocated or Working)
  const remainingMs = deadline - currentTime;
  const isOverdue = remainingMs <= 0;
  const isApproaching = !isOverdue && remainingMs <= approachingThresholdMs;

  let status = 'within_sla';
  let label = 'Within SLA';

  if (isOverdue) {
    status = 'overdue';
    label = 'Overdue';
  } else if (isApproaching) {
    status = 'approaching_deadline';
    label = 'Approaching Deadline';
  }

  return {
    status,
    label,
    isBreached: isOverdue,
    isCompleted: false,
    deadline: new Date(deadline),
    targetMinutes,
    remainingMs: isOverdue ? 0 : remainingMs,
    exceededMs: isOverdue ? Math.abs(remainingMs) : 0
  };
};
