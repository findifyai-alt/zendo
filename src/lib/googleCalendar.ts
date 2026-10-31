import { ScheduledMeetingItem } from '../data/zendoProposalsData';

export interface GoogleCalendarEventResponse {
  id: string;
  htmlLink: string;
  summary: string;
  status: string;
  hangoutLink?: string;
}

export interface GoogleCalendarListItem {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  hangoutLink?: string;
}

/**
 * Parses date string ("2026-10-15") and time string ("2:00 PM") into ISO strings
 */
export function parseMeetingDateTimeToISO(
  dateStr: string,
  timeStr: string,
  durationMinutes = 30
): { startIso: string; endIso: string; startUtcCompact: string; endUtcCompact: string } {
  const parts = (dateStr || '2026-10-15').split('-');
  const year = parseInt(parts[0] || '2026', 10);
  const month = parseInt(parts[1] || '10', 10);
  const day = parseInt(parts[2] || '15', 10);

  const match = (timeStr || '2:00 PM').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  let hours = 14;
  let minutes = 0;
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  const startDate = new Date(year, month - 1, day, hours, minutes, 0);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const formatUtcCompact = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    startUtcCompact: formatUtcCompact(startDate),
    endUtcCompact: formatUtcCompact(endDate),
  };
}

/**
 * Creates an event on the user's primary or custom Google Calendar via Google Calendar API v3
 */
export async function createGoogleCalendarEvent(
  meeting: ScheduledMeetingItem,
  accessToken: string,
  calendarId = 'primary'
): Promise<{ success: boolean; event?: GoogleCalendarEventResponse; error?: string }> {
  try {
    const { startIso, endIso } = parseMeetingDateTimeToISO(
      meeting.date,
      meeting.time,
      meeting.durationMinutes
    );

    const description = [
      meeting.agenda ? `Agenda: ${meeting.agenda}` : '',
      `Client: ${meeting.clientName} (${meeting.clientCompany} - ${meeting.clientEmail})`,
      meeting.proposalTitle ? `Linked Proposal: ${meeting.proposalTitle}` : '',
      meeting.meetingLink ? `Video Meeting Link: ${meeting.meetingLink}` : '',
      'Scheduled via Zendo AI Proposals & Meeting Hub',
    ]
      .filter(Boolean)
      .join('\n\n');

    const eventPayload: Record<string, unknown> = {
      summary: meeting.title,
      description,
      location: meeting.meetingLink || meeting.platform || 'Google Meet',
      start: {
        dateTime: startIso,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
      },
      end: {
        dateTime: endIso,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
      },
      attendees: meeting.clientEmail
        ? [{ email: meeting.clientEmail, displayName: meeting.clientName }]
        : [],
      reminders: {
        useDefault: true,
      },
    };

    // If Google Meet is selected, request conference data creation
    if (meeting.platform === 'Google Meet' || !meeting.meetingLink) {
      eventPayload.conferenceData = {
        createRequest: {
          requestId: `zen-${meeting.id || Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      };
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?conferenceDataVersion=1`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const errMsg =
        errBody?.error?.message ||
        `Google Calendar API returned HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errMsg };
    }

    const data = (await response.json()) as GoogleCalendarEventResponse;
    return { success: true, event: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Updates an event on the user's Google Calendar (used when rescheduling)
 */
export async function updateGoogleCalendarEvent(
  meeting: ScheduledMeetingItem,
  eventId: string,
  accessToken: string,
  calendarId = 'primary'
): Promise<{ success: boolean; event?: GoogleCalendarEventResponse; error?: string }> {
  try {
    const { startIso, endIso } = parseMeetingDateTimeToISO(
      meeting.date,
      meeting.time,
      meeting.durationMinutes
    );

    const description = [
      meeting.agenda ? `Agenda: ${meeting.agenda}` : '',
      `Client: ${meeting.clientName} (${meeting.clientCompany} - ${meeting.clientEmail})`,
      meeting.proposalTitle ? `Linked Proposal: ${meeting.proposalTitle}` : '',
      meeting.meetingLink ? `Video Meeting Link: ${meeting.meetingLink}` : '',
      'Updated via Zendo AI Proposals & Meeting Hub',
    ]
      .filter(Boolean)
      .join('\n\n');

    const patchPayload = {
      summary: meeting.title,
      description,
      location: meeting.meetingLink || meeting.platform || 'Google Meet',
      start: {
        dateTime: startIso,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
      },
      end: {
        dateTime: endIso,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
      },
    };

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(eventId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchPayload),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      return {
        success: false,
        error:
          errBody?.error?.message ||
          `Failed to update Google Calendar event (HTTP ${response.status})`,
      };
    }

    const data = (await response.json()) as GoogleCalendarEventResponse;
    return { success: true, event: data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Lists upcoming events from the user's Google Calendar using OAuth token or API key
 */
export async function listGoogleCalendarEvents(
  options: {
    accessToken?: string | null;
    apiKey?: string | null;
    calendarId?: string;
    maxResults?: number;
  }
): Promise<{ success: boolean; events?: GoogleCalendarListItem[]; error?: string }> {
  try {
    const calendarId = options.calendarId || 'primary';
    const nowIso = new Date().toISOString();
    const maxResults = options.maxResults || 20;

    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?timeMin=${encodeURIComponent(nowIso)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

    const headers: Record<string, string> = {};

    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`;
    } else if (options.apiKey) {
      url += `&key=${encodeURIComponent(options.apiKey)}`;
    } else {
      return {
        success: false,
        error: 'No Google Calendar credentials provided (neither OAuth access token nor API key).',
      };
    }

    const response = await fetch(url, { method: 'GET', headers });

    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      const errMsg =
        errBody?.error?.message ||
        `Google Calendar API returned HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errMsg };
    }

    const data = (await response.json()) as { items?: GoogleCalendarListItem[] };
    return { success: true, events: data.items || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Deletes an event from the user's primary or custom Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  eventId: string,
  accessToken: string,
  calendarId = 'primary'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 204 && response.status !== 404) {
      const errBody = await response.json().catch(() => null);
      return {
        success: false,
        error:
          errBody?.error?.message ||
          `Failed to delete calendar event (status ${response.status})`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Tests connection to Google Calendar with token or API key
 */
export async function testGoogleCalendarConnection(options: {
  accessToken?: string | null;
  apiKey?: string | null;
  calendarId?: string;
}): Promise<{ success: boolean; message: string; count?: number }> {
  const result = await listGoogleCalendarEvents({
    accessToken: options.accessToken,
    apiKey: options.apiKey,
    calendarId: options.calendarId || 'primary',
    maxResults: 5,
  });

  if (result.success) {
    const count = result.events?.length || 0;
    return {
      success: true,
      message: `Connected successfully! Found ${count} upcoming event(s) in calendar.`,
      count,
    };
  }

  return {
    success: false,
    message: result.error || 'Connection failed.',
  };
}

/**
 * Generates an instant Google Calendar web URL (zero credentials needed, opens in browser)
 */
export function generateGoogleCalendarWebUrl(m: ScheduledMeetingItem): string {
  const { startUtcCompact, endUtcCompact } = parseMeetingDateTimeToISO(
    m.date,
    m.time,
    m.durationMinutes
  );

  const title = encodeURIComponent(m.title);
  const details = encodeURIComponent(
    [
      m.agenda || 'Client consultation & scope review.',
      `Client: ${m.clientName} (${m.clientCompany})`,
      `Email: ${m.clientEmail}`,
      m.meetingLink ? `Video Meeting Link: ${m.meetingLink}` : '',
      'Scheduled via Zendo AI Proposals & Meeting Hub',
    ]
      .filter(Boolean)
      .join('\n\n')
  );
  const loc = encodeURIComponent(m.meetingLink || m.platform || 'Google Meet');
  const dates = `${startUtcCompact}/${endUtcCompact}`;
  const add = m.clientEmail ? `&add=${encodeURIComponent(m.clientEmail)}` : '';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${loc}${add}`;
}

/**
 * Generates an iCalendar (.ics) format file content for zero-authorization import
 */
export function generateIcsFileContent(m: ScheduledMeetingItem): string {
  const { startUtcCompact, endUtcCompact } = parseMeetingDateTimeToISO(
    m.date,
    m.time,
    m.durationMinutes
  );

  const cleanText = (str: string) =>
    str.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

  const description = [
    m.agenda ? `Agenda: ${m.agenda}` : '',
    `Client: ${m.clientName} (${m.clientCompany} - ${m.clientEmail})`,
    m.meetingLink ? `Meeting Link: ${m.meetingLink}` : '',
    'Scheduled via Zendo AI Proposals',
  ]
    .filter(Boolean)
    .join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zendo Studio//Meeting Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:zendo-${m.id}@zendostudio.com`,
    `DTSTAMP:${startUtcCompact}`,
    `DTSTART:${startUtcCompact}`,
    `DTEND:${endUtcCompact}`,
    `SUMMARY:${cleanText(m.title)}`,
    `DESCRIPTION:${cleanText(description)}`,
    `LOCATION:${cleanText(m.meetingLink || m.platform || 'Google Meet')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Downloads meeting as an .ics calendar file
 */
export function downloadIcsFile(m: ScheduledMeetingItem): void {
  const icsContent = generateIcsFileContent(m);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${m.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

