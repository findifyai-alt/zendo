import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * 1. USER TABLE (@table User)
 * ============================================================================
 * type User @table {
 *   email: String!
 *   name: String!
 *   organizationName: String!
 *   avatarUrl: String
 *   subscriptionTier: String
 * }
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').default('Alex Morgan').notNull(),
  organizationName: text('organization_name').default('Zendo Studio').notNull(),
  avatarUrl: text('avatar_url'),
  subscriptionTier: text('subscription_tier').default('Pro'),

  // Backwards compatibility columns for existing dashboard features
  displayName: text('display_name').default('Alex Morgan').notNull(),
  workspaceName: text('workspace_name').default('Zendo Studio').notNull(),
  industry: text('industry').default('Design & Creative Agency').notNull(),
  servicesOffered: text('services_offered')
    .default('Web Design, Brand Strategy, UI/UX')
    .notNull(),
  brandColor: text('brand_color').default('#1f7a4c').notNull(),
  typicalClientType: text('typical_client_type')
    .default('B2B SaaS & Growing Brands')
    .notNull(),
  currency: text('currency').default('USD ($)').notNull(),
  proposalTone: text('proposal_tone').default('Professional').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * ============================================================================
 * 2. CLIENT TABLE (@table Client)
 * ============================================================================
 * type Client @table {
 *   name: String!
 *   email: String!
 *   companyName: String!
 *   phoneNumber: String
 *   notes: String
 *   user: User!
 * }
 */
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  clientKey: text('client_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  companyName: text('company_name').notNull(),
  phoneNumber: text('phone_number'),
  notes: text('notes'),

  // Backwards compatibility columns
  company: text('company'),
  industry: text('industry').default('Technology'),
  totalProposals: integer('total_proposals').default(1).notNull(),
  pipelineValue: text('pipeline_value').default('$12,000').notNull(),
  lastActivity: text('last_activity').default('Recently').notNull(),
  status: text('status').default('Active').notNull(),
  logoUrl: text('logo_url'),
  emailBounced: boolean('email_bounced').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * ============================================================================
 * 3. PROPOSAL TABLE (@table Proposal)
 * ============================================================================
 * type Proposal @table {
 *   status: String!
 *   totalAmount: Float!
 *   createdAt: Timestamp!
 *   aiGeneratedContent: String
 *   expiryDate: Timestamp
 *   client: Client!
 * }
 */
export const proposals = pgTable('proposals', {
  id: serial('id').primaryKey(),
  proposalKey: text('proposal_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  clientId: integer('client_id').references(() => clients.id),
  title: text('title').notNull(),
  status: text('status').notNull(), // String!
  totalAmount: doublePrecision('total_amount').default(0).notNull(), // Float!
  createdAt: timestamp('created_at').defaultNow().notNull(), // Timestamp!
  aiGeneratedContent: text('ai_generated_content'), // String
  expiryDate: timestamp('expiry_date'), // Timestamp

  // Additional proposal fields
  clientName: text('client_name'),
  clientCompany: text('client_company'),
  clientEmail: text('client_email'),
  industry: text('industry'),
  value: text('value').default('$0').notNull(),
  numericValue: integer('numeric_value').default(0).notNull(),
  updatedAtLabel: text('updated_at_label'),
  style: text('style').default('Professional').notNull(),
  timelineSummary: text('timeline_summary').default('4-6 Weeks').notNull(),
  servicesJson: text('services_json').default('[]').notNull(),
  sectionsJson: text('sections_json').default('{}').notNull(),
});



/**
 * ============================================================================
 * WORKSPACE HELPER TABLES
 * ============================================================================
 */
export const followUps = pgTable('follow_ups', {
  id: serial('id').primaryKey(),
  followUpKey: text('follow_up_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  proposalId: text('proposal_id').notNull(),
  proposalTitle: text('proposal_title').notNull(),
  clientCompany: text('client_company').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  headline: text('headline').notNull(),
  subtext: text('subtext').notNull(),
  timingBadge: text('timing_badge').notNull(),
  aiInsight: text('ai_insight').notNull(),
  suggestedSubject: text('suggested_subject').notNull(),
  suggestedMessage: text('suggested_message').notNull(),
  sent: boolean('sent').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * ============================================================================
 * INTEGRATIONS TABLE (@table integrations)
 * Stores encrypted API keys and webhook secrets per user
 * ============================================================================
 */
export const integrations = pgTable('integrations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  provider: text('provider').default('resend').notNull(),
  encryptedApiKey: text('encrypted_api_key'),
  encryptedWebhookSecret: text('encrypted_webhook_secret'),
  fromEmail: text('from_email'),
  fromName: text('from_name'),
  useDefaultEmail: boolean('use_default_email').default(true).notNull(),
  status: text('status').default('Not connected').notNull(), // 'Not connected' | 'Connected' | 'Error'
  updatedAt: timestamp('updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * ============================================================================
 * CONVERSATIONS TABLE (@table conversations)
 * Tracks chat threads, unique tokens, and client presence/activity
 * ============================================================================
 */
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  clientId: integer('client_id').references(() => clients.id),
  clientCompany: text('client_company').notNull(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  proposalId: text('proposal_id'),
  clientLastActiveAt: timestamp('client_last_active_at'),
  lastEmailSentAt: timestamp('last_email_sent_at'),
  unreadCount: integer('unread_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * ============================================================================
 * EMAIL USAGE TABLE (@table email_usage)
 * Per-user daily email usage quota tracking
 * ============================================================================
 */
export const emailUsage = pgTable('email_usage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  dateKey: text('date_key').notNull(), // 'YYYY-MM-DD'
  sentCount: integer('sent_count').default(0).notNull(),
  receivedCount: integer('received_count').default(0).notNull(),
  dailyLimit: integer('daily_limit').default(100).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const clientMessages = pgTable('client_messages', {
  id: serial('id').primaryKey(),
  messageKey: text('message_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  conversationId: integer('conversation_id').references(() => conversations.id),
  proposalId: text('proposal_id').notNull(),
  clientCompany: text('client_company').notNull(),
  senderName: text('sender_name').notNull(),
  senderRole: text('sender_role').notNull(), // 'client' | 'agency'
  senderType: text('sender_type').default('agency').notNull(), // 'agency' | 'client'
  messageText: text('message_text').notNull(),
  timeLabel: text('time_label').notNull(),
  channel: text('channel').default('chat').notNull(), // 'chat' | 'email'
  resendEmailId: text('resend_email_id'),
  deliveryStatus: text('delivery_status').default('sent').notNull(), // 'sent' | 'delivered' | 'bounced' | 'failed'
  attachmentsJson: text('attachments_json').default('[]').notNull(),
  emailMessageId: text('email_message_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const clientTasks = pgTable('client_tasks', {
  id: serial('id').primaryKey(),
  taskKey: text('task_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  clientCompany: text('client_company').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').notNull(),
  notes: text('notes').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const meetings = pgTable('meetings', {
  id: serial('id').primaryKey(),
  meetingKey: text('meeting_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  clientId: integer('client_id').references(() => clients.id),
  proposalId: text('proposal_id'),
  title: text('title').notNull(),
  clientCompany: text('client_company').notNull(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  type: text('type').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  durationMinutes: integer('duration_minutes').default(45).notNull(),
  timezone: text('timezone').default('PST (UTC-7)').notNull(),
  platform: text('platform').default('Google Meet').notNull(),
  meetingLink: text('meeting_link'),
  agenda: text('agenda'),
  status: text('status').default('Scheduled').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  taskKey: text('task_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  clientId: integer('client_id').references(() => clients.id),
  title: text('title').notNull(),
  project: text('project').notNull(),
  status: text('status').notNull(), // 'today' | 'in_progress' | 'completed'
  priority: text('priority').notNull(), // 'High' | 'Medium' | 'Calm'
  dueDate: text('due_date').notNull(),
  assignee: text('assignee').notNull(),
  estimatedMinutes: integer('estimated_minutes').default(30).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  paymentKey: text('payment_key').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  clientId: integer('client_id').references(() => clients.id),
  invoiceNumber: text('invoice_number').notNull(),
  clientCompany: text('client_company').notNull(),
  projectTitle: text('project_title').notNull(),
  amount: doublePrecision('amount').default(0).notNull(),
  currency: text('currency').default('$').notNull(),
  issueDate: text('issue_date').notNull(),
  dueDate: text('due_date').notNull(),
  status: text('status').default('Pending').notNull(), // 'Paid' | 'Pending' | 'Overdue'
  paymentMethod: text('payment_method'),
  paidDate: text('paid_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * ============================================================================
 * RELATIONS (Drizzle ORM)
 * ============================================================================
 */
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  proposals: many(proposals),
  followUps: many(followUps),
  clientMessages: many(clientMessages),
  clientTasks: many(clientTasks),
  meetings: many(meetings),
  tasks: many(tasks),
  payments: many(payments),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  proposals: many(proposals),
  meetings: many(meetings),
  tasks: many(tasks),
  payments: many(payments),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  user: one(users, {
    fields: [proposals.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [proposals.clientId],
    references: [clients.id],
  }),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  owner: one(users, {
    fields: [followUps.userId],
    references: [users.id],
  }),
}));

export const clientMessagesRelations = relations(clientMessages, ({ one }) => ({
  owner: one(users, {
    fields: [clientMessages.userId],
    references: [users.id],
  }),
}));

export const clientTasksRelations = relations(clientTasks, ({ one }) => ({
  owner: one(users, {
    fields: [clientTasks.userId],
    references: [users.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  user: one(users, {
    fields: [meetings.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [meetings.clientId],
    references: [clients.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
}));
