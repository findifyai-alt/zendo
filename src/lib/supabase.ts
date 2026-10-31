import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ProposalItem,
  ClientItem,
  FollowUpItem,
  ClientMessageItem,
  ClientWorkspaceTaskItem,
  ProposalStatus,
  ProposalStyleTone,
} from '../data/zendoProposalsData';

const metaEnv = (
  import.meta as unknown as { env?: Record<string, string | undefined> }
).env;

const STORAGE_KEY_URL = 'zendo_supabase_url';
const STORAGE_KEY_ANON_KEY = 'zendo_supabase_anon_key';

const FALLBACK_SUPABASE_URL = 'https://xyzcompany.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummyAnonKeySignatureForLocalZendoClient';

function isValidHttpOrHttpsUrl(candidate: unknown): candidate is string {
  if (typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidKeyString(candidate: unknown): candidate is string {
  if (typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  return Boolean(trimmed && trimmed !== 'null' && trimmed !== 'undefined' && trimmed.length >= 8);
}

export function getSupabaseConfig(): {
  url: string;
  anonKey: string;
  isConfigured: boolean;
} {
  let storedUrl: string | null = null;
  let storedKey: string | null = null;
  try {
    storedUrl = localStorage.getItem(STORAGE_KEY_URL);
    storedKey = localStorage.getItem(STORAGE_KEY_ANON_KEY);
    // If invalid in localStorage, clear it so it doesn't corrupt subsequent runs
    if (storedUrl && !isValidHttpOrHttpsUrl(storedUrl)) {
      localStorage.removeItem(STORAGE_KEY_URL);
      storedUrl = null;
    }
    if (storedKey && !isValidKeyString(storedKey)) {
      localStorage.removeItem(STORAGE_KEY_ANON_KEY);
      storedKey = null;
    }
  } catch {}

  const envUrl = metaEnv?.VITE_SUPABASE_URL || metaEnv?.NEXT_PUBLIC_SUPABASE_URL;
  const envKey =
    metaEnv?.VITE_SUPABASE_ANON_KEY ||
    metaEnv?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    metaEnv?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const url =
    (isValidHttpOrHttpsUrl(storedUrl) && storedUrl.trim()) ||
    (isValidHttpOrHttpsUrl(envUrl) && envUrl.trim()) ||
    FALLBACK_SUPABASE_URL;

  const anonKey =
    (isValidKeyString(storedKey) && storedKey.trim()) ||
    (isValidKeyString(envKey) && envKey.trim()) ||
    FALLBACK_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    url &&
    url !== FALLBACK_SUPABASE_URL &&
    anonKey &&
    anonKey !== FALLBACK_SUPABASE_ANON_KEY
  );

  return { url, anonKey, isConfigured };
}

export function setSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (isValidHttpOrHttpsUrl(url)) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }
    if (isValidKeyString(anonKey)) {
      localStorage.setItem(STORAGE_KEY_ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON_KEY);
    }
    window.location.reload();
  } catch {}
}

const { url: initialUrl, anonKey: initialAnonKey } = getSupabaseConfig();

export const SUPABASE_URL = initialUrl;
export const SUPABASE_PUBLISHABLE_KEY = initialAnonKey;

function createSafeSupabaseClient(): SupabaseClient {
  try {
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase] Falling back to safe client instance:', err);
    return createClient(FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
}

export const supabase: SupabaseClient = createSafeSupabaseClient();

// ============================================================================
// SUPABASE AUTH HELPERS
// ============================================================================

export async function signInWithEmail(email: string, password: string) {
  return await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const name = fullName?.trim() || email.split('@')[0] || 'User';
  return await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: name,
        display_name: name,
      },
    },
  });
}

export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
}

export async function signOutSupabase() {
  return await supabase.auth.signOut();
}

export async function getSupabaseUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ============================================================================
// CLIENTS DATABASE INTERFACE & HELPERS (Matching exact schema requested)
// ============================================================================

export interface SupabaseClientRow {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company: string;
  industry: string | null;
  notes: string | null;
  logo_url?: string | null;
  created_at: string;
}

const LOCAL_STORAGE_CLIENTS_KEY = 'zendo_supabase_clients_cache';

function getLocalClients(): SupabaseClientRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLIENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalClients(clients: SupabaseClientRow[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(clients));
  } catch {}
}

export async function fetchClientsFromSupabase(): Promise<{
  data: SupabaseClientRow[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, user_id, name, email, company, industry, notes, logo_url, created_at')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      saveLocalClients(data);
      return { data, error: null };
    }
  } catch {}

  const local = getLocalClients();
  return { data: local, error: null };
}

export async function createClientInSupabase(clientData: {
  name: string;
  company: string;
  email?: string;
  industry?: string;
  notes?: string;
  logoUrl?: string;
  logo_url?: string;
}): Promise<{ data: SupabaseClientRow | null; error: any }> {
  let userId = 'user_guest';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) userId = user.id;
  } catch {}

  const cleanId = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const finalLogo = clientData.logoUrl?.trim() || clientData.logo_url?.trim() || null;
  const newRow: SupabaseClientRow = {
    id: cleanId,
    user_id: userId,
    name: clientData.name.trim(),
    company: clientData.company.trim(),
    email: clientData.email?.trim() || null,
    industry: clientData.industry?.trim() || 'Technology',
    notes: clientData.notes?.trim() || null,
    logo_url: finalLogo,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([newRow])
      .select('id, user_id, name, email, company, industry, notes, logo_url, created_at')
      .single();

    if (!error && data) {
      const local = [data, ...getLocalClients().filter((c) => c.id !== data.id)];
      saveLocalClients(local);
      return { data, error: null };
    }
  } catch {}

  const local = [newRow, ...getLocalClients().filter((c) => c.id !== newRow.id)];
  saveLocalClients(local);
  return { data: newRow, error: null };
}

export async function updateClientInSupabase(
  id: string,
  clientData: {
    name?: string;
    company?: string;
    email?: string;
    industry?: string;
    notes?: string;
    logoUrl?: string;
    logo_url?: string;
  }
): Promise<{ data: SupabaseClientRow | null; error: any }> {
  try {
    const payload: Record<string, any> = {};
    if (clientData.name !== undefined) payload.name = clientData.name.trim();
    if (clientData.company !== undefined) payload.company = clientData.company.trim();
    if (clientData.email !== undefined) payload.email = clientData.email?.trim() || null;
    if (clientData.industry !== undefined) payload.industry = clientData.industry?.trim() || null;
    if (clientData.notes !== undefined) payload.notes = clientData.notes?.trim() || null;
    if (clientData.logoUrl !== undefined || clientData.logo_url !== undefined) {
      payload.logo_url = (clientData.logoUrl ?? clientData.logo_url)?.trim() || null;
    }

    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', id)
      .select('id, user_id, name, email, company, industry, notes, logo_url, created_at')
      .single();

    if (!error && data) {
      const local = getLocalClients().map((c) => (c.id === data.id ? data : c));
      saveLocalClients(local);
      return { data, error: null };
    }
  } catch {}

  const currentLocal = getLocalClients();
  const existing = currentLocal.find((c) => c.id === id);
  if (existing) {
    const updated: SupabaseClientRow = {
      ...existing,
      name: clientData.name !== undefined ? clientData.name.trim() : existing.name,
      company: clientData.company !== undefined ? clientData.company.trim() : existing.company,
      email: clientData.email !== undefined ? clientData.email.trim() || null : existing.email,
      industry: clientData.industry !== undefined ? clientData.industry.trim() || null : existing.industry,
      notes: clientData.notes !== undefined ? clientData.notes.trim() || null : existing.notes,
    };
    const updatedList = currentLocal.map((c) => (c.id === id ? updated : c));
    saveLocalClients(updatedList);
    return { data: updated, error: null };
  }

  return { data: null, error: new Error('Client not found') };
}

export async function deleteClientInSupabase(id: string): Promise<{ error: any }> {
  try {
    await supabase.from('clients').delete().eq('id', id);
  } catch {}

  const local = getLocalClients().filter((c) => c.id !== id);
  saveLocalClients(local);
  return { error: null };
}

// ============================================================================
// LEGACY BACKWARDS-COMPATIBLE WORKSPACE EXPORTS (Used by api.ts)
// ============================================================================

interface SupabaseProposalRow {
  id: string;
  title: string;
  client_name: string;
  client_company: string;
  client_email: string;
  industry: string;
  value: string;
  numeric_value: number;
  status: string;
  updated_at_label: string;
  style: string;
  timeline_summary: string;
  services_json: string;
  sections_json: string;
}

interface SupabaseFollowUpRow {
  id: string;
  proposal_id: string;
  proposal_title: string;
  client_company: string;
  contact_name: string;
  contact_email: string;
  headline: string;
  subtext: string;
  timing_badge: string;
  ai_insight: string;
  suggested_subject: string;
  suggested_message: string;
  sent: boolean;
}

interface SupabaseMessageRow {
  id: string;
  proposal_id: string;
  client_company: string;
  sender_name: string;
  sender_role: string;
  message_text: string;
  time_label: string;
}

interface SupabaseTaskRow {
  id: string;
  client_company: string;
  title: string;
  category: string;
  due_date: string;
  status: string;
  notes: string;
}

function mapRowToProposal(row: SupabaseProposalRow): ProposalItem {
  let parsedServices: string[] = [];
  let parsedSections: ProposalItem['sections'] = {
    coverSubtitle: '',
    preparedFor: '',
    preparedBy: '',
    dateIssued: '',
    validUntil: '',
    executiveSummary: '',
    clientProblem: '',
    proposedSolution: '',
    servicesDeliverables: [],
    timeline: [],
    pricingItems: [],
    pricingNote: '',
    termsAndNextSteps: '',
  };

  try {
    parsedServices = JSON.parse(row.services_json || '[]');
  } catch {
    parsedServices = [];
  }

  try {
    parsedSections = JSON.parse(row.sections_json || '{}');
  } catch {
    // keep default
  }

  return {
    id: row.id,
    title: row.title,
    clientName: row.client_name,
    clientCompany: row.client_company,
    clientEmail: row.client_email,
    industry: row.industry,
    value: row.value,
    numericValue: Number(row.numeric_value) || 0,
    status: (row.status as ProposalStatus) || 'Draft',
    updatedAt: row.updated_at_label || 'Just now',
    style: (row.style as ProposalStyleTone) || 'Premium',
    timelineSummary: row.timeline_summary || '4 weeks',
    services: parsedServices,
    sections: parsedSections,
  };
}

export async function fetchWorkspaceFromSupabase(): Promise<{
  proposals: ProposalItem[];
  clients: ClientItem[];
  followUps: FollowUpItem[];
  clientMessages: ClientMessageItem[];
  clientTasks: ClientWorkspaceTaskItem[];
} | null> {
  try {
    const [
      proposalsRes,
      clientsRes,
      followUpsRes,
      messagesRes,
      tasksRes,
    ] = await Promise.all([
      supabase.from('proposals').select('*'),
      supabase.from('clients').select('*'),
      supabase.from('follow_ups').select('*'),
      supabase.from('client_messages').select('*'),
      supabase.from('client_tasks').select('*'),
    ]);

    const hasValidData =
      (!proposalsRes.error &&
        Array.isArray(proposalsRes.data) &&
        proposalsRes.data.length > 0) ||
      (!clientsRes.error &&
        Array.isArray(clientsRes.data) &&
        clientsRes.data.length > 0);

    if (!hasValidData) {
      return null;
    }

    const proposals: ProposalItem[] = Array.isArray(proposalsRes.data)
      ? (proposalsRes.data as SupabaseProposalRow[]).map(mapRowToProposal)
      : [];

    const clients: ClientItem[] = Array.isArray(clientsRes.data)
      ? (clientsRes.data as any[]).map((row) => ({
          id: row.id,
          name: row.name,
          company: row.company,
          email: row.email || '',
          industry: row.industry || 'Technology',
          totalProposals: Number(row.total_proposals) || 0,
          pipelineValue: row.pipeline_value || '$0',
          lastActivity: row.last_activity || 'Recently added',
          status: (row.status as 'Active' | 'Prospect' | 'Won') || 'Active',
        }))
      : [];

    const followUps: FollowUpItem[] = Array.isArray(followUpsRes.data)
      ? (followUpsRes.data as SupabaseFollowUpRow[]).map((row) => ({
          id: row.id,
          proposalId: row.proposal_id,
          proposalTitle: row.proposal_title,
          clientCompany: row.client_company,
          contactName: row.contact_name,
          contactEmail: row.contact_email,
          headline: row.headline,
          subtext: row.subtext,
          timingBadge:
            (row.timing_badge as 'Today' | 'Viewed' | 'Tomorrow' | 'Upcoming') ||
            'Today',
          aiInsight: row.ai_insight,
          suggestedSubject: row.suggested_subject,
          suggestedMessage: row.suggested_message,
          sent: Boolean(row.sent),
        }))
      : [];

    const clientMessages: ClientMessageItem[] = Array.isArray(messagesRes.data)
      ? (messagesRes.data as SupabaseMessageRow[]).map((row) => ({
          id: row.id,
          proposalId: row.proposal_id,
          clientCompany: row.client_company,
          senderName: row.sender_name,
          senderRole: (row.sender_role as 'client' | 'agency') || 'agency',
          messageText: row.message_text,
          timeLabel: row.time_label,
        }))
      : [];

    const clientTasks: ClientWorkspaceTaskItem[] = Array.isArray(tasksRes.data)
      ? (tasksRes.data as SupabaseTaskRow[]).map((row) => ({
          id: row.id,
          clientCompany: row.client_company,
          title: row.title,
          category:
            (row.category as
              | 'Task'
              | 'Deadline'
              | 'Meeting'
              | 'Project Update') || 'Task',
          dueDate: row.due_date,
          status:
            (row.status as 'Pending' | 'In Progress' | 'Completed') ||
            'Pending',
          notes: row.notes,
        }))
      : [];

    return {
      proposals,
      clients,
      followUps,
      clientMessages,
      clientTasks,
    };
  } catch {
    return null;
  }
}

export async function upsertProposalInSupabase(
  proposal: ProposalItem
): Promise<void> {
  try {
    const payload: SupabaseProposalRow = {
      id: proposal.id,
      title: proposal.title,
      client_name: proposal.clientName,
      client_company: proposal.clientCompany,
      client_email: proposal.clientEmail,
      industry: proposal.industry,
      value: proposal.value,
      numeric_value: proposal.numericValue,
      status: proposal.status,
      updated_at_label: proposal.updatedAt,
      style: proposal.style,
      timeline_summary: proposal.timelineSummary,
      services_json: JSON.stringify(proposal.services || []),
      sections_json: JSON.stringify(proposal.sections || {}),
    };
    await supabase.from('proposals').upsert(payload, { onConflict: 'id' });
  } catch {}
}

export async function deleteProposalInSupabase(
  proposalId: string
): Promise<void> {
  try {
    await supabase.from('proposals').delete().eq('id', proposalId);
  } catch {}
}

export async function upsertClientInSupabase(client: ClientItem): Promise<void> {
  try {
    const payload = {
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      industry: client.industry,
    };
    await supabase.from('clients').upsert(payload, { onConflict: 'id' });
  } catch {}
}

export async function upsertFollowUpInSupabase(
  followUp: FollowUpItem
): Promise<void> {
  try {
    const payload: SupabaseFollowUpRow = {
      id: followUp.id,
      proposal_id: followUp.proposalId,
      proposal_title: followUp.proposalTitle,
      client_company: followUp.clientCompany,
      contact_name: followUp.contactName,
      contact_email: followUp.contactEmail,
      headline: followUp.headline,
      subtext: followUp.subtext,
      timing_badge: followUp.timingBadge,
      ai_insight: followUp.aiInsight,
      suggested_subject: followUp.suggestedSubject,
      suggested_message: followUp.suggestedMessage,
      sent: followUp.sent,
    };
    await supabase.from('follow_ups').upsert(payload, { onConflict: 'id' });
  } catch {}
}

export async function insertClientMessageInSupabase(
  message: ClientMessageItem
): Promise<void> {
  try {
    const payload: SupabaseMessageRow = {
      id: message.id,
      proposal_id: message.proposalId,
      client_company: message.clientCompany,
      sender_name: message.senderName,
      sender_role: message.senderRole,
      message_text: message.messageText,
      time_label: message.timeLabel,
    };
    await supabase.from('client_messages').upsert(payload, { onConflict: 'id' });
  } catch {}
}

export async function upsertClientTaskInSupabase(
  task: ClientWorkspaceTaskItem
): Promise<void> {
  try {
    const payload: SupabaseTaskRow = {
      id: task.id,
      client_company: task.clientCompany,
      title: task.title,
      category: task.category,
      due_date: task.dueDate,
      status: task.status,
      notes: task.notes,
    };
    await supabase.from('client_tasks').upsert(payload, { onConflict: 'id' });
  } catch {}
}

export async function saveWorkspaceSetupInSupabase(setup: {
  companyName: string;
  industry: string;
  servicesOffered: string;
  brandColor: string;
  typicalClientType: string;
  currency: string;
  proposalTone: string;
}): Promise<void> {
  try {
    await supabase.from('workspace_settings').upsert(
      {
        id: 'default_workspace',
        company_name: setup.companyName,
        industry: setup.industry,
        services_offered: setup.servicesOffered,
        brand_color: setup.brandColor,
        typical_client_type: setup.typicalClientType,
        currency: setup.currency,
        proposal_tone: setup.proposalTone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch {}
}

export async function syncUserInSupabase(
  displayName?: string,
  workspaceName?: string,
  email?: string
): Promise<void> {
  try {
    await supabase.from('users').upsert(
      {
        uid: email || 'alex@zendo.ai',
        email: email || 'alex@zendo.ai',
        display_name: displayName || 'Alex Morgan',
        workspace_name: workspaceName || 'Zendo Studio',
      },
      { onConflict: 'uid' }
    );
  } catch {}
}
