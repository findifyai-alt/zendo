/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Check,
  Plus,
  Copy,
  PieChart,
  Layers,
  Sparkles,
  BarChart3,
  Target,
  Command,
} from 'lucide-react';
import {
  ZENDO_COPY,
  INITIAL_TASKS,
  INITIAL_PROJECTS,
  INITIAL_NOTES,
  INITIAL_AUTOMATIONS,
  INITIAL_TEAM,
  INITIAL_ACTIVITY,
  TaskItem,
  ProjectItem,
  WorkspaceNote,
  AutomationRule,
  TeamMember,
  ActivityLogItem,
} from './data/zendoCopy';
import { ScrollRevealText } from './components/ScrollRevealText';
import { DashboardView } from './components/DashboardView';
import { ClientPortalChatView } from './components/ClientPortalChatView';
import { AuthModal } from './components/AuthModal';
import { AuthPage } from './components/AuthPage';
import {
  OnboardingSetupPage,
  WorkspaceOnboardingConfig,
} from './components/OnboardingSetupPage';
import { CopyKitDrawer } from './components/CopyKitDrawer';
import { ZendoLogo } from './components/ZendoLogo';
import { CommandPalette, WorkspaceSection } from './components/CommandPalette';
import { FeatureShowcaseBoxes } from './components/FeatureShowcaseBoxes';
import { ZendoHeroShowcase } from './components/ZendoHeroShowcase';
import { ScrollingReviews } from './components/ScrollingReviews';
import { SolvaFeatureTabs } from './components/SolvaFeatureTabs';
import {
  SupabaseAuthProvider,
  useSupabaseAuth,
} from './context/SupabaseAuthContext';
import { SupabaseAuthGate } from './components/SupabaseAuthGate';
import {
  auth,
  db,
  HAS_FIRESTORE_DB,
  googleSignIn,
  onAuthStateChanged,
  signOutZendo,
  getStoredAuthSession,
  saveStoredAuthSession,
  collection,
  onSnapshot,
  ensureUserProfileInFirestore,
  updateUserProfilePlanInFirestore,
  createTaskInFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  handleFirestoreError,
  OperationType,
  sanitizeId,
  type User,
} from './firebase';
import { syncUserToBackend, saveWorkspaceSetupToBackend } from './lib/api';
import skyMeadowHeroImage from './assets/images/sky_clouds_meadow_hero_1791383712836.jpg';
import editorialPortrait from './assets/images/editorial_founder_portrait_1791381634277.jpg';
import founderAvatar from './assets/images/avatar_team_lead_1791380135632.jpg';

const DAILY_FLOW_BARS = [
  { day: 'Day 01', height: 42, value: '12 tasks', active: false },
  { day: 'Day 02', height: 54, value: '15 tasks', active: false },
  { day: 'Day 03', height: 48, value: '14 tasks', active: false },
  { day: 'Day 04', height: 66, value: '19 tasks', active: true },
  { day: 'Day 05', height: 60, value: '17 tasks', active: false },
  { day: 'Day 06', height: 52, value: '15 tasks', active: false },
  { day: 'Day 07', height: 72, value: '21 tasks', active: true },
  { day: 'Day 08', height: 68, value: '20 tasks', active: false },
  { day: 'Day 09', height: 58, value: '16 tasks', active: false },
  { day: 'Day 10', height: 78, value: '23 tasks', active: true },
  { day: 'Day 11', height: 74, value: '22 tasks', active: false },
  { day: 'Day 12', height: 84, value: '25 tasks', active: true },
  { day: 'Day 13', height: 70, value: '20 tasks', active: false },
  { day: 'Day 14', height: 88, value: '27 tasks', active: true },
  { day: 'Day 15', height: 82, value: '24 tasks', active: false },
  { day: 'Day 16', height: 96, value: '29 tasks', active: true },
];

const CONNECTED_TOOLS = [
  { name: 'Google Calendar', category: 'Schedule' },
  { name: 'Slack', category: 'Messaging' },
  { name: 'Notion', category: 'Docs & Notes' },
  { name: 'Linear', category: 'Issue Tracking' },
  { name: 'GitHub', category: 'Repositories' },
  { name: 'Figma', category: 'Design Files' },
  { name: 'Gmail', category: 'Inbox' },
  { name: 'HubSpot', category: 'Customer Ops' },
  { name: 'Asana', category: 'Project Boards' },
  { name: 'Trello', category: 'Kanban Cards' },
  { name: 'Mixpanel', category: 'Product Signals' },
  { name: 'Zapier', category: 'Routines' },
];

const FAQ_ITEMS = [
  {
    q: 'What does Zendo bring together?',
    a: 'Zendo brings your daily tasks, multi-step projects, team notes, and recurring workflow routines into one calm, unified workspace—replacing scattered boards and disconnected to-do lists.',
  },
  {
    q: 'How do workflow automations work in Zendo?',
    a: 'You can set simple, human-readable rules in seconds—such as automatically assigning follow-ups, archiving completed tasks, or preparing your morning priority queue without complex setup.',
  },
  {
    q: 'Is Zendo really free to start?',
    a: 'Yes. You can use Zendo for free with no credit card required. Upgrade to Pro or Team only when your workflow grows and you need unlimited automations or team-wide permissions.',
  },
  {
    q: 'Can I switch from tools like Notion, Trello, or Asana?',
    a: 'Yes. You can bring your tasks, projects, and priorities into Zendo in less than a minute and immediately organize them into Today’s Tasks, In Progress, and Upcoming Deadlines.',
  },
  {
    q: 'How does Zendo help reduce meetings and busywork?',
    a: 'By keeping task ownership, status updates, and next steps visible in one shared view, teams stay aligned asynchronously without daily status check-ins.',
  },
];

const STORAGE_KEY = 'zendo_saas_workspace_v2';

function AppInner() {
  const { user: supabaseUser, signOut: signOutSupabaseAuth } = useSupabaseAuth();
  const [activeView, setActiveView] = useState<
    'website' | 'auth' | 'onboarding' | 'dashboard' | 'portal'
  >(() => {
    try {
      const path = window.location.pathname;
      if (path.startsWith('/p/')) {
        return 'portal';
      }
      if (path === '/dashboard') {
        return 'dashboard';
      }
      if (path === '/login' || path === '/auth') {
        return 'auth';
      }
    } catch {
      // ignore
    }
    return 'website';
  });
  const [portalToken, setPortalToken] = useState<string>(() => {
    try {
      const path = window.location.pathname;
      if (path.startsWith('/p/')) {
        return path.replace('/p/', '').trim();
      }
    } catch {
      // ignore
    }
    return 'conv_aetheria_live_token';
  });
  const [workspaceSection, setWorkspaceSection] = useState<WorkspaceSection>('tasks');
  const [copyMode, setCopyMode] = useState<'zendo' | 'metrivello'>('zendo');
  const [userName, setUserName] = useState<string>(() => {
    const session = getStoredAuthSession();
    if (session?.displayName) return session.displayName;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userName) return parsed.userName;
      }
    } catch {
      // ignore
    }
    return 'Findify Ai';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    const session = getStoredAuthSession();
    if (session?.email) return session.email;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userEmail) return parsed.userEmail;
      }
    } catch {
      // ignore
    }
    return 'findifyai@gmail.com';
  });
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | undefined>(() => {
    const session = getStoredAuthSession();
    return session?.photoURL;
  });
  const [activePlan, setActivePlan] = useState<'Free' | 'Pro' | 'Team'>(() => {
    const session = getStoredAuthSession();
    if (session?.activePlan) return session.activePlan;
    return 'Pro';
  });
  const [onboardingConfig, setOnboardingConfig] = useState<
    WorkspaceOnboardingConfig | undefined
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.onboardingConfig) return parsed.onboardingConfig;
      }
    } catch {
      // ignore
    }
    return undefined;
  });
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProfileReady, setIsProfileReady] = useState(false);

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) return parsed.tasks;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_TASKS;
  });

  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.projects) && parsed.projects.length > 0)
          return parsed.projects;
      }
    } catch {
      // ignore
    }
    return INITIAL_PROJECTS;
  });

  const [notes, setNotes] = useState<WorkspaceNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.notes) && parsed.notes.length > 0) return parsed.notes;
      }
    } catch {
      // ignore
    }
    return INITIAL_NOTES;
  });

  const [automations, setAutomations] =
    useState<AutomationRule[]>(INITIAL_AUTOMATIONS);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [activityLog, setActivityLog] =
    useState<ActivityLogItem[]>(INITIAL_ACTIVITY);
  const [inspectedTaskId, setInspectedTaskId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    INITIAL_NOTES[0].id
  );

  // Calm Focus Timer state (25:00 default)
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusTaskTitle, setFocusTaskTitle] = useState<string | null>(null);

  // Command Palette & Toast state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hero Headline index
  const [activeHeadlineIndex, setActiveHeadlineIndex] = useState(0);

  // Hero Dashboard Shell interactive state
  const [heroShellTab, setHeroShellTab] = useState<
    'overview' | 'today' | 'in_progress' | 'completed' | 'empty_states'
  >('overview');
  const [selectedEmptyKey, setSelectedEmptyKey] = useState<
    'noTasks' | 'allCaughtUp' | 'noProjects' | 'nothingOverdue'
  >('allCaughtUp');
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(15);

  // Pricing Billing Switcher
  const [billingCycle, setBillingCycle] = useState<'yearly' | 'monthly'>('yearly');

  // FAQ Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Modals & Drawers
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [copyKitOpen, setCopyKitOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Image error fallback flags
  const [skyImgError, setSkyImgError] = useState(false);
  const [portraitImgError, setPortraitImgError] = useState(false);
  const [founderImgError, setFounderImgError] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Persist workspace data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tasks,
          projects,
          notes,
          userName,
          userEmail,
          activePlan,
          onboardingConfig,
        })
      );
    } catch {
      // ignore
    }
  }, [tasks, projects, notes, userName, userEmail, activePlan, onboardingConfig]);

  // Listen to Firebase Auth state and initialize user profile
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setIsAuthReady(true);
      if (fbUser) {
        const resolvedName =
          fbUser.displayName?.trim() ||
          fbUser.email?.split('@')[0] ||
          'Findify Ai';
        const resolvedEmail = fbUser.email || 'findifyai@gmail.com';
        setUserName(resolvedName);
        setUserEmail(resolvedEmail);
        if (fbUser.photoURL) setUserPhotoUrl(fbUser.photoURL);
        setIsProfileReady(true);
        saveStoredAuthSession({
          uid: fbUser.uid,
          displayName: resolvedName,
          email: resolvedEmail,
          photoURL: fbUser.photoURL || undefined,
        });

        setActiveView((currentView) => {
          if (currentView === 'auth') {
            try {
              window.history.pushState({}, '', '/onboarding');
            } catch {
              // ignore
            }
            return 'onboarding';
          }
          return currentView;
        });

        void ensureUserProfileInFirestore(fbUser, resolvedName)
          .then((profile) => {
            if (profile.displayName) setUserName(profile.displayName);
            if (profile.activePlan) setActivePlan(profile.activePlan);
          })
          .catch(() => {});
      } else {
        const session = getStoredAuthSession();
        if (session) {
          setUserName(session.displayName);
          setUserEmail(session.email);
          setUserPhotoUrl(session.photoURL);
          setIsProfileReady(true);
        } else {
          setIsProfileReady(false);
          setUserPhotoUrl(undefined);
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // Attach real-time Firestore listener for /users/{uid}/tasks only when Firestore is provisioned
  useEffect(() => {
    if (!HAS_FIRESTORE_DB || !isAuthReady || !firebaseUser || !isProfileReady)
      return;
    const uid = sanitizeId(firebaseUser.uid);
    const tasksPath = `users/${uid}/tasks`;
    const tasksCol = collection(db, 'users', uid, 'tasks');

    const unsubTasks = onSnapshot(
      tasksCol,
      (snapshot) => {
        if (snapshot.empty) {
          // Seed initial tasks into Firestore for a new verified user
          if (firebaseUser.emailVerified) {
            INITIAL_TASKS.forEach((initialTask) => {
              createTaskInFirestore(firebaseUser, initialTask).catch(() => {});
            });
          }
          return;
        }
        const remoteTasks: TaskItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const mappedPriority: TaskItem['priority'] =
            data.priority === 'High'
              ? 'High'
              : data.priority === 'Medium'
              ? 'Medium'
              : 'Calm';
          const mappedStatus: TaskItem['status'] =
            data.status === 'completed'
              ? 'completed'
              : data.status === 'in_progress'
              ? 'in_progress'
              : 'today';
          return {
            id: data.id || docSnap.id,
            title: data.title || 'Untitled Task',
            description: data.notes || '',
            project: data.project || 'Product Strategy',
            status: mappedStatus,
            priority: mappedPriority,
            dueDate: data.due || 'Today',
            assignee: data.assignee || userName,
            automated: mappedPriority === 'High',
            subtasks: [],
            comments: [],
          };
        });
        setTasks(remoteTasks);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, tasksPath);
      }
    );

    return () => unsubTasks();
  }, [isAuthReady, firebaseUser, isProfileReady]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Calm Focus Timer countdown
  useEffect(() => {
    if (!focusRunning) return;
    const timer = setInterval(() => {
      setFocusSeconds((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          showToast('25m Calm Focus block completed! Take a 5-minute breath.');
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [focusRunning]);

  const logActivity = (
    actor: string,
    action: string,
    target: string,
    type: ActivityLogItem['type'] = 'task'
  ) => {
    setActivityLog((prev) => [
      {
        id: `act-${Date.now()}`,
        actor,
        action,
        target,
        timestamp: 'Just now',
        type,
      },
      ...prev,
    ]);
  };

  const handleToggleTaskStatus = (id: string) => {
    const existingTask = tasks.find((t) => t.id === id);
    if (!existingTask) return;

    const nextStatus: TaskItem['status'] =
      existingTask.status === 'completed'
        ? 'today'
        : existingTask.status === 'today'
        ? 'in_progress'
        : 'completed';
    const updatedTask: TaskItem = {
      ...existingTask,
      status: nextStatus,
      dueDate:
        nextStatus === 'completed' ? 'Completed · Just now' : 'Today · Priority',
    };

    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));

    if (nextStatus === 'completed') {
      logActivity(userName, 'Completed task', existingTask.title, 'task');
      showToast(`Completed: "${existingTask.title}"`);
    }

    if (firebaseUser) {
      updateTaskInFirestore(firebaseUser, existingTask.status, updatedTask).catch(
        (err) => console.error(err)
      );
    }
  };

  const handleAddTask = (
    title: string,
    project: string,
    priority: TaskItem['priority'],
    status: TaskItem['status'] = 'today',
    assignee: string = userName,
    description?: string
  ) => {
    const newTask: TaskItem = {
      id: `tsk_${Date.now()}`,
      title,
      description:
        description ||
        'Focused priority item tracked inside Zendo Workspace.',
      project,
      status,
      priority,
      dueDate: 'Today · 5:00 PM',
      assignee,
      automated: priority === 'High',
      subtasks: [
        { id: `st_${Date.now()}_1`, title: 'Define scope & next step', completed: false },
      ],
      comments: [],
    };
    setTasks((prev) => [newTask, ...prev]);
    logActivity(userName, 'Created task', title, 'task');
    showToast(`Added "${title}" to ${project}`);

    if (firebaseUser) {
      createTaskInFirestore(firebaseUser, newTask).catch((err) =>
        console.error(err)
      );
    }
  };

  const handleUpdateTask = (updatedTask: TaskItem) => {
    const previousTask = tasks.find((t) => t.id === updatedTask.id);
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    if (firebaseUser && previousTask) {
      updateTaskInFirestore(
        firebaseUser,
        previousTask.status,
        updatedTask
      ).catch((err) => console.error(err));
    }
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (target) {
      logActivity(userName, 'Removed task', target.title, 'task');
      showToast(`Removed task "${target.title}"`);
    }
    if (firebaseUser) {
      deleteTaskFromFirestore(firebaseUser, id).catch((err) =>
        console.error(err)
      );
    }
  };

  const handleAddProject = (
    name: string,
    description = 'Focused workflow initiative organized in Zendo.',
    lead = userName
  ) => {
    const palette = ['#0c9256', '#18a165', '#256149', '#0d9488'];
    const newProj: ProjectItem = {
      id: `prj-${Date.now()}`,
      name,
      description,
      taskCount: 1,
      completionRate: 100,
      lead,
      color: palette[projects.length % palette.length],
    };
    setProjects((prev) => [...prev, newProj]);
    logActivity(userName, 'Created project', name, 'project');
    showToast(`Created project "${name}"`);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Project removed');
  };

  const handleAddNote = (
    title: string,
    project: string,
    content: string
  ): WorkspaceNote => {
    const newNote: WorkspaceNote = {
      id: `note-${Date.now()}`,
      title,
      project,
      content,
      updatedAt: 'Just now',
      author: userName,
      pinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    logActivity(userName, 'Created workspace note', title, 'note');
    showToast(`Created note "${title}"`);
    return newNote;
  };

  const handleUpdateNote = (updated: WorkspaceNote) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => {
      const remaining = prev.filter((n) => n.id !== id);
      if (selectedNoteId === id && remaining[0]) {
        setSelectedNoteId(remaining[0].id);
      }
      return remaining;
    });
    showToast('Workspace note deleted');
  };

  const handleToggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleRunAutomation = (id: string) => {
    const rule = automations.find((a) => a.id === id);
    if (!rule) return;
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, runsCount: a.runsCount + 1, lastTriggered: 'Just now' }
          : a
      )
    );
    logActivity('Zendo Automation', `Executed "${rule.name}"`, rule.action, 'automation');
    showToast(`Automation executed: ${rule.name}`);
  };

  const handleAddAutomation = (name: string, trigger: string, action: string) => {
    const newRule: AutomationRule = {
      id: `auto-${Date.now()}`,
      name,
      trigger,
      action,
      enabled: true,
      runsCount: 1,
      lastTriggered: 'Just now',
    };
    setAutomations((prev) => [newRule, ...prev]);
    logActivity(userName, 'Enabled automation rule', name, 'automation');
    showToast(`Created automation rule "${name}"`);
  };

  const handleAddTeamMember = (name: string, email: string, role: string) => {
    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const member: TeamMember = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      initials: initials || 'ZN',
      status: 'Online',
      tasksAssigned: 1,
    };
    setTeam((prev) => [...prev, member]);
    showToast(`Invited ${name} (${email}) to Zendo Workspace`);
  };

  const handleCycleMemberStatus = (id: string) => {
    setTeam((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const nextStatus: TeamMember['status'] =
          m.status === 'In Flow'
            ? 'Online'
            : m.status === 'Online'
            ? 'Async'
            : 'In Flow';
        return { ...m, status: nextStatus };
      })
    );
  };

  const handleToggleFocusTimer = (taskTitle?: string) => {
    if (taskTitle) {
      setFocusTaskTitle(taskTitle);
      setFocusRunning(true);
      showToast(`Started 25m Calm Focus Timer on "${taskTitle}"`);
    } else {
      setFocusRunning((prev) => !prev);
    }
  };

  const handleResetFocusTimer = () => {
    setFocusRunning(false);
    setFocusSeconds(25 * 60);
    setFocusTaskTitle(null);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Title', 'Project', 'Status', 'Priority', 'Assignee', 'DueDate'];
    const rows = tasks.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.project}"`,
      t.status,
      t.priority,
      `"${t.assignee}"`,
      `"${t.dueDate}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'zendo-workspace-tasks.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported workspace snapshot (zendo-workspace-tasks.csv)');
  };

  const handleResetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTasks(INITIAL_TASKS);
    setProjects(INITIAL_PROJECTS);
    setNotes(INITIAL_NOTES);
    setAutomations(INITIAL_AUTOMATIONS);
    setTeam(INITIAL_TEAM);
    setActivityLog(INITIAL_ACTIVITY);
  };

  const handleCompleteOnboarding = (config: WorkspaceOnboardingConfig) => {
    setOnboardingConfig(config);

    // Save business questionnaire responses to SQL backend & profile
    void saveWorkspaceSetupToBackend({
      companyName: config.companyName,
      industry: config.industry,
      servicesOffered: config.services.join(', '),
      brandColor: config.brandColor,
      typicalClientType: config.clientType,
      currency: config.currency,
      proposalTone: config.proposalTone,
    });

    // Seed a personalized first winning proposal task and note into the user's workspace
    const primaryService = config.services[0] || 'Strategic Proposal';
    const proposalTaskTitle = `Send ${config.companyName} ${primaryService} Proposal (${config.currency})`;
    const alreadyExists = tasks.some((t) => t.title === proposalTaskTitle);

    if (!alreadyExists) {
      handleAddTask(
        proposalTaskTitle,
        'Product Strategy',
        'High',
        'today',
        userName,
        `Tailored ${config.proposalTone.toLowerCase()} proposal for ${config.clientType} in ${config.industry}. Services included: ${config.services.join(', ')}.`
      );
    }

    if (firebaseUser) {
      ensureUserProfileInFirestore(
        firebaseUser,
        userName,
        config.companyName,
        activePlan
      ).catch(() => {});
    }

    try {
      window.history.pushState({}, '', '/dashboard');
    } catch {
      // ignore
    }
    setActiveView('dashboard');
    showToast(
      `Workspace set up for ${config.companyName} (${config.proposalTone} tone · ${config.currency})`
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const todayCount = tasks.filter((t) => t.status === 'today').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const upcomingCount = tasks.filter((t) => t.status !== 'completed').length;

  const commandPaletteNode = (
    <CommandPalette
      isOpen={commandPaletteOpen}
      onClose={() => setCommandPaletteOpen(false)}
      tasks={tasks}
      projects={projects}
      notes={notes}
      automations={automations}
      onNavigateView={(v) => {
        setActiveView(v);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      onSelectWorkspaceSection={(sec) => setWorkspaceSection(sec)}
      onInspectTask={(taskId) => {
        setWorkspaceSection('tasks');
        setInspectedTaskId(taskId);
      }}
      onQuickCreateTask={(title) => {
        handleAddTask(title, 'Product Strategy', 'High', 'today', userName);
        setActiveView('dashboard');
        setWorkspaceSection('tasks');
      }}
      onSelectProject={() => {
        setWorkspaceSection('projects');
      }}
      onSelectNote={(noteId) => {
        setWorkspaceSection('notes');
        setSelectedNoteId(noteId);
      }}
      onRunAutomation={(ruleId) => {
        handleRunAutomation(ruleId);
        setWorkspaceSection('automations');
      }}
      onStartFocusTimer={() => handleToggleFocusTimer('Deep Focus Session')}
      onExportCsv={handleExportCsv}
      onOpenCopyKit={() => setCopyKitOpen(true)}
    />
  );

  if (activeView === 'portal') {
    return (
      <ClientPortalChatView
        token={portalToken}
        onBackToApp={() => {
          try {
            window.history.pushState({}, '', '/dashboard');
          } catch {}
          setActiveView('dashboard');
        }}
      />
    );
  }

  if (activeView === 'auth') {
    return (
      <>
        <AuthPage
          initialMode={authInitialMode}
          onSuccess={(name, email, workspaceName) => {
            const resolvedName = name || 'Findify Ai';
            const resolvedEmail = email || 'findifyai@gmail.com';
            setUserName(resolvedName);
            setUserEmail(resolvedEmail);
            if (workspaceName) {
              setOnboardingConfig((prev) =>
                prev
                  ? { ...prev, companyName: workspaceName }
                  : {
                      companyName: workspaceName,
                      industry: 'Design & Creative Agency',
                      services: ['Brand Identity', 'Web Design & Build', 'Product Strategy'],
                      brandColor: '#3b664e',
                      logoUrl: null,
                      logoMonogram:
                        workspaceName
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'NS',
                      clientType: 'Growth-Stage Startups',
                      currency: 'USD ($)',
                      proposalTone: 'Professional',
                    }
              );
            }
            try {
              window.history.pushState({}, '', '/onboarding');
            } catch {
              // ignore
            }
            setActiveView('onboarding');
            showToast(`Welcome ${resolvedName}! Please share a few details about your business.`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBackToHome={() => {
            try {
              window.history.pushState({}, '', '/');
            } catch {
              // ignore
            }
            setActiveView('website');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenDashboard={() => {
            try {
              window.history.pushState({}, '', '/dashboard');
            } catch {
              // ignore
            }
            setActiveView('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCopyKit={() => setCopyKitOpen(true)}
        />
        {commandPaletteNode}
        <CopyKitDrawer
          isOpen={copyKitOpen}
          onClose={() => setCopyKitOpen(false)}
          activeHeadline={ZENDO_COPY.hero.alternativeHeadlines[activeHeadlineIndex]}
          onApplyHeadline={(hl) => {
            const idx = ZENDO_COPY.hero.alternativeHeadlines.indexOf(hl);
            if (idx !== -1) setActiveHeadlineIndex(idx);
            setCopyKitOpen(false);
            setActiveView('website');
          }}
        />
      </>
    );
  }

  if (activeView === 'onboarding') {
    return (
      <>
        <OnboardingSetupPage
          userName={userName}
          initialWorkspaceName={onboardingConfig?.companyName || 'Northstar Studio'}
          initialConfig={onboardingConfig}
          onComplete={handleCompleteOnboarding}
          onSkipToDashboard={() => {
            try {
              window.history.pushState({}, '', '/dashboard');
            } catch {
              // ignore
            }
            setActiveView('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onBackToHome={() => {
            try {
              window.history.pushState({}, '', '/');
            } catch {
              // ignore
            }
            setActiveView('website');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        {commandPaletteNode}
      </>
    );
  }

  if (activeView === 'dashboard') {
    return (
      <>
        <DashboardView
          userName={userName}
          userEmail={userEmail}
          userPhotoUrl={userPhotoUrl}
          onUpdateUserName={setUserName}
          onboardingConfig={onboardingConfig}
          onReopenOnboarding={() => {
            try {
              window.history.pushState({}, '', '/onboarding');
            } catch {
              // ignore
            }
            setActiveView('onboarding');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activePlan={activePlan}
          onChangePlan={(plan) => {
            setActivePlan(plan);
            showToast(`Switched workspace plan to Zendo ${plan}`);
            if (firebaseUser) {
              updateUserProfilePlanInFirestore(firebaseUser, plan).catch((err) =>
                console.error(err)
              );
            }
          }}
          onBackToSite={() => {
            try {
              window.history.pushState({}, '', '/');
            } catch {
              // ignore
            }
            setActiveView('website');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLogout={() => {
            void signOutSupabaseAuth();
            void signOutZendo();
            try {
              window.history.pushState({}, '', '/');
            } catch {
              // ignore
            }
            setActiveView('website');
            showToast('Logged out of zendo.ai');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          tasks={tasks}
          firebaseUser={firebaseUser}
        />
        {commandPaletteNode}
        <CopyKitDrawer
          isOpen={copyKitOpen}
          onClose={() => setCopyKitOpen(false)}
          activeHeadline={ZENDO_COPY.hero.alternativeHeadlines[activeHeadlineIndex]}
          onApplyHeadline={(hl) => {
            const idx = ZENDO_COPY.hero.alternativeHeadlines.indexOf(hl);
            if (idx !== -1) setActiveHeadlineIndex(idx);
            setCopyKitOpen(false);
            setActiveView('website');
          }}
        />
      </>
    );
  }

  const currentHeroHeadline =
    copyMode === 'metrivello'
      ? 'Know what works. Know what to do next.'
      : ZENDO_COPY.hero.alternativeHeadlines[activeHeadlineIndex];

  const heroEyebrow =
    copyMode === 'metrivello'
      ? 'AI MARKETING ANALYTICS'
      : 'AI PROPOSALS & CLIENT WORKSPACE';

  const heroSubheadline =
    copyMode === 'metrivello'
      ? 'Bring your marketing tools into one clear view. AI that explains performance, flags changes, and helps you plan your next move.'
      : ZENDO_COPY.hero.subheadline;

  const heroPrimaryBtn =
    copyMode === 'metrivello' ? 'Get a demo' : ZENDO_COPY.hero.primaryButton;

  const heroSecondaryBtn =
    copyMode === 'metrivello'
      ? 'See how it works'
      : ZENDO_COPY.hero.secondaryButton;

  const heroSupportingText =
    copyMode === 'metrivello'
      ? 'Your channels. Your numbers. A clearer picture.'
      : ZENDO_COPY.hero.supportingText;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#1C1A15] flex flex-col selection:bg-[#1C1A15] selection:text-[#FAF9F5]">
      {/* Top Floating Navigation Bar */}
      <div className="pt-3 px-3 sm:px-6 sticky top-0 z-40">
        <header className="max-w-[1420px] mx-auto h-[68px] sm:h-[74px] bg-white rounded-[20px] sm:rounded-[24px] px-4 sm:px-7 flex items-center justify-between border border-[#e1e9e4] shadow-[0_4px_24px_rgba(16,28,25,0.04)]">
          <div className="flex items-center gap-8">
            <a href="#product" className="flex items-center gap-2.5 group">
              <ZendoLogo size={28} />
              <span className="font-semibold text-lg tracking-tight text-[#101c19]">Zendo</span>
            </a>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#596960]">
              <a href="#product" className="hover:text-[#101c19] transition-colors">Product</a>
              <a href="#features" className="hover:text-[#101c19] transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-[#101c19] transition-colors">How It Works</a>
              <a href="#benefits" className="hover:text-[#101c19] transition-colors">Benefits</a>
              <a href="#stories" className="hover:text-[#101c19] transition-colors">Stories</a>
              <a href="#pricing" className="hover:text-[#101c19] transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-[#101c19] transition-colors">FAQ</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                try {
                  window.history.pushState({}, "", "/dashboard");
                } catch {}
                setActiveView("dashboard");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#101c19] hover:bg-[#f2f6f4] rounded-full transition-colors"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthInitialMode("login");
                try {
                  window.history.pushState({}, "", "/auth");
                } catch {}
                setActiveView("auth");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 py-2 text-xs font-semibold text-[#101c19] hover:text-[#0c9256] transition-colors"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthInitialMode("signup");
                try {
                  window.history.pushState({}, "", "/auth");
                } catch {}
                setActiveView("auth");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-4 sm:px-5 py-2.5 bg-[#101c19] hover:bg-[#1a2d28] text-white text-xs sm:text-sm font-semibold rounded-full transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      </div>

      {/* Hero Section with Sky, Meadow, and Interactive Showcase */}
      <section id="product" className="pt-3 px-3 sm:px-6">
        <div className="relative max-w-[1420px] mx-auto rounded-[24px] sm:rounded-[30px] overflow-hidden bg-[#8dc6ec] border border-[#d0e8f5]">
          {!skyImgError ? (
            <img
              src={skyMeadowHeroImage}
              alt="Calm Blue Sky with Clouds and Green Grass Field"
              onError={() => setSkyImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none select-none"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#8dc6ec] via-[#bfe3f7] to-[#7dbb4e]" />
          )}

          <div className="relative z-10 pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 px-4 sm:px-8 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-sm text-xs font-semibold text-[#101c19] uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#0c9256]" />
              <span>{heroEyebrow}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-medium tracking-tight text-[#101c19] leading-[1.1] mb-5">
              {currentHeroHeadline}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[#2c3e37] max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
              {heroSubheadline}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthInitialMode("signup");
                  try {
                    window.history.pushState({}, "", "/auth");
                  } catch {}
                  setActiveView("auth");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full sm:w-auto px-7 py-3.5 bg-[#0c9256] hover:bg-[#0a7a48] text-white text-sm font-semibold rounded-full shadow-lg shadow-[#0c9256]/25 transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
              >
                <span>{heroPrimaryBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-7 py-3.5 bg-white/90 hover:bg-white text-[#101c19] text-sm font-semibold rounded-full shadow-md backdrop-blur-sm transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
              >
                <span>{heroSecondaryBtn}</span>
              </a>
            </div>

            <p className="text-xs sm:text-sm text-[#3b5247]">
              {heroSupportingText}
            </p>
          </div>

          <div className="relative z-10 px-3 sm:px-6 pb-6 sm:pb-10 max-w-[1240px] mx-auto">
            <ZendoHeroShowcase
              userName={userName}
              tasks={tasks}
              projects={projects}
              onOpenWorkspace={(section) => {
                if (section) setWorkspaceSection(section);
                try {
                  window.history.pushState({}, "", "/dashboard");
                } catch {}
                setActiveView("dashboard");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onQuickAddTask={() => {
                handleAddTask("Draft client proposal", "Product Strategy", "High", "today", userName);
                try {
                  window.history.pushState({}, "", "/dashboard");
                } catch {}
                setActiveView("dashboard");
                setWorkspaceSection("tasks");
              }}
              onToggleTaskStatus={handleToggleTaskStatus}
            />
          </div>
        </div>
      </section>

      {/* Connected Tools */}
      <section className="py-14 px-4 sm:px-8 max-w-[1420px] mx-auto">
        <p className="text-center text-xs font-semibold text-[#596960] uppercase tracking-wider mb-6">
          Connects effortlessly with the tools your team already uses
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {CONNECTED_TOOLS.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#e1e9e4] shadow-[0_2px_8px_rgba(16,28,25,0.03)] text-xs text-[#2c3e37] font-medium hover:border-[#0c9256]/40 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c9256]" />
              <span className="font-semibold text-[#101c19]">{tool.name}</span>
              <span className="text-[#84968c]">· {tool.category}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-16 px-4 sm:px-8 max-w-[1420px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f7ee] border border-[#a7dfc1]/50 text-xs font-semibold text-[#087443] tracking-wide uppercase mb-3.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>STREAMLINED WORKSPACE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-medium tracking-tight text-[#101c19] leading-tight">
            {ZENDO_COPY.featuresSection.headline}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#596960] leading-relaxed">
            From winning proposals to daily tasks and automated routines, Zendo brings every part of your workflow into calm alignment.
          </p>
        </div>

        <FeatureShowcaseBoxes
          copyMode={copyMode}
          onInspectFeature={() => {
            try {
              window.history.pushState({}, "", "/dashboard");
            } catch {}
            setActiveView("dashboard");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </section>

      <SolvaFeatureTabs
        onOpenDashboard={() => {
          try {
            window.history.pushState({}, '', '/dashboard');
          } catch {}
          setActiveView('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => {
          setAuthInitialMode('signup');
          try {
            window.history.pushState({}, '', '/auth');
          } catch {}
          setActiveView('auth');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Benefits */}
      <section id="benefits" className="py-20 px-4 sm:px-8 max-w-[1420px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f7ee] border border-[#a7dfc1]/50 text-xs font-semibold text-[#087443] tracking-wide uppercase mb-3.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TANGIBLE IMPACT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-medium tracking-tight text-[#101c19] leading-tight">
            {ZENDO_COPY.benefitsSection.headline}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#596960] leading-relaxed">
            {ZENDO_COPY.benefitsSection.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ZENDO_COPY.benefitsSection.benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-[22px] p-6 sm:p-7 border border-[#e1e9e4] shadow-[0_2px_12px_rgba(16,28,25,0.03)] flex flex-col justify-between hover:border-[#0c9256]/30 transition-colors"
            >
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-[#e8f7ee] text-[#087443] text-xs font-semibold mb-4">
                  {b.stat}
                </div>
                <h3 className="text-lg font-semibold text-[#101c19] mb-2 tracking-tight">
                  {b.title}
                </h3>
                <p className="text-sm text-[#596960] leading-relaxed">
                  {b.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stories & Reviews */}
      <section id="stories" className="py-16 px-4 sm:px-8 max-w-[1420px] mx-auto">
        <ScrollingReviews />
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-8 bg-white border-y border-[#e1e9e4]">
        <div className="max-w-[1420px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f7ee] border border-[#a7dfc1]/50 text-xs font-semibold text-[#087443] tracking-wide uppercase mb-3.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIMPLE PRICING</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-medium tracking-tight text-[#101c19] leading-tight">
              {ZENDO_COPY.pricingSection.headline}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#596960]">
              {ZENDO_COPY.pricingSection.subheadline}
            </p>

            <div className="mt-6 inline-flex items-center p-1 bg-[#f0f4f1] rounded-full border border-[#e1e9e4] text-xs font-medium">
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  billingCycle === "yearly"
                    ? "bg-[#101c19] text-white shadow-sm"
                    : "text-[#596960] hover:text-[#101c19]"
                }`}
              >
                Yearly (Save 30%)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  billingCycle === "monthly"
                    ? "bg-[#101c19] text-white shadow-sm"
                    : "text-[#596960] hover:text-[#101c19]"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {ZENDO_COPY.pricingSection.tiers.map((tier) => {
              const price =
                tier.name === "Free"
                  ? 0
                  : billingCycle === "yearly"
                  ? tier.yearlyPrice
                  : tier.monthlyPrice;

              return (
                <div
                  key={tier.name}
                  className={`rounded-[24px] p-6 sm:p-8 flex flex-col justify-between transition-all ${
                    tier.highlighted
                      ? "bg-[#101c19] text-white shadow-xl ring-2 ring-[#0c9256]"
                      : "bg-[#faf9f5] text-[#101c19] border border-[#e1e9e4]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold tracking-tight">{tier.name}</h3>
                      {tier.highlighted && (
                        <span className="px-2.5 py-1 rounded-full bg-[#0c9256] text-white text-[11px] font-semibold tracking-wide uppercase">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs sm:text-sm mb-6 ${
                        tier.highlighted ? "text-gray-300" : "text-[#596960]"
                      }`}
                    >
                      {tier.description}
                    </p>

                    <div className="mb-6 pb-6 border-b border-current/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-bold tracking-tight font-mono">
                          ${price}
                        </span>
                        <span
                          className={`text-xs ${
                            tier.highlighted ? "text-gray-400" : "text-[#596960]"
                          }`}
                        >
                          / mo
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-1 ${
                          tier.highlighted ? "text-gray-400" : "text-[#84968c]"
                        }`}
                      >
                        {tier.cadenceLabel}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-8 text-xs sm:text-sm">
                      {tier.specs.map((spec) => (
                        <li key={spec.label} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#0c9256]" />
                          <span>
                            <strong className="font-semibold">{spec.label}:</strong>{" "}
                            <span className={tier.highlighted ? "text-gray-300" : "text-[#596960]"}>
                              {spec.value}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthInitialMode("signup");
                      try {
                        window.history.pushState({}, "", "/auth");
                      } catch {}
                      setActiveView("auth");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`w-full py-3 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                      tier.highlighted
                        ? "bg-[#0c9256] hover:bg-[#0a7a48] text-white shadow-md"
                        : "bg-[#101c19] hover:bg-[#1a2d28] text-white"
                    }`}
                  >
                    {tier.name === "Free" ? "Get Started Free" : `Upgrade to ${tier.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f7ee] border border-[#a7dfc1]/50 text-xs font-semibold text-[#087443] tracking-wide uppercase mb-3.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FREQUENT QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#101c19]">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#596960]">
            Everything you need to know about Zendo workspaces, plans, and automations.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={item.q}
                className="bg-white rounded-[18px] border border-[#e1e9e4] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-[#101c19] text-sm sm:text-base hover:text-[#0c9256] transition-colors"
                >
                  <span>{item.q}</span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-[#e1e9e4] text-xs transition-transform ${
                      isOpen ? "rotate-45 bg-[#101c19] text-white" : "bg-[#f5f9f7] text-[#101c19]"
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#596960] leading-relaxed border-t border-[#f0f4f1]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-[#FAF9F5] text-[#1C1A15] py-16 px-4 sm:px-8 border-t border-[#e1e9e4]">
        <div className="max-w-[1420px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Column 1: Brand & Description */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <ZendoLogo size={28} />
              <span className="font-semibold text-lg tracking-tight text-[#101c19]">Zendo</span>
            </div>
            <p className="text-xs text-[#596960] leading-relaxed">
              The AI proposal & client workspace that helps agencies win clients and close faster.
            </p>
            <div className="flex items-center gap-3 text-[#596960]">
              <a href="#twitter" aria-label="X / Twitter" className="w-8 h-8 rounded-full bg-white border border-[#e1e9e4] flex items-center justify-center hover:text-[#101c19] hover:border-[#101c19] transition-colors text-xs font-bold">
                𝕏
              </a>
              <a href="#linkedin" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-white border border-[#e1e9e4] flex items-center justify-center hover:text-[#101c19] hover:border-[#101c19] transition-colors text-xs font-bold">
                in
              </a>
              <a href="#instagram" aria-label="Instagram" className="w-8 h-8 rounded-full bg-white border border-[#e1e9e4] flex items-center justify-center hover:text-[#101c19] hover:border-[#101c19] transition-colors text-xs font-bold">
                ig
              </a>
              <a href="#facebook" aria-label="Facebook" className="w-8 h-8 rounded-full bg-white border border-[#e1e9e4] flex items-center justify-center hover:text-[#101c19] hover:border-[#101c19] transition-colors text-xs font-bold">
                f
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#101c19]">Product</h4>
            <ul className="space-y-2 text-xs text-[#596960]">
              <li><a href="#features" className="hover:text-[#101c19] transition-colors">Features</a></li>
              <li><a href="#product" className="hover:text-[#101c19] transition-colors">Use Cases</a></li>
              <li><a href="#product" className="hover:text-[#101c19] transition-colors">Integrations</a></li>
              <li><a href="#pricing" className="hover:text-[#101c19] transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#101c19]">Company</h4>
            <ul className="space-y-2 text-xs text-[#596960]">
              <li><a href="#stories" className="hover:text-[#101c19] transition-colors">About</a></li>
              <li><a href="#stories" className="hover:text-[#101c19] transition-colors">Customers</a></li>
              <li><a href="#careers" className="hover:text-[#101c19] transition-colors">Careers</a></li>
              <li><a href="#blog" className="hover:text-[#101c19] transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#101c19]">Resources</h4>
            <ul className="space-y-2 text-xs text-[#596960]">
              <li><a href="#updates" className="hover:text-[#101c19] transition-colors">Updates</a></li>
              <li><a href="#faq" className="hover:text-[#101c19] transition-colors">FAQ</a></li>
              <li><a href="#contact" className="hover:text-[#101c19] transition-colors">Contact</a></li>
              <li><a href="#404" className="hover:text-[#101c19] transition-colors">404</a></li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#101c19]">Legal</h4>
            <ul className="space-y-2 text-xs text-[#596960]">
              <li><a href="#privacy" className="hover:text-[#101c19] transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-[#101c19] transition-colors">Terms of Service</a></li>
              <li><a href="#buy" className="hover:text-[#101c19] transition-colors">Buy Template</a></li>
            </ul>
          </div>
        </div>
      </footer>

      {commandPaletteNode}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authInitialMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(name, email) => {
          setUserName(name || 'Findify Ai');
          if (email) setUserEmail(email);
          setAuthModalOpen(false);
          try {
            window.history.pushState({}, '', '/onboarding');
          } catch {
            // ignore
          }
          setActiveView('onboarding');
          showToast(`Welcome ${name || 'Findify Ai'}! Please share a few details about your business.`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <CopyKitDrawer
        isOpen={copyKitOpen}
        onClose={() => setCopyKitOpen(false)}
        activeHeadline={currentHeroHeadline}
        onApplyHeadline={(hl) => {
          const idx = ZENDO_COPY.hero.alternativeHeadlines.indexOf(hl);
          if (idx !== -1) setActiveHeadlineIndex(idx);
          setCopyKitOpen(false);
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 px-4 py-3 rounded-2xl bg-[#101c19] text-white text-xs font-medium shadow-xl border border-[#256149] flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#47c28b]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SupabaseAuthProvider>
      <AppInner />
    </SupabaseAuthProvider>
  );
}
