import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { X } from 'lucide-react';

export const SectionModal = ({ isOpen, onClose, sectionToEdit = null, onSaved }) => {
  const { fetchSections } = useWorkspace();
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2E7D5B');
  const [loading, setLoading] = useState(false);

  const colorPresets = [
    '#2E7D5B', // Primary Green
    '#3977C3', // Primary Blue
    '#8B6548', // Warm Brown
    '#24312B', // Dark Ink
    '#D97706', // Amber
    '#7C3AED', // Purple
  ];

  useEffect(() => {
    if (sectionToEdit) {
      setName(sectionToEdit.name || '');
      setDescription(sectionToEdit.description || '');
      setColor(sectionToEdit.color || '#2E7D5B');
    } else {
      setName('');
      setDescription('');
      setColor('#2E7D5B');
    }
  }, [sectionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Section name is required');
      return;
    }

    try {
      setLoading(true);
      if (sectionToEdit) {
        const res = await api.patch(`/sections/${sectionToEdit._id}`, {
          name: name.trim(),
          description: description.trim(),
          color
        });
        if (res.data.success) {
          toast.success('Section updated successfully');
          fetchSections();
          onSaved && onSaved(res.data.section);
          onClose();
        }
      } else {
        const res = await api.post('/sections', {
          name: name.trim(),
          description: description.trim(),
          color
        });
        if (res.data.success) {
          toast.success('Section created successfully');
          fetchSections();
          onSaved && onSaved(res.data.section);
          onClose();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-main/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge bg-canvas/40">
          <h3 className="text-base font-bold text-ink-main">
            {sectionToEdit ? 'Edit Section' : 'Create New Section'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-muted hover:text-ink-main hover:bg-canvas transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
              Section Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Code Review, Operations, Testing"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe the category of tasks belonging to this section..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-edge rounded-xl focus:border-forest-600 focus:ring-1 focus:ring-forest-600 outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-main uppercase tracking-wider mb-2">
              Color Accent
            </label>
            <div className="flex items-center gap-3">
              {colorPresets.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    color === c ? 'scale-110 border-ink-main shadow-sm' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

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
              {loading ? 'Saving...' : sectionToEdit ? 'Save Changes' : 'Create Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
