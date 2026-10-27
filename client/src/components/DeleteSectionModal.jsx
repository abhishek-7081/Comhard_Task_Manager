import React, { useState } from 'react';
import api from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { AlertTriangle, X, ArrowRight, Trash2 } from 'lucide-react';

export const DeleteSectionModal = ({ isOpen, onClose, section, onDeleted }) => {
  const { sections, fetchSections } = useWorkspace();
  const toast = useToast();

  const [strategy, setStrategy] = useState('reassign'); // 'reassign' or 'cascade'
  const [targetSectionId, setTargetSectionId] = useState('');
  const [confirmCascade, setConfirmCascade] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !section) return null;

  const taskCount = section.stats?.totalTasks || 0;
  const otherSections = sections.filter((s) => s._id !== section._id);

  const handleDelete = async () => {
    if (taskCount > 0) {
      if (strategy === 'reassign' && !targetSectionId) {
        toast.error('Please choose a destination section to reassign tasks');
        return;
      }
      if (strategy === 'cascade' && !confirmCascade) {
        toast.error('Please check the confirmation box to delete tasks with the section');
        return;
      }
    }

    try {
      setLoading(true);
      const res = await api.delete(`/sections/${section._id}`, {
        data: {
          strategy: taskCount > 0 ? strategy : undefined,
          targetSectionId: strategy === 'reassign' ? targetSectionId : undefined
        }
      });

      if (res.data.success) {
        toast.success('Section deleted successfully');
        fetchSections();
        onDeleted && onDeleted();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-main/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge bg-red-50/50">
          <div className="flex items-center gap-2.5 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-base font-bold">Delete Section: {section.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink-main hover:bg-canvas transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {taskCount > 0 ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                <strong>Attention:</strong> This section contains <strong>{taskCount} task(s)</strong>.
                To prevent accidental data loss, please select how to handle these tasks:
              </div>

              {/* Strategy Choice */}
              <div className="space-y-3">
                {/* Option 1: Reassign */}
                <label className={`block p-3.5 rounded-xl border cursor-pointer transition ${
                  strategy === 'reassign' ? 'border-forest-600 bg-forest-50/30' : 'border-edge hover:bg-canvas'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="deleteStrategy"
                      checked={strategy === 'reassign'}
                      onChange={() => setStrategy('reassign')}
                      className="mt-1 text-forest-600 focus:ring-forest-600"
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="text-sm font-semibold text-ink-main">
                        Reassign tasks to another section (Recommended)
                      </div>
                      <p className="text-xs text-ink-muted">
                        Tasks will keep all their timing, stage intervals, and history intact while moving to the selected section.
                      </p>

                      {strategy === 'reassign' && (
                        <div className="pt-2">
                          <select
                            value={targetSectionId}
                            onChange={(e) => setTargetSectionId(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-edge rounded-lg outline-none focus:border-forest-600"
                          >
                            <option value="">Select Target Section...</option>
                            {otherSections.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name} ({s.stats?.totalTasks || 0} tasks)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </label>

                {/* Option 2: Cascade Delete */}
                <label className={`block p-3.5 rounded-xl border cursor-pointer transition ${
                  strategy === 'cascade' ? 'border-red-500 bg-red-50/30' : 'border-edge hover:bg-canvas'
                }`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="deleteStrategy"
                      checked={strategy === 'cascade'}
                      onChange={() => setStrategy('cascade')}
                      className="mt-1 text-red-600 focus:ring-red-600"
                    />
                    <div className="space-y-2 flex-1">
                      <div className="text-sm font-semibold text-red-700">
                        Permanently delete this section and all {taskCount} tasks
                      </div>
                      <p className="text-xs text-ink-muted">
                        All tasks in this section will be permanently deleted from the database. This action cannot be undone.
                      </p>

                      {strategy === 'cascade' && (
                        <label className="flex items-center gap-2 pt-1 text-xs text-red-800 font-medium">
                          <input
                            type="checkbox"
                            checked={confirmCascade}
                            onChange={(e) => setConfirmCascade(e.target.checked)}
                            className="rounded text-red-600 focus:ring-red-600"
                          />
                          <span>I confirm that I want to delete all {taskCount} tasks</span>
                        </label>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted leading-relaxed">
              This section is currently empty and contains no tasks. Are you sure you want to delete it?
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-edge">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-ink-main hover:bg-canvas rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{loading ? 'Deleting...' : 'Delete Section'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
