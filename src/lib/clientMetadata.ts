export interface ClientActivity {
  id: string;
  type: 'note' | 'proposal' | 'invoice' | 'task';
  title: string;
  content?: string;
  timestamp: string;
  author: string;
}

export interface ClientMetadata {
  domain?: string;
  description?: string;
  companySize?: string;
  source?: string;
  logoUrl?: string;
  tags?: string[];
  activities?: ClientActivity[];
}

const STORAGE_PREFIX = 'zendo_client_meta_';

export function getClientMetadata(clientId: string): ClientMetadata {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${clientId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    domain: '',
    description: '',
    companySize: '',
    source: '',
    tags: [],
    activities: [],
  };
}

export function saveClientMetadata(
  clientId: string,
  updates: Partial<ClientMetadata>
): ClientMetadata {
  const current = getClientMetadata(clientId);
  const next: ClientMetadata = {
    ...current,
    ...updates,
    tags: updates.tags ?? current.tags ?? [],
    activities: updates.activities ?? current.activities ?? [],
  };
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${clientId}`, JSON.stringify(next));
  } catch {}
  return next;
}

export function addClientActivityNote(
  clientId: string,
  noteText: string,
  authorName: string = 'You'
): ClientMetadata {
  const current = getClientMetadata(clientId);
  const newActivity: ClientActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'note',
    title: 'Note added',
    content: noteText.trim(),
    timestamp: new Date().toISOString(),
    author: authorName,
  };
  const updatedActivities = [newActivity, ...(current.activities || [])];
  return saveClientMetadata(clientId, { activities: updatedActivities });
}
