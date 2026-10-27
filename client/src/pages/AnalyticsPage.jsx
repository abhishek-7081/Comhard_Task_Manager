import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  BarChart3, 
  TrendingUp, 
  Timer, 
  CheckCircle2, 
  Users, 
  PieChart as PieIcon,
  RefreshCw 
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AnalyticsPage = () => {
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
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentWorkspace?._id]);

  if (loading && !data) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600"></div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const charts = data?.charts || {};

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-main tracking-tight">
            Performance & Analytics
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Real-time stage durations, section averages, and SLA adherence statistics
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-ink-main bg-white hover:bg-canvas rounded-xl border border-edge shadow-xs transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-forest-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-edge">
          <span className="text-[11px] font-semibold text-ink-muted uppercase">Workspace Avg Time</span>
          <div className="text-xl font-bold font-mono text-earth-700 mt-1">
            {overview.workspaceAvgCompletionFormatted ?? '—'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-edge">
          <span className="text-[11px] font-semibold text-ink-muted uppercase">SLA Compliance Rate</span>
          <div className="text-xl font-bold text-forest-700 mt-1">
            {overview.completedSlaCompliance ?? 100}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-edge">
          <span className="text-[11px] font-semibold text-ink-muted uppercase">Total Completed Tasks</span>
          <div className="text-xl font-bold text-ink-main mt-1">
            {overview.doneTasks ?? 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-edge">
          <span className="text-[11px] font-semibold text-ink-muted uppercase">Total SLA Breaches</span>
          <div className={`text-xl font-bold ${(overview.totalSlaBreaches ?? 0) > 0 ? 'text-red-600' : 'text-forest-700'} mt-1`}>
            {overview.totalSlaBreaches ?? 0}
          </div>
        </div>
      </div>

      {/* Row 1: Section Average Completion Times Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-edge shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-forest-600" />
            <h3 className="text-base font-bold text-ink-main">
              Section Average Task Completion Time
            </h3>
          </div>
          <span className="text-xs text-ink-muted">Calculated from Authoritative Backend Timestamps</span>
        </div>

        <div className="h-72">
          {charts.sectionAnalytics?.some((s) => s.completedCount > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.sectionAnalytics} margin={{ top: 15, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E2" />
                <XAxis dataKey="sectionName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(val, name, item) => [
                    `${item.payload.avgCompletionFormatted} (${val} hours)`,
                    'Average Resolution Time'
                  ]}
                />
                <Bar dataKey="avgCompletionHours" fill="#2E7D5B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-ink-muted italic">
              No completed tasks recorded in sections yet (Displays "N/A" on empty)
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Team Workload Distribution & Stage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignee Workload */}
        <div className="bg-white p-6 rounded-2xl border border-edge shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ocean-600" />
            <h3 className="text-sm font-bold text-ink-main uppercase tracking-wider">
              Workload by Assignee
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.assigneeWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E2" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Allocated" stackId="a" fill="#8B6548" />
                <Bar dataKey="Working" stackId="a" fill="#3977C3" />
                <Bar dataKey="Done" stackId="a" fill="#2E7D5B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Velocity */}
        <div className="bg-white p-6 rounded-2xl border border-edge shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-forest-600" />
            <h3 className="text-sm font-bold text-ink-main uppercase tracking-wider">
              Daily Completed Tasks
            </h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.completionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E8E2" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stroke="#3977C3" fill="#3977C3" fillOpacity={0.2} strokeWidth={2} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
