import { Task } from '../models/Task.js';
import { Section } from '../models/Section.js';
import { formatDuration } from '../utils/timeUtils.js';

export const getOverviewAnalytics = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const now = new Date();

    const tasks = await Task.find({ workspace: workspaceId })
      .populate('section', 'name color')
      .populate('assignee', 'name email');

    const sections = await Section.find({ workspace: workspaceId }).sort({ order: 1 });

    const totalTasks = tasks.length;
    const allocatedTasks = tasks.filter((t) => t.currentStage === 'Allocated').length;
    const workingTasks = tasks.filter((t) => t.currentStage === 'Working').length;
    const doneTasks = tasks.filter((t) => t.currentStage === 'Done').length;

    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Overdue tasks: ongoing tasks where now > slaDeadline
    const ongoingOverdue = tasks.filter((t) => {
      if (t.currentStage === 'Done') return false;
      const deadline = t.slaDeadline ? new Date(t.slaDeadline).getTime() : 0;
      return deadline > 0 && deadline < now.getTime();
    }).length;

    // Completed late (breached)
    const completedBreached = tasks.filter((t) => t.currentStage === 'Done' && t.slaMet === false).length;
    const totalSlaBreaches = ongoingOverdue + completedBreached;

    // SLA compliance for completed tasks
    const completedTasksList = tasks.filter((t) => t.currentStage === 'Done' && t.completedAt);
    const completedMet = completedTasksList.filter((t) => t.slaMet === true).length;
    const completedSlaCompliance =
      completedTasksList.length > 0
        ? Math.round((completedMet / completedTasksList.length) * 100)
        : 100;

    // Workspace Overall Average Task Completion Time
    let workspaceAvgCompletionMs = null;
    let workspaceAvgCompletionFormatted = '—';
    if (completedTasksList.length > 0) {
      const totalTimeMs = completedTasksList.reduce((acc, t) => {
        const duration =
          t.completionDurationMs ||
          Math.max(0, new Date(t.completedAt).getTime() - new Date(t.workflowStartedAt || t.createdAt).getTime());
        return acc + duration;
      }, 0);
      workspaceAvgCompletionMs = totalTimeMs / completedTasksList.length;
      workspaceAvgCompletionFormatted = formatDuration(workspaceAvgCompletionMs, '—');
    }

    // Stage Distribution Data for Charts
    const stageDistribution = [
      { name: 'Allocated', value: allocatedTasks, color: '#8B6548' },
      { name: 'Working', value: workingTasks, color: '#3977C3' },
      { name: 'Done', value: doneTasks, color: '#2E7D5B' }
    ];

    // Priority Distribution Data
    const priorityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    tasks.forEach((t) => {
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority] += 1;
      }
    });
    const priorityDistribution = [
      { name: 'Low', count: priorityCounts.Low, color: '#2E7D5B' },
      { name: 'Medium', count: priorityCounts.Medium, color: '#3977C3' },
      { name: 'High', count: priorityCounts.High, color: '#D97706' },
      { name: 'Critical', count: priorityCounts.Critical, color: '#DC2626' }
    ];

    // Section Metrics & Average Completion Time per Section
    const sectionAnalytics = sections.map((sec) => {
      const secIdStr = sec._id.toString();
      const secTasks = tasks.filter((t) => t.section && t.section._id.toString() === secIdStr);
      
      const secAllocated = secTasks.filter((t) => t.currentStage === 'Allocated').length;
      const secWorking = secTasks.filter((t) => t.currentStage === 'Working').length;
      const secDone = secTasks.filter((t) => t.currentStage === 'Done').length;

      // Attribution: tasks completed in this section
      const compTasks = tasks.filter((t) => {
        if (t.currentStage !== 'Done' || !t.completedAt) return false;
        const cSec = (t.completionSection || t.section?._id || '').toString();
        return cSec === secIdStr;
      });

      let avgMs = null;
      let avgHours = 0;
      let avgFormatted = 'N/A';

      if (compTasks.length > 0) {
        const total = compTasks.reduce((acc, t) => {
          const d =
            t.completionDurationMs ||
            Math.max(0, new Date(t.completedAt).getTime() - new Date(t.workflowStartedAt || t.createdAt).getTime());
          return acc + d;
        }, 0);
        avgMs = total / compTasks.length;
        avgHours = Number((avgMs / (1000 * 60 * 60)).toFixed(2));
        avgFormatted = formatDuration(avgMs, 'N/A');
      }

      return {
        sectionId: sec._id,
        sectionName: sec.name,
        color: sec.color || '#2E7D5B',
        totalTasks: secTasks.length,
        allocated: secAllocated,
        working: secWorking,
        done: secDone,
        completedCount: compTasks.length,
        avgCompletionMs: avgMs,
        avgCompletionHours: avgHours,
        avgCompletionFormatted: avgFormatted
      };
    });

    // Completion Trends (Group completed tasks by date of completion over last 14 days)
    const trendsMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendsMap[dateKey] = { date: dateKey, completed: 0, created: 0 };
    }

    tasks.forEach((t) => {
      if (t.createdAt) {
        const createdKey = new Date(t.createdAt).toISOString().split('T')[0];
        if (trendsMap[createdKey]) {
          trendsMap[createdKey].created += 1;
        }
      }
      if (t.currentStage === 'Done' && t.completedAt) {
        const compKey = new Date(t.completedAt).toISOString().split('T')[0];
        if (trendsMap[compKey]) {
          trendsMap[compKey].completed += 1;
        }
      }
    });

    const completionTrends = Object.values(trendsMap);

    // Assignee Workload Distribution
    const assigneeMap = {};
    tasks.forEach((t) => {
      const name = t.assignee ? t.assignee.name : 'Unassigned';
      if (!assigneeMap[name]) {
        assigneeMap[name] = { name, Allocated: 0, Working: 0, Done: 0, total: 0 };
      }
      assigneeMap[name][t.currentStage] += 1;
      assigneeMap[name].total += 1;
    });
    const assigneeWorkload = Object.values(assigneeMap);

    res.status(200).json({
      success: true,
      overview: {
        totalTasks,
        allocatedTasks,
        workingTasks,
        doneTasks,
        completionRate,
        overdueTasks: ongoingOverdue,
        totalSlaBreaches,
        completedSlaCompliance,
        workspaceAvgCompletionMs,
        workspaceAvgCompletionFormatted
      },
      charts: {
        stageDistribution,
        priorityDistribution,
        sectionAnalytics,
        completionTrends,
        assigneeWorkload
      }
    });
  } catch (error) {
    next(error);
  }
};
