import { Resend } from 'resend';
import { localStore } from '../db/localStore.ts';
import type { SqlConversation, SqlClientMessage, SqlUser } from '../db/localStore.ts';
import { decryptData } from './crypto.ts';

export interface EmailClientConfig {
  client: Resend;
  fromEmail: string;
  fromName: string;
  isCustom: boolean;
  replyToDomain: string;
  appUrl: string;
}

/**
 * Escapes HTML characters to prevent XSS in email bodies
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Helper to resolve Resend client for a given user.
 * Returns the user's custom client if configured and enabled, or the platform client.
 */
export function getEmailClient(userId: number): EmailClientConfig {
  const integration = localStore.getIntegration(userId, 'resend');
  const platformKey = process.env.RESEND_API_KEY || 're_default_platform_key';
  const platformFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const replyToDomain = process.env.EMAIL_INBOUND_DOMAIN || 'inbound.zendo.ai';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  if (
    integration &&
    !integration.useDefaultEmail &&
    integration.encryptedApiKey
  ) {
    const decryptedKey = decryptData(integration.encryptedApiKey);
    if (decryptedKey && decryptedKey.startsWith('re_')) {
      return {
        client: new Resend(decryptedKey),
        fromEmail: integration.fromEmail || platformFrom,
        fromName: integration.fromName || 'Zendo Studio',
        isCustom: true,
        replyToDomain,
        appUrl,
      };
    }
  }

  return {
    client: new Resend(platformKey),
    fromEmail: platformFrom,
    fromName: 'Zendo Studio',
    isCustom: false,
    replyToDomain,
    appUrl,
  };
}

/**
 * Sends a test email to verify credentials and configuration
 */
export async function sendTestEmail(userId: number, toEmail: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const emailConfig = getEmailClient(userId);
    const user = localStore.getState().users.find((u) => u.id === userId);
    const userName = user?.displayName || user?.name || 'Zendo Workspace';

    const fromAddress = `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`;

    const result = await emailConfig.client.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `[Zendo] Test Email Connection - ${userName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="margin-bottom: 20px;">
            <span style="background: #e6f4ea; color: #137333; font-size: 12px; font-weight: 600; padding: 4px 10px; rounded: 12px; border-radius: 9999px;">✓ Connected</span>
          </div>
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Resend Email Integration Verified</h2>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            Hello! This is a test confirmation from <strong>${escapeHtml(userName)}</strong>. Your Resend integration is successfully verified and ready to deliver client messages.
          </p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 13px; color: #334155;">
            <div><strong>From:</strong> ${escapeHtml(fromAddress)}</div>
            <div><strong>Mode:</strong> ${emailConfig.isCustom ? 'Custom API Key' : 'Zendo Default Platform'}</div>
            <div><strong>Inbound Domain:</strong> ${escapeHtml(emailConfig.replyToDomain)}</div>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            Zendo Studio · Unified Client Operations
          </p>
        </div>
      `,
      text: `Resend Email Integration Verified for ${userName}. Your email connection is working properly.`,
    });

    if (result.error) {
      return { success: false, error: result.error.message || 'Failed to send test email via Resend' };
    }

    return { success: true, id: result.data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error during test email';
    return { success: false, error: msg };
  }
}

/**
 * Debounce & Batching Map for conversation notifications:
 * Maps conversationId -> NodeJS.Timeout to enforce at most 1 email per conversation per 10 minutes.
 */
const pendingBatches = new Map<number, NodeJS.Timeout>();

/**
 * Triggers outbound email notification for a conversation message.
 * Enforces:
 * 1. Client presence check: only email if client has no active session (idle > 3 minutes).
 * 2. 10-minute batch window: consolidates unsent messages.
 * 3. Daily usage cap check.
 * 4. Reply-To: reply+{token}@{inboundDomain}
 * 5. Button to /p/[token].
 */
export async function sendChatEmail(
  conversationId: number,
  messageId?: number | string
): Promise<{ success: boolean; batched?: boolean; error?: string; resendId?: string }> {
  const conv = localStore.getState().conversations.find((c) => c.id === conversationId);
  if (!conv) {
    return { success: false, error: 'Conversation not found' };
  }

  // 1. Presence check: has client been active in the last 3 minutes?
  if (conv.clientLastActiveAt) {
    const lastActiveMs = Date.now() - new Date(conv.clientLastActiveAt).getTime();
    const THREE_MINUTES = 3 * 60 * 1000;
    if (lastActiveMs < THREE_MINUTES) {
      // Client is currently active in the portal, no need to email them
      return { success: true, batched: false, error: 'Client active in portal session' };
    }
  }

  // Check if client email exists
  if (!conv.clientEmail || !conv.clientEmail.includes('@')) {
    return { success: false, error: 'Client has no email configured' };
  }

  // 2. Batching Check: 10 minute rate limit per conversation
  const TEN_MINUTES = 10 * 60 * 1000;
  const now = Date.now();
  const lastSentTime = conv.lastEmailSentAt ? new Date(conv.lastEmailSentAt).getTime() : 0;
  const timeSinceLastEmail = now - lastSentTime;

  // If already sent within 10 minutes, queue this conversation for remaining time
  if (timeSinceLastEmail < TEN_MINUTES) {
    if (!pendingBatches.has(conversationId)) {
      const waitTime = TEN_MINUTES - timeSinceLastEmail;
      const timer = setTimeout(() => {
        pendingBatches.delete(conversationId);
        void executeSendChatEmail(conversationId);
      }, waitTime);
      pendingBatches.set(conversationId, timer);
    }
    return { success: true, batched: true };
  }

  return await executeSendChatEmail(conversationId);
}

/**
 * Executes the actual Resend outbound email dispatch
 */
async function executeSendChatEmail(
  conversationId: number
): Promise<{ success: boolean; resendId?: string; error?: string }> {
  const conv = localStore.getState().conversations.find((c) => c.id === conversationId);
  if (!conv) return { success: false, error: 'Conversation not found' };

  const userId = conv.userId;
  const emailConfig = getEmailClient(userId);

  // Daily quota check
  const quota = localStore.incrementEmailUsage(userId, 'sent');
  if (!quota.allowed) {
    return {
      success: false,
      error: `Daily email limit of ${quota.usage.dailyLimit} reached. Upgrade plan or try again tomorrow.`,
    };
  }

  const user = localStore.getState().users.find((u) => u.id === userId);
  const userName = user?.displayName || user?.name || 'Alex Morgan';
  const workspaceName = user?.workspaceName || user?.organizationName || 'Zendo Studio';

  // Gather unsent / pending messages for this conversation
  const allMessages = localStore.getClientMessages(userId, conversationId);
  const pendingMessages = allMessages.filter(
    (m) => m.senderType === 'agency' && (m.deliveryStatus === 'sent' || !m.resendEmailId)
  );

  const messagesToNotify = pendingMessages.length > 0
    ? pendingMessages
    : allMessages.slice(-1);

  if (messagesToNotify.length === 0) {
    return { success: true };
  }

  const portalLink = `${emailConfig.appUrl}/p/${conv.token}`;
  const replyToAddress = `reply+${conv.token}@${emailConfig.replyToDomain}`;
  const fromHeader = `"${userName} via Zendo" <${emailConfig.fromEmail}>`;

  // Build message items HTML
  const messageRowsHtml = messagesToNotify
    .map((m) => {
      let attachmentHtml = '';
      if (m.attachmentsJson) {
        try {
          const files = JSON.parse(m.attachmentsJson);
          if (Array.isArray(files) && files.length > 0) {
            attachmentHtml = `
              <div style="margin-top: 8px; font-size: 12px;">
                <span style="color: #64748b;">Attachments:</span>
                ${files
                  .map(
                    (f: any) =>
                      `<a href="${escapeHtml(f.url || portalLink)}" style="color: #1f7a4c; text-decoration: underline; margin-left: 6px;">${escapeHtml(f.name || 'File')}</a>`
                  )
                  .join(', ')}
              </div>
            `;
          }
        } catch {
          // ignore
        }
      }

      return `
        <div style="margin-bottom: 14px; padding: 12px 16px; background: #f8fafc; border-left: 3px solid #1f7a4c; border-radius: 4px;">
          <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">
            ${escapeHtml(m.senderName)} · ${escapeHtml(m.timeLabel || 'Recent')}
          </div>
          <div style="font-size: 14px; color: #0f172a; line-height: 1.5; white-space: pre-wrap;">
            ${escapeHtml(m.messageText)}
          </div>
          ${attachmentHtml}
        </div>
      `;
    })
    .join('');

  const plainTextLines = messagesToNotify
    .map((m) => `${m.senderName} (${m.timeLabel}):\n${m.messageText}\n`)
    .join('\n');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Message from ${escapeHtml(userName)}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background: #1f7a4c; padding: 24px 32px; color: #ffffff;">
            <h1 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.01em;">
              ${escapeHtml(workspaceName)}
            </h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">
              Project communication with ${escapeHtml(conv.clientCompany)}
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <p style="font-size: 15px; color: #334155; margin-top: 0; margin-bottom: 20px;">
              Hi <strong>${escapeHtml(conv.clientName)}</strong>, you have new updates regarding your project:
            </p>

            ${messageRowsHtml}

            <!-- CTA Button -->
            <div style="margin: 28px 0; text-align: center;">
              <a href="${escapeHtml(portalLink)}" style="display: inline-block; background: #1f7a4c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(31,122,76,0.2);">
                Reply in Zendo Portal →
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
              Tip: You can reply directly to this email or click the button above to view documents and chat in your portal.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            You received this message because you are a client of ${escapeHtml(userName)} at ${escapeHtml(workspaceName)}. Reply to this email or visit your portal to respond.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const sendResult = await emailConfig.client.emails.send({
      from: fromHeader,
      to: [conv.clientEmail],
      replyTo: replyToAddress,
      subject: `New message from ${userName} regarding ${conv.clientCompany}`,
      html: htmlBody,
      text: `${plainTextLines}\n\nReply in Zendo: ${portalLink}\n\nYou received this message because you are a client of ${userName} at ${workspaceName}.`,
    });

    if (sendResult.error) {
      console.warn('Resend send failed:', sendResult.error.message);
      messagesToNotify.forEach((m) => {
        localStore.updateMessageDeliveryStatus(m.resendEmailId || m.messageKey, 'failed');
      });
      return { success: false, error: sendResult.error.message };
    }

    const emailId = sendResult.data?.id;

    // Update messages status in store
    messagesToNotify.forEach((m) => {
      m.resendEmailId = emailId;
      m.deliveryStatus = 'sent';
      localStore.upsertClientMessage(m);
    });

    // Update conversation last email sent timestamp
    localStore.updateConversationEmailSent(conv.token);

    return { success: true, resendId: emailId };
  } catch (error: unknown) {
    const errText = error instanceof Error ? error.message : 'Outbound email error';
    console.error('sendChatEmail error:', errText);
    return { success: false, error: errText };
  }
}
