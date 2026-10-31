export type ProposalThemeKey =
  | 'cyber-onyx'
  | 'executive-skyline'
  | 'bauhaus-purple'
  | 'playful-crayon'
  | 'classic';

export interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface ParsedLayoutElement {
  id?: string;
  type: string;
  text: string;
  bbox: BoundingBox;
  confidence?: number;
}

export interface ProposalThemeConfig {
  key: ProposalThemeKey;
  name: string;
  subtitle: string;
  category: string;
  screenshotPath: string;
  accentColor: string;
  secondaryColor: string;
  bgClass: string;
  textClass: string;
  fontFamily: 'sans' | 'serif' | 'mono' | 'display';
  borderClass: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  vibe: string;
}

export const PROPOSAL_THEMES: Record<ProposalThemeKey, ProposalThemeConfig> = {
  'cyber-onyx': {
    key: 'cyber-onyx',
    name: 'Cyber Onyx & Cobalt',
    subtitle: 'Modern Tech & Digital Strategy',
    category: 'High-Tech & Agency',
    screenshotPath: '/assets/aistudio/Screenshot_2026-10-26_052503_b78395a8.png',
    accentColor: '#1D4ED8',
    secondaryColor: '#3B82F6',
    bgClass: 'bg-[#090A0F]',
    textClass: 'text-white',
    fontFamily: 'sans',
    borderClass: 'border-blue-900/60',
    description:
      'High-contrast futuristic pitch deck with electric cobalt diagonal bands, dot-matrix telemetry accents, and sharp typography.',
    badgeBg: 'bg-blue-950/80',
    badgeText: 'text-blue-300',
    vibe: 'Digital Marketing, AI Engineering, SaaS Overhauls',
  },
  'executive-skyline': {
    key: 'executive-skyline',
    name: 'Executive Skyline',
    subtitle: 'Editorial Digital Transformation',
    category: 'Enterprise & Advisory',
    screenshotPath: '/assets/aistudio/Screenshot_2026-10-26_052445_de4e5565.png',
    accentColor: '#2563EB',
    secondaryColor: '#3B82F6',
    bgClass: 'bg-[#FBFBFD]',
    textClass: 'text-[#0F172A]',
    fontFamily: 'serif',
    borderClass: 'border-slate-200',
    description:
      'Clean editorial layout featuring an architectural skyline crest, high-fashion serif title, and fluid ocean wave corner ribbons.',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    vibe: 'Executive Strategy, Advisory, Digital Transformation',
  },
  'bauhaus-purple': {
    key: 'bauhaus-purple',
    name: 'Bauhaus Rhombus',
    subtitle: 'Geometric Business & Marketing',
    category: 'Modernist & Creative',
    screenshotPath: '/assets/aistudio/Screenshot_2026-10-26_052520_27e03b6c.png',
    accentColor: '#7C6FB0',
    secondaryColor: '#1E2124',
    bgClass: 'bg-white',
    textClass: 'text-[#1E2124]',
    fontFamily: 'sans',
    borderClass: 'border-purple-200/60',
    description:
      'Swiss minimalist layout with an angled 45-degree cluster of periwinkle and deep charcoal diamond tiles on a pristine white grid.',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    vibe: 'Branding, Product Marketing, Creative Consultancies',
  },
  'playful-crayon': {
    key: 'playful-crayon',
    name: 'Playful Grid & Pastel',
    subtitle: 'Creative Workshop & Support',
    category: 'Education & Community',
    screenshotPath: '/assets/aistudio/Screenshot_2026-10-26_052419_7e5646f6.png',
    accentColor: '#84CC16',
    secondaryColor: '#F472B6',
    bgClass: 'bg-[#FAFBF9]',
    textClass: 'text-[#1E293B]',
    fontFamily: 'display',
    borderClass: 'border-emerald-200/70',
    description:
      'Charming graph-paper canvas framed with playful crayon doodles, pastel torn-paper shapes, and organic rounded highlight badges.',
    badgeBg: 'bg-pink-100',
    badgeText: 'text-pink-700',
    vibe: 'Workshops, Creative Coaching, Non-profit & Education',
  },
  classic: {
    key: 'classic',
    name: 'Classic Calm Zendo',
    subtitle: 'Minimal Slate & Forest Accent',
    category: 'Standard Professional',
    screenshotPath: '/assets/aistudio/zendo-dashboard-with-logo_408f86fd.png',
    accentColor: '#4b735c',
    secondaryColor: '#0F172A',
    bgClass: 'bg-[#0F172A]',
    textClass: 'text-white',
    fontFamily: 'sans',
    borderClass: 'border-slate-800',
    description: 'Clean dark slate header with emerald brand accents, structured cards, and uncluttered presentation.',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    vibe: 'General Client Work, Retainers, Fixed-Scope Engagements',
  },
};
