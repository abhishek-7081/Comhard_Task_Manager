import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlobalSearchModal } from '../components/GlobalSearchModal';
import { TaskModal } from '../components/TaskModal';
import { SectionModal } from '../components/SectionModal';
import { TaskDetailsDrawer } from '../components/TaskDetailsDrawer';

export const MainLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [inspectedTaskId, setInspectedTaskId] = useState(null);

  // Keyboard shortcut Ctrl+K to open global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink-main">
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenNewTask={() => setNewTaskOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar onOpenNewSection={() => setNewSectionOpen(true)} />

        {/* Primary Content Outlet */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectTask={(taskId) => setInspectedTaskId(taskId)}
      />

      {/* Quick New Task Modal */}
      <TaskModal
        isOpen={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onSaved={() => {
          // Trigger reload if needed or handled by pages
          window.location.reload();
        }}
      />

      {/* Quick New Section Modal */}
      <SectionModal
        isOpen={newSectionOpen}
        onClose={() => setNewSectionOpen(false)}
      />

      {/* Inspected Task Details Drawer (from Global Search selection) */}
      {inspectedTaskId && (
        <TaskDetailsDrawer
          taskId={inspectedTaskId}
          onClose={() => setInspectedTaskId(null)}
          onTaskUpdated={() => {}}
          onEditTask={() => {}}
          onDeleteTask={() => {
            setInspectedTaskId(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
