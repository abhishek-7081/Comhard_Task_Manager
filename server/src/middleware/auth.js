import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please log in.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_comhard_tech_2026_task_manager'
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

/**
 * Restrict to specific system roles (Admin, Member, Viewer)
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

/**
 * Verify workspace access and set req.workspace & req.workspaceRole
 */
export const verifyWorkspaceAccess = async (req, res, next) => {
  try {
    const workspaceId =
      req.params.workspaceId ||
      req.body.workspace ||
      req.query.workspace ||
      req.headers['x-workspace-id'] ||
      req.user.currentWorkspace;

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace identifier is required'
      });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is owner
    const isOwner = workspace.owner.toString() === req.user._id.toString();

    // Check if user is member
    const memberRecord = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isOwner && !memberRecord && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this workspace'
      });
    }

    let role = 'Viewer';
    if (isOwner || req.user.role === 'Admin') {
      role = 'Admin';
    } else if (memberRecord) {
      role = memberRecord.role;
    }

    req.workspace = workspace;
    req.workspaceRole = role;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require workspace write permission (Admin or Member, not Viewer)
 */
export const requireWorkspaceWrite = (req, res, next) => {
  if (req.workspaceRole === 'Viewer') {
    return res.status(403).json({
      success: false,
      message: 'Viewers cannot modify workspace data. Admin or Member role required.'
    });
  }
  next();
};

/**
 * Require workspace admin permission (Workspace Owner or Admin)
 */
export const requireWorkspaceAdmin = (req, res, next) => {
  if (req.workspaceRole !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Workspace Admin role required for this operation.'
    });
  }
  next();
};
