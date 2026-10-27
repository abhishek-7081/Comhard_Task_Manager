/**
 * Formats duration in milliseconds into a concise, human-readable string.
 * e.g., "2h 30m", "45m", "1d 4h", "< 1m", or "—" if 0 or null.
 */
export const formatDuration = (ms, emptyValue = '—') => {
  if (ms === null || ms === undefined || isNaN(ms) || ms < 0) {
    return emptyValue;
  }
  if (ms === 0) {
    return '0m';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = totalMinutes % 60;
  const remainingSeconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m ${remainingSeconds}s`;
  }
  return `${totalSeconds}s`;
};

/**
 * Calculates current computed durations for a task based on authoritative timestamps.
 */
export const computeTaskDurations = (task, now = new Date()) => {
  const currentTime = new Date(now).getTime();
  const enteredTime = new Date(task.stageEnteredAt || task.createdAt || now).getTime();
  const activeElapsed = Math.max(0, currentTime - enteredTime);

  let allocatedTotal = task.allocatedDurationMs || 0;
  let workingTotal = task.workingDurationMs || 0;
  let currentStageElapsed = 0;

  if (task.currentStage === 'Allocated') {
    currentStageElapsed = activeElapsed;
    allocatedTotal += activeElapsed;
  } else if (task.currentStage === 'Working') {
    currentStageElapsed = activeElapsed;
    workingTotal += activeElapsed;
  } else if (task.currentStage === 'Done') {
    // Done has NO active timer
    currentStageElapsed = 0;
  }

  const completionTotal =
    task.currentStage === 'Done'
      ? task.completionDurationMs || (allocatedTotal + workingTotal)
      : allocatedTotal + workingTotal;

  return {
    currentStageElapsedMs: currentStageElapsed,
    totalAllocatedMs: allocatedTotal,
    totalWorkingMs: workingTotal,
    totalCompletionMs: completionTotal
  };
};
