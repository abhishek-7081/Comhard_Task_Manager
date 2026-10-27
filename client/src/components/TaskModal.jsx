import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { X, Clock, AlertCircle } from 'lucide-react';

export const TaskModal = ({ isOpen, onClose, taskToEdit = null, defaultSectionId = null, onSaved }) => {
  const { sections, currentWorkspace } = useWorkspace();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [slaPreset, setSlaPreset] = useState('120'); // in minutes
  const [customSlaMinutes, setCustomSlaMinutes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setSectionId(taskToEdit.section?._id || taskToEdit.section || '');
      setPriority(taskToEdit.priority || 'Medium');
      setAssigneeId(taskToEdit.assignee?._id || taskToEdit.assignee || '');
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split('T')[0] : '');
      
      const targetMins = taskToEdit.slaTargetMinutes || 120;
      if ([30, 120, 240, 480, 1440].includes(targetMins)) {
        setSlaPreset(String(targetMins));
        setCustomSlaMinutes('');
      } else {
        setSlaPreset('custom');
        setCustomSlaMinutes(String(targetMins));
      }

      setTagsInput(Array.isArray(taskToEdit.tags) ? taskToEdit.tags.join(', ') : '');
    } else {
      setTitle('');
      setDescription('');
      setSectionId(defaultSectionId || (sections[0]?._id || ''));
      setPriority('Medium');
      setAssigneeId('');
      setDueDate('');
      setSlaPreset('120');
      setCustomSlaMinutes('');
      setTagsInput('');
    }
  }, [taskToEdit, defaultSectionId, sections, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!sectionId) {
      toast.error('Please select a section');
      return;
    }

    const slaTarget = slaPreset === 'custom' ? Number(customSlaMinutes) || 120 : Number(slaPreset);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      section: sectionId,
      priority,
      assignee: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      slaTargetMinutes: slaTarget,
      tags
    };

    try {
      setLoading(true);
      if (taskToEdit) {
        const res = await api.patch(`/tasks/${taskToEdit._id}`, payload);
        if (res.data.success) {
          toast.success('Task updated successfully');
          onSaved(res.data.task);
          onClose();
        }
      } else {
        const res = await api.post('/tasks', payload);
        if (res.data.success) {
          toast.success('Task created successfully in Allocated stage');
          onSaved(res.data.task);
          onClose();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-main/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge bg-canvas/40">
          <h3 className="text-base font-bold text-ink-main">
            {taskToEdit ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink-main hover:bg-canvas transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 Refresh Logic"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide scope, acceptance criteria, or relevant technical context..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition resize-none"
            />
          </div>

          {/* Section & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                Section *
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
                required
              >
                <option value="" disabled>Select Section</option>
                {sections.map((sec) => (
                  <option key={sec._id} value={sec._id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* SLA Target Policy */}
          <div className="bg-canvas p-4 rounded-xl border border-edge space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink-main">
              <Clock className="w-4 h-4 text-forest-600" />
              <span>Service Level Agreement (SLA) Policy</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: '30 Mins', val: '30' },
                { label: '2 Hours (Std)', val: '120' },
                { label: '4 Hours', val: '240' },
                { label: '8 Hours', val: '480' },
                { label: '24 Hours', val: '1440' },
                { label: 'Custom', val: 'custom' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setSlaPreset(opt.val)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition text-center ${
                    slaPreset === opt.val
                      ? 'bg-forest-600 text-white border-forest-600'
                      : 'bg-white text-ink-main border-edge hover:bg-forest-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {slaPreset === 'custom' && (
              <div>
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                  Custom Target Duration (Minutes):
                </label>
                <input
                  type="number"
                  min="5"
                  max="10000"
                  value={customSlaMinutes}
                  onChange={(e) => setCustomSlaMinutes(e.target.value)}
                  placeholder="e.g. 90"
                  className="w-full px-3 py-2 text-sm bg-white border border-edge rounded-lg outline-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Due Date & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              >
                <option value="">Unassigned</option>
                {currentWorkspace?.members?.map((m) => (
                  <option key={m.user?._id || m.user} value={m.user?._id || m.user}>
                    {m.user?.name || 'Workspace Member'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Backend, Security, Database"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-edge">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-ink-main hover:bg-canvas rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 active:scale-95 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
