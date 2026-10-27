import { Task } from '../models/Task.js';
import { Section } from '../models/Section.js';
import { computeTaskDurations } from '../utils/timeUtils.js';
import { computeSlaStatus } from '../utils/slaUtils.js';

export const getTasks = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const { section, stage, priority, assignee, search, sort = 'createdAt', order = 'desc' } = req.query;

    const query = { workspace: workspaceId };

    if (section) query.section = section;
    if (stage) query.currentStage = stage;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const tasks = await Task.find(query)
      .populate('section', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .sort(sortObj);

    const now = new Date();
    const enrichedTasks = tasks.map((task) => {
      const durations = computeTaskDurations(task, now);
      const sla = computeSlaStatus(task, now);
      return {
        ...task.toObject(),
        durations,
        sla
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedTasks.length,
      tasks: enrichedTasks
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspace._id
    })
      .populate('section', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('stageHistory.transitionedBy', 'name email')
      .populate('sectionHistory.fromSection', 'name')
      .populate('sectionHistory.toSection', 'name')
      .populate('sectionHistory.transitionedBy', 'name email')
      .populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const now = new Date();
    const durations = computeTaskDurations(task, now);
    const sla = computeSlaStatus(task, now);

    res.status(200).json({
      success: true,
      task: {
        ...task.toObject(),
        durations,
        sla
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      section: sectionId,
      priority,
      assignee,
      dueDate,
      slaTargetMinutes,
      tags
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    if (!sectionId) {
      return res.status(400).json({ success: false, message: 'Section is required' });
    }

    const section = await Section.findOne({
      _id: sectionId,
      workspace: req.workspace._id
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Specified section not found' });
    }

    const now = new Date();
    const targetMinutes = Number(slaTargetMinutes) || req.workspace.defaultSlaMinutes || 120;
    const deadline = new Date(now.getTime() + targetMinutes * 60 * 1000);

    const initialStageHistory = [
      {
        stage: 'Allocated',
        enteredAt: now,
        exitedAt: null,
        durationMs: 0,
        transitionedBy: req.user._id
      }
    ];

    const task = await Task.create({
      title,
      description: description || '',
      workspace: req.workspace._id,
      section: section._id,
      creator: req.user._id,
      assignee: assignee || null,
      priority: priority || 'Medium',
      currentStage: 'Allocated',
      stageEnteredAt: now,
      workflowStartedAt: now,
      allocatedDurationMs: 0,
      workingDurationMs: 0,
      dueDate: dueDate || null,
      slaTargetMinutes: targetMinutes,
      slaStartedAt: now,
      slaDeadline: deadline,
      tags: Array.isArray(tags) ? tags : [],
      stageHistory: initialStageHistory
    });

    const populatedTask = await Task.findById(task._id)
      .populate('section', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar');

    const durations = computeTaskDurations(populatedTask, now);
    const sla = computeSlaStatus(populatedTask, now);

    res.status(201).json({
      success: true,
      task: {
        ...populatedTask.toObject(),
        durations,
        sla
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { title, description, section: newSectionId, priority, assignee, dueDate, slaTargetMinutes, tags } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspace._id
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (tags !== undefined) task.tags = Array.isArray(tags) ? tags : [];

    // If SLA target changed and task is not completed, update deadline
    if (slaTargetMinutes && slaTargetMinutes !== task.slaTargetMinutes) {
      task.slaTargetMinutes = slaTargetMinutes;
      const start = task.slaStartedAt || task.workflowStartedAt || task.createdAt;
      task.slaDeadline = new Date(new Date(start).getTime() + slaTargetMinutes * 60 * 1000);
      if (task.currentStage === 'Done' && task.completedAt) {
        task.slaMet = new Date(task.completedAt).getTime() <= task.slaDeadline.getTime();
      }
    }

    // Check if moving to a different section
    if (newSectionId && newSectionId.toString() !== task.section.toString()) {
      const targetSec = await Section.findOne({
        _id: newSectionId,
        workspace: req.workspace._id
      });

      if (!targetSec) {
        return res.status(404).json({ success: false, message: 'Target section not found' });
      }

      task.sectionHistory.push({
        fromSection: task.section,
        toSection: targetSec._id,
        transitionedAt: new Date(),
        transitionedBy: req.user._id
      });

      task.section = targetSec._id;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('section', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar');

    const now = new Date();
    const durations = computeTaskDurations(populatedTask, now);
    const sla = computeSlaStatus(populatedTask, now);

    res.status(200).json({
      success: true,
      task: {
        ...populatedTask.toObject(),
        durations,
        sla
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stage Transition handler enforcing the three-stage workflow and authoritative timing
 */
export const transitionTaskStage = async (req, res, next) => {
  try {
    const { stage: targetStage } = req.body;

    if (!['Allocated', 'Working', 'Done'].includes(targetStage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stage. Allowed stages: Allocated, Working, Done'
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspace._id
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Already in requested stage
    if (task.currentStage === targetStage) {
      const now = new Date();
      return res.status(200).json({
        success: true,
        message: `Task is already in stage ${targetStage}`,
        task: {
          ...task.toObject(),
          durations: computeTaskDurations(task, now),
          sla: computeSlaStatus(task, now)
        }
      });
    }

    const now = new Date();
    const currentStage = task.currentStage;

    // 1. Close current open stage interval in stageHistory
    if (task.stageHistory && task.stageHistory.length > 0) {
      // Find the active open interval
      const lastEntry = task.stageHistory[task.stageHistory.length - 1];
      if (lastEntry && !lastEntry.exitedAt) {
        lastEntry.exitedAt = now;
        const entryDuration = Math.max(0, now.getTime() - new Date(lastEntry.enteredAt).getTime());
        lastEntry.durationMs = entryDuration;

        // Add to cumulative stage counters
        if (currentStage === 'Allocated') {
          task.allocatedDurationMs = (task.allocatedDurationMs || 0) + entryDuration;
        } else if (currentStage === 'Working') {
          task.workingDurationMs = (task.workingDurationMs || 0) + entryDuration;
        }
      }
    }

    // 2. Handle transition to destination stage
    if (targetStage === 'Done') {
      task.completedAt = now;
      task.completionSection = task.section; // Attribute completion duration to current section
      const totalCompletionDuration = Math.max(0, now.getTime() - new Date(task.workflowStartedAt || task.createdAt).getTime());
      task.completionDurationMs = totalCompletionDuration;

      // Calculate final SLA compliance status
      const deadlineMs = task.slaDeadline ? new Date(task.slaDeadline).getTime() : 0;
      task.slaMet = deadlineMs > 0 ? (now.getTime() <= deadlineMs) : true;

      // Add a closed Done entry for record-keeping
      task.stageHistory.push({
        stage: 'Done',
        enteredAt: now,
        exitedAt: now,
        durationMs: 0,
        transitionedBy: req.user._id
      });

      task.stageEnteredAt = now;
      task.currentStage = 'Done';
    } else {
      // Transitioning to 'Allocated' or 'Working'
      if (currentStage === 'Done') {
        // Task reopened from Done:
        // Clear completion attributes so it is removed from completed-task averages
        // But retain historical stage intervals and accumulated stage durations!
        task.completedAt = null;
        task.completionDurationMs = null;
        task.slaMet = null;
        task.completionSection = null;
      }

      // Add new open interval for the target stage
      task.stageHistory.push({
        stage: targetStage,
        enteredAt: now,
        exitedAt: null,
        durationMs: 0,
        transitionedBy: req.user._id
      });

      task.stageEnteredAt = now;
      task.currentStage = targetStage;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('section', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('stageHistory.transitionedBy', 'name email');

    const durations = computeTaskDurations(populatedTask, now);
    const sla = computeSlaStatus(populatedTask, now);

    res.status(200).json({
      success: true,
      message: `Task successfully transitioned to ${targetStage}`,
      task: {
        ...populatedTask.toObject(),
        durations,
        sla
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspace._id
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(task._id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspace._id
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.comments.push({
      text: text.trim(),
      user: req.user._id,
      createdAt: new Date()
    });

    await task.save();

    const populatedTask = await Task.findById(task._id).populate('comments.user', 'name email avatar');

    res.status(201).json({
      success: true,
      comments: populatedTask.comments
    });
  } catch (error) {
    next(error);
  }
};
