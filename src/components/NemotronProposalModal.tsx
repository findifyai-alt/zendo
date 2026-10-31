import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Cpu,
  BrainCircuit,
  Eye,
  CheckCircle2,
  Upload,
  ArrowRight,
  FileText,
  DollarSign,
  Clock,
  Palette,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import { PROPOSAL_THEMES, ProposalThemeKey } from '../data/proposalThemes';
import {
  parseDocumentWithNemotron,
  analyzeAndDesignProposalWithNemotron,
  NemotronParseElement,
} from '../lib/api';
import { ProposalItem } from '../data/zendoProposalsData';

interface NemotronProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProposal: (newProposal: ProposalItem) => void;
  initialTemplateKey?: ProposalThemeKey;
  workspaceCompanyName?: string;
}

export const NemotronProposalModal: React.FC<NemotronProposalModalProps> = ({
  isOpen,
  onClose,
  onApplyProposal,
  initialTemplateKey = 'executive-skyline',
  workspaceCompanyName = 'Zendo Studio',
}) => {
  const [activeStep, setActiveStep] = useState<'select' | 'parse' | 'design'>('select');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<ProposalThemeKey>(initialTemplateKey);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>(
    PROPOSAL_THEMES[initialTemplateKey]?.screenshotPath || ''
  );

  // Parse state
  const [isParsing, setIsParsing] = useState(false);
  const [parsedElements, setParsedElements] = useState<NemotronParseElement[]>([]);
  const [extractedRawText, setExtractedRawText] = useState('');
  const [parseSummary, setParseSummary] = useState<any>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  // Design / Client context state
  const [clientCompany, setClientCompany] = useState('Acme Corp');
  const [clientName, setClientName] = useState('Hannah Lin');
  const [industry, setIndustry] = useState('Digital & Tech');
  const [projectTitle, setProjectTitle] = useState('Digital Transformation & Growth');
  const [budget, setBudget] = useState('$18,000');
  const [timeline, setTimeline] = useState('6 weeks');
  const [desiredTone, setDesiredTone] = useState<'Professional' | 'Premium' | 'Friendly' | 'Direct'>('Premium');
  const [briefText, setBriefText] = useState(
    'Client wants to overhaul their brand positioning, modernize customer acquisition funnels, and launch a fast-loading digital platform.'
  );

  // Generated Proposal & Reasoning state
  const [isDesigning, setIsDesigning] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<any>(null);
  const [reasoningProcess, setReasoningProcess] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle custom image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCustomImageBase64(b64);
      setPreviewImageUrl(b64);
    };
    reader.readAsDataURL(file);
  };

  // Select predefined template
  const handleSelectTemplate = (key: ProposalThemeKey) => {
    setSelectedTemplateKey(key);
    setCustomImageBase64(null);
    setPreviewImageUrl(PROPOSAL_THEMES[key]?.screenshotPath || '');
  };

  // Step 2: Run Nemotron Parse API
  const handleRunNemotronParse = async () => {
    setIsParsing(true);
    setParseError(null);
    try {
      const res = await parseDocumentWithNemotron({
        templateKey: customImageBase64 ? undefined : selectedTemplateKey,
        imageBase64: customImageBase64 || undefined,
      });

      if (res.success) {
        setParsedElements(res.elements);
        setExtractedRawText(res.rawText);
        setParseSummary(res.layoutSummary);
        setActiveStep('parse');
      } else {
        setParseError(res.error || 'Failed to parse document layout.');
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Unknown error during document parse');
    } finally {
      setIsParsing(false);
    }
  };

  // Step 3: Run Proposal Designer
  const handleSynthesizeProposal = async () => {
    setIsDesigning(true);
    setParseError(null);
    try {
      const res = await analyzeAndDesignProposalWithNemotron({
        parsedElements,
        rawText: extractedRawText,
        clientCompany,
        clientName,
        industry,
        projectTitle,
        budget,
        timeline,
        desiredTone,
        templateStyle: selectedTemplateKey,
        briefText,
      });

      if (res.success && res.proposal) {
        setGeneratedProposal(res.proposal);
        setReasoningProcess(res.reasoning || '');
        setActiveStep('design');
      } else {
        setParseError(res.error || 'Failed to synthesize proposal.');
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Unknown design error');
    } finally {
      setIsDesigning(false);
    }
  };

  // Final Action: Apply to workspace proposal
  const handleApply = () => {
    if (!generatedProposal) return;

    const numericVal = parseInt(budget.replace(/[^0-9]/g, ''), 10) || 12000;
    const finalProposal: ProposalItem = {
      id: `prop-${Date.now().toString(36)}`,
      title: generatedProposal.title || projectTitle,
      clientName,
      clientCompany,
      clientEmail: `${clientName.toLowerCase().replace(/\s+/g, '.')}@${clientCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      industry,
      value: budget,
      numericValue: numericVal,
      status: 'Draft',
      updatedAt: 'Just now',
      style: desiredTone,
      timelineSummary: timeline,
      templateTheme: (generatedProposal.recommendedThemeKey as ProposalThemeKey) || selectedTemplateKey,
      services: (generatedProposal.servicesDeliverables || []).map((d: any) => d.name),
      sections: {
        coverSubtitle: generatedProposal.coverSubtitle || `Strategic proposal prepared for ${clientCompany}`,
        preparedFor: `${clientName} · ${clientCompany}`,
        preparedBy: `Alex Morgan · ${workspaceCompanyName}`,
        dateIssued: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        executiveSummary: generatedProposal.executiveSummary || '',
        clientProblem: generatedProposal.clientProblem || '',
        proposedSolution: generatedProposal.proposedSolution || '',
        servicesDeliverables: (generatedProposal.servicesDeliverables || []).map((d: any, idx: number) => ({
          id: d.id || `del-${idx + 1}`,
          name: d.name || 'Core Deliverable',
          description: d.description || '',
          included: true,
        })),
        timeline: (generatedProposal.timeline || []).map((t: any, idx: number) => ({
          id: t.id || `tl-${idx + 1}`,
          phase: t.phase || `Phase ${idx + 1}`,
          duration: t.duration || '2 weeks',
          deliverable: t.deliverable || 'Milestone delivery',
        })),
        pricingItems: (generatedProposal.pricingItems || []).map((p: any, idx: number) => ({
          id: p.id || `pr-${idx + 1}`,
          item: p.item || 'Service Milestone',
          detail: p.detail || '',
          amount: p.amount || `$${Math.round(numericVal / 3)}`,
        })),
        pricingNote: generatedProposal.pricingNote || '50% upon kick-off, 50% upon final acceptance.',
        termsAndNextSteps: generatedProposal.termsAndNextSteps || 'Click Accept Proposal or schedule a walkthrough to begin.',
      },
    };

    onApplyProposal(finalProposal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 max-w-5xl w-full shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-sky-400 text-slate-950 flex items-center justify-center shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                  Smart Proposal Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Visual Layout & Proposal Designer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Analyze visual layouts, extract hierarchy, and synthesize high-converting proposals.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="bg-[#FAF9F6] border-b border-slate-200/80 px-6 py-3 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveStep('select')}
              className={`flex items-center gap-2 py-1 px-3 rounded-xl transition-all cursor-pointer ${
                activeStep === 'select'
                  ? 'bg-white shadow-xs border border-slate-200 text-[#0F172A]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-mono">
                1
              </span>
              <span>Template & Document</span>
            </button>

            <button
              type="button"
              onClick={() => parsedElements.length > 0 && setActiveStep('parse')}
              disabled={parsedElements.length === 0}
              className={`flex items-center gap-2 py-1 px-3 rounded-xl transition-all ${
                activeStep === 'parse'
                  ? 'bg-white shadow-xs border border-slate-200 text-[#0F172A]'
                  : parsedElements.length > 0
                  ? 'text-slate-600 hover:text-slate-900 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-mono">
                2
              </span>
              <span>Layout Hierarchy</span>
              {parsedElements.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => generatedProposal && setActiveStep('design')}
              disabled={!generatedProposal}
              className={`flex items-center gap-2 py-1 px-3 rounded-xl transition-all ${
                activeStep === 'design'
                  ? 'bg-white shadow-xs border border-slate-200 text-[#0F172A]'
                  : generatedProposal
                  ? 'text-slate-600 hover:text-slate-900 cursor-pointer'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-mono">
                3
              </span>
              <span>Synthesized Proposal</span>
              {generatedProposal && (
                <span className="w-2 h-2 rounded-full bg-purple-500" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Studio Connected
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {parseError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <span className="font-bold">Error:</span>
              <span>{parseError}</span>
            </div>
          )}

          {/* STEP 1: SELECT TEMPLATE OR UPLOAD */}
          {activeStep === 'select' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-base font-bold text-[#0F172A]">
                  Step 1: Choose a Proposal Design or Upload Document Image
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Select one of the 4 tailored proposal design templates provided, or upload your own pitch deck screenshot.
                </p>
              </div>

              {/* 4 Template Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['cyber-onyx', 'executive-skyline', 'bauhaus-purple', 'playful-crayon'] as ProposalThemeKey[]).map((key) => {
                  const t = PROPOSAL_THEMES[key];
                  const isSelected = selectedTemplateKey === key && !customImageBase64;
                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectTemplate(key)}
                      className={`rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/20 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="aspect-3/4 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 relative">
                          <img
                            src={t.screenshotPath}
                            alt={t.name}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {t.category}
                            </span>
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.accentColor }} />
                          </div>
                          <h4 className="font-display text-sm font-bold text-[#0F172A] mt-0.5">
                            {t.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {t.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-indigo-700">
                          {isSelected ? 'Selected' : 'Click to select'}
                        </span>
                        <Palette className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Upload Option */}
              <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0F172A]">
                      Or Upload Custom Document Image
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Upload any PDF page or cover screenshot (PNG / JPEG) to parse visual layout hierarchy.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Choose Image File</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Quick Discovery Inputs */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target Client & Project Discovery Parameters
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Client Company
                    </label>
                    <input
                      type="text"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Client Contact Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Target Budget
                    </label>
                    <input
                      type="text"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Target Timeline
                    </label>
                    <input
                      type="text"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Client Need / Discovery Notes
                  </label>
                  <textarea
                    rows={2}
                    value={briefText}
                    onChange={(e) => setBriefText(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRunNemotronParse}
                  disabled={isParsing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <BrainCircuit className="w-4 h-4" />
                  <span>
                    {isParsing ? 'Parsing Document Layout...' : 'Analyze Document Layout'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PARSE LAYOUT INSPECTOR */}
          {activeStep === 'parse' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <span>Step 2: Document Layout &amp; Visual Hierarchy</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-mono">
                      {parsedElements.length} Elements Detected
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Extracted document bounding boxes, layout classes, and typography tokens.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBoundingBoxes((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      showBoundingBoxes
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showBoundingBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}</span>
                  </button>
                </div>
              </div>

              {/* Layout Visualizer & Extracted Text Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Interactive Image with Bounding Boxes */}
                <div className="lg:col-span-6 bg-slate-950 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden border border-slate-800 min-h-[380px]">
                  <div className="relative max-w-sm w-full">
                    <img
                      src={previewImageUrl}
                      alt="Document Parse Target"
                      className="w-full h-auto rounded-xl shadow-lg border border-slate-800"
                    />

                    {/* SVG Bounding Boxes Overlay */}
                    {showBoundingBoxes && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        {parsedElements.map((elem, i) => {
                          const x = elem.bbox.xmin * 100;
                          const y = elem.bbox.ymin * 100;
                          const w = (elem.bbox.xmax - elem.bbox.xmin) * 100;
                          const h = (elem.bbox.ymax - elem.bbox.ymin) * 100;

                          const strokeColor =
                            elem.type === 'Title'
                              ? '#38BDF8'
                              : elem.type === 'Section-header'
                              ? '#A855F7'
                              : elem.type === 'Picture'
                              ? '#F59E0B'
                              : '#10B981';

                          return (
                            <g key={elem.id || i}>
                              <rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                fill={strokeColor}
                                fillOpacity={0.15}
                                stroke={strokeColor}
                                strokeWidth={1}
                                strokeDasharray={elem.type === 'Picture' ? '2,2' : undefined}
                              />
                            </g>
                          );
                        })}
                      </svg>
                    )}
                  </div>
                </div>

                {/* Right: Layout Hierarchy & Detected Tokens */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Legend */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                      <span className="font-semibold text-slate-700">Title</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                      <span className="font-semibold text-slate-700">Section Header</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                      <span className="font-semibold text-slate-700">Graphic / Picture</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      <span className="font-semibold text-slate-700">Text Content</span>
                    </div>
                  </div>

                  {/* Detected Tokens List */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white max-h-[300px] overflow-y-auto space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Detected Reading Hierarchy:
                    </span>
                    {parsedElements.map((el, idx) => (
                      <div
                        key={el.id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              el.type === 'Title'
                                ? 'bg-sky-100 text-sky-800'
                                : el.type === 'Section-header'
                                ? 'bg-purple-100 text-purple-800'
                                : el.type === 'Picture'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {el.type}
                          </span>
                          <p className="font-semibold text-[#0F172A]">
                            {el.text || '[Graphic visual accent / Illustration element]'}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                          box ({Math.round(el.bbox.xmin * 100)}%, {Math.round(el.bbox.ymin * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                    <strong>Layout Analysis Complete:</strong> The layout structure and design density will guide the proposal structure, timeline phases, and section hierarchy in Step 3.
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('select')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Back to Select
                </button>
                <button
                  type="button"
                  onClick={handleSynthesizeProposal}
                  disabled={isDesigning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isDesigning ? 'Synthesizing Proposal...' : 'Synthesize Proposal Structure'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REASONED PROPOSAL REVIEW */}
          {activeStep === 'design' && generatedProposal && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <span>Step 3: Synthesized Proposal &amp; Strategic Roadmap</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-mono font-bold">
                      Intelligent Synthesis
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tailored for {clientCompany} with {generatedProposal.servicesDeliverables?.length || 4} deliverables and matching visual styling.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReasoning((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>{showReasoning ? 'Hide AI Reasoning' : 'View AI Reasoning Process'}</span>
                    {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Reasoning Process Drawer */}
              {showReasoning && reasoningProcess && (
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-purple-400 font-bold border-b border-slate-800 pb-2">
                    <span>Synthesis Reasoning Chain:</span>
                    <span className="text-[10px] font-normal text-slate-400">Model Thinking Output</span>
                  </div>
                  <pre className="whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed text-slate-300">
                    {reasoningProcess}
                  </pre>
                </div>
              )}

              {/* Synthesized Proposal Overview Box */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                      Recommended Template Style: {generatedProposal.recommendedThemeKey || selectedTemplateKey}
                    </span>
                    <h4 className="font-display text-xl font-bold text-[#0F172A] mt-0.5">
                      {generatedProposal.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {generatedProposal.coverSubtitle}
                    </p>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-sm shrink-0">
                    {budget} · {timeline}
                  </div>
                </div>

                {/* Problem & Solution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                      Client Problem Identified
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {generatedProposal.clientProblem}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Proposed Solution & Strategy
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {generatedProposal.proposedSolution}
                    </p>
                  </div>
                </div>

                {/* Deliverables List */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Scope & Core Deliverables:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(generatedProposal.servicesDeliverables || []).map((del: any, i: number) => (
                      <div key={del.id || i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{del.name}</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1 pl-5">
                          {del.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing & Timeline Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Timeline Phases:
                    </h5>
                    <div className="space-y-1.5 text-xs">
                      {(generatedProposal.timeline || []).map((tl: any, i: number) => (
                        <div key={tl.id || i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-[11px]">
                          <span className="font-semibold text-slate-700">{tl.phase}</span>
                          <span className="font-mono text-slate-500">{tl.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Investment Schedule:
                    </h5>
                    <div className="space-y-1.5 text-xs">
                      {(generatedProposal.pricingItems || []).map((pr: any, i: number) => (
                        <div key={pr.id || i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-[11px]">
                          <span className="font-semibold text-slate-700">{pr.item}</span>
                          <span className="font-mono font-bold text-emerald-700">{pr.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep('parse')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Back to Parse
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSynthesizeProposal}
                    disabled={isDesigning}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#3d614c] text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply & Open in Proposal Editor</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
