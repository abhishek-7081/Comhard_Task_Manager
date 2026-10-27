import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  CheckSquare, 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Timer,
  PieChart as PieIcon,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';

export const Dashboard = () => {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!currentWorkspace?._id) return;
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentWorkspace?._id]);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-forest-600"></div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const charts = data?.charts || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-main tracking-tight">
            Workspace Dashboard
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Operational analytics, real-time stage tracking, and SLA compliance metrics
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink-main bg-white hover:bg-canvas rounded-xl border border-edge shadow-xs transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-forest-600' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-edge shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="text-2xl font-bold text-ink-main mt-1">
              {overview.totalTasks ?? 0}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              {overview.completionRate ?? 0}% completed overall
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center border border-forest-100">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Tasks in Progress (Working) */}
        <div className="bg-white p-5 rounded-2xl border border-edge shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              In Progress (Working)
            </span>
            <div className="text-2xl font-bold text-ocean-700 mt-1">
              {overview.workingTasks ?? 0}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              {overview.allocatedTasks ?? 0} awaiting work (Allocated)
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-ocean-50 text-ocean-700 flex items-center justify-center border border-ocean-100">
            <Play className="w-6 h-6" />
          </div>
        </div>

        {/* Overdue & Breaches */}
        <div className="bg-white p-5 rounded-2xl border border-edge shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Overdue / SLA Breaches
            </span>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {overview.totalSlaBreaches ?? 0}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              {overview.overdueTasks ?? 0} ongoing overdue
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Average Task Completion Time */}
        <div className="bg-white p-5 rounded-2xl border border-edge shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Avg Completion Time
            </span>
            <div className="text-xl font-bold text-earth-700 font-mono mt-1">
              {overview.workspaceAvgCompletionFormatted ?? '—'}
            </div>
            <div className="text-[11px] text-ink-muted mt-1">
              {overview.completedSlaCompliance ?? 100}% completed in SLA
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-earth-50 text-earth-700 flex items-center justify-center border border-earth-100">
            <Timer className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Tasks by Stage & Tasks by Priority) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Stage (Donut) */}
        <div className="bg-white p-6 rounded-2xl border border-edge shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-main uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-forest-600" />
              <span>Three-Stage Workflow Distribution</span>
            </h3>
            <span className="text-xs text-ink-muted">Allocated • Working • Done</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {charts.stageDistribution?.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.stageDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {charts.stageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-ink-muted italic">No tasks created yet</div>
            )}
          </div>
        </div>

        {/* Average Completion Time by Section (Bar Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-edge shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-main uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-ocean-600" />
              <span>Average Task Completion Time by Section</span>
            </h3>
            <span className="text-xs text-ink-muted">In Hours (Completed Tasks)</span>
          </div>

          <div className="h-64">
            {charts.sectionAnalytics?.some((s) => s.completedCount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.sectionAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E2" />
                  <XAxis dataKey="sectionName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${item.payload.avgCompletionFormatted} (${val} hrs)`,
                      'Average Completion Time'
                    ]}
                  />
                  <Bar dataKey="avgCompletionHours" fill="#3977C3" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-ink-muted italic">
                No completed tasks recorded in sections yet (Shows "N/A" on empty)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Priority breakdown and Completion trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-edge shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-ink-main uppercase tracking-wider">
            Tasks by Priority Level
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.priorityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E2" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2E7D5B" radius={[6, 6, 0, 0]}>
                  {charts.priorityDistribution?.map((entry, index) => (
                    <Cell key={`cell-p-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Velocity / Completion Trend (Area Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-edge shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-ink-main uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-forest-600" />
            <span>Task Completion Velocity (Last 14 Days)</span>
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.completionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E7D5B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2E7D5B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E2" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stroke="#2E7D5B" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
