import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, sanitizeId } from '../firebase';
import type { User } from 'firebase/auth';
import type {
  ClientItem,
  ProposalItem,
  ScheduledMeetingItem,
  FollowUpItem,
} from '../data/zendoProposalsData';
import type { TaskItem, ProjectItem } from '../data/zendoCopy';
import type { DashboardPaymentItem } from '../components/DashboardView';

export interface UserBusinessProfile {
  uid: string;
  businessId: string;
  displayName: string;
  workspaceName: string;
  activePlan: 'Free' | 'Pro' | 'Team';
  createdAt?: any;
  updatedAt?: any;
}

export interface DashboardMetrics {
  totalProposals: number;
  activeProposals: number;
  totalPipelineValue: string;
  totalPipelineNumeric: number;
  acceptedValue: string;
  acceptedNumeric: number;
  acceptedCount: number;
  winRate: number;
  totalClients: number;
  upcomingMeetingsCount: number;
  totalPaidRevenue: number;
  pendingRevenue: number;
  totalTasks: number;
  todayTasksCount: number;
  inProgressTasksCount: number;
  completedTasksCount: number;
}

export interface DashboardDataset {
  businessId: string;
  userProfile: UserBusinessProfile | null;
  clients: ClientItem[];
  proposals: ProposalItem[];
  meetings: ScheduledMeetingItem[];
  projects: ProjectItem[];
  tasks: TaskItem[];
  followUps: FollowUpItem[];
  payments: DashboardPaymentItem[];
  metrics: DashboardMetrics;
  clientsMap: Map<string, ClientItem>;
  proposalsMap: Map<string, ProposalItem>;
  missingClientReferences: string[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Ensures or retrieves the user's business profile with a consistent businessId.
 */
export async function getOrCreateBusinessProfile(
  user: User,
  preferredName?: string,
  preferredWorkspace?: string
): Promise<UserBusinessProfile> {
  const uid = sanitizeId(user.uid);
  const userRef = doc(db, 'users', uid);
  const consistentBusinessId = `biz_${uid}`;

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const existingBizId = (data.businessId as string) || consistentBusinessId;

      if (!data.businessId) {
        try {
          await updateDoc(userRef, {
            businessId: consistentBusinessId,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // ignore minor update race
        }
      }

      const profile: UserBusinessProfile = {
        uid,
        businessId: existingBizId,
        displayName: data.displayName || preferredName || user.displayName || 'Alex Morgan',
        workspaceName: data.workspaceName || preferredWorkspace || 'Northstar Studio',
        activePlan: (['Free', 'Pro', 'Team'].includes(data.activePlan)
          ? data.activePlan
          : 'Pro') as 'Free' | 'Pro' | 'Team',
      };

      if (import.meta.env.DEV) {
        console.log('[Dev] Authenticated user ID:', user.uid);
        console.log('[Dev] Business ID:', profile.businessId);
      }
      return profile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    if (import.meta.env.DEV) {
      console.error('[Dev] Firestore query error loading user profile:', err);
    }
  }

  // Create initial profile if doc doesn't exist
  const newProfile: UserBusinessProfile = {
    uid,
    businessId: consistentBusinessId,
    displayName: preferredName || user.displayName || user.email?.split('@')[0] || 'Alex Morgan',
    workspaceName: preferredWorkspace || 'Northstar Studio',
    activePlan: 'Pro',
  };

  try {
    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
    if (import.meta.env.DEV) {
      console.error('[Dev] Firestore query error creating user profile:', err);
    }
  }

  if (import.meta.env.DEV) {
    console.log('[Dev] Authenticated user ID:', user.uid);
    console.log('[Dev] Business ID:', newProfile.businessId);
  }

  return newProfile;
}

/**
 * Calculates accurate dashboard metrics purely from real Firestore records.
 */
export function calculateDashboardMetrics(params: {
  proposals: ProposalItem[];
  clients: ClientItem[];
  meetings: ScheduledMeetingItem[];
  projects: ProjectItem[];
  tasks: TaskItem[];
  payments: DashboardPaymentItem[];
}): DashboardMetrics {
  const { proposals, clients, meetings, tasks, payments } = params;

  const totalProposals = proposals.length;
  const activeProposals = proposals.filter(
    (p) => p.status === 'Sent' || p.status === 'Viewed' || p.status === 'Follow-up'
  ).length;

  const totalPipelineNumeric = proposals.reduce((acc, p) => acc + (p.numericValue || 0), 0);
  const acceptedProposals = proposals.filter((p) => p.status === 'Accepted');
  const acceptedCount = acceptedProposals.length;
  const acceptedNumeric = acceptedProposals.reduce((acc, p) => acc + (p.numericValue || 0), 0);

  const declinedCount = proposals.filter((p) => p.status === 'Declined').length;
  const decidedCount = acceptedCount + declinedCount;
  const winRate = decidedCount > 0 ? Math.round((acceptedCount / decidedCount) * 100) : 0;

  const upcomingMeetingsCount = meetings.filter((m) => m.status === 'Scheduled').length;

  const totalPaidRevenue = payments
    .filter((p) => p.status === 'Paid')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const pendingRevenue = payments
    .filter((p) => p.status === 'Pending')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const todayTasksCount = tasks.filter((t) => t.status === 'today').length;
  const inProgressTasksCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;

  return {
    totalProposals,
    activeProposals,
    totalPipelineValue: `$${totalPipelineNumeric.toLocaleString()}`,
    totalPipelineNumeric,
    acceptedValue: `$${acceptedNumeric.toLocaleString()}`,
    acceptedNumeric,
    acceptedCount,
    winRate,
    totalClients: clients.length,
    upcomingMeetingsCount,
    totalPaidRevenue,
    pendingRevenue,
    totalTasks: tasks.length,
    todayTasksCount,
    inProgressTasksCount,
    completedTasksCount,
  };
}

/**
 * Subscribes in real-time to all 7 core collections for the given businessId.
 * Replaces clientId and proposalId with real display names using lookup maps.
 * Identifies and logs genuinely broken client references.
 */
export function subscribeToBusinessDashboard(
  businessId: string,
  onUpdate: (data: DashboardDataset) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let rawClients: ClientItem[] = [];
  let rawProposals: ProposalItem[] = [];
  let rawMeetings: ScheduledMeetingItem[] = [];
  let rawProjects: ProjectItem[] = [];
  let rawTasks: TaskItem[] = [];
  let rawFollowUps: FollowUpItem[] = [];
  let rawPayments: DashboardPaymentItem[] = [];

  const loadedState = {
    clients: false,
    proposals: false,
    meetings: false,
    projects: false,
    tasks: false,
    followUps: false,
    payments: false,
  };

  const rehydrateAndDispatch = () => {
    const isAllLoaded = Object.values(loadedState).every(Boolean);

    // 1. Build lookup maps
    const clientsMap = new Map<string, ClientItem>();
    rawClients.forEach((c) => clientsMap.set(c.id, c));

    const proposalsMap = new Map<string, ProposalItem>();
    rawProposals.forEach((p) => proposalsMap.set(p.id, p));

    const missingClientIds: string[] = [];

    // Helper to resolve client reference
    const resolveClient = (
      clientId: string | undefined,
      recordId: string,
      recordType: string
    ): { clientName: string; clientCompany: string } => {
      if (!clientId) {
        return { clientName: '', clientCompany: '' };
      }
      const matched = clientsMap.get(clientId);
      if (matched) {
        return {
          clientName: matched.name,
          clientCompany: matched.company,
        };
      }
      missingClientIds.push(clientId);
      if (import.meta.env.DEV) {
        console.warn(
          `[Dev] Missing client reference in ${recordType} (ID: ${recordId}) for clientId: ${clientId}`
        );
      }
      return {
        clientName: 'Missing client',
        clientCompany: 'Missing client',
      };
    };

    // Helper to resolve proposal reference
    const resolveProposalTitle = (
      proposalId: string | undefined,
      recordId: string,
      recordType: string
    ): string | undefined => {
      if (!proposalId) return undefined;
      const matched = proposalsMap.get(proposalId);
      if (matched) return matched.title;
      if (import.meta.env.DEV) {
        console.warn(
          `[Dev] Missing proposal reference in ${recordType} (ID: ${recordId}) for proposalId: ${proposalId}`
        );
      }
      return 'Missing proposal';
    };

    // 2. Hydrate proposals with client names
    const hydratedProposals: ProposalItem[] = rawProposals.map((p) => {
      const { clientName, clientCompany } = resolveClient((p as any).clientId, p.id, 'Proposal');
      return {
        ...p,
        clientName: clientName || p.clientName || 'Missing client',
        clientCompany: clientCompany || p.clientCompany || 'Missing client',
      };
    });

    // 3. Hydrate meetings with client and proposal names
    const hydratedMeetings: ScheduledMeetingItem[] = rawMeetings.map((m) => {
      const { clientName, clientCompany } = resolveClient((m as any).clientId, m.id, 'Meeting');
      const proposalTitle = resolveProposalTitle((m as any).proposalId, m.id, 'Meeting');
      return {
        ...m,
        clientName: clientName || m.clientName || 'Missing client',
        clientCompany: clientCompany || m.clientCompany || 'Missing client',
        proposalTitle: proposalTitle || m.proposalTitle,
      };
    });

    // 4. Hydrate projects with client names
    const hydratedProjects: ProjectItem[] = rawProjects.map((prj) => {
      const { clientName, clientCompany } = resolveClient((prj as any).clientId, prj.id, 'Project');
      return {
        ...prj,
        clientName: clientName || (prj as any).clientName,
        clientCompany: clientCompany || (prj as any).clientCompany,
      };
    });

    // 5. Hydrate tasks
    const hydratedTasks: TaskItem[] = rawTasks.map((t) => {
      const rawCId = (t as any).clientId;
      if (rawCId) {
        const { clientCompany } = resolveClient(rawCId, t.id, 'Task');
        return {
          ...t,
          clientCompany: clientCompany || 'Missing client',
        };
      }
      return t;
    });

    // 6. Hydrate follow-ups
    const hydratedFollowUps: FollowUpItem[] = rawFollowUps.map((f) => {
      const { clientCompany, clientName } = resolveClient((f as any).clientId, f.id, 'FollowUp');
      const proposalTitle = resolveProposalTitle((f as any).proposalId, f.id, 'FollowUp');
      return {
        ...f,
        clientCompany: clientCompany || f.clientCompany || 'Missing client',
        contactName: clientName || f.contactName || 'Missing client',
        proposalTitle: proposalTitle || f.proposalTitle || 'Missing proposal',
      };
    });

    // 7. Hydrate payments
    const hydratedPayments: DashboardPaymentItem[] = rawPayments.map((pay) => {
      const rawCId = (pay as any).clientId;
      if (rawCId) {
        const { clientCompany } = resolveClient(rawCId, pay.id, 'Payment');
        return {
          ...pay,
          clientCompany: clientCompany || pay.clientCompany || 'Missing client',
        };
      }
      return pay;
    });

    // 8. Development logging requirements
    if (import.meta.env.DEV && isAllLoaded) {
      console.log('[Dev] Number of proposals returned:', hydratedProposals.length);
      console.log('[Dev] Number of clients returned:', rawClients.length);
      if (missingClientIds.length > 0) {
        console.warn('[Dev] Missing client references count:', missingClientIds.length);
      }
    }

    // 9. Calculate metrics
    const metrics = calculateDashboardMetrics({
      proposals: hydratedProposals,
      clients: rawClients,
      meetings: hydratedMeetings,
      projects: hydratedProjects,
      tasks: hydratedTasks,
      payments: hydratedPayments,
    });

    onUpdate({
      businessId,
      userProfile: null,
      clients: rawClients,
      proposals: hydratedProposals,
      meetings: hydratedMeetings,
      projects: hydratedProjects,
      tasks: hydratedTasks,
      followUps: hydratedFollowUps,
      payments: hydratedPayments,
      metrics,
      clientsMap,
      proposalsMap,
      missingClientReferences: missingClientIds,
      isLoading: !isAllLoaded,
      error: null,
    });
  };

  const handleQueryError = (colName: string, err: unknown) => {
    handleFirestoreError(err, OperationType.LIST, colName);
    if (import.meta.env.DEV) {
      console.error(`[Dev] Firestore query error in ${colName}:`, err);
    }
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
  };

  // Queries filtered strictly by businessId (guarantees isolation)
  const qClients = query(collection(db, 'clients'), where('businessId', '==', businessId));
  const qProposals = query(collection(db, 'proposals'), where('businessId', '==', businessId));
  const qMeetings = query(collection(db, 'meetings'), where('businessId', '==', businessId));
  const qProjects = query(collection(db, 'projects'), where('businessId', '==', businessId));
  const qTasks = query(collection(db, 'tasks'), where('businessId', '==', businessId));
  const qFollowUps = query(collection(db, 'followUps'), where('businessId', '==', businessId));
  const qPayments = query(collection(db, 'payments'), where('businessId', '==', businessId));

  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      qClients,
      (snap) => {
        rawClients = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ClientItem));
        loadedState.clients = true;
        rehydrateAndDispatch();
      },
      (err) => handleQueryError('clients', err)
    )
  );

  unsubs.push(
    onSnapshot(
      qProposals,
      (snap) => {
        rawProposals = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ProposalItem));
        loadedState.proposals = true;
        rehydrateAndDispatch();
      },
      (err) => handleQueryError('proposals', err)
    )
  );

  unsubs.push(
    onSnapshot(
      qMeetings,
      (snap) => {
        rawMeetings = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ScheduledMeetingItem));
        loadedState.meetings = true;
        rehydrateAndDispatch();
      },
      (err) => handleQueryError('meetings', err)
    )
  );

  unsubs.push(
    onSnapshot(
      qProjects,
      (snap) => {
        rawProjects = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ProjectItem));
        loadedState.projects = true;
        rehydrateAndDispatch();
      },
      (err) => handleQueryError('projects', err)
    )
  );

  unsubs.push(
    onSnapshot(
      qTasks,
      (snap) => {
        rawTasks = snap.docs.map((d) => ({ ...d.data(), id: d.id } as TaskItem));
        loadedState.tasks = true;
        rehydrateAndDispatch();
      },
      (err) => handleQueryError('tasks', err)
    )
  );

  unsubs.push(
    onSnapshot(
      qFollowUps,
      (snap) => {
        rawFollowUps = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FollowUpItem));
        loadedState.followUps = true;
        rehydrateAndDispatch();
      },
      (err) => handleQueryError('followUps', err)
    )
  );

  unsubs.push(
    onSnapshot(
      qPayments,
      (snap) => {
        rawPayments = snap.docs.map((d) => ({ ...d.data(), id: d.id } as DashboardPaymentItem));
        loadedState.payments = true;
        rehydrateAndDispatch();
      },
      (err) => handleQueryError('payments', err)
    )
  );

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}

/**
 * Mutation helpers ensuring all written records include businessId and required relationships.
 */

export async function createClientRecord(
  businessId: string,
  clientData: Partial<ClientItem> & Pick<ClientItem, 'name' | 'company'>
): Promise<ClientItem> {
  const cleanId = sanitizeId(`cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const record: ClientItem = {
    id: cleanId,
    name: clientData.name,
    company: clientData.company,
    email: clientData.email || `contact@${clientData.company.toLowerCase().replace(/\s+/g, '')}.com`,
    industry: clientData.industry || 'Technology',
    totalProposals: clientData.totalProposals ?? 0,
    pipelineValue: clientData.pipelineValue ?? '$0',
    lastActivity: clientData.lastActivity ?? 'Added just now',
    status: clientData.status ?? 'Prospect',
  };
  (record as any).businessId = businessId;

  try {
    await setDoc(doc(db, 'clients', cleanId), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `clients/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error creating client:', err);
    throw err;
  }
  return record;
}

export async function createProposalRecord(
  businessId: string,
  clientId: string,
  proposalData: Omit<ProposalItem, 'id'>
): Promise<ProposalItem> {
  const cleanId = sanitizeId(`prop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const record: ProposalItem = {
    ...proposalData,
    id: cleanId,
  };
  (record as any).businessId = businessId;
  (record as any).clientId = clientId;

  try {
    await setDoc(doc(db, 'proposals', cleanId), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `proposals/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error creating proposal:', err);
    throw err;
  }
  return record;
}

export async function createMeetingRecord(
  businessId: string,
  clientId: string,
  meetingData: Omit<ScheduledMeetingItem, 'id'> & { proposalId?: string }
): Promise<ScheduledMeetingItem> {
  const cleanId = sanitizeId(`mtg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const record: ScheduledMeetingItem = {
    ...meetingData,
    id: cleanId,
  };
  (record as any).businessId = businessId;
  (record as any).clientId = clientId;
  if (meetingData.proposalId) {
    (record as any).proposalId = meetingData.proposalId;
  }

  try {
    await setDoc(doc(db, 'meetings', cleanId), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `meetings/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error creating meeting:', err);
    throw err;
  }
  return record;
}

export async function createTaskRecord(
  businessId: string,
  taskData: Omit<TaskItem, 'id'> & {
    clientId?: string;
    proposalId?: string;
    meetingId?: string;
    projectId?: string;
  }
): Promise<TaskItem> {
  const cleanId = sanitizeId(`tsk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const record: TaskItem = {
    ...taskData,
    id: cleanId,
  };
  (record as any).businessId = businessId;
  if (taskData.clientId) (record as any).clientId = taskData.clientId;
  if (taskData.proposalId) (record as any).proposalId = taskData.proposalId;
  if (taskData.meetingId) (record as any).meetingId = taskData.meetingId;
  if (taskData.projectId) (record as any).projectId = taskData.projectId;

  try {
    await setDoc(doc(db, 'tasks', cleanId), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `tasks/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error creating task:', err);
    throw err;
  }
  return record;
}

export async function createPaymentRecord(
  businessId: string,
  clientId: string,
  paymentData: Omit<DashboardPaymentItem, 'id'> & { proposalId?: string }
): Promise<DashboardPaymentItem> {
  const cleanId = sanitizeId(`pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const record: DashboardPaymentItem = {
    ...paymentData,
    id: cleanId,
  };
  (record as any).businessId = businessId;
  (record as any).clientId = clientId;
  if (paymentData.proposalId) {
    (record as any).proposalId = paymentData.proposalId;
  }

  try {
    await setDoc(doc(db, 'payments', cleanId), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `payments/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error creating payment:', err);
    throw err;
  }
  return record;
}

export async function createProjectRecord(
  businessId: string,
  clientId: string,
  projectData: Omit<ProjectItem, 'id'>
): Promise<ProjectItem> {
  const cleanId = sanitizeId(`prj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  const record: ProjectItem = {
    ...projectData,
    id: cleanId,
  };
  (record as any).businessId = businessId;
  (record as any).clientId = clientId;

  try {
    await setDoc(doc(db, 'projects', cleanId), {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `projects/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error creating project:', err);
    throw err;
  }
  return record;
}

export async function updateTaskStatusInFirestore(
  taskId: string,
  newStatus: 'today' | 'in_progress' | 'completed'
): Promise<void> {
  const cleanId = sanitizeId(taskId);
  try {
    await updateDoc(doc(db, 'tasks', cleanId), {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `tasks/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error updating task status:', err);
  }
}

export async function updatePaymentStatusInFirestore(
  paymentId: string,
  newStatus: 'Paid' | 'Pending' | 'Overdue',
  paymentMethod?: string,
  paidDate?: string
): Promise<void> {
  const cleanId = sanitizeId(paymentId);
  try {
    const updateData: any = {
      status: newStatus,
      paidDate: paidDate || (newStatus === 'Paid' ? 'Today' : undefined),
      updatedAt: serverTimestamp(),
    };
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }
    await updateDoc(doc(db, 'payments', cleanId), updateData);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `payments/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error updating payment status:', err);
  }
}

export async function updateProposalInFirestore(
  proposalId: string,
  partial: Partial<ProposalItem>
): Promise<void> {
  const cleanId = sanitizeId(proposalId);
  try {
    await updateDoc(doc(db, 'proposals', cleanId), {
      ...partial,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `proposals/${cleanId}`);
    if (import.meta.env.DEV) console.error('[Dev] Firestore query error updating proposal:', err);
  }
}

export async function deleteRecordFromFirestore(
  collectionName: 'clients' | 'proposals' | 'meetings' | 'projects' | 'tasks' | 'followUps' | 'payments',
  recordId: string
): Promise<void> {
  const cleanId = sanitizeId(recordId);
  try {
    await deleteDoc(doc(db, collectionName, cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${cleanId}`);
    if (import.meta.env.DEV) console.error(`[Dev] Firestore query error deleting from ${collectionName}:`, err);
  }
}
