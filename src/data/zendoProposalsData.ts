import type { ProposalThemeKey } from './proposalThemes';

export type ProposalStatus =
  | 'Draft'
  | 'Sent'
  | 'Viewed'
  | 'Follow-up'
  | 'Accepted'
  | 'Declined';

export type ProposalStyleTone = 'Professional' | 'Friendly' | 'Premium' | 'Direct';

export interface ProposalDeliverableItem {
  id: string;
  name: string;
  description: string;
  included: boolean;
}

export interface ProposalTimelinePhase {
  id: string;
  phase: string;
  duration: string;
  deliverable: string;
}

export interface ProposalPricingItem {
  id: string;
  item: string;
  detail: string;
  amount: string;
}

export interface ProposalSections {
  coverSubtitle: string;
  preparedFor: string;
  preparedBy: string;
  dateIssued: string;
  validUntil: string;
  executiveSummary: string;
  clientProblem: string;
  proposedSolution: string;
  servicesDeliverables: ProposalDeliverableItem[];
  timeline: ProposalTimelinePhase[];
  pricingItems: ProposalPricingItem[];
  pricingNote: string;
  termsAndNextSteps: string;
}

export interface ProposalItem {
  id: string;
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  industry: string;
  value: string;
  numericValue: number;
  status: ProposalStatus;
  updatedAt: string;
  style: ProposalStyleTone;
  timelineSummary: string;
  services: string[];
  sections: ProposalSections;
  templateTheme?: ProposalThemeKey;
}

export interface ClientItem {
  id: string;
  name: string;
  company: string;
  email: string;
  industry: string;
  totalProposals: number;
  pipelineValue: string;
  lastActivity: string;
  status: 'Active' | 'Prospect' | 'Won';
  logoUrl?: string;
}

export interface ProposalTemplateItem {
  id: string;
  title: string;
  category: string;
  description: string;
  typicalValue: string;
  typicalTimeline: string;
  recommendedTone: ProposalStyleTone;
  services: string[];
  clientNeedPrompt: string;
  additionalNotes: string;
  thumbnailImage?: string;
  themeKey?: ProposalThemeKey;
}

export interface FollowUpItem {
  id: string;
  proposalId: string;
  proposalTitle: string;
  clientCompany: string;
  contactName: string;
  contactEmail: string;
  headline: string;
  subtext: string;
  timingBadge: 'Today' | 'Viewed' | 'Tomorrow' | 'Upcoming';
  aiInsight: string;
  suggestedSubject: string;
  suggestedMessage: string;
  sent: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
  proposalId?: string;
}

export interface ClientMessageItem {
  id: string;
  proposalId: string;
  clientCompany: string;
  senderName: string;
  senderRole: 'client' | 'agency';
  senderType?: 'client' | 'agency';
  messageText: string;
  timeLabel: string;
  channel?: 'chat' | 'email';
  resendEmailId?: string;
  deliveryStatus?: 'sent' | 'delivered' | 'bounced' | 'failed';
  attachments?: Array<{ id: string; name: string; url: string; size?: number }>;
  conversationId?: number;
}

export interface ConversationItem {
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

export interface IntegrationSettings {
  provider: 'resend';
  apiKeyMasked?: string;
  webhookSecretMasked?: string;
  fromEmail: string;
  fromName: string;
  useDefaultEmail: boolean;
  status: 'Not connected' | 'Connected' | 'Error';
  dailyLimit: number;
  sentCount: number;
  receivedCount: number;
  remainingCount: number;
}

export interface ClientWorkspaceTaskItem {
  id: string;
  clientCompany: string;
  title: string;
  category: 'Task' | 'Deadline' | 'Meeting' | 'Project Update';
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  notes: string;
}

export type MeetingType =
  | 'Discovery Call'
  | 'Proposal Walkthrough'
  | 'Design Review'
  | 'Project Kickoff'
  | 'Weekly Sync'
  | 'Strategy Session';

export interface ScheduledMeetingItem {
  id: string;
  title: string;
  clientCompany: string;
  clientName: string;
  clientEmail: string;
  type: MeetingType;
  date: string;
  time: string;
  durationMinutes: number;
  timezone: string;
  platform: 'Google Meet' | 'Zoom' | 'Phone Call' | 'In-Person';
  meetingLink?: string;
  agenda?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  proposalId?: string;
  proposalTitle?: string;
  googleCalendarEventId?: string;
  googleCalendarLink?: string;
}

export const INITIAL_PROPOSALS: ProposalItem[] = [
  {
    id: 'prop-acme-web',
    title: 'Website Redesign',
    clientName: 'Hannah Lin',
    clientCompany: 'Acme Studio',
    clientEmail: 'hannah@acmestudio.co',
    industry: 'Design & Creative Agency',
    value: '$4,800',
    numericValue: 4800,
    status: 'Viewed',
    updatedAt: '2 hours ago',
    style: 'Premium',
    timelineSummary: '4 weeks',
    services: ['UX Research & Wireframes', 'Custom Web Design', 'Webflow Development', 'Technical SEO'],
    templateTheme: 'executive-skyline',
    sections: {
      coverSubtitle: 'High-conversion marketing website and interactive case study showcase',
      preparedFor: 'Hannah Lin · Acme Studio',
      preparedBy: 'Alex Morgan · Zendo Studio',
      dateIssued: 'October 10, 2026',
      validUntil: 'November 10, 2026',
      executiveSummary:
        'Acme Studio has built an impressive portfolio of brand and digital work, but the current website no longer reflects your senior positioning. This proposal outlines a focused 4-week redesign to elevate your visual authority, streamline case study storytelling, and increase qualified inbound inquiries.',
      clientProblem:
        'Prospective enterprise clients visiting Acme Studio’s website experience slow load times, fragmented navigation across mobile devices, and static portfolio pages that fail to communicate measurable client outcomes.',
      proposedSolution:
        'We will architect a bespoke, fast-loading digital flagship with modular case study layouts, clear service positioning, and interactive conversion touchpoints tailored for design-forward buyers.',
      servicesDeliverables: [
        {
          id: 'del-1',
          name: 'UX Architecture & Content Strategy',
          description: 'Information architecture, sitemap restructuring, and wireframes for 8 core templates.',
          included: true,
        },
        {
          id: 'del-2',
          name: 'Visual Design System & UI Kit',
          description: 'Responsive typography scale, custom component library, and interactive motion prototypes.',
          included: true,
        },
        {
          id: 'del-3',
          name: 'CMS Development & QA',
          description: 'Clean semantic build, dynamic portfolio filtering, and cross-browser performance optimization.',
          included: true,
        },
        {
          id: 'del-4',
          name: 'Technical SEO & Analytics Setup',
          description: 'Schema markup, OpenGraph metadata, Core Web Vitals tuning, and conversion tracking.',
          included: true,
        },
      ],
      timeline: [
        {
          id: 'tl-1',
          phase: 'Week 1 · Discovery & Wireframing',
          duration: 'Week 1',
          deliverable: 'UX audit, messaging hierarchy, and interactive wireframes',
        },
        {
          id: 'tl-2',
          phase: 'Week 2 · Visual Direction & UI Design',
          duration: 'Week 2',
          deliverable: 'High-fidelity desktop and mobile screens in Figma',
        },
        {
          id: 'tl-3',
          phase: 'Week 3 · Frontend Build & CMS Setup',
          duration: 'Week 3',
          deliverable: 'Staging site with CMS collections and subtle micro-interactions',
        },
        {
          id: 'tl-4',
          phase: 'Week 4 · QA, SEO & Launch',
          duration: 'Week 4',
          deliverable: 'Final testing, team training session, and live production deployment',
        },
      ],
      pricingItems: [
        {
          id: 'pr-1',
          item: 'UX Strategy & Wireframe Architecture',
          detail: 'Sitemap, user flows, and conversion wireframe kit',
          amount: '$1,200',
        },
        {
          id: 'pr-2',
          item: 'Bespoke UI Design & Design System',
          detail: '8 custom responsive page templates + reusable component tokens',
          amount: '$1,800',
        },
        {
          id: 'pr-3',
          item: 'Development, CMS & Technical SEO',
          detail: 'Full production build, portfolio CMS migration, and launch support',
          amount: '$1,800',
        },
      ],
      pricingNote: '50% deposit ($2,400) upon acceptance; 50% ($2,400) upon final launch approval.',
      termsAndNextSteps:
        'To begin on Monday, simply click "Accept Proposal" or reply to confirm. Once approved, we will issue the kick-off agenda and initial discovery questionnaire within 24 hours.',
    },
  },
  {
    id: 'prop-nova-brand',
    title: 'Brand Strategy',
    clientName: 'Marcus Vance',
    clientCompany: 'Nova Labs',
    clientEmail: 'marcus@novalabs.io',
    industry: 'AI & SaaS Technology',
    value: '$7,500',
    numericValue: 7500,
    status: 'Draft',
    updatedAt: 'Yesterday',
    style: 'Professional',
    timelineSummary: '5 weeks',
    services: ['Brand Positioning', 'Visual Identity', 'Messaging Framework', 'Brand Guidelines'],
    sections: {
      coverSubtitle: 'Comprehensive brand positioning, messaging framework, and visual identity system',
      preparedFor: 'Marcus Vance · Nova Labs',
      preparedBy: 'Alex Morgan · Zendo Studio',
      dateIssued: 'October 9, 2026',
      validUntil: 'November 9, 2026',
      executiveSummary:
        'As Nova Labs prepares for its Series A expansion, establishing a distinctive, cohesive brand narrative is critical to standing out in the enterprise software market. This proposal details a 5-week strategic engagement to unify your positioning, visual language, and sales collateral.',
      clientProblem:
        'Nova Labs has evolved rapidly over the past 18 months, leaving product marketing, pitch decks, and website touchpoints with inconsistent messaging and a visual identity that blends in with legacy competitors.',
      proposedSolution:
        'We will partner with your leadership team to articulate a sharp category narrative, craft a modern visual identity system, and deliver a comprehensive brand playbook ready for immediate rollout.',
      servicesDeliverables: [
        {
          id: 'del-n1',
          name: 'Executive Positioning & Category Narrative',
          description: 'Stakeholder interviews, competitive matrix, and core value proposition architecture.',
          included: true,
        },
        {
          id: 'del-n2',
          name: 'Visual Identity & Logo System',
          description: 'Refined brand mark, color palette, typographic hierarchy, and custom iconography.',
          included: true,
        },
        {
          id: 'del-n3',
          name: 'Enterprise Pitch & Sales Collateral',
          description: 'Master Series A / enterprise sales deck template and one-pager layout.',
          included: true,
        },
        {
          id: 'del-n4',
          name: 'Digital Brand Guidelines Book',
          description: 'Complete usage documentation for product, marketing, and engineering teams.',
          included: true,
        },
      ],
      timeline: [
        {
          id: 'tl-n1',
          phase: 'Weeks 1–2 · Discovery & Positioning Strategy',
          duration: '2 weeks',
          deliverable: 'Brand strategy deck and messaging pillars',
        },
        {
          id: 'tl-n2',
          phase: 'Weeks 3–4 · Visual Identity Exploration',
          duration: '2 weeks',
          deliverable: 'Two cohesive visual territories and refined identity system',
        },
        {
          id: 'tl-n3',
          phase: 'Week 5 · Guidelines & Asset Handoff',
          duration: '1 week',
          deliverable: 'Brand book, Figma token library, and pitch deck templates',
        },
      ],
      pricingItems: [
        {
          id: 'pr-n1',
          item: 'Brand Strategy & Messaging Architecture',
          detail: 'Competitive audit, workshops, and narrative framework',
          amount: '$2,800',
        },
        {
          id: 'pr-n2',
          item: 'Visual Identity & Design System',
          detail: 'Logo suite, typography, color tokens, and art direction',
          amount: '$3,200',
        },
        {
          id: 'pr-n3',
          item: 'Brand Guidelines & Deck Templates',
          detail: 'Comprehensive documentation and production asset kit',
          amount: '$1,500',
        },
      ],
      pricingNote: 'Invoiced in two milestones: 50% at project kick-off and 50% upon final asset delivery.',
      termsAndNextSteps:
        'Review the proposed scope and timeline above. Upon signature, we will schedule the 90-minute leadership alignment workshop for next week.',
    },
  },
  {
    id: 'prop-orbit-retainer',
    title: 'Marketing Retainer',
    clientName: 'Elena Rostova',
    clientCompany: 'Orbit Co.',
    clientEmail: 'elena@orbitco.com',
    industry: 'B2B Commerce',
    value: '$3,200/month',
    numericValue: 3200,
    status: 'Sent',
    updatedAt: '2 days ago',
    style: 'Direct',
    timelineSummary: 'Ongoing monthly',
    services: ['Content Strategy', 'Conversion Rate Optimization', 'Paid Acquisition Creative', 'Monthly Analytics'],
    sections: {
      coverSubtitle: 'Dedicated monthly growth marketing, conversion optimization, and campaign execution',
      preparedFor: 'Elena Rostova · Orbit Co.',
      preparedBy: 'Alex Morgan · Zendo Studio',
      dateIssued: 'October 8, 2026',
      validUntil: 'November 8, 2026',
      executiveSummary:
        'To sustain Orbit Co.’s pipeline momentum quarter over quarter, this monthly growth retainer provides continuous landing page experimentation, high-converting campaign assets, and transparent attribution reporting.',
      clientProblem:
        'Orbit Co.’s internal marketing team is stretched thin managing events and product launches, causing paid campaign creative and landing page conversion rates to plateau.',
      proposedSolution:
        'A dedicated monthly execution pod delivering bi-weekly conversion experiments, fresh ad creative sprints, and executive pipeline reporting.',
      servicesDeliverables: [
        {
          id: 'del-o1',
          name: 'Landing Page CRO Sprints',
          description: '2 new or optimized campaign landing pages per month with A/B testing.',
          included: true,
        },
        {
          id: 'del-o2',
          name: 'Ad & Social Creative Production',
          description: '12 tailored static and motion creative variations per month for LinkedIn and Meta.',
          included: true,
        },
        {
          id: 'del-o3',
          name: 'Bi-Weekly Pipeline & Attribution Sync',
          description: 'Live performance dashboard and bi-weekly strategy optimization call.',
          included: true,
        },
      ],
      timeline: [
        {
          id: 'tl-o1',
          phase: 'Days 1–5 · Monthly Sprint Planning',
          duration: 'Week 1',
          deliverable: 'Prioritized experiment backlog and campaign brief',
        },
        {
          id: 'tl-o2',
          phase: 'Days 6–20 · Creative & CRO Execution',
          duration: 'Weeks 2–3',
          deliverable: 'Launch of new landing pages and ad creative batches',
        },
        {
          id: 'tl-o3',
          phase: 'Days 21–30 · Analysis & Next Cycle Prep',
          duration: 'Week 4',
          deliverable: 'Conversion lift report and next month’s roadmap',
        },
      ],
      pricingItems: [
        {
          id: 'pr-o1',
          item: 'Monthly Growth & CRO Retainer',
          detail: 'Dedicated design, copywriting, and CRO experimentation pod',
          amount: '$3,200/month',
        },
      ],
      pricingNote: 'Billed monthly on the 1st of each month. 3-month initial commitment, then rolling 30-day notice.',
      termsAndNextSteps:
        'Sign digitally below to lock in our November sprint capacity. We will immediately provision your shared client workspace.',
    },
  },
  {
    id: 'prop-northstar-app',
    title: 'App Development',
    clientName: 'David Chen',
    clientCompany: 'Northstar Labs',
    clientEmail: 'david@northstarlabs.ai',
    industry: 'FinTech & Analytics',
    value: '$12,000',
    numericValue: 12000,
    status: 'Accepted',
    updatedAt: '4 days ago',
    style: 'Professional',
    timelineSummary: '8 weeks',
    services: ['Product Architecture', 'React & TypeScript Frontend', 'API Integration', 'Security & QA'],
    sections: {
      coverSubtitle: 'End-to-end design and full-stack engineering for the Northstar Client Portal v2',
      preparedFor: 'David Chen · Northstar Labs',
      preparedBy: 'Alex Morgan · Zendo Studio',
      dateIssued: 'October 6, 2026',
      validUntil: 'November 6, 2026',
      executiveSummary:
        'Northstar Labs is ready to launch a self-serve analytics portal for institutional customers. This proposal covers the complete 8-week product design and frontend/API engineering roadmap to ship a fast, secure production web application.',
      clientProblem:
        'Institutional clients currently receive manual weekly PDF reports, creating operational bottlenecks for Northstar’s analysts and delaying real-time portfolio insights.',
      proposedSolution:
        'We will build a responsive React & TypeScript web application featuring interactive portfolio telemetry, role-based access control, and automated CSV/PDF report exports.',
      servicesDeliverables: [
        {
          id: 'del-ns1',
          name: 'Interactive Dashboard UI & Component Architecture',
          description: 'High-density financial data tables, custom chart modules, and dark/light theme support.',
          included: true,
        },
        {
          id: 'del-ns2',
          name: 'REST API & Authentication Integration',
          description: 'Secure SSO authentication, role permissions, and real-time data hooks.',
          included: true,
        },
        {
          id: 'del-ns3',
          name: 'Automated Reporting & Export Engine',
          description: 'One-click institutional PDF and CSV ledger export functionality.',
          included: true,
        },
      ],
      timeline: [
        {
          id: 'tl-ns1',
          phase: 'Weeks 1–2 · Technical Spec & UI Prototypes',
          duration: '2 weeks',
          deliverable: 'Interactive Figma prototype and API schema contract',
        },
        {
          id: 'tl-ns2',
          phase: 'Weeks 3–6 · Core Application Engineering',
          duration: '4 weeks',
          deliverable: 'Functional web app on staging with live API data binding',
        },
        {
          id: 'tl-ns3',
          phase: 'Weeks 7–8 · Security Audit, UAT & Production Release',
          duration: '2 weeks',
          deliverable: 'Penetration test sign-off, documentation, and production launch',
        },
      ],
      pricingItems: [
        {
          id: 'pr-ns1',
          item: 'Product UI/UX & Design System',
          detail: 'Complete interactive interface views and component specs',
          amount: '$3,500',
        },
        {
          id: 'pr-ns2',
          item: 'Frontend & API Integration Engineering',
          detail: 'React, TypeScript, state management, and secure auth flows',
          amount: '$6,500',
        },
        {
          id: 'pr-ns3',
          item: 'QA Testing, Deployment & Handover',
          detail: 'Automated E2E test suite and engineering documentation',
          amount: '$2,000',
        },
      ],
      pricingNote: '40% upon project kick-off ($4,800), 30% at staging milestone ($3,600), 30% upon launch ($3,600).',
      termsAndNextSteps:
        'Proposal accepted by David Chen on October 6, 2026. Kick-off call completed and Sprint 1 is underway.',
    },
  },
  {
    id: 'prop-lumina-seo',
    title: 'SEO & Content Growth',
    clientName: 'Sofia Patel',
    clientCompany: 'Lumina Health',
    clientEmail: 'sofia@luminahealth.io',
    industry: 'Digital Health',
    value: '$5,400',
    numericValue: 5400,
    status: 'Follow-up',
    updatedAt: '5 days ago',
    style: 'Friendly',
    timelineSummary: '6 weeks',
    services: ['Technical SEO Audit', 'Topic Cluster Roadmap', 'Editorial Production', 'Search Console Setup'],
    sections: {
      coverSubtitle: 'Organic search foundation and high-intent clinical content engine',
      preparedFor: 'Sofia Patel · Lumina Health',
      preparedBy: 'Alex Morgan · Zendo Studio',
      dateIssued: 'October 5, 2026',
      validUntil: 'November 5, 2026',
      executiveSummary:
        'Lumina Health has strong patient satisfaction scores, and capturing organic search intent will significantly lower patient acquisition costs over the next two quarters.',
      clientProblem:
        'High reliance on paid search ads with rising CPCs, while core service pages rank on page 2–3 for high-intent health queries.',
      proposedSolution:
        'A 6-week technical SEO overhaul paired with 12 authoritative pillar articles optimized for clinical search visibility.',
      servicesDeliverables: [
        {
          id: 'del-l1',
          name: 'Technical SEO & Core Web Vitals Remediation',
          description: 'Site speed optimization, internal linking structure, and medical schema markup.',
          included: true,
        },
        {
          id: 'del-l2',
          name: '12 Pillar Content Articles & Landing Pages',
          description: 'Keyword-researched, conversion-focused long-form guides.',
          included: true,
        },
      ],
      timeline: [
        {
          id: 'tl-l1',
          phase: 'Weeks 1–2 · Technical Audit & Keyword Architecture',
          duration: '2 weeks',
          deliverable: 'Full technical audit fixes and 90-day editorial roadmap',
        },
        {
          id: 'tl-l2',
          phase: 'Weeks 3–6 · Content Production & On-Page Optimization',
          duration: '4 weeks',
          deliverable: '12 published pillar guides and search analytics dashboard',
        },
      ],
      pricingItems: [
        {
          id: 'pr-l1',
          item: 'Technical SEO & Site Architecture Overhaul',
          detail: 'Audit, schema implementation, and indexing fixes',
          amount: '$2,200',
        },
        {
          id: 'pr-l2',
          item: 'Pillar Content Strategy & Production (12 pieces)',
          detail: 'Briefs, editorial drafting, and CMS publishing',
          amount: '$3,200',
        },
      ],
      pricingNote: '50% deposit upon approval, 50% upon delivery of all 12 pillar assets.',
      termsAndNextSteps:
        'Confirm approval to lock in your content strategist and begin the technical crawl this week.',
    },
  },
  {
    id: 'prop-vertex-audit',
    title: 'Design System Audit',
    clientName: 'Liam O’Connor',
    clientCompany: 'Vertex Cloud',
    clientEmail: 'liam@vertexcloud.dev',
    industry: 'Developer Tools',
    value: '$3,900',
    numericValue: 3900,
    status: 'Declined',
    updatedAt: '1 week ago',
    style: 'Direct',
    timelineSummary: '3 weeks',
    services: ['Figma Token Audit', 'Accessibility Review', 'Component Governance'],
    sections: {
      coverSubtitle: 'Design token standardization and WCAG AA accessibility remediation',
      preparedFor: 'Liam O’Connor · Vertex Cloud',
      preparedBy: 'Alex Morgan · Zendo Studio',
      dateIssued: 'October 1, 2026',
      validUntil: 'November 1, 2026',
      executiveSummary:
        'A focused 3-week audit of Vertex Cloud’s Figma libraries and React component tokens to eliminate UI drift across 4 product squads.',
      clientProblem:
        'Designers and engineers maintain duplicate component variants, slowing down feature releases.',
      proposedSolution:
        'Consolidate Figma variables and establish a single documented token pipeline.',
      servicesDeliverables: [
        {
          id: 'del-v1',
          name: 'Figma & Storybook Parity Audit',
          description: 'Complete inventory of component discrepancies and accessibility gaps.',
          included: true,
        },
      ],
      timeline: [
        {
          id: 'tl-v1',
          phase: 'Weeks 1–3 · Audit & Token Consolidation',
          duration: '3 weeks',
          deliverable: 'Unified Figma variable collection and governance guide',
        },
      ],
      pricingItems: [
        {
          id: 'pr-v1',
          item: 'Design System Audit & Token Refactor',
          detail: '3-week intensive sprint',
          amount: '$3,900',
        },
      ],
      pricingNote: '100% upfront for 3-week sprint.',
      termsAndNextSteps: 'Client postponed budget to Q1.',
    },
  },
];

export const INITIAL_CLIENTS: ClientItem[] = [
  {
    id: 'cli-1',
    name: 'Hannah Lin',
    company: 'Acme Studio',
    email: 'hannah@acmestudio.co',
    industry: 'Design & Creative Agency',
    totalProposals: 3,
    pipelineValue: '$14,200',
    lastActivity: 'Viewed proposal 2 hours ago',
    status: 'Active',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    id: 'cli-2',
    name: 'Marcus Vance',
    company: 'Nova Labs',
    email: 'marcus@novalabs.io',
    industry: 'AI & SaaS Technology',
    totalProposals: 2,
    pipelineValue: '$11,500',
    lastActivity: 'Draft updated yesterday',
    status: 'Prospect',
    logoUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    id: 'cli-3',
    name: 'Elena Rostova',
    company: 'Orbit Co.',
    email: 'elena@orbitco.com',
    industry: 'B2B Commerce',
    totalProposals: 4,
    pipelineValue: '$38,400',
    lastActivity: 'Proposal sent 2 days ago',
    status: 'Active',
    logoUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    id: 'cli-4',
    name: 'David Chen',
    company: 'Northstar Labs',
    email: 'david@northstarlabs.ai',
    industry: 'FinTech & Analytics',
    totalProposals: 5,
    pipelineValue: '$42,000',
    lastActivity: 'Accepted $12,000 proposal 4 days ago',
    status: 'Won',
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=120&h=120&q=80',
  },
  {
    id: 'cli-5',
    name: 'Sofia Patel',
    company: 'Lumina Health',
    email: 'sofia@luminahealth.io',
    industry: 'Digital Health',
    totalProposals: 2,
    pipelineValue: '$8,900',
    lastActivity: 'Follow-up scheduled',
    status: 'Prospect',
    logoUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=120&h=120&q=80',
  },
];

export const INITIAL_TEMPLATES: ProposalTemplateItem[] = [
  {
    id: 'tpl-cyber-onyx',
    title: 'Cyber Onyx & Cobalt Strategy',
    category: 'Digital Strategy',
    description:
      'High-contrast futuristic pitch deck with electric cobalt geometric bands, high-impact headings, and technical deliverables layout.',
    typicalValue: '$12,000 – $28,000',
    typicalTimeline: '3 months',
    recommendedTone: 'Premium',
    thumbnailImage: '/assets/aistudio/Screenshot_2026-10-26_052503_b78395a8.png',
    themeKey: 'cyber-onyx',
    services: [
      'Digital Marketing Strategy',
      'Growth Funnel Architecture',
      'Paid Acquisition Campaigns',
      'Attribution Analytics',
    ],
    clientNeedPrompt:
      'Digital marketing strategy and multi-channel customer acquisition sprint for scaling consumer and fashion brands.',
    additionalNotes: 'Includes bi-weekly sprint reviews, creative asset refreshes, and real-time ROAS dashboard.',
  },
  {
    id: 'tpl-executive-skyline',
    title: 'Executive Skyline Transformation',
    category: 'Enterprise & Advisory',
    description:
      'Pristine editorial proposal with architectural skyscraper emblem, high-fashion serif title, and fluid ocean wave accents.',
    typicalValue: '$15,000 – $38,000',
    typicalTimeline: '6 weeks',
    recommendedTone: 'Professional',
    thumbnailImage: '/assets/aistudio/Screenshot_2026-10-26_052445_de4e5565.png',
    themeKey: 'executive-skyline',
    services: [
      'Digital Transformation Roadmap',
      'Core Tech Stack Modernization',
      'Change Management Workshops',
      'Executive Steering Committee Sync',
    ],
    clientNeedPrompt:
      'Modernize legacy corporate workflows, streamline digital toolchains, and lead executive change management across business units.',
    additionalNotes: 'Presented in boardroom-ready editorial format with milestone escrow release terms.',
  },
  {
    id: 'tpl-bauhaus-purple',
    title: 'Bauhaus Rhombus Business & Marketing',
    category: 'Branding & Growth',
    description:
      'Swiss modernist layout with an angled 45-degree cluster of periwinkle and deep charcoal diamond tiles on a clean white canvas.',
    typicalValue: '$8,500 – $18,000',
    typicalTimeline: '5 weeks',
    recommendedTone: 'Direct',
    thumbnailImage: '/assets/aistudio/Screenshot_2026-10-26_052520_27e03b6c.png',
    themeKey: 'bauhaus-purple',
    services: [
      'Brand & Market Positioning',
      'Competitive Whitespace Analysis',
      'Omnichannel Marketing Framework',
      'High-Conversion Campaign Rollout',
    ],
    clientNeedPrompt:
      'Comprehensive business and marketing proposal for establishing category leadership and accelerating qualified deal flow.',
    additionalNotes: 'Includes structured client dossier, modular service scoping, and clear deliverables checklist.',
  },
  {
    id: 'tpl-playful-crayon',
    title: 'Playful Pastel Workshop & Support',
    category: 'Creative & Education',
    description:
      'Charming graph-paper canvas framed with playful crayon doodles, pastel torn-paper shapes, and organic rounded highlight badges.',
    typicalValue: '$4,500 – $9,500',
    typicalTimeline: '4 weeks',
    recommendedTone: 'Friendly',
    thumbnailImage: '/assets/aistudio/Screenshot_2026-10-26_052419_7e5646f6.png',
    themeKey: 'playful-crayon',
    services: [
      'Interactive Workshop Facilitation',
      'Emotional Support & Strategy Kit',
      'Curriculum & Activity Guides',
      'Parent & Educator Community Toolkit',
    ],
    clientNeedPrompt:
      'Design engaging community programs, emotional support strategies, and educational collateral for childhood development initiatives.',
    additionalNotes: 'Hand-crafted visual presentation ideal for education, non-profits, creative studios, and family brands.',
  },
  {
    id: 'tpl-web-redesign',
    title: 'Website Redesign & Conversion',
    category: 'Web Design',
    description:
      'Structured for agencies and freelancers pitching full website overhauls, UX architecture, and CMS builds.',
    typicalValue: '$4,800 – $9,500',
    typicalTimeline: '4 weeks',
    recommendedTone: 'Premium',
    thumbnailImage: '/assets/aistudio/zendo-dashboard-with-logo_408f86fd.png',
    themeKey: 'classic',
    services: ['UX Research & Wireframes', 'Custom Web Design', 'Webflow / React Build', 'Technical SEO'],
    clientNeedPrompt:
      'Redesign the core marketing website to improve brand positioning, showcase client case studies, and increase inbound demo conversions.',
    additionalNotes: 'Includes 2 rounds of design revisions and post-launch QA support.',
  },
  {
    id: 'tpl-brand-strategy',
    title: 'Brand Strategy & Visual Identity',
    category: 'Branding',
    description:
      'Ideal for positioning workshops, messaging frameworks, logo suites, and comprehensive brand guidelines.',
    typicalValue: '$6,500 – $12,000',
    typicalTimeline: '5 weeks',
    recommendedTone: 'Professional',
    services: ['Brand Positioning', 'Messaging Framework', 'Visual Identity System', 'Brand Guidelines'],
    clientNeedPrompt:
      'Establish a cohesive category narrative and visual identity system ahead of an upcoming product launch or funding milestone.',
    additionalNotes: 'Includes executive alignment workshop and Figma token library handoff.',
  },
  {
    id: 'tpl-marketing-retainer',
    title: 'Monthly Growth & Marketing Retainer',
    category: 'Retainer',
    description:
      'Recurring monthly scope for ongoing CRO experiments, paid acquisition creative, and pipeline analytics.',
    typicalValue: '$3,200/month',
    typicalTimeline: 'Ongoing monthly',
    recommendedTone: 'Direct',
    services: ['Landing Page CRO', 'Paid Ad Creative', 'Content Strategy', 'Bi-Weekly Attribution Sync'],
    clientNeedPrompt:
      'Provide ongoing monthly growth marketing execution, landing page A/B testing, and fresh campaign creative.',
    additionalNotes: '3-month initial term with bi-weekly performance reviews.',
  },
  {
    id: 'tpl-app-development',
    title: 'Custom Web App & MVP Development',
    category: 'Engineering',
    description:
      'Full-stack product design and React/TypeScript development proposal with milestone-based delivery.',
    typicalValue: '$10,000 – $24,000',
    typicalTimeline: '8 weeks',
    recommendedTone: 'Professional',
    services: ['Product Architecture', 'UI/UX Prototyping', 'Frontend & API Engineering', 'QA & Deployment'],
    clientNeedPrompt:
      'Design and build a secure, responsive client portal and analytics web application with role-based permissions.',
    additionalNotes: 'Milestone billing: 40% kick-off, 30% staging, 30% production release.',
  },
];

export const INITIAL_FOLLOW_UPS: FollowUpItem[] = [
  {
    id: 'fu-acme',
    proposalId: 'prop-acme-web',
    proposalTitle: 'Website Redesign',
    clientCompany: 'Acme Studio',
    contactName: 'Hannah Lin',
    contactEmail: 'hannah@acmestudio.co',
    headline: 'Acme Studio — Follow up today',
    subtext: 'Hannah viewed the Pricing and Timeline sections twice in the last 2 hours.',
    timingBadge: 'Today',
    aiInsight:
      'High buying signal: Client spent 4m 15s reviewing the Pricing section. Send a warm check-in offering a quick 10-minute scope walkthrough.',
    suggestedSubject: 'Quick question on the Acme Studio Website Redesign proposal',
    suggestedMessage:
      'Hi Hannah,\n\nI noticed you had a chance to review the Website Redesign proposal earlier today. I wanted to reach out and see if you had any questions about the 4-week timeline or the CMS deliverables.\n\nIf helpful, I have 15 minutes open tomorrow afternoon to walk through the milestone schedule together. Let me know what works best for you!\n\nBest regards,\nAlex Morgan',
    sent: false,
  },
  {
    id: 'fu-nova',
    proposalId: 'prop-nova-brand',
    proposalTitle: 'Brand Strategy',
    clientCompany: 'Nova Labs',
    contactName: 'Marcus Vance',
    contactEmail: 'marcus@novalabs.io',
    headline: 'Nova Labs — Proposal viewed yesterday',
    subtext: 'Marcus reviewed the Executive Positioning deliverables yesterday afternoon.',
    timingBadge: 'Viewed',
    aiInsight:
      'Recommended action: Finalize and send the updated Series A pitch deck deliverable note while top of mind.',
    suggestedSubject: 'Following up: Nova Labs Brand Strategy & Positioning Proposal',
    suggestedMessage:
      'Hi Marcus,\n\nHope your week is going smoothly. Following up on our Brand Strategy proposal—I’ve included the Series A sales deck template inside Phase 3 so your team has ready-to-use collateral right after the visual identity sprint.\n\nWould love to hear your thoughts when you have a moment.\n\nWarmly,\nAlex Morgan',
    sent: false,
  },
  {
    id: 'fu-orbit',
    proposalId: 'prop-orbit-retainer',
    proposalTitle: 'Marketing Retainer',
    clientCompany: 'Orbit Co.',
    contactName: 'Elena Rostova',
    contactEmail: 'elena@orbitco.com',
    headline: 'Orbit Co. — Response expected tomorrow',
    subtext: 'Sent 2 days ago · Elena mentioned reviewing with VP of Growth on Thursday.',
    timingBadge: 'Tomorrow',
    aiInsight:
      'Optimal timing: Send a concise summary of expected 30-day CRO deliverables ahead of their Thursday review meeting.',
    suggestedSubject: 'Summary for your Thursday review — Orbit Co. Growth Retainer',
    suggestedMessage:
      'Hi Elena,\n\nAhead of your review meeting tomorrow, I put together a quick 3-bullet summary of what we’ll ship in the first 30 days of the Marketing Retainer:\n\n1. Full conversion audit + 2 high-intent landing page experiments\n2. 12 fresh ad creative variations for Q4 campaigns\n3. Live attribution dashboard setup\n\nLet me know if you need anything else before your team meets!\n\nBest,\nAlex Morgan',
    sent: false,
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Acme Studio viewed your proposal',
    detail: 'Hannah Lin viewed "Website Redesign" ($4,800) for 4 minutes.',
    time: '2 hours ago',
    unread: true,
    proposalId: 'prop-acme-web',
  },
  {
    id: 'notif-2',
    title: 'Zendo AI Follow-up Ready',
    detail: '3 personalized follow-up drafts are ready for your review.',
    time: '4 hours ago',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'Northstar Labs accepted your proposal!',
    detail: 'David Chen signed "App Development" ($12,000).',
    time: '4 days ago',
    unread: false,
    proposalId: 'prop-northstar-app',
  },
];

export const INITIAL_CLIENT_MESSAGES: ClientMessageItem[] = [
  {
    id: 'msg-1',
    proposalId: 'prop-acme-web',
    clientCompany: 'Acme Studio',
    senderName: 'Hannah Lin',
    senderRole: 'client',
    messageText:
      'Hi Alex! Our team loves the 4-week redesign roadmap. Quick question: does the CMS setup include migrating our 12 existing case studies, or should we scope that separately?',
    timeLabel: '1 hour ago',
  },
  {
    id: 'msg-2',
    proposalId: 'prop-acme-web',
    clientCompany: 'Acme Studio',
    senderName: 'Alex Morgan',
    senderRole: 'agency',
    messageText:
      'Hi Hannah! Yes, migrating all 12 case studies into the new Webflow CMS collection is fully included in Week 3 of the proposal at no extra cost.',
    timeLabel: '42 mins ago',
  },
  {
    id: 'msg-3',
    proposalId: 'prop-orbit-retainer',
    clientCompany: 'Orbit Co.',
    senderName: 'Elena Rostova',
    senderRole: 'client',
    messageText:
      'Thanks for sending this over! Can we schedule a 20-minute call on Thursday at 2:00 PM EST with our VP of Growth before we sign?',
    timeLabel: 'Yesterday',
  },
  {
    id: 'msg-4',
    proposalId: 'prop-northstar-app',
    clientCompany: 'Northstar Labs',
    senderName: 'David Chen',
    senderRole: 'client',
    messageText:
      'Proposal signed and deposit initiated! Excited to kick off Sprint 1 for the Client Portal v2.',
    timeLabel: '4 days ago',
  },
];

export const INITIAL_CLIENT_TASKS: ClientWorkspaceTaskItem[] = [
  {
    id: 'ctask-1',
    clientCompany: 'Acme Studio',
    title: 'Send CMS migration checklist & answer Hannah’s scope question',
    category: 'Task',
    dueDate: 'Today, 4:00 PM',
    status: 'In Progress',
    notes: 'Confirm 12 case studies are included in Phase 3 deliverable.',
  },
  {
    id: 'ctask-2',
    clientCompany: 'Orbit Co.',
    title: 'Retainer Scope Review Meeting with Elena & VP of Growth',
    category: 'Meeting',
    dueDate: 'Tomorrow, 2:00 PM',
    status: 'Pending',
    notes: 'Walk through first 30-day CRO experiment roadmap.',
  },
  {
    id: 'ctask-3',
    clientCompany: 'Northstar Labs',
    title: 'Deliver Sprint 1 Figma Interactive Prototype & API Contract',
    category: 'Deadline',
    dueDate: 'Oct 18, 2026',
    status: 'In Progress',
    notes: 'Shared staging link and authentication flow diagrams.',
  },
  {
    id: 'ctask-4',
    clientCompany: 'Nova Labs',
    title: 'Series A Brand Positioning & Visual Identity Proposal Sign-off',
    category: 'Project Update',
    dueDate: 'Oct 15, 2026',
    status: 'Pending',
    notes: 'Added custom pitch deck template to Phase 3 deliverables.',
  },
];

export const INITIAL_MEETINGS: ScheduledMeetingItem[] = [
  {
    id: 'meet-1',
    title: 'Website Redesign Proposal Walkthrough & Scope Review',
    clientCompany: 'Acme Studio',
    clientName: 'Hannah Lin',
    clientEmail: 'hannah@acmestudio.co',
    type: 'Proposal Walkthrough',
    date: '2026-10-14',
    time: '2:00 PM',
    durationMinutes: 45,
    timezone: 'PST (UTC-7)',
    platform: 'Google Meet',
    meetingLink: 'https://meet.google.com/zen-acme-scop',
    agenda:
      'Walk through the 4-week website redesign scope, discuss Phase 3 CMS deliverables, review pricing line items, and align on next steps.',
    proposalId: 'prop-acme-web',
    proposalTitle: 'Website Redesign',
    status: 'Scheduled',
  },
  {
    id: 'meet-2',
    title: 'Monthly CRO Growth Retainer Scope & 30-Day Plan Review',
    clientCompany: 'Orbit Co.',
    clientName: 'Elena Rostova',
    clientEmail: 'elena@orbitanalytics.io',
    type: 'Project Kickoff',
    date: '2026-10-15',
    time: '11:00 AM',
    durationMinutes: 30,
    timezone: 'PST (UTC-7)',
    platform: 'Google Meet',
    meetingLink: 'https://meet.google.com/zen-orbit-cro',
    agenda:
      'Meet with Elena and VP of Growth to confirm sprint allocations, metrics benchmarks, and kickoff schedule.',
    proposalId: 'prop-orbit-retainer',
    proposalTitle: 'Growth & Design Retainer',
    status: 'Scheduled',
  },
  {
    id: 'meet-3',
    title: 'Horizon Ventures Discovery Call & Investor Portal Scoping',
    clientCompany: 'Horizon Ventures',
    clientName: 'Claire Bennett',
    clientEmail: 'claire@horizonvc.com',
    type: 'Discovery Call',
    date: '2026-10-16',
    time: '3:30 PM',
    durationMinutes: 30,
    timezone: 'PST (UTC-7)',
    platform: 'Google Meet',
    meetingLink: 'https://meet.google.com/zen-hrzn-disc',
    agenda:
      'Initial discovery call to understand LP onboarding friction, investor portal information architecture, and target timeline.',
    status: 'Scheduled',
  },
  {
    id: 'meet-4',
    title: 'Client Portal MVP Prototype & UI Component Review',
    clientCompany: 'Northstar Labs',
    clientName: 'David Chen',
    clientEmail: 'david@northstarlabs.dev',
    type: 'Design Review',
    date: '2026-10-12',
    time: '10:00 AM',
    durationMinutes: 45,
    timezone: 'PST (UTC-7)',
    platform: 'Zoom',
    meetingLink: 'https://zoom.us/j/94820148201',
    agenda:
      'Live walkthrough of responsive desktop and mobile dashboards, dark theme components, and developer handoff guidelines.',
    status: 'Completed',
  },
];

