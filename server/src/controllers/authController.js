import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { Section } from '../models/Section.js';

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_jwt_key_comhard_tech_2026_task_manager',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    // Default system role is Admin for self-registered workspace creators
    const userRole = role && ['Admin', 'Member', 'Viewer'].includes(role) ? role : 'Admin';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole
    });

    // Automatically create a default personal workspace for the new user
    const defaultWorkspace = await Workspace.create({
      name: `${user.name}'s Workspace`,
      description: 'Default primary workspace',
      owner: user._id,
      members: [{ user: user._id, role: 'Admin' }],
      defaultSlaMinutes: 120
    });

    // Create starter sections for the workspace
    const starterSections = [
      { name: 'Backlog', description: 'Tasks queued for planning and refinement', order: 0, color: '#8B6548' },
      { name: 'Development', description: 'Tasks actively being built and engineered', order: 1, color: '#3977C3' },
      { name: 'Review & Testing', description: 'Quality assurance and peer validation', order: 2, color: '#2E7D5B' },
      { name: 'Deployment', description: 'Release staging and live deployment operations', order: 3, color: '#24312B' }
    ];

    await Section.insertMany(
      starterSections.map((s) => ({
        ...s,
        workspace: defaultWorkspace._id,
        creator: user._id
      }))
    );

    user.currentWorkspace = defaultWorkspace._id;
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentWorkspace: defaultWorkspace._id
      },
      workspace: defaultWorkspace
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Ensure user has a valid workspace
    let workspace = null;
    if (user.currentWorkspace) {
      workspace = await Workspace.findById(user.currentWorkspace);
    }
    if (!workspace) {
      workspace = await Workspace.findOne({
        $or: [{ owner: user._id }, { 'members.user': user._id }]
      });
      if (workspace) {
        user.currentWorkspace = workspace._id;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentWorkspace: user.currentWorkspace
      },
      workspace
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('currentWorkspace');
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentWorkspace: user.currentWorkspace
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};
