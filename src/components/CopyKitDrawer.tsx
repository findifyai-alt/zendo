import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check } from 'lucide-react';
import { ZENDO_COPY } from '../data/zendoCopy';

interface CopyKitDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyHeadline: (headline: string) => void;
  activeHeadline: string;
}

export const CopyKitDrawer: React.FC<CopyKitDrawerProps> = ({
  isOpen,
  onClose,
  onApplyHeadline,
  activeHeadline,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'website' | 'headlines' | 'dashboard' | 'brand'>('website');

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/40 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-label="Zendo Lite Copy & Brand Reference"
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl bg-white h-full border-l border-slate-200 flex flex-col overflow-hidden"
        >
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Zendo Lite</span>
                <span aria-hidden="true">·</span>
                <span>Resources & Copy System</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                Zendo — Website, Dashboard & Auth Copy Kit
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close copy kit"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="px-6 py-3 bg-[#F8FAFC] border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'website', label: 'Website Sections' },
              { id: 'headlines', label: 'Alt Headlines & Taglines' },
              { id: 'dashboard', label: 'Dashboard & Empty States' },
              { id: 'brand', label: 'Login, Signup & Brand' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'website' && (
              <>
                {/* Hero Section Copy */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      01. Hero Section
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'hero-all',
                          `Headline: ${ZENDO_COPY.hero.defaultHeadline}\nSubheadline: ${ZENDO_COPY.hero.subheadline}\nPrimary button: ${ZENDO_COPY.hero.primaryButton}\nSecondary button: ${ZENDO_COPY.hero.secondaryButton}\nSupporting text: ${ZENDO_COPY.hero.supportingText}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      {copiedId === 'hero-all' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy section</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-900 font-semibold">
                      {ZENDO_COPY.hero.defaultHeadline}
                    </p>
                    <p className="text-slate-600">{ZENDO_COPY.hero.subheadline}</p>
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Primary: {ZENDO_COPY.hero.primaryButton}</span>
                      <span aria-hidden="true">·</span>
                      <span>Secondary: {ZENDO_COPY.hero.secondaryButton}</span>
                    </div>
                    <p className="text-xs text-slate-500 pt-1">
                      {ZENDO_COPY.hero.supportingText}
                    </p>
                  </div>
                </div>

                {/* Features Section Copy */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      02. Features Section — {ZENDO_COPY.featuresSection.headline}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'features-all',
                          `${ZENDO_COPY.featuresSection.headline}\n\n` +
                            ZENDO_COPY.featuresSection.items
                              .map((i) => `${i.title}\n${i.description}`)
                              .join('\n\n')
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      {copiedId === 'features-all' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy section</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {ZENDO_COPY.featuresSection.items.map((item) => (
                      <div
                        key={item.index}
                        className="p-3 bg-[#F8FAFC] rounded-lg border border-slate-200/70"
                      >
                        <p className="text-xs font-semibold text-slate-900">
                          {item.index}. {item.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How It Works + Benefits + Social Proof + Pricing + CTA */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      03. How It Works, Benefits, Social Proof, Pricing & CTA
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          'rest-website',
                          `${ZENDO_COPY.howItWorks.headline}\n` +
                            ZENDO_COPY.howItWorks.steps
                              .map((s) => `${s.label}: ${s.description}`)
                              .join('\n') +
                            `\n\n${ZENDO_COPY.benefitsSection.headline}\n${ZENDO_COPY.benefitsSection.description}\n\n` +
                            `${ZENDO_COPY.socialProofSection.headline}\n${ZENDO_COPY.socialProofSection.quote} — ${ZENDO_COPY.socialProofSection.author}, ${ZENDO_COPY.socialProofSection.role}\n\n` +
                            `${ZENDO_COPY.ctaSection.headline}\n${ZENDO_COPY.ctaSection.subheadline}\nButton: ${ZENDO_COPY.ctaSection.button}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8]"
                    >
                      {copiedId === 'rest-website' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy all</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="space-y-3 text-xs text-slate-600">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {ZENDO_COPY.howItWorks.headline}
                      </p>
                      <p className="mt-1">
                        1. Add your work · 2. Set your workflow · 3. Make meaningful progress
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <p className="font-semibold text-slate-900">
                        {ZENDO_COPY.benefitsSection.headline}
                      </p>
                      <p className="mt-0.5">{ZENDO_COPY.benefitsSection.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <p className="font-semibold text-slate-900">
                        {ZENDO_COPY.ctaSection.headline}
                      </p>
                      <p className="mt-0.5">
                        {ZENDO_COPY.ctaSection.subheadline} — [{ZENDO_COPY.ctaSection.button}]
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'headlines' && (
              <>
                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-900">
                    Alternative Hero Headlines (Click to test live on Hero)
                  </span>
                  <div className="space-y-2">
                    {ZENDO_COPY.hero.alternativeHeadlines.map((hl, idx) => (
                      <div
                        key={hl}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-200/80"
                      >
                        <span className="text-sm font-medium text-slate-900">
                          0{idx + 1}. {hl}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onApplyHeadline(hl)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                              activeHeadline === hl
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {activeHeadline === hl ? 'Active on Hero' : 'Preview on Hero'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(`hl-${idx}`, hl)}
                            className="p-1.5 text-slate-500 hover:text-slate-900"
                            aria-label={`Copy headline ${hl}`}
                          >
                            {copiedId === `hl-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-900">
                    One-Line Taglines
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ZENDO_COPY.oneLineTaglines.map((tagline, idx) => (
                      <button
                        key={tagline}
                        type="button"
                        onClick={() => handleCopy(`tag-${idx}`, tagline)}
                        className="flex items-center justify-between p-3 text-left rounded-lg bg-[#F8FAFC] border border-slate-200/80 hover:border-slate-300 transition-colors"
                      >
                        <span className="text-xs font-medium text-slate-800">{tagline}</span>
                        {copiedId === `tag-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-900">
                    Dashboard Greeting & Overview Cards
                  </span>
                  <p className="text-sm font-medium text-slate-900">
                    {ZENDO_COPY.dashboardCopy.welcomeHeading} — Good morning, [Name]. Let’s make today count.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                    {ZENDO_COPY.dashboardCopy.overviewCards.map((card, i) => (
                      <React.Fragment key={card}>
                        <span className="font-medium text-slate-800">{card}</span>
                        {i < ZENDO_COPY.dashboardCopy.overviewCards.length - 1 && (
                          <span aria-hidden="true">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-900">
                    Empty-State Messages
                  </span>
                  <div className="space-y-2">
                    {Object.entries(ZENDO_COPY.dashboardCopy.emptyStates).map(([key, msg]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#F8FAFC] border border-slate-200/80"
                      >
                        <span className="text-xs text-slate-800">{msg}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`empty-${key}`, msg)}
                          className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] shrink-0"
                        >
                          {copiedId === `empty-${key}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'brand' && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      Short Brand Description
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy('brand-desc', ZENDO_COPY.shortBrandDescription)
                      }
                      className="text-xs font-medium text-[#2563EB]"
                    >
                      {copiedId === 'brand-desc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {ZENDO_COPY.shortBrandDescription}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 space-y-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900 block mb-1">
                    Login and Signup Copy
                  </span>
                  <p>Headline: {ZENDO_COPY.authCopy.headline}</p>
                  <p>Subheadline: {ZENDO_COPY.authCopy.subheadline}</p>
                  <p>Email placeholder: {ZENDO_COPY.authCopy.emailPlaceholder}</p>
                  <p>Password placeholder: {ZENDO_COPY.authCopy.passwordPlaceholder}</p>
                  <p>Button: {ZENDO_COPY.authCopy.button}</p>
                  <p>Signup text: {ZENDO_COPY.authCopy.signupText}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
