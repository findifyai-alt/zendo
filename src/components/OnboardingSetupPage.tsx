import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Upload,
  Building2,
  Briefcase,
  Palette,
  Users,
  DollarSign,
  Sliders,
  Plus,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ZENDO_COPY } from '../data/zendoCopy';
import { ZendoLogo } from './ZendoLogo';

export interface WorkspaceOnboardingConfig {
  companyName: string;
  industry: string;
  services: string[];
  brandColor: string;
  logoUrl: string | null;
  logoMonogram: string;
  clientType: string;
  currency: 'USD ($)' | 'EUR (€)' | 'GBP (£)' | 'CAD ($)' | 'AUD ($)' | 'INR (₹)';
  proposalTone: 'Professional' | 'Friendly' | 'Premium';
}

interface OnboardingSetupPageProps {
  userName: string;
  initialWorkspaceName?: string;
  initialConfig?: WorkspaceOnboardingConfig;
  onComplete: (config: WorkspaceOnboardingConfig) => void;
  onSkipToDashboard: () => void;
  onBackToHome: () => void;
}

const INDUSTRY_OPTIONS = [
  'Design & Creative Studio',
  'Software & AI Engineering',
  'Marketing & Growth Agency',
  'Management Consulting',
  'Product & UX Consultancy',
  'Architecture & Interior Studio',
];

const DEFAULT_SERVICES = [
  'Brand Strategy & Identity',
  'UI/UX & Product Design',
  'Full-Stack Web Development',
  'AI Workflow Automation',
  'Growth & Paid Media Retainer',
  'Conversion Rate Optimization',
  'Design System Architecture',
  'Custom LLM Integration',
];

const CLIENT_TYPE_OPTIONS = [
  {
    id: 'Early-Stage Startups',
    badge: 'Fast turnaround',
    desc: 'Seed to Series A founders needing rapid product & growth execution.',
  },
  {
    id: 'Mid-Market B2B',
    badge: 'Most popular',
    desc: 'Scaling companies with structured scope and department budgets.',
  },
  {
    id: 'Enterprise Teams',
    badge: 'High-value',
    desc: 'Multi-stakeholder organizations requiring detailed milestones & SLAs.',
  },
  {
    id: 'Founders & SMBs',
    badge: 'Direct decision',
    desc: 'Owner-led businesses seeking clear ROI and transparent pricing.',
  },
];

const BRAND_COLORS = [
  { name: 'Botanical Sage', hex: '#3b664e' },
  { name: 'Emerald Flow', hex: '#0c9256' },
  { name: 'Obsidian Slate', hex: '#18221d' },
  { name: 'Royal Cobalt', hex: '#1d4ed8' },
  { name: 'Editorial Plum', hex: '#6d28d9' },
  { name: 'Warm Terracotta', hex: '#c2410c' },
];

const CURRENCY_OPTIONS: {
  id: WorkspaceOnboardingConfig['currency'];
  code: string;
  symbol: string;
}[] = [
  { id: 'USD ($)', code: 'USD', symbol: '$' },
  { id: 'EUR (€)', code: 'EUR', symbol: '€' },
  { id: 'GBP (£)', code: 'GBP', symbol: '£' },
  { id: 'CAD ($)', code: 'CAD', symbol: 'CA$' },
  { id: 'AUD ($)', code: 'AUD', symbol: 'A$' },
  { id: 'INR (₹)', code: 'INR', symbol: '₹' },
];

const TONE_OPTIONS: {
  id: WorkspaceOnboardingConfig['proposalTone'];
  title: WorkspaceOnboardingConfig['proposalTone'];
  badge: string;
  tagline: string;
}[] = [
  {
    id: 'Professional',
    title: 'Professional',
    badge: 'Executive & ROI',
    tagline: 'Structured, clear, and outcome-driven for B2B decision-makers.',
  },
  {
    id: 'Friendly',
    title: 'Friendly',
    badge: 'Warm & Collaborative',
    tagline: 'Approachable, human, and partnership-oriented.',
  },
  {
    id: 'Premium',
    title: 'Premium',
    badge: 'Bespoke & Editorial',
    tagline: 'Refined, high-touch language for flagship retainers and studios.',
  },
];

export const OnboardingSetupPage: React.FC<OnboardingSetupPageProps> = ({
  userName,
  initialWorkspaceName = 'Northstar Studio',
  initialConfig,
  onComplete,
  onSkipToDashboard,
  onBackToHome,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [companyName, setCompanyName] = useState(
    initialConfig?.companyName || initialWorkspaceName || 'Northstar Studio'
  );
  const [industry, setIndustry] = useState(
    initialConfig?.industry || INDUSTRY_OPTIONS[0]
  );
  const [services, setServices] = useState<string[]>(
    initialConfig?.services || [
      'Brand Strategy & Identity',
      'UI/UX & Product Design',
      'AI Workflow Automation',
    ]
  );
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [brandColor, setBrandColor] = useState(
    initialConfig?.brandColor || '#3b664e'
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(
    initialConfig?.logoUrl || null
  );
  const [clientType, setClientType] = useState(
    initialConfig?.clientType || CLIENT_TYPE_OPTIONS[1].id
  );
  const [currency, setCurrency] = useState<
    WorkspaceOnboardingConfig['currency']
  >(initialConfig?.currency || 'USD ($)');
  const [proposalTone, setProposalTone] = useState<
    WorkspaceOnboardingConfig['proposalTone']
  >(initialConfig?.proposalTone || 'Professional');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const logoMonogram =
    companyName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || 'ZS';

  const toggleService = (service: string) => {
    setServices((prev) =>
      prev.includes(service)
        ? prev.length > 1
          ? prev.filter((s) => s !== service)
          : prev
        : [...prev, service]
    );
  };

  const handleAddCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (!trimmed) return;
    if (!services.includes(trimmed)) {
      setServices((prev) => [...prev, trimmed]);
    }
    setCustomServiceInput('');
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinishSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onComplete({
        companyName: companyName.trim() || 'Northstar Studio',
        industry,
        services,
        brandColor,
        logoUrl,
        logoMonogram,
        clientType,
        currency,
        proposalTone,
      });
    }, 180);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-[#18221d] flex flex-col justify-between selection:bg-[#3b664e]/15 selection:text-[#2b4f3b]">
      {/* =====================================================================
          TOP NAVIGATION BAR (Brand — 2-Step Indicator — Skip)
      ===================================================================== */}
      <header className="w-full h-[68px] sm:h-[74px] px-6 sm:px-10 lg:px-14 flex items-center justify-between border-b border-[#e2eae4] bg-white/90 backdrop-blur-md sticky top-0 z-30 shrink-0">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2.5 text-[21px] font-bold tracking-[-0.03em] text-[#18221d] whitespace-nowrap cursor-pointer group"
        >
          <ZendoLogo
            className="w-7 h-7 sm:w-[30px] sm:h-[30px] shrink-0 transition-transform group-hover:scale-105"
            color="#3b664e"
          />
          <span>{ZENDO_COPY.brandName}</span>
        </button>

        {/* Zone 2: Interactive 2-Step Segmented Switcher */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#eef3ef] p-1 rounded-full border border-[#d8e2da]">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              step === 1
                ? 'bg-white text-[#18221d] shadow-2xs'
                : 'text-[#526058] hover:text-[#18221d]'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                step > 1
                  ? 'bg-[#3b664e] text-white'
                  : step === 1
                  ? 'bg-[#18221d] text-white'
                  : 'bg-[#d5e0d8] text-[#4a5650]'
              }`}
            >
              {step > 1 ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '1'}
            </span>
            <span>Business & Services</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              step === 2
                ? 'bg-white text-[#18221d] shadow-2xs'
                : 'text-[#526058] hover:text-[#18221d]'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                step === 2
                  ? 'bg-[#18221d] text-white'
                  : 'bg-[#d5e0d8] text-[#4a5650]'
              }`}
            >
              2
            </span>
            <span>Brand, Currency & Tone</span>
          </button>
        </div>

        {/* Zone 3: Quick Skip to Workspace */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#5c6862]">
            <Clock className="w-3.5 h-3.5 text-[#3b664e]" />
            <span>Less than a minute</span>
          </span>
          <button
            type="button"
            onClick={onSkipToDashboard}
            className="px-4 py-2 text-[12.5px] font-semibold text-[#23352b] bg-[#e2ece4] hover:bg-[#d4e3d7] border border-[#cedbd0] rounded-full transition-colors whitespace-nowrap cursor-pointer"
          >
            Skip to Dashboard →
          </button>
        </div>
      </header>

      {/* Progress Line */}
      <div className="w-full h-1 bg-[#e5ede7] overflow-hidden shrink-0">
        <div
          style={{
            width: step === 1 ? '50%' : '100%',
            backgroundColor: brandColor,
          }}
          className="h-full transition-all duration-300"
        />
      </div>

      {/* =====================================================================
          CENTERED WORKING SETUP CARD (NO SIDE IMAGE)
      ===================================================================== */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-14">
        <div className="w-full max-w-[680px] bg-white rounded-[24px] border border-[#dce4de] shadow-[0_16px_48px_rgba(20,34,26,0.05)] p-6 sm:p-10">
          {/* Heading & Subheading */}
          <div className="mb-7 pb-6 border-b border-[#edf2ee]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b664e]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Welcome, {userName} · Step {step} of 2</span>
              </span>
              <span className="text-xs font-mono text-[#6d7972] tabular-nums">
                {step === 1 ? '50% complete' : '100% complete'}
              </span>
            </div>

            <h1 className="text-[28px] sm:text-[34px] font-bold tracking-[-0.03em] text-[#18221d] leading-[1.12]">
              Let’s create your first winning proposal.
            </h1>
            <p className="text-[14.5px] text-[#5c6862] mt-2 leading-relaxed">
              Set up your company details, services, brand identity, currency,
              and proposal tone so your workspace is ready immediately.
            </p>
          </div>

          <form onSubmit={handleFinishSetup} noValidate>
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 ? (
                <motion.div
                  key="onboarding-step-1"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-6"
                >
                  {/* 1. Business or company name */}
                  <div>
                    <label
                      htmlFor="setup-company-name"
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-[#232e28] mb-2"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#3b664e]" />
                      <span>Business or company name</span>
                    </label>
                    <div className="relative">
                      <input
                        id="setup-company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter your business or company name"
                        required
                        className="w-full h-[46px] pl-4 pr-10 text-[14px] bg-[#f8faf8] focus:bg-white border border-[#dce2dd] rounded-[11px] text-[#18221d] placeholder:text-[#8a968f] focus:border-[#3b664e] focus:outline-none transition-colors"
                      />
                      {companyName.trim().length > 1 && (
                        <span className="w-[18px] h-[18px] rounded-full bg-[#e3efe7] border border-[#548266] text-[#3b664e] flex items-center justify-center absolute right-3.5 top-1/2 -translate-y-1/2">
                          <Check className="w-2.5 h-2.5 stroke-[2.6]" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Industry */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#232e28] mb-2">
                      <Briefcase className="w-3.5 h-3.5 text-[#3b664e]" />
                      <span>Industry</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INDUSTRY_OPTIONS.map((ind) => {
                        const active = industry === ind;
                        return (
                          <button
                            key={ind}
                            type="button"
                            onClick={() => setIndustry(ind)}
                            className={`px-3.5 py-2.5 rounded-[10px] text-xs font-medium border text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                              active
                                ? 'bg-[#e3efe7] border-[#3b664e] text-[#18221d] font-semibold'
                                : 'bg-[#f8faf8] border-[#dce2dd] text-[#526058] hover:bg-white hover:border-[#b5c4b9]'
                            }`}
                          >
                            <span className="truncate">{ind}</span>
                            {active && (
                              <Check className="w-3.5 h-3.5 text-[#3b664e] shrink-0 stroke-[2.5]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Services offered */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[13px] font-semibold text-[#232e28]">
                        Services offered
                      </label>
                      <span className="text-[11.5px] font-medium text-[#3b664e] tabular-nums">
                        {services.length} selected
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set([...DEFAULT_SERVICES, ...services])
                      ).map((srv) => {
                        const isSelected = services.includes(srv);
                        return (
                          <button
                            key={srv}
                            type="button"
                            onClick={() => toggleService(srv)}
                            className={`px-3.5 py-2 rounded-[10px] text-xs font-medium border transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                              isSelected
                                ? 'bg-[#18221d] border-[#18221d] text-white'
                                : 'bg-[#f8faf8] border-[#dce2dd] text-[#526058] hover:bg-white hover:border-[#b5c4b9]'
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3 h-3 text-[#81c995] stroke-[2.8]" />
                            ) : (
                              <Plus className="w-3 h-3 text-[#8a968f]" />
                            )}
                            <span>{srv}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
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
                        placeholder="Add another service..."
                        className="flex-1 h-9 px-3.5 text-xs bg-[#f8faf8] focus:bg-white border border-[#dce2dd] rounded-[9px] text-[#18221d] placeholder:text-[#8a968f] focus:border-[#3b664e] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomService}
                        className="h-9 px-3.5 bg-[#f8faf8] hover:bg-[#eef4f0] border border-[#dce2dd] rounded-[9px] text-xs font-semibold text-[#3b664e] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Typical client type */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#232e28] mb-2">
                      <Users className="w-3.5 h-3.5 text-[#3b664e]" />
                      <span>Typical client type</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {CLIENT_TYPE_OPTIONS.map((item) => {
                        const active = clientType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setClientType(item.id)}
                            className={`p-3.5 rounded-[11px] border text-left transition-all cursor-pointer ${
                              active
                                ? 'bg-[#e3efe7]/85 border-[#3b664e]'
                                : 'bg-[#f8faf8] border-[#dce2dd] hover:bg-white hover:border-[#b5c4b9]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#18221d]">
                                {item.id}
                              </span>
                              <span className="text-[10.5px] font-medium text-[#4a5650]">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#5c6862] mt-1 leading-snug">
                              {item.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 1 Buttons */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="group w-full sm:flex-1 h-[48px] px-6 bg-[#3b664e] hover:bg-[#315641] text-white text-[14.5px] font-medium rounded-[11px] shadow-[0_4px_14px_rgba(59,102,78,0.22)] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <span>Continue to Step 2</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto h-[48px] px-5 bg-[#f4f7f4] hover:bg-[#e7efe9] text-[#23352b] border border-[#cedbd0] text-[13px] font-semibold rounded-[11px] transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Set Up My Workspace
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="onboarding-step-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-6"
                >
                  {/* 5. Brand color and logo */}
                  <div className="p-4 sm:p-5 rounded-[14px] bg-[#f8faf8] border border-[#dce2dd] space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#232e28]">
                        <Palette className="w-3.5 h-3.5 text-[#3b664e]" />
                        <span>Brand color and logo</span>
                      </label>
                      <span className="text-[11px] font-mono text-[#5c6862]">
                        {brandColor.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Color Swatches */}
                      <div>
                        <p className="text-[11.5px] text-[#5c6862] mb-2">
                          Brand color
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {BRAND_COLORS.map((c) => {
                            const selected =
                              brandColor.toLowerCase() === c.hex.toLowerCase();
                            return (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => setBrandColor(c.hex)}
                                title={c.name}
                                style={{ backgroundColor: c.hex }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                                  selected
                                    ? 'ring-2 ring-offset-2 ring-[#18221d] scale-105'
                                    : 'hover:scale-105'
                                }`}
                              >
                                {selected && (
                                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                )}
                              </button>
                            );
                          })}
                          <label
                            title="Pick custom brand color"
                            className="w-8 h-8 rounded-full border border-[#dce2dd] bg-white hover:bg-[#eef4f0] flex items-center justify-center text-[10px] font-semibold text-[#4a5650] cursor-pointer relative overflow-hidden"
                          >
                            <input
                              type="color"
                              value={brandColor}
                              onChange={(e) => setBrandColor(e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                            <span>+</span>
                          </label>
                        </div>
                      </div>

                      {/* Logo Upload */}
                      <div>
                        <p className="text-[11.5px] text-[#5c6862] mb-2">
                          Company logo
                        </p>
                        <div className="flex items-center gap-3">
                          <div
                            style={{ backgroundColor: brandColor }}
                            className="w-10 h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs"
                          >
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt="Uploaded brand logo"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{logoMonogram}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleLogoFileChange}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#e5efe8] border border-[#d4dfd7] text-xs font-medium text-[#18221d] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Upload className="w-3.5 h-3.5 text-[#3b664e]" />
                              <span>Upload Logo</span>
                            </button>
                            {logoUrl && (
                              <button
                                type="button"
                                onClick={() => setLogoUrl(null)}
                                className="p-1.5 text-[#6d7972] hover:text-[#18221d] rounded-lg cursor-pointer"
                                title="Remove custom logo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. Currency */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#232e28] mb-2">
                      <DollarSign className="w-3.5 h-3.5 text-[#3b664e]" />
                      <span>Currency</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {CURRENCY_OPTIONS.map((curr) => {
                        const active = currency === curr.id;
                        return (
                          <button
                            key={curr.id}
                            type="button"
                            onClick={() => setCurrency(curr.id)}
                            className={`py-2.5 px-3 rounded-[10px] text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer whitespace-nowrap ${
                              active
                                ? 'bg-[#e3efe7] border-[#3b664e] text-[#18221d]'
                                : 'bg-[#f8faf8] border-[#dce2dd] text-[#5c6862] hover:bg-white hover:border-[#b5c4b9]'
                            }`}
                          >
                            <span className="text-[13px] font-bold text-[#18221d] font-mono">
                              {curr.symbol}
                            </span>
                            <span className="text-[10.5px] text-[#5c6862]">
                              {curr.code}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 7. Proposal tone: Professional, Friendly, Premium */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#232e28] mb-2">
                      <Sliders className="w-3.5 h-3.5 text-[#3b664e]" />
                      <span>Proposal tone</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {TONE_OPTIONS.map((tone) => {
                        const active = proposalTone === tone.id;
                        return (
                          <button
                            key={tone.id}
                            type="button"
                            onClick={() => setProposalTone(tone.id)}
                            className={`p-3.5 rounded-[12px] border text-left transition-all cursor-pointer ${
                              active
                                ? 'bg-[#e3efe7]/90 border-[#3b664e]'
                                : 'bg-[#f8faf8] border-[#dce2dd] hover:bg-white hover:border-[#b5c4b9]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-bold text-[#18221d]">
                                {tone.title}
                              </span>
                              {active && (
                                <span className="w-4 h-4 rounded-full bg-[#3b664e] text-white flex items-center justify-center shrink-0">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] font-medium text-[#3b664e] mt-0.5">
                              {tone.badge}
                            </p>
                            <p className="text-[11px] text-[#5c6862] mt-1.5 leading-snug">
                              {tone.tagline}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2 Submit Actions */}
                  <div className="pt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="h-[48px] px-4 bg-[#f8faf8] hover:bg-[#eef4f0] border border-[#dce2dd] rounded-[11px] text-xs font-semibold text-[#4a5650] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group flex-1 h-[48px] px-7 bg-[#3b664e] hover:bg-[#315641] active:scale-[0.995] text-white text-[14.5px] font-medium rounded-[11px] shadow-[0_4px_14px_rgba(59,102,78,0.22)] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <span>
                        {isSubmitting
                          ? 'Setting Up Workspace...'
                          : 'Set Up My Workspace'}
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Bottom Security & Settings Note */}
          <div className="mt-7 pt-5 border-t border-[#edf2ee] flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#6d7972]">
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3b664e]" />
              <span>You can update these settings anytime in your workspace</span>
            </div>
            <span>Step {step} of 2</span>
          </div>
        </div>
      </main>
    </div>
  );
};
