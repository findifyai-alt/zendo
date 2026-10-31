import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Check,
  ArrowLeft,
  ArrowRight,
  FileText,
  Users,
  Layers,
  Sparkles,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Send,
  Download,
  Share2,
  Eye,
  Edit3,
  Clock,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  Mail,
  Copy,
  Trash2,
  LogOut,
  CreditCard,
  User,
  Upload,
  Wand2,
  Calendar,
  DollarSign,
  LayoutGrid,
  MessageSquare,
  ChevronDown,
  ArrowUpRight,
  UserPlus,
  Video,
  CalendarDays,
  Cpu,
  Palette,
  BrainCircuit,
  Link2,
  ExternalLink,
  CheckSquare,
  Folder,
  Zap,
  List,
  MoreHorizontal,
  Rocket,
  Lock,
  Share,
  Home,
  Presentation,
  Play,
  Pause,
  RotateCcw,
  Receipt,
  Tag,
  Circle,
  Database,
  CheckCheck,
  AlertCircle,
  Key,
  RefreshCw,
} from 'lucide-react';
import { ZendoLogo } from './ZendoLogo';
import { WorkspaceOnboardingConfig } from './OnboardingSetupPage';

import {
  ProposalItem,
  ProposalStatus,
  ProposalStyleTone,
  ClientItem,
  ProposalTemplateItem,
  FollowUpItem,
  NotificationItem,
  ClientMessageItem,
  ClientWorkspaceTaskItem,
  ScheduledMeetingItem,
  MeetingType,
  INITIAL_PROPOSALS,
  INITIAL_CLIENTS,
  INITIAL_TEMPLATES,
  INITIAL_FOLLOW_UPS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CLIENT_MESSAGES,
  INITIAL_CLIENT_TASKS,
  INITIAL_MEETINGS,
} from '../data/zendoProposalsData';
import {
  fetchWorkspaceFromBackend,
  saveProposalToBackend,
  deleteProposalFromBackend,
  saveClientToBackend,
  saveFollowUpToBackend,
  saveClientMessageToBackend,
  saveClientTaskToBackend,
  saveWorkspaceSetupToBackend,
  generateProposalWithZendoAi,
  polishSectionWithZendoAi,
  saveMeetingToSql,
  savePaymentToSql,
  syncToSqlDatabase,
  fetchResendSettings,
  saveResendSettings,
  disconnectResendSettings,
  sendResendTest,
} from '../lib/api';
import {
  fetchClientsFromSupabase,
  createClientInSupabase,
  updateClientInSupabase,
  deleteClientInSupabase,
  type SupabaseClientRow,
} from '../lib/supabase';
import {
  auth,
  HAS_FIRESTORE_DB,
  type User as FirebaseUser,
  sanitizeId,
} from '../firebase';
import { TaskItem, type ProjectItem } from '../data/zendoCopy';
import {
  getOrCreateBusinessProfile,
  subscribeToBusinessDashboard,
  createClientRecord,
  createProposalRecord,
  createMeetingRecord,
  createTaskRecord,
  createPaymentRecord,
  createProjectRecord,
  updateTaskStatusInFirestore,
  updatePaymentStatusInFirestore,
  updateProposalInFirestore as updateProposalInDb,
  deleteRecordFromFirestore,
  type DashboardMetrics,
  type DashboardDataset,
  type UserBusinessProfile,
} from '../services/dashboardDataService';
import teamLeadAvatar from '../assets/images/avatar_team_lead_1791380135632.jpg';
import avatarCreativeDesigner from '../assets/images/avatar_creative_designer_1792321596171.jpg';
import avatarProductStrategist from '../assets/images/avatar_product_strategist_1792321597348.jpg';
import avatarLeadEngineer from '../assets/images/avatar_lead_engineer_1792321596662.jpg';
import { MeetingSchedulingView } from './MeetingSchedulingView';
import { PROPOSAL_THEMES, ProposalThemeKey } from '../data/proposalThemes';
import { ProposalCoverRenderer } from './ProposalCoverRenderer';
import { NemotronProposalModal } from './NemotronProposalModal';
import { ClientStoreView } from './ClientStoreView';
import { SqlStudioView } from './SqlStudioView';
import { saveClientMetadata, getClientMetadata } from '../lib/clientMetadata';
import { ClientLogoPicker } from './ClientLogoPicker';

export type ZendoRoute =
  | '/dashboard'
  | '/proposals'
  | '/proposals/new'
  | '/proposals/editor'
  | '/clients'
  | '/messages'
  | '/meetings'
  | '/projects'
  | '/tasks'
  | '/payments'
  | '/sql-database'
  | '/templates'
  | '/automations'
  | '/analytics'
  | '/settings'
  | '/calendar'
  | '/follow-ups';

export interface DashboardPaymentItem {
  id: string;
  invoiceNumber: string;
  clientCompany: string;
  projectTitle: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentMethod?: string;
  paidDate?: string;
}

export interface ZendoDashboardProps {
  userName?: string;
  userEmail?: string;
  userPhotoUrl?: string;
  onUpdateUserName?: (name: string) => void;
  onboardingConfig?: WorkspaceOnboardingConfig;
  onReopenOnboarding?: () => void;
  activePlan?: 'Free' | 'Pro' | 'Team';
  onChangePlan?: (plan: 'Free' | 'Pro' | 'Team') => void;
  onBackToSite?: () => void;
  onLogout?: () => void;
  tasks?: TaskItem[];
  firebaseUser?: FirebaseUser | null;
}

const PROPOSALS_STORAGE_KEY = 'zendo_ai_proposals_v1';
const PAYMENTS_STORAGE_KEY = 'zendo_dashboard_payments_v1';
const TASKS_STORAGE_KEY = 'zendo_dashboard_tasks_v1';

const AVAILABLE_SERVICES = [
  'UX Research & Wireframes',
  'Custom Web Design',
  'Webflow / React Development',
  'Brand Strategy & Positioning',
  'Visual Identity System',
  'Conversion Rate Optimization',
  'Technical SEO & Content',
  'Monthly Growth Retainer',
  'Mobile & Web App Engineering',
  'Design System & UI Kit',
];

const INDUSTRY_OPTIONS = [
  'AI & SaaS Technology',
  'Design & Creative Agency',
  'B2B Commerce',
  'FinTech & Analytics',
  'Digital Health',
  'E-Commerce & Retail',
  'Professional Services',
  'Real Estate & Architecture',
];

export const StatusBadge: React.FC<{ status: ProposalStatus }> = ({ status }) => {
  const styles: Record<ProposalStatus, string> = {
    Draft: 'bg-[#f3f4f6] text-[#4b5563] border-[#e5e7eb]',
    Sent: 'bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]',
    Viewed: 'bg-[#f0eefc] text-[#5b4bc4] border-[#d8d4f7]',
    'Follow-up': 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
    Accepted: 'bg-[#e9f2ec] text-[#2b543e] border-[#cfddd0]',
    Declined: 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export const DashboardView: React.FC<ZendoDashboardProps> = ({
  userName = 'Alex Morgan',
  userEmail = 'alex.morgan@zendo.ai',
  userPhotoUrl,
  onUpdateUserName,
  onboardingConfig,
  onReopenOnboarding,
  activePlan = 'Pro',
  onChangePlan,
  onBackToSite,
  onLogout,
  tasks = [],
  firebaseUser,
}) => {
  const activeFbUser = firebaseUser || auth.currentUser;
  const displayUserName = userName?.trim() ? userName : 'Alex Morgan';
  const firstName = displayUserName.split(' ')[0] || 'Alex';

  // Navigation Route State
  const [currentRoute, setCurrentRoute] = useState<ZendoRoute>('/dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Business Profile & Firestore State
  const [businessProfile, setBusinessProfile] = useState<UserBusinessProfile | null>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [missingClientRefs, setMissingClientRefs] = useState<string[]>([]);

  // Core Data State from real Firestore queries
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplateItem[]>(INITIAL_TEMPLATES);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [clientMessages, setClientMessages] = useState<ClientMessageItem[]>([]);
  const [clientTasks, setClientTasks] = useState<ClientWorkspaceTaskItem[]>([]);
  const [meetings, setMeetings] = useState<ScheduledMeetingItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  // Derived Business ID consistently applied to all records
  const currentBizId = useMemo(() => {
    if (businessProfile?.businessId) return businessProfile.businessId;
    if (activeFbUser?.uid) return `biz_${sanitizeId(activeFbUser.uid)}`;
    return 'biz_guest';
  }, [businessProfile, activeFbUser]);

  // Meeting Scheduling Modals & Form State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [bookingLinkModalOpen, setBookingLinkModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedMeetingForReschedule, setSelectedMeetingForReschedule] =
    useState<ScheduledMeetingItem | null>(null);

  // New Meeting Form fields
  const [meetingTitle, setMeetingTitle] = useState('Acme Studio — Proposal Walkthrough');
  const [meetingClientCompany, setMeetingClientCompany] = useState('Acme Studio');
  const [meetingClientName, setMeetingClientName] = useState('Hannah Lin');
  const [meetingClientEmail, setMeetingClientEmail] = useState('hannah@acmestudio.co');
  const [meetingType, setMeetingType] = useState<MeetingType>('Proposal Walkthrough');
  const [meetingDate, setMeetingDate] = useState('2026-10-15');
  const [meetingTime, setMeetingTime] = useState('2:00 PM');
  const [meetingDuration, setMeetingDuration] = useState(45);
  const [meetingPlatform, setMeetingPlatform] = useState<
    'Google Meet' | 'Zoom' | 'Phone Call' | 'In-Person'
  >('Google Meet');
  const [meetingAgenda, setMeetingAgenda] = useState(
    'Walk through the proposal scope, deliverables, timeline, and discuss any questions before contract sign-off.'
  );
  const [meetingLinkedProposal, setMeetingLinkedProposal] = useState('prop-acme-web');

  // Reschedule Form fields
  const [rescheduleDate, setRescheduleDate] = useState('2026-10-16');
  const [rescheduleTime, setRescheduleTime] = useState('3:00 PM');

  // Meetings Page tabs & filters
  const [meetingsTab, setMeetingsTab] = useState<'all' | 'upcoming' | 'completed' | 'calendar'>('all');
  const [meetingsFilterClient, setMeetingsFilterClient] = useState<string>('All');
  const [meetingsSearchQuery, setMeetingsSearchQuery] = useState('');

  const [newMessageText, setNewMessageText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskClient, setNewTaskClient] = useState('Acme Studio');
  const [newTaskCategory, setNewTaskCategory] = useState<
    'Task' | 'Deadline' | 'Meeting' | 'Project Update'
  >('Task');
  const [newTaskDue, setNewTaskDue] = useState('Tomorrow, 3:00 PM');

  // Dedicated Tasks Workspace State
  // Dedicated Tasks Workspace State (populated from real Firestore queries)
  const [dashboardTasks, setDashboardTasks] = useState<TaskItem[]>([]);
  const [taskFilter, setTaskFilter] = useState<'today' | 'in_progress' | 'completed' | 'all'>('today');
  const [inlineNewTaskTitle, setInlineNewTaskTitle] = useState('');
  const [inlineNewTaskProject, setInlineNewTaskProject] = useState('Website redesign');
  const [inlineNewTaskPriority, setInlineNewTaskPriority] = useState<'High' | 'Medium' | 'Calm'>('High');

  // Dedicated Payments & Invoicing State (populated from real Firestore queries)
  const [payments, setPayments] = useState<DashboardPaymentItem[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false);
  const [newInvoiceClient, setNewInvoiceClient] = useState('Acme Studio');
  const [newInvoiceProject, setNewInvoiceProject] = useState('Website Redesign Phase 2');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('4800');
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState('2026-10-31');

  // Messages Workspace State
  const [selectedMessageClient, setSelectedMessageClient] = useState('Acme Studio');
  const [messagesSearchQuery, setMessagesSearchQuery] = useState('');
  const [inboxReplyText, setInboxReplyText] = useState('');

  // Real-time Firestore Dashboard Synchronization
  useEffect(() => {
    if (!activeFbUser) {
      setIsDataLoading(false);
      return;
    }

    let isMounted = true;
    let unsub: (() => void) | null = null;
    setIsDataLoading(true);
    setDataError(null);

    getOrCreateBusinessProfile(activeFbUser, userName, onboardingConfig?.companyName)
      .then((profile) => {
        if (!isMounted) return;
        setBusinessProfile(profile);

        unsub = subscribeToBusinessDashboard(
          profile.businessId,
          (dataset) => {
            if (!isMounted) return;
            setProposals(dataset.proposals);
            setClients(dataset.clients);
            setMeetings(dataset.meetings);
            setProjects(dataset.projects);
            setDashboardTasks(dataset.tasks);
            setPayments(dataset.payments);
            setFollowUps(dataset.followUps);
            setDashboardMetrics(dataset.metrics);
            setMissingClientRefs(dataset.missingClientReferences);
            setIsDataLoading(false);
          },
          (err) => {
            if (!isMounted) return;
            setDataError(err.message || 'Failed to sync business records');
            setIsDataLoading(false);
          }
        );
      })
      .catch((err) => {
        if (!isMounted) return;
        setDataError(err.message || 'Failed to initialize business profile');
        setIsDataLoading(false);
      });

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [activeFbUser, userName, onboardingConfig?.companyName]);

  // Persist payments and tasks locally
  useEffect(() => {
    try {
      localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
    } catch {}
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(dashboardTasks));
    } catch {}
  }, [dashboardTasks]);

  const handleToggleTaskStatus = async (taskId: string) => {
    const t = dashboardTasks.find((item) => item.id === taskId);
    if (!t) return;
    const isDone = t.status === 'completed';
    const nextStatus = isDone ? 'today' : 'completed';
    setDashboardTasks((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: nextStatus } : item))
    );
    try {
      await updateTaskStatusInFirestore(taskId, nextStatus);
      triggerToast(
        isDone ? `Reopened task: "${t.title}"` : `Completed task: "${t.title}"`,
        'success'
      );
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const handleInlineAddTask = async () => {
    if (!inlineNewTaskTitle.trim()) return;
    const matchedClient = clients.find((c) =>
      c.company.toLowerCase().includes(inlineNewTaskProject.toLowerCase())
    );
    try {
      const newTask = await createTaskRecord(currentBizId, {
        title: inlineNewTaskTitle.trim(),
        project: inlineNewTaskProject,
        status: 'today',
        priority: inlineNewTaskPriority,
        dueDate: 'Today · 5:00 PM',
        assignee: displayUserName,
        automated: false,
        estimatedMinutes: 30,
        clientId: matchedClient?.id,
      });
      setDashboardTasks((prev) => (prev.some((t) => t.id === newTask.id) ? prev : [newTask, ...prev]));
      setInlineNewTaskTitle('');
      triggerToast(`Added task: "${newTask.title}"`, 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save task', 'error');
    }
  };

  const handleDeleteDashboardTask = async (taskId: string) => {
    setDashboardTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteRecordFromFirestore('tasks', taskId);
      triggerToast('Task deleted');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleMarkPaymentPaid = async (invoiceId: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === invoiceId) {
          return {
            ...p,
            status: 'Paid',
            paidDate: 'Oct 23, 2026',
            paymentMethod: p.paymentMethod || 'Direct Transfer · Confirmed',
          };
        }
        return p;
      })
    );
    try {
      await updatePaymentStatusInFirestore(invoiceId, 'Paid', 'Direct Transfer · Confirmed', 'Oct 23, 2026');
      triggerToast('Payment confirmed and marked as Paid!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update payment status', 'error');
    }
  };

  const handleCreateNewInvoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amountNum = parseFloat(newInvoiceAmount) || 1000;
    let matchedClient = clients.find(
      (c) => c.company.toLowerCase() === newInvoiceClient.trim().toLowerCase()
    );
    let clientId = matchedClient?.id;
    if (!matchedClient) {
      try {
        matchedClient = await createClientRecord(currentBizId, {
          name: newInvoiceClient,
          company: newInvoiceClient,
          email: `billing@${newInvoiceClient.toLowerCase().replace(/\s+/g, '')}.com`,
          industry: 'Professional Services',
          status: 'Active',
        });
        clientId = matchedClient.id;
      } catch {
        // fallback
      }
    }

    try {
      const newInvoice = await createPaymentRecord(currentBizId, clientId || 'cli-unlinked', {
        invoiceNumber: `INV-2026-${String(payments.length + 41).padStart(3, '0')}`,
        clientCompany: newInvoiceClient,
        projectTitle: newInvoiceProject,
        amount: amountNum,
        currency: '$',
        issueDate: 'Oct 23, 2026',
        dueDate: newInvoiceDueDate || 'Nov 06, 2026',
        status: 'Pending',
        paymentMethod: 'Stripe · Invoice Link',
      });
      setPayments((prev) => (prev.some((p) => p.id === newInvoice.id) ? prev : [newInvoice, ...prev]));
      void savePaymentToSql({
        paymentKey: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        clientCompany: newInvoice.clientCompany,
        projectTitle: newInvoice.projectTitle,
        amount: newInvoice.amount,
        currency: newInvoice.currency,
        issueDate: newInvoice.issueDate,
        dueDate: newInvoice.dueDate,
        status: newInvoice.status,
      });
      setNewInvoiceModalOpen(false);
      triggerToast(
        `Created ${newInvoice.invoiceNumber} for ${newInvoice.clientCompany} ($${amountNum.toLocaleString()})`,
        'success'
      );
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create invoice', 'error');
    }
  };

  const handleSendInboxReply = (clientCompany: string) => {
    if (!inboxReplyText.trim()) return;
    const newMsg: ClientMessageItem = {
      id: `msg-${Date.now()}`,
      proposalId: activeProposalId,
      clientCompany,
      senderName: displayUserName,
      senderRole: 'agency',
      senderType: 'agency',
      messageText: inboxReplyText.trim(),
      timeLabel: 'Just now',
      channel: 'chat',
      deliveryStatus: 'sent',
    };
    setClientMessages((prev) => [...prev, newMsg]);
    void saveClientMessageToBackend(newMsg);
    setInboxReplyText('');
    triggerToast(`Reply sent to ${clientCompany}`);
  };

  const handleSaveResendSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingResend(true);
    try {
      const res = await saveResendSettings({
        apiKey: resendApiKeyInput,
        webhookSecret: resendWebhookSecretInput,
        fromName: resendFromNameInput,
        fromEmail: resendFromEmailInput,
        useDefaultEmail: useDefaultResendEmail,
      });
      triggerToast('Resend email settings saved successfully');
      setResendApiKeyInput('');
      setResendWebhookSecretInput('');
      if (res?.settings) {
        setResendApiKeyMasked(res.settings.apiKeyMasked || '');
        setResendWebhookSecretMasked(res.settings.webhookSecretMasked || '');
        setResendStatus(res.settings.status || 'Connected');
      }
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Failed to save Resend settings', 'error');
    } finally {
      setIsSavingResend(false);
    }
  };

  const handleDisconnectResend = async () => {
    try {
      await disconnectResendSettings();
      setResendApiKeyInput('');
      setResendWebhookSecretInput('');
      setResendApiKeyMasked('');
      setResendWebhookSecretMasked('');
      setUseDefaultResendEmail(true);
      triggerToast('Resend integration disconnected. Restored Zendo default email.');
      const data = await fetchResendSettings();
      if (data) {
        setResendStatus(data.status || 'Connected');
      }
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Failed to disconnect', 'error');
    }
  };

  const handleSendResendTestEmail = async () => {
    if (!testEmailInput || !testEmailInput.includes('@')) {
      triggerToast('Please provide a valid test recipient email address', 'error');
      return;
    }
    setIsSendingTestEmail(true);
    try {
      await sendResendTest(testEmailInput.trim());
      triggerToast(`Test email delivered to ${testEmailInput}`);
      const data = await fetchResendSettings();
      if (data) {
        setResendDailyUsage({
          sentCount: data.sentCount || 0,
          receivedCount: data.receivedCount || 0,
          dailyLimit: data.dailyLimit || 100,
          remainingCount: data.remainingCount !== undefined ? data.remainingCount : 100,
        });
      }
    } catch (err: unknown) {
      triggerToast(err instanceof Error ? err.message : 'Test email failed to send', 'error');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Load workspace data from Cloud SQL backend when authenticated
  useEffect(() => {
    let mounted = true;
    fetchWorkspaceFromBackend().then((data) => {
      if (!mounted || !data) return;
      if (Array.isArray(data.proposals) && data.proposals.length > 0) {
        setProposals(data.proposals);
      }
      if (Array.isArray(data.clients) && data.clients.length > 0) {
        setClients(data.clients);
      }
      if (Array.isArray(data.followUps) && data.followUps.length > 0) {
        setFollowUps(data.followUps);
      }
      if (Array.isArray(data.clientMessages) && data.clientMessages.length > 0) {
        setClientMessages(data.clientMessages);
      }
      if (Array.isArray(data.clientTasks) && data.clientTasks.length > 0) {
        setClientTasks(data.clientTasks);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Empty State Demo Toggle (for testing the required Empty State view)
  const [showEmptyStateDemo, setShowEmptyStateDemo] = useState(false);

  // Active Proposal in Editor
  const [activeProposalId, setActiveProposalId] = useState<string>(
    INITIAL_PROPOSALS[0].id
  );
  const [isEditorPreviewMode, setIsEditorPreviewMode] = useState(false);

  // Header UI states
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(
    null
  );

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3400);
  };

  // NVIDIA Nemotron AI Modal & Theme Selection
  const [nemotronModalOpen, setNemotronModalOpen] = useState(false);
  const [nemotronInitialTemplate, setNemotronInitialTemplate] =
    useState<ProposalThemeKey>('executive-skyline');
  const [selectedTemplateTheme, setSelectedTemplateTheme] =
    useState<ProposalThemeKey>('executive-skyline');

  const handleOpenNemotronModal = (templateKey: ProposalThemeKey = 'executive-skyline') => {
    setNemotronInitialTemplate(templateKey);
    setNemotronModalOpen(true);
  };

  const handleApplyNemotronProposal = (newProposal: ProposalItem) => {
    setProposals((prev) => [newProposal, ...prev]);
    setActiveProposalId(newProposal.id);
    navigateTo('/proposals/editor', newProposal.id);
    triggerToast(`Created "${newProposal.title}" successfully!`);
  };

  // Persist workspace data locally alongside Supabase & Cloud SQL sync
  useEffect(() => {
    try {
      localStorage.setItem(
        PROPOSALS_STORAGE_KEY,
        JSON.stringify({
          proposals,
          clients,
          followUps,
          clientMessages,
          clientTasks,
          meetings,
          templates,
        })
      );
    } catch {
      // ignore
    }
  }, [proposals, clients, followUps, clientMessages, clientTasks, meetings, templates]);

  // Sync browser URL softly for authentic navigation feel
  const navigateTo = (route: ZendoRoute, proposalId?: string) => {
    if (proposalId) {
      setActiveProposalId(proposalId);
    }
    setCurrentRoute(route);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
    setSearchFocused(false);

    try {
      const urlPath =
        route === '/proposals/editor' && proposalId
          ? `/proposals/${proposalId}`
          : route;
      window.history.pushState({ route, proposalId }, '', urlPath);
    } catch {
      // ignore in restricted iframe environments
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Set URL to /dashboard on initial mount
  useEffect(() => {
    try {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        window.history.replaceState({ route: '/dashboard' }, '', '/dashboard');
      }
    } catch {
      // ignore
    }
  }, []);

  // ============================================================================
  // CREATE PROPOSAL FLOW (/proposals/new) STATE
  // ============================================================================
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-web-redesign');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generationStageText, setGenerationStageText] = useState(
    'Analyzing client requirements & industry benchmarks...'
  );
  const [formError, setFormError] = useState('');

  // Add Custom Template Modal State
  const [addTemplateModalOpen, setAddTemplateModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Web Design');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateValue, setNewTemplateValue] = useState('$5,000 – $10,000');
  const [newTemplateTimeline, setNewTemplateTimeline] = useState('4 weeks');
  const [newTemplateTone, setNewTemplateTone] = useState<ProposalStyleTone>('Premium');
  const [newTemplateServices, setNewTemplateServices] = useState('UX Research, UI Design, Development, Launch');
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('');
  const [newTemplateNotes, setNewTemplateNotes] = useState('');

  // Step 1 fields
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientIndustry, setClientIndustry] = useState('AI & SaaS Technology');

  // Step 2 fields
  const [projectTitle, setProjectTitle] = useState('');
  const [clientNeed, setClientNeed] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'UX Research & Wireframes',
    'Custom Web Design',
  ]);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [projectTimeline, setProjectTimeline] = useState('4 weeks');
  const [projectBudget, setProjectBudget] = useState('$6,500');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  // Step 3 fields
  const [proposalStyle, setProposalStyle] = useState<ProposalStyleTone>(
    (onboardingConfig?.proposalTone as ProposalStyleTone) || 'Premium'
  );

  // ============================================================================
  // MODALS STATE (Add Client, Import Brief, Share Proposal, Send Proposal)
  // ============================================================================
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('AI & SaaS Technology');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [newClientLogoUrl, setNewClientLogoUrl] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);

  // Supabase Real Clients state
  const [supabaseClients, setSupabaseClients] = useState<SupabaseClientRow[]>([]);
  const [isLoadingSupabaseClients, setIsLoadingSupabaseClients] = useState<boolean>(true);
  const [supabaseClientsError, setSupabaseClientsError] = useState<string | null>(null);

  // Edit Client Modal state
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<SupabaseClientRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIndustry, setEditIndustry] = useState('AI & SaaS Technology');
  const [editNotes, setEditNotes] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [isUpdatingClient, setIsUpdatingClient] = useState(false);

  // Delete Client Modal state
  const [deleteClientModalOpen, setDeleteClientModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<SupabaseClientRow | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  const [importBriefModalOpen, setImportBriefModalOpen] = useState(false);
  const [briefText, setBriefText] = useState(
    'Client: Horizon Ventures (Claire Bennett, claire@horizonvc.com)\nProject: Complete Website Redesign & Investor Portal UX\nBudget: $8,500 · Timeline: 5 weeks\nGoals: Modernize brand presence, streamline portfolio company directory, and improve LP onboarding flow.'
  );

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendRecipientEmail, setSendRecipientEmail] = useState('');
  const [sendSubject, setSendSubject] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Proposals Page Filter State
  const [proposalsFilterStatus, setProposalsFilterStatus] = useState<
    'All' | ProposalStatus
  >('All');
  const [proposalsSearchQuery, setProposalsSearchQuery] = useState('');

  // Follow-ups Page Selected Follow-up
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string>(
    INITIAL_FOLLOW_UPS[0].id
  );
  const [followUpDraftSubject, setFollowUpDraftSubject] = useState(
    INITIAL_FOLLOW_UPS[0].suggestedSubject
  );
  const [followUpDraftBody, setFollowUpDraftBody] = useState(
    INITIAL_FOLLOW_UPS[0].suggestedMessage
  );

  // Settings Page State
  const [settingsTab, setSettingsTab] = useState<
    'profile' | 'workspace' | 'integrations' | 'billing' | 'export'
  >('profile');
  const [profileNameInput, setProfileNameInput] = useState(displayUserName);
  const [profileEmailInput, setProfileEmailInput] = useState(
    userEmail || 'alex.morgan@zendo.ai'
  );

  // Resend Email Integration Settings State
  const [resendApiKeyInput, setResendApiKeyInput] = useState('');
  const [resendWebhookSecretInput, setResendWebhookSecretInput] = useState('');
  const [resendFromNameInput, setResendFromNameInput] = useState('');
  const [resendFromEmailInput, setResendFromEmailInput] = useState('');
  const [useDefaultResendEmail, setUseDefaultResendEmail] = useState(true);
  const [resendStatus, setResendStatus] = useState<'Not connected' | 'Connected' | 'Error'>('Connected');
  const [resendApiKeyMasked, setResendApiKeyMasked] = useState('');
  const [resendWebhookSecretMasked, setResendWebhookSecretMasked] = useState('');
  const [testEmailInput, setTestEmailInput] = useState(userEmail || 'alex.morgan@zendo.ai');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSavingResend, setIsSavingResend] = useState(false);
  const [showApiKeyPlain, setShowApiKeyPlain] = useState(false);
  const [showWebhookPlain, setShowWebhookPlain] = useState(false);
  const [resendDailyUsage, setResendDailyUsage] = useState({
    sentCount: 0,
    receivedCount: 0,
    dailyLimit: 100,
    remainingCount: 100,
  });

  useEffect(() => {
    fetchResendSettings().then((data) => {
      if (data) {
        setUseDefaultResendEmail(data.useDefaultEmail !== false);
        setResendStatus(data.status || 'Connected');
        setResendApiKeyMasked(data.apiKeyMasked || '');
        setResendWebhookSecretMasked(data.webhookSecretMasked || '');
        setResendFromNameInput(data.fromName || '');
        setResendFromEmailInput(data.fromEmail || '');
        setResendDailyUsage({
          sentCount: data.sentCount || 0,
          receivedCount: data.receivedCount || 0,
          dailyLimit: data.dailyLimit || 100,
          remainingCount: data.remainingCount !== undefined ? data.remainingCount : 100,
        });
      }
    });
  }, []);

  useEffect(() => {
    setProfileNameInput(displayUserName);
  }, [displayUserName]);

  useEffect(() => {
    if (userEmail) {
      setProfileEmailInput(userEmail);
      setTestEmailInput(userEmail);
    }
  }, [userEmail]);
  const [workspaceCompanyInput, setWorkspaceCompanyInput] = useState(
    onboardingConfig?.companyName || 'Zendo Studio'
  );
  const [workspaceCurrencyInput, setWorkspaceCurrencyInput] = useState<string>(
    onboardingConfig?.currency || 'USD ($)'
  );
  const [workspaceDefaultTone, setWorkspaceDefaultTone] = useState<ProposalStyleTone>(
    (onboardingConfig?.proposalTone as ProposalStyleTone) || 'Premium'
  );

  // Active Proposal Object for Editor
  const activeProposal = useMemo(
    () => proposals.find((p) => p.id === activeProposalId) || proposals[0],
    [proposals, activeProposalId]
  );

  // Real Firestore Statistics Calculation (No demo offsets)
  const statTotalProposals = showEmptyStateDemo ? 0 : proposals.length;
  const statDrafts = showEmptyStateDemo
    ? 0
    : proposals.filter((p) => p.status === 'Draft').length;
  const statSent = showEmptyStateDemo
    ? 0
    : proposals.filter((p) => p.status === 'Sent').length;
  const statWon = showEmptyStateDemo
    ? 0
    : proposals.filter((p) => p.status === 'Accepted').length;
  const statDeclined = showEmptyStateDemo
    ? 0
    : proposals.filter((p) => p.status === 'Declined').length;
  const statWinRate =
    statTotalProposals > 0 ? Math.round((statWon / statTotalProposals) * 100) : 0;

  // Real pipeline value calculated from Firestore proposals
  const activePipelineValue = useMemo(() => {
    if (showEmptyStateDemo) return 0;
    return proposals.reduce((acc, p) => {
      const num =
        typeof p.numericValue === 'number'
          ? p.numericValue
          : parseFloat(String(p.value || '0').replace(/[^0-9.]/g, '')) || 0;
      return acc + num;
    }, 0);
  }, [proposals, showEmptyStateDemo]);

  // Real task metrics from Firestore tasks
  const effectiveTasks = tasks && tasks.length > 0 ? tasks : [];
  const tasksCompletedCount = effectiveTasks.filter(
    (t) => t.status === 'completed'
  ).length;
  const tasksTotalCount = effectiveTasks.length;
  const taskCompletionPct =
    tasksTotalCount > 0
      ? Math.round((tasksCompletedCount / tasksTotalCount) * 100)
      : 0;

  // Real focus time calculated from scheduled meetings duration and completed tasks
  const totalMeetingDurationMinutes = useMemo(() => {
    return meetings.reduce((acc, m) => acc + (m.durationMinutes || 45), 0);
  }, [meetings]);
  const totalFocusMinutes = totalMeetingDurationMinutes + tasksCompletedCount * 25;
  const focusHours = Math.floor(totalFocusMinutes / 60);
  const focusMins = totalFocusMinutes % 60;
  const formattedFocusTime = `${focusHours}h ${focusMins}m`;
  const focusTimeToday = `${Math.min(focusHours, 2)}h ${focusMins}m today`;

  // Real daily activity distribution for the weekly chart
  const weeklyDayCounts = useMemo(() => {
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
    effectiveTasks.forEach((t, i) => {
      const days: (keyof typeof counts)[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const targetDay = days[i % 5];
      counts[targetDay] += 1;
    });
    const maxVal = Math.max(1, ...Object.values(counts));
    return [
      {
        day: 'Mon',
        count: counts.Mon,
        baseHeight: Math.min(80, Math.max(16, (counts.Mon / maxVal) * 60)),
        capHeight: 12,
      },
      {
        day: 'Tue',
        count: counts.Tue,
        baseHeight: Math.min(80, Math.max(16, (counts.Tue / maxVal) * 60)),
        capHeight: 14,
      },
      {
        day: 'Wed',
        count: counts.Wed,
        baseHeight: Math.min(80, Math.max(16, (counts.Wed / maxVal) * 60)),
        capHeight: 10,
      },
      {
        day: 'Thu',
        count: counts.Thu,
        baseHeight: Math.min(80, Math.max(16, (counts.Thu / maxVal) * 60)),
        capHeight: 16,
      },
      {
        day: 'Fri',
        count: counts.Fri,
        baseHeight: Math.min(80, Math.max(16, (counts.Fri / maxVal) * 60)),
        capHeight: 10,
      },
    ];
  }, [effectiveTasks]);

  // Unread notifications count
  const unreadCount = notifications.filter((n) => n.unread).length;

  // Global Search Results
  const globalSearchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return { proposals: [], clients: [], templates: [] };
    return {
      proposals: proposals.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.clientCompany.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q)
      ),
      clients: clients.filter(
        (c) =>
          c.company.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q)
      ),
      templates: templates.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      ),
    };
  }, [globalSearch, proposals, clients, templates]);

  // Open Proposal Details / Editor
  const handleOpenProposal = (proposal: ProposalItem, preview = false) => {
    setActiveProposalId(proposal.id);
    setIsEditorPreviewMode(preview);
    navigateTo('/proposals/editor', proposal.id);
  };

  // Select or clear template in Step 1
  const handleSelectTemplate = (tpl: ProposalTemplateItem | null) => {
    if (!tpl) {
      setSelectedTemplateId('blank');
      setProjectTitle('Custom Client Proposal');
      setSelectedServices(['Strategic Advisory', 'Implementation & Delivery']);
      setProjectTimeline('4 weeks');
      setProjectBudget('$5,000');
      setClientNeed('');
      return;
    }
    setSelectedTemplateId(tpl.id);
    setProjectTitle(tpl.title);
    setSelectedServices(tpl.services);
    setProjectTimeline(tpl.typicalTimeline);
    setProjectBudget(tpl.typicalValue.split('–')[0].trim());
    setClientNeed(tpl.clientNeedPrompt);
    setAdditionalRequirements(tpl.additionalNotes || '');
    setProposalStyle(tpl.recommendedTone);
    if (tpl.themeKey) {
      setSelectedTemplateTheme(tpl.themeKey);
    }
  };

  // Add Custom Template
  const handleCreateCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) {
      triggerToast('Please provide a template title', 'info');
      return;
    }
    const servicesList = newTemplateServices
      .split(/[,·\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const createdTemplate: ProposalTemplateItem = {
      id: `tpl-custom-${Date.now()}`,
      title: newTemplateTitle.trim(),
      category: newTemplateCategory.trim() || 'Custom',
      description:
        newTemplateDescription.trim() ||
        'Bespoke scope, pricing, and milestone structure created for your workspace.',
      typicalValue: newTemplateValue.trim() || '$5,000 – $10,000',
      typicalTimeline: newTemplateTimeline.trim() || '4 weeks',
      recommendedTone: newTemplateTone,
      services: servicesList.length > 0 ? servicesList : ['Strategic Consulting', 'Execution'],
      clientNeedPrompt:
        newTemplatePrompt.trim() ||
        `Provide high-impact ${newTemplateTitle.trim()} execution with measurable deliverables.`,
      additionalNotes: newTemplateNotes.trim(),
    };

    setTemplates((prev) => [createdTemplate, ...prev]);
    setSelectedTemplateId(createdTemplate.id);
    handleSelectTemplate(createdTemplate);
    setAddTemplateModalOpen(false);
    setNewTemplateTitle('');
    setNewTemplateDescription('');
    setNewTemplatePrompt('');
    setNewTemplateNotes('');
    triggerToast(`Custom template "${createdTemplate.title}" created & selected!`);
  };

  // Start a new proposal (optionally pre-filled from template or client)
  const handleStartNewProposal = (prefill?: {
    templateId?: string;
    clientName?: string;
    companyName?: string;
    clientEmail?: string;
    industry?: string;
    title?: string;
    clientNeed?: string;
    services?: string[];
    timeline?: string;
    budget?: string;
    additionalRequirements?: string;
    style?: ProposalStyleTone;
  }) => {
    setFormError('');
    if (prefill?.templateId) {
      setSelectedTemplateId(prefill.templateId);
    } else {
      setSelectedTemplateId('tpl-web-redesign');
    }
    setCreateStep(1); // Step 1: Start with Client details
    setClientName(prefill?.clientName || '');
    setCompanyName(prefill?.companyName || '');
    setClientEmail(prefill?.clientEmail || '');
    setClientIndustry(prefill?.industry || 'AI & SaaS Technology');
    setProjectTitle(prefill?.title || 'Website Redesign & Conversion');
    setClientNeed(
      prefill?.clientNeed ||
        'Redesign the core marketing website to improve brand positioning, showcase client case studies, and increase inbound demo conversions.'
    );
    setSelectedServices(
      prefill?.services && prefill.services.length > 0
        ? prefill.services
        : ['UX Research & Wireframes', 'Custom Web Design', 'Webflow / React Build', 'Technical SEO']
    );
    setProjectTimeline(prefill?.timeline || '4 weeks');
    setProjectBudget(prefill?.budget || '$4,800');
    setAdditionalRequirements(prefill?.additionalRequirements || '');
    setProposalStyle(prefill?.style || workspaceDefaultTone);
    navigateTo('/proposals/new');
  };

  // Toggle service in Step 2
  const handleToggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleAddCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (!trimmed) return;
    if (!selectedServices.includes(trimmed)) {
      setSelectedServices((prev) => [...prev, trimmed]);
    }
    setCustomServiceInput('');
  };

  // Validate and advance steps in /proposals/new (4-step flow: 1 Client -> 2 Project -> 3 Style -> 4 Template)
  const handleNextStep = () => {
    setFormError('');
    if (createStep === 1) {
      // Step 1: Client details validation
      if (!clientName.trim() || !companyName.trim()) {
        setFormError('Please enter both the client name and company name.');
        return;
      }
      if (!clientEmail.trim() || !clientEmail.includes('@')) {
        setFormError('Please enter a valid client email address.');
        return;
      }
      setCreateStep(2);
    } else if (createStep === 2) {
      // Step 2: Project scope validation
      if (!clientNeed.trim()) {
        setFormError('Please describe what the client needs for this project.');
        return;
      }
      if (selectedServices.length === 0) {
        setFormError('Please select at least one service to provide.');
        return;
      }
      if (!projectBudget.trim()) {
        setFormError('Please specify an estimated budget.');
        return;
      }
      setCreateStep(3);
    } else if (createStep === 3) {
      // Step 3: Style & Tone -> Advance to Step 4: Templates & Visual Design
      setCreateStep(4);
    }
  };

  // Generate Proposal with Zendo AI
  const handleGenerateProposalWithAI = async () => {
    setFormError('');
    setIsGeneratingAI(true);
    setGenerationStageText(
      `Connecting to Zendo AI brain for ${companyName}...`
    );

    const cleanBudgetNum =
      parseInt(projectBudget.replace(/[^0-9]/g, ''), 10) || 6500;
    const formattedBudget = projectBudget.startsWith('$')
      ? projectBudget
      : `$${cleanBudgetNum.toLocaleString()}`;

    const derivedTitle =
      projectTitle.trim() ||
      (selectedServices[0]
        ? `${selectedServices[0].split('&')[0].trim()} Proposal`
        : 'Strategic Digital Proposal');

    const toneAdjective =
      proposalStyle === 'Premium'
        ? 'bespoke, high-impact'
        : proposalStyle === 'Friendly'
        ? 'collaborative, people-first'
        : proposalStyle === 'Direct'
        ? 'results-driven, streamlined'
        : 'comprehensive, strategic';

    const aiResult = await generateProposalWithZendoAi({
      companyName: companyName.trim(),
      clientName: clientName.trim(),
      clientIndustry,
      projectTitle: derivedTitle,
      selectedServices,
      projectBudget: formattedBudget,
      projectTimeline: projectTimeline || '4 weeks',
      proposalStyle,
      additionalRequirements: additionalRequirements.trim(),
      clientNeed: clientNeed.trim(),
    });

    const execSum =
      aiResult?.executiveSummary ||
      `${companyName.trim()} is positioned for its next stage of growth in ${clientIndustry}. Based on our discovery conversations with ${clientName.trim()}, this proposal outlines a ${toneAdjective} roadmap to deliver ${selectedServices.join(', ')} within ${projectTimeline || '4 weeks'}.`;

    const prob =
      aiResult?.clientProblem ||
      clientNeed.trim() ||
      `${companyName.trim()} needs a cohesive partner to modernize key digital touchpoints, eliminate workflow bottlenecks, and accelerate measurable conversion outcomes.`;

    const sol =
      aiResult?.proposedSolution ||
      `We will execute a structured ${projectTimeline || '4-week'} engagement combining ${selectedServices.join(', ')}. Every milestone is designed for rapid validation, clear stakeholder visibility, and long-term scalability.${
        additionalRequirements.trim()
          ? ` Special focus: ${additionalRequirements.trim()}`
          : ''
      }`;

    const terms =
      aiResult?.termsAndNextSteps ||
      `To initiate this engagement with ${workspaceCompanyInput}, approve the proposal below. We will send the project kick-off calendar invite and shared workspace access within 24 hours.`;

    const newProposal: ProposalItem = {
      id: `prop-${Date.now()}`,
      title: derivedTitle,
      clientName: clientName.trim(),
      clientCompany: companyName.trim(),
      clientEmail: clientEmail.trim(),
      industry: clientIndustry,
      value: formattedBudget,
      numericValue: cleanBudgetNum,
      status: 'Draft',
      updatedAt: 'Just now',
      style: proposalStyle,
      timelineSummary: projectTimeline || '4 weeks',
      services: selectedServices,
      templateTheme: selectedTemplateTheme || 'executive-skyline',
      sections: {
        coverSubtitle: `${proposalStyle} proposal powered by Zendo AI for ${companyName.trim()} (${clientIndustry})`,
        preparedFor: `${clientName.trim()} · ${companyName.trim()}`,
        preparedBy: `${displayUserName} · ${workspaceCompanyInput}`,
        dateIssued: 'October 10, 2026',
        validUntil: 'November 10, 2026',
        executiveSummary: execSum,
        clientProblem: prob,
        proposedSolution: sol,
        servicesDeliverables: selectedServices.map((srv, idx) => ({
          id: `del-gen-${idx}`,
          name: srv,
          description: `Complete strategy, execution, quality assurance, and production handoff for ${srv}.`,
          included: true,
        })),
        timeline: [
          {
            id: 'tl-gen-1',
            phase: 'Phase 1 · Discovery & Strategic Alignment',
            duration: 'Week 1',
            deliverable: 'Kick-off workshop, technical audit, and approved project roadmap',
          },
          {
            id: 'tl-gen-2',
            phase: 'Phase 2 · Core Execution & Architecture',
            duration: 'Weeks 2–3',
            deliverable: `Primary deliverables for ${selectedServices.slice(0, 2).join(' & ')}`,
          },
          {
            id: 'tl-gen-3',
            phase: 'Phase 3 · Review, Optimization & Launch',
            duration: projectTimeline || 'Week 4',
            deliverable: 'Final QA sign-off, team enablement, and production rollout',
          },
        ],
        pricingItems: [
          {
            id: 'pr-gen-1',
            item: 'Discovery, Strategy & Architecture',
            detail: 'Stakeholder alignment, scoping, and foundational framework',
            amount: `$${Math.round(cleanBudgetNum * 0.3).toLocaleString()}`,
          },
          {
            id: 'pr-gen-2',
            item: 'Core Implementation & Deliverables',
            detail: selectedServices.join(', '),
            amount: `$${Math.round(cleanBudgetNum * 0.5).toLocaleString()}`,
          },
          {
            id: 'pr-gen-3',
            item: 'QA, Handover & Launch Support',
            detail: 'Testing, documentation, and post-launch optimization',
            amount: `$${(
              cleanBudgetNum -
              Math.round(cleanBudgetNum * 0.3) -
              Math.round(cleanBudgetNum * 0.5)
            ).toLocaleString()}`,
          },
        ],
        pricingNote:
          '50% deposit upon proposal acceptance; 50% upon final milestone completion.',
        termsAndNextSteps: terms,
      },
    };

    // Ensure client exists in Firestore and resolve targetClientId
    let targetClient = clients.find(
      (c) => c.company.toLowerCase() === companyName.trim().toLowerCase()
    );
    let targetClientId = targetClient?.id;
    if (!targetClient) {
      try {
        const createdClient = await createClientRecord(currentBizId, {
          name: clientName.trim(),
          company: companyName.trim(),
          email: clientEmail.trim(),
          industry: clientIndustry,
          status: 'Prospect',
        });
        targetClientId = createdClient.id;
        setClients((prev) => (prev.some((c) => c.id === createdClient.id) ? prev : [createdClient, ...prev]));
      } catch {
        // fallback
      }
    }

    try {
      const persistedProposal = await createProposalRecord(
        currentBizId,
        targetClientId || 'cli-unlinked',
        newProposal
      );
      setProposals((prev) => (prev.some((p) => p.id === persistedProposal.id) ? prev : [persistedProposal, ...prev]));
      setActiveProposalId(persistedProposal.id);
    } catch {
      setProposals((prev) => [newProposal, ...prev]);
      setActiveProposalId(newProposal.id);
    }

    void saveProposalToBackend(newProposal);
    setShowEmptyStateDemo(false);

    setIsGeneratingAI(false);
    setIsEditorPreviewMode(false);
    navigateTo('/proposals/editor', newProposal.id);
    triggerToast(`Generated "${newProposal.title}" with Zendo AI`, 'success');
  };

  // Update active proposal fields in Editor
  const handleUpdateActiveProposal = (updater: (prev: ProposalItem) => ProposalItem) => {
    if (!activeProposal) return;
    const updated = { ...updater(activeProposal), updatedAt: 'Just now' };
    setProposals((prev) =>
      prev.map((item) => (item.id === activeProposal.id ? updated : item))
    );
    void updateProposalInDb(activeProposal.id, updated);
    void saveProposalToBackend(updated);
  };

  // Send a reply in Client Messages & Q&A
  const handleSendClientMessage = (
    proposalId: string,
    clientCompany: string,
    senderRole: 'agency' | 'client' = 'agency'
  ) => {
    const trimmed = newMessageText.trim();
    if (!trimmed) return;
    const msg: ClientMessageItem = {
      id: `msg-${Date.now()}`,
      proposalId,
      clientCompany,
      senderName: senderRole === 'agency' ? displayUserName : `${clientCompany} Team`,
      senderRole,
      messageText: trimmed,
      timeLabel: 'Just now',
    };
    setClientMessages((prev) => [...prev, msg]);
    void saveClientMessageToBackend(msg);
    setNewMessageText('');
    triggerToast(
      senderRole === 'agency'
        ? `Sent message to ${clientCompany}`
        : `New client reply received from ${clientCompany}`
    );
  };

  // Add a Client Task / Deadline / Meeting / Project Update
  const handleAddClientWorkspaceTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const task: ClientWorkspaceTaskItem = {
      id: `ctask-${Date.now()}`,
      clientCompany: newTaskClient,
      title: trimmed,
      category: newTaskCategory,
      dueDate: newTaskDue.trim() || 'Upcoming',
      status: 'Pending',
      notes: `${newTaskCategory} scheduled for ${newTaskClient}`,
    };
    setClientTasks((prev) => [task, ...prev]);
    void saveClientTaskToBackend(task);
    setNewTaskTitle('');
    triggerToast(`Added ${task.category.toLowerCase()} for ${task.clientCompany}`);
  };

  const handleToggleClientTaskStatus = (taskId: string) => {
    setClientTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus: 'Pending' | 'In Progress' | 'Completed' =
          t.status === 'Completed' ? 'In Progress' : 'Completed';
        const updated = { ...t, status: nextStatus };
        void saveClientTaskToBackend(updated);
        return updated;
      })
    );
  };

  // AI Polish helper inside Proposal Editor (Zendo AI)
  const handleAIPolishSection = async (
    field: 'executiveSummary' | 'clientProblem' | 'proposedSolution'
  ) => {
    if (!activeProposal) return;
    const currentText = activeProposal.sections[field];

    triggerToast('Refining section with Zendo AI...');
    const polishRes = await polishSectionWithZendoAi({
      sectionName: field,
      currentText,
      proposalStyle: activeProposal.style,
      companyName: activeProposal.clientCompany,
    });

    const enhanced =
      polishRes?.polishedText ||
      (field === 'executiveSummary'
        ? `${currentText} Designed specifically for ${activeProposal.clientCompany}'s decision-makers, this engagement prioritizes measurable ROI, rapid time-to-value, and executive transparency at every milestone.`
        : field === 'clientProblem'
        ? `${currentText} Addressing these friction points now will unlock immediate conversion lift and strengthen ${activeProposal.clientCompany}'s competitive moat.`
        : `${currentText} Each deliverable is structured with clear acceptance criteria and dedicated quality assurance to guarantee a smooth launch.`);

    handleUpdateActiveProposal((p) => ({
      ...p,
      sections: {
        ...p.sections,
        [field]: enhanced,
      },
    }));
    triggerToast('Section refined with Zendo AI');
  };

  // Open Send Proposal Modal
  const handleOpenSendModal = () => {
    if (!activeProposal) return;
    setSendRecipientEmail(activeProposal.clientEmail || 'client@company.com');
    setSendSubject(
      `Proposal: ${activeProposal.title} for ${activeProposal.clientCompany}`
    );
    setSendMessage(
      `Hi ${activeProposal.clientName.split(' ')[0] || 'there'},\n\nThank you for sharing your goals for ${activeProposal.clientCompany}. I’ve prepared the ${activeProposal.title} proposal outlining our recommended scope, timeline (${activeProposal.timelineSummary}), and investment (${activeProposal.value}).\n\nYou can review and approve the interactive proposal directly via the link below. Let me know if you have any questions!\n\nBest regards,\n${displayUserName}`
    );
    setSendModalOpen(true);
  };

  const handleConfirmSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProposal) return;
    setIsSendingEmail(true);
    setTimeout(() => {
      handleUpdateActiveProposal((p) => ({
        ...p,
        status: 'Sent',
        updatedAt: 'Just now',
      }));
      setIsSendingEmail(false);
      setSendModalOpen(false);
      triggerToast(
        `Proposal sent to ${activeProposal.clientName} (${sendRecipientEmail})`
      );
    }, 700);
  };

  // Export PDF Handler
  const handleExportPDF = () => {
    if (!activeProposal) return;
    triggerToast(`Exported "${activeProposal.title} - ${activeProposal.clientCompany}.pdf"`);
    setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore if blocked
      }
    }, 300);
  };

  // Download Proposal as JSON File
  const handleDownloadJson = () => {
    if (!activeProposal) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeProposal, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeProposal.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_proposal.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast(`Downloaded "${activeProposal.title}" as JSON file`);
  };

  // Download Proposal as Markdown File
  const handleDownloadMarkdown = () => {
    if (!activeProposal) return;
    const s = activeProposal.sections;
    const mdContent = `# ${activeProposal.title}
**Client:** ${activeProposal.clientCompany} (${activeProposal.clientName})
**Value:** ${activeProposal.value}
**Timeline:** ${activeProposal.timelineSummary}

## Executive Summary
${s.executiveSummary}

## Client Problem / Goal
${s.clientProblem}

## Proposed Solution
${s.proposedSolution}

## Services & Deliverables
${(s.servicesDeliverables || []).map(d => `- **${d.name}**: ${d.description}`).join('\n')}

## Timeline & Milestones
${(s.timeline || []).map(t => `- **${t.phase}** (${t.duration}): ${t.deliverable}`).join('\n')}

## Pricing & Investment
${(s.pricingItems || []).map(p => `- ${p.item}: ${p.amount} (${p.detail})`).join('\n')}
*Pricing Note:* ${s.pricingNote}

## Terms & Next Steps
${s.termsAndNextSteps}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `${activeProposal.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_proposal.md`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded "${activeProposal.title}" as Markdown file`);
  };

  const handleProposalDownloadJson = (prop: ProposalItem) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prop, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${prop.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_proposal.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast(`Downloaded "${prop.title}" as JSON file`);
  };

  const handleProposalDownloadMarkdown = (prop: ProposalItem) => {
    const s = prop.sections;
    const mdContent = `# ${prop.title}
**Client:** ${prop.clientCompany} (${prop.clientName})
**Value:** ${prop.value}
**Timeline:** ${prop.timelineSummary}

## Executive Summary
${s.executiveSummary}

## Client Problem / Goal
${s.clientProblem}

## Proposed Solution
${s.proposedSolution}

## Services & Deliverables
${(s.servicesDeliverables || []).map(d => `- **${d.name}**: ${d.description}`).join('\n')}

## Timeline & Milestones
${(s.timeline || []).map(t => `- **${t.phase}** (${t.duration}): ${t.deliverable}`).join('\n')}

## Pricing & Investment
${(s.pricingItems || []).map(p => `- ${p.item}: ${p.amount} (${p.detail})`).join('\n')}
*Pricing Note:* ${s.pricingNote}

## Terms & Next Steps
${s.termsAndNextSteps}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `${prop.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_proposal.md`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded "${prop.title}" as Markdown file`);
  };

  const handleDownloadWholeProjectZip = () => {
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", "/api/download-project-zip");
    downloadAnchor.setAttribute("download", "zendo-project-source.zip");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast("Downloading full project codebase archive (zendo-project-source.zip)...");
  };

  const handleDownloadWholeProject = () => {
    // Trigger real zip file download
    handleDownloadWholeProjectZip();
  };

  // ============================================================================
  // SUPABASE CLIENTS CRUD HANDLERS
  // ============================================================================

  const loadSupabaseClients = async () => {
    setIsLoadingSupabaseClients(true);
    setSupabaseClientsError(null);
    try {
      const { data, error } = await fetchClientsFromSupabase();
      if (error) {
        setSupabaseClientsError(error.message || 'Failed to load clients');
      } else {
        const loaded = data || [];
        setSupabaseClients(loaded);
        if (loaded.length > 0) {
          const mapped: ClientItem[] = loaded.map((d) => {
            const meta = getClientMetadata(d.id);
            return {
              id: d.id,
              name: d.name,
              company: d.company,
              email: d.email || '',
              industry: d.industry || 'Technology',
              totalProposals: 0,
              pipelineValue: '$0',
              lastActivity: 'Added ' + new Date(d.created_at).toLocaleDateString(),
              status: 'Active',
              logoUrl: d.logo_url || meta.logoUrl || undefined,
            };
          });
          setClients(mapped);
        }
      }
    } catch (err: any) {
      setSupabaseClientsError(err.message || 'Could not load clients');
    } finally {
      setIsLoadingSupabaseClients(false);
    }
  };

  useEffect(() => {
    void loadSupabaseClients();
  }, [currentRoute]);

  // Add New Client Submit (Saves real row to Supabase 'clients' table & SQL backend)
  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientCompany.trim()) {
      triggerToast('Please provide both Contact Name and Company Name', 'error');
      return;
    }

    setIsSavingClient(true);
    try {
      const finalLogo = newClientLogoUrl.trim() || undefined;
      const { data, error } = await createClientInSupabase({
        name: newClientName.trim(),
        company: newClientCompany.trim(),
        email: newClientEmail.trim() || undefined,
        industry: newClientIndustry.trim() || 'Technology',
        notes: newClientNotes.trim() || undefined,
        logoUrl: finalLogo,
        logo_url: finalLogo,
      });

      if (error) {
        triggerToast(error.message || 'Failed to create client', 'error');
      } else if (data) {
        if (newClientLogoUrl.trim()) {
          saveClientMetadata(data.id, { logoUrl: newClientLogoUrl.trim() });
        }
        setSupabaseClients((prev) => [{ ...data, logo_url: finalLogo }, ...prev]);
        const mappedClient: ClientItem = {
          id: data.id,
          name: data.name,
          company: data.company,
          email: data.email || '',
          industry: data.industry || 'Technology',
          totalProposals: 0,
          pipelineValue: '$0',
          lastActivity: 'Added just now',
          status: 'Active',
          logoUrl: finalLogo,
        };
        setClients((prev) => [mappedClient, ...prev.filter((c) => c.id !== mappedClient.id)]);
        void saveClientToBackend(mappedClient);
        setNewClientName('');
        setNewClientCompany('');
        setNewClientEmail('');
        setNewClientNotes('');
        setNewClientLogoUrl('');
        setAddClientModalOpen(false);
        triggerToast(`Client "${data.company}" saved successfully with logo!`, 'success');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save client', 'error');
    } finally {
      setIsSavingClient(false);
    }
  };

  // Open Edit Client Modal
  const handleOpenEditClient = (c: SupabaseClientRow) => {
    setEditingClient(c);
    setEditName(c.name);
    setEditCompany(c.company);
    setEditEmail(c.email || '');
    setEditIndustry(c.industry || 'AI & SaaS Technology');
    setEditNotes(c.notes || '');
    const meta = getClientMetadata(c.id);
    setEditLogoUrl(c.logo_url || meta.logoUrl || '');
    setEditClientModalOpen(true);
  };

  // Submit Edit Client (Updates real row in Supabase & SQL backend)
  const handleEditClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    if (!editName.trim() || !editCompany.trim()) {
      triggerToast('Contact Name and Company Name are required', 'error');
      return;
    }

    setIsUpdatingClient(true);
    try {
      const finalLogo = editLogoUrl.trim() || undefined;
      const { data, error } = await updateClientInSupabase(editingClient.id, {
        name: editName.trim(),
        company: editCompany.trim(),
        email: editEmail.trim() || undefined,
        industry: editIndustry.trim() || undefined,
        notes: editNotes.trim() || undefined,
        logo_url: finalLogo,
        logoUrl: finalLogo,
      });

      if (error) {
        triggerToast(error.message || 'Failed to update client', 'error');
      } else if (data) {
        saveClientMetadata(data.id, { logoUrl: editLogoUrl.trim() });
        setSupabaseClients((prev) =>
          prev.map((c) => (c.id === data.id ? { ...data, logo_url: finalLogo } : c))
        );
        const mappedUpdated: ClientItem = {
          id: data.id,
          name: data.name,
          company: data.company,
          email: data.email || '',
          industry: data.industry || 'Technology',
          totalProposals: 0,
          pipelineValue: '$0',
          lastActivity: 'Updated just now',
          status: 'Active',
          logoUrl: finalLogo,
        };
        setClients((prev) =>
          prev.map((c) =>
            c.id === data.id
              ? mappedUpdated
              : c
          )
        );
        void saveClientToBackend(mappedUpdated);
        setEditClientModalOpen(false);
        setEditingClient(null);
        setEditLogoUrl('');
        triggerToast(`Client "${data.company}" and logo updated successfully!`, 'success');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update client', 'error');
    } finally {
      setIsUpdatingClient(false);
    }
  };

  // Open Delete Client Confirmation
  const handleOpenDeleteClient = (c: SupabaseClientRow) => {
    setClientToDelete(c);
    setDeleteClientModalOpen(true);
  };

  // Confirm Delete Client (Deletes real row from Supabase)
  const handleConfirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeletingClient(true);
    try {
      const { error } = await deleteClientInSupabase(clientToDelete.id);
      if (error) {
        triggerToast(error.message || 'Failed to delete client', 'error');
      } else {
        setSupabaseClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
        setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
        triggerToast(`Client "${clientToDelete.company}" deleted successfully.`, 'success');
        setDeleteClientModalOpen(false);
        setClientToDelete(null);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete client', 'error');
    } finally {
      setIsDeletingClient(false);
    }
  };

  // Import Client Brief Submit
  const handleImportBriefSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportBriefModalOpen(false);
    handleStartNewProposal({
      clientName: 'Claire Bennett',
      companyName: 'Horizon Ventures',
      clientEmail: 'claire@horizonvc.com',
      industry: 'FinTech & Analytics',
      title: 'Website Redesign & Investor Portal',
      clientNeed: briefText,
      services: [
        'UX Research & Wireframes',
        'Custom Web Design',
        'Webflow / React Development',
      ],
      timeline: '5 weeks',
      budget: '$8,500',
      additionalRequirements: 'Include LP onboarding portal wireframes and WCAG AA compliance.',
      style: 'Premium',
    });
    triggerToast('Client brief imported into Zendo AI Proposal Builder');
  };

  // ============================================================================
  // MEETING SCHEDULING HANDLERS
  // ============================================================================
  const upcomingMeetingsCount = useMemo(
    () => meetings.filter((m) => m.status === 'Scheduled').length,
    [meetings]
  );

  const handleOpenScheduleModal = (prefill?: {
    clientCompany?: string;
    clientName?: string;
    clientEmail?: string;
    proposalId?: string;
    proposalTitle?: string;
    type?: MeetingType;
    date?: string;
    time?: string;
  }) => {
    const defaultCompany = prefill?.clientCompany || clients[0]?.company || 'Acme Studio';
    const matchedClient = clients.find((c) => c.company === defaultCompany);
    const clientN = prefill?.clientName || matchedClient?.name || 'Hannah Lin';
    const clientE = prefill?.clientEmail || matchedClient?.email || 'hannah@acmestudio.co';
    const mType = prefill?.type || 'Proposal Walkthrough';

    setMeetingClientCompany(defaultCompany);
    setMeetingClientName(clientN);
    setMeetingClientEmail(clientE);
    setMeetingType(mType);
    setMeetingTitle(`${defaultCompany} — ${mType}`);
    setMeetingDate(prefill?.date || '2026-10-15');
    setMeetingTime(prefill?.time || '2:00 PM');
    setMeetingDuration(45);
    setMeetingPlatform('Google Meet');
    setMeetingAgenda(
      'Walk through scope, deliverables, timeline milestones, and answer any open questions.'
    );
    setMeetingLinkedProposal(prefill?.proposalId || proposals[0]?.id || '');
    setScheduleModalOpen(true);
  };

  const handleScheduleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingClientCompany.trim()) return;

    const code = Math.random().toString(36).substring(2, 6);
    const generatedLink =
      meetingPlatform === 'Google Meet'
        ? `https://meet.google.com/zen-${code}`
        : meetingPlatform === 'Zoom'
        ? `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`
        : undefined;

    const matchedProp = proposals.find((p) => p.id === meetingLinkedProposal);

    let matchedClient = clients.find(
      (c) => c.company.toLowerCase() === meetingClientCompany.trim().toLowerCase()
    );
    let clientId = matchedClient?.id;
    if (!matchedClient) {
      try {
        matchedClient = await createClientRecord(currentBizId, {
          name: meetingClientName.trim() || 'Client Contact',
          company: meetingClientCompany.trim(),
          email: meetingClientEmail.trim() || 'contact@client.com',
          industry: 'AI & SaaS Technology',
          status: 'Prospect',
        });
        clientId = matchedClient.id;
        setClients((prev) => (prev.some((c) => c.id === matchedClient!.id) ? prev : [matchedClient!, ...prev]));
      } catch {
        // fallback
      }
    }

    try {
      const persistedMeeting = await createMeetingRecord(
        currentBizId,
        clientId || 'cli-unlinked',
        {
          title: meetingTitle.trim(),
          clientCompany: meetingClientCompany.trim(),
          clientName: meetingClientName.trim() || 'Client Contact',
          clientEmail: meetingClientEmail.trim() || 'contact@client.com',
          type: meetingType,
          date: meetingDate,
          time: meetingTime,
          durationMinutes: meetingDuration,
          timezone: 'PST (UTC-7)',
          platform: meetingPlatform,
          meetingLink: generatedLink,
          agenda:
            meetingAgenda.trim() ||
            'Client collaboration, review scope milestones, and finalize deliverables.',
          status: 'Scheduled',
          proposalId: matchedProp?.id,
          proposalTitle: matchedProp?.title,
        }
      );
      setMeetings((prev) => (prev.some((m) => m.id === persistedMeeting.id) ? prev : [persistedMeeting, ...prev]));
      void saveMeetingToSql({
        meetingKey: persistedMeeting.id,
        title: persistedMeeting.title,
        clientCompany: persistedMeeting.clientCompany,
        clientName: persistedMeeting.clientName,
        clientEmail: persistedMeeting.clientEmail,
        type: persistedMeeting.type,
        date: persistedMeeting.date,
        time: persistedMeeting.time,
        durationMinutes: persistedMeeting.durationMinutes,
        status: persistedMeeting.status,
        platform: persistedMeeting.platform,
        meetingLink: persistedMeeting.meetingLink,
      });
    } catch {
      // fallback local update
      const fallbackMeeting: ScheduledMeetingItem = {
        id: `meet-${Date.now()}`,
        title: meetingTitle.trim(),
        clientCompany: meetingClientCompany.trim(),
        clientName: meetingClientName.trim() || 'Client Contact',
        clientEmail: meetingClientEmail.trim() || 'contact@client.com',
        type: meetingType,
        date: meetingDate,
        time: meetingTime,
        durationMinutes: meetingDuration,
        timezone: 'PST (UTC-7)',
        platform: meetingPlatform,
        meetingLink: generatedLink,
        agenda: meetingAgenda.trim() || 'Client collaboration call.',
        status: 'Scheduled',
        proposalId: matchedProp?.id,
        proposalTitle: matchedProp?.title,
      };
      setMeetings((prev) => [fallbackMeeting, ...prev]);
    }

    // Synchronize into clientTasks so it appears in tasks and project tracking
    const newTask: ClientWorkspaceTaskItem = {
      id: `ctask-m-${Date.now()}`,
      clientCompany: meetingClientCompany.trim(),
      title: `${meetingType}: ${meetingTitle.trim()}`,
      category: 'Meeting',
      dueDate: `${meetingDate}, ${meetingTime}`,
      status: 'Pending',
      notes: meetingAgenda.trim() || 'Scheduled client meeting.',
    };
    setClientTasks((prev) => [newTask, ...prev]);
    void saveClientTaskToBackend(newTask);

    // Add activity notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Meeting scheduled: ${meetingClientCompany.trim()}`,
      detail: `${meetingType} on ${meetingDate} at ${meetingTime} via ${meetingPlatform}`,
      time: 'Just now',
      unread: true,
      proposalId: matchedProp?.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    setScheduleModalOpen(false);
    triggerToast(`Meeting scheduled with ${meetingClientCompany.trim()}!`, 'success');
  };

  const handleScheduleFromView = async (
    meetingData: Omit<ScheduledMeetingItem, 'id' | 'status'>
  ) => {
    const code = Math.random().toString(36).substring(2, 6);
    const generatedLink =
      meetingData.platform === 'Google Meet'
        ? `https://meet.google.com/zen-${code}`
        : meetingData.platform === 'Zoom'
        ? `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`
        : undefined;

    let matchedClient = clients.find(
      (c) => c.company.toLowerCase() === meetingData.clientCompany.trim().toLowerCase()
    );
    let clientId = matchedClient?.id;
    if (!matchedClient) {
      try {
        matchedClient = await createClientRecord(currentBizId, {
          name: meetingData.clientName.trim() || 'Client Contact',
          company: meetingData.clientCompany.trim(),
          email: meetingData.clientEmail.trim() || 'contact@client.com',
          industry: 'AI & SaaS Technology',
          status: 'Prospect',
        });
        clientId = matchedClient.id;
        setClients((prev) => (prev.some((c) => c.id === matchedClient!.id) ? prev : [matchedClient!, ...prev]));
      } catch {
        // fallback
      }
    }

    try {
      const persistedMeeting = await createMeetingRecord(
        currentBizId,
        clientId || 'cli-unlinked',
        {
          ...meetingData,
          meetingLink: meetingData.meetingLink || generatedLink,
          status: 'Scheduled',
        }
      );
      setMeetings((prev) => (prev.some((m) => m.id === persistedMeeting.id) ? prev : [persistedMeeting, ...prev]));
    } catch {
      const fallbackMeeting: ScheduledMeetingItem = {
        ...meetingData,
        id: `meet-${Date.now()}`,
        status: 'Scheduled',
        meetingLink: meetingData.meetingLink || generatedLink,
      };
      setMeetings((prev) => [fallbackMeeting, ...prev]);
    }

    // Synchronize into clientTasks so it appears in tasks and project tracking
    const newTask: ClientWorkspaceTaskItem = {
      id: `ctask-m-${Date.now()}`,
      clientCompany: meetingData.clientCompany,
      title: `${meetingData.type}: ${meetingData.title}`,
      category: 'Meeting',
      dueDate: `${meetingData.date}, ${meetingData.time}`,
      status: 'Pending',
      notes: meetingData.agenda || 'Scheduled client meeting.',
    };
    setClientTasks((prev) => [newTask, ...prev]);
    void saveClientTaskToBackend(newTask);

    // Add activity notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Meeting scheduled: ${meetingData.clientCompany}`,
      detail: `${meetingData.type} on ${meetingData.date} at ${meetingData.time} via ${meetingData.platform}`,
      time: 'Just now',
      unread: true,
      proposalId: meetingData.proposalId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    triggerToast(`Meeting scheduled with ${meetingData.clientCompany}!`, 'success');
  };

  const handleCancelMeeting = (meetingId: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, status: 'Cancelled' as const } : m))
    );
    triggerToast('Meeting marked as cancelled.');
  };

  const handleCompleteMeeting = (meetingId: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId ? { ...m, status: 'Completed' as const } : m))
    );
    triggerToast('Meeting marked as completed.');
  };

  const handleOpenRescheduleModal = (meeting: ScheduledMeetingItem) => {
    setSelectedMeetingForReschedule(meeting);
    setRescheduleDate(meeting.date);
    setRescheduleTime(meeting.time);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingForReschedule) return;
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === selectedMeetingForReschedule.id
          ? { ...m, date: rescheduleDate, time: rescheduleTime, status: 'Scheduled' as const }
          : m
      )
    );
    setRescheduleModalOpen(false);
    setSelectedMeetingForReschedule(null);
    triggerToast('Meeting successfully rescheduled.');
  };

  const handleCopyMeetingLink = (link?: string) => {
    if (!link) {
      triggerToast('No video link generated for this call.');
      return;
    }
    navigator.clipboard.writeText(link).catch(() => {});
    triggerToast('Video meeting link copied to clipboard!');
  };

  const generateGoogleCalendarUrl = (m: ScheduledMeetingItem) => {
    const title = encodeURIComponent(m.title);
    const details = encodeURIComponent(
      `${m.agenda || 'Client collaboration call.'}\n\nVideo Link: ${
        m.meetingLink || 'N/A'
      }\nClient: ${m.clientName} (${m.clientCompany})`
    );
    const loc = encodeURIComponent(m.meetingLink || m.platform);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${loc}`;
  };

  const handleClientSelfBooking = (
    slotTime: string,
    slotDate: string,
    clientNameInput: string,
    clientCompanyInput: string,
    clientEmailInput: string,
    sessionType: MeetingType
  ) => {
    const code = Math.random().toString(36).substring(2, 6);
    const newMeeting: ScheduledMeetingItem = {
      id: `meet-book-${Date.now()}`,
      title: `${clientCompanyInput || 'Client'} — ${sessionType}`,
      clientCompany: clientCompanyInput || 'New Client',
      clientName: clientNameInput || 'Client Invitee',
      clientEmail: clientEmailInput || 'client@example.com',
      type: sessionType,
      date: slotDate,
      time: slotTime,
      durationMinutes: 30,
      timezone: 'PST (UTC-7)',
      platform: 'Google Meet',
      meetingLink: `https://meet.google.com/zen-${code}`,
      agenda: 'Self-booked via client scheduling portal.',
      status: 'Scheduled',
    };
    setMeetings((prev) => [newMeeting, ...prev]);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `New client booking: ${newMeeting.clientCompany}`,
      detail: `${newMeeting.clientName} booked a ${newMeeting.type} for ${newMeeting.date} at ${newMeeting.time}`,
      time: 'Just now',
      unread: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    triggerToast(
      `Confirmed! ${newMeeting.type} booked for ${newMeeting.date} at ${newMeeting.time}.`
    );
  };

  // Sidebar items definition (matches Zendo image: Overview, My Tasks, Projects, Calendar, Automations, Analytics, Settings, Export & Transfer)
  const sidebarItems: {
    id?: string;
    label: string;
    route: ZendoRoute;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    onClick?: () => void;
  }[] = [
    { label: 'Overview', route: '/dashboard', icon: Home },
    { label: 'Clients', route: '/clients', icon: Users, badge: clients.length },
    { label: 'Proposals', route: '/proposals', icon: FileText, badge: proposals.length },
    { label: 'Messages', route: '/messages', icon: MessageSquare, badge: clientMessages.length },
    { label: 'Meetings', route: '/meetings', icon: Calendar, badge: upcomingMeetingsCount },
    { label: 'Projects', route: '/projects', icon: Folder },
    {
      label: 'Tasks',
      route: '/tasks',
      icon: CheckSquare,
      badge: dashboardTasks.filter((t) => t.status !== 'completed').length,
    },
    { label: 'Payments', route: '/payments', icon: CreditCard },
    { label: 'SQL Database', route: '/sql-database', icon: Database },
    { label: 'Templates', route: '/templates', icon: Layers },
    { label: 'Automations', route: '/automations', icon: Zap },
    { label: 'Analytics', route: '/analytics', icon: BarChart3 },
    {
      id: 'settings',
      label: 'Settings',
      route: '/settings',
      icon: Settings,
      onClick: () => {
        setSettingsTab('profile');
        navigateTo('/settings');
      },
    },
    {
      id: 'export',
      label: 'Export & Transfer',
      route: '/settings',
      icon: Download,
      onClick: () => {
        setSettingsTab('export');
        navigateTo('/settings');
      },
    },
  ];

  const isSidebarItemActive = (item: (typeof sidebarItems)[number]) => {
    if (item.id === 'export') {
      return currentRoute === '/settings' && settingsTab === 'export';
    }
    if (item.id === 'settings') {
      return currentRoute === '/settings' && settingsTab !== 'export';
    }
    if (item.route === '/dashboard') {
      return currentRoute === '/dashboard';
    }
    if (item.route === '/proposals') {
      return (
        currentRoute === '/proposals' ||
        currentRoute === '/proposals/new' ||
        currentRoute === '/proposals/editor' ||
        currentRoute === '/follow-ups'
      );
    }
    if (item.route === '/meetings') {
      return currentRoute === '/meetings' || currentRoute === '/calendar';
    }
    return currentRoute === item.route;
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f5f7f6] text-[#0f172a] flex flex-col md:flex-row font-sans antialiased selection:bg-[#3d6b52]/15 selection:text-[#284e3a]">
      {/* =====================================================================
          1. LEFT SIDEBAR (Desktop Collapsible + Mobile Drawer)
          Independent scroll container for the sidebar navigation
      ===================================================================== */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-screen bg-[#f5f7f6] border-r border-[#e4eae6] transition-all duration-200 select-none z-30 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:#cbd8d0_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#cbd8d0] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#a8beb1] ${
          sidebarCollapsed ? 'w-20' : 'w-60'
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Top Brand Area (pinned smoothly at top of sidebar) */}
        <div className="h-20 px-5 flex items-center justify-between shrink-0 sticky top-0 bg-[#f5f7f6]/95 backdrop-blur-xs z-10 border-b border-[#e4eae6]/40">
          <button
            type="button"
            onClick={() => navigateTo('/dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
          >
            <ZendoLogo
              className="w-7 h-7 shrink-0 transition-transform group-hover:scale-105"
              color="#0f172a"
            />
            {!sidebarCollapsed && (
              <span className="font-sans font-bold text-[22px] tracking-[-0.02em] text-[#0f172a] whitespace-nowrap">
                Zendo
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6f8076] hover:text-[#0f172a] hover:bg-[#ebf0ec] transition-colors cursor-pointer"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 py-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isSidebarItemActive(item);
            return (
              <button
                key={item.id || item.route}
                type="button"
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    navigateTo(item.route);
                  }
                }}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#ebf2ed] text-[#284e3a] font-semibold'
                    : 'text-[#5f7066] font-medium hover:bg-[#ebf0ec] hover:text-[#1e382a]'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-4.5 h-4.5 shrink-0 ${
                    active ? 'text-[#284e3a]' : 'text-[#6f8076]'
                  }`}
                />
                {!sidebarCollapsed && (
                  <span className="truncate whitespace-nowrap flex-1 text-left">
                    {item.label}
                  </span>
                )}
                {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-white text-[#284e3a]' : 'bg-[#e8f4ec] text-[#284e3a]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Botanical "Stay in flow." Card */}
        <div className="p-4 shrink-0 mt-auto">
          {!sidebarCollapsed ? (
            <div className="p-4.5 rounded-2xl bg-[#edf4ef] border border-[#dce7df] space-y-3">
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
                  fill="#7fa48f"
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
                <p className="text-[15px] font-bold text-[#1e3a2b] tracking-tight">
                  Stay in flow.
                </p>
                <p className="text-[12px] text-[#556b5d] leading-snug">
                  Small steps
                  <br />
                  create big progress.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStartNewProposal()}
                className="w-full py-2 px-3.5 rounded-xl bg-[#dfece3] hover:bg-[#d2e2d7] text-[#234934] text-xs font-semibold inline-flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Find your focus</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleStartNewProposal()}
              title="Find your focus"
              className="w-full flex items-center justify-center p-2.5 rounded-xl bg-[#edf4ef] text-[#284e3a] hover:bg-[#dfece3] transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] bg-[#f8f9f7] h-full flex flex-col justify-between z-10 shadow-xl overflow-y-auto">
            <div>
              <div className="h-16 px-4 flex items-center justify-between border-b border-[#ecefec]">
                <div className="flex items-center gap-2.5">
                  <ZendoLogo
                    className="w-6 h-6 shrink-0"
                    color="#0d1916"
                  />
                  <span className="font-serif font-bold text-xl tracking-tight text-[#0d1916]">
                    Zendo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-lg text-slate-500 hover:bg-[#e8efe8]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="px-3 py-3 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = isSidebarItemActive(item);
                  return (
                    <button
                      key={item.id || item.route}
                      type="button"
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          navigateTo(item.route);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#e8efe8] text-[#182c23] font-semibold'
                          : 'text-[#4e5a54] hover:bg-[#eff3ef] hover:text-[#182c23]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-[#39664d]' : 'text-[#5b6761]'}`} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            active ? 'bg-white text-[#2b543e]' : 'bg-[#e9f2ec] text-[#2b543e]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 space-y-3 border-t border-[#ecefec]">
              <div className="rounded-2xl bg-[#eaefea] border border-[#dfe7df] p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#4d755b]" />
                  <span className="text-xs font-bold text-[#1f3529]">Stay in flow.</span>
                </div>
                <p className="text-[11px] text-[#55665d]">
                  Small steps create big progress.
                </p>
                <button
                  type="button"
                  onClick={() => handleStartNewProposal()}
                  className="w-full py-2 px-3 rounded-xl bg-[#d6e1d7] hover:bg-[#c7d6c9] text-[#1f3529] font-semibold text-xs transition-colors"
                >
                  Draft with Zendo AI
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogout) onLogout();
                  else if (onBackToSite) onBackToSite();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAIN COLUMN (TOP HEADER + VIEWPORT)
          Independent scroll container for the entire right side content
      ===================================================================== */}
      <div className="flex-1 h-screen flex flex-col min-w-0 overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:#cbd8d0_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#cbd8d0] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#a8beb1]">
        {/* ===================================================================
            2. TOP HEADER (pinned within right side viewport)
        =================================================================== */}
        <header className="h-16 bg-[#f5f7f6]/95 backdrop-blur-md border-b border-[#e4eae6] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20 shrink-0">
          {/* Left: Mobile Hamburger + Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-[#ebf0ec]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search proposals, clients, and templates..."
                aria-label="Search proposals, clients, and templates"
                className="w-full pl-10 pr-8 py-2 rounded-xl bg-white border border-[#e2e8e4] text-sm text-[#0f172a] placeholder:text-[#889b90] focus:outline-none focus:border-[#3d6b52] focus:ring-1 focus:ring-[#3d6b52]/20 shadow-2xs transition-colors"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Instant Search Results Popover */}
              {searchFocused && globalSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-lg p-3 z-40 max-h-96 overflow-y-auto">
                  {globalSearchResults.proposals.length === 0 &&
                  globalSearchResults.clients.length === 0 &&
                  globalSearchResults.templates.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      No matching proposals, clients, or templates for “{globalSearch}”.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {globalSearchResults.proposals.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1">
                            Proposals
                          </div>
                          {globalSearchResults.proposals.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => handleOpenProposal(p)}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 text-left"
                            >
                              <div>
                                <div className="text-xs font-semibold text-[#0F172A]">
                                  {p.title}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {p.clientCompany} · {p.value}
                                </div>
                              </div>
                              <StatusBadge status={p.status} />
                            </button>
                          ))}
                        </div>
                      )}

                      {globalSearchResults.clients.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1">
                            Clients
                          </div>
                          {globalSearchResults.clients.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={() => navigateTo('/clients')}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 text-left"
                            >
                              <div>
                                <div className="text-xs font-semibold text-[#0F172A]">
                                  {c.company}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {c.name} · {c.industry}
                                </div>
                              </div>
                              <span className="text-xs font-mono text-slate-600">
                                {c.pipelineValue}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {globalSearchResults.templates.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1">
                            Templates
                          </div>
                          {globalSearchResults.templates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onMouseDown={() => navigateTo('/templates')}
                              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 text-left"
                            >
                              <div>
                                <div className="text-xs font-semibold text-[#0F172A]">
                                  {t.title}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {t.category} · {t.typicalTimeline}
                                </div>
                              </div>
                              <span className="text-xs text-[#4b735c] font-medium">
                                Use template
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Help Icon, Notification Icon, User Avatar & Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Help Icon */}
            <button
              type="button"
              onClick={() => setHelpModalOpen(true)}
              aria-label="Help and Proposal Guide"
              title="Help & AI Proposal Guide"
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-[18px] h-[18px]" />
            </button>

            {/* Notification Icon + Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((prev) => !prev);
                  setUserMenuOpen(false);
                }}
                aria-label="Notifications"
                title="Notifications"
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#0F172A] transition-colors relative cursor-pointer"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4b735c] ring-2 ring-[#fcfdfc]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-lg p-4 z-40">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-[#0F172A]">
                      Proposal Activity
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, unread: false }))
                        )
                      }
                      className="text-xs font-medium text-[#4b735c] hover:text-[#3d614c] cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.id === notif.id ? { ...n, unread: false } : n
                            )
                          );
                          setNotificationsOpen(false);
                          if (notif.proposalId) {
                            const found = proposals.find(
                              (p) => p.id === notif.proposalId
                            );
                            if (found) handleOpenProposal(found);
                          } else {
                            navigateTo('/follow-ups');
                          }
                        }}
                        className="w-full text-left py-3 px-2 hover:bg-slate-50 rounded-xl transition-colors flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[#0F172A]">
                            {notif.title}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {notif.detail}
                          </p>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            {notif.time}
                          </span>
                        </div>
                        {notif.unread && (
                          <span className="text-[10px] font-semibold text-[#4b735c] bg-emerald-50 px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-[#ECEAE4] mx-0.5 hidden sm:block" />

            {/* User Avatar & Dropdown ("Alex Morgan") */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotificationsOpen(false);
                }}
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer"
              >
                {!avatarError ? (
                  <img
                    src={userPhotoUrl || teamLeadAvatar}
                    alt={displayUserName}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">
                    AM
                  </div>
                )}
                <span className="text-xs sm:text-sm font-semibold text-[#0F172A] whitespace-nowrap">
                  {displayUserName}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-lg py-2 z-40">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-semibold text-[#0F172A]">
                      {displayUserName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {profileEmailInput}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsTab('profile');
                        navigateTo('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsTab('billing');
                        navigateTo('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-slate-400" />
                      <span>Billing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmptyStateDemo((prev) => !prev);
                        setUserMenuOpen(false);
                        navigateTo('/dashboard');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>
                        {showEmptyStateDemo
                          ? 'Show Populated Dashboard'
                          : 'Preview Empty State'}
                      </span>
                    </button>
                    {onBackToSite && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          onBackToSite();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span>Marketing Website</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onLogout) onLogout();
                        else if (onBackToSite) onBackToSite();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ===================================================================
            MAIN VIEWPORT CONTENT AREA
        =================================================================== */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-[1360px] w-full mx-auto space-y-6">
          {/* =================================================================
              ROUTE 1: DASHBOARD (/dashboard)
          ================================================================= */}
          {currentRoute === '/dashboard' && (
            <>
              {/* 3. DASHBOARD WELCOME SECTION */}
              <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div>
                  <h1 className="font-sans text-2xl sm:text-[32px] font-bold text-[#0f172a] tracking-[-0.03em] leading-tight">
                    Good morning, {firstName}
                  </h1>
                  <p className="text-sm text-[#64756b] mt-1 font-medium">
                    Here’s your focus for today across tasks, calendar, and payments.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAddClientModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#3d6b52] hover:bg-[#325843] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>New client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#ebf0ec] border border-[#e5ebe7] text-[#0f172a] text-xs sm:text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4 text-[#3d6b52]" />
                    <span>Schedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewInvoiceModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#ebf0ec] border border-[#e5ebe7] text-[#0f172a] text-xs sm:text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <CreditCard className="w-4 h-4 text-[#3d6b52]" />
                    <span>Invoice</span>
                  </button>
                </div>
              </section>

              {/* 4. STATISTICS CARDS: Tasks, Calendar Events, Payments, Active Proposals */}
              <section
                aria-label="Dashboard Statistics"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              >
                {/* Card 1: Tasks */}
                <div
                  onClick={() => navigateTo('/tasks')}
                  className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] flex items-center gap-4.5 cursor-pointer hover:border-[#cfddd3] transition-colors group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#eef0fd] text-[#5b67de] flex items-center justify-center shrink-0">
                    <CheckSquare className="w-5.5 h-5.5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#64756b]">Active tasks</p>
                    <p className="text-[28px] font-bold text-[#0f172a] mt-0.5 leading-none tabular-nums">
                      {dashboardTasks.filter((t) => t.status !== 'completed').length}
                    </p>
                    <p className="text-xs font-medium text-[#2e7d4f] mt-1.5 flex items-center gap-1">
                      <span>✓</span>
                      <span>
                        {dashboardTasks.filter((t) => t.status === 'completed').length} completed
                      </span>
                    </p>
                  </div>
                </div>

                {/* Card 2: Calendar Events */}
                <div
                  onClick={() => navigateTo('/meetings')}
                  className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] flex items-center gap-4.5 cursor-pointer hover:border-[#cfddd3] transition-colors group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
                    <Calendar className="w-5.5 h-5.5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#64756b]">Calendar events</p>
                    <p className="text-[28px] font-bold text-[#0f172a] mt-0.5 leading-none tabular-nums">
                      {upcomingMeetingsCount}
                    </p>
                    <p className="text-xs font-medium text-[#3b82f6] mt-1.5 truncate max-w-[150px]">
                      {meetings.find((m) => m.status === 'Scheduled')
                        ? `Next: ${meetings.find((m) => m.status === 'Scheduled')?.time}`
                        : 'No pending calls'}
                    </p>
                  </div>
                </div>

                {/* Card 3: Payments */}
                <div
                  onClick={() => navigateTo('/payments')}
                  className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] flex items-center gap-4.5 cursor-pointer hover:border-[#cfddd3] transition-colors group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#e8f4ec] text-[#2b543e] flex items-center justify-center shrink-0">
                    <CreditCard className="w-5.5 h-5.5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#64756b]">Invoiced payments</p>
                    <p className="text-[28px] font-bold text-[#0f172a] mt-0.5 leading-none tabular-nums">
                      ${payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-[#2e7d4f] mt-1.5 flex items-center gap-1">
                      <span>↑</span>
                      <span>
                        ${payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0).toLocaleString()} paid
                      </span>
                    </p>
                  </div>
                </div>

                {/* Card 4: Proposals Pipeline */}
                <div
                  onClick={() => navigateTo('/proposals')}
                  className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] flex items-center gap-4.5 cursor-pointer hover:border-[#cfddd3] transition-colors group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#fff7ed] text-[#c2410c] flex items-center justify-center shrink-0">
                    <FileText className="w-5.5 h-5.5 stroke-[2.2]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#64756b]">Active proposals</p>
                    <p className="text-[28px] font-bold text-[#0f172a] mt-0.5 leading-none tabular-nums">
                      {statTotalProposals}
                    </p>
                    <p className="text-xs font-medium text-[#c2410c] mt-1.5 flex items-center gap-1">
                      <span>•</span>
                      <span>
                        ${activePipelineValue.toLocaleString()} pipeline
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              {/* OVERVIEW SECTION ROW 1: Tasks (Left 7 Cols) + Calendar Events (Right 5 Cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* 1. TASKS MODULE (7 cols) */}
                <div className="lg:col-span-7 p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f1f5f2]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#eef0fd] text-[#5b67de] flex items-center justify-center shrink-0">
                        <CheckSquare className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                          Tasks &amp; Priorities
                        </h2>
                        <p className="text-xs text-[#64756b]">
                          {dashboardTasks.filter((t) => t.status !== 'completed').length} pending focus items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigateTo('/tasks')}
                        className="text-xs font-semibold text-[#3d6b52] hover:text-[#284e3a] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Full tasks view</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {(
                      [
                        { id: 'today', label: "Today's Tasks" },
                        { id: 'in_progress', label: 'In Progress' },
                        { id: 'completed', label: 'Completed' },
                        { id: 'all', label: 'All Tasks' },
                      ] as const
                    ).map((flt) => {
                      const count =
                        flt.id === 'all'
                          ? dashboardTasks.length
                          : dashboardTasks.filter((t) => t.status === flt.id).length;
                      return (
                        <button
                          key={flt.id}
                          type="button"
                          onClick={() => setTaskFilter(flt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            taskFilter === flt.id
                              ? 'bg-[#ebf2ed] text-[#284e3a] font-semibold'
                              : 'text-[#64756b] hover:bg-[#f1f5f2]'
                          }`}
                        >
                          <span>{flt.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              taskFilter === flt.id
                                ? 'bg-[#3d6b52] text-white'
                                : 'bg-[#eef2ef] text-[#64756b]'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inline Task Add Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleInlineAddTask();
                    }}
                    className="flex flex-col sm:flex-row gap-2 bg-[#f8faf8] p-2.5 rounded-xl border border-[#e4ede6]"
                  >
                    <input
                      id="overview-task-input"
                      type="text"
                      value={inlineNewTaskTitle}
                      onChange={(e) => setInlineNewTaskTitle(e.target.value)}
                      placeholder="Add a new task to your focus queue... (Press Enter)"
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#d8e4dc] text-xs sm:text-sm text-[#0f172a] placeholder-[#8b9b91] focus:outline-none focus:border-[#3d6b52]"
                    />
                    <select
                      value={inlineNewTaskPriority}
                      onChange={(e) =>
                        setInlineNewTaskPriority(e.target.value as 'High' | 'Medium' | 'Calm')
                      }
                      className="px-2.5 py-2 rounded-lg bg-white border border-[#d8e4dc] text-xs font-medium text-[#0f172a] focus:outline-none"
                    >
                      <option value="High">Priority: High</option>
                      <option value="Medium">Priority: Medium</option>
                      <option value="Calm">Priority: Calm</option>
                    </select>
                    <button
                      type="submit"
                      disabled={!inlineNewTaskTitle.trim()}
                      className="px-4 py-2 rounded-lg bg-[#3d6b52] hover:bg-[#325843] disabled:opacity-40 text-white text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                    >
                      Add Task
                    </button>
                  </form>

                  {/* Tasks List */}
                  <div className="divide-y divide-[#f1f5f2] max-h-72 overflow-y-auto pr-1">
                    {dashboardTasks
                      .filter((t) => (taskFilter === 'all' ? true : t.status === taskFilter))
                      .map((task) => {
                        const isDone = task.status === 'completed';
                        const priorityColors: Record<string, string> = {
                          High: 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3]',
                          Medium: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
                          Calm: 'bg-[#e8f4ec] text-[#2b543e] border-[#cfddd0]',
                        };
                        return (
                          <div
                            key={task.id}
                            className="py-3 flex items-center justify-between gap-3 group hover:bg-[#fafbfa] px-2 rounded-xl transition-colors"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleTaskStatus(task.id)}
                                title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                                className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                                  isDone
                                    ? 'bg-[#3d6b52] border-[#3d6b52] text-white'
                                    : 'border-[#c7d5cd] bg-white hover:border-[#3d6b52]'
                                }`}
                              >
                                {isDone && <Check className="w-3.5 h-3.5 stroke-[2.8]" />}
                              </button>
                              <div className="min-w-0">
                                <p
                                  onClick={() => handleToggleTaskStatus(task.id)}
                                  className={`text-xs sm:text-[13.5px] font-medium leading-snug cursor-pointer truncate ${
                                    isDone
                                      ? 'line-through text-[#8fa096]'
                                      : 'text-[#0f172a] hover:text-[#3d6b52]'
                                  }`}
                                >
                                  {task.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#64756b]">
                                  <span className="px-2 py-0.5 rounded-md bg-[#edf2ee] font-medium text-[#284e3a]">
                                    {task.project}
                                  </span>
                                  <span>{task.dueDate}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                  priorityColors[task.priority] || priorityColors.Calm
                                }`}
                              >
                                {task.priority}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteDashboardTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-[#9cb0a5] hover:text-rose-600 p-1 rounded-lg transition-opacity cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Tasks Progress Bar */}
                  <div className="pt-3 border-t border-[#f1f5f2] flex items-center justify-between text-xs">
                    <span className="text-[#64756b]">
                      {dashboardTasks.filter((t) => t.status === 'completed').length} of{' '}
                      {dashboardTasks.length} tasks completed
                    </span>
                    <div className="w-28 sm:w-40 h-2 bg-[#e8efea] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#58896c] rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            dashboardTasks.length > 0
                              ? Math.round(
                                  (dashboardTasks.filter((t) => t.status === 'completed').length /
                                    dashboardTasks.length) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. CALENDAR EVENTS MODULE (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f2]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
                        <Calendar className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                          Calendar Events
                        </h2>
                        <p className="text-xs text-[#64756b]">Meetings, pitches &amp; reviews</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#ebf2ed] hover:bg-[#dfece3] text-[#284e3a] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule</span>
                    </button>
                  </div>

                  {/* Sync status */}
                  <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-[#f4f8f5] border border-[#e2ece5] text-[#284e3a]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Google Calendar Synced
                    </span>
                    <button
                      type="button"
                      onClick={() => setBookingLinkModalOpen(true)}
                      className="text-xs font-semibold text-[#3d6b52] hover:underline cursor-pointer"
                    >
                      Share Booking Link
                    </button>
                  </div>

                  {/* Meetings List */}
                  <div className="divide-y divide-[#f1f5f2] space-y-2">
                    {meetings
                      .filter((m) => m.status === 'Scheduled')
                      .slice(0, 3)
                      .map((meet) => {
                        const isToday =
                          meet.date.toLowerCase().includes('today') ||
                          meet.date.includes('2026-10-14') ||
                          meet.date.includes('2026-10-15');
                        return (
                          <div
                            key={meet.id}
                            className="pt-2.5 pb-2 flex flex-col gap-2 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span
                                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 ${
                                    isToday
                                      ? 'bg-emerald-100 text-[#1e4832]'
                                      : 'bg-[#edf2ee] text-[#4d5e54]'
                                  }`}
                                >
                                  {meet.date} · {meet.time} ({meet.durationMinutes}m)
                                </span>
                                <h3 className="text-xs sm:text-[13.5px] font-semibold text-[#0f172a] truncate">
                                  {meet.title}
                                </h3>
                                <p className="text-xs text-[#64756b] mt-0.5">
                                  {meet.clientCompany} · {meet.clientName}
                                </p>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#eef2ff] text-[#4338ca] shrink-0">
                                {meet.type}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-[#8b9b91] flex items-center gap-1 font-mono">
                                <Video className="w-3 h-3 text-[#3d6b52]" />
                                {meet.platform}
                              </span>
                              {meet.meetingLink ? (
                                <a
                                  href={meet.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg bg-[#3d6b52] hover:bg-[#325843] text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                                >
                                  <span>Join Meet</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => navigateTo('/meetings')}
                                  className="text-[11px] font-semibold text-[#3d6b52] hover:underline"
                                >
                                  View Details
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="pt-2 border-t border-[#f1f5f2] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => navigateTo('/meetings')}
                      className="font-semibold text-[#3d6b52] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all calendar bookings</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[#8b9b91]">Timezone: PST</span>
                  </div>
                </div>
              </div>

              {/* OVERVIEW SECTION ROW 2: Payments & Invoicing (Left 7 Cols) + Proposals & Pipeline (Right 5 Cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* 3. PAYMENTS & INVOICING MODULE (7 cols) */}
                <div className="lg:col-span-7 p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f1f5f2]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#e8f4ec] text-[#2b543e] flex items-center justify-center shrink-0">
                        <CreditCard className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                          Payments &amp; Invoices
                        </h2>
                        <p className="text-xs text-[#64756b]">Revenue flow &amp; billing status</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewInvoiceModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#3d6b52] hover:bg-[#325843] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#f4f8f5] border border-[#e1ede4]">
                      <span className="text-[11px] font-medium text-[#64756b] block">Received</span>
                      <span className="text-base sm:text-lg font-bold text-[#2b543e] tabular-nums">
                        ${payments
                          .filter((p) => p.status === 'Paid')
                          .reduce((s, p) => s + p.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#fffbeb] border border-[#fde68a]">
                      <span className="text-[11px] font-medium text-[#92400e] block">Pending</span>
                      <span className="text-base sm:text-lg font-bold text-[#b45309] tabular-nums">
                        ${payments
                          .filter((p) => p.status === 'Pending')
                          .reduce((s, p) => s + p.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#eef2ff] border border-[#c7d2fe]">
                      <span className="text-[11px] font-medium text-[#4338ca] block">Retainers</span>
                      <span className="text-base sm:text-lg font-bold text-[#3730a3] tabular-nums">
                        $4,500/mo
                      </span>
                    </div>
                  </div>

                  {/* Invoices List */}
                  <div className="divide-y divide-[#f1f5f2] max-h-56 overflow-y-auto pr-1">
                    {payments.map((inv) => {
                      const isPaid = inv.status === 'Paid';
                      return (
                        <div
                          key={inv.id}
                          className="py-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#0f172a]">
                                {inv.invoiceNumber}
                              </span>
                              <span className="text-[#64756b] truncate">· {inv.clientCompany}</span>
                            </div>
                            <p className="text-[11px] text-[#8b9b91] mt-0.5 truncate">
                              {inv.projectTitle} · {isPaid ? `Paid ${inv.paidDate}` : `Due ${inv.dueDate}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-mono font-bold text-sm text-[#0f172a] tabular-nums">
                              ${inv.amount.toLocaleString()}
                            </span>
                            {isPaid ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f4ec] text-[#2b543e] border border-[#cfddd0]">
                                Paid
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkPaymentPaid(inv.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#fffbeb] hover:bg-[#fde68a] text-[#92400e] text-[11px] font-semibold border border-[#fde68a] cursor-pointer transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#f1f5f2] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => navigateTo('/payments')}
                      className="font-semibold text-[#3d6b52] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open full Payments workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[#8b9b91]">Auto-reconciled with Stripe</span>
                  </div>
                </div>

                {/* 4. PROPOSALS & PIPELINE MODULE (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f1f5f2]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#c2410c] flex items-center justify-center shrink-0">
                        <FileText className="w-4.5 h-4.5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                          Proposals &amp; Pipeline
                        </h2>
                        <p className="text-xs text-[#64756b]">Active client scopes &amp; deals</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartNewProposal()}
                      className="px-3 py-1.5 rounded-lg bg-[#ebf2ed] hover:bg-[#dfece3] text-[#284e3a] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#f4f8f5] border border-[#e1ede4]">
                      <span className="text-[11px] font-medium text-[#64756b] block">Total Pipeline</span>
                      <span className="text-base sm:text-lg font-bold text-[#2b543e] tabular-nums">
                        ${activePipelineValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#fff7ed] border border-[#ffedd5]">
                      <span className="text-[11px] font-medium text-[#c2410c] block">Accepted / Won</span>
                      <span className="text-base sm:text-lg font-bold text-[#9a3412] tabular-nums">
                        {statWon} ({statWinRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Proposals List */}
                  <div className="divide-y divide-[#f1f5f2] space-y-2">
                    {proposals.slice(0, 3).map((prop) => (
                      <div
                        key={prop.id}
                        onClick={() => handleOpenProposal(prop)}
                        className="pt-2 pb-1.5 flex items-center justify-between gap-3 text-xs cursor-pointer group hover:bg-[#f8faf8] -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0f172a] truncate group-hover:text-[#3d6b52] transition-colors">
                            {prop.title}
                          </p>
                          <p className="text-[11px] text-[#64756b] mt-0.5 truncate">
                            {prop.clientCompany} · {prop.value}
                          </p>
                        </div>
                        <StatusBadge status={prop.status} />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#f1f5f2] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => navigateTo('/proposals')}
                      className="font-semibold text-[#3d6b52] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all proposals</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[#8b9b91]">{proposals.length} total</span>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: "This week" Chart (Left 7 cols) + "Upcoming" Schedule (Right 5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left 7 Cols: This week chart */}
                <div className="lg:col-span-7 p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] flex flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#0f172a]">
                        This week
                      </h3>
                      <p className="text-xs text-[#64756b] mt-0.5">
                        Tasks completed • 18 of 25
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#284e3a]">
                        72% complete
                      </span>
                      <div className="w-28 sm:w-36 h-2 rounded-full bg-[#e5ede7] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#58896c] transition-all duration-300"
                          style={{ width: `72%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart with Y-Axis (8, 6, 4, 2, 0) & Stacked Sage Bars */}
                  <div className="mt-6 flex items-end gap-3 h-44">
                    {/* Y-axis labels */}
                    <div className="h-full flex flex-col justify-between text-[11px] font-medium text-[#93a39a] pb-6 pr-1 select-none">
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
                        <div className="border-b border-[#eef2ef] w-full" />
                        <div className="border-b border-[#eef2ef] w-full" />
                        <div className="border-b border-[#eef2ef] w-full" />
                        <div className="border-b border-[#eef2ef] w-full" />
                        <div className="border-b border-[#e2e8e4] w-full" />
                      </div>

                      <div className="relative z-10 grid grid-cols-5 gap-4 sm:gap-8 items-end h-[132px] px-2 sm:px-4">
                        {[
                          { day: 'Mon', count: 3, baseHeight: 36, capHeight: 18 },
                          { day: 'Tue', count: 5, baseHeight: 58, capHeight: 22 },
                          { day: 'Wed', count: 2, baseHeight: 24, capHeight: 16 },
                          { day: 'Thu', count: 6, baseHeight: 74, capHeight: 24 },
                          { day: 'Fri', count: 2, baseHeight: 24, capHeight: 16 },
                        ].map((bar) => (
                          <div
                            key={bar.day}
                            className="flex flex-col items-center justify-end h-full group"
                          >
                            <span className="text-xs font-bold text-[#2d3748] mb-1.5 group-hover:text-[#3d6b52] transition-colors tabular-nums">
                              {bar.count}
                            </span>
                            <div className="w-full max-w-[46px] flex flex-col transition-transform group-hover:scale-105">
                              <div
                                style={{ height: `${bar.capHeight}px` }}
                                className="w-full bg-[#bcd3c4] rounded-t-md opacity-90"
                              />
                              <div
                                style={{ height: `${bar.baseHeight}px` }}
                                className="w-full bg-[#58896c] rounded-b-[2px]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* X-axis day labels */}
                      <div className="grid grid-cols-5 gap-4 sm:gap-8 pt-2 px-2 sm:px-4 text-center text-xs font-medium text-[#64756b]">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: Upcoming Schedule Card */}
                <div className="lg:col-span-5 p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-[#0f172a]">
                      Upcoming
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateTo('/calendar')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#284e3a] hover:text-[#1e3a2b] cursor-pointer"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-[#f1f5f2]">
                    {[
                      {
                        id: 'up-1',
                        title: 'Client presentation',
                        time: 'Today, 10:00 AM',
                        icon: Presentation,
                        bg: 'bg-[#f0edfd]',
                        iconColor: 'text-[#6d61dc]',
                      },
                      {
                        id: 'up-2',
                        title: 'Review campaign brief',
                        time: 'Today, 2:00 PM',
                        icon: FileText,
                        bg: 'bg-[#eaf4ec]',
                        iconColor: 'text-[#367751]',
                      },
                      {
                        id: 'up-3',
                        title: 'Team stand-up',
                        time: 'Tomorrow, 9:00 AM',
                        icon: Users,
                        bg: 'bg-[#eff1fd]',
                        iconColor: 'text-[#5d65dc]',
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => navigateTo('/calendar')}
                          className="py-3.5 flex items-center justify-between gap-3 group cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-2xl ${item.bg} ${item.iconColor} flex items-center justify-center shrink-0`}
                            >
                              <Icon className="w-5 h-5 stroke-[2]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13.5px] font-semibold text-[#0f172a] truncate group-hover:text-[#284e3a] transition-colors">
                                {item.title}
                              </p>
                              <p className="text-xs text-[#64756b] mt-0.5 truncate">
                                {item.time}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#a0b0a6] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-[#f1f5f2] flex items-center justify-between text-xs">
                    <span className="text-[#64756b]">Google Calendar synced</span>
                    <button
                      type="button"
                      onClick={() => navigateTo('/calendar')}
                      className="font-medium text-[#284e3a] hover:underline"
                    >
                      Schedule new call →
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: "My priorities" (Matches Zendo Image 1:1) */}
              <section aria-label="My priorities" className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">
                    My priorities
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateTo('/projects')}
                    className="text-xs font-semibold text-[#284e3a] hover:text-[#1e3a2b] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all projects</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Priority 1: Website redesign */}
                  <div
                    onClick={() => navigateTo('/projects')}
                    className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4 hover:border-[#cfddd3] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#eaf4ec] text-[#367751] flex items-center justify-center shrink-0">
                          <LayoutGrid className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-[#0f172a]">Website redesign</h3>
                          <p className="text-xs text-[#64756b] mt-0.5">Design • 8 tasks</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        aria-label="Options"
                        className="text-[#9cb0a5] hover:text-[#0f172a] p-1 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[#e8efea] overflow-hidden">
                        <div className="h-full rounded-full bg-[#58896c] w-[60%]" />
                      </div>
                      <span className="text-xs font-medium text-[#64756b] tabular-nums">60%</span>
                    </div>

                    <div className="flex items-center pt-1">
                      <img
                        src={avatarCreativeDesigner}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      />
                      <img
                        src={avatarLeadEngineer}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2"
                      />
                      <img
                        src={avatarProductStrategist}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2"
                      />
                      <span className="w-7 h-7 rounded-full bg-[#ebf2ed] text-[#284e3a] text-[11px] font-bold flex items-center justify-center border-2 border-white -ml-2">
                        +2
                      </span>
                    </div>
                  </div>

                  {/* Priority 2: Product launch */}
                  <div
                    onClick={() => navigateTo('/projects')}
                    className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4 hover:border-[#cfddd3] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#f0edfd] text-[#6d61dc] flex items-center justify-center shrink-0">
                          <Rocket className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-[#0f172a]">Product launch</h3>
                          <p className="text-xs text-[#64756b] mt-0.5">Strategy • 12 tasks</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        aria-label="Options"
                        className="text-[#9cb0a5] hover:text-[#0f172a] p-1 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[#e8efea] overflow-hidden">
                        <div className="h-full rounded-full bg-[#58896c] w-[42%]" />
                      </div>
                      <span className="text-xs font-medium text-[#64756b] tabular-nums">42%</span>
                    </div>

                    <div className="flex items-center pt-1">
                      <img
                        src={teamLeadAvatar}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      />
                      <img
                        src={avatarCreativeDesigner}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2"
                      />
                      <img
                        src={avatarLeadEngineer}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2"
                      />
                      <span className="w-7 h-7 rounded-full bg-[#ebf2ed] text-[#284e3a] text-[11px] font-bold flex items-center justify-center border-2 border-white -ml-2">
                        +3
                      </span>
                    </div>
                  </div>

                  {/* Priority 3: Content system */}
                  <div
                    onClick={() => navigateTo('/projects')}
                    className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4 hover:border-[#cfddd3] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#eaf4ec] text-[#367751] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 stroke-[2]" />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-[#0f172a]">Content system</h3>
                          <p className="text-xs text-[#64756b] mt-0.5">Marketing • 6 tasks</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        aria-label="Options"
                        className="text-[#9cb0a5] hover:text-[#0f172a] p-1 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[#e8efea] overflow-hidden">
                        <div className="h-full rounded-full bg-[#58896c] w-[80%]" />
                      </div>
                      <span className="text-xs font-medium text-[#64756b] tabular-nums">80%</span>
                    </div>

                    <div className="flex items-center pt-1">
                      <img
                        src={avatarProductStrategist}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      />
                      <img
                        src={teamLeadAvatar}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2"
                      />
                      <img
                        src={avatarCreativeDesigner}
                        alt="Team member"
                        className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2"
                      />
                      <span className="w-7 h-7 rounded-full bg-[#ebf2ed] text-[#284e3a] text-[11px] font-bold flex items-center justify-center border-2 border-white -ml-2">
                        +1
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* MAIN 2-COLUMN WORKSPACE GRID (Left: Clients + Recent Proposals + Quick Actions | Right: Zendo AI Insight + Follow-ups) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN (8 Cols) */}
                <div className="xl:col-span-8 space-y-6">
                  {/* CLIENTS SECTION (Placed UPPER to Proposal section as requested) */}
                  <section
                    aria-label="Active Clients"
                    className="bg-white rounded-2xl border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f1f3f1]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#e8f4ec] text-[#2b543e] flex items-center justify-center shrink-0">
                          <Users className="w-4.5 h-4.5 stroke-[2.2]" />
                        </div>
                        <div>
                          <h2 className="font-display text-base sm:text-lg font-bold text-[#111c24]">
                            Active Clients
                          </h2>
                          <p className="text-xs text-[#64756b]">
                            {clients.length} active client accounts and partners
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAddClientModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#3d6b52] hover:bg-[#325843] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>New client</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateTo('/clients')}
                          className="text-xs sm:text-sm font-semibold text-[#4b735c] hover:text-[#3d614c] flex items-center gap-1 cursor-pointer whitespace-nowrap ml-1"
                        >
                          <span>View all</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {clients.slice(0, 3).map((client) => {
                        const clientProps = proposals.filter(
                          (p) => p.clientCompany.toLowerCase() === client.company.toLowerCase()
                        );
                        return (
                          <div
                            key={client.id}
                            onClick={() => {
                              setSelectedMessageClient(client.company);
                              navigateTo('/clients');
                            }}
                            className="p-4 rounded-xl border border-[#edf0ed] bg-[#fcfdfc] hover:bg-[#f6f9f7] hover:border-[#cfddd0] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="w-8 h-8 rounded-lg bg-[#eef4f0] text-[#2f5c43] font-bold text-xs flex items-center justify-center">
                                  {client.company.charAt(0)}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#e9f2ec] text-[#2b543e]">
                                  {client.status || 'Active'}
                                </span>
                              </div>
                              <h3 className="text-sm font-bold text-[#0f172a] group-hover:text-[#2b543e] transition-colors truncate">
                                {client.company}
                              </h3>
                              <p className="text-xs text-[#64756b] mt-0.5 truncate">
                                {client.name}
                              </p>
                              <p className="text-[11px] text-[#889b90] mt-1 truncate">
                                {client.industry}
                              </p>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-[#f1f3f1] flex items-center justify-between text-[11px]">
                              <span className="text-[#64756b]">
                                {clientProps.length} proposal{clientProps.length === 1 ? '' : 's'}
                              </span>
                              <span className="font-semibold text-[#3d6b52] group-hover:underline">
                                Details →
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* PROPOSALS SECTION (Placed BELOW Client Section) */}
                  {proposals.length === 0 || showEmptyStateDemo ? (
                    /* 8. EMPTY STATE */
                    <section className="bg-white rounded-2xl border border-[#edf0ed] p-10 sm:p-14 text-center shadow-[0_2px_10px_rgba(16,28,25,0.02)]">
                      <div className="w-12 h-12 rounded-2xl bg-[#f0eefc] text-[#5b4bc4] flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-bold text-[#111c24]">
                        Your first proposal starts here.
                      </h2>
                      <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                        Tell Zendo about your client and project. Our AI will help you create a
                        polished proposal in minutes.
                      </p>
                      <div className="mt-6 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleStartNewProposal()}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Your First Proposal</span>
                        </button>
                        {showEmptyStateDemo && (
                          <button
                            type="button"
                            onClick={() => setShowEmptyStateDemo(false)}
                            className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Restore Sample Proposals
                          </button>
                        )}
                      </div>
                    </section>
                  ) : (
                    /* 5. RECENT PROPOSALS TABLE */
                    <section className="bg-white rounded-2xl border border-[#edf0ed] shadow-[0_2px_10px_rgba(16,28,25,0.02)] overflow-hidden">
                      <div className="px-6 py-5 border-b border-[#f1f3f1] flex items-center justify-between">
                        <h2 className="font-display text-base sm:text-lg font-bold text-[#111c24]">
                          Recent proposals
                        </h2>
                        <button
                          type="button"
                          onClick={() => navigateTo('/proposals')}
                          className="text-xs sm:text-sm font-semibold text-[#4b735c] hover:text-[#3d614c] flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <span>View all</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#f1f3f1] text-[11px] font-semibold uppercase tracking-wider text-[#68737d]">
                              <th className="py-3.5 px-6">Proposal</th>
                              <th className="py-3.5 px-4">Client</th>
                              <th className="py-3.5 px-4">Value</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4">Last Updated</th>
                              <th className="py-3.5 px-6 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f1f3f1] text-sm">
                            {proposals.slice(0, 4).map((proposal) => (
                              <tr
                                key={proposal.id}
                                className="hover:bg-[#f9fbf9] transition-colors group"
                              >
                                <td className="py-4 px-6 font-semibold text-[#111c24]">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProposal(proposal)}
                                    className="hover:text-[#4b735c] transition-colors text-left cursor-pointer whitespace-nowrap"
                                  >
                                    {proposal.title}
                                  </button>
                                </td>
                                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                                  {proposal.clientCompany}
                                </td>
                                <td className="py-4 px-4 font-semibold text-[#111c24] tabular-nums whitespace-nowrap">
                                  {proposal.value}
                                </td>
                                <td className="py-4 px-4">
                                  <StatusBadge status={proposal.status} />
                                </td>
                                <td className="py-4 px-4 text-slate-400 text-xs tabular-nums whitespace-nowrap">
                                  {proposal.updatedAt}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenProposal(proposal)}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#f4f6f4] hover:bg-[#111c24] hover:text-white text-xs font-semibold text-[#111c24] transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    Open
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {/* 6B. QUICK ACTIONS CARD (Below Recent Proposals) */}
                  <section className="bg-white rounded-2xl border border-[#edf0ed] p-6 shadow-[0_2px_10px_rgba(16,28,25,0.02)]">
                    <h2 className="font-display text-base sm:text-lg font-bold text-[#111c24] mb-4">
                      Quick actions
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                      <button
                        type="button"
                        onClick={() => handleStartNewProposal()}
                        className="p-4 rounded-xl border border-[#edf0ed] bg-[#fcfdfc] hover:bg-[#f0eefc]/50 hover:border-[#d8d4f7] text-left transition-all group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#f0eefc] text-[#5b4bc4] flex items-center justify-center mb-3">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#111c24] group-hover:text-[#5b4bc4]">
                          Create AI Proposal
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('/meetings')}
                        className="p-4 rounded-xl border border-[#edf0ed] bg-[#fcfdfc] hover:bg-[#e9f2ec]/60 hover:border-[#cfddd0] text-left transition-all group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#e9f2ec] text-[#49725b] flex items-center justify-center mb-3">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#111c24] group-hover:text-[#3d614c]">
                          Schedule Meeting
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAddClientModalOpen(true)}
                        className="p-4 rounded-xl border border-[#edf0ed] bg-[#fcfdfc] hover:bg-[#e9f2ec]/60 hover:border-[#cfddd0] text-left transition-all group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#e9f2ec] text-[#2f6f4e] flex items-center justify-center mb-3">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#111c24] group-hover:text-[#2f6f4e]">
                          Add New Client
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('/templates')}
                        className="p-4 rounded-xl border border-[#edf0ed] bg-[#fcfdfc] hover:bg-[#eef2ff]/60 hover:border-[#c7d2fe] text-left transition-all group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#eef2ff] text-[#4338ca] flex items-center justify-center mb-3">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#111c24] group-hover:text-[#4338ca]">
                          Browse Templates
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportBriefModalOpen(true)}
                        className="p-4 rounded-xl border border-[#edf0ed] bg-[#fcfdfc] hover:bg-[#fef3c7]/60 hover:border-[#fde68a] text-left transition-all group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#fef3c7] text-[#92400e] flex items-center justify-center mb-3">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#111c24] group-hover:text-[#92400e]">
                          Import Client Brief
                        </div>
                      </button>
                    </div>
                  </section>
                </div>

                {/* RIGHT COLUMN (4 Cols): Zendo AI Insight + Follow-ups */}
                <div className="xl:col-span-4 space-y-6">
                  {/* 7. AI INSIGHT CARD (Lavender Accent) */}
                  <section
                    aria-label="Zendo AI Insight"
                    className="rounded-2xl bg-gradient-to-br from-[#f0eefc] via-[#f5f2fe] to-[#ebe5fd] border border-[#e2dbf7] p-6 shadow-[0_2px_10px_rgba(16,28,25,0.02)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#5b4bc4] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h2 className="font-display text-base font-bold text-[#231952]">
                        Zendo AI insight
                      </h2>
                    </div>

                    <p className="text-xs sm:text-sm text-[#4335a8]/90 mt-3.5 leading-relaxed">
                      Three proposals are ready for a personalized follow-up. Responding at
                      the right time can help keep each opportunity moving.
                    </p>

                    <button
                      type="button"
                      onClick={() => navigateTo('/follow-ups')}
                      className="w-full mt-5 py-2.5 px-4 rounded-xl bg-[#5b4bc4] hover:bg-[#4d3db4] text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      <span>Review follow-ups</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </section>

                  {/* 6A. FOLLOW-UPS CARD */}
                  <section className="bg-white rounded-2xl border border-[#edf0ed] p-6 shadow-[0_2px_10px_rgba(16,28,25,0.02)]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-base sm:text-lg font-bold text-[#111c24]">
                        Follow-ups
                      </h2>
                      <span className="text-xs font-semibold text-[#92400e] bg-[#fffbeb] px-2.5 py-1 rounded-full">
                        {followUps.filter((f) => !f.sent).length} pending
                      </span>
                    </div>

                    <div className="space-y-3">
                      {followUps.map((item, idx) => {
                        const actionLabel = item.headline.includes('—')
                          ? item.headline.split('—')[1].trim()
                          : item.subtext;
                        const badgeText = item.sent
                          ? 'Sent'
                          : idx === 0
                          ? 'Today'
                          : idx === 1
                          ? 'Viewed'
                          : 'Tomorrow';
                        const badgeStyle = item.sent
                          ? 'bg-[#e9f2ec] text-[#2b543e]'
                          : idx === 0
                          ? 'bg-[#fffbeb] text-[#92400e]'
                          : idx === 1
                          ? 'bg-[#f0eefc] text-[#5b4bc4]'
                          : 'bg-[#eef2ff] text-[#4338ca]';

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedFollowUpId(item.id);
                              setFollowUpDraftSubject(item.suggestedSubject);
                              setFollowUpDraftBody(item.suggestedMessage);
                              navigateTo('/follow-ups');
                            }}
                            className="p-3.5 rounded-xl border border-[#edf0ed] bg-[#f9fbf9] hover:bg-white hover:border-[#cfd8d2] transition-all flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#111c24] truncate">
                                {item.clientCompany}
                              </div>
                              <div className="text-xs text-[#68737d] mt-0.5 truncate">
                                {actionLabel}
                              </div>
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg shrink-0 ${badgeStyle}`}
                            >
                              {badgeText}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateTo('/follow-ups')}
                      className="w-full mt-5 py-2.5 px-4 rounded-xl bg-[#f4f6f4] hover:bg-[#e8efe8] border border-[#edf0ed] text-xs sm:text-sm font-semibold text-[#111c24] transition-colors flex items-center justify-center cursor-pointer"
                    >
                      View follow-ups
                    </button>
                  </section>

                  {/* 6C. UPCOMING MEETINGS CARD */}
                  <section className="bg-white rounded-2xl border border-[#edf0ed] p-6 shadow-[0_2px_10px_rgba(16,28,25,0.02)]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#e9f2ec] text-[#3d614c] flex items-center justify-center">
                          <Video className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="font-display text-base font-bold text-[#111c24]">
                            Upcoming Meetings
                          </h2>
                          <p className="text-[11px] text-[#68737d]">Pitches & Walkthroughs</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#2b543e] bg-[#e9f2ec] px-2.5 py-1 rounded-full">
                        {upcomingMeetingsCount} scheduled
                      </span>
                    </div>

                    <div className="space-y-3">
                      {meetings
                        .filter((m) => m.status === 'Scheduled')
                        .slice(0, 3)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl border border-[#edf0ed] bg-[#f9fbf9] hover:bg-white hover:border-[#cfd8d2] transition-all space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-bold text-[#111c24] line-clamp-1">
                                  {item.title}
                                </div>
                                <div className="text-xs text-[#68737d] mt-0.5">
                                  {item.clientCompany} · {item.clientName}
                                </div>
                              </div>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#e9f2ec] text-[#2b543e] whitespace-nowrap">
                                {item.type}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-[#68737d] pt-1 border-t border-[#edf0ed]">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {item.date} · {item.time} ({item.durationMinutes}m)
                              </span>
                              {item.meetingLink && (
                                <a
                                  href={item.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-semibold text-[#4b735c] hover:underline flex items-center gap-0.5"
                                >
                                  <span>Join Call</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateTo('/meetings')}
                      className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Manage & Schedule Meetings</span>
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              ROUTE 2: CREATE PROPOSAL PAGE (/proposals/new)
          ================================================================= */}
          {currentRoute === '/proposals/new' && (
            <section className="max-w-3xl mx-auto">
              {/* Top Back Link */}
              <div className="mb-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigateTo('/dashboard')}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-[#0F172A] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setClientName('Hannah Lin');
                      setCompanyName('Acme Studio');
                      setClientEmail('hannah@acmestudio.co');
                      setClientIndustry('Design & Creative Agency');
                      setProjectTitle('Website Redesign & CMS Migration');
                      setClientNeed(
                        'Redesign the core agency marketing site to elevate brand authority, showcase interactive case studies, and increase enterprise lead conversion.'
                      );
                      setSelectedServices([
                        'UX Research & Wireframes',
                        'Custom Web Design',
                        'Webflow / React Development',
                      ]);
                      setProjectTimeline('4 weeks');
                      setProjectBudget('$6,800');
                      setAdditionalRequirements(
                        'Include interactive portfolio filtering and executive team training.'
                      );
                      triggerToast('Pre-filled sample client & project details');
                    }}
                    className="text-xs font-semibold text-[#6D28D9] bg-[#F5F0FF] hover:bg-[#EDE9FE] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Fill sample client brief
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
                {/* Header & 3-Step Progress Indicator */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#6D28D9] mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Zendo AI Proposal Builder</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A]">
                    Create a winning proposal
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Complete four guided steps and let Zendo AI draft a personalized,
                    client-ready proposal.
                  </p>

                  {/* 4-Step Progress Bar */}
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { step: 1, title: 'Step 1: Client' },
                      { step: 2, title: 'Step 2: Project' },
                      { step: 3, title: 'Step 3: Style' },
                      { step: 4, title: 'Step 4: Template' },
                    ].map((item) => {
                      const active = createStep === item.step;
                      const completed = createStep > item.step;
                      return (
                        <button
                          key={item.step}
                          type="button"
                          onClick={() => {
                            if (item.step < createStep) setCreateStep(item.step as 1 | 2 | 3 | 4);
                          }}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            active
                              ? 'border-[#4b735c] bg-emerald-50/40 shadow-2xs'
                              : completed
                              ? 'border-emerald-200 bg-white cursor-pointer'
                              : 'border-slate-200 bg-[#FAF9F6]/60 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-xs font-bold ${
                                active
                                  ? 'text-[#4b735c]'
                                  : completed
                                  ? 'text-[#3d614c]'
                                  : 'text-slate-400'
                              }`}
                            >
                              0{item.step}
                            </span>
                            {completed && (
                              <Check className="w-3.5 h-3.5 text-[#4b735c]" />
                            )}
                          </div>
                          <div className="text-xs font-semibold text-[#0F172A] truncate">
                            {item.title}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formError && (
                  <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                    {formError}
                  </div>
                )}

                {isGeneratingAI ? (
                  /* AI Generation Loading State */
                  <div className="py-14 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5F0FF] border border-[#E4D9FF] text-[#6D28D9] flex items-center justify-center mx-auto animate-pulse">
                      <Wand2 className="w-7 h-7" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#0F172A]">
                      Generating your proposal with Zendo AI...
                    </h2>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      {generationStageText}
                    </p>
                    <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mx-auto mt-4">
                      <div className="h-full bg-[#4b735c] w-3/4 rounded-full animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* STEP 1: CLIENT DETAILS */}
                    {createStep === 1 && (
                      <div className="space-y-5">
                        <div className="pb-2 border-b border-slate-100">
                          <h2 className="text-base font-bold text-[#0F172A]">
                            Client &amp; Organization Details
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Tell Zendo who this proposal is for to personalize the address, tone, and benchmarks.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                              Client contact name *
                            </label>
                            <input
                              type="text"
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              placeholder="e.g. Hannah Lin"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                              Company / Organization *
                            </label>
                            <input
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="e.g. Acme Studio"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                              Client Email *
                            </label>
                            <input
                              type="email"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              placeholder="e.g. hannah@acmestudio.co"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                              Industry
                            </label>
                            <select
                              value={clientIndustry}
                              onChange={(e) => setClientIndustry(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] bg-white focus:outline-none focus:border-[#4b735c]"
                            >
                              {INDUSTRY_OPTIONS.map((ind) => (
                                <option key={ind} value={ind}>
                                  {ind}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Quick Select from Existing Clients */}
                        {clients.length > 0 && (
                          <div className="pt-2">
                            <span className="block text-xs font-medium text-slate-500 mb-2">
                              Or quick-select an existing client from your accounts:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {clients.slice(0, 5).map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setClientName(c.name);
                                    setCompanyName(c.company);
                                    setClientEmail(c.email);
                                    setClientIndustry(c.industry);
                                  }}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-[#FAF9F6] hover:bg-slate-100 text-xs font-medium text-[#0F172A] cursor-pointer"
                                >
                                  {c.company} ({c.name})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => navigateTo('/dashboard')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white font-semibold text-sm transition-colors cursor-pointer"
                          >
                            <span>Continue to Project scope</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: PROJECT SCOPE & DELIVERABLES */}
                    {createStep === 2 && (
                      <div className="space-y-5">
                        <div className="pb-2 border-b border-slate-100">
                          <h2 className="text-base font-bold text-[#0F172A]">
                            Project Scope &amp; Deliverables
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Define the project goals, services, timeline, and investment range.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                            Proposal title
                          </label>
                          <input
                            type="text"
                            value={projectTitle}
                            onChange={(e) => setProjectTitle(e.target.value)}
                            placeholder="e.g. Website Redesign & Conversion Strategy"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                            What does the client need? *
                          </label>
                          <textarea
                            rows={3}
                            value={clientNeed}
                            onChange={(e) => setClientNeed(e.target.value)}
                            placeholder="Describe the client's goals, challenges, and desired outcomes..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                            Services to provide *
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2.5">
                            {AVAILABLE_SERVICES.map((srv) => {
                              const active = selectedServices.includes(srv);
                              return (
                                <button
                                  key={srv}
                                  type="button"
                                  onClick={() => handleToggleService(srv)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-[#4b735c] text-white border-[#4b735c]'
                                      : 'bg-[#FAF9F6] text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {srv}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customServiceInput}
                              onChange={(e) => setCustomServiceInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomService();
                                }
                              }}
                              placeholder="Add custom service..."
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomService}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A]"
                            >
                              + Add
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                              Project timeline
                            </label>
                            <input
                              type="text"
                              value={projectTimeline}
                              onChange={(e) => setProjectTimeline(e.target.value)}
                              placeholder="e.g. 4 weeks"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                              Budget *
                            </label>
                            <input
                              type="text"
                              value={projectBudget}
                              onChange={(e) => setProjectBudget(e.target.value)}
                              placeholder="e.g. $4,800"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                            Additional requirements
                          </label>
                          <input
                            type="text"
                            value={additionalRequirements}
                            onChange={(e) => setAdditionalRequirements(e.target.value)}
                            placeholder="Any specific milestones, payment terms, or compliance notes..."
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                          />
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCreateStep(1)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
                          >
                            Back to Client details
                          </button>
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white font-semibold text-sm transition-colors cursor-pointer"
                          >
                            <span>Continue to Tone &amp; style</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: PROPOSAL STYLE & TONE */}
                    {createStep === 3 && (
                      <div className="space-y-6">
                        <div className="pb-2 border-b border-slate-100">
                          <h2 className="text-base font-bold text-[#0F172A]">
                            Proposal Tone &amp; Style
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Choose how Zendo AI phrases your value proposition and executive summary.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#0F172A] mb-3">
                            Select your proposal tone
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {(
                              [
                                {
                                  tone: 'Professional',
                                  desc: 'Structured, executive-ready language ideal for enterprise & B2B clients.',
                                },
                                {
                                  tone: 'Friendly',
                                  desc: 'Warm, approachable, and collaborative tone built for long-term partnerships.',
                                },
                                {
                                  tone: 'Premium',
                                  desc: 'Polished, high-value agency positioning focused on bespoke craft & ROI.',
                                },
                                {
                                  tone: 'Direct',
                                  desc: 'Concise, outcome-first scope and pricing with zero fluff.',
                                },
                              ] as { tone: ProposalStyleTone; desc: string }[]
                            ).map((option) => {
                              const selected = proposalStyle === option.tone;
                              return (
                                <button
                                  key={option.tone}
                                  type="button"
                                  onClick={() => setProposalStyle(option.tone)}
                                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                                    selected
                                      ? 'border-[#4b735c] bg-emerald-50/40 shadow-2xs ring-2 ring-[#4b735c]/20'
                                      : 'border-slate-200 bg-[#FAF9F6]/60 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-bold text-[#0F172A]">
                                      {option.tone}
                                    </span>
                                    {selected && (
                                      <CheckCircle2 className="w-4 h-4 text-[#4b735c]" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    {option.desc}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCreateStep(2)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
                          >
                            Back to Project scope
                          </button>
                          <button
                            type="button"
                            onClick={handleNextStep}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white font-semibold text-sm transition-colors cursor-pointer"
                          >
                            <span>Continue to Template &amp; design</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: PROPOSAL TEMPLATES & VISUAL DESIGN (THE LAST STEP) */}
                    {createStep === 4 && (
                      <div className="space-y-6">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                                Final Step 04
                              </span>
                              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                                Choose Proposal Template &amp; Visual Design
                              </h2>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Pick your proposal cover design and structural package for {companyName || 'this client'} before generating.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddTemplateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] shadow-2xs cursor-pointer self-start sm:self-auto"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#4b735c]" />
                            <span>+ Add Template Design</span>
                          </button>
                        </div>

                        {/* Part A: Visual Cover Design Layouts */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                                1. Visual Cover Design Themes
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Select the hero cover page layout &amp; color aesthetic
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Selected: {PROPOSAL_THEMES[selectedTemplateTheme]?.name || 'Executive Skyline'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                            {(Object.keys(PROPOSAL_THEMES) as ProposalThemeKey[]).map((themeKey) => {
                              const t = PROPOSAL_THEMES[themeKey];
                              const isSelected = selectedTemplateTheme === themeKey;
                              return (
                                <button
                                  key={themeKey}
                                  type="button"
                                  onClick={() => setSelectedTemplateTheme(themeKey)}
                                  className={`rounded-2xl border text-left p-3 transition-all cursor-pointer flex flex-col justify-between group ${
                                    isSelected
                                      ? 'border-[#3d6b52] bg-emerald-50/40 shadow-sm ring-2 ring-[#3d6b52]/20'
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                                  }`}
                                >
                                  <div>
                                    {/* Thumbnail Preview */}
                                    <div className="rounded-xl overflow-hidden aspect-[16/10] bg-slate-900 border border-slate-200 mb-2 relative">
                                      <img
                                        src={t.screenshotPath}
                                        alt={t.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-102 transition-transform duration-200"
                                      />
                                      <div className="absolute top-2 right-2">
                                        {isSelected ? (
                                          <div className="w-5 h-5 rounded-full bg-[#3d6b52] text-white flex items-center justify-center shadow-xs">
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-white/80 border border-slate-300 backdrop-blur-xs" />
                                        )}
                                      </div>
                                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] text-white font-mono">
                                        {t.category}
                                      </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: t.accentColor }}
                                      />
                                      <h4 className="text-xs font-bold text-[#0F172A] truncate">
                                        {t.name}
                                      </h4>
                                    </div>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                      {t.description}
                                    </p>
                                  </div>

                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                    <span className="truncate">{t.vibe.split(',')[0]}</span>
                                    <span className={`font-semibold ${isSelected ? 'text-[#3d6b52]' : 'text-slate-500'}`}>
                                      {isSelected ? 'Active Design' : 'Select'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Part B: Structural Scope & Package Templates */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                                2. Structural Scope Templates
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                Pre-packaged deliverables and pricing structures or blank custom scope
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Blank / Custom Scope Card */}
                            <div
                              onClick={() => handleSelectTemplate(null)}
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                selectedTemplateId === 'blank'
                                  ? 'border-[#4b735c] bg-emerald-50/40 ring-2 ring-[#4b735c]/20 shadow-2xs'
                                  : 'border-slate-200 bg-[#FAF9F6]/60 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                                    Custom Canvas
                                  </span>
                                  {selectedTemplateId === 'blank' && (
                                    <CheckCircle2 className="w-4 h-4 text-[#4b735c]" />
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-[#0F172A]">
                                  Blank / Custom Scope
                                </h4>
                                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                  Custom deliverables, timeline, and pricing tailored specifically to this client.
                                </p>
                              </div>
                              <div className="mt-3 pt-2 border-t border-slate-200/70 text-[10px] text-slate-500 font-medium">
                                Flexible budget &amp; milestones
                              </div>
                            </div>

                            {/* Pre-configured Templates */}
                            {templates.map((tpl) => {
                              const isSelected = selectedTemplateId === tpl.id;
                              return (
                                <div
                                  key={tpl.id}
                                  onClick={() => handleSelectTemplate(tpl)}
                                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                      ? 'border-[#4b735c] bg-emerald-50/40 ring-2 ring-[#4b735c]/20 shadow-2xs'
                                      : 'border-slate-200 bg-[#FAF9F6]/60 hover:bg-white hover:border-slate-300'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                        {tpl.category}
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono text-slate-500">
                                          {tpl.typicalTimeline}
                                        </span>
                                        {isSelected && (
                                          <CheckCircle2 className="w-4 h-4 text-[#4b735c]" />
                                        )}
                                      </div>
                                    </div>
                                    <h4 className="text-xs font-bold text-[#0F172A]">
                                      {tpl.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                      {tpl.description}
                                    </p>
                                    <div className="mt-2.5 flex flex-wrap gap-1">
                                      {tpl.services.slice(0, 3).map((srv) => (
                                        <span
                                          key={srv}
                                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-[10px] font-medium text-slate-700"
                                        >
                                          {srv}
                                        </span>
                                      ))}
                                      {tpl.services.length > 3 && (
                                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                                          +{tpl.services.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                                    <span className="font-semibold text-slate-800 font-mono">
                                      {tpl.typicalValue}
                                    </span>
                                    <span className="text-slate-500">
                                      Tone: <strong>{tpl.recommendedTone}</strong>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Part C: Summary Recap Before AI Generation */}
                        <div className="rounded-xl bg-[#F5F0FF] border border-[#E4D9FF] p-4.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#6D28D9]" />
                              <span className="text-xs font-bold text-[#4C1D95]">
                                Ready to generate proposal for {companyName || 'your client'}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-[#6D28D9] bg-white px-2.5 py-0.5 rounded-full border border-[#E4D9FF]">
                              Tone: {proposalStyle}
                            </span>
                          </div>
                          <p className="text-xs text-[#3B0764]/85 leading-relaxed">
                            Zendo AI will assemble an 8-section client proposal tailored for <strong>{companyName || 'Client'}</strong> ({clientIndustry}) featuring {selectedServices.length} deliverables, estimated at {projectBudget} over {projectTimeline}, using the <strong>{PROPOSAL_THEMES[selectedTemplateTheme]?.name}</strong> cover layout.
                          </p>
                        </div>

                        {/* Bottom Buttons */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCreateStep(3)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
                          >
                            Back to Tone &amp; style
                          </button>

                          <button
                            type="button"
                            onClick={handleGenerateProposalWithAI}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Generate Proposal with AI</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 3: PROPOSAL EDITOR & DETAILS PAGE (/proposals/editor)
          ================================================================= */}
          {currentRoute === '/proposals/editor' && activeProposal && (
            <section className="space-y-6">
              {/* Top Editor Action Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('/dashboard')}
                    aria-label="Back to Dashboard"
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="font-display text-lg sm:text-xl font-bold text-[#0F172A]">
                        {activeProposal.title}
                      </h1>
                      <StatusBadge status={activeProposal.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Client: {activeProposal.clientCompany} ({activeProposal.clientName}) ·
                      Value:{' '}
                      <span className="font-mono font-semibold text-[#0F172A]">
                        {activeProposal.value}
                      </span>{' '}
                      · Tone: {activeProposal.style}
                    </p>
                  </div>
                </div>

                {/* Required 5 Action Buttons: Save draft, Preview, Export PDF, Share proposal, Send to client */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      triggerToast(`Saved draft of "${activeProposal.title}"`)
                    }
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Save draft
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditorPreviewMode((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isEditorPreviewMode
                        ? 'border-[#6D28D9] bg-[#F5F0FF] text-[#5B21B6]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-[#0F172A]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isEditorPreviewMode ? 'Exit Preview' : 'Preview'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Download Markdown</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share proposal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigateTo('/meetings');
                      triggerToast(`Opening meeting scheduler for "${activeProposal.title}"`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Schedule walkthrough</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSendModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to client</span>
                  </button>
                </div>
              </div>

              {/* Editable / Preview Proposal Document */}
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Proposal Cover Design & Theme Selector */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Palette className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#0F172A]">
                      Cover Template & Style:
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {(['cyber-onyx', 'executive-skyline', 'bauhaus-purple', 'playful-crayon', 'classic'] as ProposalThemeKey[]).map((themeKey) => {
                      const isSelected = (activeProposal.templateTheme || 'classic') === themeKey;
                      const themeMeta = PROPOSAL_THEMES[themeKey];
                      return (
                        <button
                          key={themeKey}
                          type="button"
                          onClick={() => {
                            handleUpdateActiveProposal((p) => ({ ...p, templateTheme: themeKey }));
                            triggerToast(`Applied "${themeMeta.name}" template design`);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-[#0F172A] text-white shadow-xs'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: themeMeta.accentColor }}
                          />
                          <span>{themeMeta.name}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleOpenNemotronModal(activeProposal.templateTheme || 'executive-skyline')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap ml-1 shadow-2xs"
                    >
                      <Palette className="w-3.5 h-3.5 text-slate-600" />
                      <span>Visual Layout</span>
                    </button>
                  </div>
                </div>

                {/* 1. COVER PAGE */}
                <ProposalCoverRenderer
                  proposal={activeProposal}
                  themeKey={activeProposal.templateTheme}
                  isEditorPreviewMode={isEditorPreviewMode}
                  workspaceCompanyName={workspaceCompanyInput}
                  onUpdateTitle={(val) =>
                    handleUpdateActiveProposal((p) => ({ ...p, title: val }))
                  }
                  onUpdateSubtitle={(val) =>
                    handleUpdateActiveProposal((p) => ({
                      ...p,
                      sections: { ...p.sections, coverSubtitle: val },
                    }))
                  }
                />

                {/* 2. EXECUTIVE SUMMARY */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg font-bold text-[#0F172A]">
                      01. Executive summary
                    </h3>
                    {!isEditorPreviewMode && (
                      <button
                        type="button"
                        onClick={() => handleAIPolishSection('executiveSummary')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F0FF] hover:bg-[#EDE9FE] text-xs font-semibold text-[#6D28D9] cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Polish with Zendo AI</span>
                      </button>
                    )}
                  </div>
                  {isEditorPreviewMode ? (
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                      {activeProposal.sections.executiveSummary}
                    </p>
                  ) : (
                    <textarea
                      rows={4}
                      value={activeProposal.sections.executiveSummary}
                      onChange={(e) =>
                        handleUpdateActiveProposal((p) => ({
                          ...p,
                          sections: {
                            ...p.sections,
                            executiveSummary: e.target.value,
                          },
                        }))
                      }
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-[#4b735c]"
                    />
                  )}
                </div>

                {/* 3. CLIENT PROBLEM & 4. PROPOSED SOLUTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client problem */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-lg font-bold text-[#0F172A]">
                          02. Client problem
                        </h3>
                        {!isEditorPreviewMode && (
                          <button
                            type="button"
                            onClick={() => handleAIPolishSection('clientProblem')}
                            className="text-xs font-semibold text-[#6D28D9] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> AI Refine
                          </button>
                        )}
                      </div>
                      {isEditorPreviewMode ? (
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {activeProposal.sections.clientProblem}
                        </p>
                      ) : (
                        <textarea
                          rows={5}
                          value={activeProposal.sections.clientProblem}
                          onChange={(e) =>
                            handleUpdateActiveProposal((p) => ({
                              ...p,
                              sections: {
                                ...p.sections,
                                clientProblem: e.target.value,
                              },
                            }))
                          }
                          className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-[#4b735c]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Proposed solution */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-lg font-bold text-[#0F172A]">
                          03. Proposed solution
                        </h3>
                        {!isEditorPreviewMode && (
                          <button
                            type="button"
                            onClick={() => handleAIPolishSection('proposedSolution')}
                            className="text-xs font-semibold text-[#6D28D9] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> AI Refine
                          </button>
                        )}
                      </div>
                      {isEditorPreviewMode ? (
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {activeProposal.sections.proposedSolution}
                        </p>
                      ) : (
                        <textarea
                          rows={5}
                          value={activeProposal.sections.proposedSolution}
                          onChange={(e) =>
                            handleUpdateActiveProposal((p) => ({
                              ...p,
                              sections: {
                                ...p.sections,
                                proposedSolution: e.target.value,
                              },
                            }))
                          }
                          className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-[#4b735c]"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. SERVICES AND DELIVERABLES */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold text-[#0F172A]">
                      04. Services and deliverables
                    </h3>
                    {!isEditorPreviewMode && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateActiveProposal((p) => ({
                            ...p,
                            sections: {
                              ...p.sections,
                              servicesDeliverables: [
                                ...p.sections.servicesDeliverables,
                                {
                                  id: `del-${Date.now()}`,
                                  name: 'Additional Deliverable Milestone',
                                  description:
                                    'Custom strategy and execution sprint tailored to stakeholder feedback.',
                                  included: true,
                                },
                              ],
                            },
                          }))
                        }
                        className="text-xs font-semibold text-[#4b735c] hover:text-[#3d614c] cursor-pointer"
                      >
                        + Add deliverable
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {activeProposal.sections.servicesDeliverables.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-slate-100 bg-[#FAF9F6]/70 flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <CheckCircle2 className="w-4 h-4 text-[#4b735c] shrink-0 mt-1" />
                          {isEditorPreviewMode ? (
                            <div>
                              <div className="text-sm font-bold text-[#0F172A]">
                                {item.name}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          ) : (
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateActiveProposal((p) => ({
                                    ...p,
                                    sections: {
                                      ...p.sections,
                                      servicesDeliverables:
                                        p.sections.servicesDeliverables.map((d, i) =>
                                          i === idx ? { ...d, name: val } : d
                                        ),
                                    },
                                  }));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-[#0F172A]"
                              />
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateActiveProposal((p) => ({
                                    ...p,
                                    sections: {
                                      ...p.sections,
                                      servicesDeliverables:
                                        p.sections.servicesDeliverables.map((d, i) =>
                                          i === idx ? { ...d, description: val } : d
                                        ),
                                    },
                                  }));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600"
                              />
                            </div>
                          )}
                        </div>
                        {!isEditorPreviewMode &&
                          activeProposal.sections.servicesDeliverables.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateActiveProposal((p) => ({
                                  ...p,
                                  sections: {
                                    ...p.sections,
                                    servicesDeliverables:
                                      p.sections.servicesDeliverables.filter(
                                        (_, i) => i !== idx
                                      ),
                                  },
                                }))
                              }
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Remove deliverable"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. TIMELINE */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold text-[#0F172A]">
                      05. Timeline ({activeProposal.timelineSummary})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {activeProposal.sections.timeline.map((phase) => (
                      <div
                        key={phase.id}
                        className="p-4 rounded-xl border border-slate-200/80 bg-[#FAF9F6]/60"
                      >
                        <span className="text-xs font-mono font-semibold text-[#4b735c]">
                          {phase.duration}
                        </span>
                        <div className="text-sm font-bold text-[#0F172A] mt-1">
                          {phase.phase}
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {phase.deliverable}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. PRICING */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg font-bold text-[#0F172A]">
                      06. Pricing & investment
                    </h3>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">
                        Total Investment
                      </span>
                      <span className="font-display text-xl font-bold text-[#4b735c] font-mono tabular-nums">
                        {activeProposal.value}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {activeProposal.sections.pricingItems.map((pItem) => (
                      <div
                        key={pItem.id}
                        className="p-4 bg-white flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#0F172A]">
                            {pItem.item}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {pItem.detail}
                          </div>
                        </div>
                        <div className="font-mono tabular-nums font-bold text-sm text-[#0F172A]">
                          {pItem.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    {activeProposal.sections.pricingNote}
                  </p>
                </div>

                {/* 8. TERMS AND NEXT STEPS */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                  <h3 className="font-display text-lg font-bold text-[#0F172A] mb-3">
                    07. Terms and next steps
                  </h3>
                  {isEditorPreviewMode ? (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {activeProposal.sections.termsAndNextSteps}
                    </p>
                  ) : (
                    <textarea
                      rows={3}
                      value={activeProposal.sections.termsAndNextSteps}
                      onChange={(e) =>
                        handleUpdateActiveProposal((p) => ({
                          ...p,
                          sections: {
                            ...p.sections,
                            termsAndNextSteps: e.target.value,
                          },
                        }))
                      }
                      className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed focus:outline-none focus:border-[#4b735c]"
                    />
                  )}

                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-slate-500">
                      Prepared by{' '}
                      <span className="font-semibold text-[#0F172A]">
                        {displayUserName}
                      </span>{' '}
                      for{' '}
                      <span className="font-semibold text-[#0F172A]">
                        {activeProposal.clientCompany}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeProposal.status !== 'Accepted' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateActiveProposal((p) => ({
                              ...p,
                              status: 'Accepted',
                            }));
                            triggerToast(
                              `Marked "${activeProposal.title}" as Accepted!`
                            );
                          }}
                          className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-[#3d614c] text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
                        >
                          Simulate Client Acceptance
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleOpenSendModal}
                        className="px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        Send to client
                      </button>
                    </div>
                  </div>
                </div>

                {/* 9. CLIENT MESSAGES & Q&A THREAD WITHIN PLATFORM */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#0F172A]">
                        08. Client messages &amp; Q&amp;A
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Clients can reply to messages, ask questions about scope or pricing, and communicate directly inside Zendo
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#4b735c] bg-emerald-50 px-2.5 py-1 rounded-lg self-start sm:self-center">
                      Live Client Thread
                    </span>
                  </div>

                  <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                    {clientMessages
                      .filter(
                        (m) =>
                          m.proposalId === activeProposal.id ||
                          m.clientCompany.toLowerCase() ===
                            activeProposal.clientCompany.toLowerCase()
                      )
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
                            msg.senderRole === 'agency'
                              ? 'bg-emerald-50/50 border-emerald-200/80 ml-4 sm:ml-10'
                              : 'bg-[#FAF9F6] border-slate-200/80 mr-4 sm:mr-10'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-[#0F172A]">
                              {msg.senderName}{' '}
                              <span className="font-normal text-slate-500">
                                ({msg.senderRole === 'agency' ? 'You' : activeProposal.clientCompany})
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {msg.timeLabel}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">
                            {msg.messageText}
                          </p>
                        </div>
                      ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendClientMessage(
                            activeProposal.id,
                            activeProposal.clientCompany,
                            'agency'
                          );
                        }
                      }}
                      placeholder={`Reply to ${activeProposal.clientName} or answer a proposal question...`}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#4b735c]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSendClientMessage(
                          activeProposal.id,
                          activeProposal.clientCompany,
                          'agency'
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 4: ALL PROPOSALS DIRECTORY (/proposals)
          ================================================================= */}
          {currentRoute === '/proposals' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                    Proposals
                  </h1>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Manage, personalize, and track every client proposal in one place
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleStartNewProposal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-sm font-semibold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create Proposal</span>
                  </button>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {(
                    [
                      'All',
                      'Draft',
                      'Sent',
                      'Viewed',
                      'Follow-up',
                      'Accepted',
                      'Declined',
                    ] as ('All' | ProposalStatus)[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setProposalsFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        proposalsFilterStatus === st
                          ? 'bg-[#0F172A] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={proposalsSearchQuery}
                    onChange={(e) => setProposalsSearchQuery(e.target.value)}
                    placeholder="Filter by title or client..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#4b735c]"
                  />
                </div>
              </div>

              {/* Proposals Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#FAF9F6]/60 text-[11px] font-semibold text-slate-500">
                        <th className="py-3.5 px-6">Proposal</th>
                        <th className="py-3.5 px-4">Client</th>
                        <th className="py-3.5 px-4">Value</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Last updated</th>
                        <th className="py-3.5 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {proposals
                        .filter((p) =>
                          proposalsFilterStatus === 'All'
                            ? true
                            : p.status === proposalsFilterStatus
                        )
                        .filter((p) => {
                          const q = proposalsSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            p.title.toLowerCase().includes(q) ||
                            p.clientCompany.toLowerCase().includes(q)
                          );
                        })
                        .map((proposal) => (
                          <tr
                            key={proposal.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <button
                                type="button"
                                onClick={() => handleOpenProposal(proposal)}
                                className="font-semibold text-[#0F172A] hover:text-[#4b735c] text-left cursor-pointer"
                              >
                                {proposal.title}
                              </button>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {proposal.style} tone · {proposal.timelineSummary}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-[#0F172A]">
                                {proposal.clientCompany}
                              </div>
                              <div className="text-xs text-slate-400">
                                {proposal.clientName}
                              </div>
                            </td>
                            <td className="py-4 px-4 font-mono tabular-nums font-semibold text-[#0F172A]">
                              {proposal.value}
                            </td>
                            <td className="py-4 px-4">
                              <StatusBadge status={proposal.status} />
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-500 tabular-nums">
                              {proposal.updatedAt}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenProposal(proposal)}
                                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-[#0F172A] hover:text-white text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                                >
                                  Open
                                </button>
                                {proposals.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProposals((prev) =>
                                        prev.filter((p) => p.id !== proposal.id)
                                      );
                                      void deleteRecordFromFirestore('proposals', proposal.id);
                                      void deleteProposalFromBackend(proposal.id);
                                      triggerToast(`Deleted "${proposal.title}"`);
                                    }}
                                    title="Delete proposal"
                                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 5: CLIENTS (/clients)
          ================================================================= */}
          {currentRoute === '/clients' && (
            <div className="space-y-6">
              <ClientStoreView
                clients={supabaseClients}
                isLoading={isLoadingSupabaseClients}
                proposals={proposals}
                tasks={tasks}
                invoices={payments}
                onRefresh={() => void loadSupabaseClients()}
                onAddNewClient={() => setAddClientModalOpen(true)}
                onEditClient={handleOpenEditClient}
                onDeleteClient={handleOpenDeleteClient}
                onStartProposal={handleStartNewProposal}
                triggerToast={triggerToast}
              />

              {/* Client Workspace Hub: Tasks, Deadlines, Meetings & Project Updates */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#0F172A]">
                      Client Tasks, Deadlines, Meetings &amp; Project Updates
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage client deliverables, upcoming meetings, deadlines, and project updates in one workspace
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleAddClientWorkspaceTask}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-[#FAF9F6] p-3.5 rounded-xl border border-slate-200/70"
                >
                  <select
                    value={newTaskClient}
                    onChange={(e) => setNewTaskClient(e.target.value)}
                    className="sm:col-span-3 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-[#0F172A]"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.company}>
                        {c.company}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newTaskCategory}
                    onChange={(e) =>
                      setNewTaskCategory(
                        e.target.value as
                          | 'Task'
                          | 'Deadline'
                          | 'Meeting'
                          | 'Project Update'
                      )
                    }
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-[#0F172A]"
                  >
                    <option value="Task">Task</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Project Update">Project Update</option>
                  </select>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add client task, meeting, deadline, or project update..."
                    className="sm:col-span-4 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-[#0F172A]"
                  />
                  <input
                    type="text"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    placeholder="Due date / time"
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-[#0F172A]"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-1 px-3 py-2 rounded-lg bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </form>

                <div className="divide-y divide-slate-100">
                  {clientTasks.map((ct) => (
                    <div
                      key={ct.id}
                      onClick={() => handleToggleClientTaskStatus(ct.id)}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border ${
                            ct.status === 'Completed'
                              ? 'bg-[#4b735c] border-[#4b735c] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {ct.status === 'Completed' && (
                            <Check className="w-3 h-3" />
                          )}
                        </span>
                        <div>
                          <div
                            className={`text-xs sm:text-sm font-semibold ${
                              ct.status === 'Completed'
                                ? 'line-through text-slate-400'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            {ct.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {ct.clientCompany} · {ct.notes}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {ct.category}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {ct.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              ROUTE 5B: MEETINGS & SCHEDULING (/meetings, /calendar)
          ================================================================= */}
          {(currentRoute === '/meetings' || currentRoute === '/calendar') && (
            <MeetingSchedulingView
              meetings={meetings}
              clients={clients}
              proposals={proposals}
              onScheduleMeeting={handleScheduleFromView}
              onCancelMeeting={handleCancelMeeting}
              onCompleteMeeting={handleCompleteMeeting}
              onRescheduleMeeting={(meetingId, newDate, newTime) => {
                setMeetings((prev) =>
                  prev.map((m) =>
                    m.id === meetingId
                      ? { ...m, date: newDate, time: newTime, status: 'Scheduled' as const }
                      : m
                  )
                );
                triggerToast('Meeting successfully rescheduled.');
              }}
              onClientSelfBook={handleClientSelfBooking}
              onTriggerToast={triggerToast}
              onUpdateMeeting={(meetingId, partial) => {
                setMeetings((prev) =>
                  prev.map((m) => (m.id === meetingId ? { ...m, ...partial } : m))
                );
              }}
              companyName={onboardingConfig?.companyName || 'Zendo Studio'}
            />
          )}



          {/* =================================================================
              ROUTE 14: SQL DATABASE EXPLORER & STUDIO (/sql-database)
          ================================================================= */}
          {currentRoute === '/sql-database' && (
            <SqlStudioView
              onboardingConfig={onboardingConfig}
              onReopenOnboarding={onReopenOnboarding}
              clientsData={clients}
              proposalsData={proposals}
              meetingsData={meetings}
              tasksData={dashboardTasks}
              paymentsData={payments}
              onTriggerToast={triggerToast}
            />
          )}

          {/* =================================================================
              ROUTE 6: TEMPLATES (/templates)
          ================================================================= */}
          {currentRoute === '/templates' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                    AI Proposal Templates
                  </h1>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Start with a proven structure, create custom layouts, or let Zendo AI personalize it for your client.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAddTemplateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Custom Template</span>
                  </button>
                </div>
              </div>

              {/* Visual Proposal & Document Design Studio Banner */}
              <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        Visual Layout Studio
                      </span>
                      <span className="text-xs text-slate-300 font-mono">
                        Document Intelligence &amp; Formatting
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-bold tracking-tight text-white">
                      Document-Driven Proposal Design
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Upload any document or deck screenshot to extract visual hierarchy, margins, and layout classes, and synthesize a persuasive proposal matching your brand design.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenNemotronModal('executive-skyline')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#3d6b52] hover:bg-[#2f5540] text-white text-xs font-bold shadow-lg transition-all cursor-pointer whitespace-nowrap self-start md:self-auto shrink-0"
                  >
                    <Palette className="w-4 h-4 text-white" />
                    <span>Open Visual Layout Studio</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-md group"
                  >
                    <div>
                      {/* Template Screenshot Preview */}
                      {tpl.thumbnailImage && (
                        <div className="mb-4 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 aspect-16/9 relative group-hover:border-slate-300 transition-colors">
                          <img
                            src={tpl.thumbnailImage}
                            alt={tpl.title}
                            className="w-full h-full object-cover object-top opacity-95 group-hover:scale-102 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-mono">
                            <span className="font-bold tracking-wide">{tpl.category}</span>
                            <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-xs font-semibold">
                              {tpl.typicalValue}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-violet-100 text-violet-800">
                          {tpl.category}
                        </span>
                        <span className="font-mono tabular-nums text-slate-600 font-medium">
                          {tpl.typicalValue} · {tpl.typicalTimeline}
                        </span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-[#0F172A]">
                        {tpl.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                        {tpl.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap gap-1.5">
                        <span className="font-semibold text-slate-700 w-full mb-1">Included services:</span>
                        {tpl.services.map((srv) => (
                          <span
                            key={srv}
                            className="px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-slate-200 text-[11px] text-slate-700"
                          >
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-xs text-slate-500">
                        Tone: <strong>{tpl.recommendedTone}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenNemotronModal(tpl.themeKey || 'executive-skyline')}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-slate-600" />
                          <span>Inspect Layout</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStartNewProposal({
                              templateId: tpl.id,
                              title: tpl.title,
                              clientNeed: tpl.clientNeedPrompt,
                              services: tpl.services,
                              timeline: tpl.typicalTimeline,
                              budget: tpl.typicalValue.split('–')[0].trim(),
                              additionalRequirements: tpl.additionalNotes,
                              style: tpl.recommendedTone,
                            })
                          }
                          className="px-4 py-2 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <span>Use Template</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 7: FOLLOW-UPS (/follow-ups)
          ================================================================= */}
          {currentRoute === '/follow-ups' && (
            <section className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  Proposal Follow-ups
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  Never lose an opportunity. Review AI-timed follow-up drafts based on live
                  client engagement.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Follow-up Queue */}
                <div className="lg:col-span-5 space-y-3">
                  {followUps.map((fu) => {
                    const active = selectedFollowUpId === fu.id;
                    return (
                      <button
                        key={fu.id}
                        type="button"
                        onClick={() => {
                          setSelectedFollowUpId(fu.id);
                          setFollowUpDraftSubject(fu.suggestedSubject);
                          setFollowUpDraftBody(fu.suggestedMessage);
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                          active
                            ? 'bg-white border-[#4b735c] shadow-xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-[#0F172A]">
                            {fu.headline}
                          </span>
                          {fu.sent ? (
                            <span className="text-xs font-semibold text-[#4b735c] bg-emerald-50 px-2 py-0.5 rounded">
                              Sent
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-[#6D28D9] bg-[#F5F0FF] px-2 py-0.5 rounded">
                              {fu.timingBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{fu.subtext}</p>
                        <div className="text-[11px] text-slate-400 mt-2">
                          Proposal: {fu.proposalTitle} · {fu.contactName}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Column: AI Follow-up Composer */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  {(() => {
                    const currentFu =
                      followUps.find((f) => f.id === selectedFollowUpId) ||
                      followUps[0];
                    return (
                      <>
                        <div className="rounded-xl bg-[#F5F0FF] border border-[#E4D9FF] p-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#4C1D95]">
                            <Sparkles className="w-4 h-4 text-[#6D28D9]" />
                            <span>Zendo AI Signal for {currentFu.clientCompany}</span>
                          </div>
                          <p className="text-xs text-[#3B0764]/85 mt-1 leading-relaxed">
                            {currentFu.aiInsight}
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            To
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={`${currentFu.contactName} <${currentFu.contactEmail}>`}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-[#FAF9F6] text-xs font-medium text-slate-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={followUpDraftSubject}
                            onChange={(e) => setFollowUpDraftSubject(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-[#0F172A]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Personalized Follow-up Message
                          </label>
                          <textarea
                            rows={7}
                            value={followUpDraftBody}
                            onChange={(e) => setFollowUpDraftBody(e.target.value)}
                            className="w-full p-3.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] leading-relaxed"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const linked = proposals.find(
                                (p) => p.id === currentFu.proposalId
                              );
                              if (linked) handleOpenProposal(linked);
                            }}
                            className="text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
                          >
                            Open original proposal
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFollowUps((prev) =>
                                prev.map((f) => {
                                  if (f.id === currentFu.id) {
                                    const updated = { ...f, sent: true };
                                    void saveFollowUpToBackend(updated);
                                    return updated;
                                  }
                                  return f;
                                })
                              );
                              triggerToast(
                                `Sent personalized follow-up to ${currentFu.contactName} at ${currentFu.clientCompany}`
                              );
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>
                              {currentFu.sent ? 'Send Follow-up Again' : 'Send Follow-up'}
                            </span>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 8: ANALYTICS (/analytics)
          ================================================================= */}
          {currentRoute === '/analytics' && (
            <section className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  Proposal Analytics
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  Conversion rates, pipeline velocity, and AI personalization impact
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">
                    Proposal Win Rate
                  </span>
                  <div className="font-display text-3xl font-bold text-[#0F172A] mt-2 tabular-nums">
                    {statTotalProposals > 0
                      ? ((statWon / statTotalProposals) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </div>
                  <p className="text-xs text-[#4b735c] mt-1 font-medium">
                    {statWon} won across {statTotalProposals} total proposals
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">
                    In Progress & Sent
                  </span>
                  <div className="font-display text-3xl font-bold text-[#0F172A] mt-2 tabular-nums">
                    {statDrafts + statSent}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {statDrafts} drafts · {statSent} awaiting client decision
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500">
                    Active Pipeline Value
                  </span>
                  <div className="font-display text-3xl font-bold text-[#4b735c] mt-2 tabular-nums">
                    ${activePipelineValue.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Across {statTotalProposals} total proposals
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                <h2 className="font-display text-base font-bold text-[#0F172A] mb-4">
                  Win Rate by Proposal Style
                </h2>
                <div className="space-y-4">
                  {(
                    ['Premium', 'Professional', 'Friendly', 'Direct'] as ProposalStyleTone[]
                  ).map((styleTone) => {
                    const matching = proposals.filter(
                      (p) => (p.style || 'Premium') === styleTone
                    );
                    const won = matching.filter(
                      (p) => p.status === 'Accepted'
                    ).length;
                    const rate =
                      matching.length > 0
                        ? Math.round((won / matching.length) * 100)
                        : 0;
                    return (
                      <div key={styleTone} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#0F172A]">
                            {styleTone} Tone
                          </span>
                          <span className="font-mono tabular-nums text-slate-600">
                            {rate}% win rate ({won} won / {matching.length} total)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4b735c] rounded-full transition-all duration-300"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 9: SETTINGS (/settings)
          ================================================================= */}
          {currentRoute === '/settings' && (
            <section className="max-w-3xl space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                  Settings
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  Manage your profile, workspace proposal defaults, project export, and billing plan
                </p>
              </div>

              {/* Prominent Quick Export & Transfer banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-900/40 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Export &amp; Transfer Whole Project</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-400/20 text-emerald-300 font-semibold border border-emerald-400/30">
                        Ready to Transfer
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Download the complete project codebase archive (.zip) with all source files ready to transfer or run locally.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadWholeProjectZip}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3d6b52] hover:bg-[#2f5540] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Project (.ZIP)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTab('export')}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
                {(
                  [
                    { id: 'profile', label: 'Profile' },
                    { id: 'workspace', label: 'Proposal Defaults' },
                    { id: 'integrations', label: 'Email (Resend)' },
                    { id: 'billing', label: 'Billing & Plan' },
                    { id: 'export', label: 'Export & Transfer Project' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      settingsTab === tab.id
                        ? 'bg-[#0F172A] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {settingsTab === 'export' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-display text-lg font-bold text-[#0F172A]">
                      Download Whole Project &amp; Transfer
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Download the complete project bundle including all source code (React, TypeScript, Tailwind, Express server, database configurations, and UI components). You can transfer this project bundle to any host, repository, or local computer.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200/80 space-y-3">
                    <div className="text-xs font-bold text-[#0F172A]">
                      Project Specifications &amp; Tech Stack
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-slate-700">
                      <div className="p-2 rounded-lg bg-white border border-slate-200/60">React + Vite</div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200/60">TypeScript</div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200/60">Tailwind CSS</div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200/60">Node.js + Express</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                    <div className="text-xs font-bold text-emerald-900">
                      Local Run Instructions
                    </div>
                    <ol className="list-decimal list-inside text-xs text-emerald-800 space-y-1 font-mono">
                      <li>Unzip <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300">zendo-project-source.zip</code> into your working folder</li>
                      <li>Run <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300">npm install</code></li>
                      <li>Run <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300">npm run dev</code> (starts app server on port 3000)</li>
                    </ol>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      Archive includes 63 source files, proposals &amp; client database
                    </span>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadWholeProjectZip}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3d6b52] hover:bg-[#2f5540] text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Whole Project (.ZIP)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'integrations' && (
                <div className="space-y-6">
                  {/* Integration Card Header & Status */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                              Email Channel (Resend)
                            </h2>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                resendStatus === 'Connected'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : resendStatus === 'Error'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  resendStatus === 'Connected'
                                    ? 'bg-emerald-500'
                                    : resendStatus === 'Error'
                                    ? 'bg-rose-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {resendStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Send and receive client proposal messages via email alongside portal chat
                          </p>
                        </div>
                      </div>

                      {/* Default vs Custom Toggle */}
                      <label className="flex items-center gap-2.5 cursor-pointer select-none bg-[#FAF9F6] px-3.5 py-2 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          checked={useDefaultResendEmail}
                          onChange={(e) => setUseDefaultResendEmail(e.target.checked)}
                          className="w-4 h-4 text-[#1f7a4c] rounded-md border-slate-300 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-700">
                          Use Zendo's default email
                        </span>
                      </label>
                    </div>

                    {useDefaultResendEmail ? (
                      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 leading-relaxed space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Zendo Managed Platform Email Active</span>
                        </div>
                        <p>
                          Outgoing client notifications and inbound replies are automatically processed through Zendo’s high-deliverability platform domain. You don’t need to manage custom DNS or API keys.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-800">
                          <Key className="w-4 h-4 text-amber-600" />
                          <span>Custom Resend Credentials Mode</span>
                        </div>
                        <p>
                          Emails will be sent using your own Resend account and verified domain. Your API keys are encrypted at rest with AES-256-GCM.
                        </p>
                      </div>
                    )}

                    {/* Configuration Form */}
                    <form onSubmit={handleSaveResendSettings} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* API Key */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Resend API Key {resendApiKeyMasked && `(${resendApiKeyMasked})`}
                          </label>
                          <div className="relative">
                            <input
                              type={showApiKeyPlain ? 'text' : 'password'}
                              value={resendApiKeyInput}
                              onChange={(e) => setResendApiKeyInput(e.target.value)}
                              placeholder={resendApiKeyMasked || 're_xxxxxxxxxxxxxxxx'}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#1f7a4c]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKeyPlain(!showApiKeyPlain)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                            >
                              {showApiKeyPlain ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Stored with AES-256-GCM encryption. Never exposed to browser.
                          </p>
                        </div>

                        {/* Webhook Secret */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Webhook Signing Secret {resendWebhookSecretMasked && `(${resendWebhookSecretMasked})`}
                          </label>
                          <div className="relative">
                            <input
                              type={showWebhookPlain ? 'text' : 'password'}
                              value={resendWebhookSecretInput}
                              onChange={(e) => setResendWebhookSecretInput(e.target.value)}
                              placeholder={resendWebhookSecretMasked || 'whsec_xxxxxxxxxxxxxxxx'}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#1f7a4c]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowWebhookPlain(!showWebhookPlain)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                            >
                              {showWebhookPlain ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Used to verify signatures on incoming webhook events.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* From Name */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            From Name
                          </label>
                          <input
                            type="text"
                            value={resendFromNameInput}
                            onChange={(e) => setResendFromNameInput(e.target.value)}
                            placeholder="Alex Morgan via Zendo"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1f7a4c]"
                          />
                        </div>

                        {/* From Email */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            From Email Address
                          </label>
                          <input
                            type="email"
                            value={resendFromEmailInput}
                            onChange={(e) => setResendFromEmailInput(e.target.value)}
                            placeholder="notifications@yourdomain.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1f7a4c]"
                          />
                        </div>
                      </div>

                      {/* Inbound Webhook URL Display */}
                      <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Inbound Webhook Endpoint URL</span>
                          <button
                            type="button"
                            onClick={() => {
                              const webhookUrl = `${window.location.origin}/api/webhooks/resend`;
                              navigator.clipboard?.writeText(webhookUrl);
                              triggerToast('Webhook URL copied to clipboard');
                            }}
                            className="text-[#1f7a4c] hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </button>
                        </div>
                        <div className="text-xs font-mono text-slate-600 bg-white p-2 rounded-lg border border-slate-200 break-all select-all">
                          {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/resend` : '/api/webhooks/resend'}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Set this as the Webhook URL in your Resend Dashboard with events: <code className="bg-slate-100 px-1 rounded">email.received</code>, <code className="bg-slate-100 px-1 rounded">email.delivered</code>, <code className="bg-slate-100 px-1 rounded">email.bounced</code>.
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={isSavingResend}
                            className="px-5 py-2.5 rounded-xl bg-[#1f7a4c] hover:bg-[#165a37] disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            {isSavingResend ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <span>Save Settings</span>
                            )}
                          </button>
                        </div>

                        {(!useDefaultResendEmail || resendApiKeyMasked) && (
                          <button
                            type="button"
                            onClick={handleDisconnectResend}
                            className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Disconnect Custom Key
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Send Test Email Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-700" />
                      <h3 className="font-display text-base font-bold text-[#0F172A]">
                        Send Test Email
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600">
                      Verify your connection by sending a test confirmation email to any recipient inbox.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="email"
                        value={testEmailInput}
                        onChange={(e) => setTestEmailInput(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full sm:flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1f7a4c]"
                      />
                      <button
                        type="button"
                        onClick={handleSendResendTestEmail}
                        disabled={isSendingTestEmail || !testEmailInput.trim()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        {isSendingTestEmail ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Test Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Daily Quota & Limits Safety Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-slate-700" />
                        <h3 className="font-display text-base font-bold text-[#0F172A]">
                          Daily Email Usage &amp; Plan Cap
                        </h3>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {resendDailyUsage.sentCount + resendDailyUsage.receivedCount} / {resendDailyUsage.dailyLimit} emails today
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          resendDailyUsage.sentCount + resendDailyUsage.receivedCount >= resendDailyUsage.dailyLimit
                            ? 'bg-rose-500'
                            : resendDailyUsage.sentCount + resendDailyUsage.receivedCount >= resendDailyUsage.dailyLimit * 0.8
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((resendDailyUsage.sentCount + resendDailyUsage.receivedCount) /
                                (resendDailyUsage.dailyLimit || 100)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Sent Today</div>
                        <div className="text-base font-bold text-slate-800 mt-0.5">{resendDailyUsage.sentCount}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Received Today</div>
                        <div className="text-base font-bold text-slate-800 mt-0.5">{resendDailyUsage.receivedCount}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Remaining</div>
                        <div className="text-base font-bold text-emerald-700 mt-0.5">{resendDailyUsage.remainingCount}</div>
                      </div>
                    </div>

                    {resendDailyUsage.sentCount + resendDailyUsage.receivedCount >= resendDailyUsage.dailyLimit ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Daily email limit reached for today. Client chat in the portal remains fully active and emails will resume tomorrow.</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Resend’s free plan counts both sent outbound messages and inbound received replies toward the daily and monthly tier limit. Automatic 10-minute message batching prevents accidental spam.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {settingsTab === 'profile' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0F172A]">
                    Your Profile
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileNameInput}
                        onChange={(e) => setProfileNameInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileEmailInput}
                        onChange={(e) => setProfileEmailInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateUserName && profileNameInput.trim()) {
                          onUpdateUserName(profileNameInput.trim());
                        }
                        triggerToast('Profile settings saved');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'workspace' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0F172A]">
                    Workspace & AI Proposal Defaults
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Business or Agency Name
                      </label>
                      <input
                        type="text"
                        value={workspaceCompanyInput}
                        onChange={(e) => setWorkspaceCompanyInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Default Currency
                      </label>
                      <select
                        value={workspaceCurrencyInput}
                        onChange={(e) => setWorkspaceCurrencyInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      >
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="GBP (£)">GBP (£)</option>
                        <option value="CAD ($)">CAD ($)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Default AI Proposal Tone
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        ['Professional', 'Friendly', 'Premium', 'Direct'] as ProposalStyleTone[]
                      ).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setWorkspaceDefaultTone(t)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                            workspaceDefaultTone === t
                              ? 'bg-[#4b735c] text-white border-[#4b735c]'
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        void saveWorkspaceSetupToBackend({
                          companyName: workspaceCompanyInput,
                          industry: onboardingConfig?.industry || 'Design & Creative Agency',
                          servicesOffered: 'Web Design, Brand Strategy, UI/UX',
                          brandColor: onboardingConfig?.brandColor || '#4b735c',
                          typicalClientType:
                            onboardingConfig?.clientType ||
                            'B2B SaaS & Growing Brands',
                          currency: workspaceCurrencyInput,
                          proposalTone: workspaceDefaultTone,
                        });
                        triggerToast('Workspace proposal defaults updated');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Defaults
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'billing' && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-lg font-bold text-[#0F172A]">
                        Current Plan: Zendo AI {activePlan}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Unlimited AI proposal generation, client view tracking, and smart
                        follow-ups
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#4b735c] bg-emerald-50 px-3 py-1 rounded-lg">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {(['Free', 'Pro', 'Team'] as const).map((planName) => (
                      <div
                        key={planName}
                        className={`p-4 rounded-xl border ${
                          activePlan === planName
                            ? 'border-[#4b735c] bg-emerald-50/30'
                            : 'border-slate-200'
                        }`}
                      >
                        <div className="text-sm font-bold text-[#0F172A]">
                          Zendo {planName}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {planName === 'Free'
                            ? 'Up to 3 active proposals'
                            : planName === 'Pro'
                            ? 'Unlimited AI proposals & follow-ups'
                            : 'Multi-seat agency workspace'}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onChangePlan) onChangePlan(planName);
                            triggerToast(`Switched plan to Zendo ${planName}`);
                          }}
                          className="mt-3 w-full py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#0F172A] hover:bg-slate-50 cursor-pointer"
                        >
                          {activePlan === planName ? 'Current Plan' : `Select ${planName}`}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =================================================================
              ROUTE 9: PROJECTS (/projects)
          ================================================================= */}
          {currentRoute === '/projects' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sans text-2xl font-bold text-[#0f172a]">
                    Projects
                  </h1>
                  <p className="text-sm text-[#64756b] mt-0.5">
                    Keep high-priority initiatives, team workstreams, and deliverables on track
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartNewProposal()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3d6b52] hover:bg-[#325843] text-white text-sm font-medium shadow-xs cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Project</span>
                </button>
              </div>

              {/* 3 Core Initiative Cards matching image */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#eaf4ec] text-[#367751] flex items-center justify-center shrink-0">
                        <LayoutGrid className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#0f172a]">Website redesign</h3>
                        <p className="text-xs text-[#64756b] mt-0.5">Design • 8 tasks</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#284e3a] bg-[#ebf2ed] px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-[#e8efea] overflow-hidden">
                      <div className="h-full rounded-full bg-[#58896c] w-[60%]" />
                    </div>
                    <span className="text-xs font-medium text-[#64756b] tabular-nums">60%</span>
                  </div>
                  <div className="flex items-center pt-1">
                    <img src={avatarCreativeDesigner} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                    <img src={avatarLeadEngineer} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2" />
                    <img src={avatarProductStrategist} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2" />
                    <span className="w-7 h-7 rounded-full bg-[#ebf2ed] text-[#284e3a] text-[11px] font-bold flex items-center justify-center border-2 border-white -ml-2">+2</span>
                  </div>
                </div>

                <div className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#f0edfd] text-[#6d61dc] flex items-center justify-center shrink-0">
                        <Rocket className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#0f172a]">Product launch</h3>
                        <p className="text-xs text-[#64756b] mt-0.5">Strategy • 12 tasks</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#6d61dc] bg-[#f0edfd] px-2 py-0.5 rounded-full">
                      Sprint
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-[#e8efea] overflow-hidden">
                      <div className="h-full rounded-full bg-[#58896c] w-[42%]" />
                    </div>
                    <span className="text-xs font-medium text-[#64756b] tabular-nums">42%</span>
                  </div>
                  <div className="flex items-center pt-1">
                    <img src={teamLeadAvatar} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                    <img src={avatarCreativeDesigner} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2" />
                    <img src={avatarLeadEngineer} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2" />
                    <span className="w-7 h-7 rounded-full bg-[#ebf2ed] text-[#284e3a] text-[11px] font-bold flex items-center justify-center border-2 border-white -ml-2">+3</span>
                  </div>
                </div>

                <div className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#eaf4ec] text-[#367751] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#0f172a]">Content system</h3>
                        <p className="text-xs text-[#64756b] mt-0.5">Marketing • 6 tasks</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#284e3a] bg-[#ebf2ed] px-2 py-0.5 rounded-full">
                      Nearly Done
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-[#e8efea] overflow-hidden">
                      <div className="h-full rounded-full bg-[#58896c] w-[80%]" />
                    </div>
                    <span className="text-xs font-medium text-[#64756b] tabular-nums">80%</span>
                  </div>
                  <div className="flex items-center pt-1">
                    <img src={avatarProductStrategist} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                    <img src={teamLeadAvatar} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2" />
                    <img src={avatarCreativeDesigner} alt="Team" className="w-7 h-7 rounded-full border-2 border-white object-cover -ml-2" />
                    <span className="w-7 h-7 rounded-full bg-[#ebf2ed] text-[#284e3a] text-[11px] font-bold flex items-center justify-center border-2 border-white -ml-2">+1</span>
                  </div>
                </div>
              </div>

              {/* Proposals & Client Workstreams Table */}
              <div className="bg-white rounded-[20px] border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] p-6 space-y-4">
                <h3 className="text-base font-bold text-[#0f172a]">
                  Active Client Deliverables
                </h3>
                <div className="divide-y divide-[#f1f5f2]">
                  {proposals.map((p) => (
                    <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0f172a]">{p.title}</h4>
                        <p className="text-xs text-[#64756b] mt-0.5">
                          {p.clientCompany || p.clientName} · {p.timelineSummary} · {p.value}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ebf2ed] text-[#284e3a]">
                          {p.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenProposal(p)}
                          className="text-xs font-semibold text-[#3d6b52] hover:underline"
                        >
                          View Scope →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 10: AUTOMATIONS (/automations)
          ================================================================= */}
          {currentRoute === '/automations' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sans text-2xl font-bold text-[#0f172a]">
                    Automations
                  </h1>
                  <p className="text-sm text-[#64756b] mt-0.5">
                    Automated workflows, client notifications, and AI follow-up triggers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerToast('New automation workflow added')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3d6b52] hover:bg-[#325843] text-white text-sm font-medium shadow-xs cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Automation</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    title: 'Proposal Viewed Instant Alert',
                    desc: 'Notify team in real time when a client opens and reads an interactive proposal link.',
                    badge: 'Real-time',
                    active: true,
                  },
                  {
                    title: '48-Hour Stalled Follow-up Prompt',
                    desc: 'Draft an AI personalization reminder when an active proposal has had no response for 48 hours.',
                    badge: 'AI Powered',
                    active: true,
                  },
                  {
                    title: 'Google Calendar Event Sync',
                    desc: 'Automatically generate Google Meet links and sync client schedule bookings with agency calendar.',
                    badge: 'Calendar',
                    active: true,
                  },
                  {
                    title: 'Proposal Approval Onboarding Kickoff',
                    desc: 'When a proposal is accepted, trigger onboarding form, welcome briefing, and contract tasks.',
                    badge: 'Workflow',
                    active: true,
                  },
                ].map((auto, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ebf2ed] text-[#284e3a]">
                        {auto.badge}
                      </span>
                      <span className="text-xs font-medium text-[#2e7d4f]">● Active</span>
                    </div>
                    <h3 className="text-base font-bold text-[#0f172a]">{auto.title}</h3>
                    <p className="text-xs text-[#64756b] leading-relaxed">{auto.desc}</p>
                    <div className="pt-2 flex items-center justify-between text-xs text-[#8b9b91]">
                      <span>Last executed 2h ago</span>
                      <button
                        type="button"
                        onClick={() => triggerToast(`Configured ${auto.title}`)}
                        className="font-semibold text-[#3d6b52] hover:underline"
                      >
                        Edit Rule →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 11: DEDICATED TASKS WORKSPACE (/tasks)
          ================================================================= */}
          {currentRoute === '/tasks' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sans text-2xl font-bold text-[#0f172a]">
                    My Tasks &amp; Focus Queue
                  </h1>
                  <p className="text-sm text-[#64756b] mt-0.5">
                    Organize, track, and complete daily tasks and client milestones in flow
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('tasks-view-add-input');
                    if (el) el.focus();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3d6b52] hover:bg-[#325843] text-white text-sm font-medium shadow-xs cursor-pointer self-start transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ New Task</span>
                </button>
              </div>

              {/* Tasks Quick Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#e5ebe7] shadow-xs">
                  <span className="text-xs font-medium text-[#64756b]">Total Active</span>
                  <div className="text-2xl font-bold text-[#0f172a] mt-1 tabular-nums">
                    {dashboardTasks.filter((t) => t.status !== 'completed').length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#e5ebe7] shadow-xs">
                  <span className="text-xs font-medium text-[#64756b]">Today&apos;s Focus</span>
                  <div className="text-2xl font-bold text-[#284e3a] mt-1 tabular-nums">
                    {dashboardTasks.filter((t) => t.status === 'today').length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#e5ebe7] shadow-xs">
                  <span className="text-xs font-medium text-[#64756b]">In Progress</span>
                  <div className="text-2xl font-bold text-[#4338ca] mt-1 tabular-nums">
                    {dashboardTasks.filter((t) => t.status === 'in_progress').length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-[#e5ebe7] shadow-xs">
                  <span className="text-xs font-medium text-[#64756b]">Completed</span>
                  <div className="text-2xl font-bold text-[#2e7d4f] mt-1 tabular-nums">
                    {dashboardTasks.filter((t) => t.status === 'completed').length}
                  </div>
                </div>
              </div>

              {/* Tasks Checklist Card */}
              <div className="p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-5">
                {/* Filter and Add Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(
                      [
                        { id: 'today', label: "Today's Focus" },
                        { id: 'in_progress', label: 'In Progress' },
                        { id: 'completed', label: 'Completed' },
                        { id: 'all', label: 'All Tasks' },
                      ] as const
                    ).map((flt) => {
                      const count =
                        flt.id === 'all'
                          ? dashboardTasks.length
                          : dashboardTasks.filter((t) => t.status === flt.id).length;
                      return (
                        <button
                          key={flt.id}
                          type="button"
                          onClick={() => setTaskFilter(flt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            taskFilter === flt.id
                              ? 'bg-[#ebf2ed] text-[#284e3a] font-semibold'
                              : 'text-[#64756b] hover:bg-[#f1f5f2]'
                          }`}
                        >
                          <span>{flt.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              taskFilter === flt.id
                                ? 'bg-[#3d6b52] text-white'
                                : 'bg-[#eef2ef] text-[#64756b]'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Quick Add */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleInlineAddTask();
                  }}
                  className="flex flex-col sm:flex-row gap-2.5 bg-[#f8faf8] p-3 rounded-xl border border-[#e4ede6]"
                >
                  <input
                    id="tasks-view-add-input"
                    type="text"
                    value={inlineNewTaskTitle}
                    onChange={(e) => setInlineNewTaskTitle(e.target.value)}
                    placeholder="Type a new task and press Enter..."
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-white border border-[#d8e4dc] text-sm text-[#0f172a] placeholder-[#8b9b91] focus:outline-none focus:border-[#3d6b52]"
                  />
                  <select
                    value={inlineNewTaskProject}
                    onChange={(e) => setInlineNewTaskProject(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-white border border-[#d8e4dc] text-xs font-medium text-[#0f172a]"
                  >
                    <option value="Website redesign">Website redesign</option>
                    <option value="Product launch">Product launch</option>
                    <option value="Content system">Content system</option>
                    <option value="Brand Identity">Brand Identity</option>
                  </select>
                  <select
                    value={inlineNewTaskPriority}
                    onChange={(e) =>
                      setInlineNewTaskPriority(e.target.value as 'High' | 'Medium' | 'Calm')
                    }
                    className="px-3 py-2 rounded-lg bg-white border border-[#d8e4dc] text-xs font-medium text-[#0f172a]"
                  >
                    <option value="High">Priority: High</option>
                    <option value="Medium">Priority: Medium</option>
                    <option value="Calm">Priority: Calm</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!inlineNewTaskTitle.trim()}
                    className="px-5 py-2.5 rounded-lg bg-[#3d6b52] hover:bg-[#325843] disabled:opacity-40 text-white text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors"
                  >
                    Add Task
                  </button>
                </form>

                {/* Task Items */}
                <div className="divide-y divide-[#f1f5f2]">
                  {dashboardTasks
                    .filter((t) => (taskFilter === 'all' ? true : t.status === taskFilter))
                    .map((task) => {
                      const isDone = task.status === 'completed';
                      const priorityColors: Record<string, string> = {
                        High: 'bg-[#fff1f2] text-[#be123c] border-[#fecdd3]',
                        Medium: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
                        Calm: 'bg-[#e8f4ec] text-[#2b543e] border-[#cfddd0]',
                      };
                      return (
                        <div
                          key={task.id}
                          className="py-3.5 flex items-center justify-between gap-4 group hover:bg-[#fafbfa] px-2 rounded-xl transition-colors"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(task.id)}
                              className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                                isDone
                                  ? 'bg-[#3d6b52] border-[#3d6b52] text-white'
                                  : 'border-[#c7d5cd] bg-white hover:border-[#3d6b52]'
                              }`}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[2.8]" />}
                            </button>
                            <div className="min-w-0">
                              <p
                                onClick={() => handleToggleTaskStatus(task.id)}
                                className={`text-sm font-medium leading-snug cursor-pointer ${
                                  isDone
                                    ? 'line-through text-[#8fa096]'
                                    : 'text-[#0f172a] hover:text-[#3d6b52]'
                                }`}
                              >
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-[#64756b] mt-1 line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#64756b]">
                                <span className="px-2 py-0.5 rounded-md bg-[#edf2ee] font-medium text-[#284e3a]">
                                  {task.project}
                                </span>
                                <span>{task.dueDate}</span>
                                {task.assignee && (
                                  <span className="text-[#8b9b91]">· {task.assignee}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                                priorityColors[task.priority] || priorityColors.Calm
                              }`}
                            >
                              {task.priority}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDashboardTask(task.id)}
                              className="text-[#9cb0a5] hover:text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 12: DEDICATED PAYMENTS & BILLING WORKSPACE (/payments)
          ================================================================= */}
          {currentRoute === '/payments' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sans text-2xl font-bold text-[#0f172a]">
                    Payments &amp; Billing
                  </h1>
                  <p className="text-sm text-[#64756b] mt-0.5">
                    Track client invoices, collected revenue, outstanding balances, and retainers
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewInvoiceModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3d6b52] hover:bg-[#325843] text-white text-sm font-medium shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Create Invoice</span>
                  </button>
                </div>
              </div>

              {/* Financial Snapshot Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <div className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-xs">
                  <span className="text-xs font-medium text-[#64756b]">Total Invoiced</span>
                  <div className="text-2xl sm:text-3xl font-bold text-[#0f172a] mt-1 tabular-nums">
                    ${payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-[#64756b] mt-1">Across {payments.length} client invoices</p>
                </div>
                <div className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-xs">
                  <span className="text-xs font-medium text-[#64756b]">Collected / Paid</span>
                  <div className="text-2xl sm:text-3xl font-bold text-[#2e7d4f] mt-1 tabular-nums">
                    ${payments
                      .filter((p) => p.status === 'Paid')
                      .reduce((s, p) => s + p.amount, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-[#2e7d4f] mt-1">✓ 100% on-time settlement</p>
                </div>
                <div className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-xs">
                  <span className="text-xs font-medium text-[#64756b]">Outstanding Pending</span>
                  <div className="text-2xl sm:text-3xl font-bold text-[#b45309] mt-1 tabular-nums">
                    ${payments
                      .filter((p) => p.status === 'Pending')
                      .reduce((s, p) => s + p.amount, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-[#b45309] mt-1">
                    {payments.filter((p) => p.status === 'Pending').length} pending payment
                  </p>
                </div>
                <div className="p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-xs">
                  <span className="text-xs font-medium text-[#64756b]">Monthly Retainers</span>
                  <div className="text-2xl sm:text-3xl font-bold text-[#4338ca] mt-1 tabular-nums">
                    $4,500/mo
                  </div>
                  <p className="text-xs text-[#4338ca] mt-1">Recurring growth sprints</p>
                </div>
              </div>

              {/* Invoices Directory Table */}
              <div className="p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-[0_2px_12px_rgba(20,35,28,0.03)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(['All', 'Paid', 'Pending', 'Overdue'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPaymentFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          paymentFilter === st
                            ? 'bg-[#ebf2ed] text-[#284e3a] font-semibold'
                            : 'text-[#64756b] hover:bg-[#f1f5f2]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-[#8b9b91]">
                    Connected with Stripe &amp; Bank Transfers
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#f1f5f2] text-[11px] font-semibold uppercase tracking-wider text-[#64756b]">
                        <th className="py-3 px-4">Invoice</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Project</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f2] text-xs sm:text-sm">
                      {payments
                        .filter((p) => (paymentFilter === 'All' ? true : p.status === paymentFilter))
                        .map((inv) => {
                          const isPaid = inv.status === 'Paid';
                          return (
                            <tr key={inv.id} className="hover:bg-[#fafbfa] transition-colors">
                              <td className="py-4 px-4 font-mono font-bold text-[#0f172a]">
                                {inv.invoiceNumber}
                              </td>
                              <td className="py-4 px-4 font-semibold text-[#0f172a]">
                                {inv.clientCompany}
                              </td>
                              <td className="py-4 px-4 text-[#64756b] max-w-xs truncate">
                                {inv.projectTitle}
                              </td>
                              <td className="py-4 px-4 font-mono font-bold text-[#0f172a] tabular-nums">
                                ${inv.amount.toLocaleString()}
                              </td>
                              <td className="py-4 px-4 text-[#64756b] text-xs">
                                {isPaid ? `Paid on ${inv.paidDate}` : inv.dueDate}
                              </td>
                              <td className="py-4 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    isPaid
                                      ? 'bg-[#e8f4ec] text-[#2b543e] border-[#cfddd0]'
                                      : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  {!isPaid && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkPaymentPaid(inv.id)}
                                      className="px-3 py-1.5 rounded-lg bg-[#3d6b52] hover:bg-[#325843] text-white text-xs font-semibold cursor-pointer transition-colors"
                                    >
                                      Mark Paid
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      triggerToast(`Receipt downloaded for ${inv.invoiceNumber}`)
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-[#e5ebe7] bg-white hover:bg-[#f1f5f2] text-xs font-medium text-[#0f172a] cursor-pointer transition-colors"
                                  >
                                    Receipt
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              ROUTE 13: DEDICATED CLIENT MESSAGES WORKSPACE (/messages)
          ================================================================= */}
          {currentRoute === '/messages' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-sans text-2xl font-bold text-[#0f172a]">
                    Client Messages &amp; Q&amp;A
                  </h1>
                  <p className="text-sm text-[#64756b] mt-0.5">
                    Direct communication with clients regarding scopes, proposals, deliverables, and next steps
                  </p>
                </div>
              </div>

              {/* 2-Column Split Inbox */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[520px]">
                {/* Left 4 Cols: Client Conversations Thread List */}
                <div className="lg:col-span-4 p-5 rounded-[20px] bg-white border border-[#e5ebe7] shadow-xs flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#8b9b91] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={messagesSearchQuery}
                        onChange={(e) => setMessagesSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#e5ebe7] text-xs text-[#0f172a] placeholder-[#8b9b91] focus:outline-none focus:border-[#3d6b52]"
                      />
                    </div>

                    <div className="divide-y divide-[#f1f5f2] space-y-1">
                      {clients.map((client) => {
                        const active = selectedMessageClient === client.company;
                        const clientMsgs = clientMessages.filter(
                          (m) => m.clientCompany.toLowerCase() === client.company.toLowerCase()
                        );
                        const lastMsg = clientMsgs[clientMsgs.length - 1];
                        return (
                          <div
                            key={client.id}
                            onClick={() => setSelectedMessageClient(client.company)}
                            className={`p-3 rounded-xl cursor-pointer transition-colors ${
                              active
                                ? 'bg-[#ebf2ed] border border-[#d8e5dc]'
                                : 'hover:bg-[#fafbfa]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h3
                                className={`text-xs sm:text-sm font-bold ${
                                  active ? 'text-[#284e3a]' : 'text-[#0f172a]'
                                }`}
                              >
                                {client.company}
                              </h3>
                              <span className="text-[10px] text-[#8b9b91]">
                                {lastMsg?.timeLabel || 'Recent'}
                              </span>
                            </div>
                            <p className="text-xs text-[#64756b] mt-0.5 truncate">
                              {lastMsg?.messageText || `Active thread with ${client.name}`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#f1f5f2] text-xs text-[#64756b] flex items-center justify-between">
                    <span>{clients.length} Active client accounts</span>
                    <span className="text-emerald-600 font-semibold">● Online</span>
                  </div>
                </div>

                {/* Right 8 Cols: Active Message Conversation Thread */}
                <div className="lg:col-span-8 p-6 rounded-[20px] bg-white border border-[#e5ebe7] shadow-xs flex flex-col justify-between space-y-4">
                  {/* Thread Header */}
                  <div className="pb-3 border-b border-[#f1f5f2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                          {selectedMessageClient}
                        </h2>
                        {(() => {
                          const c = clients.find(
                            (item) => item.company.toLowerCase() === selectedMessageClient.toLowerCase()
                          );
                          if (c?.email) {
                            return (
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {c.email}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p className="text-xs text-[#64756b]">
                        Live proposal scope discussion &amp; deliverables Q&amp;A
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/p/conv_${selectedMessageClient.toLowerCase().replace(/[^a-z0-9]/g, '_')}_token`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-[#d8e5dc] bg-white hover:bg-[#f4f8f5] text-[#284e3a] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Client Portal (/p/...)</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => navigateTo('/meetings')}
                        className="px-3 py-1.5 rounded-lg bg-[#ebf2ed] hover:bg-[#dfece3] text-[#284e3a] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Schedule Call</span>
                      </button>
                    </div>
                  </div>

                  {/* Messages Bubble List */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-2">
                    {clientMessages
                      .filter(
                        (m) =>
                          m.clientCompany.toLowerCase() === selectedMessageClient.toLowerCase()
                      )
                      .map((msg) => {
                        const isAgency = msg.senderRole === 'agency' || msg.senderType === 'agency';
                        const isEmail = msg.channel === 'email';
                        const isBounced = msg.deliveryStatus === 'bounced';
                        const isDelivered = msg.deliveryStatus === 'delivered';

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isAgency ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 text-[11px] text-[#8b9b91] mb-1 px-1">
                              <span className="font-medium text-slate-600">{msg.senderName}</span>
                              <span>·</span>
                              <span>{msg.timeLabel || 'Recent'}</span>
                              {isEmail && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Mail className="w-2.5 h-2.5" />
                                  via email
                                </span>
                              )}
                            </div>
                            <div
                              className={`max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isAgency
                                  ? 'bg-[#3d6b52] text-white rounded-br-xs shadow-2xs'
                                  : 'bg-[#f4f7f5] text-[#0f172a] border border-[#e4eae6] rounded-bl-xs shadow-2xs'
                              }`}
                            >
                              {msg.messageText}
                            </div>

                            {/* Outgoing Delivery Ticks */}
                            {isAgency && (
                              <div className="flex items-center gap-1 text-[10px] mt-1 px-1">
                                {isBounced ? (
                                  <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                    <AlertCircle className="w-3 h-3 text-rose-500" />
                                    Failed to deliver
                                  </span>
                                ) : isDelivered ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                                    Delivered
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-400">
                                    <Check className="w-3 h-3" />
                                    Sent
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Warning banner if client email is missing or bounced */}
                  {(() => {
                    const currentClient = clients.find(
                      (c) => c.company.toLowerCase() === selectedMessageClient.toLowerCase()
                    );
                    const isMissing = !currentClient?.email || !currentClient.email.includes('@');
                    const hasBounced =
                      Boolean((currentClient as any)?.emailBounced) ||
                      (currentClient?.status as string) === 'Email Bounced' ||
                      clientMessages.some(
                        (m) =>
                          m.clientCompany.toLowerCase() === selectedMessageClient.toLowerCase() &&
                          m.deliveryStatus === 'bounced'
                      );

                    if (hasBounced) {
                      return (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>Failed to deliver:</strong> Client email has bounced. Please verify their address in the Clients tab.
                          </span>
                        </div>
                      );
                    }

                    if (isMissing) {
                      return (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Client has no email configured. Messages will only appear in the client portal link and cannot be delivered via email.
                          </span>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  {/* Message Composer Bar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendInboxReply(selectedMessageClient);
                    }}
                    className="pt-3 border-t border-[#f1f5f2] flex gap-2"
                  >
                    <input
                      type="text"
                      value={inboxReplyText}
                      onChange={(e) => setInboxReplyText(e.target.value)}
                      placeholder={`Reply to ${selectedMessageClient}...`}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[#e5ebe7] text-xs sm:text-sm text-[#0f172a] placeholder-[#8b9b91] focus:outline-none focus:border-[#3d6b52]"
                    />
                    <button
                      type="submit"
                      disabled={!inboxReplyText.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[#3d6b52] hover:bg-[#325843] disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              </div>
            </section>
          )}


        </main>
      </div>

      {/* =====================================================================
          MODALS (Add Client, Import Brief, Share Proposal, Send Proposal, Help, Invoice, Time Log)
      ===================================================================== */}

      {/* Create New Invoice Modal */}
      {newInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#0F172A]">
                Create Client Invoice
              </h3>
              <button
                type="button"
                onClick={() => setNewInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNewInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Company *
                </label>
                <select
                  value={newInvoiceClient}
                  onChange={(e) => setNewInvoiceClient(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.company}>
                      {c.company} ({c.name})
                    </option>
                  ))}
                  <option value="New Client">Other Client</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project or Milestone Deliverable *
                </label>
                <input
                  type="text"
                  required
                  value={newInvoiceProject}
                  onChange={(e) => setNewInvoiceProject(e.target.value)}
                  placeholder="e.g. Website Redesign Sprint 2"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ($ USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newInvoiceAmount}
                    onChange={(e) => setNewInvoiceAmount(e.target.value)}
                    placeholder="4800"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoiceDueDate}
                    onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3d6b52] hover:bg-[#325843] text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Create &amp; Send Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* NVIDIA Nemotron AI Proposal & Document Modal */}
      <NemotronProposalModal
        isOpen={nemotronModalOpen}
        onClose={() => setNemotronModalOpen(false)}
        initialTemplateKey={nemotronInitialTemplate}
        workspaceCompanyName={workspaceCompanyInput}
        onApplyProposal={handleApplyNemotronProposal}
      />

      {/* Add New Client Modal */}
      {/* Add New Client Modal (Saves to Supabase) */}
      {addClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F172A]">
                  Add New Client
                </h3>
                <p className="text-xs text-slate-500">
                  Add contact details, organization, and project context
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClientSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Jordan Taylor"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#0c9256] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  placeholder="e.g. Solstice Digital"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#0c9256] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="jordan@solsticedigital.io"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#0c9256] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industry
                </label>
                <select
                  value={newClientIndustry}
                  onChange={(e) => setNewClientIndustry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:border-[#0c9256] focus:outline-hidden"
                >
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <ClientLogoPicker
                logoUrl={newClientLogoUrl}
                companyName={newClientCompany}
                onChange={setNewClientLogoUrl}
                label="Client Logo Option"
                description="Upload image file, paste link, or choose a brand badge"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Notes / Deliverables Context
                </label>
                <textarea
                  rows={2}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="Add any internal notes, project preferences, or billing requirements..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#0c9256] focus:outline-hidden resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="px-5 py-2 rounded-xl bg-[#0c9256] hover:bg-[#087443] text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingClient ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal (Updates Supabase row) */}
      {editClientModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F172A]">
                  Edit Client
                </h3>
                <p className="text-xs text-slate-500">
                  Update client contact information and preferences
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditClientSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#0c9256] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#0c9256] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#0c9256] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industry
                </label>
                <select
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:border-[#0c9256] focus:outline-hidden"
                >
                  {INDUSTRY_OPTIONS.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <ClientLogoPicker
                logoUrl={editLogoUrl}
                companyName={editCompany}
                onChange={setEditLogoUrl}
                label="Client Logo Option"
                description="Upload new image, change URL, or pick a brand badge"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#0c9256] focus:outline-hidden resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingClient}
                  className="px-5 py-2 rounded-xl bg-[#0c9256] hover:bg-[#087443] text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isUpdatingClient ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteClientModalOpen && clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#0F172A]">
                  Delete Client?
                </h3>
                <p className="text-xs text-slate-500">
                  This action will permanently remove this client and their records.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Are you sure you want to delete <strong className="text-slate-900">{clientToDelete.company}</strong> ({clientToDelete.name})?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDeleteClientModalOpen(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={handleConfirmDeleteClient}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeletingClient ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Client Brief Modal */}
      {importBriefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6D28D9]" />
                <h3 className="font-display text-lg font-bold text-[#0F172A]">
                  Import Client Brief or RFP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setImportBriefModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Paste your discovery call notes, client email, or project brief below. Zendo
              AI will extract the client details, scope, timeline, and budget.
            </p>
            <form onSubmit={handleImportBriefSubmit} className="space-y-4">
              <textarea
                rows={5}
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-[#0F172A] leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setImportBriefModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract & Open in Builder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Proposal Modal */}
      {shareModalOpen && activeProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0F172A]">
                Share proposal link
              </h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Share this interactive link with{' '}
              <strong>{activeProposal.clientCompany}</strong>. You’ll receive a real-time
              notification as soon as they open it.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`https://zendo.ai/p/${activeProposal.id}`}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-[#FAF9F6] text-xs font-mono text-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `https://zendo.ai/p/${activeProposal.id}`
                  );
                  setShareModalOpen(false);
                  triggerToast('Proposal share link copied to clipboard');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Proposal to Client Modal */}
      {sendModalOpen && activeProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F172A]">
                  Send Proposal to {activeProposal.clientCompany}
                </h3>
                <p className="text-xs text-slate-500">
                  Value: {activeProposal.value} · Status will update to Sent
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSendProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  required
                  value={sendRecipientEmail}
                  onChange={(e) => setSendRecipientEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Personal Note (Generated by Zendo AI)
                </label>
                <textarea
                  rows={5}
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm leading-relaxed"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSendModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingEmail ? 'Sending...' : 'Send Proposal Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0F172A]">
                Zendo AI Quick Guide
              </h3>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-100">
                <strong className="text-[#0F172A] block mb-0.5">
                  1. Draft 10× Faster with AI
                </strong>
                Click <strong>+ Create Proposal</strong> to enter client details, scope,
                and tone. Zendo AI generates all 8 proposal sections automatically.
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-100">
                <strong className="text-[#0F172A] block mb-0.5">
                  2. Customize & Preview
                </strong>
                Edit any section inline or click <strong>Polish with Zendo AI</strong> to
                refine executive summaries and problem statements.
              </div>
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-100">
                <strong className="text-[#0F172A] block mb-0.5">
                  3. Smart Follow-ups
                </strong>
                Visit <strong>Follow-ups</strong> to send timely, personalized check-ins
                when clients view your pricing or timeline.
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Proposal Template Modal */}
      {addTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#4b735c] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0F172A]">
                    Add Custom Proposal Template
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a reusable layout, services list, and pricing structure
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  placeholder="e.g. Full-Stack Web App & MVP Sprint"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                  >
                    <option value="Web Design">Web Design</option>
                    <option value="Branding">Branding</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Retainer">Retainer</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recommended Tone
                  </label>
                  <select
                    value={newTemplateTone}
                    onChange={(e) => setNewTemplateTone(e.target.value as ProposalStyleTone)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Premium">Premium</option>
                    <option value="Direct">Direct</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Typical Budget Range
                  </label>
                  <input
                    type="text"
                    value={newTemplateValue}
                    onChange={(e) => setNewTemplateValue(e.target.value)}
                    placeholder="e.g. $8,000 – $14,000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] font-mono focus:outline-none focus:border-[#4b735c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Typical Timeline
                  </label>
                  <input
                    type="text"
                    value={newTemplateTimeline}
                    onChange={(e) => setNewTemplateTimeline(e.target.value)}
                    placeholder="e.g. 5 weeks"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Services Included (comma separated)
                </label>
                <input
                  type="text"
                  value={newTemplateServices}
                  onChange={(e) => setNewTemplateServices(e.target.value)}
                  placeholder="e.g. Discovery & Architecture, UI/UX Wireframes, React Build, QA"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Need Prompt / Problem Template
                </label>
                <textarea
                  rows={2}
                  value={newTemplatePrompt}
                  onChange={(e) => setNewTemplatePrompt(e.target.value)}
                  placeholder="Default project prompt or problem statement describing client outcomes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Deliverables or Milestone Terms
                </label>
                <input
                  type="text"
                  value={newTemplateNotes}
                  onChange={(e) => setNewTemplateNotes(e.target.value)}
                  placeholder="e.g. 50% deposit, milestone deliverables, 30 days post-launch QA"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save & Use Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
