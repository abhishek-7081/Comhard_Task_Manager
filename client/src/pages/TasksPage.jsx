import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { TaskDetailsDrawer } from '../components/TaskDetailsDrawer';
import { 
  List, 
  LayoutGrid, 
  Columns3, 
  FolderKanban, 
  Filter, 
  Search, 
  Plus, 
  Clock, 
  Calendar,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { formatDurationMs, calculateLiveStageDuration } from '../utils/timeFormat';
import { getSlaDisplayInfo, getPriorityBadgeClass } from '../utils/slaUtils';

export const TasksPage = () => {
  const { currentWorkspace, sections, fetchSections, canEditWorkspace } = useWorkspace();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Preferred view persisted in localStorage
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('taskFlow_preferredView') || 'list';
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSectionFilter, setSelectedSectionFilter] = useState(searchParams.get('section') || 'all');
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Modals & Drawers state
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [defaultSectionForNewTask, setDefaultSectionForNewTask] = useState(null);

  // Collapsible state for Section View
  const [collapsedSections, setCollapsedSections] = useState({});

  // Real-time tick for List view elapsed times
  const [tickTime, setTickTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTickTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('taskFlow_preferredView', mode);
  };

  // Sync URL query params with section filter
  useEffect(() => {
    const secParam = searchParams.get('section');
    if (secParam) {
      setSelectedSectionFilter(secParam);
    }
  }, [searchParams]);

  // Fetch all tasks for current workspace
  const fetchTasks = async () => {
    if (!currentWorkspace?._id) return;
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentWorkspace?._id]);

  // Stage transition handler
  const handleTransition = async (taskId, targetStage) => {
    const previousTasks = [...tasks];
    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, currentStage: targetStage } : t))
    );

    try {
      const res = await api.post(`/tasks/${taskId}/transitions`, { stage: targetStage });
      if (res.data.success) {
        toast.success(`Task moved to ${targetStage}`);
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
        );
        fetchSections(); // refresh section stats
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transition stage');
      setTasks(previousTasks); // Rollback on failure
    }
  };

  // Drag and Drop for Kanban View
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnStage = (e, targetStage) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      handleTransition(taskId, targetStage);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await api.delete(`/tasks/${taskId}`);
      if (res.data.success) {
        toast.success('Task deleted successfully');
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        setSelectedTaskId(null);
        fetchSections();
      }
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Section filter
      if (selectedSectionFilter !== 'all') {
        const secId = task.section?._id || task.section;
        if (secId !== selectedSectionFilter) return false;
      }
      // Stage filter
      if (selectedStageFilter !== 'all' && task.currentStage !== selectedStageFilter) {
        return false;
      }
      // Priority filter
      if (selectedPriorityFilter !== 'all' && task.priority !== selectedPriorityFilter) {
        return false;
      }
      // Search keyword
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(kw);
        const matchesDesc = (task.description || '').toLowerCase().includes(kw);
        const matchesTag = (task.tags || []).some((t) => t.toLowerCase().includes(kw));
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }
      return true;
    });
  }, [tasks, selectedSectionFilter, selectedStageFilter, selectedPriorityFilter, searchKeyword]);

  const toggleSectionCollapse = (secId) => {
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header: Title, Controls, View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-main tracking-tight">
            Task Management
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Switch between List, Grid, Kanban, and Section views with live stage timers
          </p>
        </div>

        {/* View Switcher Tabs (Prompt Section 8) */}
        <div className="flex items-center gap-1 p-1 bg-white border border-edge rounded-xl shadow-xs self-start md:self-auto">
          {[
            { id: 'list', label: 'List', icon: List },
            { id: 'grid', label: 'Grid', icon: LayoutGrid },
            { id: 'kanban', label: 'Kanban', icon: Columns3 },
            { id: 'section', label: 'Sections', icon: FolderKanban },
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => changeViewMode(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === mode.id
                    ? 'bg-forest-600 text-white shadow-xs'
                    : 'text-ink-muted hover:text-ink-main hover:bg-canvas'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-edge shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Filter tasks by name or tag..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas rounded-lg border border-edge outline-none focus:border-forest-600"
            />
          </div>

          {/* Section Filter */}
          <select
            value={selectedSectionFilter}
            onChange={(e) => {
              setSelectedSectionFilter(e.target.value);
              setSearchParams(e.target.value === 'all' ? {} : { section: e.target.value });
            }}
            className="px-3 py-1.5 text-xs bg-canvas rounded-lg border border-edge outline-none text-ink-main font-medium"
          >
            <option value="all">All Sections ({sections.length})</option>
            {sections.map((sec) => (
              <option key={sec._id} value={sec._id}>
                {sec.name}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={selectedStageFilter}
            onChange={(e) => setSelectedStageFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-canvas rounded-lg border border-edge outline-none text-ink-main font-medium"
          >
            <option value="all">All Stages</option>
            <option value="Allocated">Allocated</option>
            <option value="Working">Working (In Progress)</option>
            <option value="Done">Done (Completed)</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriorityFilter}
            onChange={(e) => setSelectedPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-canvas rounded-lg border border-edge outline-none text-ink-main font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Action Button */}
        {canEditWorkspace && (
          <button
            onClick={() => {
              setTaskToEdit(null);
              setDefaultSectionForNewTask(null);
              setTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 active:scale-95 rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-edge text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center mx-auto">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-ink-main">No tasks found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            No tasks match your selected filters or search terms. Try clearing filters or create a new task.
          </p>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* VIEW A: LIST VIEW (Clean Table)                                */}
          {/* ============================================================== */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-2xl border border-edge shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-canvas/80 border-b border-edge text-ink-muted font-semibold uppercase tracking-wider text-[11px]">
                      <th className="p-4">Task Title</th>
                      <th className="p-4">Section</th>
                      <th className="p-4">Current Stage</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Time in Stage</th>
                      <th className="p-4">SLA Status</th>
                      <th className="p-4">Assignee</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {filteredTasks.map((task) => {
                      const live = calculateLiveStageDuration(task, tickTime);
                      const sla = getSlaDisplayInfo(task, tickTime);
                      return (
                        <tr
                          key={task._id}
                          onClick={() => setSelectedTaskId(task._id)}
                          className="hover:bg-forest-50/40 cursor-pointer transition"
                        >
                          {/* Title */}
                          <td className="p-4 font-semibold text-ink-main max-w-[240px]">
                            <div className="truncate">{task.title}</div>
                            {task.description && (
                              <div className="text-[11px] text-ink-muted truncate font-normal">
                                {task.description}
                              </div>
                            )}
                          </td>

                          {/* Section */}
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-canvas border border-edge font-medium text-ink-muted">
                              {task.section?.name || 'Section'}
                            </span>
                          </td>

                          {/* Stage */}
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                                task.currentStage === 'Allocated'
                                  ? 'badge-allocated'
                                  : task.currentStage === 'Working'
                                  ? 'badge-working'
                                  : 'badge-done'
                              }`}
                            >
                              {task.currentStage}
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </td>

                          {/* Time in Stage (Authoritative Timer) */}
                          <td className="p-4 font-mono font-medium text-ink-main">
                            {task.currentStage === 'Done' ? (
                              <span className="text-forest-700 font-semibold" title="Total completion duration">
                                {formatDurationMs(task.completionDurationMs || 0)} (Done)
                              </span>
                            ) : (
                              <span>{live.currentStageDuration}</span>
                            )}
                          </td>

                          {/* SLA */}
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${sla.badgeClass}`}
                            >
                              {sla.text}
                            </span>
                          </td>

                          {/* Assignee */}
                          <td className="p-4 text-ink-muted">
                            {task.assignee ? (
                              <span className="text-ink-main font-medium">{task.assignee.name}</span>
                            ) : (
                              <span className="italic">Unassigned</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {canEditWorkspace && (
                                <>
                                  {task.currentStage === 'Allocated' && (
                                    <button
                                      onClick={() => handleTransition(task._id, 'Working')}
                                      className="px-2 py-1 text-[11px] font-semibold text-ocean-700 bg-ocean-50 hover:bg-ocean-100 rounded border border-ocean-200"
                                    >
                                      Start
                                    </button>
                                  )}
                                  {task.currentStage === 'Working' && (
                                    <button
                                      onClick={() => handleTransition(task._id, 'Done')}
                                      className="px-2 py-1 text-[11px] font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 rounded border border-forest-200"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  {task.currentStage === 'Done' && (
                                    <button
                                      onClick={() => handleTransition(task._id, 'Working')}
                                      className="px-2 py-1 text-[11px] font-medium text-earth-700 bg-earth-50 hover:bg-earth-100 rounded border border-earth-200"
                                    >
                                      Reopen
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW B: GRID VIEW (Card Grid)                                  */}
          {/* ============================================================== */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onSelect={(id) => setSelectedTaskId(id)}
                  onTransition={handleTransition}
                />
              ))}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW C: KANBAN VIEW (3 Columns: Allocated, Working, Done)       */}
          {/* ============================================================== */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {[
                { stage: 'Allocated', title: '1. Allocated', color: 'border-earth-500', badge: 'badge-allocated' },
                { stage: 'Working', title: '2. Working (In Progress)', color: 'border-ocean-600', badge: 'badge-working' },
                { stage: 'Done', title: '3. Done (Completed)', color: 'border-forest-600', badge: 'badge-done' },
              ].map((col) => {
                const columnTasks = filteredTasks.filter((t) => t.currentStage === col.stage);
                return (
                  <div
                    key={col.stage}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnStage(e, col.stage)}
                    className="bg-canvas rounded-2xl border border-edge p-4 flex flex-col space-y-3 min-h-[500px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-edge">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${col.badge}`}>
                          {col.title}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-ink-muted bg-white px-2 py-0.5 rounded-full border border-edge">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column Task List */}
                    <div className="space-y-3 flex-1">
                      {columnTasks.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onSelect={(id) => setSelectedTaskId(id)}
                          onTransition={handleTransition}
                          draggable={canEditWorkspace}
                          onDragStart={handleDragStart}
                        />
                      ))}

                      {columnTasks.length === 0 && (
                        <div className="h-32 border-2 border-dashed border-edge/80 rounded-xl flex items-center justify-center text-xs text-ink-muted italic">
                          Drop tasks here to move to {col.stage}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW D: SECTION VIEW (Containers with section stats)           */}
          {/* ============================================================== */}
          {viewMode === 'section' && (
            <div className="space-y-6">
              {sections.map((sec) => {
                const secTasks = filteredTasks.filter(
                  (t) => (t.section?._id || t.section) === sec._id
                );
                const isCollapsed = !!collapsedSections[sec._id];

                return (
                  <div
                    key={sec._id}
                    className="bg-white rounded-2xl border border-edge shadow-xs overflow-hidden"
                  >
                    {/* Section Header with full statistical breakdown */}
                    <div
                      onClick={() => toggleSectionCollapse(sec._id)}
                      className="p-5 bg-canvas/40 border-b border-edge flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-canvas transition"
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-ink-muted p-1">
                          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: sec.color || '#2E7D5B' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-ink-main">{sec.name}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-edge font-semibold text-ink-muted">
                              {secTasks.length} tasks
                            </span>
                          </div>
                          {sec.description && (
                            <p className="text-xs text-ink-muted mt-0.5">{sec.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Section Metrics Row (Prompt Section 3 & 10) */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-edge text-center">
                          <span className="text-[10px] text-ink-muted block uppercase">Allocated</span>
                          <span className="font-bold text-earth-700">{sec.stats?.allocatedTasks ?? 0}</span>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-edge text-center">
                          <span className="text-[10px] text-ink-muted block uppercase">Working</span>
                          <span className="font-bold text-ocean-700">{sec.stats?.workingTasks ?? 0}</span>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-edge text-center">
                          <span className="text-[10px] text-ink-muted block uppercase">Done</span>
                          <span className="font-bold text-forest-700">{sec.stats?.doneTasks ?? 0}</span>
                        </div>

                        {/* Average Task Completion Time (Critical requirement) */}
                        <div className="bg-white px-3.5 py-1.5 rounded-xl border border-edge text-center">
                          <span className="text-[10px] text-ink-muted block uppercase font-semibold">
                            Avg Completion Time
                          </span>
                          <span className="font-bold font-mono text-ink-main">
                            {sec.stats?.avgCompletionTimeFormatted ?? 'N/A'}
                          </span>
                        </div>

                        {/* SLA Compliance */}
                        <div className="bg-white px-3 py-1.5 rounded-xl border border-edge text-center">
                          <span className="text-[10px] text-ink-muted block uppercase">SLA Compliance</span>
                          <span className="font-bold text-forest-700">
                            {sec.stats?.slaCompliancePercentage ?? 100}%
                          </span>
                        </div>

                        {canEditWorkspace && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTaskToEdit(null);
                              setDefaultSectionForNewTask(sec._id);
                              setTaskModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Task</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Section Tasks content */}
                    {!isCollapsed && (
                      <div className="p-5">
                        {secTasks.length === 0 ? (
                          <div className="py-8 text-center text-xs text-ink-muted italic">
                            No tasks currently in this section.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {secTasks.map((task) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                onSelect={(id) => setSelectedTaskId(id)}
                                onTransition={handleTransition}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setTaskToEdit(null);
          setDefaultSectionForNewTask(null);
        }}
        taskToEdit={taskToEdit}
        defaultSectionId={defaultSectionForNewTask}
        onSaved={(savedTask) => {
          fetchTasks();
          fetchSections();
        }}
      />

      {/* Deep Task Details Drawer */}
      <TaskDetailsDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={(updatedTask) => {
          setTasks((prev) =>
            prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
          );
          fetchSections();
        }}
        onEditTask={(task) => {
          setTaskToEdit(task);
          setTaskModalOpen(true);
        }}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};
