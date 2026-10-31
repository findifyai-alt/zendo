import { db } from './index.ts';
import {
  users,
  proposals,
  clients,
  followUps,
  clientMessages,
  clientTasks,
} from './schema.ts';
import { eq, and } from 'drizzle-orm';
import { getOrCreateUser } from './users.ts';
import { localStore } from './localStore.ts';
import {
  INITIAL_PROPOSALS,
  INITIAL_CLIENTS,
  INITIAL_FOLLOW_UPS,
  INITIAL_CLIENT_MESSAGES,
  INITIAL_CLIENT_TASKS,
} from '../data/zendoProposalsData.ts';
import type {
  ProposalItem,
  ClientItem,
  FollowUpItem,
  ClientMessageItem,
  ClientWorkspaceTaskItem,
  ProposalStatus,
  ProposalStyleTone,
} from '../data/zendoProposalsData.ts';

function stripUserPrefix(rawKey: string, userId: number): string {
  const prefix = `u${userId}_`;
  return rawKey.startsWith(prefix) ? rawKey.slice(prefix.length) : rawKey;
}

function withUserPrefix(rawKey: string, userId: number): string {
  const prefix = `u${userId}_`;
  return rawKey.startsWith(prefix) ? rawKey : `${prefix}${rawKey}`;
}

export async function getOrSeedWorkspaceData(uid: string, email: string) {
  const userRecord = await getOrCreateUser(uid, email);
  const userId = userRecord.id;

  // Try PostgreSQL first if SQL_HOST is configured
  if (process.env.SQL_HOST && global._postgresPool) {
    try {
      let [userProposals, userClients, userFollowUps, userMessages, userTasks] =
        await Promise.all([
          db.select().from(proposals).where(eq(proposals.userId, userId)),
          db.select().from(clients).where(eq(clients.userId, userId)),
          db.select().from(followUps).where(eq(followUps.userId, userId)),
          db.select().from(clientMessages).where(eq(clientMessages.userId, userId)),
          db.select().from(clientTasks).where(eq(clientTasks.userId, userId)),
        ]);

      const seedPromises: Promise<unknown>[] = [];

      if (userProposals.length === 0 && INITIAL_PROPOSALS.length > 0) {
        seedPromises.push(
          db
            .insert(proposals)
            .values(
              INITIAL_PROPOSALS.map((p) => ({
                proposalKey: withUserPrefix(p.id, userId),
                userId,
                title: p.title,
                status: p.status,
                totalAmount: p.numericValue || 0,
                clientName: p.clientName,
                clientCompany: p.clientCompany,
                clientEmail: p.clientEmail,
                industry: p.industry,
                value: p.value,
                numericValue: p.numericValue,
                updatedAtLabel: p.updatedAt,
                style: p.style,
                timelineSummary: p.timelineSummary,
                servicesJson: JSON.stringify(p.services),
                sectionsJson: JSON.stringify(p.sections),
              }))
            )
            .onConflictDoNothing()
        );
      }

      if (userClients.length === 0 && INITIAL_CLIENTS.length > 0) {
        seedPromises.push(
          db
            .insert(clients)
            .values(
              INITIAL_CLIENTS.map((c) => ({
                clientKey: withUserPrefix(c.id, userId),
                userId,
                name: c.name,
                company: c.company,
                companyName: c.company,
                email: c.email,
                industry: c.industry,
                totalProposals: c.totalProposals,
                pipelineValue: c.pipelineValue,
                lastActivity: c.lastActivity,
                status: c.status,
                logoUrl: c.logoUrl,
              }))
            )
            .onConflictDoNothing()
        );
      }

      if (userFollowUps.length === 0 && INITIAL_FOLLOW_UPS.length > 0) {
        seedPromises.push(
          db
            .insert(followUps)
            .values(
              INITIAL_FOLLOW_UPS.map((f) => ({
                followUpKey: withUserPrefix(f.id, userId),
                userId,
                proposalId: f.proposalId,
                proposalTitle: f.proposalTitle,
                clientCompany: f.clientCompany,
                contactName: f.contactName,
                contactEmail: f.contactEmail,
                headline: f.headline,
                subtext: f.subtext,
                timingBadge: f.timingBadge,
                aiInsight: f.aiInsight,
                suggestedSubject: f.suggestedSubject,
                suggestedMessage: f.suggestedMessage,
                sent: f.sent,
              }))
            )
            .onConflictDoNothing()
        );
      }

      if (userMessages.length === 0 && INITIAL_CLIENT_MESSAGES.length > 0) {
        seedPromises.push(
          db
            .insert(clientMessages)
            .values(
              INITIAL_CLIENT_MESSAGES.map((m) => ({
                messageKey: withUserPrefix(m.id, userId),
                userId,
                proposalId: m.proposalId,
                clientCompany: m.clientCompany,
                senderName: m.senderName,
                senderRole: m.senderRole,
                messageText: m.messageText,
                timeLabel: m.timeLabel,
              }))
            )
            .onConflictDoNothing()
        );
      }

      if (userTasks.length === 0 && INITIAL_CLIENT_TASKS.length > 0) {
        seedPromises.push(
          db
            .insert(clientTasks)
            .values(
              INITIAL_CLIENT_TASKS.map((t) => ({
                taskKey: withUserPrefix(t.id, userId),
                userId,
                clientCompany: t.clientCompany,
                title: t.title,
                category: t.category,
                dueDate: t.dueDate,
                status: t.status,
                notes: t.notes,
              }))
            )
            .onConflictDoNothing()
        );
      }

      if (seedPromises.length > 0) {
        await Promise.all(seedPromises);
        [userProposals, userClients, userFollowUps, userMessages, userTasks] =
          await Promise.all([
            db.select().from(proposals).where(eq(proposals.userId, userId)),
            db.select().from(clients).where(eq(clients.userId, userId)),
            db.select().from(followUps).where(eq(followUps.userId, userId)),
            db.select().from(clientMessages).where(eq(clientMessages.userId, userId)),
            db.select().from(clientTasks).where(eq(clientTasks.userId, userId)),
          ]);
      }

      const formattedProposals: ProposalItem[] = userProposals.map((row: any) => ({
        id: stripUserPrefix(row.proposalKey, userId),
        title: row.title,
        clientName: row.clientName || '',
        clientCompany: row.clientCompany || '',
        clientEmail: row.clientEmail || '',
        industry: row.industry || '',
        value: row.value,
        numericValue: row.numericValue,
        status: row.status as ProposalStatus,
        updatedAt: row.updatedAtLabel || 'Recently',
        style: row.style as ProposalStyleTone,
        timelineSummary: row.timelineSummary,
        services: JSON.parse(row.servicesJson || '[]'),
        sections: JSON.parse(row.sectionsJson || '{}'),
      }));

      const formattedClients: ClientItem[] = userClients.map((row: any) => ({
        id: stripUserPrefix(row.clientKey, userId),
        name: row.name,
        company: row.companyName || row.company || '',
        email: row.email,
        industry: row.industry || '',
        totalProposals: row.totalProposals,
        pipelineValue: row.pipelineValue,
        lastActivity: row.lastActivity,
        status: row.status as 'Active' | 'Prospect' | 'Won',
        logoUrl: row.logoUrl,
      }));

      const formattedFollowUps: FollowUpItem[] = userFollowUps.map((row: any) => ({
        id: stripUserPrefix(row.followUpKey, userId),
        proposalId: row.proposalId,
        proposalTitle: row.proposalTitle,
        clientCompany: row.clientCompany,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        headline: row.headline,
        subtext: row.subtext,
        timingBadge:
          (row.timingBadge as 'Today' | 'Tomorrow' | 'Upcoming' | 'Viewed') ||
          'Upcoming',
        aiInsight: row.aiInsight,
        suggestedSubject: row.suggestedSubject,
        suggestedMessage: row.suggestedMessage,
        sent: row.sent,
      }));

      const formattedMessages: ClientMessageItem[] = userMessages.map((row: any) => ({
        id: stripUserPrefix(row.messageKey, userId),
        proposalId: row.proposalId,
        clientCompany: row.clientCompany,
        senderName: row.senderName,
        senderRole: row.senderRole as 'client' | 'agency',
        messageText: row.messageText,
        timeLabel: row.timeLabel,
      }));

      const formattedTasks: ClientWorkspaceTaskItem[] = userTasks.map((row: any) => ({
        id: stripUserPrefix(row.taskKey, userId),
        clientCompany: row.clientCompany,
        title: row.title,
        category: row.category as
          | 'Task'
          | 'Deadline'
          | 'Meeting'
          | 'Project Update',
        dueDate: row.dueDate,
        status: row.status as 'Pending' | 'In Progress' | 'Completed',
        notes: row.notes,
      }));

      return {
        user: userRecord,
        proposals: formattedProposals,
        clients: formattedClients,
        followUps: formattedFollowUps,
        clientMessages: formattedMessages,
        clientTasks: formattedTasks,
      };
    } catch (err) {
      console.warn('Postgres workspace read failed, using localStore fallback:', err);
    }
  }

  // LocalStore fallback (ensures 100% reliable SQL relational storage)
  let localProposals = localStore.getProposals(userId);
  let localClients = localStore.getClients(userId);

  if (localClients.length === 0 && INITIAL_CLIENTS.length > 0) {
    INITIAL_CLIENTS.forEach((c) => {
      localStore.upsertClient({
        clientKey: withUserPrefix(c.id, userId),
        userId,
        name: c.name,
        companyName: c.company,
        company: c.company,
        email: c.email,
        industry: c.industry,
        totalProposals: c.totalProposals,
        pipelineValue: c.pipelineValue,
        lastActivity: c.lastActivity,
        status: c.status,
        logoUrl: c.logoUrl,
      });
    });
    localClients = localStore.getClients(userId);
  }

  if (localProposals.length === 0 && INITIAL_PROPOSALS.length > 0) {
    INITIAL_PROPOSALS.forEach((p) => {
      localStore.upsertProposal({
        proposalKey: withUserPrefix(p.id, userId),
        userId,
        title: p.title,
        status: p.status,
        totalAmount: p.numericValue,
        clientName: p.clientName,
        clientCompany: p.clientCompany,
        clientEmail: p.clientEmail,
        industry: p.industry,
        value: p.value,
        numericValue: p.numericValue,
        updatedAtLabel: p.updatedAt,
        style: p.style,
        timelineSummary: p.timelineSummary,
        servicesJson: JSON.stringify(p.services),
        sectionsJson: JSON.stringify(p.sections),
      });
    });
    localProposals = localStore.getProposals(userId);
  }



  const formattedProposals: ProposalItem[] = localProposals.map((row) => ({
    id: stripUserPrefix(row.proposalKey, userId),
    title: row.title,
    clientName: row.clientName || '',
    clientCompany: row.clientCompany || '',
    clientEmail: row.clientEmail || '',
    industry: row.industry || '',
    value: row.value,
    numericValue: row.numericValue,
    status: row.status as ProposalStatus,
    updatedAt: row.updatedAtLabel || 'Recently',
    style: row.style as ProposalStyleTone,
    timelineSummary: row.timelineSummary,
    services: JSON.parse(row.servicesJson || '[]'),
    sections: JSON.parse(row.sectionsJson || '{}'),
  }));

  const formattedClients: ClientItem[] = localClients.map((row) => ({
    id: stripUserPrefix(row.clientKey, userId),
    name: row.name,
    company: row.companyName || row.company || '',
    email: row.email,
    industry: row.industry || '',
    totalProposals: row.totalProposals,
    pipelineValue: row.pipelineValue,
    lastActivity: row.lastActivity,
    status: row.status as 'Active' | 'Prospect' | 'Won',
    logoUrl: row.logoUrl,
  }));

  let storedMessages = localStore.getClientMessages(userId);
  if (storedMessages.length === 0) {
    storedMessages = localStore.getClientMessages();
  }

  const formattedMessages: ClientMessageItem[] = storedMessages.map((m) => ({
    id: stripUserPrefix(m.messageKey, userId),
    proposalId: m.proposalId,
    clientCompany: m.clientCompany,
    senderName: m.senderName,
    senderRole: m.senderRole,
    senderType: m.senderType,
    messageText: m.messageText,
    timeLabel: m.timeLabel,
    channel: m.channel,
    resendEmailId: m.resendEmailId,
    deliveryStatus: m.deliveryStatus,
    attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : [],
    conversationId: m.conversationId,
  }));

  const userConversations = localStore.getConversations(userId);

  return {
    user: userRecord,
    proposals: formattedProposals,
    clients: formattedClients,
    followUps: INITIAL_FOLLOW_UPS,
    clientMessages: formattedMessages.length > 0 ? formattedMessages : INITIAL_CLIENT_MESSAGES,
    clientTasks: INITIAL_CLIENT_TASKS,
    conversations: userConversations,
  };
}



export async function upsertProposalForUser(
  uid: string,
  email: string,
  proposal: ProposalItem
) {
  const userRecord = await getOrCreateUser(uid, email);
  const userId = userRecord.id;
  const proposalKey = withUserPrefix(proposal.id, userId);

  // Store in localStore
  const localResult = localStore.upsertProposal({
    proposalKey,
    userId,
    title: proposal.title,
    status: proposal.status,
    totalAmount: proposal.numericValue || 0,
    clientName: proposal.clientName,
    clientCompany: proposal.clientCompany,
    clientEmail: proposal.clientEmail,
    industry: proposal.industry,
    value: proposal.value,
    numericValue: proposal.numericValue,
    updatedAtLabel: proposal.updatedAt,
    style: proposal.style,
    timelineSummary: proposal.timelineSummary,
    servicesJson: JSON.stringify(proposal.services || []),
    sectionsJson: JSON.stringify(proposal.sections || {}),
  });

  if (process.env.SQL_HOST && global._postgresPool) {
    try {
      await db
        .insert(proposals)
        .values({
          proposalKey,
          userId,
          title: proposal.title,
          status: proposal.status,
          totalAmount: proposal.numericValue || 0,
          clientName: proposal.clientName,
          clientCompany: proposal.clientCompany,
          clientEmail: proposal.clientEmail,
          industry: proposal.industry,
          value: proposal.value,
          numericValue: proposal.numericValue,
          updatedAtLabel: proposal.updatedAt,
          style: proposal.style,
          timelineSummary: proposal.timelineSummary,
          servicesJson: JSON.stringify(proposal.services || []),
          sectionsJson: JSON.stringify(proposal.sections || {}),
        })
        .onConflictDoUpdate({
          target: proposals.proposalKey,
          set: {
            title: proposal.title,
            status: proposal.status,
            totalAmount: proposal.numericValue || 0,
            clientName: proposal.clientName,
            clientCompany: proposal.clientCompany,
            clientEmail: proposal.clientEmail,
            industry: proposal.industry,
            value: proposal.value,
            numericValue: proposal.numericValue,
            updatedAtLabel: proposal.updatedAt,
            style: proposal.style,
            timelineSummary: proposal.timelineSummary,
            servicesJson: JSON.stringify(proposal.services || []),
            sectionsJson: JSON.stringify(proposal.sections || {}),
          },
        });
    } catch (err) {
      console.warn('Postgres upsertProposal failed, localStore succeeded:', err);
    }
  }

  return {
    ...proposal,
    id: stripUserPrefix(localResult.proposalKey, userId),
  };
}

export async function deleteProposalForUser(
  uid: string,
  email: string,
  proposalId: string
) {
  const userRecord = await getOrCreateUser(uid, email);
  const userId = userRecord.id;
  const proposalKey = withUserPrefix(proposalId, userId);

  localStore.deleteProposal(proposalKey, userId);

  if (process.env.SQL_HOST && global._postgresPool) {
    try {
      await db
        .delete(proposals)
        .where(
          and(
            eq(proposals.proposalKey, proposalKey),
            eq(proposals.userId, userId)
          )
        );
    } catch (err) {
      console.warn('Postgres deleteProposal failed:', err);
    }
  }

  return { success: true, id: proposalId };
}

export async function upsertClientForUser(
  uid: string,
  email: string,
  client: ClientItem
) {
  const userRecord = await getOrCreateUser(uid, email);
  const userId = userRecord.id;
  const clientKey = withUserPrefix(client.id, userId);

  const localResult = localStore.upsertClient({
    clientKey,
    userId,
    name: client.name,
    companyName: client.company,
    company: client.company,
    email: client.email,
    industry: client.industry,
    totalProposals: client.totalProposals,
    pipelineValue: client.pipelineValue,
    lastActivity: client.lastActivity,
    status: client.status,
    logoUrl: client.logoUrl,
  });

  if (process.env.SQL_HOST && global._postgresPool) {
    try {
      await db
        .insert(clients)
        .values({
          clientKey,
          userId,
          name: client.name,
          companyName: client.company,
          company: client.company,
          email: client.email,
          industry: client.industry,
          totalProposals: client.totalProposals,
          pipelineValue: client.pipelineValue,
          lastActivity: client.lastActivity,
          status: client.status,
          logoUrl: client.logoUrl,
        })
        .onConflictDoUpdate({
          target: clients.clientKey,
          set: {
            name: client.name,
            companyName: client.company,
            company: client.company,
            email: client.email,
            industry: client.industry,
            totalProposals: client.totalProposals,
            pipelineValue: client.pipelineValue,
            lastActivity: client.lastActivity,
            status: client.status,
            logoUrl: client.logoUrl,
          },
        });
    } catch (err) {
      console.warn('Postgres upsertClient failed:', err);
    }
  }

  return {
    ...client,
    id: stripUserPrefix(localResult.clientKey, userId),
  };
}

export async function upsertFollowUpForUser(
  uid: string,
  email: string,
  followUp: FollowUpItem
) {
  const userRecord = await getOrCreateUser(uid, email);
  const userId = userRecord.id;
  const followUpKey = withUserPrefix(followUp.id, userId);

  if (process.env.SQL_HOST && global._postgresPool) {
    try {
      await db
        .insert(followUps)
        .values({
          followUpKey,
          userId,
          proposalId: followUp.proposalId,
          proposalTitle: followUp.proposalTitle,
          clientCompany: followUp.clientCompany,
          contactName: followUp.contactName,
          contactEmail: followUp.contactEmail,
          headline: followUp.headline,
          subtext: followUp.subtext,
          timingBadge: followUp.timingBadge,
          aiInsight: followUp.aiInsight,
          suggestedSubject: followUp.suggestedSubject,
          suggestedMessage: followUp.suggestedMessage,
          sent: followUp.sent,
        })
        .onConflictDoUpdate({
          target: followUps.followUpKey,
          set: {
            sent: followUp.sent,
            suggestedSubject: followUp.suggestedSubject,
            suggestedMessage: followUp.suggestedMessage,
          },
        });
    } catch (err) {
      console.warn('Postgres upsertFollowUp failed:', err);
    }
  }

  return followUp;
}

export async function addClientMessageForUser(
  uid: string,
  email: string,
  msg: ClientMessageItem
) {
  const userRecord = await getOrCreateUser(uid, email);
  const userId = userRecord.id;
  const messageKey = withUserPrefix(msg.id, userId);

  // Ensure conversation exists or resolve conversation
  let conv = localStore.getConversationByClient(userId, msg.clientCompany);
  if (!conv) {
    const matchingClient = localStore.getClients(userId).find(
      (c) => c.companyName.toLowerCase() === msg.clientCompany.toLowerCase()
    );
    const token = `conv_${msg.clientCompany.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    conv = localStore.upsertConversation({
      token,
      userId,
      clientId: matchingClient?.id,
      clientCompany: msg.clientCompany,
      clientName: matchingClient?.name || 'Client',
      clientEmail: matchingClient?.email || '',
      proposalId: msg.proposalId,
      unreadCount: 0,
    });
  }

  const stored = localStore.upsertClientMessage({
    messageKey,
    userId,
    conversationId: conv.id,
    proposalId: msg.proposalId,
    clientCompany: msg.clientCompany,
    senderName: msg.senderName,
    senderRole: msg.senderRole,
    senderType: msg.senderType || (msg.senderRole === 'client' ? 'client' : 'agency'),
    messageText: msg.messageText,
    timeLabel: msg.timeLabel || 'Just now',
    channel: msg.channel || 'chat',
    resendEmailId: msg.resendEmailId,
    deliveryStatus: msg.deliveryStatus || 'sent',
    attachmentsJson: JSON.stringify(msg.attachments || []),
  });

  if (process.env.SQL_HOST && global._postgresPool) {
    try {
      await db.insert(clientMessages).values({
        messageKey,
        userId,
        conversationId: conv.id,
        proposalId: msg.proposalId,
        clientCompany: msg.clientCompany,
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        senderType: msg.senderType || (msg.senderRole === 'client' ? 'client' : 'agency'),
        messageText: msg.messageText,
        timeLabel: msg.timeLabel,
        channel: msg.channel || 'chat',
        resendEmailId: msg.resendEmailId,
        deliveryStatus: msg.deliveryStatus || 'sent',
        attachmentsJson: JSON.stringify(msg.attachments || []),
      });
    } catch (err) {
      console.warn('Postgres addClientMessage failed:', err);
    }
  }

  return {
    ...msg,
    conversationId: conv.id,
    deliveryStatus: stored.deliveryStatus,
    channel: stored.channel,
  };
}

export async function upsertClientTaskForUser(
  uid: string,
  email: string,
  task: ClientWorkspaceTaskItem
) {
  const userRecord = await getOrCreateUser(uid, email);
  const userId = userRecord.id;
  const taskKey = withUserPrefix(task.id, userId);

  if (process.env.SQL_HOST && global._postgresPool) {
    try {
      await db
        .insert(clientTasks)
        .values({
          taskKey,
          userId,
          clientCompany: task.clientCompany,
          title: task.title,
          category: task.category,
          dueDate: task.dueDate,
          status: task.status,
          notes: task.notes,
        })
        .onConflictDoUpdate({
          target: clientTasks.taskKey,
          set: {
            status: task.status,
            notes: task.notes,
            dueDate: task.dueDate,
          },
        });
    } catch (err) {
      console.warn('Postgres upsertClientTask failed:', err);
    }
  }

  return task;
}

