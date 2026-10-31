import React, { useState } from 'react';
import {
  Home,
  CheckSquare,
  Folder,
  Calendar,
  Zap,
  BarChart2,
  Settings,
  Plus,
  List,
  Check,
  Clock,
  ChevronRight,
  ChevronLeft,
  Lock,
  Share,
  Copy,
  PanelLeft,
  Rocket,
  FileText,
  Users,
  Presentation,
  MoreHorizontal,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { ZendoLogo } from './ZendoLogo';
import { TaskItem, ProjectItem, ZENDO_COPY } from '../data/zendoCopy';
import { WorkspaceSection } from './CommandPalette';

interface ZendoHeroShowcaseProps {
  userName: string;
  tasks: TaskItem[];
  projects: ProjectItem[];
  onOpenWorkspace: (section?: WorkspaceSection) => void;
  onQuickAddTask: () => void;
  onToggleTaskStatus: (id: string) => void;
}

const WEEK_BARS = [
  { day: 'Mon', count: 3, baseHeight: 30, capHeight: 12 },
  { day: 'Tue', count: 5, baseHeight: 48, capHeight: 16 },
  { day: 'Wed', count: 2, baseHeight: 18, capHeight: 10 },
  { day: 'Thu', count: 6, baseHeight: 62, capHeight: 14 },
  { day: 'Fri', count: 2, baseHeight: 18, capHeight: 10 },
];

const UPCOMING_ITEMS = [
  {
    id: 'up-1',
    title: 'Client presentation',
    time: 'Today, 10:00 AM',
    bg: 'bg-[#f0eefc]',
    iconColor: 'text-[#5b4bc4]',
    icon: Presentation,
  },
  {
    id: 'up-2',
    title: 'Review campaign brief',
    time: 'Today, 2:00 PM',
    bg: 'bg-[#e9f2ec]',
    iconColor: 'text-[#49725b]',
    icon: FileText,
  },
  {
    id: 'up-3',
    title: 'Team stand-up',
    time: 'Tomorrow, 9:00 AM',
    bg: 'bg-[#f0eefc]',
    iconColor: 'text-[#5b4bc4]',
    icon: Users,
  },
];

const PRIORITY_CARDS = [
  {
    id: 'pri-1',
    title: 'Website redesign',
    subtitle: 'Design • 8 tasks',
    progress: 60,
    extraCount: '+2',
    iconBg: 'bg-[#e9f2ec]',
    iconColor: 'text-[#49725b]',
    type: 'window' as const,
    avatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'pri-2',
    title: 'Product launch',
    subtitle: 'Strategy • 12 tasks',
    progress: 42,
    extraCount: '+3',
    iconBg: 'bg-[#f0eefc]',
    iconColor: 'text-[#5b4bc4]',
    type: 'rocket' as const,
    avatars: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'pri-3',
    title: 'Content system',
    subtitle: 'Marketing • 6 tasks',
    progress: 80,
    extraCount: '+1',
    iconBg: 'bg-[#e9f2ec]',
    iconColor: 'text-[#49725b]',
    type: 'doc' as const,
    avatars: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80',
    ],
  },
];

export const ZendoHeroShowcase: React.FC<ZendoHeroShowcaseProps> = ({
  userName,
  tasks,
  onOpenWorkspace,
  onToggleTaskStatus,
}) => {
  const [activeNav, setActiveNav] = useState<
    'overview' | 'tasks' | 'projects' | 'calendar' | 'automations' | 'analytics' | 'settings'
  >('overview');

  const firstName = userName.split(' ')[0] || 'Alex';
  const todayCount = tasks.filter((t) => t.status === 'today').length + 10;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length + 3;
  const completedCount = tasks.filter((t) => t.status === 'completed').length + 26;

  return (
    <div className="relative z-10 w-full max-w-[1180px] mx-auto mt-12 sm:mt-14 mb-4 rounded-[22px] sm:rounded-[26px] bg-[#f4f5f3] border border-white/90 shadow-[0_28px_80px_rgba(16,28,25,0.20)] overflow-hidden">
      {/* =====================================================================
          1. MACOS SAFARI BROWSER WINDOW TOP BAR (app.zendo.com)
      ===================================================================== */}
      <div className="h-11 sm:h-12 px-4 sm:px-5 bg-[#f2f3f1] border-b border-[#e5e8e5] flex items-center justify-between gap-4 select-none">
        {/* Left: Traffic Lights + Sidebar Icon + Back/Forward */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="hidden sm:flex items-center gap-2.5 text-[#7a827e]">
            <PanelLeft className="w-4 h-4" />
            <ChevronLeft className="w-4 h-4 opacity-60" />
            <ChevronRight className="w-4 h-4 opacity-40" />
          </div>
        </div>

        {/* Center: URL Address Pill (app.zendo.com) */}
        <button
          type="button"
          onClick={() => onOpenWorkspace('tasks')}
          className="flex-1 max-w-[440px] h-7 sm:h-7.5 px-3 rounded-lg bg-[#e4e6e4] hover:bg-[#dcdfdc] transition-colors flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#222b27] cursor-pointer"
          title="Click to open full interactive Zendo Workspace"
        >
          <Lock className="w-3 h-3 text-[#68726d]" />
          <span>app.zendo.com</span>
        </button>

        {/* Right: Browser Action Icons */}
        <div className="hidden sm:flex items-center gap-3 text-[#68726d]">
          <Share className="w-3.5 h-3.5" />
          <Plus className="w-4 h-4" />
          <Copy className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* =====================================================================
          2. ZENDO APPLICATION BODY (SIDEBAR + MAIN OVERVIEW CANVAS)
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#fcfdfc] text-[#111c24]">
        {/* LEFT SIDEBAR (Matches zendo-dashboard-with-logo.png 1:1) */}
        <div className="lg:col-span-3 xl:col-span-2 bg-[#f8f9f7] border-b lg:border-b-0 lg:border-r border-[#ecefec] p-4 sm:p-5 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Zendo Double-Parallelogram Logo + Serif Wordmark */}
            <button
              type="button"
              onClick={() => onOpenWorkspace('tasks')}
              className="flex items-center gap-2.5 px-1 pt-1 text-left cursor-pointer group"
            >
              <ZendoLogo
                className="w-7 h-7 shrink-0 transition-transform group-hover:scale-105"
                color="#0d1916"
              />
              <span className="text-[22px] font-bold tracking-[-0.02em] text-[#0d1916] font-serif">
                Zendo
              </span>
            </button>

            {/* 7 Sidebar Navigation Items */}
            <nav aria-label="Showcase sidebar navigation" className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: Home, section: 'tasks' as WorkspaceSection },
                { id: 'tasks', label: 'My Tasks', icon: CheckSquare, section: 'tasks' as WorkspaceSection },
                { id: 'projects', label: 'Projects', icon: Folder, section: 'projects' as WorkspaceSection },
                { id: 'calendar', label: 'Calendar', icon: Calendar, section: 'board' as WorkspaceSection },
                { id: 'automations', label: 'Automations', icon: Zap, section: 'automations' as WorkspaceSection },
                { id: 'analytics', label: 'Analytics', icon: BarChart2, section: 'insights' as WorkspaceSection },
                { id: 'settings', label: 'Settings', icon: Settings, section: 'team' as WorkspaceSection },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id as typeof activeNav);
                    }}
                    onDoubleClick={() => onOpenWorkspace(item.section)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#e8efe8] text-[#182c23] font-semibold'
                        : 'text-[#4e5a54] hover:bg-[#eff3ef] hover:text-[#182c23]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#39664d]' : 'text-[#5b6761]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Botanical "Stay in flow." Card */}
          <div className="p-4 rounded-2xl bg-[#eaefea] border border-[#dfe7df] space-y-3">
            {/* Botanical Sprout Leaf SVG */}
            <svg
              viewBox="0 0 48 44"
              className="w-10 h-9"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M24 42V18"
                stroke="#4d755b"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M24 28C14 28 8 21 10 11C19 11 24 18 24 28Z"
                fill="#7ca086"
              />
              <path
                d="M24 22C33 22 40 15 38 6C29 6 24 13 24 22Z"
                fill="#558066"
              />
              <path
                d="M24 16C20 10 21 3 25 1C29 3 30 10 24 16Z"
                fill="#8fb097"
              />
            </svg>

            <div className="space-y-1">
              <p className="text-[16px] font-semibold text-[#2b543e] tracking-tight">
                Stay in flow.
              </p>
              <p className="text-[11.5px] text-[#55665d] leading-snug">
                Small steps
                <br />
                create big progress.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenWorkspace('tasks')}
              className="w-full py-2 px-3 rounded-xl bg-[#d6e1d7] hover:bg-[#c7d6c9] text-[#1f3529] text-[11.5px] font-semibold inline-flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Find your focus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* MAIN RIGHT WORKSPACE CANVAS */}
        <div className="lg:col-span-9 xl:col-span-10 p-6 sm:p-8 space-y-6 bg-[#fcfdfc]">
          {/* Top Greeting & "+ New task" CTA Button */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-[31px] font-bold tracking-[-0.025em] text-[#111c24] leading-tight">
                Good morning, {firstName}
              </h2>
              <p className="text-sm text-[#68737d] mt-1">
                Here’s your focus for today.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenWorkspace('team')}
              className="px-4 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs sm:text-[13px] font-medium inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>New client</span>
            </button>
          </div>

          {/* 4 KPI Summary Cards (Today's tasks, In progress, Completed, Focus time) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Today's tasks */}
            <div
              onClick={() => setActiveNav('tasks')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] flex items-center gap-4 cursor-pointer hover:border-[#cfd8d2] transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#f0eefc] text-[#5b4bc4] flex items-center justify-center shrink-0">
                <List className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#4b5563]">Today’s tasks</p>
                <p className="text-2xl font-bold text-[#111827] mt-0.5 leading-none">
                  {todayCount}
                </p>
                <p className="text-[11px] font-medium text-[#2f6f4e] mt-1.5">
                  ↑ 2 from yesterday
                </p>
              </div>
            </div>

            {/* Card 2: In progress */}
            <div
              onClick={() => setActiveNav('tasks')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] flex items-center gap-4 cursor-pointer hover:border-[#cfd8d2] transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#f0eefc] text-[#5b4bc4] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="8.5"
                    stroke="#d8d4f7"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M12 3.5a8.5 8.5 0 1 1-6.5 3"
                    stroke="#5b4bc4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-[#4b5563]">In progress</p>
                <p className="text-2xl font-bold text-[#111827] mt-0.5 leading-none">
                  {inProgressCount}
                </p>
                <p className="text-[11px] text-[#6b7280] mt-1.5">No change</p>
              </div>
            </div>

            {/* Card 3: Completed */}
            <div
              onClick={() => setActiveNav('overview')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] flex items-center gap-4 cursor-pointer hover:border-[#cfd8d2] transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#e9f2ec] flex items-center justify-center shrink-0">
                <span className="w-6 h-6 rounded-full bg-[#4d7c5f] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              </div>
              <div>
                <p className="text-xs font-medium text-[#4b5563]">Completed</p>
                <p className="text-2xl font-bold text-[#111827] mt-0.5 leading-none">
                  {completedCount}
                </p>
                <p className="text-[11px] font-medium text-[#2f6f4e] mt-1.5">
                  ↑ 6 from yesterday
                </p>
              </div>
            </div>

            {/* Card 4: Focus time */}
            <div
              onClick={() => onOpenWorkspace('tasks')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] flex items-center gap-4 cursor-pointer hover:border-[#cfd8d2] transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#f0eefc] text-[#5b4bc4] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#4b5563]">Focus time</p>
                <p className="text-2xl font-bold text-[#111827] mt-0.5 leading-none">
                  4h 20m
                </p>
                <p className="text-[11px] font-medium text-[#2f6f4e] mt-1.5">
                  ↑ 1h 10m from yesterday
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Switchable Body: Overview vs My Tasks Quick Queue */}
          {activeNav === 'tasks' ? (
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#edf0ed] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    {ZENDO_COPY.dashboardCopy.overviewCards[0]} — Live Queue
                  </h3>
                  <p className="text-xs text-[#6b7280]">
                    Click any task to toggle completion or open full workspace
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNav('overview')}
                  className="text-xs font-semibold text-[#4b735c] hover:underline cursor-pointer"
                >
                  ← Back to Overview Chart
                </button>
              </div>
              <div className="divide-y divide-[#edf0ed]">
                {tasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onToggleTaskStatus(t.id)}
                    className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#f9fbf9] px-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          t.status === 'completed'
                            ? 'bg-[#4b735c] border-[#4b735c] text-white'
                            : 'border-[#9ca3af]'
                        }`}
                      >
                        {t.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-medium truncate ${
                          t.status === 'completed'
                            ? 'line-through text-[#9ca3af]'
                            : 'text-[#111827]'
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>
                    <span className="text-xs text-[#6b7280] shrink-0">
                      {t.project} · {t.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Middle Row: "This week" Bar Chart (Left 7 cols) + "Upcoming" List (Right 5 cols) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left 7 Cols: This week chart */}
              <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-white border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] flex flex-col justify-between">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-[17px] font-bold text-[#111827]">
                      This week
                    </h3>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      Tasks completed • 18 of 25
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-[#374151]">
                      72% complete
                    </span>
                    <div className="mt-1.5 w-32 sm:w-40 h-2.5 rounded-full bg-[#eaeeec] overflow-hidden">
                      <div className="w-[72%] h-full rounded-full bg-[#6d947a]" />
                    </div>
                  </div>
                </div>

                {/* Bar Chart with Y-Axis (8, 6, 4, 2, 0) & Stacked Sage Bars */}
                <div className="mt-6 flex items-end gap-4 h-40">
                  {/* Y-axis labels */}
                  <div className="h-full flex flex-col justify-between text-[11px] text-[#88928e] pb-6 pr-1 select-none">
                    <span>8</span>
                    <span>6</span>
                    <span>4</span>
                    <span>2</span>
                    <span>0</span>
                  </div>

                  {/* Bars Container */}
                  <div className="relative flex-1 h-full flex flex-col justify-end">
                    {/* Horizontal Grid Lines */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-1 bottom-6 flex flex-col justify-between"
                    >
                      <div className="border-b border-[#f0f2f0] w-full" />
                      <div className="border-b border-[#f0f2f0] w-full" />
                      <div className="border-b border-[#f0f2f0] w-full" />
                      <div className="border-b border-[#f0f2f0] w-full" />
                      <div className="border-b border-[#e5e9e6] w-full" />
                    </div>

                    <div className="relative z-10 grid grid-cols-5 gap-4 sm:gap-7 items-end h-[124px] px-2 sm:px-4">
                      {WEEK_BARS.map((bar) => (
                        <div
                          key={bar.day}
                          className="flex flex-col items-center justify-end h-full"
                        >
                          <span className="text-[11px] font-semibold text-[#374151] mb-1">
                            {bar.count}
                          </span>
                          <div className="w-full max-w-[44px] flex flex-col">
                            <div
                              style={{ height: `${bar.capHeight}px` }}
                              className="w-full bg-[#cfddd0] rounded-t-md"
                            />
                            <div
                              style={{ height: `${bar.baseHeight}px` }}
                              className="w-full bg-[#779a80] rounded-b-[2px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* X-axis day labels */}
                    <div className="grid grid-cols-5 gap-4 sm:gap-7 pt-2 px-2 sm:px-4 text-center text-[11px] text-[#68737d]">
                      {WEEK_BARS.map((bar) => (
                        <span key={bar.day}>{bar.day}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Upcoming Schedule Card */}
              <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-white border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-[17px] font-bold text-[#111827]">
                    Upcoming
                  </h3>
                  <button
                    type="button"
                    onClick={() => onOpenWorkspace('tasks')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#374151] hover:text-[#111827] cursor-pointer"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-[#f1f3f1]">
                  {UPCOMING_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onOpenWorkspace('tasks')}
                        className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl ${item.bg} ${item.iconColor} flex items-center justify-center shrink-0`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-[#111827] truncate group-hover:text-[#4b735c] transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11.5px] text-[#6b7280] mt-0.5">
                              {item.time}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Row: "My priorities" (3 Project Cards with Progress Bars & Team Avatars) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-[17px] font-bold text-[#111827]">
                My priorities
              </h3>
              <button
                type="button"
                onClick={() => onOpenWorkspace('projects')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#374151] hover:text-[#111827] cursor-pointer"
              >
                <span>View all projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRIORITY_CARDS.map((card) => (
                <div
                  key={card.id}
                  onClick={() => onOpenWorkspace('projects')}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] hover:border-[#cfd8d2] transition-all cursor-pointer space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0`}
                      >
                        {card.type === 'window' && (
                          <div className="w-4 h-4 border-2 border-current rounded-xs border-t-4" />
                        )}
                        {card.type === 'rocket' && <Rocket className="w-4 h-4" />}
                        {card.type === 'doc' && <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#111827] leading-snug">
                          {card.title}
                        </h4>
                        <p className="text-[11.5px] text-[#6b7280]">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-[#9ca3af]" />
                  </div>

                  {/* Progress Bar + Percentage */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-[#eaeeec] overflow-hidden">
                      <div
                        style={{ width: `${card.progress}%` }}
                        className="h-full rounded-full bg-[#527d63]"
                      />
                    </div>
                    <span className="text-[11.5px] font-semibold text-[#374151]">
                      {card.progress}%
                    </span>
                  </div>

                  {/* Overlapping Avatar Stack */}
                  <div className="flex items-center -space-x-2 pt-0.5">
                    {card.avatars.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt="Team member"
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                      />
                    ))}
                    <span className="w-6 h-6 rounded-full bg-[#eaeeec] text-[#374151] text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                      {card.extraCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
