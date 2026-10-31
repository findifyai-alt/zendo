import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Check,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  FileText,
  CreditCard,
  Briefcase,
  Layers,
  Globe,
  Building2,
  SlidersHorizontal,
  Clock,
  Sparkles,
  X,
  Send,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { SupabaseClientRow } from '../lib/supabase';
import { ProposalItem } from '../data/zendoProposalsData';
import {
  ClientMetadata,
  getClientMetadata,
  saveClientMetadata,
  addClientActivityNote,
} from '../lib/clientMetadata';
import { ClientLogoPicker } from './ClientLogoPicker';

interface ClientStoreViewProps {
  clients: SupabaseClientRow[];
  isLoading: boolean;
  proposals: ProposalItem[];
  tasks: any[];
  invoices: any[];
  onRefresh: () => void;
  onAddNewClient: () => void;
  onEditClient: (client: SupabaseClientRow) => void;
  onDeleteClient: (client: SupabaseClientRow) => void;
  onStartProposal: (client: {
    clientName: string;
    companyName: string;
    clientEmail: string;
    industry: string;
  }) => void;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// Helper to get 2 initials
function getInitials(name: string): string {
  if (!name) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ClientStoreView: React.FC<ClientStoreViewProps> = ({
  clients,
  isLoading,
  proposals,
  tasks,
  invoices,
  onRefresh,
  onAddNewClient,
  onEditClient,
  onDeleteClient,
  onStartProposal,
  triggerToast,
}) => {
  // Selected client for the interior detail view (Image 2)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Contacts' | 'Deals' | 'Projects' | 'Notes' | 'Billing'
  >('Overview');

  // Accordion state in sidebar
  const [detailsOpen, setDetailsOpen] = useState(true);

  // Active dropdown menu for row
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);

  // Copy email tooltip feedback
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Note modal state
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');

  // Edit details modal state
  const [editDetailsModalOpen, setEditDetailsModalOpen] = useState(false);
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCompanySize, setEditCompanySize] = useState('');
  const [editSource, setEditSource] = useState('');

  // Add Tag state
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Quick Action "+ New" menu in detail view
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  // Find currently selected client
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Load client metadata (domain, tags, description, activities)
  const [clientMeta, setClientMeta] = useState<ClientMetadata>({});

  useEffect(() => {
    if (selectedClientId) {
      setClientMeta(getClientMetadata(selectedClientId));
    }
  }, [selectedClientId]);

  // Filter clients for directory view
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  // Client proposals (Deals)
  const clientProposals = useMemo(() => {
    if (!selectedClient) return [];
    return proposals.filter(
      (p) =>
        p.clientCompany.toLowerCase() === selectedClient.company.toLowerCase() ||
        p.clientName.toLowerCase() === selectedClient.name.toLowerCase()
    );
  }, [selectedClient, proposals]);

  // Client invoices (Billing)
  const clientInvoices = useMemo(() => {
    if (!selectedClient) return [];
    return invoices.filter(
      (inv) =>
        inv.clientCompany.toLowerCase() === selectedClient.company.toLowerCase()
    );
  }, [selectedClient, invoices]);

  // Client tasks (Projects / Deliverables)
  const clientTasks = useMemo(() => {
    if (!selectedClient) return [];
    return tasks.filter(
      (t) =>
        (t.clientId && t.clientId === selectedClient.id) ||
        (t.project &&
          t.project.toLowerCase() === selectedClient.company.toLowerCase())
    );
  }, [selectedClient, tasks]);

  // Copy email handler
  const handleCopyEmail = (email: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    triggerToast(`Copied ${email} to clipboard!`, 'info');
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Add note handler
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newNoteContent.trim()) return;
    const updated = addClientActivityNote(selectedClient.id, newNoteContent.trim());
    setClientMeta(updated);
    setNewNoteContent('');
    setNoteModalOpen(false);
    triggerToast('Note added to client activity timeline!', 'success');
  };

  // Add tag handler
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newTagInput.trim()) return;
    const currentTags = clientMeta.tags || [];
    if (!currentTags.includes(newTagInput.trim())) {
      const nextTags = [...currentTags, newTagInput.trim()];
      const updated = saveClientMetadata(selectedClient.id, { tags: nextTags });
      setClientMeta(updated);
      triggerToast(`Added tag "${newTagInput.trim()}"`, 'success');
    }
    setNewTagInput('');
    setTagModalOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedClient) return;
    const nextTags = (clientMeta.tags || []).filter((t) => t !== tagToRemove);
    const updated = saveClientMetadata(selectedClient.id, { tags: nextTags });
    setClientMeta(updated);
  };

  // Open edit details modal
  const handleOpenEditDetails = () => {
    if (!selectedClient) return;
    setEditLogoUrl(clientMeta.logoUrl || '');
    setEditDomain(clientMeta.domain || '');
    setEditDescription(clientMeta.description || '');
    setEditCompanySize(clientMeta.companySize || '');
    setEditSource(clientMeta.source || '');
    setEditDetailsModalOpen(true);
  };

  // Save edit details
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const updated = saveClientMetadata(selectedClient.id, {
      logoUrl: editLogoUrl.trim(),
      domain: editDomain.trim(),
      description: editDescription.trim(),
      companySize: editCompanySize.trim(),
      source: editSource.trim(),
    });
    setClientMeta(updated);
    setEditDetailsModalOpen(false);
    triggerToast('Client details & logo updated!', 'success');
  };

  // ==========================================================================
  // VIEW 2: INSIDE CLIENT DETAIL VIEW (Matches Image 2)
  // ==========================================================================
  if (selectedClient) {
    const companyInitials = getInitials(selectedClient.company);
    const contactInitials = getInitials(selectedClient.name);
    const activities = clientMeta.activities || [];

    return (
      <div className="space-y-4">
        {/* Top Navigation & Breadcrumb */}
        <div className="flex items-center justify-between bg-white border border-[#e1e9e4] px-4 py-2.5 rounded-2xl text-[#101c19] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedClientId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f0f4f1] hover:bg-[#e1e9e4] text-[#101c19] text-xs font-medium cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Clients</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-[#596960]">
              <span className="hover:text-[#101c19] cursor-pointer" onClick={() => setSelectedClientId(null)}>
                Clients
              </span>
              <span>/</span>
              <span className="text-[#101c19] font-semibold">{selectedClient.company}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onStartProposal({
                  clientName: selectedClient.name,
                  companyName: selectedClient.company,
                  clientEmail: selectedClient.email || '',
                  industry: selectedClient.industry || 'Technology',
                })
              }
              className="px-3.5 py-1.5 rounded-lg bg-[#0c9256] hover:bg-[#0a7a48] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Proposal</span>
            </button>
          </div>
        </div>

        {/* Split Layout: Left Profile Sidebar + Right Main Workspace (Image 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* =================================================================
              LEFT COLUMN: CLIENT PROFILE & DETAILS (Approx 320px - 360px)
          ================================================================= */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-[#e1e9e4] rounded-2xl p-5 text-[#101c19] shadow-sm space-y-5">
              {/* Header: Large Avatar + Name + Tags + Actions */}
              <div className="flex items-start gap-3.5">
                <div
                  onClick={handleOpenEditDetails}
                  title="Click to change client logo"
                  className="w-14 h-14 rounded-xl border border-[#e1e9e4] bg-[#f0f4f1] text-[#101c19] font-bold text-lg flex items-center justify-center shrink-0 tracking-wider overflow-hidden cursor-pointer hover:border-[#0c9256] transition-all relative group"
                >
                  {(clientMeta.logoUrl || selectedClient.logo_url) ? (
                    <img
                      src={clientMeta.logoUrl || selectedClient.logo_url || ''}
                      alt={selectedClient.company}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    companyInitials
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity">
                    Edit
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-bold text-[#101c19] truncate">
                    {selectedClient.company}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {(clientMeta.tags || []).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#e8f7ee] text-[#087443] border border-[#a7dfc1]/50 inline-flex items-center gap-1 group"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-[#596960] hover:text-rose-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTagModalOpen(true)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#f0f4f1] text-[#596960] hover:bg-[#e1e9e4] transition-colors cursor-pointer"
                    >
                      + Add tags
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar (+ New, ...) */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNewMenuOpen(!newMenuOpen)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0c9256] hover:bg-[#0a7a48] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>New</span>
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </button>
                  {newMenuOpen && (
                    <div className="absolute left-0 top-9 w-44 rounded-xl bg-white border border-[#e1e9e4] p-1.5 shadow-xl z-20 space-y-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setNewMenuOpen(false);
                          onStartProposal({
                            clientName: selectedClient.name,
                            companyName: selectedClient.company,
                            clientEmail: selectedClient.email || '',
                            industry: selectedClient.industry || 'Technology',
                          });
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#f0f4f1] text-[#101c19] flex items-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#0c9256]" />
                        <span>Proposal / Deal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewMenuOpen(false);
                          setNoteModalOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#f0f4f1] text-[#101c19] flex items-center gap-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                        <span>Activity Note</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onEditClient(selectedClient)}
                  className="p-1.5 rounded-lg bg-[#f0f4f1] hover:bg-[#e1e9e4] text-[#596960] hover:text-[#101c19] border border-[#e1e9e4] cursor-pointer transition-colors"
                  title="Edit Client"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Contact Section (Image 2) */}
              <div className="pt-3 border-t border-[#e1e9e4] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#596960] uppercase tracking-wider">
                    Primary Contact
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditClient(selectedClient)}
                    className="text-[#596960] hover:text-[#101c19] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4]">
                  <div className="w-8 h-8 rounded-full bg-[#f0f4f1] text-[#101c19] font-semibold text-xs flex items-center justify-center shrink-0">
                    {contactInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#101c19] truncate">{selectedClient.name}</p>
                    <p className="text-[11px] text-[#596960] truncate">{selectedClient.email || 'No email provided'}</p>
                  </div>
                  {selectedClient.email && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyEmail(selectedClient.email!, e)}
                      className="text-[#596960] hover:text-[#0c9256] cursor-pointer shrink-0"
                      title="Copy Email"
                    >
                      {copiedEmail === selectedClient.email ? (
                        <Check className="w-3.5 h-3.5 text-[#0c9256]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Details Accordion (Image 2) */}
              <div className="pt-3 border-t border-[#e1e9e4] space-y-3">
                <div
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-xs font-semibold text-[#596960] uppercase tracking-wider group-hover:text-[#101c19]">
                    Details
                  </span>
                  <div className="flex items-center gap-1.5 text-[#596960]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditDetails();
                      }}
                      className="hover:text-[#101c19]"
                      title="Edit Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {detailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {detailsOpen && (
                  <div className="space-y-2.5 text-xs">
                    {/* Domain */}
                    <div className="flex items-center justify-between py-1 border-b border-[#f0f4f1]">
                      <span className="text-[#596960]">Domain</span>
                      {clientMeta.domain ? (
                        <a
                          href={`https://${clientMeta.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0c9256] font-medium hover:underline truncate max-w-[170px]"
                        >
                          {clientMeta.domain}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenEditDetails}
                          className="text-[#84968c] hover:text-[#101c19] cursor-pointer"
                        >
                          Add domain
                        </button>
                      )}
                    </div>

                    {/* Description */}
                    <div className="flex items-center justify-between py-1 border-b border-[#f0f4f1]">
                      <span className="text-[#596960]">Description</span>
                      {clientMeta.description ? (
                        <span className="text-[#101c19] font-medium truncate max-w-[170px]">
                          {clientMeta.description}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenEditDetails}
                          className="text-[#84968c] hover:text-[#101c19] cursor-pointer"
                        >
                          Add a description
                        </button>
                      )}
                    </div>

                    {/* Industry */}
                    <div className="flex items-center justify-between py-1 border-b border-[#f0f4f1]">
                      <span className="text-[#596960]">Industry</span>
                      <span className="text-[#101c19] font-medium truncate max-w-[170px]">
                        {selectedClient.industry || 'Technology'}
                      </span>
                    </div>

                    {/* Company Size */}
                    <div className="flex items-center justify-between py-1 border-b border-[#f0f4f1]">
                      <span className="text-[#596960]">Company Size</span>
                      {clientMeta.companySize ? (
                        <span className="text-[#101c19] font-medium">
                          {clientMeta.companySize}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenEditDetails}
                          className="text-[#84968c] hover:text-[#101c19] cursor-pointer"
                        >
                          Add company size
                        </button>
                      )}
                    </div>

                    {/* Source */}
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#596960]">Source</span>
                      {clientMeta.source ? (
                        <span className="text-[#101c19] font-medium">
                          {clientMeta.source}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenEditDetails}
                          className="text-[#84968c] hover:text-[#101c19] cursor-pointer"
                        >
                          Add source
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* =================================================================
              RIGHT COLUMN: TABS & INTERACTION PANELS (Image 2)
          ================================================================= */}
          <div className="lg:col-span-8 space-y-5">
            {/* Horizontal Tabs with vibrant green indicator (Image 2) */}
            <div className="bg-white border border-[#e1e9e4] rounded-2xl px-5 pt-3 pb-0 shadow-sm text-[#101c19]">
              <div className="flex items-center justify-between border-b border-[#e1e9e4] overflow-x-auto gap-4">
                <div className="flex items-center gap-6 text-xs font-semibold whitespace-nowrap">
                  {(
                    ['Overview', 'Contacts', 'Deals', 'Projects', 'Notes', 'Billing'] as const
                  ).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 border-b-2 cursor-pointer transition-all ${
                          isActive
                            ? 'border-[#0c9256] text-[#101c19]'
                            : 'border-transparent text-[#596960] hover:text-[#101c19]'
                        }`}
                      >
                        {tab}
                        {tab === 'Deals' && clientProposals.length > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#e8f7ee] text-[#087443]">
                            {clientProposals.length}
                          </span>
                        )}
                        {tab === 'Projects' && clientTasks.length > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-[#f0f4f1] text-[#101c19]">
                            {clientTasks.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 pb-2 text-[#596960]">
                  <button
                    type="button"
                    onClick={() => setNoteModalOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-[#f0f4f1] text-[#596960] hover:text-[#101c19] cursor-pointer"
                    title="Add Activity Note"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'Overview' && (
              <div className="space-y-5">
                {/* 1. Recent Projects Section (Image 2) */}
                <div className="bg-white border border-[#e1e9e4] rounded-2xl p-5 shadow-sm text-[#101c19] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#101c19] tracking-wide">
                      Recent Projects
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        onStartProposal({
                          clientName: selectedClient.name,
                          companyName: selectedClient.company,
                          clientEmail: selectedClient.email || '',
                          industry: selectedClient.industry || 'Technology',
                        })
                      }
                      className="p-1 rounded-lg bg-[#f0f4f1] hover:bg-[#e1e9e4] text-[#596960] hover:text-[#101c19] cursor-pointer"
                      title="New Project Proposal"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {clientProposals.length === 0 ? (
                    /* Clean Empty State as in Image 2 */
                    <div className="rounded-xl border border-dashed border-[#e1e9e4] bg-[#faf9f5] p-8 text-center">
                      <p className="text-xs text-[#596960]">
                        No projects started yet.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onStartProposal({
                            clientName: selectedClient.name,
                            companyName: selectedClient.company,
                            clientEmail: selectedClient.email || '',
                            industry: selectedClient.industry || 'Technology',
                          })
                        }
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#f0f4f1] text-xs font-semibold text-[#087443] border border-[#a7dfc1]/50 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Start First Proposal</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {clientProposals.map((prop) => (
                        <div
                          key={prop.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] hover:border-[#0c9256]/30 transition-colors"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#101c19] truncate">
                              {prop.title}
                            </h4>
                            <p className="text-[11px] text-[#596960] mt-0.5">
                              {prop.value} · 2-4 weeks · {prop.sections?.servicesDeliverables?.length || 0} services
                            </p>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f7ee] text-[#087443] border border-[#a7dfc1]/50">
                            {prop.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Activity Section (Image 2) */}
                <div className="bg-white border border-[#e1e9e4] rounded-2xl p-5 shadow-sm text-[#101c19] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-[#101c19] tracking-wide">
                      Activity
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNoteModalOpen(true)}
                        className="p-1.5 rounded-lg bg-[#f0f4f1] hover:bg-[#e1e9e4] text-[#596960] hover:text-[#101c19] cursor-pointer"
                        title="Add Note"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {activities.length === 0 ? (
                    /* Exact Bonsai-style Activity Empty State with bright green 'Add a Note' button (Image 2) */
                    <div className="rounded-xl border border-dashed border-[#e1e9e4] bg-[#faf9f5] p-10 text-center space-y-3.5">
                      <p className="text-xs text-[#596960] font-medium">
                        No activity yet
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() => setNoteModalOpen(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c9256] hover:bg-[#0a7a48] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add a Note</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((act) => (
                        <div
                          key={act.id}
                          className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#596960]">
                            <span className="font-semibold text-[#101c19]">{act.author}</span>
                            <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[#101c19] whitespace-pre-wrap">{act.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: Contacts */}
            {activeTab === 'Contacts' && (
              <div className="bg-white border border-[#e1e9e4] rounded-2xl p-5 shadow-sm text-[#101c19] space-y-4">
                <h3 className="font-display text-sm font-bold text-[#101c19]">
                  Associated Contacts
                </h3>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f0f4f1] text-[#101c19] font-semibold text-xs flex items-center justify-center">
                      {contactInitials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#101c19]">{selectedClient.name}</p>
                      <p className="text-[11px] text-[#596960]">{selectedClient.email || 'No email'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f7ee] text-[#087443]">
                    Primary
                  </span>
                </div>
              </div>
            )}

            {/* TAB: Deals */}
            {activeTab === 'Deals' && (
              <div className="bg-white border border-[#e1e9e4] rounded-2xl p-5 shadow-sm text-[#101c19] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#101c19]">
                    Client Proposals &amp; Deals
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      onStartProposal({
                        clientName: selectedClient.name,
                        companyName: selectedClient.company,
                        clientEmail: selectedClient.email || '',
                        industry: selectedClient.industry || 'Technology',
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c9256] hover:bg-[#0a7a48] text-xs font-semibold text-white cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>New Proposal</span>
                  </button>
                </div>

                {clientProposals.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#faf9f5] border border-dashed border-[#e1e9e4] text-xs text-[#596960]">
                    No proposals created for this client yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {clientProposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] flex items-center justify-between text-xs"
                      >
                        <div>
                          <h4 className="font-bold text-[#101c19]">{prop.title}</h4>
                          <p className="text-[11px] text-[#596960] mt-0.5">
                            {prop.value} · Updated {prop.updatedAt}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f7ee] text-[#087443] border border-[#a7dfc1]/50">
                          {prop.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Projects / Deliverables */}
            {activeTab === 'Projects' && (
              <div className="bg-white border border-[#e1e9e4] rounded-2xl p-5 shadow-sm text-[#101c19] space-y-4">
                <h3 className="font-display text-sm font-bold text-[#101c19]">
                  Client Deliverables &amp; Milestones
                </h3>
                {clientTasks.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#faf9f5] border border-dashed border-[#e1e9e4] text-xs text-[#596960]">
                    No tasks or deliverables assigned to this client yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#0c9256] shrink-0" />
                          <span className="text-[#101c19] font-medium">{task.title}</span>
                        </div>
                        <span className="text-[11px] text-[#596960]">
                          {task.dueDate || 'In progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Notes */}
            {activeTab === 'Notes' && (
              <div className="bg-white border border-[#e1e9e4] rounded-2xl p-5 shadow-sm text-[#101c19] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#101c19]">
                    Client Notes &amp; Relationship Context
                  </h3>
                  <button
                    type="button"
                    onClick={() => setNoteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c9256] hover:bg-[#0a7a48] text-xs font-semibold text-white cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Note</span>
                  </button>
                </div>

                {selectedClient.notes && (
                  <div className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-xs text-[#101c19]">
                    <span className="font-semibold text-[#596960] block mb-1">General Notes:</span>
                    {selectedClient.notes}
                  </div>
                )}

                {activities.length === 0 && !selectedClient.notes ? (
                  <div className="p-8 text-center rounded-xl bg-[#faf9f5] border border-dashed border-[#e1e9e4] text-xs text-[#596960]">
                    No notes recorded yet. Click &quot;Add Note&quot; to log internal context.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-xs space-y-1"
                      >
                        <div className="flex justify-between text-[11px] text-[#596960]">
                          <span className="font-semibold text-[#101c19]">{act.author}</span>
                          <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[#101c19] whitespace-pre-wrap">{act.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Billing */}
            {activeTab === 'Billing' && (
              <div className="bg-white border border-[#e1e9e4] rounded-2xl p-5 shadow-sm text-[#101c19] space-y-4">
                <h3 className="font-display text-sm font-bold text-[#101c19]">
                  Invoices &amp; Payments
                </h3>
                {clientInvoices.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#faf9f5] border border-dashed border-[#e1e9e4] text-xs text-[#596960]">
                    No invoices generated for {selectedClient.company} yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#101c19]">{inv.invoiceNumber}</div>
                          <div className="text-[11px] text-[#596960] mt-0.5">
                            {inv.dueDate} · {inv.clientCompany}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#087443]">{inv.amount}</div>
                          <span className="text-[10px] font-semibold text-[#596960]">
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Add Note */}
        {noteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white border border-[#e1e9e4] rounded-2xl max-w-md w-full p-6 text-[#101c19] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-bold text-[#101c19]">
                  Add Activity Note for {selectedClient.company}
                </h4>
                <button
                  type="button"
                  onClick={() => setNoteModalOpen(false)}
                  className="text-[#596960] hover:text-[#101c19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveNote} className="space-y-3.5">
                <textarea
                  rows={4}
                  required
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record meeting takeaways, client requests, budget discussions, or next action items..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-xs text-[#101c19] placeholder-[#84968c] focus:border-[#0c9256] focus:outline-hidden resize-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNoteModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#e1e9e4] text-xs font-semibold text-[#596960] hover:bg-[#f0f4f1] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0c9256] hover:bg-[#0a7a48] text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Details */}
        {editDetailsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white border border-[#e1e9e4] rounded-2xl max-w-md w-full p-6 text-[#101c19] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base font-bold text-[#101c19]">
                  Edit Client Details
                </h4>
                <button
                  type="button"
                  onClick={() => setEditDetailsModalOpen(false)}
                  className="text-[#596960] hover:text-[#101c19]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveDetails} className="space-y-3 text-xs">
                <ClientLogoPicker
                  logoUrl={editLogoUrl}
                  companyName={selectedClient.company}
                  onChange={setEditLogoUrl}
                  label="Client Logo"
                  description="Upload image, paste link, or pick a brand mark"
                />
                <div>
                  <label className="block text-[#101c19] font-semibold mb-1">
                    Domain / Website
                  </label>
                  <input
                    type="text"
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    placeholder="e.g. solstice.io"
                    className="w-full px-3 py-2 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-[#101c19] focus:border-[#0c9256] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[#101c19] font-semibold mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="e.g. Enterprise B2B SaaS client"
                    className="w-full px-3 py-2 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-[#101c19] focus:border-[#0c9256] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[#101c19] font-semibold mb-1">
                    Company Size
                  </label>
                  <input
                    type="text"
                    value={editCompanySize}
                    onChange={(e) => setEditCompanySize(e.target.value)}
                    placeholder="e.g. 11-50 employees"
                    className="w-full px-3 py-2 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-[#101c19] focus:border-[#0c9256] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[#101c19] font-semibold mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                    placeholder="e.g. Inbound / Referral"
                    className="w-full px-3 py-2 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-[#101c19] focus:border-[#0c9256] focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditDetailsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#e1e9e4] text-[#596960] hover:bg-[#f0f4f1] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#0c9256] hover:bg-[#0a7a48] text-white font-semibold cursor-pointer shadow-xs"
                  >
                    Save Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Tag */}
        {tagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white border border-[#e1e9e4] rounded-2xl max-w-xs w-full p-5 text-[#101c19] shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold text-[#101c19]">Add Tag</h4>
                <button
                  type="button"
                  onClick={() => setTagModalOpen(false)}
                  className="text-[#596960] hover:text-[#101c19]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddTag} className="space-y-3">
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="e.g. Priority, Retainer, VIP"
                  className="w-full px-3 py-2 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-xs text-[#101c19] focus:border-[#0c9256] focus:outline-hidden"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTagModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#e1e9e4] text-xs text-[#596960] hover:bg-[#f0f4f1] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#0c9256] hover:bg-[#0a7a48] text-white text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW 1: CLIENT STORE / DIRECTORY (Matches Image 1 Exact Layout)
  // ==========================================================================
  return (
    <section className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white border border-[#e1e9e4] p-4 sm:p-5 rounded-2xl text-[#101c19] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#101c19]">
              Clients
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f0f4f1] text-[#596960] font-medium border border-[#e1e9e4]">
              {clients.length} {clients.length === 1 ? 'client' : 'clients'}
            </span>
          </div>
          <p className="text-xs text-[#596960] mt-1">
            Manage your client accounts, primary contacts, proposals, and deliverables
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#596960]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-xs text-[#101c19] placeholder-[#84968c] focus:border-[#0c9256] focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl bg-[#f0f4f1] hover:bg-[#e1e9e4] border border-[#e1e9e4] text-[#596960] hover:text-[#101c19] cursor-pointer transition-colors"
            title="Refresh Clients"
          >
            <Clock className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onAddNewClient}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c9256] hover:bg-[#0a7a48] text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-md transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Table Container (Image 1 Style) */}
      <div className="bg-white border border-[#e1e9e4] rounded-2xl overflow-hidden shadow-sm text-[#101c19]">
        {/* Table Header Row */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-[#e1e9e4] text-[11px] font-semibold tracking-wider uppercase text-[#596960] bg-[#faf9f5]">
          <div className="col-span-4 sm:col-span-3">Client</div>
          <div className="col-span-2 hidden sm:block">Tags</div>
          <div className="col-span-4 sm:col-span-3">Primary Contact</div>
          <div className="col-span-3 hidden md:block">Email</div>
          <div className="col-span-4 sm:col-span-1 text-right">Actions</div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-12 bg-[#f0f4f1] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f7ee] text-[#087443] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="font-display text-base font-bold text-[#101c19]">
              No clients found
            </h3>
            <p className="text-xs text-[#596960] max-w-sm mx-auto">
              {searchQuery
                ? `No clients matched "${searchQuery}". Try clearing search.`
                : 'You haven’t added any clients yet. Add your first client to start creating proposals and managing deliverables.'}
            </p>
            <button
              type="button"
              onClick={onAddNewClient}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c9256] hover:bg-[#0a7a48] text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add First Client</span>
            </button>
          </div>
        ) : (
          /* Real Client Rows (Matching Image 1 Exact Layout) */
          <div className="divide-y divide-[#f0f4f1]">
            {filteredClients.map((client) => {
              const companyInitials = getInitials(client.company);
              const contactInitials = getInitials(client.name);
              const isActionOpen = openActionRowId === client.id;
              const meta = getClientMetadata(client.id);

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 hover:bg-[#f5f9f7] transition-colors cursor-pointer group"
                >
                  {/* Column 1: Client (Square avatar/logo + Company Name) */}
                  <div className="col-span-4 sm:col-span-3 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#f0f4f1] border border-[#e1e9e4] text-[#101c19] font-semibold text-xs flex items-center justify-center shrink-0 tracking-wide overflow-hidden shadow-2xs">
                      {(meta.logoUrl || client.logo_url) ? (
                        <img
                          src={meta.logoUrl || client.logo_url || ''}
                          alt={client.company}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        companyInitials
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[#101c19] group-hover:text-[#0c9256] transition-colors truncate block">
                        {client.company}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Tags (Dash or Tag Pills) */}
                  <div className="col-span-2 hidden sm:flex items-center gap-1 min-w-0 text-xs text-[#596960]">
                    {meta.tags && meta.tags.length > 0 ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#e8f7ee] text-[#087443] border border-[#a7dfc1]/50 truncate">
                        {meta.tags[0]}
                        {meta.tags.length > 1 ? ` +${meta.tags.length - 1}` : ''}
                      </span>
                    ) : (
                      <span className="text-[#84968c]">—</span>
                    )}
                  </div>

                  {/* Column 3: Primary Contact (Round avatar + Contact Name) */}
                  <div className="col-span-4 sm:col-span-3 flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#f0f4f1] text-[#596960] font-semibold text-[10px] flex items-center justify-center shrink-0">
                      {contactInitials}
                    </div>
                    <span className="text-xs text-[#2c3e37] truncate">
                      {client.name}
                    </span>
                  </div>

                  {/* Column 4: Email */}
                  <div className="col-span-3 hidden md:flex items-center gap-2 min-w-0 text-xs text-[#596960]">
                    <span className="truncate">
                      {client.email || '—'}
                    </span>
                    {client.email && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyEmail(client.email!, e)}
                        className="text-[#84968c] hover:text-[#0c9256] cursor-pointer shrink-0"
                        title="Copy Email"
                      >
                        {copiedEmail === client.email ? (
                          <Check className="w-3.5 h-3.5 text-[#0c9256]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Column 5: Actions (...) */}
                  <div className="col-span-4 sm:col-span-1 flex items-center justify-end relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionRowId(isActionOpen ? null : client.id);
                      }}
                      className="p-1.5 rounded-lg text-[#596960] hover:text-[#101c19] hover:bg-[#f0f4f1] cursor-pointer transition-colors"
                      title="More actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Action Dropdown Menu */}
                    {isActionOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-8 w-44 rounded-xl bg-white border border-[#e1e9e4] p-1.5 shadow-2xl z-30 space-y-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionRowId(null);
                            setSelectedClientId(client.id);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#101c19] hover:bg-[#f0f4f1] flex items-center gap-2"
                        >
                          <Building2 className="w-3.5 h-3.5 text-[#0c9256]" />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionRowId(null);
                            onStartProposal({
                              clientName: client.name,
                              companyName: client.company,
                              clientEmail: client.email || '',
                              industry: client.industry || 'Technology',
                            });
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#101c19] hover:bg-[#f0f4f1] flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span>New Proposal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionRowId(null);
                            onEditClient(client);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#101c19] hover:bg-[#f0f4f1] flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Edit Client</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionRowId(null);
                            onDeleteClient(client);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Client</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
