import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Check,
  Plus,
  Layers,
  FileText,
  Zap,
  BarChart3,
  Users,
  Timer,
  Download,
  ArrowRight,
  Copy,
  Globe,
  Lock,
  Calendar,
} from 'lucide-react';
import {
  TaskItem,
  ProjectItem,
  WorkspaceNote,
  AutomationRule,
} from '../data/zendoCopy';

export type WorkspaceSection =
  | 'tasks'
  | 'board'
  | 'projects'
  | 'notes'
  | 'automations'
  | 'insights'
  | 'team';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  projects: ProjectItem[];
  notes: WorkspaceNote[];
  automations: AutomationRule[];
  onNavigateView: (view: 'website' | 'auth' | 'dashboard') => void;
  onSelectWorkspaceSection: (section: WorkspaceSection) => void;
  onInspectTask: (taskId: string) => void;
  onQuickCreateTask: (title: string) => void;
  onSelectProject: (projectName: string) => void;
  onSelectNote: (noteId: string) => void;
  onRunAutomation: (ruleId: string) => void;
  onStartFocusTimer: () => void;
  onExportCsv: () => void;
  onOpenCopyKit: () => void;
}

interface CommandItem {
  id: string;
  category: 'Quick Actions' | 'Tasks' | 'Projects' | 'Notes' | 'Automations';
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  notes,
  automations,
  onNavigateView,
  onSelectWorkspaceSection,
  onInspectTask,
  onQuickCreateTask,
  onSelectProject,
  onSelectNote,
  onRunAutomation,
  onStartFocusTimer,
  onExportCsv,
  onOpenCopyKit,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const allItems: CommandItem[] = [
    ...(query.trim().length > 2
      ? [
          {
            id: 'quick-add-task',
            category: 'Quick Actions' as const,
            title: `Create task: "${query.trim()}"`,
            subtitle: 'Add directly to Today’s Tasks priority queue',
            icon: Plus,
            onSelect: () => {
              onQuickCreateTask(query.trim());
              onClose();
            },
          },
        ]
      : []),
    {
      id: 'act-tasks',
      category: 'Quick Actions',
      title: 'Go to Today’s Tasks & Overview',
      subtitle: 'Workspace · Unified priority queue',
      icon: Check,
      onSelect: () => {
        onNavigateView('dashboard');
        onSelectWorkspaceSection('tasks');
        onClose();
      },
    },
    {
      id: 'act-board',
      category: 'Quick Actions',
      title: 'Open Kanban Workflow Board',
      subtitle: 'Workspace · Today / In Progress / Completed columns',
      icon: Layers,
      onSelect: () => {
        onNavigateView('dashboard');
        onSelectWorkspaceSection('board');
        onClose();
      },
    },
    {
      id: 'act-notes',
      category: 'Quick Actions',
      title: 'Open Workspace Notes & Docs',
      subtitle: 'Workspace · Project briefs & async updates',
      icon: FileText,
      onSelect: () => {
        onNavigateView('dashboard');
        onSelectWorkspaceSection('notes');
        onClose();
      },
    },
    {
      id: 'act-automations',
      category: 'Quick Actions',
      title: 'Manage Workflow Automations',
      subtitle: 'Workspace · IF → THEN rules & routine triggers',
      icon: Zap,
      onSelect: () => {
        onNavigateView('dashboard');
        onSelectWorkspaceSection('automations');
        onClose();
      },
    },
    {
      id: 'act-insights',
      category: 'Quick Actions',
      title: 'View Productivity Overview & Velocity Insights',
      subtitle: 'Workspace · 16-day cadence & completion metrics',
      icon: BarChart3,
      onSelect: () => {
        onNavigateView('dashboard');
        onSelectWorkspaceSection('insights');
        onClose();
      },
    },
    {
      id: 'act-team',
      category: 'Quick Actions',
      title: 'Team Collaboration & Plan Billing',
      subtitle: 'Workspace · Members, roles, Free / Pro / Team plans',
      icon: Users,
      onSelect: () => {
        onNavigateView('dashboard');
        onSelectWorkspaceSection('team');
        onClose();
      },
    },
    {
      id: 'act-meetings',
      category: 'Quick Actions',
      title: 'Meetings & Client Video Scheduling',
      subtitle: 'Meetings · Proposal walkthroughs, discovery calls & booking links',
      icon: Calendar,
      onSelect: () => {
        onNavigateView('dashboard');
        onClose();
      },
    },
    {
      id: 'act-timer',
      category: 'Quick Actions',
      title: 'Start 25-Minute Calm Focus Session',
      subtitle: 'Work without distractions · Deep flow timer',
      icon: Timer,
      onSelect: () => {
        onNavigateView('dashboard');
        onStartFocusTimer();
        onClose();
      },
    },
    {
      id: 'act-export',
      category: 'Quick Actions',
      title: 'Export Workspace Tasks & Metrics (CSV)',
      subtitle: 'Download live snapshot of all tasks and statuses',
      icon: Download,
      onSelect: () => {
        onExportCsv();
        onClose();
      },
    },
    {
      id: 'act-copykit',
      category: 'Quick Actions',
      title: 'Open Zendo Lite Website Copy Kit',
      subtitle: 'All headlines, taglines, dashboard & auth copy',
      icon: Copy,
      onSelect: () => {
        onOpenCopyKit();
        onClose();
      },
    },
    {
      id: 'act-website',
      category: 'Quick Actions',
      title: 'Switch to Marketing Website',
      subtitle: 'Metrivello-styled Zendo Lite landing experience',
      icon: Globe,
      onSelect: () => {
        onNavigateView('website');
        onClose();
      },
    },
    {
      id: 'act-auth',
      category: 'Quick Actions',
      title: 'Switch to Authentication Page',
      subtitle: 'Welcome to a calmer way to work · Login & Signup',
      icon: Lock,
      onSelect: () => {
        onNavigateView('auth');
        onClose();
      },
    },
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      category: 'Tasks' as const,
      title: task.title,
      subtitle: `${task.project} · ${task.priority} Priority · ${task.assignee}`,
      icon: Check,
      onSelect: () => {
        onNavigateView('dashboard');
        onInspectTask(task.id);
        onClose();
      },
    })),
    ...projects.map((proj) => ({
      id: `proj-${proj.id}`,
      category: 'Projects' as const,
      title: proj.name,
      subtitle: `${proj.completionRate}% complete · Lead: ${proj.lead}`,
      icon: Layers,
      onSelect: () => {
        onNavigateView('dashboard');
        onSelectProject(proj.name);
        onClose();
      },
    })),
    ...notes.map((note) => ({
      id: `note-${note.id}`,
      category: 'Notes' as const,
      title: note.title,
      subtitle: `${note.project} · Updated ${note.updatedAt}`,
      icon: FileText,
      onSelect: () => {
        onNavigateView('dashboard');
        onSelectNote(note.id);
        onClose();
      },
    })),
    ...automations.map((rule) => ({
      id: `auto-${rule.id}`,
      category: 'Automations' as const,
      title: `Run Rule: ${rule.name}`,
      subtitle: `${rule.trigger} → ${rule.action}`,
      icon: Zap,
      onSelect: () => {
        onNavigateView('dashboard');
        onRunAutomation(rule.id);
        onClose();
      },
    })),
  ];

  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : 0
        );
      } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
        e.preventDefault();
        filteredItems[selectedIndex].onSelect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-[#101c19]/45 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Zendo Command Palette"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-[24px] border border-[#dce9e2] shadow-2xl overflow-hidden"
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e1e9e4]">
              <Search className="w-4 h-4 text-[#0c9256] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, search tasks, notes, projects, or create a task..."
                className="w-full text-sm text-[#101c19] placeholder:text-[#7c8a81] focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={onClose}
                className="px-2 py-1 text-[11px] font-mono-tabular text-[#596960] bg-[#f0f7f3] rounded-md border border-[#e1e9e4] hover:text-[#101c19] cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[420px] overflow-y-auto p-2.5 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="py-12 px-6 text-center space-y-3">
                  <p className="text-sm font-medium text-[#101c19]">
                    No matching commands or tasks found.
                  </p>
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        onQuickCreateTask(query.trim());
                        onClose();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#0c9256] rounded-full hover:bg-[#087443] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create task &ldquo;{query.trim()}&rdquo;</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredItems.slice(0, 18).map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={item.onSelect}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#e8f7ee] text-[#101c19]'
                          : 'text-[#101c19] hover:bg-[#f5f9f7]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#0c9256] text-white'
                              : 'bg-[#f0f7f3] text-[#3d5950]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-[#596960] truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium text-[#64776a] uppercase tracking-wider">
                          {item.category}
                        </span>
                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected
                              ? 'text-[#0c9256] translate-x-0.5'
                              : 'text-[#7c8a81]'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Shortcuts */}
            <div className="px-5 py-3 bg-[#f5f9f7] border-t border-[#e1e9e4] flex items-center justify-between text-[11px] text-[#596960]">
              <div className="flex items-center gap-4">
                <span>
                  <strong className="font-mono-tabular text-[#101c19]">↑↓</strong>{' '}
                  Navigate
                </span>
                <span>
                  <strong className="font-mono-tabular text-[#101c19]">↵</strong>{' '}
                  Execute
                </span>
                <span>
                  <strong className="font-mono-tabular text-[#101c19]">ESC</strong>{' '}
                  Close
                </span>
              </div>
              <span className="hidden sm:inline text-[#0c9256] font-medium">
                Zendo Workspace Command Bar
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
