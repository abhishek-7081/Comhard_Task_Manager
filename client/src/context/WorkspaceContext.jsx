import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  // Fetch all workspaces user has access to
  const fetchWorkspaces = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingWorkspaces(true);
      const res = await api.get('/workspaces');
      if (res.data.success) {
        setWorkspaces(res.data.workspaces);
        
        const savedWsId = localStorage.getItem('currentWorkspaceId');
        let selected = res.data.workspaces.find((w) => w._id === savedWsId);
        
        if (!selected && res.data.workspaces.length > 0) {
          selected = res.data.workspaces[0];
        }
        
        if (selected) {
          setCurrentWorkspace(selected);
          localStorage.setItem('currentWorkspaceId', selected._id);
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [isAuthenticated]);

  // Fetch sections for current workspace
  const fetchSections = useCallback(async (wsId) => {
    const targetWsId = wsId || currentWorkspace?._id || localStorage.getItem('currentWorkspaceId');
    if (!targetWsId || !isAuthenticated) return;

    try {
      setLoadingSections(true);
      const res = await api.get('/sections', {
        headers: { 'x-workspace-id': targetWsId }
      });
      if (res.data.success) {
        setSections(res.data.sections);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
    } finally {
      setLoadingSections(false);
    }
  }, [currentWorkspace, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setSections([]);
    }
  }, [isAuthenticated, fetchWorkspaces]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchSections(currentWorkspace._id);
    }
  }, [currentWorkspace?._id, fetchSections]);

  const switchWorkspace = (workspaceId) => {
    const target = workspaces.find((w) => w._id === workspaceId);
    if (target) {
      setCurrentWorkspace(target);
      localStorage.setItem('currentWorkspaceId', target._id);
      fetchSections(target._id);
    }
  };

  // Compute user role in current workspace
  let userWorkspaceRole = 'Viewer';
  if (user && currentWorkspace) {
    if (currentWorkspace.owner?._id === user.id || currentWorkspace.owner === user.id || user.role === 'Admin') {
      userWorkspaceRole = 'Admin';
    } else {
      const mem = currentWorkspace.members?.find((m) => {
        const mUserId = m.user?._id || m.user;
        return mUserId === user.id;
      });
      if (mem) {
        userWorkspaceRole = mem.role;
      }
    }
  }

  const isWorkspaceAdmin = userWorkspaceRole === 'Admin';
  const canEditWorkspace = userWorkspaceRole === 'Admin' || userWorkspaceRole === 'Member';

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        sections,
        loadingSections,
        loadingWorkspaces,
        fetchWorkspaces,
        fetchSections,
        switchWorkspace,
        setCurrentWorkspace,
        userWorkspaceRole,
        isWorkspaceAdmin,
        canEditWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
