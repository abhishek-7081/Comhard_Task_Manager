/**
 * Formats duration milliseconds into human-readable string.
 */
export const formatDurationMs = (ms, emptyValue = '—') => {
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
 * Calculates real-time live elapsed time for a task's current stage and cumulative stage time.
 */
export const calculateLiveStageDuration = (task, nowTime = Date.now()) => {
  if (!task) return { currentStageDuration: '0s', totalStageDuration: '0s' };

  if (task.currentStage === 'Done') {
    // Done stage has NO active accumulating timer
    return {
      currentStageDuration: '—',
      totalAllocatedDuration: formatDurationMs(task.allocatedDurationMs || 0),
      totalWorkingDuration: formatDurationMs(task.workingDurationMs || 0),
      totalCompletionDuration: formatDurationMs(task.completionDurationMs || 0)
    };
  }

  const enteredAt = new Date(task.stageEnteredAt || task.createdAt || nowTime).getTime();
  const currentElapsedMs = Math.max(0, nowTime - enteredAt);

  let cumulativeMs = currentElapsedMs;
  if (task.currentStage === 'Allocated') {
    cumulativeMs += (task.allocatedDurationMs || 0);
  } else if (task.currentStage === 'Working') {
    cumulativeMs += (task.workingDurationMs || 0);
  }

  return {
    currentStageDuration: formatDurationMs(currentElapsedMs),
    totalStageDuration: formatDurationMs(cumulativeMs),
    currentElapsedMs,
    cumulativeMs
  };
};
