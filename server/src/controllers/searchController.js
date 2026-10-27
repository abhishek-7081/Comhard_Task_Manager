import { Section } from '../models/Section.js';
import { Task } from '../models/Task.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    const workspaceId = req.workspace._id;

    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        query: '',
        results: {
          sections: [],
          tasks: []
        }
      });
    }

    const keyword = q.trim();
    const regex = new RegExp(keyword, 'i');

    // Search Sections
    const sections = await Section.find({
      workspace: workspaceId,
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } }
      ]
    }).select('name description color order createdAt');

    // Search Tasks and populate parent Section
    const tasks = await Task.find({
      workspace: workspaceId,
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { tags: { $in: [regex] } }
      ]
    })
      .select('title description priority currentStage section dueDate tags createdAt')
      .populate('section', 'name color')
      .populate('assignee', 'name email avatar');

    res.status(200).json({
      success: true,
      query: keyword,
      results: {
        sections,
        tasks
      },
      counts: {
        total: sections.length + tasks.length,
        sections: sections.length,
        tasks: tasks.length
      }
    });
  } catch (error) {
    next(error);
  }
};
