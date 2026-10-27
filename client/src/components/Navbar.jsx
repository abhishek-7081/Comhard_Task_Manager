import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  Search, 
  Plus, 
  ChevronDown, 
  LogOut, 
  User, 
  Layers, 
  Briefcase,
  CheckCircle2
} from 'lucide-react';

export const Navbar = ({ onOpenSearch, onOpenNewTask }) => {
  const { user, logout } = useAuth();
  const { workspaces, currentWorkspace, switchWorkspace, userWorkspaceRole, canEditWorkspace } = useWorkspace();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const workspaceMenuRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target)) {
        setWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-edge sticky top-0 z-30 flex items-center justify-between px-6">
      {/* Left side: Brand and Workspace switcher */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-forest-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            T
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-ink-main tracking-tight text-lg">TaskFlow</span>
            <span className="text-xs ml-1.5 px-2 py-0.5 rounded-md font-semibold bg-ocean-50 text-ocean-700 border border-ocean-100">
              Pro
            </span>
          </div>
        </div>

        {/* Workspace Dropdown */}
        <div className="relative" ref={workspaceMenuRef}>
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-ink-main bg-canvas hover:bg-forest-50/50 rounded-lg border border-edge transition"
          >
            <Briefcase className="w-4 h-4 text-forest-600" />
            <span className="max-w-[140px] truncate">
              {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-edge py-2 z-50">
              <div className="px-3 py-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Workspaces
              </div>
              <div className="max-h-56 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      switchWorkspace(ws._id);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-forest-50 transition ${
                      ws._id === currentWorkspace?._id ? 'text-forest-700 font-semibold bg-forest-50/50' : 'text-ink-main'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws._id === currentWorkspace?._id && (
                      <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-ink-muted bg-canvas hover:bg-white rounded-xl border border-edge hover:border-ocean-300 transition shadow-sm group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-ink-muted group-hover:text-ocean-600 transition" />
            <span className="text-ink-muted">Search tasks, sections, tags...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-ink-muted bg-white border border-edge rounded shadow-xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right side: Action button and User menu */}
      <div className="flex items-center gap-3">
        {canEditWorkspace && (
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 active:scale-95 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        )}

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-canvas transition border border-transparent hover:border-edge"
          >
            <div className="w-8 h-8 rounded-lg bg-earth-100 text-earth-700 flex items-center justify-center font-semibold text-sm border border-earth-200">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-ink-main leading-none">{user?.name}</span>
              <span className="text-[10px] font-medium text-ink-muted mt-0.5">
                {userWorkspaceRole}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-edge py-2 z-50">
              <div className="px-4 py-2 border-b border-edge">
                <p className="text-sm font-semibold text-ink-main">{user?.name}</p>
                <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                <div className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-ocean-50 text-ocean-700 border border-ocean-200">
                  Workspace Role: {userWorkspaceRole}
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
