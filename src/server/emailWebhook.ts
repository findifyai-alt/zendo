import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { localStore } from '../db/localStore.ts';
import { getEmailClient } from './emailService.ts';

const ATTACHMENTS_DIR = path.resolve(process.cwd(), '.data', 'attachments');

function ensureAttachmentsDir() {
  if (!fs.existsSync(ATTACHMENTS_DIR)) {
    fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
  }
}

/**
 * Verifies the Resend (Svix) webhook signature
 */
export function verifyResendWebhookSignature(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string
): boolean {
  if (!secret) return true; // Development bypass if secret not configured

  const svixId = (headers['svix-id'] || headers['x-svix-id']) as string;
  const svixTimestamp = (headers['svix-timestamp'] || headers['x-svix-timestamp']) as string;
  const svixSignature = (headers['svix-signature'] || headers['x-svix-signature']) as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Prevent replay attacks (5 minute drift allowed)
  const timestampSec = parseInt(svixTimestamp, 10);
  const currentSec = Math.floor(Date.now() / 1000);
  if (Math.abs(currentSec - timestampSec) > 300) {
    console.warn('Webhook timestamp drift exceeds tolerance window');
    return false;
  }

  // Calculate HMAC-SHA256 signature
  const cleanSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const secretBuffer = Buffer.from(cleanSecret, 'base64');
  const signaturePayload = `${svixId}.${svixTimestamp}.${rawBody}`;

  const expectedSignature = crypto
    .createHmac('sha256', secretBuffer.length > 0 ? secretBuffer : secret)
    .update(signaturePayload)
    .digest('base64');

  // svixSignature format may contain multiple signatures separated by space, e.g. "v1,signature1 v1,signature2"
  const passedSignatures = svixSignature
    .split(' ')
    .map((sig) => (sig.startsWith('v1,') ? sig.slice(3) : sig));

  return passedSignatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  });
}

/**
 * Strips quoted reply history and common signatures from plain text emails
 */
export function stripQuotedEmailReplies(text: string): string {
  if (!text) return '';

  const lines = text.split(/\r?\n/);
  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect standard quotation intro: "On [date], [name] wrote:"
    if (/^on\s.+wrote:\s*$/i.test(line.trim())) {
      break;
    }

    // Detect standard email client separators
    if (/^-{2,}\s*original message\s*-{2,}/i.test(line.trim())) {
      break;
    }
    if (/^-{5,}\s*forwarded message\s*-{5,}/i.test(line.trim())) {
      break;
    }
    if (/^from:\s*.+sent:\s*.+/i.test(line.trim())) {
      break;
    }

    // Stop on standard RFC 3676 signature delimiter "-- "
    if (line.trim() === '--' || line.trim() === '—') {
      break;
    }

    // Strip mobile signatures
    if (/^sent from my (iphone|android|galaxy|phone|ipad)/i.test(line.trim())) {
      break;
    }

    // Skip quoted lines starting with >
    if (line.trim().startsWith('>')) {
      continue;
    }

    resultLines.push(line);
  }

  return resultLines.join('\n').trim();
}

/**
 * Checks whether an incoming message is an automated out-of-office or auto-reply
 */
export function isAutoReplyMessage(headers: Record<string, any> = {}, subject = ''): boolean {
  if (headers['auto-submitted'] && headers['auto-submitted'] !== 'no') {
    return true;
  }
  if (headers['x-autoreply'] && headers['x-autoreply'].toLowerCase() === 'yes') {
    return true;
  }
  if (/^(auto:|automatic reply:|out of office:|autoreply:)/i.test(subject.trim())) {
    return true;
  }
  return false;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
]);

const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Processes and saves incoming email attachments to storage
 */
export async function processAttachments(rawAttachments: any[]): Promise<any[]> {
  if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
    return [];
  }

  ensureAttachmentsDir();
  const saved: any[] = [];

  for (const att of rawAttachments) {
    const size = att.size || (att.content ? Buffer.byteLength(att.content, 'base64') : 0);
    const mimeType = att.contentType || att.mimeType || 'application/octet-stream';

    // Security check: validate size and content-type
    if (size > MAX_ATTACHMENT_SIZE) {
      console.warn(`Skipping attachment ${att.filename}: Exceeds 15MB limit`);
      continue;
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase()) && !mimeType.startsWith('image/')) {
      console.warn(`Skipping attachment ${att.filename}: Disallowed MIME type ${mimeType}`);
      continue;
    }

    const fileId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const safeName = (att.filename || 'attachment').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageFilename = `${fileId}_${safeName}`;
    const filePath = path.join(ATTACHMENTS_DIR, storageFilename);

    try {
      if (att.content) {
        fs.writeFileSync(filePath, Buffer.from(att.content, 'base64'));
        saved.push({
          id: fileId,
          name: att.filename || safeName,
          size,
          contentType: mimeType,
          url: `/api/attachments/${storageFilename}`,
        });
      }
    } catch (err) {
      console.error('Failed to write attachment file:', err);
    }
  }

  return saved;
}

/**
 * Handles incoming Resend webhook payload
 */
export async function handleResendWebhookPayload(
  body: any
): Promise<{ success: boolean; event: string; message?: string }> {
  const eventType = body?.type || '';
  const data = body?.data || {};

  switch (eventType) {
    case 'email.received': {
      const emailId = data.email_id || data.id;
      const toList: string[] = Array.isArray(data.to) ? data.to : [data.to].filter(Boolean);
      const fromSender = (data.from || '').toLowerCase();
      const subject = data.subject || '';

      // Extract conversation token from recipient: reply+{token}@inboundDomain
      let conversationToken = '';
      for (const to of toList) {
        const match = to.match(/reply\+([a-zA-Z0-9_\-]+)@/i);
        if (match && match[1]) {
          conversationToken = match[1];
          break;
        }
      }

      if (!conversationToken) {
        console.warn('Webhook email.received: No conversation token found in recipients:', toList);
        return { success: false, event: eventType, message: 'No conversation token in recipient' };
      }

      // Find matching conversation
      const conv = localStore.getConversationByToken(conversationToken);
      if (!conv) {
        console.warn(`Conversation not found for token ${conversationToken}`);
        return { success: false, event: eventType, message: 'Conversation not found' };
      }

      // Check deduplication by email ID
      if (emailId) {
        const existingMessages = localStore.getClientMessages(conv.userId, conv.id);
        const duplicate = existingMessages.find((m) => m.emailMessageId === emailId);
        if (duplicate) {
          return { success: true, event: eventType, message: 'Message already processed' };
        }
      }

      // Fetch full email body from Resend Receiving API
      let rawText = data.text || '';
      let rawHtml = data.html || '';
      let attachmentsList = data.attachments || [];
      const headers = data.headers || {};

      const emailConfig = getEmailClient(conv.userId);
      const resendApiKey = process.env.RESEND_API_KEY || 're_default_platform_key';

      if (emailId && (!rawText || rawText.length === 0)) {
        try {
          const fetchRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              Accept: 'application/json',
            },
          });
          if (fetchRes.ok) {
            const fullEmail = await fetchRes.json();
            rawText = fullEmail.text || rawText;
            rawHtml = fullEmail.html || rawHtml;
            if (Array.isArray(fullEmail.attachments)) {
              attachmentsList = fullEmail.attachments;
            }
          }
        } catch (fetchErr) {
          console.warn('Resend Receiving API fetch note:', fetchErr);
        }
      }

      // Check for auto-replies / Out of Office
      if (isAutoReplyMessage(headers, subject)) {
        return { success: true, event: eventType, message: 'Ignored auto-reply' };
      }

      // Confirm sender matches client email
      if (conv.clientEmail) {
        const expected = conv.clientEmail.toLowerCase().trim();
        if (!fromSender.includes(expected)) {
          console.warn(`Sender mismatch: ${fromSender} does not match expected client ${expected}`);
        }
      }

      // Strip quoted replies & signatures
      let cleanContent = stripQuotedEmailReplies(rawText);
      if (!cleanContent && rawHtml) {
        cleanContent = rawHtml.replace(/<[^>]+>/g, ' ').trim();
        cleanContent = stripQuotedEmailReplies(cleanContent);
      }
      if (!cleanContent) {
        cleanContent = `[Message received via email with subject: "${subject}"]`;
      }

      // Process attachments securely
      const savedAttachments = await processAttachments(attachmentsList);

      // Track daily quota (received)
      localStore.incrementEmailUsage(conv.userId, 'received');

      // Insert message into client_messages
      const newMessage = localStore.upsertClientMessage({
        messageKey: `msg-inbound-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: conv.userId,
        conversationId: conv.id,
        proposalId: conv.proposalId || '',
        clientCompany: conv.clientCompany,
        senderName: conv.clientName || 'Client',
        senderRole: 'client',
        senderType: 'client',
        messageText: cleanContent,
        timeLabel: 'Just now',
        channel: 'email',
        deliveryStatus: 'delivered',
        attachmentsJson: JSON.stringify(savedAttachments),
        emailMessageId: emailId,
      });

      // Update unread count
      conv.unreadCount = (conv.unreadCount || 0) + 1;
      localStore.upsertConversation(conv);

      return {
        success: true,
        event: eventType,
        message: `Inbound message inserted for ${conv.clientCompany}`,
      };
    }

    case 'email.delivered': {
      const emailId = data.email_id || data.id;
      if (emailId) {
        localStore.updateMessageDeliveryStatus(emailId, 'delivered');
      }
      return { success: true, event: eventType };
    }

    case 'email.bounced': {
      const emailId = data.email_id || data.id;
      const recipient = data.to || '';
      if (emailId) {
        localStore.updateMessageDeliveryStatus(emailId, 'bounced');
      }
      // Mark client email as bounced
      if (recipient) {
        const client = localStore
          .getState()
          .clients.find(
            (c) => c.email && c.email.toLowerCase() === recipient.toLowerCase()
          );
        if (client) {
          client.status = 'Email Bounced';
          (client as any).emailBounced = true;
          localStore.upsertClient(client);
        }
      }
      return { success: true, event: eventType };
    }

    case 'email.complained': {
      const emailId = data.email_id || data.id;
      if (emailId) {
        localStore.updateMessageDeliveryStatus(emailId, 'bounced');
      }
      return { success: true, event: eventType };
    }

    default:
      return { success: true, event: eventType, message: 'Event recorded' };
  }
}
