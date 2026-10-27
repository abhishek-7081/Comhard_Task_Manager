import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Search, X, FolderKanban, CheckSquare, Loader2, ArrowRight } from 'lucide-react';
import { getPriorityBadgeClass } from '../utils/slaUtils';

export const GlobalSearchModal = ({ isOpen, onClose, onSelectTask }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ sections: [], tasks: [] });
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ sections: [], tasks: [] });
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ sections: [], tasks: [] });
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success) {
          setResults(res.data.results);
          setHasSearched(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResults = results.sections.length + results.tasks.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-ink-main/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-edge overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-edge">
          <Search className="w-5 h-5 text-ink-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all sections and tasks by name, tag, or description..."
            className="flex-1 text-base text-ink-main placeholder:text-ink-muted bg-transparent outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 text-ocean-600 animate-spin" />}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-ink-muted hover:text-ink-main transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-medium text-ink-muted bg-canvas hover:bg-forest-50 px-2 py-1 rounded-md border border-edge"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
          {!hasSearched && !loading && (
            <div className="text-center py-10 text-ink-muted text-sm">
              Type keywords like <span className="font-semibold text-ocean-700">"API"</span>, <span className="font-semibold text-ocean-700">"Development"</span>, or <span className="font-semibold text-ocean-700">"Security"</span> to search globally.
            </div>
          )}

          {hasSearched && !loading && totalResults === 0 && (
            <div className="text-center py-12 text-ink-muted">
              <p className="text-sm font-medium">No results found for "{query}"</p>
              <p className="text-xs text-ink-muted mt-1">Try another keyword or search terms</p>
            </div>
          )}

          {/* Group 1: Sections Results */}
          {results.sections.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider px-2 mb-2">
                <FolderKanban className="w-3.5 h-3.5 text-forest-600" />
                <span>Sections ({results.sections.length})</span>
              </div>
              <div className="space-y-1">
                {results.sections.map((sec) => (
                  <div
                    key={sec._id}
                    onClick={() => {
                      navigate(`/tasks?section=${sec._id}`);
                      onClose();
                    }}
                    className="p-3 rounded-xl hover:bg-forest-50/60 border border-transparent hover:border-forest-200 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sec.color || '#2E7D5B' }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-ink-main group-hover:text-forest-700">
                          {sec.name}
                        </div>
                        {sec.description && (
                          <div className="text-xs text-ink-muted line-clamp-1">{sec.description}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-forest-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      Open Section <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group 2: Tasks Results (Clearly showing Parent Section) */}
          {results.tasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-ink-muted uppercase tracking-wider px-2 mb-2">
                <CheckSquare className="w-3.5 h-3.5 text-ocean-600" />
                <span>Tasks ({results.tasks.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => {
                      onSelectTask(task._id);
                      onClose();
                    }}
                    className="p-3 rounded-xl hover:bg-ocean-50/60 border border-edge hover:border-ocean-200 cursor-pointer transition flex items-start justify-between group"
                  >
                    <div className="space-y-1 flex-1 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink-main group-hover:text-ocean-700">
                          {task.title}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-canvas text-ink-muted border border-edge">
                          {task.currentStage}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-ink-muted line-clamp-1">{task.description}</p>
                      )}

                      {/* Parent Section Highlight (Mandatory requirement) */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-forest-700 pt-1">
                        <span className="text-ink-muted">Section:</span>
                        <span className="px-2 py-0.5 rounded bg-forest-50 border border-forest-200/80 font-semibold">
                          {task.section?.name || 'Unassigned Section'}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-ocean-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-1">
                      View Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
