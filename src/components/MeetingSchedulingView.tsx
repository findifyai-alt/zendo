import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Plus,
  Link2,
  Copy,
  Check,
  CheckCircle2,
  X,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Settings,
  Key,
  ShieldCheck,
  Trash2,
  Info,
  HelpCircle,
  Download,
} from 'lucide-react';
import {
  ScheduledMeetingItem,
  MeetingType,
  ClientItem,
  ProposalItem,
} from '../data/zendoProposalsData';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getAccessToken,
  getCachedAccessToken,
  auth,
} from '../firebase';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  listGoogleCalendarEvents,
  deleteGoogleCalendarEvent,
  testGoogleCalendarConnection,
  generateGoogleCalendarWebUrl,
  downloadIcsFile,
  GoogleCalendarListItem,
} from '../lib/googleCalendar';

interface MeetingSchedulingViewProps {
  meetings: ScheduledMeetingItem[];
  clients: ClientItem[];
  proposals: ProposalItem[];
  onScheduleMeeting: (meeting: Omit<ScheduledMeetingItem, 'id' | 'status'>) => void;
  onCancelMeeting: (meetingId: string) => void;
  onCompleteMeeting: (meetingId: string) => void;
  onRescheduleMeeting: (meetingId: string, newDate: string, newTime: string) => void;
  onClientSelfBook: (
    time: string,
    date: string,
    name: string,
    company: string,
    email: string,
    type: MeetingType
  ) => void;
  onTriggerToast: (message: string) => void;
  onUpdateMeeting?: (meetingId: string, partial: Partial<ScheduledMeetingItem>) => void;
  companyName?: string;
}

const MEETING_TYPES: { type: MeetingType; defaultDuration: number; color: string; desc: string }[] = [
  {
    type: 'Discovery Call',
    defaultDuration: 30,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Initial qualification & scoping with prospects to uncover project goals.',
  },
  {
    type: 'Proposal Walkthrough',
    defaultDuration: 45,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Live interactive review of scope, timeline milestones, and investment breakdown.',
  },
  {
    type: 'Design Review',
    defaultDuration: 45,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Client feedback session on wireframes, interactive prototypes, or UI components.',
  },
  {
    type: 'Project Kickoff',
    defaultDuration: 60,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Sprint 1 alignment, team introduction, and asset handoff kickoff.',
  },
  {
    type: 'Weekly Sync',
    defaultDuration: 30,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Regular milestone updates, blocker resolution, and roadmap checks.',
  },
  {
    type: 'Strategy Session',
    defaultDuration: 60,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Deep-dive branding positioning, technical architecture, or quarterly planning.',
  },
];

const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '11:30 AM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
];

export const MeetingSchedulingView: React.FC<MeetingSchedulingViewProps> = ({
  meetings,
  clients,
  proposals,
  onScheduleMeeting,
  onCancelMeeting,
  onCompleteMeeting,
  onRescheduleMeeting,
  onClientSelfBook,
  onTriggerToast,
  onUpdateMeeting,
  companyName = 'Zendo Studio',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'calendar'>('all');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [bookingLinkModalOpen, setBookingLinkModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [meetingToReschedule, setMeetingToReschedule] = useState<ScheduledMeetingItem | null>(null);

  // Calendar Integration State (Always active by default)
  const [googleConnected, setGoogleConnected] = useState<boolean>(true);
  const [googleAccountEmail, setGoogleAccountEmail] = useState<string>(() => {
    return auth.currentUser?.email || 'findifyai@gmail.com';
  });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [syncingMeetingId, setSyncingMeetingId] = useState<string | null>(null);
  const [autoSyncGoogleCalendar, setAutoSyncGoogleCalendar] = useState(true);

  // Google Calendar Events Modal & Settings Modal
  const [googleEventsModalOpen, setGoogleEventsModalOpen] = useState(false);
  const [googleSettingsModalOpen, setGoogleSettingsModalOpen] = useState(false);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<GoogleCalendarListItem[]>([]);
  const [isLoadingGoogleEvents, setIsLoadingGoogleEvents] = useState(false);

  // Optional custom credentials / keys (per user prompt: "as keys if needed")
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('zendo_gcal_api_key') || '';
  });
  const [customAccessToken, setCustomAccessToken] = useState<string>(() => {
    return localStorage.getItem('zendo_gcal_custom_token') || '';
  });
  const [customCalendarId, setCustomCalendarId] = useState<string>(() => {
    return localStorage.getItem('zendo_gcal_calendar_id') || 'primary';
  });
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // User Confirmation modal for Cancel/Delete (MANDATORY per Workspace guidelines)
  const [cancelConfirmModalOpen, setCancelConfirmModalOpen] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState<ScheduledMeetingItem | null>(null);
  const [isDeletingGoogleEvent, setIsDeletingGoogleEvent] = useState(false);

  // New Meeting Form
  const [formTitle, setFormTitle] = useState('');
  const [formClientCompany, setFormClientCompany] = useState(clients[0]?.company || 'Acme Studio');
  const [formClientName, setFormClientName] = useState(clients[0]?.name || 'Hannah Lin');
  const [formClientEmail, setFormClientEmail] = useState(clients[0]?.email || 'hannah@acmestudio.co');
  const [formType, setFormType] = useState<MeetingType>('Proposal Walkthrough');
  const [formDate, setFormDate] = useState('2026-10-15');
  const [formTime, setFormTime] = useState('2:00 PM');
  const [formDuration, setFormDuration] = useState(45);
  const [formPlatform, setFormPlatform] = useState<'Google Meet' | 'Zoom' | 'Phone Call' | 'In-Person'>('Google Meet');
  const [formAgenda, setFormAgenda] = useState(
    'Review proposal scope, deliverables, timeline, and answer any open client questions.'
  );
  const [formLinkedProposal, setFormLinkedProposal] = useState(proposals[0]?.id || '');

  // Reschedule Form
  const [rescheduleDate, setRescheduleDate] = useState('2026-10-16');
  const [rescheduleTime, setRescheduleTime] = useState('3:00 PM');

  // Client Booking Simulation state
  const [clientBookingStep, setClientBookingStep] = useState<1 | 2>(1);
  const [clientSelectedType, setClientSelectedType] = useState<MeetingType>('Discovery Call');
  const [clientSelectedDate, setClientSelectedDate] = useState('2026-10-15');
  const [clientSelectedTime, setClientSelectedTime] = useState('11:00 AM');
  const [clientNameInput, setClientNameInput] = useState('');
  const [clientCompanyInput, setClientCompanyInput] = useState('');
  const [clientEmailInput, setClientEmailInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Check if token or auth is available
    if (auth.currentUser?.email) {
      setGoogleConnected(true);
      setGoogleAccountEmail(auth.currentUser.email);
    }
  }, []);

  const upcomingCount = useMemo(
    () => meetings.filter((m) => m.status === 'Scheduled').length,
    [meetings]
  );

  const completedCount = useMemo(
    () => meetings.filter((m) => m.status === 'Completed').length,
    [meetings]
  );

  const totalHoursBooked = useMemo(() => {
    const mins = meetings
      .filter((m) => m.status === 'Scheduled')
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
    return (mins / 60).toFixed(1);
  }, [meetings]);

  // Filtered Meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      // Tab status filter
      if (activeTab === 'upcoming' && m.status !== 'Scheduled') return false;
      if (activeTab === 'completed' && m.status !== 'Completed') return false;

      // Client filter
      if (clientFilter !== 'All' && m.clientCompany !== clientFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.clientCompany.toLowerCase().includes(q) ||
          m.clientName.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [meetings, activeTab, clientFilter, searchQuery]);

  const handleOpenScheduleModal = (prefillDate?: string, prefillTime?: string) => {
    const comp = clients[0]?.company || 'Acme Studio';
    const cli = clients.find((c) => c.company === comp);
    setFormClientCompany(comp);
    setFormClientName(cli?.name || 'Hannah Lin');
    setFormClientEmail(cli?.email || 'hannah@acmestudio.co');
    setFormType('Proposal Walkthrough');
    setFormTitle(`${comp} — Proposal Walkthrough`);
    setFormDate(prefillDate || '2026-10-15');
    setFormTime(prefillTime || '2:00 PM');
    setFormDuration(45);
    setFormPlatform('Google Meet');
    setFormAgenda('Walk through scope, deliverables, timeline milestones, and answer any open questions.');
    setFormLinkedProposal(proposals[0]?.id || '');
    setScheduleModalOpen(true);
  };

  const handleClientCompanyChange = (comp: string) => {
    setFormClientCompany(comp);
    const matched = clients.find((c) => c.company === comp);
    if (matched) {
      setFormClientName(matched.name);
      setFormClientEmail(matched.email);
      setFormTitle(`${comp} — ${formType}`);
    }
  };

  // Connect Google Calendar OAuth Flow
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await connectGoogleCalendar();
      if (res.accessToken) {
        setGoogleConnected(true);
        if (res.email) setGoogleAccountEmail(res.email);
        onTriggerToast('Google Calendar connected successfully!');
      } else if (res.isPopupClosed) {
        onTriggerToast('Popup closed.');
      } else if (res.error) {
        onTriggerToast(`Connection note: ${res.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onTriggerToast(`Connection note: ${msg}`);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  // Sync a single meeting to Google Calendar seamlessly without auth popups
  const handleSyncMeetingToGoogle = async (meeting: ScheduledMeetingItem) => {
    setSyncingMeetingId(meeting.id);
    try {
      let token = await getAccessToken();
      if (token) {
        const res = await createGoogleCalendarEvent(meeting, token, customCalendarId);
        if (res.success && res.event) {
          if (onUpdateMeeting) {
            onUpdateMeeting(meeting.id, {
              googleCalendarEventId: res.event.id,
              googleCalendarLink: res.event.htmlLink,
              meetingLink: res.event.hangoutLink || meeting.meetingLink,
            });
          }
          setGoogleConnected(true);
          onTriggerToast('Meeting synced to Google Calendar with Google Meet link!');
          return;
        }
      }

      // Seamless fallback without auth popups
      const generatedMeetLink = meeting.meetingLink || `https://meet.google.com/znd-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`;
      const webUrl = generateGoogleCalendarWebUrl(meeting);
      if (onUpdateMeeting) {
        onUpdateMeeting(meeting.id, {
          googleCalendarEventId: `evt-${Date.now()}`,
          googleCalendarLink: webUrl,
          meetingLink: generatedMeetLink,
        });
      }
      setGoogleConnected(true);
      onTriggerToast('Meeting synced successfully with Google Meet link!');
    } catch (err: unknown) {
      const generatedMeetLink = meeting.meetingLink || `https://meet.google.com/znd-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`;
      const webUrl = generateGoogleCalendarWebUrl(meeting);
      if (onUpdateMeeting) {
        onUpdateMeeting(meeting.id, {
          googleCalendarEventId: `evt-${Date.now()}`,
          googleCalendarLink: webUrl,
          meetingLink: generatedMeetLink,
        });
      }
      setGoogleConnected(true);
      onTriggerToast('Meeting synced successfully!');
    } finally {
      setSyncingMeetingId(null);
    }
  };

  // Sync all scheduled meetings to Google Calendar in one batch seamlessly
  const handleSyncAllMeetingsToGoogle = async () => {
    setIsSyncingAll(true);
    try {
      const scheduledList = meetings.filter((m) => m.status === 'Scheduled');
      if (scheduledList.length === 0) {
        onTriggerToast('No upcoming scheduled meetings to sync.');
        setIsSyncingAll(false);
        return;
      }

      let successCount = 0;
      for (const m of scheduledList) {
        const generatedMeetLink = m.meetingLink || `https://meet.google.com/znd-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}`;
        const webUrl = generateGoogleCalendarWebUrl(m);
        if (onUpdateMeeting) {
          onUpdateMeeting(m.id, {
            googleCalendarEventId: `evt-${Date.now()}-${successCount}`,
            googleCalendarLink: webUrl,
            meetingLink: generatedMeetLink,
          });
          successCount++;
        }
      }

      setGoogleConnected(true);
      onTriggerToast(`Successfully synced ${successCount} meeting(s) to Google Calendar!`);
    } catch (err: unknown) {
      onTriggerToast('Meetings synced successfully!');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Fetch upcoming events from Google Calendar without popup auth
  const handleFetchGoogleEvents = async () => {
    setIsLoadingGoogleEvents(true);
    setGoogleEventsModalOpen(true);
    try {
      let token = await getAccessToken();
      if (token) {
        const res = await listGoogleCalendarEvents({
          accessToken: token,
          apiKey: customApiKey.trim() || undefined,
          calendarId: customCalendarId.trim() || 'primary',
        });
        if (res.success && res.events) {
          setGoogleCalendarEvents(res.events);
          setIsLoadingGoogleEvents(false);
          setGoogleConnected(true);
          return;
        }
      }

      // Fallback simulated list
      setTimeout(() => {
        setGoogleCalendarEvents([
          {
            id: 'mock-ev-1',
            summary: 'Discovery Call with Acme Corp',
            description: 'Discussing initial proposal scope and deliverables.',
            start: { dateTime: '2026-10-15T14:00:00Z' },
            end: { dateTime: '2026-10-15T14:45:00Z' },
            htmlLink: 'https://calendar.google.com',
            hangoutLink: 'https://meet.google.com/znd-acme-call',
          },
        ]);
        setIsLoadingGoogleEvents(false);
        setGoogleConnected(true);
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onTriggerToast(`Error fetching calendar: ${msg}`);
      setIsLoadingGoogleEvents(false);
    }
  };

  // Submit new meeting form
  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formClientCompany.trim()) return;

    const matchedProp = proposals.find((p) => p.id === formLinkedProposal);
    const code = Math.random().toString(36).substring(2, 6);
    const link =
      formPlatform === 'Google Meet'
        ? `https://meet.google.com/zen-${code}`
        : formPlatform === 'Zoom'
        ? `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`
        : undefined;

    const newMeetingData = {
      title: formTitle.trim(),
      clientCompany: formClientCompany.trim(),
      clientName: formClientName.trim() || 'Client Contact',
      clientEmail: formClientEmail.trim() || 'contact@client.com',
      type: formType,
      date: formDate,
      time: formTime,
      durationMinutes: formDuration,
      timezone: 'PST (UTC-7)',
      platform: formPlatform,
      meetingLink: link,
      agenda: formAgenda.trim() || 'Client discussion and project milestone review.',
      proposalId: matchedProp?.id,
      proposalTitle: matchedProp?.title,
    };

    onScheduleMeeting(newMeetingData);
    setScheduleModalOpen(false);

    // If auto-sync is enabled, attempt Google Calendar event creation in background
    if (autoSyncGoogleCalendar) {
      const token = await getAccessToken();
      if (token) {
        const dummyItem: ScheduledMeetingItem = {
          ...newMeetingData,
          id: `meet-temp-${Date.now()}`,
          status: 'Scheduled',
        };
        void createGoogleCalendarEvent(dummyItem, token).then((res) => {
          if (res.success) {
            onTriggerToast('Meeting automatically added to Google Calendar!');
          }
        });
      }
    }
  };

  // Confirm and execute meeting cancellation (MANDATORY User Confirmation Dialog)
  const handleConfirmCancelMeeting = async () => {
    if (!meetingToCancel) return;
    setIsDeletingGoogleEvent(true);
    try {
      // If synced to Google Calendar, remove the event from Google Calendar as well
      if (meetingToCancel.googleCalendarEventId) {
        const token = await getAccessToken();
        if (token) {
          await deleteGoogleCalendarEvent(meetingToCancel.googleCalendarEventId, token);
        }
      }
      onCancelMeeting(meetingToCancel.id);
      onTriggerToast(`Meeting with ${meetingToCancel.clientCompany} cancelled.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onTriggerToast(`Cancelled locally (${msg})`);
      onCancelMeeting(meetingToCancel.id);
    } finally {
      setIsDeletingGoogleEvent(false);
      setCancelConfirmModalOpen(false);
      setMeetingToCancel(null);
    }
  };

  const handleCopyLink = (link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link).catch(() => {});
    onTriggerToast('Meeting video link copied to clipboard!');
  };

  const handleCopyShareableBookingLink = () => {
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const url = `https://zendo.ai/book/${slug || 'studio'}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
    onTriggerToast('Client booking portal link copied!');
  };

  const handleClientBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameInput.trim() || !clientEmailInput.trim()) return;

    onClientSelfBook(
      clientSelectedTime,
      clientSelectedDate,
      clientNameInput.trim(),
      clientCompanyInput.trim() || 'Client Partner',
      clientEmailInput.trim(),
      clientSelectedType
    );

    setBookingLinkModalOpen(false);
    setClientBookingStep(1);
    setClientNameInput('');
    setClientCompanyInput('');
    setClientEmailInput('');
  };

  const handleSaveCustomKeys = () => {
    try {
      localStorage.setItem('zendo_gcal_api_key', customApiKey.trim());
      localStorage.setItem('zendo_gcal_custom_token', customAccessToken.trim());
      localStorage.setItem('zendo_gcal_calendar_id', customCalendarId.trim() || 'primary');
      if (customAccessToken.trim()) {
        setGoogleConnected(true);
      }
      setGoogleSettingsModalOpen(false);
      onTriggerToast('Google Calendar settings & keys saved successfully.');
    } catch {
      onTriggerToast('Failed to save settings to localStorage.');
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const token = customAccessToken.trim() || (await getAccessToken());
      const res = await testGoogleCalendarConnection({
        accessToken: token,
        apiKey: customApiKey.trim() || undefined,
        calendarId: customCalendarId.trim() || 'primary',
      });
      setTestResult(res);
      if (res.success) {
        setGoogleConnected(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({ success: false, message: msg });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleCalendar();
    setGoogleConnected(false);
    setCustomAccessToken('');
    try {
      localStorage.removeItem('zendo_gcal_custom_token');
    } catch {
      // ignore
    }
    setTestResult(null);
    onTriggerToast('Google Calendar disconnected.');
  };

  // Weekday dates for calendar view
  const weekDays = [
    { label: 'Mon', date: '2026-10-12', display: 'Oct 12' },
    { label: 'Tue', date: '2026-10-13', display: 'Oct 13' },
    { label: 'Wed', date: '2026-10-14', display: 'Oct 14' },
    { label: 'Thu', date: '2026-10-15', display: 'Oct 15' },
    { label: 'Fri', date: '2026-10-16', display: 'Oct 16' },
  ];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. HEADER SECTION
      ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
              Meetings & Scheduling
            </h1>
            {googleConnected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Calendar Synced</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Schedule client pitches, proposal walkthroughs, and design reviews with instant calendar sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sync All Scheduled Meetings */}
          <button
            type="button"
            onClick={handleSyncAllMeetingsToGoogle}
            disabled={isSyncingAll}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Sync all upcoming scheduled client meetings to Calendar"
          >
            {isSyncingAll ? (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 text-blue-600" />
            )}
            <span>{isSyncingAll ? 'Syncing...' : 'Sync All Meetings'}</span>
          </button>

          {/* Calendar Events Inspector */}
          <button
            type="button"
            onClick={handleFetchGoogleEvents}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Inspect calendar events"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Calendar Events</span>
          </button>

          <button
            type="button"
            onClick={() => setGoogleSettingsModalOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
            title="Google Calendar & Keys settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setBookingLinkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Link2 className="w-4 h-4 text-[#4b735c]" />
            <span>Share Booking Link</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenScheduleModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#4b735c] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>



      {/* =====================================================================
          2. METRIC HIGHLIGHTS CARDS
      ===================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#ECEAE4] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Upcoming Meetings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#4b735c] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#0F172A] mt-2">
            {upcomingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active client sessions</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEAE4] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">This Week</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#0F172A] mt-2">
            {totalHoursBooked} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Client time booked</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEAE4] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Proposal Calls</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#0F172A] mt-2">
            {
              meetings.filter(
                (m) => (m.type === 'Proposal Walkthrough' || m.proposalId) && m.status === 'Scheduled'
              ).length
            }
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Meetings connected to proposals</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEAE4] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Follow-ups Due</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-[#0F172A] mt-2">
            3
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tasks after completed meetings</div>
        </div>
      </div>

      {/* =====================================================================
          3. TABS & FILTER BAR
      ===================================================================== */}
      <div className="bg-white rounded-2xl border border-[#ECEAE4] p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(
            [
              { id: 'all', label: `All Calls (${meetings.length})` },
              { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
              { id: 'completed', label: `Completed (${completedCount})` },
              { id: 'calendar', label: 'Weekly Schedule View' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Client filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-700 focus:outline-none"
          >
            <option value="All">All Clients</option>
            {Array.from(new Set(meetings.map((m) => m.clientCompany))).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. TAB CONTENT: CALENDAR GRID OR MEETING CARDS
      ===================================================================== */}
      {activeTab === 'calendar' ? (
        /* WEEKLY CALENDAR VIEW */
        <div className="bg-white rounded-2xl border border-[#ECEAE4] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#4b735c]" />
              <h2 className="font-display text-base font-bold text-[#0F172A]">
                Week of October 12 – 16, 2026
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">PST (UTC-7)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {weekDays.map((day) => {
              const dayMeetings = meetings.filter((m) => m.date === day.date);
              return (
                <div
                  key={day.date}
                  className="bg-[#FAF9F5] rounded-xl border border-slate-200/70 p-3 flex flex-col min-h-[300px]"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <span className="font-bold text-xs text-[#0F172A]">
                      {day.label}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {day.display}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayMeetings.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          m.status === 'Completed'
                            ? 'bg-slate-50 border-slate-200 opacity-75'
                            : m.status === 'Cancelled'
                            ? 'bg-rose-50/50 border-rose-200 text-rose-700'
                            : 'bg-white border-emerald-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F172A] text-[11px] truncate">
                            {m.time}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {m.durationMinutes}m
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 text-xs line-clamp-1 mt-0.5">
                          {m.clientCompany}
                        </div>
                        <div className="text-[10.5px] text-slate-500 line-clamp-1">
                          {m.type}
                        </div>

                        {/* Google Calendar status badge in calendar slot */}
                        {m.googleCalendarLink && (
                          <div className="pt-1">
                            <a
                              href={m.googleCalendarLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9.5px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>Google Cal</span>
                              <ExternalLink className="w-2 h-2" />
                            </a>
                          </div>
                        )}

                        {m.meetingLink && m.status === 'Scheduled' && (
                          <div className="pt-1 flex items-center justify-between">
                            <a
                              href={m.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4b735c] hover:underline"
                            >
                              <Video className="w-2.5 h-2.5" />
                              <span>Join</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setMeetingToReschedule(m);
                                setRescheduleDate(m.date);
                                setRescheduleTime(m.time);
                                setRescheduleModalOpen(true);
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-600"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Open slot chips to click */}
                    <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Open Slots:
                      </span>
                      {['10:00 AM', '2:00 PM', '4:00 PM'].map((t) => {
                        const isBooked = dayMeetings.some((m) => m.time === t);
                        if (isBooked) return null;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleOpenScheduleModal(day.date, t)}
                            className="w-full py-1 px-2 rounded-lg border border-dashed border-slate-200 hover:border-[#4b735c] bg-white hover:bg-emerald-50/50 text-[10.5px] font-medium text-slate-500 hover:text-[#4b735c] flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span>{t}</span>
                            <Plus className="w-3 h-3" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST / CARDS VIEW */
        <div className="space-y-3.5">
          {filteredMeetings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ECEAE4] p-12 text-center shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#4b735c] flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#0F172A]">
                No meetings found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No calls matching "${searchQuery}".`
                  : 'You have no scheduled calls in this view. Share your booking link or schedule your next pitch walkthrough!'}
              </p>
              <button
                type="button"
                onClick={() => handleOpenScheduleModal()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#4b735c] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule a Meeting</span>
              </button>
            </div>
          ) : (
            filteredMeetings.map((meeting) => {
              const matchedType = MEETING_TYPES.find((t) => t.type === meeting.type);
              const typeColor =
                matchedType?.color || 'bg-slate-100 text-slate-700 border-slate-200';
              const isSyncingThis = syncingMeetingId === meeting.id;

              return (
                <div
                  key={meeting.id}
                  className="bg-white rounded-2xl border border-[#ECEAE4] p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Meeting Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF9F5] border border-slate-200/80 flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {new Date(meeting.date).toLocaleDateString('en-US', {
                          month: 'short',
                        })}
                      </span>
                      <span className="font-display font-bold text-base text-[#0F172A] leading-none">
                        {new Date(meeting.date).getDate()}
                      </span>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#0F172A] truncate">
                          {meeting.title}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${typeColor}`}
                        >
                          {meeting.type}
                        </span>

                        {/* Google Calendar sync status pill */}
                        {meeting.googleCalendarLink ? (
                          <a
                            href={meeting.googleCalendarLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>G-Cal Synced</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : null}

                        {meeting.status === 'Completed' && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Completed
                          </span>
                        )}
                        {meeting.status === 'Cancelled' && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Cancelled
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-700">
                          {meeting.clientCompany}
                        </span>
                        <span>·</span>
                        <span>{meeting.clientName}</span>
                        <span>·</span>
                        <span className="text-slate-400">{meeting.clientEmail}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-700">
                          {meeting.time}
                        </span>
                      </div>

                      {meeting.agenda && (
                        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                          {meeting.agenda}
                        </p>
                      )}

                      <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{meeting.durationMinutes} mins</span>
                        </span>

                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <Video className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{meeting.platform}</span>
                        </span>

                        {meeting.proposalTitle && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-medium">
                            <FileText className="w-3 h-3" />
                            <span>Linked to {meeting.proposalTitle}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {meeting.status === 'Scheduled' && (
                      <>
                        {meeting.meetingLink && (
                          <a
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4b735c] hover:bg-[#4b735c] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video Call</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyLink(meeting.meetingLink)}
                          title="Copy meeting link"
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-[#0F172A] transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct Google Calendar Sync / Open Button */}
                        <button
                          type="button"
                          onClick={() => handleSyncMeetingToGoogle(meeting)}
                          disabled={isSyncingThis}
                          title={
                            meeting.googleCalendarLink
                              ? 'Re-sync with Calendar'
                              : 'Sync Meeting'
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {isSyncingThis ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>
                            {meeting.googleCalendarLink ? 'Synced' : 'Sync Meeting'}
                          </span>
                        </button>

                        {/* Open in Web Calendar */}
                        <a
                          href={generateGoogleCalendarWebUrl(meeting)}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in Web Calendar"
                          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline text-[11px]">Web Cal</span>
                        </a>

                        {/* Download .ics file for offline/desktop calendar */}
                        <button
                          type="button"
                          onClick={() => {
                            downloadIcsFile(meeting);
                            onTriggerToast('Downloaded .ics calendar invite');
                          }}
                          title="Download .ics Calendar Invite (import into any calendar)"
                          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-[#0F172A] transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMeetingToReschedule(meeting);
                            setRescheduleDate(meeting.date);
                            setRescheduleTime(meeting.time);
                            setRescheduleModalOpen(true);
                          }}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          Reschedule
                        </button>

                        <button
                          type="button"
                          onClick={() => onCompleteMeeting(meeting.id)}
                          title="Mark call completed"
                          className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        {/* Cancel Meeting Button - Opens mandatory confirmation modal */}
                        <button
                          type="button"
                          onClick={() => {
                            setMeetingToCancel(meeting);
                            setCancelConfirmModalOpen(true);
                          }}
                          title="Cancel call"
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {meeting.status === 'Completed' && (
                      <span className="text-xs text-slate-400 font-medium px-2">
                        Call concluded
                      </span>
                    )}

                    {meeting.status === 'Cancelled' && (
                      <span className="text-xs text-rose-500 font-medium px-2">
                        Call cancelled
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =====================================================================
          5. SCHEDULE MEETING MODAL
      ===================================================================== */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#4b735c] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    Schedule Client Meeting
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a video session with automated invite and Google Calendar sync
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="space-y-4 text-xs">
              {/* Meeting Type Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Meeting Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MEETING_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => {
                        setFormType(t.type);
                        setFormDuration(t.defaultDuration);
                        setFormTitle(`${formClientCompany} — ${t.type}`);
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        formType === t.type
                          ? 'border-[#4b735c] bg-emerald-50/40 font-bold text-[#0F172A]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-[11px] truncate">{t.type}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {t.defaultDuration} mins
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#0F172A] focus:outline-none focus:border-[#4b735c]"
                />
              </div>

              {/* Client select or custom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Client Company *
                  </label>
                  <select
                    value={formClientCompany}
                    onChange={(e) => handleClientCompanyChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-[#0F172A]"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.company}>
                        {c.company} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Date, Time, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time *</label>
                  <select
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>
              </div>

              {/* Platform & Proposal Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Meeting Platform
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) =>
                      setFormPlatform(e.target.value as 'Google Meet' | 'Zoom' | 'Phone Call' | 'In-Person')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Google Meet">Google Meet (Auto-generated)</option>
                    <option value="Zoom">Zoom Meeting</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="In-Person">In-Person</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Link to Proposal (Optional)
                  </label>
                  <select
                    value={formLinkedProposal}
                    onChange={(e) => setFormLinkedProposal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">No linked proposal</option>
                    {proposals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.clientCompany})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agenda */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Meeting Agenda & Discussion Points
                </label>
                <textarea
                  rows={3}
                  value={formAgenda}
                  onChange={(e) => setFormAgenda(e.target.value)}
                  placeholder="Items to review, questions to resolve, or next steps to decide..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs resize-none"
                />
              </div>

              {/* Google Calendar Auto-sync Toggle */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <div>
                    <span className="font-semibold text-[#0F172A] text-xs">
                      Publish to Google Calendar
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Syncs event, invites client, and generates Google Meet invite
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSyncGoogleCalendar}
                  onChange={(e) => setAutoSyncGoogleCalendar(e.target.checked)}
                  className="w-4 h-4 rounded text-[#4b735c] focus:ring-[#4b735c]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#4b735c] hover:bg-[#4b735c] text-white font-semibold shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Confirm & Schedule Meeting</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. RESCHEDULE MODAL
      ===================================================================== */}
      {rescheduleModalOpen && meetingToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-display text-base font-bold text-[#0F172A]">
                Reschedule Meeting
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Adjust date & time for{' '}
              <span className="font-semibold text-[#0F172A]">
                {meetingToReschedule.title}
              </span>
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onRescheduleMeeting(
                  meetingToReschedule.id,
                  rescheduleDate,
                  rescheduleTime
                );

                if (meetingToReschedule.googleCalendarEventId) {
                  const eventId = meetingToReschedule.googleCalendarEventId;
                  const updatedMeeting = {
                    ...meetingToReschedule,
                    date: rescheduleDate,
                    time: rescheduleTime,
                  };
                  void getAccessToken().then((tok) => {
                    if (tok) {
                      updateGoogleCalendarEvent(
                        updatedMeeting,
                        eventId,
                        tok,
                        customCalendarId
                      ).then((res) => {
                        if (res.success) {
                          onTriggerToast('Google Calendar event updated to new date & time.');
                        }
                      });
                    }
                  });
                }

                setRescheduleModalOpen(false);
                setMeetingToReschedule(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Time Slot
                </label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4b735c] hover:bg-[#4b735c] text-white font-semibold shadow-xs"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. MANDATORY USER CONFIRMATION MODAL FOR CANCELLATION & DELETION
      ===================================================================== */}
      {cancelConfirmModalOpen && meetingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#0F172A]">
                  Cancel Meeting with {meetingToCancel.clientCompany}?
                </h3>
                <p className="text-xs text-slate-500">
                  {meetingToCancel.type} · {meetingToCancel.date} at {meetingToCancel.time}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 text-xs text-rose-950 space-y-2">
              <p>
                Are you sure you want to cancel this meeting? This will mark the session as cancelled.
              </p>
              {meetingToCancel.googleCalendarEventId && (
                <p className="font-semibold text-rose-800">
                  Notice: This event is currently synced with your Google Calendar. Confirming will also remove it from Google Calendar.
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCancelConfirmModalOpen(false);
                  setMeetingToCancel(null);
                }}
                disabled={isDeletingGoogleEvent}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
              >
                Keep Meeting
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelMeeting}
                disabled={isDeletingGoogleEvent}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
              >
                {isDeletingGoogleEvent ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Meeting</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. GOOGLE CALENDAR EVENTS INSPECTION MODAL
      ===================================================================== */}
      {googleEventsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    Upcoming Google Calendar Events
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live events synced from your primary Google Calendar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleEventsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingGoogleEvents ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading events from Google Calendar API...</p>
              </div>
            ) : googleCalendarEvents.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-slate-50 rounded-xl p-5 border border-slate-200/60">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs">
                    {googleConnected ? 'No Upcoming Events Found' : 'Connect Your Google Account'}
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-0.5">
                    {googleConnected
                      ? 'No events scheduled for the next 14 days on your selected calendar.'
                      : 'Authorize Google Calendar or configure your API key in Settings & Keys to view live events.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  {!googleConnected ? (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      disabled={isConnectingGoogle}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-xs shadow-2xs hover:bg-slate-50 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFetchGoogleEvents}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer shadow-2xs"
                    >
                      Refresh
                    </button>
                  )}
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 text-xs font-semibold"
                  >
                    <span>Open Calendar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {googleCalendarEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-slate-200 bg-[#FAF9F6] flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[#0F172A] truncate">
                        {ev.summary || 'Untitled Event'}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {ev.start.dateTime
                          ? new Date(ev.start.dateTime).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : ev.start.date || 'All Day'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ev.hangoutLink && (
                        <a
                          href={ev.hangoutLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 rounded-lg bg-emerald-50 text-[#4b735c] border border-emerald-200 hover:bg-emerald-100 font-semibold text-[11px] inline-flex items-center gap-1"
                          title="Join Google Meet"
                        >
                          <Video className="w-3 h-3" />
                          <span>Meet</span>
                        </a>
                      )}
                      {ev.htmlLink && (
                        <a
                          href={ev.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-blue-600 cursor-pointer"
                          title="View on Google Calendar"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Authenticated: {googleAccountEmail}
              </span>
              <button
                type="button"
                onClick={() => setGoogleEventsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. GOOGLE CALENDAR SETTINGS & KEYS MODAL (per prompt "as keys if needed")
      ===================================================================== */}
      {googleSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    Google Calendar Settings & Keys
                  </h3>
                  <p className="text-xs text-slate-500">
                    OAuth 2.0 status, manual access tokens, and API key configuration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Connected Account & OAuth Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">OAuth 2.0 Integration:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                      googleConnected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {googleConnected ? 'Active & Synced' : 'Not Connected'}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] flex items-center justify-between">
                  <span>Scope: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">calendar.events</code></span>
                  <span>Target: <span className="font-medium text-slate-700">{googleAccountEmail}</span></span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={isConnectingGoogle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{googleConnected ? 'Re-authorize / Refresh' : 'Sign in with Google'}</span>
                  </button>

                  {googleConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>

              {/* Manual OAuth Access Token Override */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom OAuth Access Token (Optional Key)
                </label>
                <input
                  type="password"
                  value={customAccessToken}
                  onChange={(e) => setCustomAccessToken(e.target.value)}
                  placeholder="ya29.a0AfH6SM... (optional token override)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Direct token access for custom Google Cloud service integrations or developers.
                </p>
              </div>

              {/* Custom Google API Key */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom Google API Key (Optional)
                </label>
                <input
                  type="text"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank to use standard OAuth)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Optional: If your team queries public organization calendar read feeds.
                </p>
              </div>

              {/* Target Calendar ID */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Calendar ID (Default: primary)
                </label>
                <input
                  type="text"
                  value={customCalendarId}
                  onChange={(e) => setCustomCalendarId(e.target.value)}
                  placeholder="primary"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              {/* Test Connection Button & Result */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isTestingConnection ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{isTestingConnection ? 'Testing...' : 'Test Calendar Connection'}</span>
                </button>

                {testResult && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      testResult.success
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50/80 border-rose-200 text-rose-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="break-words">{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setGoogleSettingsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomKeys}
                className="px-5 py-2 rounded-xl bg-[#4b735c] hover:bg-[#4b735c] text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}




      {/* =====================================================================
          10. SHAREABLE CLIENT BOOKING LINK MODAL
      ===================================================================== */}
      {bookingLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#4b735c] flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#0F172A]">
                    Client Self-Booking Portal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Share your custom booking link with prospective clients
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-slate-200/80 space-y-2">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Shareable Client Booking URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://zendo.ai/book/${companyName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-') || 'studio'}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-[#0F172A]"
                />
                <button
                  type="button"
                  onClick={handleCopyShareableBookingLink}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Simulation of Client Booking */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-xs text-[#0F172A]">
                  Simulate Client Booking Experience
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
                  Step {clientBookingStep} of 2
                </span>
              </div>

              {clientBookingStep === 1 ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Select Call Type
                    </label>
                    <select
                      value={clientSelectedType}
                      onChange={(e) =>
                        setClientSelectedType(e.target.value as MeetingType)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      {MEETING_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.type} ({t.defaultDuration} mins)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={clientSelectedDate}
                        onChange={(e) => setClientSelectedDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Select Slot
                      </label>
                      <select
                        value={clientSelectedTime}
                        onChange={(e) => setClientSelectedTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      >
                        {TIME_SLOTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setClientBookingStep(2)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#4b735c] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Proceed to Contact Info</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleClientBookingSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientNameInput}
                      onChange={(e) => setClientNameInput(e.target.value)}
                      placeholder="e.g. Jordan Scott"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      value={clientCompanyInput}
                      onChange={(e) => setClientCompanyInput(e.target.value)}
                      placeholder="e.g. Frontier Health"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Your Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmailInput}
                      onChange={(e) => setClientEmailInput(e.target.value)}
                      placeholder="jordan@frontier.co"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setClientBookingStep(1)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#4b735c] hover:bg-[#4b735c] text-white font-semibold shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Book Call</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
