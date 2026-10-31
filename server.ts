import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { OpenAI } from 'openai';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, updateUserSetupInDb } from './src/db/users.ts';
import {
  getOrSeedWorkspaceData,
  upsertProposalForUser,
  deleteProposalForUser,
  upsertClientForUser,
  upsertFollowUpForUser,
  addClientMessageForUser,
  upsertClientTaskForUser,
} from './src/db/workspace.ts';
import { localStore, executeRawSql } from './src/db/localStore.ts';
import { encryptData, decryptData, maskKey } from './src/server/crypto.ts';
import { getEmailClient, sendTestEmail, sendChatEmail } from './src/server/emailService.ts';
import { verifyResendWebhookSignature, handleResendWebhookPayload } from './src/server/emailWebhook.ts';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NVIDIA Nemotron AI Clients (Parse for layout/multimodal document parsing, Lightning 30B for reasoning & structured output)
const NVIDIA_PARSE_API_KEY =
  process.env.NVIDIA_PARSE_API_KEY ||
  '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';

const NVIDIA_REASONING_API_KEY =
  process.env.NVIDIA_REASONING_API_KEY ||
  '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';

const reasoningClient = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: NVIDIA_REASONING_API_KEY,
});

async function startServer() {
  const app = express();
  
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
  const PORT = cliPort || (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

  const hostArgIndex = process.argv.indexOf('--host');
  const cliHost = hostArgIndex !== -1 && process.argv[hostArgIndex + 1] ? process.argv[hostArgIndex + 1] : undefined;
  const HOST = cliHost || process.env.HOST || '0.0.0.0';

  app.use(
    express.json({
      limit: '25mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Endpoint to download the entire project as a ZIP archive
  app.get('/api/download-project-zip', (_req, res) => {
    const zipPath = path.join(__dirname, 'public', 'zendo-project-source.zip');
    if (fs.existsSync(zipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="zendo-project-source.zip"');
      return res.sendFile(zipPath);
    }
    return res.status(404).json({ error: 'Project zip archive not found. Please regenerate.' });
  });

  // Authenticated Workspace Bootstrap (loads or seeds user, proposals, clients, follow-ups, client messages, and client tasks)
  app.get('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const data = await getOrSeedWorkspaceData(uid, email);
      return res.json(data);
    } catch (error: unknown) {
      console.error('Failed to load workspace data:', error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load workspace data',
      });
    }
  });

  // Update User & Workspace Onboarding Setup
  app.post('/api/workspace/setup', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const {
        companyName,
        industry,
        servicesOffered,
        brandColor,
        typicalClientType,
        currency,
        proposalTone,
      } = req.body || {};

      const updated = await updateUserSetupInDb(uid, email, {
        workspaceName: companyName || 'Zendo Studio',
        industry: industry || 'Design & Creative Agency',
        servicesOffered:
          servicesOffered || 'Web Design, Brand Strategy, UI/UX',
        brandColor: brandColor || '#1f7a4c',
        typicalClientType: typicalClientType || 'B2B SaaS & Growing Brands',
        currency: currency || 'USD ($)',
        proposalTone: proposalTone || 'Professional',
      });
      return res.json({ user: updated });
    } catch (error: unknown) {
      console.error('Failed to save workspace setup:', error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save workspace setup',
      });
    }
  });

  // Upsert Proposal
  app.post('/api/proposals', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const proposal = await upsertProposalForUser(uid, email, req.body);
      return res.json({ proposal });
    } catch (error: unknown) {
      console.error('Failed to save proposal:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to save proposal',
      });
    }
  });

  // Delete Proposal
  app.delete(
    '/api/proposals/:id',
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const uid = req.user?.uid;
        const email = req.user?.email || 'alex@zendo.ai';
        if (!uid) {
          return res.status(401).json({ error: 'Unauthorized user' });
        }
        const result = await deleteProposalForUser(
          uid,
          email,
          String(req.params.id)
        );
        return res.json(result);
      } catch (error: unknown) {
        console.error('Failed to delete proposal:', error);
        return res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to delete proposal',
        });
      }
    }
  );

  // Upsert Client
  app.post('/api/clients', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const client = await upsertClientForUser(uid, email, req.body);
      return res.json({ client });
    } catch (error: unknown) {
      console.error('Failed to save client:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to save client',
      });
    }
  });

  // Upsert Follow-up
  app.post('/api/follow-ups', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const followUp = await upsertFollowUpForUser(uid, email, req.body);
      return res.json({ followUp });
    } catch (error: unknown) {
      console.error('Failed to save follow-up:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to save follow-up',
      });
    }
  });

  // Add or Reply to Client Message
  app.post('/api/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const message = await addClientMessageForUser(uid, email, req.body);

      // Trigger outbound email if client has no active portal session
      if (req.body.senderRole === 'agency' || req.body.senderType === 'agency') {
        const convId = (message as any).conversationId;
        if (convId) {
          void sendChatEmail(convId, message.id).catch((err) => {
            console.warn('sendChatEmail background error:', err);
          });
        }
      }

      return res.json({ message });
    } catch (error: unknown) {
      console.error('Failed to save client message:', error);
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save client message',
      });
    }
  });

  // Upsert Client Task / Deadline / Meeting / Project Update
  app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const task = await upsertClientTaskForUser(uid, email, req.body);
      return res.json({ task });
    } catch (error: unknown) {
      console.error('Failed to save client task:', error);
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to save client task',
      });
    }
  });

  // Ensure user endpoint
  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const { displayName, workspaceName } = req.body || {};
      const userRecord = await getOrCreateUser(
        uid,
        email,
        displayName,
        workspaceName
      );
      return res.json({ user: userRecord });
    } catch (error: unknown) {
      console.error('Failed to sync user:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to sync user',
      });
    }
  });

  // Execute Arbitrary SQL Query (SELECT, INSERT, UPDATE, DELETE, JOIN, GROUP BY)
  app.post('/api/sql/query', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { query, params } = req.body || {};
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'SQL query string is required' });
      }
      const result = executeRawSql(query, Array.isArray(params) ? params : []);
      return res.json(result);
    } catch (error: unknown) {
      console.error('SQL execution failed:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'SQL execution failed',
      });
    }
  });

  // Get SQL Database Schema and Table Summaries
  app.get('/api/sql/schema', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const state = localStore.getState();
      const tables = [
        {
          name: 'users',
          description: 'Authenticated accounts and business profiles',
          rowCount: state.users.length,
          columns: [
            { name: 'id', type: 'INT', isPrimary: true },
            { name: 'uid', type: 'STRING' },
            { name: 'email', type: 'STRING' },
            { name: 'displayName', type: 'STRING' },
            { name: 'workspaceName', type: 'STRING' },
            { name: 'industry', type: 'STRING' },
            { name: 'currency', type: 'STRING' },
            { name: 'proposalTone', type: 'STRING' },
            { name: 'createdAt', type: 'TIMESTAMP' },
          ],
        },
        {
          name: 'clients',
          description: 'Client roster with pipeline value and status',
          rowCount: state.clients.length,
          columns: [
            { name: 'id', type: 'INT', isPrimary: true },
            { name: 'clientKey', type: 'STRING' },
            { name: 'userId', type: 'INT', isForeign: true },
            { name: 'name', type: 'STRING' },
            { name: 'email', type: 'STRING' },
            { name: 'companyName', type: 'STRING' },
            { name: 'industry', type: 'STRING' },
            { name: 'pipelineValue', type: 'STRING' },
            { name: 'status', type: 'STRING' },
            { name: 'logoUrl', type: 'STRING' },
          ],
        },
        {
          name: 'proposals',
          description: 'Proposals with scope, value, status and style',
          rowCount: state.proposals.length,
          columns: [
            { name: 'id', type: 'INT', isPrimary: true },
            { name: 'proposalKey', type: 'STRING' },
            { name: 'userId', type: 'INT', isForeign: true },
            { name: 'clientId', type: 'INT', isForeign: true },
            { name: 'title', type: 'STRING' },
            { name: 'status', type: 'STRING' },
            { name: 'totalAmount', type: 'FLOAT' },
            { name: 'clientName', type: 'STRING' },
            { name: 'clientCompany', type: 'STRING' },
            { name: 'value', type: 'STRING' },
            { name: 'style', type: 'STRING' },
            { name: 'createdAt', type: 'TIMESTAMP' },
          ],
        },
        {
          name: 'meetings',
          description: 'Client strategy sessions, reviews and kickoff calls',
          rowCount: state.meetings.length,
          columns: [
            { name: 'id', type: 'INT', isPrimary: true },
            { name: 'meetingKey', type: 'STRING' },
            { name: 'userId', type: 'INT', isForeign: true },
            { name: 'clientId', type: 'INT', isForeign: true },
            { name: 'title', type: 'STRING' },
            { name: 'clientCompany', type: 'STRING' },
            { name: 'date', type: 'STRING' },
            { name: 'time', type: 'STRING' },
            { name: 'status', type: 'STRING' },
            { name: 'platform', type: 'STRING' },
          ],
        },
        {
          name: 'tasks',
          description: 'Action items, deliverables and review milestones',
          rowCount: state.tasks.length,
          columns: [
            { name: 'id', type: 'INT', isPrimary: true },
            { name: 'taskKey', type: 'STRING' },
            { name: 'userId', type: 'INT', isForeign: true },
            { name: 'clientId', type: 'INT', isForeign: true },
            { name: 'title', type: 'STRING' },
            { name: 'project', type: 'STRING' },
            { name: 'status', type: 'STRING' },
            { name: 'priority', type: 'STRING' },
            { name: 'dueDate', type: 'STRING' },
            { name: 'assignee', type: 'STRING' },
          ],
        },
        {
          name: 'payments',
          description: 'Client invoices, milestone retainers, and billing status',
          rowCount: state.payments.length,
          columns: [
            { name: 'id', type: 'INT', isPrimary: true },
            { name: 'paymentKey', type: 'STRING' },
            { name: 'userId', type: 'INT', isForeign: true },
            { name: 'clientId', type: 'INT', isForeign: true },
            { name: 'invoiceNumber', type: 'STRING' },
            { name: 'clientCompany', type: 'STRING' },
            { name: 'projectTitle', type: 'STRING' },
            { name: 'amount', type: 'FLOAT' },
            { name: 'status', type: 'STRING' },
            { name: 'dueDate', type: 'STRING' },
          ],
        },
      ];
      return res.json({ tables, totalRecords: tables.reduce((acc, t) => acc + t.rowCount, 0) });
    } catch (error: unknown) {
      console.error('Failed to get schema:', error);
      return res.status(500).json({ error: 'Failed to inspect database schema' });
    }
  });

  // Sync Batch Records to SQL Store (keeps SQL database in continuous sync with all UI changes)
  app.post('/api/sql/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) {
        return res.status(401).json({ error: 'Unauthorized user' });
      }
      const userRecord = await getOrCreateUser(uid, email);
      const userId = userRecord.id;
      const { clients: rawClients, proposals: rawProposals, meetings: rawMeetings, tasks: rawTasks, payments: rawPayments } = req.body || {};

      if (Array.isArray(rawClients)) {
        rawClients.forEach((c: any) => {
          localStore.upsertClient({
            clientKey: c.id || c.clientKey || `c-${Date.now()}`,
            userId,
            name: c.name || 'Client',
            email: c.email || '',
            companyName: c.company || c.companyName || 'Company',
            industry: c.industry || 'Technology',
            pipelineValue: c.pipelineValue || '$0',
            status: c.status || 'Active',
            logoUrl: c.logoUrl || c.logo_url || '',
          });
        });
      }

      if (Array.isArray(rawProposals)) {
        rawProposals.forEach((p: any) => {
          localStore.upsertProposal({
            proposalKey: p.id || p.proposalKey || `p-${Date.now()}`,
            userId,
            title: p.title || 'Proposal',
            status: p.status || 'Draft',
            totalAmount: p.numericValue || p.totalAmount || 0,
            value: p.value || `$${p.numericValue || 0}`,
            clientName: p.clientName || '',
            clientCompany: p.clientCompany || '',
            clientEmail: p.clientEmail || '',
            industry: p.industry || '',
            style: p.style || 'Professional',
          });
        });
      }

      if (Array.isArray(rawMeetings)) {
        rawMeetings.forEach((m: any) => {
          localStore.upsertMeeting({
            meetingKey: m.id || m.meetingKey || `m-${Date.now()}`,
            userId,
            title: m.title || 'Meeting',
            clientCompany: m.clientCompany || '',
            clientName: m.clientName || '',
            clientEmail: m.clientEmail || '',
            type: m.type || 'Review',
            date: m.date || 'Today',
            time: m.time || '10:00 AM',
            status: m.status || 'Scheduled',
            platform: m.platform || 'Google Meet',
            meetingLink: m.meetingLink,
          });
        });
      }

      if (Array.isArray(rawTasks)) {
        rawTasks.forEach((t: any) => {
          localStore.upsertTask({
            taskKey: t.id || t.taskKey || `t-${Date.now()}`,
            userId,
            title: t.title || 'Task',
            project: t.project || 'General',
            status: t.status || 'today',
            priority: t.priority || 'Medium',
            dueDate: t.dueDate || 'Today',
            assignee: t.assignee || 'Alex Morgan',
          });
        });
      }

      if (Array.isArray(rawPayments)) {
        rawPayments.forEach((py: any) => {
          localStore.upsertPayment({
            paymentKey: py.id || py.paymentKey || `pay-${Date.now()}`,
            userId,
            invoiceNumber: py.invoiceNumber || `INV-${Date.now()}`,
            clientCompany: py.clientCompany || '',
            projectTitle: py.projectTitle || '',
            amount: py.amount || 0,
            currency: py.currency || '$',
            status: py.status || 'Pending',
            issueDate: py.issueDate || 'Today',
            dueDate: py.dueDate || 'In 14 Days',
          });
        });
      }

      return res.json({ success: true, message: 'SQL Database synchronized' });
    } catch (error: unknown) {
      console.error('Failed to sync to SQL database:', error);
      return res.status(500).json({ error: 'Failed to sync to SQL database' });
    }
  });

  // Upsert Meeting
  app.post('/api/meetings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) return res.status(401).json({ error: 'Unauthorized user' });
      const userRecord = await getOrCreateUser(uid, email);
      const meeting = localStore.upsertMeeting({
        ...req.body,
        meetingKey: req.body.id || req.body.meetingKey || `m-${Date.now()}`,
        userId: userRecord.id,
      });
      return res.json({ meeting });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to save meeting in SQL' });
    }
  });

  // Upsert Payment
  app.post('/api/payments', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) return res.status(401).json({ error: 'Unauthorized user' });
      const userRecord = await getOrCreateUser(uid, email);
      const payment = localStore.upsertPayment({
        ...req.body,
        paymentKey: req.body.id || req.body.paymentKey || `pay-${Date.now()}`,
        userId: userRecord.id,
      });
      return res.json({ payment });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to save payment in SQL' });
    }
  });

  // Helper to resolve template image path
  const TEMPLATE_IMAGE_MAP: Record<string, string> = {
    'cyber-onyx': path.join(__dirname, 'public/assets/aistudio/Screenshot_2026-10-26_052503_b78395a8.png'),
    'executive-skyline': path.join(__dirname, 'public/assets/aistudio/Screenshot_2026-10-26_052445_de4e5565.png'),
    'bauhaus-purple': path.join(__dirname, 'public/assets/aistudio/Screenshot_2026-10-26_052520_27e03b6c.png'),
    'playful-crayon': path.join(__dirname, 'public/assets/aistudio/Screenshot_2026-10-26_052419_7e5646f6.png'),
  };

  // 1. NVIDIA Nemotron 3.5 Parse: Document Layout, Bounding Boxes & Text Extraction
  app.post('/api/ai/parse-document', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { imageBase64, templateKey } = req.body || {};
      let finalDataUrl = '';

      if (templateKey && TEMPLATE_IMAGE_MAP[templateKey]) {
        const filePath = TEMPLATE_IMAGE_MAP[templateKey];
        if (fs.existsSync(filePath)) {
          const imgBuffer = fs.readFileSync(filePath);
          finalDataUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`;
        }
      } else if (typeof imageBase64 === 'string' && imageBase64.length > 50) {
        finalDataUrl = imageBase64.startsWith('data:')
          ? imageBase64
          : `data:image/png;base64,${imageBase64}`;
      }

      if (!finalDataUrl) {
        return res.status(400).json({
          error: 'No valid image data or templateKey provided for document parsing.',
        });
      }

      // Call NVIDIA Nemotron Parse model
      const parseResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NVIDIA_PARSE_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-parse',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: finalDataUrl },
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.0,
        }),
      });

      if (!parseResponse.ok) {
        console.warn('Document parse upstream status:', parseResponse.status);
        return res.json({
          success: true,
          elements: [
            { id: 'elem-1', type: 'Title', text: 'Strategic Project Proposal', bbox: { xmin: 0.1, ymin: 0.1, xmax: 0.9, ymax: 0.25 } },
            { id: 'elem-2', type: 'Section-header', text: 'Scope, Timeline & Investment', bbox: { xmin: 0.1, ymin: 0.3, xmax: 0.9, ymax: 0.45 } },
            { id: 'elem-3', type: 'Picture', text: 'Visual Layout Graphic', bbox: { xmin: 0.1, ymin: 0.5, xmax: 0.9, ymax: 0.8 } },
          ],
          rawText: 'Strategic Project Proposal\nScope, Timeline & Investment\nTargeted client execution roadmap.',
          layoutSummary: {
            totalElements: 3,
            detectedTitles: ['Strategic Project Proposal'],
            pictureCount: 1,
            textCount: 2,
            templateKey: templateKey || 'executive-skyline',
          },
        });
      }

      const parseJson: any = await parseResponse.json();
      const toolCall = parseJson?.choices?.[0]?.message?.tool_calls?.[0];
      let rawElements: any[] = [];

      if (toolCall?.function?.arguments) {
        try {
          const parsedArgs = JSON.parse(toolCall.function.arguments);
          rawElements = Array.isArray(parsedArgs) ? parsedArgs.flat() : [];
        } catch {
          rawElements = [];
        }
      }

      // Format parsed elements
      const elements = rawElements.map((item, idx) => ({
        id: `elem-${idx + 1}`,
        type: item.type || 'Text',
        text: item.text || '',
        bbox: item.bbox || { xmin: 0, ymin: 0, xmax: 1, ymax: 1 },
      }));

      const detectedTitles = elements
        .filter((e) => e.type === 'Title' || e.type === 'Section-header')
        .map((e) => e.text)
        .filter(Boolean);

      const pictureElements = elements.filter((e) => e.type === 'Picture');
      const textElements = elements.filter((e) => e.type !== 'Picture');

      const extractedText = textElements
        .map((e) => e.text.trim())
        .filter(Boolean)
        .join('\n');

      return res.json({
        success: true,
        elements,
        rawText: extractedText,
        layoutSummary: {
          totalElements: elements.length,
          detectedTitles,
          pictureCount: pictureElements.length,
          textCount: textElements.length,
          templateKey: templateKey || 'custom',
        },
      });
    } catch (error: unknown) {
      console.error('Error in /api/ai/parse-document:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Document parsing failed',
      });
    }
  });

  // 2. NVIDIA Nemotron Reasoning & Proposal Designer Endpoint
  app.post('/api/ai/analyze-and-design-proposal', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        parsedElements,
        rawText,
        clientCompany,
        clientName,
        industry,
        projectTitle,
        budget,
        timeline,
        desiredTone,
        templateStyle,
        briefText,
      } = req.body || {};

      const prompt = `You are Zendo AI Lead Proposal Strategist powered by NVIDIA Nemotron.
Analyze the following document layout and client parameters to design a high-converting, boardroom-ready client proposal.

=== CLIENT & PROJECT CONTEXT ===
- Client Company: ${clientCompany || 'Acme Partner'}
- Client Contact: ${clientName || 'Partner Lead'}
- Industry: ${industry || 'Technology & Creative Services'}
- Desired Project Title: ${projectTitle || 'Strategic Transformation Proposal'}
- Target Budget: ${budget || '$15,000'}
- Target Timeline: ${timeline || '6 weeks'}
- Desired Tone: ${desiredTone || 'Professional'}
- Preferred Theme Style: ${templateStyle || 'executive-skyline'}
- Client Brief / Discovery Notes: ${briefText || 'Client seeks comprehensive growth and modernization of operations.'}

=== EXTRACTED DOCUMENT LAYOUT CONTEXT (from Nemotron Parse) ===
${rawText ? `Extracted Text from Document:\n${rawText}` : 'Layout structured from visual template analysis.'}
${Array.isArray(parsedElements) ? `Layout Components: ${parsedElements.map((e: any) => `${e.type}: ${e.text || '[Graphic visual element]'}`).join(' | ')}` : ''}

=== REQUIRED OUTPUT SPECIFICATION ===
You MUST return ONLY a valid JSON object (enclosed in \`\`\`json or raw) with EXACTLY this structure:
{
  "title": "Clear, compelling proposal title",
  "coverSubtitle": "Sophisticated 1-2 sentence subtitle for cover",
  "executiveSummary": "Compelling 3-4 sentence executive summary addressing why this engagement is critical now.",
  "clientProblem": "Detailed breakdown of the client's current pain points, operational bottlenecks, or missed opportunities.",
  "proposedSolution": "The strategic roadmap, methodology, and direct business impact delivered.",
  "servicesDeliverables": [
    { "id": "del-1", "name": "Deliverable Name", "description": "Specific deliverable scope", "included": true },
    { "id": "del-2", "name": "Deliverable Name", "description": "Specific deliverable scope", "included": true },
    { "id": "del-3", "name": "Deliverable Name", "description": "Specific deliverable scope", "included": true },
    { "id": "del-4", "name": "Deliverable Name", "description": "Specific deliverable scope", "included": true }
  ],
  "timeline": [
    { "id": "tl-1", "phase": "Phase 1 · Discovery & Strategy", "duration": "Weeks 1–2", "deliverable": "Key outcome" },
    { "id": "tl-2", "phase": "Phase 2 · Core Execution & Development", "duration": "Weeks 3–4", "deliverable": "Key outcome" },
    { "id": "tl-3", "phase": "Phase 3 · QA, Launch & Handover", "duration": "Weeks 5–6", "deliverable": "Key outcome" }
  ],
  "pricingItems": [
    { "id": "pr-1", "item": "Strategic Discovery & Architecture", "detail": "Deliverable 1 scope", "amount": "$4,500" },
    { "id": "pr-2", "item": "Design System & Core Build", "detail": "Deliverable 2 scope", "amount": "$7,500" },
    { "id": "pr-3", "item": "Optimization & Deployment", "detail": "Deliverable 3 scope", "amount": "$3,000" }
  ],
  "pricingNote": "Standard terms: 50% kick-off deposit, 50% upon milestone completion.",
  "termsAndNextSteps": "Clear call-to-action for proposal sign-off and kickoff call scheduling.",
  "recommendedThemeKey": "${templateStyle || 'executive-skyline'}",
  "designRationale": "1-2 sentences explaining how this visual aesthetic matches the client positioning."
}
`;

      const completion = await reasoningClient.chat.completions.create({
        model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2500,
      });

      const message = completion.choices[0]?.message;
      const responseContent = message?.content || '';
      const reasoningText = (message as any)?.reasoning_content || '';

      let jsonCandidate = responseContent;
      // If content was empty or contained reasoning, look for JSON in either content or reasoningText
      if (!jsonCandidate || !jsonCandidate.includes('{')) {
        jsonCandidate = reasoningText;
      }

      let parsedProposal: any = null;
      try {
        const jsonMatch = jsonCandidate.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedProposal = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.warn('Failed to parse JSON directly from Nemotron reasoning:', err);
      }

      if (!parsedProposal) {
        // Fallback default structure
        parsedProposal = {
          title: projectTitle || 'Strategic Transformation Proposal',
          coverSubtitle: `High-impact strategic execution tailored for ${clientCompany || 'your team'}`,
          executiveSummary: `${clientCompany || 'Your business'} has reached a critical stage where modernizing operations and market reach will directly drive revenue and enterprise authority.`,
          clientProblem: 'Fragmented workflows and legacy digital channels hinder scalability and prolong sales conversion cycles.',
          proposedSolution: 'A comprehensive modern transformation roadmap focusing on high-converting brand touchpoints and streamlined client delivery.',
          servicesDeliverables: [
            { id: 'del-1', name: 'Strategic Audit & Architecture', description: 'Comprehensive roadmap and requirements analysis', included: true },
            { id: 'del-2', name: 'Core Design & Implementation', description: 'High-fidelity design and production rollout', included: true },
            { id: 'del-3', name: 'Performance Optimization & QA', description: 'Rigorous testing and metric tracking', included: true },
          ],
          timeline: [
            { id: 'tl-1', phase: 'Phase 1 · Discovery & Roadmapping', duration: 'Weeks 1–2', deliverable: 'Discovery summary' },
            { id: 'tl-2', phase: 'Phase 2 · Production Execution', duration: 'Weeks 3–4', deliverable: 'Production build' },
            { id: 'tl-3', phase: 'Phase 3 · Launch & Knowledge Transfer', duration: 'Weeks 5–6', deliverable: 'Launch handoff' },
          ],
          pricingItems: [
            { id: 'pr-1', item: 'Discovery & Strategic Roadmap', detail: 'Analysis and wireframes', amount: '$4,000' },
            { id: 'pr-2', item: 'Production Implementation', detail: 'Complete build and integration', amount: '$7,500' },
            { id: 'pr-3', item: 'Deployment & Training', detail: 'Launch QA and team documentation', amount: '$3,500' },
          ],
          pricingNote: '50% upon kick-off, 50% upon final acceptance.',
          termsAndNextSteps: 'Review scope and click Accept Proposal to book the kick-off meeting.',
          recommendedThemeKey: templateStyle || 'executive-skyline',
          designRationale: 'Tailored aesthetic crafted specifically for your industry and brand stature.',
        };
      }

      return res.json({
        success: true,
        proposal: parsedProposal,
        reasoning: reasoningText || 'Analysis prioritized client authority and conversion-focused deliverables.',
        model: 'proposal-architect',
      });
    } catch (error: unknown) {
      console.warn('Handling proposal design via fallback generator:', error);
      const {
        clientCompany,
        clientName,
        projectTitle,
        budget,
        timeline,
        desiredTone,
        templateStyle,
        briefText,
      } = req.body || {};
      const comp = clientCompany || 'Acme Partner';
      const name = clientName || 'Partner Lead';
      return res.json({
        success: true,
        proposal: {
          title: projectTitle || 'Strategic Transformation Proposal',
          coverSubtitle: `High-impact strategic execution tailored for ${name} at ${comp}`,
          executiveSummary: `${comp} has reached a pivotal juncture to modernize operations and client touchpoints. This proposal establishes a clear, measurable roadmap for sustainable market advantage.`,
          clientProblem: briefText || 'Operational bottlenecks and fragmented customer experiences restrict scalable growth.',
          proposedSolution: 'A comprehensive modern transformation roadmap focusing on high-converting client touchpoints and streamlined service delivery.',
          servicesDeliverables: [
            { id: 'del-1', name: 'Strategic Audit & Architecture', description: 'Comprehensive roadmap and requirements analysis', included: true },
            { id: 'del-2', name: 'Core Design & Implementation', description: 'High-fidelity design and production rollout', included: true },
            { id: 'del-3', name: 'Performance Optimization & QA', description: 'Rigorous testing and metric tracking', included: true },
          ],
          timeline: [
            { id: 'tl-1', phase: 'Phase 1 · Discovery & Roadmapping', duration: 'Weeks 1–2', deliverable: 'Discovery summary' },
            { id: 'tl-2', phase: 'Phase 2 · Production Execution', duration: 'Weeks 3–4', deliverable: 'Production build' },
            { id: 'tl-3', phase: 'Phase 3 · Launch & Knowledge Transfer', duration: 'Weeks 5–6', deliverable: 'Launch handoff' },
          ],
          pricingItems: [
            { id: 'pr-1', item: 'Discovery & Strategic Roadmap', detail: 'Analysis and wireframes', amount: '$4,000' },
            { id: 'pr-2', item: 'Production Implementation', detail: 'Complete build and integration', amount: '$7,500' },
            { id: 'pr-3', item: 'Deployment & Training', detail: 'Launch QA and team documentation', amount: '$3,500' },
          ],
          pricingNote: '50% upon kick-off, 50% upon final acceptance.',
          termsAndNextSteps: 'Review scope and click Accept Proposal to book the kick-off meeting.',
          recommendedThemeKey: templateStyle || 'executive-skyline',
          designRationale: 'Tailored aesthetic crafted specifically for your industry and brand stature.',
        },
        reasoning: 'Synthesized high-impact proposal using standard strategic architecture.',
      });
    }
  });

  // 3. Zendo AI Proposal Generation Endpoint
  app.post('/api/ai/generate-proposal', requireAuth, async (req: AuthRequest, res) => {
    try {
      const {
        companyName,
        clientName,
        clientIndustry,
        projectTitle,
        selectedServices,
        projectBudget,
        projectTimeline,
        proposalStyle,
        additionalRequirements,
        clientNeed,
      } = req.body || {};

      const prompt = `You are Zendo AI, an expert proposal writer and business strategist.
Generate professional proposal content for client ${clientName || 'Client'} at ${companyName || 'Company'} (${clientIndustry || 'Technology'}).
Project Title: ${projectTitle || 'Strategic Proposal'}
Services: ${selectedServices?.join(', ') || 'Consulting & Strategy'}
Budget: ${projectBudget || '$10,000'}
Timeline: ${projectTimeline || '4 weeks'}
Style: ${proposalStyle || 'Professional'}
Client Need / Discovery Notes: ${clientNeed || 'Modernize digital presence and accelerate growth.'}
Additional requirements: ${additionalRequirements || 'None'}

Return a valid JSON object with EXACTLY these string fields:
- executiveSummary
- clientProblem
- proposedSolution
- termsAndNextSteps
`;

      const completion = await reasoningClient.chat.completions.create({
        model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2048,
        stream: false,
      });

      const message = completion.choices[0]?.message;
      let responseText = message?.content || '';
      const reasoningText = (message as any)?.reasoning_content || '';
      if (!responseText || !responseText.includes('{')) {
        responseText = reasoningText;
      }

      let parsedData: any = {};
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // fallback parsing
      }

      return res.json({
        success: true,
        text: responseText,
        reasoning: reasoningText,
        executiveSummary: parsedData.executiveSummary || `${companyName || 'Your team'} is launching a strategic initiative to accelerate market leadership. This proposal establishes the foundational scope, deliverables, and milestones required for sustained execution.`,
        clientProblem: parsedData.clientProblem || (clientNeed || 'Current operational bottlenecks and fragmented client touchpoints prevent efficient scaling.'),
        proposedSolution: parsedData.proposedSolution || 'A targeted, sprint-based delivery roadmap delivering high-converting touchpoints, automated workflows, and comprehensive team enablement.',
        termsAndNextSteps: parsedData.termsAndNextSteps || 'Upon approval of this scope, we will schedule the initial discovery kickoff and activate milestone delivery.',
      });
    } catch (error: unknown) {
      console.warn('Proposal generation fallback:', error);
      const { companyName, clientNeed } = req.body || {};
      return res.json({
        success: true,
        executiveSummary: `${companyName || 'Your team'} is launching a strategic initiative to accelerate market leadership. This proposal establishes the foundational scope, deliverables, and milestones required for sustained execution.`,
        clientProblem: clientNeed || 'Current operational bottlenecks and fragmented client touchpoints prevent efficient scaling.',
        proposedSolution: 'A targeted, sprint-based delivery roadmap delivering high-converting touchpoints, automated workflows, and comprehensive team enablement.',
        termsAndNextSteps: 'Upon approval of this scope, we will schedule the initial discovery kickoff and activate milestone delivery.',
      });
    }
  });

  // 4. Zendo AI Section Polish Endpoint
  app.post('/api/ai/polish', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { sectionName, currentText, proposalStyle, companyName } = req.body || {};
      const prompt = `You are Zendo AI. Polish and enhance the proposal section "${sectionName}" for ${companyName || 'Client'} in a ${proposalStyle || 'Professional'} tone. Make it exceptionally crisp, persuasive, and professional. Return only the polished text.\n\nCurrent text:\n${currentText}`;

      const completion = await reasoningClient.chat.completions.create({
        model: 'nvidia/nemotron-3.5-lightning-30b-a3b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
        stream: false,
      });

      const message = completion.choices[0]?.message;
      const polished = message?.content?.trim() || currentText;
      return res.json({ success: true, polished });
    } catch (error: unknown) {
      console.warn('Polish fallback:', error);
      return res.json({ success: true, polished: (req.body?.currentText || '').trim(), polishedText: (req.body?.currentText || '').trim() });
    }
  });

  // Resend Email Endpoint (Legacy direct send)
  app.post('/api/emails/send', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { to, subject, html, text } = req.body || {};
      if (!to || !subject) {
        return res.status(400).json({ error: 'Missing "to" or "subject"' });
      }

      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      const userRecord = uid ? await getOrCreateUser(uid, email) : null;
      const emailConfig = getEmailClient(userRecord?.id || 1);

      const sendResult = await emailConfig.client.emails.send({
        from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
        to: [to],
        subject,
        html: html || `<p>${text || subject}</p>`,
        text: text || subject,
      });

      if (sendResult.error) {
        return res.status(400).json({ error: sendResult.error.message || 'Failed to send email' });
      }

      return res.json({ success: true, data: sendResult.data });
    } catch (error: unknown) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to send email',
      });
    }
  });

  // =========================================================================
  // RESEND EMAIL INTEGRATION SETTINGS
  // =========================================================================

  // GET Settings > Integrations > Email (Resend)
  app.get('/api/integrations/resend', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) return res.status(401).json({ error: 'Unauthorized user' });

      const userRecord = await getOrCreateUser(uid, email);
      const integration = localStore.getIntegration(userRecord.id, 'resend');
      const emailConfig = getEmailClient(userRecord.id);
      const usage = localStore.getEmailUsage(userRecord.id);

      // Decrypt keys solely on server to get masked representations (never expose raw key)
      let apiKeyMasked = '';
      let webhookSecretMasked = '';
      if (integration?.encryptedApiKey) {
        const dec = decryptData(integration.encryptedApiKey);
        if (dec) apiKeyMasked = maskKey(dec);
      }
      if (integration?.encryptedWebhookSecret) {
        const dec = decryptData(integration.encryptedWebhookSecret);
        if (dec) webhookSecretMasked = maskKey(dec);
      }

      // Check default fallback mask if using Zendo default
      const defaultPlatformKey = process.env.RESEND_API_KEY;
      const defaultWebhookSecret = process.env.RESEND_WEBHOOK_SECRET;

      const isConnected = !!(
        (integration && !integration.useDefaultEmail && integration.encryptedApiKey) ||
        defaultPlatformKey
      );

      return res.json({
        provider: 'resend',
        useDefaultEmail: integration?.useDefaultEmail !== false,
        apiKeyMasked: apiKeyMasked || (defaultPlatformKey ? maskKey(defaultPlatformKey) : ''),
        webhookSecretMasked:
          webhookSecretMasked || (defaultWebhookSecret ? maskKey(defaultWebhookSecret) : ''),
        fromEmail: integration?.fromEmail || emailConfig.fromEmail,
        fromName: integration?.fromName || emailConfig.fromName,
        status: isConnected ? 'Connected' : 'Not connected',
        dailyLimit: usage.dailyLimit,
        sentCount: usage.sentCount,
        receivedCount: usage.receivedCount,
        remainingCount: Math.max(0, usage.dailyLimit - (usage.sentCount + usage.receivedCount)),
        isCustom: !!(integration && !integration.useDefaultEmail && integration.encryptedApiKey),
        replyToDomain: emailConfig.replyToDomain,
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to load Resend integration settings' });
    }
  });

  // POST Settings > Integrations > Email (Resend) - Save custom credentials encrypted
  app.post('/api/integrations/resend', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) return res.status(401).json({ error: 'Unauthorized user' });

      const userRecord = await getOrCreateUser(uid, email);
      const { apiKey, webhookSecret, fromEmail, fromName, useDefaultEmail } = req.body || {};

      const existing = localStore.getIntegration(userRecord.id, 'resend');

      let encryptedApiKey = existing?.encryptedApiKey;
      if (typeof apiKey === 'string' && apiKey.trim() && !apiKey.includes('•')) {
        // Only encrypt if user passed a new unmasked key
        encryptedApiKey = encryptData(apiKey.trim());
      }

      let encryptedWebhookSecret = existing?.encryptedWebhookSecret;
      if (typeof webhookSecret === 'string' && webhookSecret.trim() && !webhookSecret.includes('•')) {
        encryptedWebhookSecret = encryptData(webhookSecret.trim());
      }

      const updated = localStore.upsertIntegration({
        userId: userRecord.id,
        provider: 'resend',
        encryptedApiKey,
        encryptedWebhookSecret,
        fromEmail: fromEmail?.trim() || existing?.fromEmail || '',
        fromName: fromName?.trim() || existing?.fromName || 'Zendo Studio',
        useDefaultEmail: useDefaultEmail !== undefined ? !!useDefaultEmail : false,
        status: 'Connected',
      });

      const usage = localStore.getEmailUsage(userRecord.id);

      return res.json({
        success: true,
        message: 'Resend integration settings saved successfully',
        settings: {
          useDefaultEmail: updated.useDefaultEmail,
          status: updated.status,
          fromEmail: updated.fromEmail,
          fromName: updated.fromName,
          apiKeyMasked: updated.encryptedApiKey ? maskKey(decryptData(updated.encryptedApiKey)) : '',
          webhookSecretMasked: updated.encryptedWebhookSecret
            ? maskKey(decryptData(updated.encryptedWebhookSecret))
            : '',
          dailyLimit: usage.dailyLimit,
          sentCount: usage.sentCount,
          receivedCount: usage.receivedCount,
          remainingCount: Math.max(0, usage.dailyLimit - (usage.sentCount + usage.receivedCount)),
        },
      });
    } catch (error: unknown) {
      console.error('Failed to save Resend settings:', error);
      return res.status(500).json({ error: 'Failed to save Resend configuration' });
    }
  });

  // DELETE Settings > Integrations > Email (Resend) - Disconnect
  app.delete('/api/integrations/resend', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) return res.status(401).json({ error: 'Unauthorized user' });

      const userRecord = await getOrCreateUser(uid, email);
      localStore.deleteIntegration(userRecord.id, 'resend');

      return res.json({
        success: true,
        message: 'Resend integration disconnected. Reverted to Zendo default platform email.',
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to disconnect Resend integration' });
    }
  });

  // POST Settings > Integrations > Email > Send Test Email
  app.post('/api/integrations/resend/test', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) return res.status(401).json({ error: 'Unauthorized user' });

      const userRecord = await getOrCreateUser(uid, email);
      const { toEmail } = req.body || {};
      const targetEmail = toEmail || email;

      if (!targetEmail || !targetEmail.includes('@')) {
        return res.status(400).json({ error: 'Valid recipient email address is required' });
      }

      const result = await sendTestEmail(userRecord.id, targetEmail);
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Test email failed to send' });
      }

      return res.json({
        success: true,
        message: `Test email successfully sent to ${targetEmail}`,
        id: result.id,
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to send test email' });
    }
  });

  // =========================================================================
  // RESEND INBOUND & EVENT WEBHOOKS
  // =========================================================================
  app.post('/api/webhooks/resend', async (req: express.Request, res: express.Response) => {
    try {
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET || '';

      // Verify signature if secret is configured
      if (webhookSecret) {
        const isValid = verifyResendWebhookSignature(
          rawBody,
          req.headers as Record<string, string>,
          webhookSecret
        );
        if (!isValid) {
          console.warn('Invalid Resend webhook signature rejected');
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }
      }

      const outcome = await handleResendWebhookPayload(req.body);
      return res.status(200).json(outcome);
    } catch (error: unknown) {
      console.error('Error handling Resend webhook:', error);
      return res.status(500).json({ error: 'Internal webhook error' });
    }
  });

  // =========================================================================
  // CONVERSATIONS & CLIENT PORTAL CHAT (/p/:token)
  // =========================================================================

  // Authenticated list of conversations
  app.get('/api/conversations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || 'alex@zendo.ai';
      if (!uid) return res.status(401).json({ error: 'Unauthorized user' });

      const userRecord = await getOrCreateUser(uid, email);
      const convs = localStore.getConversations(userRecord.id);
      return res.json({ conversations: convs });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  // Public: Get Conversation and Message History by Token (for /p/[token])
  app.get('/api/conversations/by-token/:token', async (req, res) => {
    try {
      const token = String(req.params.token);
      let conv = localStore.getConversationByToken(token);

      // If token matches a proposal ID, resolve or bootstrap conversation
      if (!conv) {
        const allProposals = localStore.getState().proposals;
        const matchingProp = allProposals.find((p) => p.proposalKey === token || p.id === parseInt(token, 10));
        if (matchingProp) {
          conv = localStore.upsertConversation({
            token,
            userId: matchingProp.userId,
            clientId: matchingProp.clientId,
            clientCompany: matchingProp.clientCompany || 'Client',
            clientName: matchingProp.clientName || 'Client',
            clientEmail: matchingProp.clientEmail || '',
            proposalId: matchingProp.proposalKey,
            unreadCount: 0,
          });
        }
      }

      if (!conv) {
        return res.status(404).json({ error: 'Client portal conversation not found' });
      }

      // Mark presence
      localStore.updateConversationPresence(token);

      const messages = localStore.getClientMessages(conv.userId, conv.id);
      const user = localStore.getState().users.find((u) => u.id === conv?.userId);

      return res.json({
        conversation: conv,
        messages,
        agency: {
          name: user?.displayName || user?.name || 'Alex Morgan',
          workspaceName: user?.workspaceName || user?.organizationName || 'Zendo Studio',
          brandColor: user?.brandColor || '#1f7a4c',
        },
      });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to load client portal' });
    }
  });

  // Public: Client sends a message in the portal (/p/[token])
  app.post('/api/conversations/by-token/:token/messages', async (req, res) => {
    try {
      const token = String(req.params.token);
      const conv = localStore.getConversationByToken(token);
      if (!conv) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const { messageText, senderName } = req.body || {};
      if (!messageText || !messageText.trim()) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      // Update presence
      localStore.updateConversationPresence(token);

      const newMsg = localStore.upsertClientMessage({
        messageKey: `msg-client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: conv.userId,
        conversationId: conv.id,
        proposalId: conv.proposalId || '',
        clientCompany: conv.clientCompany,
        senderName: senderName || conv.clientName || 'Client',
        senderRole: 'client',
        senderType: 'client',
        messageText: messageText.trim(),
        timeLabel: 'Just now',
        channel: 'chat',
        deliveryStatus: 'delivered',
      });

      conv.unreadCount = (conv.unreadCount || 0) + 1;
      localStore.upsertConversation(conv);

      return res.json({ success: true, message: newMsg });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to send client message' });
    }
  });

  // Public: Heartbeat presence from client portal (/p/[token])
  app.post('/api/conversations/by-token/:token/presence', async (req, res) => {
    try {
      const token = String(req.params.token);
      localStore.updateConversationPresence(token);
      return res.json({ success: true, active: true });
    } catch (error: unknown) {
      return res.status(500).json({ error: 'Failed to update presence' });
    }
  });

  // Serve static downloaded attachments securely
  app.get('/api/attachments/:filename', (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(__dirname, '.data', 'attachments', filename);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.status(404).json({ error: 'Attachment not found' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? undefined : false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`Zendo AI server running on http://${HOST}:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start Zendo server:', err);
});
