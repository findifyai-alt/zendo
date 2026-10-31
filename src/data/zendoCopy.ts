export interface SubtaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  project: string;
  status: 'today' | 'in_progress' | 'completed';
  priority: 'High' | 'Medium' | 'Calm';
  dueDate: string;
  isOverdue?: boolean;
  assignee: string;
  automated?: boolean;
  estimatedMinutes?: number;
  subtasks?: SubtaskItem[];
  comments?: TaskComment[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  completionRate: number;
  lead: string;
  color: string;
}

export interface WorkspaceNote {
  id: string;
  title: string;
  project: string;
  content: string;
  updatedAt: string;
  author: string;
  pinned?: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runsCount: number;
  lastTriggered: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  status: 'In Flow' | 'Online' | 'Async';
  tasksAssigned: number;
}

export interface ActivityLogItem {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'task' | 'automation' | 'project' | 'note';
}

export const ZENDO_COPY = {
  brandName: 'Zendo',
  shortBrandDescription:
    'Zendo is a simple productivity and workflow platform that helps individuals and teams organize work, automate routine tasks, and make meaningful progress without the clutter.',
  navigationLabels: [
    { label: 'Product', href: '#product' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Resources', href: '#resources' },
  ],
  authNavLabels: {
    logIn: 'Log In',
    getStarted: 'Get Started',
  },
  hero: {
    defaultHeadline: 'Stop sending proposals into the void.',
    subheadline:
      'Write it. Send it. Know when to follow up. Zendo drafts proposals, tracks clients, and writes your follow-ups.',
    primaryButton: 'Get Started Free',
    secondaryButton: 'See How It Works',
    supportingText:
      'No complicated setup. No unnecessary features. Just a calmer, smarter way to work.',
    alternativeHeadlines: [
      'Stop sending proposals into the void.',
      'Your work, finally in order.',
      'Turn busywork into progress.',
      'A simpler way to stay on top of everything.',
      'Plan less. Accomplish more.',
      'Work smarter. Stay in flow.',
      'Bring clarity to your workflow.',
      'The calm way to get things done.',
    ],
  },
  oneLineTaglines: [
    'Clarity for your everyday work.',
    'Your calmer way to get things done.',
    'Simple tools for meaningful progress.',
    'Work in flow with Zendo.',
    'Less busywork. More progress.',
    'Everything in place. Nothing in the way.',
  ],
  featuresSection: {
    headline: 'Everything you need to stay productive',
    items: [
      {
        index: '01',
        title: 'Create proposals in minutes.',
        description:
          'Turn your ideas and client requirements into polished proposals with Zendo AI.',
        metric: 'AI PROPOSAL DRAFTING · 10× faster',
        span: 'col-span-12 lg:col-span-7',
      },
      {
        index: '02',
        title: 'Make every proposal feel personal.',
        description:
          'Zendo AI helps you tailor your message, services, pricing, and scope for each opportunity.',
        metric: 'PERSONALIZED PROPOSALS · Made for every client',
        span: 'col-span-12 lg:col-span-5',
      },
      {
        index: '03',
        title: 'Stay ready to win the next deal.',
        description:
          'Track your proposals, organize follow-ups, and keep every opportunity moving forward.',
        metric: 'PROPOSAL FOLLOW-UP · Never lose an opportunity',
        span: 'col-span-12 lg:col-span-5',
      },
      {
        index: '04',
        title: 'Work without distractions',
        description:
          'Designed to keep your workflow focused, clean, and easy to manage.',
        metric: 'Zero-clutter focus canvas',
        span: 'col-span-12 lg:col-span-7',
      },
      {
        index: '05',
        title: 'Collaborate effortlessly',
        description:
          'Share updates, assign tasks, and keep everyone aligned without endless meetings.',
        metric: 'Async status sync · 60% fewer check-ins',
        span: 'col-span-12 lg:col-span-6',
      },
      {
        index: '06',
        title: 'Make better progress',
        description:
          'Use smart insights to understand your workflow and improve the way you work.',
        metric: 'Weekly velocity & completion cadence',
        span: 'col-span-12 lg:col-span-6',
      },
    ],
  },
  howItWorks: {
    headline: 'A better workflow in three simple steps',
    steps: [
      {
        number: '01',
        label: '1. Add your work',
        cleanTitle: 'Add your work',
        description: 'Bring your tasks, projects, and priorities into Zendo.',
        detail:
          'Capture daily priorities, project milestones, and team notes in seconds with natural keyboard shortcuts.',
      },
      {
        number: '02',
        label: '2. Set your workflow',
        cleanTitle: 'Set your workflow',
        description: 'Create simple rules and routines that work for you.',
        detail:
          'Automate recurring check-ins, status handoffs, and deadline reminders without complex flowcharts.',
      },
      {
        number: '03',
        label: '3. Make meaningful progress',
        cleanTitle: 'Make meaningful progress',
        description:
          'Let Zendo keep everything organized while you focus on completing your goals.',
        detail:
          'Start every morning with a calm, prioritized queue and clear visibility into what moves the needle.',
      },
    ],
  },
  benefitsSection: {
    headline: 'Less chaos. More clarity.',
    description:
      'Zendo helps you replace scattered tools, forgotten tasks, and repetitive work with one focused system built around the way you work.',
    benefits: [
      {
        title: 'Save time every day',
        detail: 'Eliminate context switching across 5+ disconnected tabs and docs.',
        stat: '-42% tool switching',
      },
      {
        title: 'Reduce mental clutter',
        detail: 'Only surface tasks that require your focus today; defer the rest cleanly.',
        stat: '100% daily clarity',
      },
      {
        title: 'Never lose track of important tasks',
        detail: 'Automatic deadline tracking ensures high-priority items stay visible.',
        stat: '0 missed handoffs',
      },
      {
        title: 'Create repeatable workflows',
        detail: 'Turn your best project templates into one-click routines.',
        stat: '3x faster setup',
      },
      {
        title: 'Stay aligned with your team',
        detail: 'Shared project rhythms keep everyone in sync without status meetings.',
        stat: '4.8 hrs/wk saved',
      },
      {
        title: 'Focus on high-impact work',
        detail: 'Spend your energy executing meaningful goals instead of maintaining boards.',
        stat: '+34% weekly output',
      },
    ],
  },
  socialProofSection: {
    headline: 'Built for people who want to work with clarity',
    description:
      'Whether you are managing a business, leading a team, or organizing your personal goals, Zendo gives you the structure to move forward with confidence.',
    quote:
      '“Zendo helped us replace multiple tools with one simple workflow. Our team is more focused and much more consistent.”',
    author: 'Alex Morgan',
    role: 'Founder',
    metrics: [
      { value: '4 tools', label: 'Consolidated into one calm workspace' },
      { value: '94%', label: 'Weekly task completion consistency' },
      { value: '< 2 min', label: 'Daily morning planning routine' },
    ],
  },
  pricingSection: {
    headline: 'Start simple. Grow when you’re ready.',
    subheadline: 'Use Zendo for free and upgrade when your workflow grows.',
    ctaButton: 'Start Free — No Credit Card Required',
    tiers: [
      {
        name: 'Free',
        description: 'For individuals getting organized.',
        monthlyPrice: 0,
        yearlyPrice: 0,
        cadenceLabel: 'Free forever for personal use',
        specs: [
          { label: 'Active projects', value: 'Up to 5 projects' },
          { label: 'Daily tasks & notes', value: 'Unlimited' },
          { label: 'Workflow routines', value: '3 core automations' },
          { label: 'History & insights', value: '14-day activity log' },
        ],
        highlighted: false,
      },
      {
        name: 'Pro',
        description: 'For professionals who want advanced automation and deeper insights.',
        monthlyPrice: 14,
        yearlyPrice: 10,
        cadenceLabel: 'per month, billed annually',
        specs: [
          { label: 'Active projects', value: 'Unlimited projects' },
          { label: 'Daily tasks & notes', value: 'Unlimited + file attachments' },
          { label: 'Workflow routines', value: 'Unlimited custom rules' },
          { label: 'History & insights', value: 'Full productivity velocity insights' },
        ],
        highlighted: true,
      },
      {
        name: 'Team',
        description: 'For teams that need collaboration, visibility, and control.',
        monthlyPrice: 24,
        yearlyPrice: 19,
        cadenceLabel: 'per member / month, billed annually',
        specs: [
          { label: 'Shared workspaces', value: 'Unlimited team spaces' },
          { label: 'Collaboration', value: 'Task assignment & async updates' },
          { label: 'Workflow routines', value: 'Cross-team automation triggers' },
          { label: 'Permissions & control', value: 'Role-based access & priority SLA' },
        ],
        highlighted: false,
      },
    ],
  },
  ctaSection: {
    headline: 'Stop losing clients to slow proposals.',
    subheadline:
      'Draft AI proposals, track every client interaction, and close deals twice as fast. Get started for free in under a minute.',
    button: 'Create Your Free Workspace',
  },
  dashboardCopy: {
    welcomeHeading: 'Welcome back',
    getGreeting: (name: string) => `Good morning, ${name}. Let’s make today count.`,
    overviewCards: [
      'Today’s Tasks',
      'In Progress',
      'Completed',
      'Upcoming Deadlines',
      'Productivity Overview',
    ],
    emptyStates: {
      noTasks: 'No tasks yet — Add your first task and start creating momentum.',
      allCaughtUp: 'You’re all caught up — Enjoy the clear space.',
      noProjects: 'No projects yet — Create a project to bring your work together.',
      nothingOverdue: 'Nothing overdue — Great work staying on track.',
    },
  },
  authCopy: {
    headline: 'Welcome to a calmer way to work',
    subheadline: 'Sign in to continue organizing your work with Zendo.',
    emailPlaceholder: 'Enter your email address',
    passwordPlaceholder: 'Enter your password',
    button: 'Continue to Zendo',
    signupText: 'Create your free workspace in less than a minute.',
  },
};

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'tsk-1',
    title: 'Finalize Q4 product launch roadmap & priority milestones',
    description:
      'Align engineering, design, and growth milestones into a single calm release schedule with zero overlapping bottlenecks.',
    project: 'Product Strategy',
    status: 'today',
    priority: 'High',
    dueDate: 'Today · 2:00 PM',
    assignee: 'Alex Morgan',
    automated: true,
    estimatedMinutes: 45,
    subtasks: [
      { id: 'st-1', title: 'Confirm core launch metrics with Elena', completed: true },
      { id: 'st-2', title: 'Lock freeze dates for onboarding flow', completed: true },
      { id: 'st-3', title: 'Publish async brief to workspace notes', completed: false },
    ],
    comments: [
      {
        id: 'cm-1',
        author: 'Elena Rostova',
        role: 'Head of Product',
        text: 'Design tokens and onboarding specs are locked and ready for review.',
        timestamp: '10:15 AM',
      },
    ],
  },
  {
    id: 'tsk-2',
    title: 'Review onboarding flow copy and simplify signup steps',
    description:
      'Ensure new users can create their free workspace in under 60 seconds with zero unnecessary configuration steps.',
    project: 'Website Redesign',
    status: 'in_progress',
    priority: 'High',
    dueDate: 'Today · 4:30 PM',
    assignee: 'Elena Rostova',
    automated: false,
    estimatedMinutes: 30,
    subtasks: [
      { id: 'st-21', title: 'Audit headline and subheadline legibility', completed: true },
      { id: 'st-22', title: 'Verify 1-click demo credentials flow', completed: false },
    ],
    comments: [],
  },
  {
    id: 'tsk-3',
    title: 'Automate weekly customer feedback synthesis into priority queue',
    description:
      'Route tagged customer insights directly into Product Strategy without manual spreadsheet copying.',
    project: 'Workflow Ops',
    status: 'today',
    priority: 'Medium',
    dueDate: 'Tomorrow · 10:00 AM',
    assignee: 'Alex Morgan',
    automated: true,
    estimatedMinutes: 25,
    subtasks: [
      { id: 'st-31', title: 'Connect feedback webhook trigger', completed: true },
      { id: 'st-32', title: 'Set High Priority tag rule', completed: false },
    ],
    comments: [],
  },
  {
    id: 'tsk-4',
    title: 'Publish design system typography & spacing tokens v2.4',
    description:
      'Standardize Plus Jakarta Sans and JetBrains Mono tabular numeral scales across all workspace views.',
    project: 'Website Redesign',
    status: 'completed',
    priority: 'Calm',
    dueDate: 'Completed · 9:15 AM',
    assignee: 'Marcus Vance',
    automated: false,
    estimatedMinutes: 40,
    subtasks: [
      { id: 'st-41', title: 'Verify WCAG AA contrast across botanical surfaces', completed: true },
    ],
    comments: [],
  },
  {
    id: 'tsk-5',
    title: 'Archive Q3 sprint retrospectives and sync team takeaways',
    description:
      'Automated end-of-cycle routine that packages completed tasks and shares a concise summary with the team.',
    project: 'Workflow Ops',
    status: 'completed',
    priority: 'Calm',
    dueDate: 'Completed · Yesterday',
    assignee: 'Alex Morgan',
    automated: true,
    estimatedMinutes: 20,
    subtasks: [],
    comments: [],
  },
  {
    id: 'tsk-6',
    title: 'Prepare board clarity brief with Q4 focus metrics',
    description:
      'Summarize weekly completion consistency (94%), tool consolidation savings, and team velocity.',
    project: 'Product Strategy',
    status: 'in_progress',
    priority: 'Medium',
    dueDate: 'Oct 10 · 11:00 AM',
    assignee: 'Alex Morgan',
    automated: false,
    estimatedMinutes: 50,
    subtasks: [
      { id: 'st-61', title: 'Export 16-day velocity CSV snapshot', completed: true },
      { id: 'st-62', title: 'Draft executive summary in Workspace Notes', completed: false },
    ],
    comments: [],
  },
];

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'prj-1',
    name: 'Product Strategy',
    description: 'Core Q4 roadmap, customer discovery, and high-impact priorities.',
    taskCount: 8,
    completionRate: 75,
    lead: 'Alex Morgan',
    color: '#0c9256',
  },
  {
    id: 'prj-2',
    name: 'Website Redesign',
    description: 'Metrivello-inspired brand system, landing experience, and onboarding flow.',
    taskCount: 12,
    completionRate: 84,
    lead: 'Elena Rostova',
    color: '#18a165',
  },
  {
    id: 'prj-3',
    name: 'Workflow Ops',
    description: 'Automated routines, async team briefs, and tool consolidation.',
    taskCount: 6,
    completionRate: 92,
    lead: 'Marcus Vance',
    color: '#256149',
  },
];

export const INITIAL_NOTES: WorkspaceNote[] = [
  {
    id: 'note-1',
    title: 'Q4 Calm Execution Principles & Weekly Rhythm',
    project: 'Product Strategy',
    author: 'Alex Morgan',
    updatedAt: 'Today · 9:40 AM',
    pinned: true,
    content: `1. Replace scattered status meetings with async Monday briefs in Zendo.\n2. Every task in Today's Tasks must have a clear owner and a realistic focus block.\n3. Let Zendo automations handle routine handoffs, archiving, and reminders so the team stays in flow.`,
  },
  {
    id: 'note-2',
    title: 'Zendo Lite — Brand & Copy Architecture',
    project: 'Website Redesign',
    author: 'Elena Rostova',
    updatedAt: 'Yesterday · 4:15 PM',
    pinned: true,
    content: `Core Promise: Get more done with less effort.\nPositioning: Zendo brings your tasks, workflows, and daily priorities into one simple workspace—so you can stay focused, organized, and in control.\nKey Tagline: Everything in place. Nothing in the way.`,
  },
  {
    id: 'note-3',
    title: 'Tool Consolidation Audit (4 Tools → 1 Workspace)',
    project: 'Workflow Ops',
    author: 'Marcus Vance',
    updatedAt: 'Oct 5 · 2:20 PM',
    pinned: false,
    content: `Consolidated standalone to-do lists, kanban boards, meeting notes, and routine trackers into Zendo. Result: 4.8 hours saved per team member every week and 94% weekly completion consistency.`,
  },
];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-1',
    name: 'Auto-Archive & Team Brief on Completion',
    trigger: 'When a task status changes to Completed',
    action: 'Log async team update & update project completion rate',
    enabled: true,
    runsCount: 42,
    lastTriggered: '2 mins ago',
  },
  {
    id: 'auto-2',
    name: 'Morning Priority Queue Routing',
    trigger: 'When a High Priority task is created',
    action: 'Pin to Today’s Tasks & assign 25m focus block',
    enabled: true,
    runsCount: 19,
    lastTriggered: '18 mins ago',
  },
  {
    id: 'auto-3',
    name: 'Zero-Overdue Deadline Guard',
    trigger: '24 hours before Upcoming Deadline',
    action: 'Surface calm reminder in Overview & notify owner',
    enabled: true,
    runsCount: 14,
    lastTriggered: '1 hr ago',
  },
  {
    id: 'auto-4',
    name: 'Friday Async Digest Generator',
    trigger: 'Every Friday at 4:00 PM',
    action: 'Compile completed tasks into Workspace Notes',
    enabled: false,
    runsCount: 8,
    lastTriggered: 'Last Friday',
  },
];

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'usr-1',
    name: 'Alex Morgan',
    email: 'alex@zendo.work',
    role: 'Founder',
    initials: 'AM',
    status: 'In Flow',
    tasksAssigned: 4,
  },
  {
    id: 'usr-2',
    name: 'Elena Rostova',
    email: 'elena@zendo.work',
    role: 'Head of Product',
    initials: 'ER',
    status: 'Online',
    tasksAssigned: 3,
  },
  {
    id: 'usr-3',
    name: 'Marcus Vance',
    email: 'marcus@zendo.work',
    role: 'Operations Lead',
    initials: 'MV',
    status: 'Async',
    tasksAssigned: 2,
  },
  {
    id: 'usr-4',
    name: 'Priya Ellis',
    email: 'priya@zendo.work',
    role: 'Design Systems',
    initials: 'PE',
    status: 'In Flow',
    tasksAssigned: 3,
  },
];

export const INITIAL_ACTIVITY: ActivityLogItem[] = [
  {
    id: 'act-1',
    actor: 'Zendo Automation',
    action: 'Executed rule "Morning Priority Queue Routing" on',
    target: 'Finalize Q4 product launch roadmap',
    timestamp: 'Just now',
    type: 'automation',
  },
  {
    id: 'act-2',
    actor: 'Marcus Vance',
    action: 'Completed task',
    target: 'Publish design system typography & spacing tokens v2.4',
    timestamp: '9:15 AM',
    type: 'task',
  },
  {
    id: 'act-3',
    actor: 'Elena Rostova',
    action: 'Updated workspace note',
    target: 'Zendo Lite — Brand & Copy Architecture',
    timestamp: 'Yesterday',
    type: 'note',
  },
];
