import React, { useRef } from 'react';
import { Upload, Link as LinkIcon, Trash2, Sparkles, Check, Building2 } from 'lucide-react';

export interface ClientLogoPickerProps {
  logoUrl: string;
  companyName: string;
  onChange: (newLogoUrl: string) => void;
  label?: string;
  description?: string;
}

// Curated high-res brand logos and geometric marks
export const PRESET_CLIENT_LOGOS = [
  {
    name: 'Emerald Matrix',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=160&h=160&q=80',
    color: '#0c9256',
  },
  {
    name: 'Cobalt Prism',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=160&h=160&q=80',
    color: '#3b82f6',
  },
  {
    name: 'Violet Nova',
    url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=160&h=160&q=80',
    color: '#8b5cf6',
  },
  {
    name: 'Apex Modern',
    url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=160&h=160&q=80',
    color: '#f59e0b',
  },
  {
    name: 'Lumina Wave',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=160&h=160&q=80',
    color: '#ec4899',
  },
  {
    name: 'Cyber Onyx',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=160&h=160&q=80',
    color: '#0f172a',
  },
];

export function getCompanyInitials(name: string): string {
  if (!name || !name.trim()) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ClientLogoPicker: React.FC<ClientLogoPickerProps> = ({
  logoUrl,
  companyName,
  onChange,
  label = 'Client Logo',
  description = 'Upload an image, provide a logo URL, or select a brand badge',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = getCompanyInitials(companyName);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3 bg-[#faf9f5] border border-[#e1e9e4] rounded-2xl p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-[#101c19]">
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-[#596960] mt-0.5">{description}</p>
          )}
        </div>
        {logoUrl && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Main Preview & Upload Controls */}
      <div className="flex items-center gap-3.5">
        {/* Logo Avatar Preview */}
        <div className="relative w-14 h-14 rounded-xl border-2 border-[#e1e9e4] bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-xs group">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName || 'Client Logo'}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If remote image fails to load, gracefully reset
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-[#f0f4f1] text-[#0c9256] font-bold text-base flex items-center justify-center tracking-wider">
              {initials}
            </div>
          )}

          {/* Quick upload overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload logo"
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Buttons & Options */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e1e9e4] hover:bg-[#f0f4f1] text-[#101c19] text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#0c9256]" />
              <span>Upload Image</span>
            </button>

            <span className="text-[11px] text-[#84968c]">or paste URL below</span>
          </div>

          <div className="relative">
            <LinkIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#84968c]" />
            <input
              type="url"
              value={logoUrl.startsWith('data:') ? '' : logoUrl}
              onChange={(e) => onChange(e.target.value)}
              placeholder={logoUrl.startsWith('data:') ? 'Custom uploaded image active' : 'https://example.com/logo.png'}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#e1e9e4] bg-white text-xs text-[#101c19] focus:border-[#0c9256] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Preset Brand Logos for quick pick */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#596960] mb-1.5">
          <Sparkles className="w-3 h-3 text-[#0c9256]" />
          <span>Quick Brand Badges</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PRESET_CLIENT_LOGOS.map((preset) => {
            const isSelected = logoUrl === preset.url;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onChange(preset.url)}
                className={`w-8 h-8 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-[#0c9256] ring-2 ring-[#0c9256]/30 scale-105'
                    : 'border-[#e1e9e4] hover:border-slate-400 opacity-90 hover:opacity-100'
                }`}
                title={preset.name}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-[#0c9256]/40 flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
