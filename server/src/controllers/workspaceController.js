import { Workspace } from '../models/Workspace.js';
import { Section } from '../models/Section.js';
import { User } from '../models/User.js';

export const getMyWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    res.status(200).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, defaultSlaMinutes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      description: description || '',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }],
      defaultSlaMinutes: defaultSlaMinutes || 120
    });

    // Create starter sections
    const defaultSections = [
      { name: 'Backlog', order: 0, color: '#8B6548' },
      { name: 'Development', order: 1, color: '#3977C3' },
      { name: 'Review & Testing', order: 2, color: '#2E7D5B' },
      { name: 'Deployment', order: 3, color: '#24312B' }
    ];

    await Section.insertMany(
      defaultSections.map((sec) => ({
        ...sec,
        workspace: workspace._id,
        creator: req.user._id
      }))
    );

    req.user.currentWorkspace = workspace._id;
    await req.user.save();

    res.status(201).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { name, description, defaultSlaMinutes } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (defaultSlaMinutes !== undefined) workspace.defaultSlaMinutes = defaultSlaMinutes;

    await workspace.save();
    res.status(200).json({ success: true, workspace });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User with this email not found' });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === targetUser._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    workspace.members.push({
      user: targetUser._id,
      role: role && ['Admin', 'Member', 'Viewer'].includes(role) ? role : 'Member'
    });

    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      members: workspace.members
    });
  } catch (error) {
    next(error);
  }
};
