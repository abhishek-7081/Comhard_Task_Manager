import React from 'react';
import { NavLink } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban, 
  BarChart3, 
  Plus, 
  Hash,
  Database
} from 'lucide-react';

export const Sidebar = ({ onOpenNewSection }) => {
  const { sections, isWorkspaceAdmin } = useWorkspace();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'All Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Sections', path: '/sections', icon: FolderKanban },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-edge flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Primary Navigation Links */}
      <div className="p-4 space-y-1">
        <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-forest-50 text-forest-700 font-semibold border border-forest-200/60 shadow-xs'
                    : 'text-ink-main hover:bg-canvas hover:text-forest-700'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="h-px bg-edge mx-4 my-2" />

      {/* Workspace Sections quick links */}
      <div className="flex-1 px-4 py-2 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Sections ({sections.length})
          </span>
          {isWorkspaceAdmin && (
            <button
              onClick={onOpenNewSection}
              className="p-1 text-ink-muted hover:text-forest-600 hover:bg-forest-50 rounded transition"
              title="Add Section"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {sections.map((sec) => (
            <NavLink
              key={sec._id}
              to={`/tasks?section=${sec._id}`}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-forest-50/70 text-forest-800 font-semibold'
                    : 'text-ink-main hover:bg-canvas'
                }`
              }
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sec.color || '#2E7D5B' }}
                />
                <span className="truncate">{sec.name}</span>
              </div>
              <span className="text-[10px] text-ink-muted bg-canvas px-1.5 py-0.5 rounded border border-edge">
                {sec.stats?.totalTasks || 0}
              </span>
            </NavLink>
          ))}

          {sections.length === 0 && (
            <div className="text-xs text-ink-muted px-3 py-2 italic">
              No sections created yet.
            </div>
          )}
        </div>
      </div>

      {/* Footer system status */}
      <div className="p-4 border-t border-edge bg-canvas/40">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Database className="w-3.5 h-3.5 text-forest-600" />
          <span>MongoDB Live Connected</span>
          <span className="w-2 h-2 rounded-full bg-forest-500 animate-pulse ml-auto" />
        </div>
      </div>
    </aside>
  );
};
