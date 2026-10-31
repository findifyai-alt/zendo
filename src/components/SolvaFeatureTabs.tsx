import React, { useState } from 'react';
import {
  FileText,
  Users,
  Zap,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface SolvaFeatureTabsProps {
  onOpenDashboard: () => void;
  onOpenAuth: () => void;
}

export const SolvaFeatureTabs: React.FC<SolvaFeatureTabsProps> = ({
  onOpenDashboard,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'proposals' | 'clients' | 'followups' | 'analytics'>('proposals');

  const tabs = [
    { id: 'proposals' as const, label: 'Proposal Drafting', icon: FileText },
    { id: 'clients' as const, label: 'Client Tracking', icon: Users },
    { id: 'followups' as const, label: 'Automated Follow-ups', icon: Zap },
    { id: 'analytics' as const, label: 'Live Revenue', icon: BarChart2 },
  ];

  const contentMap = {
    proposals: {
      eyebrow: 'AI PROPOSAL DRAFTING',
      headline: 'Proposals that win, drafted in seconds.',
      description: 'Turn your scope and client notes into polished, winning proposals instantly with Zendo AI.',
      features: [
        { title: 'Instant AI Personalization', desc: 'Tailors tone, pricing, and project deliverables for every client.' },
        { title: 'Smart Pricing Tiers', desc: 'Offers flexible packages so clients can choose and upgrade instantly.' },
        { title: 'One-Click Signatures', desc: 'Client-ready web view with frictionless approval and sign-off.' },
      ],
      previewTitle: 'Zendo AI Proposal Builder Dashboard',
      previewRows: [
        { client: 'Acme Corp', project: 'Brand Identity & Web Build', value: '$12,500', status: 'Sent · Viewed', priority: 'High' },
        { client: 'Stellar Labs', project: 'Growth Strategy Audit', value: '$6,800', status: 'Drafting', priority: 'Medium' },
        { client: 'Vortex AI', project: 'Full-Stack App Redesign', value: '$24,000', status: 'Signed & Paid', priority: 'Urgent' },
        { client: 'Northstar Studio', project: 'Design Tokens & UI Kit', value: '$4,500', status: 'Approved', priority: 'Normal' },
      ],
    },
    clients: {
      eyebrow: 'CLIENT WORKSPACE',
      headline: 'Every client relationship, organized and clear.',
      description: 'Keep contacts, projects, communication history, and active billing in one unified client portal.',
      features: [
        { title: 'Unified Client Directory', desc: 'All communications, project files, and proposals in one profile.' },
        { title: 'Industry & Company Tags', desc: 'Instantly filter clients by stage, budget, or service type.' },
        { title: 'Activity & Note Logs', desc: 'Never miss a key detail from client calls or asynchronous notes.' },
      ],
      previewTitle: 'Client CRM Directory',
      previewRows: [
        { client: 'Alex Morgan', company: 'Horizon Studio', industry: 'Design & Creative', email: 'alex@horizon.co', status: 'Active' },
        { client: 'Elena Rostova', company: 'Stellar Media', industry: 'SaaS & Tech', email: 'elena@stellar.io', status: 'Active' },
        { client: 'Marcus Vance', company: 'Vortex Labs', industry: 'Fintech', email: 'marcus@vortex.ai', status: 'Pending' },
        { client: 'Sarah Jenkins', company: 'Greenfield Co.', industry: 'Sustainability', email: 'sarah@greenfield.org', status: 'Active' },
      ],
    },
    followups: {
      eyebrow: 'AUTOMATED FOLLOW-UPS',
      headline: 'Never miss a follow-up or renewal.',
      description: 'Zendo automatically drafts and schedules gentle follow-up reminders so proposals never stall in the inbox.',
      features: [
        { title: 'Smart Trigger Rules', desc: 'Automatically emails follow-ups if a proposal is viewed but not signed.' },
        { title: 'Automated Reminder Queues', desc: 'Keeps your morning priority queue clear of manual checking.' },
        { title: 'Zero Manual Tracking', desc: 'Focuses your energy on closing deals instead of calendar reminders.' },
      ],
      previewTitle: 'Active Follow-up Automation Rules',
      previewRows: [
        { client: 'Acme Corp', rule: 'Viewed 2d without sign', action: 'Send gentle reminder email', status: 'Triggered' },
        { client: 'Stellar Labs', rule: 'Proposal sent 48h ago', action: 'Draft follow-up check-in', status: 'Scheduled' },
        { client: 'Vortex AI', rule: 'Project signed & milestone due', action: 'Notify team lead', status: 'Active' },
      ],
    },
    analytics: {
      eyebrow: 'REVENUE VELOCITY',
      headline: 'Know your revenue pipeline at a glance.',
      description: 'Real-time metrics on win rates, proposal turnaround time, and projected monthly revenue.',
      features: [
        { title: 'Proposal Win Rates', desc: 'Track exactly which services and pricing tiers close the fastest.' },
        { title: 'Revenue Velocity', desc: 'Monitor average days from first draft to signed contract.' },
        { title: 'Weekly Insights', desc: 'Clear summaries to keep your studio financially predictable.' },
      ],
      previewTitle: 'Revenue & Pipeline Analytics',
      previewRows: [
        { metric: 'Proposal Win Rate', value: '78.4%', change: '+12.5%', status: 'Healthy' },
        { metric: 'Average Deal Size', value: '$11,200', change: '+18.2%', status: 'Growing' },
        { metric: 'Avg. Time to Close', value: '4.2 days', change: '-1.5 days', status: 'Fast' },
        { metric: 'Pipeline Revenue', value: '$68,500', change: '+34.0%', status: 'Active' },
      ],
    },
  };

  const current = contentMap[activeTab];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-8 max-w-[1420px] mx-auto">
      {/* Solva-style Top Interactive Tabs Bar */}
      <div className="bg-[#FAF9F5] rounded-[24px] p-2 sm:p-3 border border-[#e1e9e4] shadow-[0_4px_20px_rgba(16,28,25,0.03)] max-w-4xl mx-auto mb-16 flex flex-wrap items-center justify-center gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[#101c19] shadow-[0_2px_12px_rgba(16,28,25,0.08)] border border-[#e1e9e4]'
                  : 'text-[#596960] hover:text-[#101c19] hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#0c9256]' : 'text-[#84968c]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Feature Layout matching Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Copy & Feature Bullets */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f7ee] border border-[#a7dfc1]/50 text-xs font-semibold text-[#087443] tracking-wide uppercase mb-4 self-start">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{current.eyebrow}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-medium tracking-tight text-[#101c19] leading-[1.15] mb-4">
            {current.headline}
          </h2>

          <p className="text-sm sm:text-base text-[#596960] leading-relaxed mb-8 font-normal">
            {current.description}
          </p>

          <div className="space-y-5 mb-8">
            {current.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#e8f7ee] text-[#0c9256] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#101c19] mb-1">{feat.title}</h4>
                  <p className="text-xs sm:text-sm text-[#596960] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenAuth}
            className="self-start px-7 py-3.5 bg-[#101c19] hover:bg-[#1a2d28] text-white text-xs sm:text-sm font-semibold rounded-full shadow-md transition-all inline-flex items-center gap-2"
          >
            <span>Try Zendo Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Column: Gorgeous Window Preview Card over Meadow Background */}
        <div className="lg:col-span-7">
          <div className="relative rounded-[28px] overflow-hidden bg-[#8dc6ec] border border-[#d0e8f5] shadow-[0_12px_40px_rgba(16,28,25,0.08)] p-3 sm:p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#8dc6ec]/90 via-[#c7e5f5]/80 to-[#7dbb4e]/75 pointer-events-none" />

            {/* Inner Dashboard Mockup Window */}
            <div className="relative z-10 bg-white rounded-[20px] shadow-2xl border border-[#e1e9e4] overflow-hidden">
              {/* Window Header */}
              <div className="h-12 bg-[#faf9f5] border-b border-[#e1e9e4] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="text-xs font-medium text-[#596960] ml-2">zendo.ai workspace</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#0c9256] bg-[#e8f7ee] px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#0c9256] animate-pulse" />
                  <span>Live Sync</span>
                </div>
              </div>

              {/* Proposal Tab shows the actual uploaded dashboard screenshot */}
              {activeTab === 'proposals' ? (
                <div className="bg-white p-2">
                  <img
                    src="/assets/aistudio/Zendo_AI_Proposal_Builder_Dashboard_7806e197.png"
                    alt="Zendo AI Proposal Builder Dashboard"
                    className="w-full h-auto rounded-lg shadow-sm border border-[#e1e9e4]"
                  />
                </div>
              ) : (
                /* Table / Preview Content for other tabs */
                <div className="p-5 sm:p-6 bg-white">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f0f4f1]">
                    <div>
                      <h3 className="text-sm font-bold text-[#101c19]">{current.previewTitle}</h3>
                      <p className="text-[11px] text-[#596960]">Showing real-time synced records</p>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenDashboard}
                      className="px-3 py-1.5 rounded-full bg-[#101c19] text-white text-[11px] font-semibold hover:bg-[#1a2d28] transition-colors"
                    >
                      Open Workspace →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {current.previewRows.map((row: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-xs hover:border-[#0c9256]/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#e8f7ee] text-[#087443] flex items-center justify-center font-bold text-[11px]">
                            {row.client ? row.client[0] : 'Z'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#101c19]">{row.client || row.metric}</p>
                            <p className="text-[11px] text-[#596960]">{row.project || row.company || row.rule || row.change}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="font-mono font-semibold text-[#101c19]">{row.value || row.email || row.action}</p>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                row.status === 'Signed & Paid' || row.status === 'Active' || row.status === 'Triggered' || row.status === 'Healthy'
                                  ? 'bg-[#e8f7ee] text-[#087443]'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {row.status || row.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
