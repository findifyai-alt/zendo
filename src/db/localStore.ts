import fs from 'fs';
import path from 'path';
import alasql from 'alasql';

export interface SqlUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  organizationName: string;
  avatarUrl?: string;
  subscriptionTier?: string;
  displayName: string;
  workspaceName: string;
  industry: string;
  servicesOffered: string;
  brandColor: string;
  typicalClientType: string;
  currency: string;
  proposalTone: string;
  createdAt: string;
}

export interface SqlClient {
  id: number;
  clientKey: string;
  userId: number;
  name: string;
  email: string;
  companyName: string;
  phoneNumber?: string;
  notes?: string;
  company?: string;
  industry?: string;
  totalProposals: number;
  pipelineValue: string;
  lastActivity: string;
  status: string;
  logoUrl?: string;
  createdAt: string;
}

export interface SqlProposal {
  id: number;
  proposalKey: string;
  userId: number;
  clientId?: number;
  title: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  aiGeneratedContent?: string;
  expiryDate?: string;
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  industry?: string;
  value: string;
  numericValue: number;
  updatedAtLabel?: string;
  style: string;
  timelineSummary: string;
  servicesJson: string;
  sectionsJson: string;
}

export interface SqlMeeting {
  id: number;
  meetingKey: string;
  userId: number;
  clientId?: number;
  proposalId?: string;
  title: string;
  clientCompany: string;
  clientName: string;
  clientEmail: string;
  type: string;
  date: string;
  time: string;
  durationMinutes: number;
  timezone: string;
  platform: string;
  meetingLink?: string;
  agenda?: string;
  status: string;
  createdAt: string;
}

export interface SqlTask {
  id: number;
  taskKey: string;
  userId: number;
  clientId?: number;
  title: string;
  project: string;
  status: string; // 'today' | 'in_progress' | 'completed'
  priority: string; // 'High' | 'Medium' | 'Calm'
  dueDate: string;
  assignee: string;
  estimatedMinutes: number;
  createdAt: string;
}

export interface SqlPayment {
  id: number;
  paymentKey: string;
  userId: number;
  clientId?: number;
  invoiceNumber: string;
  clientCompany: string;
  projectTitle: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: string; // 'Paid' | 'Pending' | 'Overdue'
  paymentMethod?: string;
  paidDate?: string;
  createdAt: string;
}

export interface SqlIntegration {
  id: number;
  userId: number;
  provider: string; // 'resend'
  encryptedApiKey?: string;
  encryptedWebhookSecret?: string;
  fromEmail?: string;
  fromName?: string;
  useDefaultEmail: boolean;
  status: string; // 'Not connected' | 'Connected' | 'Error'
  updatedAt: string;
  createdAt: string;
}

export interface SqlConversation {
  id: number;
  token: string;
  userId: number;
  clientId?: number;
  clientCompany: string;
  clientName: string;
  clientEmail: string;
  proposalId?: string;
  clientLastActiveAt?: string;
  lastEmailSentAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SqlEmailUsage {
  id: number;
  userId: number;
  dateKey: string; // 'YYYY-MM-DD'
  sentCount: number;
  receivedCount: number;
  dailyLimit: number;
  updatedAt: string;
}

export interface SqlClientMessage {
  id: number;
  messageKey: string;
  userId: number;
  conversationId?: number;
  proposalId: string;
  clientCompany: string;
  senderName: string;
  senderRole: 'client' | 'agency';
  senderType: 'agency' | 'client';
  messageText: string;
  timeLabel: string;
  channel: 'chat' | 'email';
  resendEmailId?: string;
  deliveryStatus: 'sent' | 'delivered' | 'bounced' | 'failed';
  attachmentsJson?: string;
  emailMessageId?: string;
  createdAt: string;
}

export interface DatabaseState {
  users: SqlUser[];
  clients: SqlClient[];
  proposals: SqlProposal[];
  meetings: SqlMeeting[];
  tasks: SqlTask[];
  payments: SqlPayment[];
  followUps: any[];
  clientMessages: SqlClientMessage[];
  clientTasks: any[];
  integrations: SqlIntegration[];
  conversations: SqlConversation[];
  emailUsage: SqlEmailUsage[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'sql_store.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const DEFAULT_USERS: SqlUser[] = [
  {
    id: 1,
    uid: 'default_admin',
    email: 'alex@zendo.ai',
    name: 'Alex Morgan',
    organizationName: 'Zendo Studio',
    displayName: 'Alex Morgan',
    workspaceName: 'Zendo Studio',
    industry: 'Design & Creative Agency',
    servicesOffered: 'Brand Identity, Web Design & Build, Product Strategy',
    brandColor: '#1f7a4c',
    typicalClientType: 'Growth-Stage Startups & B2B Brands',
    currency: 'USD ($)',
    proposalTone: 'Professional',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_CLIENTS: SqlClient[] = [
  {
    id: 1,
    clientKey: 'c-hyperscale',
    userId: 1,
    name: 'Jordan Brooks',
    email: 'jordan@hyperscalelabs.io',
    companyName: 'HyperScale Labs',
    company: 'HyperScale Labs',
    industry: 'AI & Developer Tools',
    totalProposals: 2,
    pipelineValue: '$38,500',
    lastActivity: 'Active proposal in review',
    status: 'Active',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    clientKey: 'c-aetheria',
    userId: 1,
    name: 'Elena Rostova',
    email: 'elena@aetheriawellness.com',
    companyName: 'Aetheria Wellness',
    company: 'Aetheria Wellness',
    industry: 'E-Commerce & DTC',
    totalProposals: 1,
    pipelineValue: '$24,000',
    lastActivity: 'Retainer deposit paid',
    status: 'Won',
    logoUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=120&h=120&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    clientKey: 'c-kinetix',
    userId: 1,
    name: 'Marcus Thorne',
    email: 'm.thorne@kinetixcap.com',
    companyName: 'Kinetix Capital',
    company: 'Kinetix Capital',
    industry: 'Fintech & Web3',
    totalProposals: 1,
    pipelineValue: '$14,500',
    lastActivity: 'Intro scoping meeting',
    status: 'Prospect',
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=120&h=120&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    clientKey: 'c-veritas',
    userId: 1,
    name: 'Sophia Chen',
    email: 'sophia@veritasdynamics.com',
    companyName: 'Veritas Dynamics',
    company: 'Veritas Dynamics',
    industry: 'CleanTech & B2B SaaS',
    totalProposals: 2,
    pipelineValue: '$48,000',
    lastActivity: 'Proposal accepted',
    status: 'Active',
    logoUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=120&h=120&q=80',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PROPOSALS: SqlProposal[] = [
  {
    id: 1,
    proposalKey: 'p-hyperscale-ai',
    userId: 1,
    clientId: 1,
    title: 'HyperScale Brand & Pitch Architecture',
    status: 'Active',
    totalAmount: 18500,
    numericValue: 18500,
    value: '$18,500',
    clientName: 'Jordan Brooks',
    clientCompany: 'HyperScale Labs',
    clientEmail: 'jordan@hyperscalelabs.io',
    industry: 'AI & Developer Tools',
    style: 'Modern',
    timelineSummary: '4 Weeks',
    servicesJson: JSON.stringify(['Brand Identity', 'Product Strategy', 'Interactive Deck']),
    sectionsJson: JSON.stringify({}),
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    proposalKey: 'p-aetheria-dtc',
    userId: 1,
    clientId: 2,
    title: 'Aetheria Global Rebrand & Shopify Plus Architecture',
    status: 'Won',
    totalAmount: 24000,
    numericValue: 24000,
    value: '$24,000',
    clientName: 'Elena Rostova',
    clientCompany: 'Aetheria Wellness',
    clientEmail: 'elena@aetheriawellness.com',
    industry: 'E-Commerce & DTC',
    style: 'Editorial',
    timelineSummary: '6 Weeks',
    servicesJson: JSON.stringify(['Visual Identity', 'Headless Storefront', 'Copywriting']),
    sectionsJson: JSON.stringify({}),
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    proposalKey: 'p-kinetix-fintech',
    userId: 1,
    clientId: 3,
    title: 'Kinetix Institutional Identity & Web Portal',
    status: 'Draft',
    totalAmount: 14500,
    numericValue: 14500,
    value: '$14,500',
    clientName: 'Marcus Thorne',
    clientCompany: 'Kinetix Capital',
    clientEmail: 'm.thorne@kinetixcap.com',
    industry: 'Fintech & Web3',
    style: 'Executive',
    timelineSummary: '3-4 Weeks',
    servicesJson: JSON.stringify(['Design System', 'Portal UI/UX']),
    sectionsJson: JSON.stringify({}),
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    proposalKey: 'p-veritas-cleantech',
    userId: 1,
    clientId: 4,
    title: 'Veritas Carbon Intelligence Dashboard Design',
    status: 'In Review',
    totalAmount: 32000,
    numericValue: 32000,
    value: '$32,000',
    clientName: 'Sophia Chen',
    clientCompany: 'Veritas Dynamics',
    clientEmail: 'sophia@veritasdynamics.com',
    industry: 'CleanTech & B2B SaaS',
    style: 'Minimalist',
    timelineSummary: '8 Weeks',
    servicesJson: JSON.stringify(['Enterprise Design System', 'Data Visualization', 'User Research']),
    sectionsJson: JSON.stringify({}),
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_MEETINGS: SqlMeeting[] = [
  {
    id: 1,
    meetingKey: 'm-hyperscale-kickoff',
    userId: 1,
    clientId: 1,
    proposalId: 'p-hyperscale-ai',
    title: 'Brand Identity Sprint Kickoff',
    clientCompany: 'HyperScale Labs',
    clientName: 'Jordan Brooks',
    clientEmail: 'jordan@hyperscalelabs.io',
    type: 'Sprint Kickoff',
    date: 'Tomorrow',
    time: '10:30 AM',
    durationMinutes: 45,
    timezone: 'PST (UTC-7)',
    platform: 'Google Meet',
    meetingLink: 'https://meet.google.com/zen-kick-off',
    agenda: 'Align on design tokens, moodboard review, and sprint deliverables.',
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    meetingKey: 'm-aetheria-handoff',
    userId: 1,
    clientId: 2,
    proposalId: 'p-aetheria-dtc',
    title: 'E-commerce Assets & Storefront Handoff',
    clientCompany: 'Aetheria Wellness',
    clientName: 'Elena Rostova',
    clientEmail: 'elena@aetheriawellness.com',
    type: 'Deliverable Review',
    date: 'Friday',
    time: '02:00 PM',
    durationMinutes: 60,
    timezone: 'EST (UTC-4)',
    platform: 'Google Meet',
    meetingLink: 'https://meet.google.com/aeth-rev-2026',
    agenda: 'Final inspection of Shopify theme modules and brand guidelines.',
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    meetingKey: 'm-veritas-scoping',
    userId: 1,
    clientId: 4,
    proposalId: 'p-veritas-cleantech',
    title: 'Carbon Portal Architecture & Analytics Walkthrough',
    clientCompany: 'Veritas Dynamics',
    clientName: 'Sophia Chen',
    clientEmail: 'sophia@veritasdynamics.com',
    type: 'Discovery Call',
    date: 'Next Monday',
    time: '11:00 AM',
    durationMinutes: 45,
    timezone: 'PST (UTC-7)',
    platform: 'Zoom',
    meetingLink: 'https://zoom.us/j/9128392819',
    agenda: 'Deep dive into carbon offsets telemetry and enterprise user personas.',
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_TASKS: SqlTask[] = [
  {
    id: 1,
    taskKey: 't-hyperscale-tokens',
    userId: 1,
    clientId: 1,
    title: 'Finalize HyperScale color hierarchy & typography tokens',
    project: 'HyperScale Identity',
    status: 'today',
    priority: 'High',
    dueDate: 'Today · 5:00 PM',
    assignee: 'Alex Morgan',
    estimatedMinutes: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    taskKey: 't-aetheria-checkout',
    userId: 1,
    clientId: 2,
    title: 'Review Shopify checkout customization with Elena',
    project: 'Aetheria DTC',
    status: 'in_progress',
    priority: 'Medium',
    dueDate: 'Tomorrow · 2:00 PM',
    assignee: 'Alex Morgan',
    estimatedMinutes: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    taskKey: 't-veritas-sow',
    userId: 1,
    clientId: 4,
    title: 'Draft statement of work for Phase 2 data pipeline integration',
    project: 'Veritas Dashboard',
    status: 'today',
    priority: 'High',
    dueDate: 'Thursday · Priority',
    assignee: 'Alex Morgan',
    estimatedMinutes: 60,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    taskKey: 't-kinetix-wireframes',
    userId: 1,
    clientId: 3,
    title: 'Generate responsive wireframes for investor portal',
    project: 'Kinetix Capital',
    status: 'completed',
    priority: 'Calm',
    dueDate: 'Completed · Yesterday',
    assignee: 'Alex Morgan',
    estimatedMinutes: 90,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PAYMENTS: SqlPayment[] = [
  {
    id: 1,
    paymentKey: 'pay-001',
    userId: 1,
    clientId: 1,
    invoiceNumber: 'INV-2026-081',
    clientCompany: 'HyperScale Labs',
    projectTitle: 'Brand Architecture Milestone 1',
    amount: 9250,
    currency: '$',
    issueDate: 'Oct 12, 2026',
    dueDate: 'Oct 26, 2026',
    status: 'Paid',
    paymentMethod: 'ACH Transfer',
    paidDate: 'Oct 15, 2026',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    paymentKey: 'pay-002',
    userId: 1,
    clientId: 2,
    invoiceNumber: 'INV-2026-082',
    clientCompany: 'Aetheria Wellness',
    projectTitle: 'Shopify Storefront Deposit',
    amount: 12000,
    currency: '$',
    issueDate: 'Oct 18, 2026',
    dueDate: 'Nov 01, 2026',
    status: 'Paid',
    paymentMethod: 'Stripe Card',
    paidDate: 'Oct 19, 2026',
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    paymentKey: 'pay-003',
    userId: 1,
    clientId: 4,
    invoiceNumber: 'INV-2026-083',
    clientCompany: 'Veritas Dynamics',
    projectTitle: 'Carbon Dashboard Design Phase 1',
    amount: 16000,
    currency: '$',
    issueDate: 'Oct 22, 2026',
    dueDate: 'Nov 05, 2026',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    paymentKey: 'pay-004',
    userId: 1,
    clientId: 3,
    invoiceNumber: 'INV-2026-084',
    clientCompany: 'Kinetix Capital',
    projectTitle: 'Discovery & Feasibility Audit',
    amount: 4500,
    currency: '$',
    issueDate: 'Oct 05, 2026',
    dueDate: 'Oct 19, 2026',
    status: 'Overdue',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_CONVERSATIONS: SqlConversation[] = [
  {
    id: 1,
    token: 'conv_hyperscale_live_token',
    userId: 1,
    clientId: 1,
    clientCompany: 'HyperScale Labs',
    clientName: 'Jordan Brooks',
    clientEmail: 'jordan@hyperscalelabs.io',
    proposalId: 'p-hyperscale-ai',
    clientLastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    lastEmailSentAt: undefined,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    token: 'conv_aetheria_live_token',
    userId: 1,
    clientId: 2,
    clientCompany: 'Aetheria Wellness',
    clientName: 'Elena Rostova',
    clientEmail: 'elena@aetheriawellness.com',
    proposalId: 'p-aetheria-dtc',
    clientLastActiveAt: new Date(Date.now() - 7200000).toISOString(),
    lastEmailSentAt: undefined,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    token: 'conv_kinetix_live_token',
    userId: 1,
    clientId: 3,
    clientCompany: 'Kinetix Capital',
    clientName: 'Marcus Thorne',
    clientEmail: 'm.thorne@kinetixcap.com',
    proposalId: 'p-kinetix-fintech',
    clientLastActiveAt: new Date(Date.now() - 86400000).toISOString(),
    lastEmailSentAt: undefined,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    token: 'conv_veritas_live_token',
    userId: 1,
    clientId: 4,
    clientCompany: 'Veritas Dynamics',
    clientName: 'Sophia Chen',
    clientEmail: 'sophia@veritasdynamics.com',
    proposalId: 'p-veritas-cleantech',
    clientLastActiveAt: new Date(Date.now() - 14400000).toISOString(),
    lastEmailSentAt: undefined,
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_CLIENT_MESSAGES: SqlClientMessage[] = [
  {
    id: 1,
    messageKey: 'msg-1',
    userId: 1,
    conversationId: 2,
    proposalId: 'p-aetheria-dtc',
    clientCompany: 'Aetheria Wellness',
    senderName: 'Elena Rostova',
    senderRole: 'client',
    senderType: 'client',
    messageText: 'Thanks for sending this over! Can we schedule a 20-minute call on Thursday at 2:00 PM EST with our VP of Growth before we sign?',
    timeLabel: 'Yesterday · 4:15 PM',
    channel: 'email',
    resendEmailId: 're_sim_inbound_001',
    deliveryStatus: 'delivered',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 2,
    messageKey: 'msg-2',
    userId: 1,
    conversationId: 2,
    proposalId: 'p-aetheria-dtc',
    clientCompany: 'Aetheria Wellness',
    senderName: 'Alex Morgan',
    senderRole: 'agency',
    senderType: 'agency',
    messageText: 'Absolutely Elena! I will send over a calendar invite for Thursday at 2 PM EST to walk through the CRO experiment roadmap.',
    timeLabel: 'Yesterday · 4:45 PM',
    channel: 'email',
    resendEmailId: 're_sim_outbound_001',
    deliveryStatus: 'delivered',
    createdAt: new Date(Date.now() - 85000000).toISOString(),
  },
  {
    id: 3,
    messageKey: 'msg-3',
    userId: 1,
    conversationId: 1,
    proposalId: 'p-hyperscale-ai',
    clientCompany: 'HyperScale Labs',
    senderName: 'Jordan Brooks',
    senderRole: 'client',
    senderType: 'client',
    messageText: 'We reviewed the pitch deck architecture & tokens with the team. Looks phenomenal!',
    timeLabel: 'Today · 10:30 AM',
    channel: 'chat',
    deliveryStatus: 'delivered',
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
];

function loadState(): DatabaseState {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : DEFAULT_USERS,
        clients: Array.isArray(parsed.clients) && parsed.clients.length > 0 ? parsed.clients : DEFAULT_CLIENTS,
        proposals: Array.isArray(parsed.proposals) && parsed.proposals.length > 0 ? parsed.proposals : DEFAULT_PROPOSALS,
        meetings: Array.isArray(parsed.meetings) && parsed.meetings.length > 0 ? parsed.meetings : DEFAULT_MEETINGS,
        tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : DEFAULT_TASKS,
        payments: Array.isArray(parsed.payments) && parsed.payments.length > 0 ? parsed.payments : DEFAULT_PAYMENTS,
        followUps: parsed.followUps || [],
        clientMessages: Array.isArray(parsed.clientMessages) && parsed.clientMessages.length > 0 ? parsed.clientMessages : DEFAULT_CLIENTMESSAGES_FALLBACK(),
        clientTasks: parsed.clientTasks || [],
        integrations: parsed.integrations || [],
        conversations: Array.isArray(parsed.conversations) && parsed.conversations.length > 0 ? parsed.conversations : DEFAULT_CONVERSATIONS,
        emailUsage: parsed.emailUsage || [],
      };
    } catch {
      // ignore read error
    }
  }
  return {
    users: DEFAULT_USERS,
    clients: DEFAULT_CLIENTS,
    proposals: DEFAULT_PROPOSALS,
    meetings: DEFAULT_MEETINGS,
    tasks: DEFAULT_TASKS,
    payments: DEFAULT_PAYMENTS,
    followUps: [],
    clientMessages: DEFAULT_CLIENT_MESSAGES,
    clientTasks: [],
    integrations: [],
    conversations: DEFAULT_CONVERSATIONS,
    emailUsage: [],
  };
}

function DEFAULT_CLIENTMESSAGES_FALLBACK(): SqlClientMessage[] {
  return DEFAULT_CLIENT_MESSAGES;
}

let inMemoryState: DatabaseState = loadState();

export function saveState(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database state:', err);
  }
}

/**
 * Synchronize in-memory collections into AlaSQL tables
 */
function syncAlasqlTables() {
  try {
    alasql('CREATE TABLE IF NOT EXISTS users');
    alasql('CREATE TABLE IF NOT EXISTS clients');
    alasql('CREATE TABLE IF NOT EXISTS proposals');
    alasql('CREATE TABLE IF NOT EXISTS meetings');
    alasql('CREATE TABLE IF NOT EXISTS tasks');
    alasql('CREATE TABLE IF NOT EXISTS payments');
    alasql('CREATE TABLE IF NOT EXISTS follow_ups');
    alasql('CREATE TABLE IF NOT EXISTS client_messages');
    alasql('CREATE TABLE IF NOT EXISTS client_tasks');
    alasql('CREATE TABLE IF NOT EXISTS integrations');
    alasql('CREATE TABLE IF NOT EXISTS conversations');
    alasql('CREATE TABLE IF NOT EXISTS email_usage');

    (alasql as any).tables.users.data = inMemoryState.users;
    (alasql as any).tables.clients.data = inMemoryState.clients;
    (alasql as any).tables.proposals.data = inMemoryState.proposals;
    (alasql as any).tables.meetings.data = inMemoryState.meetings;
    (alasql as any).tables.tasks.data = inMemoryState.tasks;
    (alasql as any).tables.payments.data = inMemoryState.payments;
    (alasql as any).tables.follow_ups.data = inMemoryState.followUps;
    (alasql as any).tables.client_messages.data = inMemoryState.clientMessages;
    (alasql as any).tables.client_tasks.data = inMemoryState.clientTasks;
    (alasql as any).tables.integrations.data = inMemoryState.integrations;
    (alasql as any).tables.conversations.data = inMemoryState.conversations;
    (alasql as any).tables.email_usage.data = inMemoryState.emailUsage;
  } catch (err) {
    console.warn('Alasql table sync note:', err);
  }
}

// Initial sync
syncAlasqlTables();

export interface SqlQueryResult {
  success: boolean;
  sql: string;
  rows: any[];
  rowCount: number;
  columns: string[];
  executionTimeMs: number;
  isMutation: boolean;
  error?: string;
}

/**
 * Execute arbitrary standard SQL against the relational store
 */
export function executeRawSql(sql: string, params: any[] = []): SqlQueryResult {
  syncAlasqlTables();
  const startTime = Date.now();
  const cleanSql = sql.trim().replace(/;+\s*$/, '');

  try {
    const rawResult = (alasql as any)(cleanSql, params);
    const executionTimeMs = Math.max(1, Date.now() - startTime);

    let rows: any[] = [];
    if (Array.isArray(rawResult)) {
      if (rawResult.length > 0 && Array.isArray(rawResult[0])) {
        rows = rawResult[rawResult.length - 1];
      } else {
        rows = rawResult;
      }
    } else if (rawResult !== null && typeof rawResult === 'object') {
      rows = [rawResult];
    } else if (typeof rawResult === 'number') {
      rows = [{ result: rawResult, affectedRows: rawResult }];
    }

    const columns: string[] = [];
    if (rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
      Object.keys(rows[0]).forEach((k) => {
        if (!columns.includes(k)) columns.push(k);
      });
    }

    const isMutation = /^(insert|update|delete|drop|alter|create|replace)\b/i.test(cleanSql);
    if (isMutation) {
      saveState();
    }

    return {
      success: true,
      sql: cleanSql,
      rows,
      rowCount: rows.length,
      columns,
      executionTimeMs,
      isMutation,
    };
  } catch (err: unknown) {
    const executionTimeMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      sql: cleanSql,
      rows: [],
      rowCount: 0,
      columns: [],
      executionTimeMs,
      isMutation: false,
      error: msg,
    };
  }
}

export const localStore = {
  getState(): DatabaseState {
    return inMemoryState;
  },

  getUserByUid(uid: string): SqlUser | undefined {
    return inMemoryState.users.find((u) => u.uid === uid);
  },

  getUserByEmail(email: string): SqlUser | undefined {
    return inMemoryState.users.find((u) => u.email === email);
  },

  upsertUser(user: Partial<SqlUser> & { uid: string; email: string }): SqlUser {
    const existingIndex = inMemoryState.users.findIndex((u) => u.uid === user.uid);
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const existing = inMemoryState.users[existingIndex];
      const updated: SqlUser = {
        ...existing,
        ...user,
        name: user.name || user.displayName || existing.name || 'Alex Morgan',
        organizationName:
          user.organizationName ||
          user.workspaceName ||
          existing.organizationName ||
          'Zendo Studio',
        displayName:
          user.displayName || user.name || existing.displayName || 'Alex Morgan',
        workspaceName:
          user.workspaceName ||
          user.organizationName ||
          existing.workspaceName ||
          'Zendo Studio',
      };
      inMemoryState.users[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId =
        inMemoryState.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
      const newUser: SqlUser = {
        id: nextId,
        uid: user.uid,
        email: user.email,
        name: user.name || user.displayName || 'Alex Morgan',
        organizationName:
          user.organizationName || user.workspaceName || 'Zendo Studio',
        avatarUrl: user.avatarUrl || '',
        subscriptionTier: user.subscriptionTier || 'Pro',
        displayName: user.displayName || user.name || 'Alex Morgan',
        workspaceName:
          user.workspaceName || user.organizationName || 'Zendo Studio',
        industry: user.industry || 'Design & Creative Agency',
        servicesOffered:
          user.servicesOffered || 'Web Design, Brand Strategy, UI/UX',
        brandColor: user.brandColor || '#1f7a4c',
        typicalClientType:
          user.typicalClientType || 'B2B SaaS & Growing Brands',
        currency: user.currency || 'USD ($)',
        proposalTone: user.proposalTone || 'Professional',
        createdAt: user.createdAt || now,
      };
      inMemoryState.users.push(newUser);
      saveState();
      syncAlasqlTables();
      return newUser;
    }
  },

  // CLIENTS
  getClients(userId?: number): SqlClient[] {
    if (userId !== undefined) {
      return inMemoryState.clients.filter((c) => c.userId === userId);
    }
    return inMemoryState.clients;
  },

  upsertClient(client: Partial<SqlClient> & { clientKey: string; userId: number }): SqlClient {
    const existingIndex = inMemoryState.clients.findIndex(
      (c) => c.clientKey === client.clientKey
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: SqlClient = {
        ...inMemoryState.clients[existingIndex],
        ...client,
        companyName:
          client.companyName ||
          client.company ||
          inMemoryState.clients[existingIndex].companyName,
        logoUrl:
          client.logoUrl !== undefined
            ? client.logoUrl
            : inMemoryState.clients[existingIndex].logoUrl,
      };
      inMemoryState.clients[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId =
        inMemoryState.clients.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      const newClient: SqlClient = {
        id: nextId,
        clientKey: client.clientKey,
        userId: client.userId,
        name: client.name || 'New Client',
        email: client.email || '',
        companyName: client.companyName || client.company || 'Client Corp',
        phoneNumber: client.phoneNumber || '',
        notes: client.notes || '',
        company: client.company || client.companyName || 'Client Corp',
        industry: client.industry || 'Technology',
        totalProposals: client.totalProposals || 1,
        pipelineValue: client.pipelineValue || '$15,000',
        lastActivity: client.lastActivity || 'Today',
        status: client.status || 'Active',
        logoUrl: client.logoUrl || '',
        createdAt: client.createdAt || now,
      };
      inMemoryState.clients.push(newClient);
      saveState();
      syncAlasqlTables();
      return newClient;
    }
  },

  deleteClient(clientKey: string): boolean {
    const prev = inMemoryState.clients.length;
    inMemoryState.clients = inMemoryState.clients.filter((c) => c.clientKey !== clientKey);
    saveState();
    syncAlasqlTables();
    return inMemoryState.clients.length < prev;
  },

  // PROPOSALS
  getProposals(userId?: number): SqlProposal[] {
    if (userId !== undefined) {
      return inMemoryState.proposals.filter((p) => p.userId === userId);
    }
    return inMemoryState.proposals;
  },

  upsertProposal(proposal: Partial<SqlProposal> & { proposalKey: string; userId: number }): SqlProposal {
    const existingIndex = inMemoryState.proposals.findIndex(
      (p) => p.proposalKey === proposal.proposalKey
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: SqlProposal = {
        ...inMemoryState.proposals[existingIndex],
        ...proposal,
      };
      inMemoryState.proposals[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId =
        inMemoryState.proposals.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      const newProposal: SqlProposal = {
        id: nextId,
        proposalKey: proposal.proposalKey,
        userId: proposal.userId,
        clientId: proposal.clientId,
        title: proposal.title || 'Untitled Proposal',
        status: proposal.status || 'Draft',
        totalAmount:
          typeof proposal.totalAmount === 'number'
            ? proposal.totalAmount
            : proposal.numericValue || 0,
        createdAt: proposal.createdAt || now,
        aiGeneratedContent: proposal.aiGeneratedContent || '',
        expiryDate: proposal.expiryDate,
        clientName: proposal.clientName || '',
        clientCompany: proposal.clientCompany || '',
        clientEmail: proposal.clientEmail || '',
        industry: proposal.industry || 'Technology',
        value: proposal.value || '$0',
        numericValue: proposal.numericValue || proposal.totalAmount || 0,
        updatedAtLabel: proposal.updatedAtLabel || 'Just now',
        style: proposal.style || 'Professional',
        timelineSummary: proposal.timelineSummary || '4-6 Weeks',
        servicesJson: proposal.servicesJson || '[]',
        sectionsJson: proposal.sectionsJson || '{}',
      };
      inMemoryState.proposals.push(newProposal);
      saveState();
      syncAlasqlTables();
      return newProposal;
    }
  },

  deleteProposal(proposalKey: string, userId?: number): boolean {
    const prevLen = inMemoryState.proposals.length;
    inMemoryState.proposals = inMemoryState.proposals.filter(
      (p) => !(p.proposalKey === proposalKey && (userId === undefined || p.userId === userId))
    );
    saveState();
    syncAlasqlTables();
    return inMemoryState.proposals.length < prevLen;
  },

  // MEETINGS
  getMeetings(userId?: number): SqlMeeting[] {
    if (userId !== undefined) {
      return inMemoryState.meetings.filter((m) => m.userId === userId);
    }
    return inMemoryState.meetings;
  },

  upsertMeeting(meeting: Partial<SqlMeeting> & { meetingKey: string; userId: number }): SqlMeeting {
    const existingIndex = inMemoryState.meetings.findIndex(
      (m) => m.meetingKey === meeting.meetingKey
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: SqlMeeting = {
        ...inMemoryState.meetings[existingIndex],
        ...meeting,
      };
      inMemoryState.meetings[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId = inMemoryState.meetings.reduce((max, m) => Math.max(max, m.id), 0) + 1;
      const newMeeting: SqlMeeting = {
        id: nextId,
        meetingKey: meeting.meetingKey,
        userId: meeting.userId,
        clientId: meeting.clientId,
        proposalId: meeting.proposalId,
        title: meeting.title || 'Client Sync',
        clientCompany: meeting.clientCompany || 'Client Corp',
        clientName: meeting.clientName || 'Client Lead',
        clientEmail: meeting.clientEmail || '',
        type: meeting.type || 'Review',
        date: meeting.date || 'Upcoming',
        time: meeting.time || '10:00 AM',
        durationMinutes: meeting.durationMinutes || 45,
        timezone: meeting.timezone || 'PST (UTC-7)',
        platform: meeting.platform || 'Google Meet',
        meetingLink: meeting.meetingLink,
        agenda: meeting.agenda,
        status: meeting.status || 'Scheduled',
        createdAt: meeting.createdAt || now,
      };
      inMemoryState.meetings.push(newMeeting);
      saveState();
      syncAlasqlTables();
      return newMeeting;
    }
  },

  deleteMeeting(meetingKey: string): boolean {
    const prev = inMemoryState.meetings.length;
    inMemoryState.meetings = inMemoryState.meetings.filter((m) => m.meetingKey !== meetingKey);
    saveState();
    syncAlasqlTables();
    return inMemoryState.meetings.length < prev;
  },

  // TASKS
  getTasks(userId?: number): SqlTask[] {
    if (userId !== undefined) {
      return inMemoryState.tasks.filter((t) => t.userId === userId);
    }
    return inMemoryState.tasks;
  },

  upsertTask(task: Partial<SqlTask> & { taskKey: string; userId: number }): SqlTask {
    const existingIndex = inMemoryState.tasks.findIndex((t) => t.taskKey === task.taskKey);
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: SqlTask = {
        ...inMemoryState.tasks[existingIndex],
        ...task,
      };
      inMemoryState.tasks[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId = inMemoryState.tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
      const newTask: SqlTask = {
        id: nextId,
        taskKey: task.taskKey,
        userId: task.userId,
        clientId: task.clientId,
        title: task.title || 'Untitled Task',
        project: task.project || 'General',
        status: task.status || 'today',
        priority: task.priority || 'Medium',
        dueDate: task.dueDate || 'Today',
        assignee: task.assignee || 'Alex Morgan',
        estimatedMinutes: task.estimatedMinutes || 30,
        createdAt: task.createdAt || now,
      };
      inMemoryState.tasks.push(newTask);
      saveState();
      syncAlasqlTables();
      return newTask;
    }
  },

  deleteTask(taskKey: string): boolean {
    const prev = inMemoryState.tasks.length;
    inMemoryState.tasks = inMemoryState.tasks.filter((t) => t.taskKey !== taskKey);
    saveState();
    syncAlasqlTables();
    return inMemoryState.tasks.length < prev;
  },

  // PAYMENTS
  getPayments(userId?: number): SqlPayment[] {
    if (userId !== undefined) {
      return inMemoryState.payments.filter((p) => p.userId === userId);
    }
    return inMemoryState.payments;
  },

  upsertPayment(payment: Partial<SqlPayment> & { paymentKey: string; userId: number }): SqlPayment {
    const existingIndex = inMemoryState.payments.findIndex(
      (p) => p.paymentKey === payment.paymentKey
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: SqlPayment = {
        ...inMemoryState.payments[existingIndex],
        ...payment,
      };
      inMemoryState.payments[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId = inMemoryState.payments.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      const newPayment: SqlPayment = {
        id: nextId,
        paymentKey: payment.paymentKey,
        userId: payment.userId,
        clientId: payment.clientId,
        invoiceNumber: payment.invoiceNumber || `INV-${Date.now()}`,
        clientCompany: payment.clientCompany || 'Client Corp',
        projectTitle: payment.projectTitle || 'Milestone Retainer',
        amount: payment.amount || 0,
        currency: payment.currency || '$',
        issueDate: payment.issueDate || 'Today',
        dueDate: payment.dueDate || 'In 14 Days',
        status: payment.status || 'Pending',
        paymentMethod: payment.paymentMethod,
        paidDate: payment.paidDate,
        createdAt: payment.createdAt || now,
      };
      inMemoryState.payments.push(newPayment);
      saveState();
      syncAlasqlTables();
      return newPayment;
    }
  },

  deletePayment(paymentKey: string): boolean {
    const prev = inMemoryState.payments.length;
    inMemoryState.payments = inMemoryState.payments.filter((p) => p.paymentKey !== paymentKey);
    saveState();
    syncAlasqlTables();
    return inMemoryState.payments.length < prev;
  },

  // INTEGRATIONS (Resend & Email)
  getIntegration(userId: number, provider = 'resend'): SqlIntegration | undefined {
    return inMemoryState.integrations.find(
      (i) => i.userId === userId && i.provider === provider
    );
  },

  upsertIntegration(
    integration: Partial<SqlIntegration> & { userId: number; provider: string }
  ): SqlIntegration {
    const existingIndex = inMemoryState.integrations.findIndex(
      (i) => i.userId === integration.userId && i.provider === integration.provider
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: SqlIntegration = {
        ...inMemoryState.integrations[existingIndex],
        ...integration,
        updatedAt: now,
      };
      inMemoryState.integrations[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId =
        inMemoryState.integrations.reduce((max, i) => Math.max(max, i.id), 0) + 1;
      const newIntegration: SqlIntegration = {
        id: nextId,
        userId: integration.userId,
        provider: integration.provider || 'resend',
        encryptedApiKey: integration.encryptedApiKey,
        encryptedWebhookSecret: integration.encryptedWebhookSecret,
        fromEmail: integration.fromEmail,
        fromName: integration.fromName,
        useDefaultEmail:
          integration.useDefaultEmail !== undefined ? integration.useDefaultEmail : true,
        status: integration.status || 'Connected',
        updatedAt: now,
        createdAt: now,
      };
      inMemoryState.integrations.push(newIntegration);
      saveState();
      syncAlasqlTables();
      return newIntegration;
    }
  },

  deleteIntegration(userId: number, provider = 'resend'): boolean {
    const prev = inMemoryState.integrations.length;
    inMemoryState.integrations = inMemoryState.integrations.filter(
      (i) => !(i.userId === userId && i.provider === provider)
    );
    saveState();
    syncAlasqlTables();
    return inMemoryState.integrations.length < prev;
  },

  // CONVERSATIONS
  getConversations(userId?: number): SqlConversation[] {
    if (userId !== undefined) {
      return inMemoryState.conversations.filter((c) => c.userId === userId);
    }
    return inMemoryState.conversations;
  },

  getConversationByToken(token: string): SqlConversation | undefined {
    return inMemoryState.conversations.find((c) => c.token === token);
  },

  getConversationByClient(userId: number, clientCompany: string): SqlConversation | undefined {
    return inMemoryState.conversations.find(
      (c) =>
        c.userId === userId &&
        c.clientCompany.toLowerCase() === clientCompany.toLowerCase()
    );
  },

  upsertConversation(
    conv: Partial<SqlConversation> & {
      token: string;
      userId: number;
      clientCompany: string;
    }
  ): SqlConversation {
    const existingIndex = inMemoryState.conversations.findIndex(
      (c) => c.token === conv.token || (c.userId === conv.userId && c.clientCompany.toLowerCase() === conv.clientCompany.toLowerCase())
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: SqlConversation = {
        ...inMemoryState.conversations[existingIndex],
        ...conv,
        updatedAt: now,
      };
      inMemoryState.conversations[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId =
        inMemoryState.conversations.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      const newConv: SqlConversation = {
        id: nextId,
        token: conv.token,
        userId: conv.userId,
        clientId: conv.clientId,
        clientCompany: conv.clientCompany,
        clientName: conv.clientName || 'Client Contact',
        clientEmail: conv.clientEmail || '',
        proposalId: conv.proposalId,
        clientLastActiveAt: conv.clientLastActiveAt,
        lastEmailSentAt: conv.lastEmailSentAt,
        unreadCount: conv.unreadCount || 0,
        createdAt: now,
        updatedAt: now,
      };
      inMemoryState.conversations.push(newConv);
      saveState();
      syncAlasqlTables();
      return newConv;
    }
  },

  updateConversationPresence(token: string): void {
    const conv = inMemoryState.conversations.find((c) => c.token === token);
    if (conv) {
      conv.clientLastActiveAt = new Date().toISOString();
      conv.updatedAt = new Date().toISOString();
      saveState();
    }
  },

  updateConversationEmailSent(token: string): void {
    const conv = inMemoryState.conversations.find((c) => c.token === token);
    if (conv) {
      conv.lastEmailSentAt = new Date().toISOString();
      conv.updatedAt = new Date().toISOString();
      saveState();
    }
  },

  // CLIENT MESSAGES
  getClientMessages(
    userId?: number,
    conversationId?: number,
    clientCompany?: string
  ): SqlClientMessage[] {
    return inMemoryState.clientMessages.filter((m) => {
      if (userId !== undefined && m.userId !== userId) return false;
      if (conversationId !== undefined && m.conversationId !== conversationId) return false;
      if (
        clientCompany !== undefined &&
        m.clientCompany.toLowerCase() !== clientCompany.toLowerCase()
      )
        return false;
      return true;
    });
  },

  upsertClientMessage(
    msg: Partial<SqlClientMessage> & {
      messageKey: string;
      userId: number;
      messageText: string;
    }
  ): SqlClientMessage {
    const existingIndex = inMemoryState.clientMessages.findIndex(
      (m) => m.messageKey === msg.messageKey || (msg.emailMessageId && m.emailMessageId === msg.emailMessageId)
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      const updated: SqlClientMessage = {
        ...inMemoryState.clientMessages[existingIndex],
        ...msg,
      };
      inMemoryState.clientMessages[existingIndex] = updated;
      saveState();
      syncAlasqlTables();
      return updated;
    } else {
      const nextId =
        inMemoryState.clientMessages.reduce((max, m) => Math.max(max, m.id), 0) + 1;
      const newMsg: SqlClientMessage = {
        id: nextId,
        messageKey: msg.messageKey,
        userId: msg.userId,
        conversationId: msg.conversationId,
        proposalId: msg.proposalId || '',
        clientCompany: msg.clientCompany || 'Client Corp',
        senderName: msg.senderName || 'Alex Morgan',
        senderRole: msg.senderRole || 'agency',
        senderType: msg.senderType || (msg.senderRole === 'client' ? 'client' : 'agency'),
        messageText: msg.messageText,
        timeLabel: msg.timeLabel || 'Just now',
        channel: msg.channel || 'chat',
        resendEmailId: msg.resendEmailId,
        deliveryStatus: msg.deliveryStatus || 'sent',
        attachmentsJson: msg.attachmentsJson || '[]',
        emailMessageId: msg.emailMessageId,
        createdAt: msg.createdAt || now,
      };
      inMemoryState.clientMessages.push(newMsg);
      saveState();
      syncAlasqlTables();
      return newMsg;
    }
  },

  updateMessageDeliveryStatus(
    resendEmailId: string,
    status: 'sent' | 'delivered' | 'bounced' | 'failed'
  ): SqlClientMessage | undefined {
    const msg = inMemoryState.clientMessages.find((m) => m.resendEmailId === resendEmailId);
    if (msg) {
      msg.deliveryStatus = status;
      saveState();
      syncAlasqlTables();
      return msg;
    }
    return undefined;
  },

  // EMAIL DAILY USAGE & LIMITS
  getEmailUsage(userId: number, dateKey?: string): SqlEmailUsage {
    const today = dateKey || new Date().toISOString().split('T')[0];
    let usage = inMemoryState.emailUsage.find(
      (u) => u.userId === userId && u.dateKey === today
    );
    if (!usage) {
      usage = {
        id: inMemoryState.emailUsage.reduce((max, u) => Math.max(max, u.id), 0) + 1,
        userId,
        dateKey: today,
        sentCount: 0,
        receivedCount: 0,
        dailyLimit: 100, // Resend standard free plan safe daily buffer
        updatedAt: new Date().toISOString(),
      };
      inMemoryState.emailUsage.push(usage);
      saveState();
    }
    return usage;
  },

  incrementEmailUsage(
    userId: number,
    type: 'sent' | 'received'
  ): { allowed: boolean; usage: SqlEmailUsage; remaining: number } {
    const usage = this.getEmailUsage(userId);
    const totalCount = usage.sentCount + usage.receivedCount;

    if (totalCount >= usage.dailyLimit) {
      return {
        allowed: false,
        usage,
        remaining: 0,
      };
    }

    if (type === 'sent') {
      usage.sentCount += 1;
    } else {
      usage.receivedCount += 1;
    }
    usage.updatedAt = new Date().toISOString();
    saveState();
    syncAlasqlTables();

    return {
      allowed: true,
      usage,
      remaining: Math.max(0, usage.dailyLimit - (usage.sentCount + usage.receivedCount)),
    };
  },
};
