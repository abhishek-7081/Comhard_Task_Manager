import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { SectionModal } from '../components/SectionModal';
import { DeleteSectionModal } from '../components/DeleteSectionModal';
import { 
  FolderKanban, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  MoveUp,
  MoveDown
} from 'lucide-react';
import api from '../services/api';

export const SectionsPage = () => {
  const { sections, fetchSections, isWorkspaceAdmin } = useWorkspace();
  const toast = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  const moveOrder = async (index, direction) => {
    if (!isWorkspaceAdmin) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const payload = newSections.map((sec, idx) => ({ id: sec._id, order: idx }));

    try {
      const res = await api.post('/sections/reorder', { sectionOrders: payload });
      if (res.data.success) {
        toast.success('Sections reordered');
        fetchSections();
      }
    } catch (err) {
      toast.error('Failed to reorder sections');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-main tracking-tight">
            Section Management
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Organize workflow stages, track completion metrics, and calculate section average resolution times
          </p>
        </div>

        {isWorkspaceAdmin && (
          <button
            onClick={() => {
              setSectionToEdit(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-forest-600 hover:bg-forest-700 active:scale-95 rounded-xl shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Section</span>
          </button>
        )}
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec, idx) => (
          <div
            key={sec._id}
            className="bg-white rounded-2xl border border-edge shadow-xs p-6 flex flex-col justify-between space-y-5"
          >
            {/* Top Row: Name, color tag, edit/delete actions */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <span
                  className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: sec.color || '#2E7D5B' }}
                />
                <div>
                  <h3 className="text-lg font-bold text-ink-main">{sec.name}</h3>
                  {sec.description && (
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      {sec.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {isWorkspaceAdmin && (
                  <>
                    <button
                      onClick={() => moveOrder(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 text-ink-muted hover:text-ink-main disabled:opacity-30 rounded hover:bg-canvas transition"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveOrder(idx, 1)}
                      disabled={idx === sections.length - 1}
                      className="p-1.5 text-ink-muted hover:text-ink-main disabled:opacity-30 rounded hover:bg-canvas transition"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSectionToEdit(sec);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-ink-muted hover:text-ocean-600 rounded hover:bg-ocean-50 transition"
                      title="Edit Section"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSectionToDelete(sec)}
                      className="p-1.5 text-ink-muted hover:text-red-600 rounded hover:bg-red-50 transition"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Metrics Breakdown Grid (Prompt Section 3 & 10) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-edge/70">
              <div className="bg-canvas p-2.5 rounded-xl border border-edge text-center">
                <span className="text-[10px] text-ink-muted block uppercase font-medium">Total Tasks</span>
                <span className="text-base font-bold text-ink-main">{sec.stats?.totalTasks ?? 0}</span>
              </div>
              <div className="bg-canvas p-2.5 rounded-xl border border-edge text-center">
                <span className="text-[10px] text-ink-muted block uppercase font-medium">In Working</span>
                <span className="text-base font-bold text-ocean-700">{sec.stats?.workingTasks ?? 0}</span>
              </div>
              <div className="bg-canvas p-2.5 rounded-xl border border-edge text-center">
                <span className="text-[10px] text-ink-muted block uppercase font-medium">Done</span>
                <span className="text-base font-bold text-forest-700">{sec.stats?.doneTasks ?? 0}</span>
              </div>
              <div className="bg-canvas p-2.5 rounded-xl border border-edge text-center">
                <span className="text-[10px] text-ink-muted block uppercase font-medium">Overdue</span>
                <span className={`text-base font-bold ${(sec.stats?.overdueTasks ?? 0) > 0 ? 'text-red-600' : 'text-ink-main'}`}>
                  {sec.stats?.overdueTasks ?? 0}
                </span>
              </div>
            </div>

            {/* Performance Bar: Average Task Completion Time & SLA Compliance */}
            <div className="bg-forest-50/50 p-3.5 rounded-xl border border-forest-100 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-ink-muted block uppercase font-semibold">
                  Avg Completion Time
                </span>
                <span className="font-mono font-bold text-sm text-forest-800">
                  {sec.stats?.avgCompletionTimeFormatted ?? 'N/A'}
                </span>
              </div>

              <div className="text-right space-y-0.5">
                <span className="text-[10px] text-ink-muted block uppercase font-semibold">
                  SLA Compliance
                </span>
                <span className="font-bold text-sm text-forest-700">
                  {sec.stats?.slaCompliancePercentage ?? 100}%
                </span>
              </div>
            </div>

            {/* View Section Tasks Button */}
            <button
              onClick={() => navigate(`/tasks?section=${sec._id}`)}
              className="w-full py-2.5 text-xs font-semibold text-ocean-700 hover:text-ocean-800 bg-ocean-50/60 hover:bg-ocean-100 rounded-xl border border-ocean-200/80 flex items-center justify-center gap-1.5 transition"
            >
              <span>View Tasks in {sec.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="col-span-full py-16 text-center text-ink-muted bg-white rounded-2xl border border-edge">
            <FolderKanban className="w-8 h-8 text-forest-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-ink-main">No sections found</h3>
            <p className="text-xs text-ink-muted mt-1">Create your first section to organize tasks</p>
          </div>
        )}
      </div>

      {/* Section Create / Edit Modal */}
      <SectionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSectionToEdit(null);
        }}
        sectionToEdit={sectionToEdit}
      />

      {/* Safe Section Deletion Modal */}
      <DeleteSectionModal
        isOpen={!!sectionToDelete}
        onClose={() => setSectionToDelete(null)}
        section={sectionToDelete}
      />
    </div>
  );
};
