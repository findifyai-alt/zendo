import React from 'react';
import { ProposalItem } from '../data/zendoProposalsData';
import { PROPOSAL_THEMES, ProposalThemeKey } from '../data/proposalThemes';
import { ZendoLogo } from './ZendoLogo';
import { Building2, Sparkles, Calendar, User, DollarSign, Layers, ShieldCheck } from 'lucide-react';

interface ProposalCoverRendererProps {
  proposal: ProposalItem;
  themeKey?: ProposalThemeKey;
  isEditorPreviewMode?: boolean;
  onUpdateTitle?: (title: string) => void;
  onUpdateSubtitle?: (subtitle: string) => void;
  workspaceCompanyName?: string;
}

export const ProposalCoverRenderer: React.FC<ProposalCoverRendererProps> = ({
  proposal,
  themeKey,
  isEditorPreviewMode = true,
  onUpdateTitle,
  onUpdateSubtitle,
  workspaceCompanyName = 'Zendo Studio',
}) => {
  const currentTheme = themeKey || proposal.templateTheme || 'classic';
  const theme = PROPOSAL_THEMES[currentTheme] || PROPOSAL_THEMES.classic;

  // 1. CYBER ONYX & COBALT (Modern Tech & Digital Strategy)
  if (currentTheme === 'cyber-onyx') {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#090A0F] text-white p-7 sm:p-12 shadow-2xl border border-blue-900/40 min-h-[460px] flex flex-col justify-between select-none">
        {/* Subtle dot matrix pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #3B82F6 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Diagonal Electric Cobalt Geometric Bands */}
        <div className="absolute -bottom-16 -right-16 w-80 sm:w-96 h-80 sm:h-96 pointer-events-none overflow-hidden">
          <div className="w-[140%] h-14 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400 -rotate-45 translate-y-12 translate-x-4 shadow-[0_0_35px_rgba(37,99,235,0.45)]" />
          <div className="w-[140%] h-16 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 -rotate-45 translate-y-20 translate-x-2 shadow-[0_0_25px_rgba(29,78,216,0.4)]" />
          <div className="w-[140%] h-12 bg-gradient-to-r from-[#0E1B38] via-blue-900 to-blue-700 -rotate-45 translate-y-28 translate-x-0" />
        </div>

        {/* Header Bar: Company, Logo, Date */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-widest font-bold text-white block">
                {proposal.clientCompany || workspaceCompanyName}
              </span>
              <span className="text-[10px] text-blue-400 font-mono">PROJECT PROPOSAL · 2026–2030</span>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-slate-400">
            {proposal.sections.dateIssued || 'October 2026'}
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="relative z-10 my-8 sm:my-12 max-w-2xl space-y-4">
          {isEditorPreviewMode ? (
            <>
              <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-[1.05]">
                {proposal.title}
              </h1>
              <div className="flex items-start gap-3 pt-2">
                <div className="w-1.5 h-7 bg-blue-500 rounded-full shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base text-slate-300 font-medium tracking-wide uppercase max-w-xl">
                  {proposal.sections.coverSubtitle || 'Digital Strategy & High-Conversion Growth'}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={proposal.title}
                onChange={(e) => onUpdateTitle?.(e.target.value)}
                placeholder="Proposal Title"
                className="w-full text-2xl sm:text-4xl font-black bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-hidden focus:border-blue-400"
              />
              <input
                type="text"
                value={proposal.sections.coverSubtitle}
                onChange={(e) => onUpdateSubtitle?.(e.target.value)}
                placeholder="Cover Subtitle"
                className="w-full text-sm sm:text-base bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-slate-200 focus:outline-hidden focus:border-blue-400"
              />
            </div>
          )}
        </div>

        {/* Footer Dossier: Prepared By, Duration, Value */}
        <div className="relative z-10 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 sm:gap-10 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Prepared By
              </span>
              <span className="font-semibold text-white">
                {proposal.sections.preparedBy || workspaceCompanyName}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Project Duration
              </span>
              <span className="font-semibold text-blue-400">
                {proposal.timelineSummary || '3 MONTHS'}
              </span>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 font-mono text-xs font-bold">
            {proposal.value}
          </div>
        </div>
      </div>
    );
  }

  // 2. EXECUTIVE SKYLINE & WAVE (Editorial Digital Transformation)
  if (currentTheme === 'executive-skyline') {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#FBFBFD] text-[#0F172A] p-7 sm:p-12 shadow-sm border border-slate-200 min-h-[460px] flex flex-col justify-between select-none">
        {/* Architectural Blue Skyscraper Crest */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2 shadow-xs">
            <Building2 className="w-6 h-6 stroke-[1.8]" />
          </div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-slate-400">
            {workspaceCompanyName}
          </span>
        </div>

        {/* Editorial Title & Subtitle */}
        <div className="relative z-10 my-8 sm:my-10 text-center max-w-xl mx-auto space-y-3">
          {isEditorPreviewMode ? (
            <>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
                {proposal.title}
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-widest text-slate-600 uppercase pt-1">
                {proposal.sections.coverSubtitle || 'DIGITAL TRANSFORMATION PROJECT'}
              </p>
            </>
          ) : (
            <div className="space-y-3 text-center">
              <input
                type="text"
                value={proposal.title}
                onChange={(e) => onUpdateTitle?.(e.target.value)}
                placeholder="Proposal Title"
                className="w-full text-center text-2xl sm:text-4xl font-serif font-bold bg-white border border-slate-200 rounded-xl px-4 py-2 text-[#0F172A] focus:outline-hidden focus:border-blue-500"
              />
              <input
                type="text"
                value={proposal.sections.coverSubtitle}
                onChange={(e) => onUpdateSubtitle?.(e.target.value)}
                placeholder="Subtitle"
                className="w-full text-center text-xs sm:text-sm font-semibold uppercase bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-600 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Bottom Metadata & Fluid Ocean Wave Ribbons in Corners */}
        <div className="relative z-10 pt-4 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-serif font-bold text-[#0F172A]">
            {proposal.clientName}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mt-0.5">
            {proposal.clientCompany} · {proposal.timelineSummary || '6 WEEKS'} · {proposal.value}
          </div>
        </div>

        {/* Wave ribbons in bottom corners */}
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-blue-600/10 pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-gradient-to-tl from-blue-600 via-blue-500 to-sky-400 opacity-90 pointer-events-none blur-xs" />
        <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/20 pointer-events-none" />
      </div>
    );
  }

  // 3. BAUHAUS RHOMBUS & LAVENDER (Modernist Business & Marketing)
  if (currentTheme === 'bauhaus-purple') {
    return (
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white text-[#1E2124] p-7 sm:p-12 shadow-sm border border-purple-200/60 min-h-[460px] flex flex-col justify-between select-none">
        {/* Right side dynamic 45-degree diamond/rhombus cascade */}
        <div className="absolute -right-12 top-10 w-64 h-full pointer-events-none hidden sm:block">
          <div className="w-28 h-28 bg-[#7C6FB0] rotate-45 rounded-lg shadow-lg opacity-90 mb-4 ml-12" />
          <div className="w-32 h-32 bg-[#1E2124] rotate-45 rounded-lg shadow-xl -mt-8 ml-4" />
          <div className="w-24 h-24 bg-[#9D93C9] rotate-45 rounded-lg shadow-md -mt-6 ml-20 opacity-80" />
          <div className="w-28 h-28 bg-[#1E2124] rotate-45 rounded-lg shadow-xl -mt-6 ml-10" />
        </div>

        {/* Top Header Tag */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-[#7C6FB0] font-bold">
            {workspaceCompanyName}
          </span>
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700">
            {proposal.value}
          </span>
        </div>

        {/* Title: Big Bold Bauhaus Typography */}
        <div className="relative z-10 my-6 sm:my-10 max-w-md space-y-2">
          {isEditorPreviewMode ? (
            <>
              <h1 className="font-display text-4xl sm:text-6xl font-black text-[#1E2124] tracking-tight uppercase leading-none">
                {proposal.title}
              </h1>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 pt-2">
                {proposal.sections.coverSubtitle || 'BUSINESS & MARKETING STRATEGY'}
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={proposal.title}
                onChange={(e) => onUpdateTitle?.(e.target.value)}
                placeholder="PROPOSAL"
                className="w-full text-3xl sm:text-5xl font-black uppercase bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[#1E2124] focus:outline-hidden focus:border-purple-600"
              />
              <input
                type="text"
                value={proposal.sections.coverSubtitle}
                onChange={(e) => onUpdateSubtitle?.(e.target.value)}
                placeholder="Subtitle"
                className="w-full text-xs sm:text-sm font-bold uppercase bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-600 focus:outline-hidden focus:border-purple-600"
              />
            </div>
          )}
        </div>

        {/* Prepared For Dossier Card */}
        <div className="relative z-10 pt-4 border-t border-slate-100 flex items-end justify-between">
          <div className="space-y-1 text-xs">
            <span className="font-bold text-[#1E2124] tracking-wide block">Prepared For :</span>
            <span className="font-medium text-slate-700 block">
              {proposal.clientName} ({proposal.clientCompany})
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">
              {proposal.clientEmail || 'Client Workspace'}
            </span>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            {proposal.timelineSummary || '5 WEEKS'}
          </div>
        </div>
      </div>
    );
  }

  // 4. PLAYFUL CRAYON & PASTEL (Creative Support & Workshop)
  if (currentTheme === 'playful-crayon') {
    return (
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#FAFBF9] text-[#1E293B] p-7 sm:p-12 shadow-sm border border-emerald-200/70 min-h-[460px] flex flex-col justify-between select-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {/* Playful torn paper doodle shapes in perimeter */}
        <div className="absolute top-2 left-2 w-10 h-10 rounded-2xl bg-lime-300/60 rotate-12 pointer-events-none" />
        <div className="absolute top-3 right-3 w-12 h-12 rounded-xl bg-pink-400/50 -rotate-6 pointer-events-none" />
        <div className="absolute bottom-4 left-3 w-11 h-11 rounded-full bg-sky-400/40 rotate-45 pointer-events-none" />
        <div className="absolute bottom-3 right-4 w-14 h-8 rounded-lg bg-amber-300/70 rotate-6 pointer-events-none" />

        {/* Author Badge Pill */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-2">
          <div className="px-4 py-1.5 rounded-lg bg-[#BEF264] text-[#166534] font-display font-bold text-xs uppercase tracking-wider shadow-xs rotate-[-1deg]">
            {proposal.sections.preparedBy || workspaceCompanyName}
          </div>
        </div>

        {/* Playful Headline & Subtitle */}
        <div className="relative z-10 my-8 sm:my-10 text-center max-w-xl mx-auto space-y-4">
          {isEditorPreviewMode ? (
            <>
              <h1 className="font-display text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight uppercase leading-tight">
                {proposal.title}
              </h1>
              <div className="inline-block px-4 py-2 rounded-xl bg-[#FBCFE8] text-[#9D174D] font-display font-bold text-xs sm:text-sm tracking-wide uppercase shadow-xs rotate-[1deg]">
                {proposal.sections.coverSubtitle || 'NEW STRATEGIES FOR COMMUNITY SUPPORT'}
              </div>
            </>
          ) : (
            <div className="space-y-3 text-center">
              <input
                type="text"
                value={proposal.title}
                onChange={(e) => onUpdateTitle?.(e.target.value)}
                placeholder="PROJECT PROPOSAL"
                className="w-full text-center text-2xl sm:text-4xl font-display font-black uppercase bg-white border border-slate-200 rounded-xl px-4 py-2 text-[#0F172A] focus:outline-hidden focus:border-lime-500"
              />
              <input
                type="text"
                value={proposal.sections.coverSubtitle}
                onChange={(e) => onUpdateSubtitle?.(e.target.value)}
                placeholder="Subtitle"
                className="w-full text-center text-xs sm:text-sm font-bold uppercase bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-hidden focus:border-pink-500"
              />
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 pt-4 flex items-center justify-between text-xs text-slate-600">
          <span className="font-bold text-[#0F172A]">
            Client: {proposal.clientCompany}
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-slate-200 font-mono font-semibold text-emerald-800 shadow-2xs">
            {proposal.value} · {proposal.timelineSummary || '4 WEEKS'}
          </span>
        </div>
      </div>
    );
  }

  // 5. CLASSIC CALM ZENDO (Default fallback)
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0F172A] text-white p-7 sm:p-12 shadow-sm min-h-[440px] flex flex-col justify-between select-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4b735c] flex items-center justify-center">
            <ZendoLogo className="w-5 h-5" color="#FFFFFF" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-slate-300">
            {workspaceCompanyName} · Proposal Document
          </span>
        </div>
        <span className="text-xs font-mono text-[#4ADE80] bg-white/10 px-3 py-1 rounded-lg">
          {proposal.value}
        </span>
      </div>

      <div className="my-8 max-w-2xl space-y-3">
        {isEditorPreviewMode ? (
          <>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {proposal.title}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2">
              {proposal.sections.coverSubtitle}
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={proposal.title}
              onChange={(e) => onUpdateTitle?.(e.target.value)}
              placeholder="Title"
              className="w-full text-2xl sm:text-3xl font-bold bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-hidden focus:border-[#4b735c]"
            />
            <input
              type="text"
              value={proposal.sections.coverSubtitle}
              onChange={(e) => onUpdateSubtitle?.(e.target.value)}
              placeholder="Subtitle"
              className="w-full text-sm sm:text-base bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-slate-200 focus:outline-hidden focus:border-[#4b735c]"
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div>
          Client: <strong className="text-white">{proposal.clientCompany}</strong> ({proposal.clientName})
        </div>
        <div>
          Valid until: <strong className="text-white">{proposal.sections.validUntil}</strong>
        </div>
      </div>
    </div>
  );
};
