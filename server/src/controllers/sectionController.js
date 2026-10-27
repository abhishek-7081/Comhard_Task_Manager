import { Section } from '../models/Section.js';
import { Task } from '../models/Task.js';
import { formatDuration } from '../utils/timeUtils.js';

export const getSections = async (req, res, next) => {
  try {
    const workspaceId = req.workspace._id;
    const sections = await Section.find({ workspace: workspaceId }).sort({ order: 1, createdAt: 1 });

    const now = new Date();

    // Fetch all tasks in the workspace to calculate comprehensive section metrics efficiently
    const tasks = await Task.find({ workspace: workspaceId });

    const sectionsWithStats = sections.map((sec) => {
      const secIdStr = sec._id.toString();
      const sectionTasks = tasks.filter((t) => t.section.toString() === secIdStr);
      
      const totalTasks = sectionTasks.length;
      const allocatedTasks = sectionTasks.filter((t) => t.currentStage === 'Allocated').length;
      const workingTasks = sectionTasks.filter((t) => t.currentStage === 'Working').length;
      const doneTasks = sectionTasks.filter((t) => t.currentStage === 'Done').length;

      const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      // Overdue tasks: ongoing tasks whose deadline is passed
      const overdueTasks = sectionTasks.filter((t) => {
        if (t.currentStage === 'Done') return false;
        const deadline = t.slaDeadline ? new Date(t.slaDeadline).getTime() : 0;
        return deadline > 0 && deadline < now.getTime();
      }).length;

      // Eligible completed tasks attributed to this section
      // By default attribution rule: task completed in this section (completionSection || section)
      const eligibleCompleted = tasks.filter((t) => {
        if (t.currentStage !== 'Done' || !t.completedAt) return false;
        const compSec = (t.completionSection || t.section).toString();
        return compSec === secIdStr;
      });

      let avgCompletionTimeMs = null;
      let avgCompletionTimeFormatted = 'N/A';

      if (eligibleCompleted.length > 0) {
        const sumDurationMs = eligibleCompleted.reduce((acc, t) => {
          const duration = t.completionDurationMs || (new Date(t.completedAt).getTime() - new Date(t.workflowStartedAt || t.createdAt).getTime());
          return acc + Math.max(0, duration);
        }, 0);

        avgCompletionTimeMs = sumDurationMs / eligibleCompleted.length;
        avgCompletionTimeFormatted = formatDuration(avgCompletionTimeMs, 'N/A');
      }

      // SLA compliance percentage on completed tasks
      let slaCompliancePercentage = 100;
      if (eligibleCompleted.length > 0) {
        const metCount = eligibleCompleted.filter((t) => t.slaMet === true).length;
        slaCompliancePercentage = Math.round((metCount / eligibleCompleted.length) * 100);
      }

      return {
        ...sec.toObject(),
        stats: {
          totalTasks,
          allocatedTasks,
          workingTasks,
          doneTasks,
          completionPercentage,
          overdueTasks,
          completedCount: eligibleCompleted.length,
          avgCompletionTimeMs,
          avgCompletionTimeFormatted,
          slaCompliancePercentage
        }
      };
    });

    res.status(200).json({
      success: true,
      count: sectionsWithStats.length,
      sections: sectionsWithStats
    });
  } catch (error) {
    next(error);
  }
};

export const getSectionById = async (req, res, next) => {
  try {
    const section = await Section.findOne({
      _id: req.params.id,
      workspace: req.workspace._id
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const tasks = await Task.find({ section: section._id, workspace: req.workspace._id })
      .populate('assignee', 'name email avatar')
      .populate('creator', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      section,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

export const createSection = async (req, res, next) => {
  try {
    const { name, description, color, order } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Section name is required' });
    }

    // Determine order if not passed
    let sectionOrder = order;
    if (sectionOrder === undefined || sectionOrder === null) {
      const highest = await Section.findOne({ workspace: req.workspace._id }).sort({ order: -1 });
      sectionOrder = highest ? highest.order + 1 : 0;
    }

    const section = await Section.create({
      name,
      description: description || '',
      color: color || '#2E7D5B',
      order: sectionOrder,
      workspace: req.workspace._id,
      creator: req.user._id
    });

    res.status(201).json({
      success: true,
      section: {
        ...section.toObject(),
        stats: {
          totalTasks: 0,
          allocatedTasks: 0,
          workingTasks: 0,
          doneTasks: 0,
          completionPercentage: 0,
          overdueTasks: 0,
          completedCount: 0,
          avgCompletionTimeMs: null,
          avgCompletionTimeFormatted: 'N/A',
          slaCompliancePercentage: 100
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const { name, description, color, order } = req.body;
    const section = await Section.findOne({
      _id: req.params.id,
      workspace: req.workspace._id
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    if (name) section.name = name;
    if (description !== undefined) section.description = description;
    if (color) section.color = color;
    if (order !== undefined) section.order = order;

    await section.save();

    res.status(200).json({ success: true, section });
  } catch (error) {
    next(error);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { strategy, targetSectionId } = req.body;

    const section = await Section.findOne({
      _id: id,
      workspace: req.workspace._id
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const taskCount = await Task.countDocuments({ section: section._id });

    if (taskCount > 0) {
      if (strategy === 'reassign') {
        if (!targetSectionId) {
          return res.status(400).json({
            success: false,
            message: 'Target section ID is required to reassign tasks.'
          });
        }

        const targetSection = await Section.findOne({
          _id: targetSectionId,
          workspace: req.workspace._id
        });

        if (!targetSection || targetSection._id.toString() === section._id.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Invalid target section for task reassignment.'
          });
        }

        // Reassign tasks while recording section history
        const tasksToMove = await Task.find({ section: section._id });
        for (const task of tasksToMove) {
          task.section = targetSection._id;
          task.sectionHistory.push({
            fromSection: section._id,
            toSection: targetSection._id,
            transitionedAt: new Date(),
            transitionedBy: req.user._id
          });
          await task.save();
        }
      } else if (strategy === 'cascade') {
        // Explicit user confirmation to delete tasks with the section
        await Task.deleteMany({ section: section._id });
      } else {
        return res.status(400).json({
          success: false,
          hasTasks: true,
          taskCount,
          message: `Section contains ${taskCount} task(s). Please choose whether to reassign them to another section or confirm deletion.`
        });
      }
    }

    await Section.findByIdAndDelete(section._id);

    res.status(200).json({
      success: true,
      message: 'Section deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const reorderSections = async (req, res, next) => {
  try {
    const { sectionOrders } = req.body; // array of { id, order }

    if (!Array.isArray(sectionOrders)) {
      return res.status(400).json({ success: false, message: 'sectionOrders array required' });
    }

    const bulkOps = sectionOrders.map((item) => ({
      updateOne: {
        filter: { _id: item.id, workspace: req.workspace._id },
        update: { order: item.order }
      }
    }));

    await Section.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: 'Sections reordered successfully' });
  } catch (error) {
    next(error);
  }
};
