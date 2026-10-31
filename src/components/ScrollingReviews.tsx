/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, CheckCircle2, Pause, Play, Sparkles, Building2, Layers, Clock, Zap } from 'lucide-react';
import founderAvatar from '../assets/images/avatar_team_lead_1791380135632.jpg';
import creativeAvatar from '../assets/images/avatar_creative_designer_1792321596171.jpg';
import engineerAvatar from '../assets/images/avatar_lead_engineer_1792321596662.jpg';
import productAvatar from '../assets/images/avatar_product_strategist_1792321597348.jpg';
import editorialPortrait from '../assets/images/editorial_founder_portrait_1791381634277.jpg';

export interface ReviewItem {
  id: string;
  author: string;
  role: string;
  company: string;
  avatarUrl?: string;
  initials: string;
  initialsBg: string;
  initialsColor: string;
  quote: string;
  metric: string;
  metricIcon: 'layers' | 'clock' | 'check' | 'zap';
  category: 'studios' | 'founders' | 'product';
  categoryLabel: string;
  rating: number;
  tenure: string;
  featured?: boolean;
}

const REVIEWS_COL_1: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Alex Morgan',
    role: 'Founder & Design Director',
    company: 'Horizon Studio',
    avatarUrl: founderAvatar,
    initials: 'AM',
    initialsBg: '#e8f7ee',
    initialsColor: '#087443',
    quote:
      'Zendo replaced our chaotic combination of Notion boards, Trello cards, and Slack reminders. Our team weekly task completion climbed to 94% within the very first month. The calm focus it brings to our mornings is irreplaceable.',
    metric: 'Consolidated 4 tools into 1 calm workspace',
    metricIcon: 'layers',
    category: 'studios',
    categoryLabel: 'Design & Creative Studio',
    rating: 5,
    tenure: 'Active workspace · 14 months',
    featured: true,
  },
  {
    id: 'rev-2',
    author: 'Marcus Vance',
    role: 'Operations Lead',
    company: 'Fieldnote Systems',
    avatarUrl: engineerAvatar,
    initials: 'MV',
    initialsBg: '#ddeff8',
    initialsColor: '#0c4a6e',
    quote:
      'Automated routines handle all our repetitive status handoffs. We spend our creative energy on high-impact client deliverables instead of maintaining project boards. The two-way sync keeps everyone aligned asynchronously.',
    metric: '94% weekly task completion consistency',
    metricIcon: 'check',
    category: 'founders',
    categoryLabel: 'Operations & Engineering',
    rating: 5,
    tenure: 'Active workspace · 11 months',
  },
  {
    id: 'rev-3',
    author: 'Sophia Chen',
    role: 'Principal Partner',
    company: 'ArchForm Collective',
    initials: 'SC',
    initialsBg: '#fef3c7',
    initialsColor: '#92400e',
    quote:
      'Sending interactive proposals directly through Zendo transformed our client close rate. Clients love reviewing the transparent milestone schedule and line-item scope without twenty back-and-forth emails.',
    metric: '3.2x faster proposal sign-off',
    metricIcon: 'zap',
    category: 'studios',
    categoryLabel: 'Architecture & Spatial',
    rating: 5,
    tenure: 'Pro Plan · 18 proposals closed',
  },
  {
    id: 'rev-4',
    author: 'Liam O’Connor',
    role: 'Head of Growth',
    company: 'MetricLab Growth',
    initials: 'LO',
    initialsBg: '#ebf7f0',
    initialsColor: '#087443',
    quote:
      'The client activity signals are a superpower. Knowing when a decision-maker is reviewing our deliverables table gave us the exact right timing to offer a scope walkthrough and close on the spot.',
    metric: '+$180k closed in Q3 deliverables',
    metricIcon: 'zap',
    category: 'product',
    categoryLabel: 'Growth & Analytics',
    rating: 5,
    tenure: 'Active workspace · 8 months',
  },
  {
    id: 'rev-5',
    author: 'Hannah Ward',
    role: 'Creative Director',
    company: 'Studio Bloom',
    avatarUrl: creativeAvatar,
    initials: 'HW',
    initialsBg: '#f3e8ff',
    initialsColor: '#6b21a8',
    quote:
      'Zendo gave our boutique studio the operational maturity of a 50-person agency. Everything feels intentional, quiet, and beautifully organized. Our clients frequently compliment the clarity of our handoffs.',
    metric: '100% async client onboarding',
    metricIcon: 'layers',
    category: 'studios',
    categoryLabel: 'Brand Identity Studio',
    rating: 5,
    tenure: 'Team Plan · 6 team members',
  },
];

const REVIEWS_COL_2: ReviewItem[] = [
  {
    id: 'rev-6',
    author: 'Elena Rostova',
    role: 'Head of Product',
    company: 'Northstar Labs',
    avatarUrl: productAvatar,
    initials: 'ER',
    initialsBg: '#e8f7ee',
    initialsColor: '#087443',
    quote:
      'Our morning planning used to drag on across three separate apps. With Zendo, everyone sees Today’s Tasks and Upcoming Deadlines immediately. It eliminated at least four weekly status meetings for our cross-functional squads.',
    metric: '4.5 hours saved per team member weekly',
    metricIcon: 'clock',
    category: 'product',
    categoryLabel: 'Product & Engineering',
    rating: 5,
    tenure: 'Active workspace · 12 months',
    featured: true,
  },
  {
    id: 'rev-7',
    author: 'Julian Becker',
    role: 'Founder & CEO',
    company: 'Velocity Ventures',
    avatarUrl: editorialPortrait,
    initials: 'JB',
    initialsBg: '#ddeff8',
    initialsColor: '#101c19',
    quote:
      'We run three portfolio spin-outs inside Zendo. The separation of spaces combined with instant proposal creation keeps our overhead close to zero and our focus razor sharp.',
    metric: '98% on-time milestone delivery',
    metricIcon: 'check',
    category: 'founders',
    categoryLabel: 'Venture Studio',
    rating: 5,
    tenure: 'Founding Member · 24 projects',
  },
  {
    id: 'rev-8',
    author: 'Devon Miller',
    role: 'Managing Partner',
    company: 'Miller & Co. Advisory',
    initials: 'DM',
    initialsBg: '#fef3c7',
    initialsColor: '#92400e',
    quote:
      'Simplicity done right. The Pomodoro Calm Focus timer and universal command palette make moving through high-pressure client deliverables remarkably effortless.',
    metric: '< 2 min morning planning routine',
    metricIcon: 'clock',
    category: 'founders',
    categoryLabel: 'Strategic Advisory',
    rating: 5,
    tenure: 'Pro Plan · 9 months',
  },
  {
    id: 'rev-9',
    author: 'Aria Tanaka',
    role: 'UX Research Lead',
    company: 'Kanso Health',
    initials: 'AT',
    initialsBg: '#f3e8ff',
    initialsColor: '#6b21a8',
    quote:
      'The hierarchy between projects, workspace notes, and urgent priorities is rock-solid. It prevents cognitive overload better than any productivity suite we’ve tested in six years.',
    metric: 'Zero missed deadlines across 18 sprints',
    metricIcon: 'check',
    category: 'product',
    categoryLabel: 'HealthTech Platform',
    rating: 5,
    tenure: 'Active workspace · 16 months',
  },
  {
    id: 'rev-10',
    author: 'Nadia Patel',
    role: 'Operations Director',
    company: 'Alto Media Group',
    initials: 'NP',
    initialsBg: '#fee2e2',
    initialsColor: '#991b1b',
    quote:
      'The return on investment was immediate. Not just the $400/month saved on redundant SaaS subscriptions, but the sanity of our producers finally sharing one single source of truth.',
    metric: 'Replaced 4 disconnected subscriptions',
    metricIcon: 'layers',
    category: 'studios',
    categoryLabel: 'Digital Media Network',
    rating: 5,
    tenure: 'Team Plan · 14 members',
  },
];

interface ScrollingReviewsProps {
  onSelectReview?: (review: ReviewItem) => void;
}

export function ScrollingReviews({ onSelectReview }: ScrollingReviewsProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<'normal' | 'slow'>('normal');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'studios' | 'founders' | 'product'>('all');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  const filterReviews = (items: ReviewItem[]) => {
    if (selectedCategory === 'all') return items;
    return items.filter((item) => item.category === selectedCategory);
  };

  const col1Filtered = filterReviews(REVIEWS_COL_1);
  const col2Filtered = filterReviews(REVIEWS_COL_2);

  // If a category filter yields fewer items, fall back to at least 2 items or all items
  const col1List = col1Filtered.length > 0 ? col1Filtered : REVIEWS_COL_1;
  const col2List = col2Filtered.length > 0 ? col2Filtered : REVIEWS_COL_2;

  // Duplicate for seamless 0 -> -50% loop
  const col1Repeated = [...col1List, ...col1List];
  const col2Repeated = [...col2List, ...col2List];

  const col1AnimationClass =
    speed === 'slow' ? 'animate-marquee-vertical-slow-1' : 'animate-marquee-vertical-1';
  const col2AnimationClass =
    speed === 'slow' ? 'animate-marquee-vertical-slow-2' : 'animate-marquee-vertical-2';

  const renderMetricIcon = (type: ReviewItem['metricIcon']) => {
    switch (type) {
      case 'clock':
        return <Clock className="w-3.5 h-3.5 text-[#0c9256] shrink-0" />;
      case 'layers':
        return <Layers className="w-3.5 h-3.5 text-[#0c9256] shrink-0" />;
      case 'zap':
        return <Zap className="w-3.5 h-3.5 text-[#0c9256] shrink-0" />;
      case 'check':
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#0c9256] shrink-0" />;
    }
  };

  const renderReviewCard = (item: ReviewItem, keyPrefix: string) => {
    const isSelected = activeReviewId === item.id;

    return (
      <div
        key={`${keyPrefix}-${item.id}`}
        onClick={() => {
          setActiveReviewId(item.id);
          onSelectReview?.(item);
        }}
        className={`group text-left bg-white rounded-[22px] p-6 transition-all duration-300 cursor-pointer ${
          isSelected
            ? 'border-2 border-[#0c9256] shadow-[0_12px_32px_rgba(12,146,86,0.12)] ring-4 ring-[#0c9256]/10'
            : item.featured
            ? 'border-2 border-[#0c9256]/80 shadow-[0_4px_24px_rgba(16,28,25,0.06)] hover:border-[#0c9256]'
            : 'border border-[#e1e9e4] shadow-[0_2px_12px_rgba(16,28,25,0.03)] hover:border-[#0c9256]/50 hover:shadow-[0_8px_24px_rgba(16,28,25,0.06)]'
        }`}
      >
        {/* Header: Avatar, Name, Company, Rating */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-semibold shadow-inner">
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt={item.author}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-semibold text-xs"
                  style={{ backgroundColor: item.initialsBg, color: item.initialsColor }}
                >
                  {item.initials}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold text-[#101c19] tracking-tight">
                  {item.author}
                </h4>
                <span
                  title="Verified Zendo Workspace"
                  className="inline-flex items-center text-[#0c9256]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs text-[#596960] line-clamp-1">
                {item.role} · <span className="text-[#101c19] font-medium">{item.company}</span>
              </p>
            </div>
          </div>

          {/* 5-star rating */}
          <div className="flex items-center gap-0.5 text-amber-500 shrink-0 pt-0.5">
            {[...Array(item.rating)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        {/* Quote */}
        <blockquote className="text-[13.5px] text-[#2c3e37] leading-relaxed mb-4 font-normal">
          “{item.quote}”
        </blockquote>

        {/* Metric Highlight Pill */}
        <div className="pt-3 border-t border-[#f0f4f1] flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f7ee] text-[#087443] text-xs font-medium">
            {renderMetricIcon(item.metricIcon)}
            <span>{item.metric}</span>
          </div>

          <span className="text-[11px] text-[#596960] font-normal">
            {item.tenure}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Top Header & Interactive Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8f7ee] border border-[#a7dfc1]/50 text-xs font-semibold text-[#087443] tracking-wide uppercase mb-3.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL CLIENT REVIEWS & SOCIAL PROOF</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-medium tracking-[-0.03em] text-[#101c19] leading-[1.15]">
            Loved by fast-moving agencies, design studios, and product leaders
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#596960] max-w-xl leading-relaxed">
            See how teams use Zendo to replace scattered apps, send proposals that win, and maintain a quiet, predictable delivery rhythm.
          </p>
        </div>

        {/* Controls: Pause / Speed / Filter */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Pause / Play Button */}
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-colors border ${
              isPaused
                ? 'bg-[#101c19] text-white border-[#101c19]'
                : 'bg-white text-[#101c19] border-[#e1e9e4] hover:bg-[#f5f9f7]'
            }`}
            title={isPaused ? 'Resume scrolling' : 'Pause scrolling'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Scroll' : 'Pause'}</span>
          </button>

          {/* Speed Toggle */}
          <div className="inline-flex items-center p-1 bg-white border border-[#e1e9e4] rounded-full text-xs font-medium">
            <button
              type="button"
              onClick={() => setSpeed('normal')}
              className={`px-3 py-1 rounded-full transition-colors ${
                speed === 'normal'
                  ? 'bg-[#101c19] text-white'
                  : 'text-[#596960] hover:text-[#101c19]'
              }`}
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => setSpeed('slow')}
              className={`px-3 py-1 rounded-full transition-colors ${
                speed === 'slow'
                  ? 'bg-[#101c19] text-white'
                  : 'text-[#596960] hover:text-[#101c19]'
              }`}
            >
              Calm Pace
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none text-xs">
        <span className="text-[#596960] font-medium mr-1 shrink-0">Filter:</span>
        {[
          { key: 'all', label: 'All Reviews (10)' },
          { key: 'studios', label: 'Agencies & Studios (4)' },
          { key: 'founders', label: 'Founders & Leadership (3)' },
          { key: 'product', label: 'Product & Engineering (3)' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedCategory(tab.key as typeof selectedCategory)}
            className={`px-3.5 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium cursor-pointer ${
              selectedCategory === tab.key
                ? 'bg-[#0c9256] text-white shadow-sm'
                : 'bg-white border border-[#e1e9e4] text-[#596960] hover:text-[#101c19] hover:bg-[#f5f9f7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Two Column Scrolling Review Window */}
      <div
        className="relative w-full h-[620px] sm:h-[680px] overflow-hidden rounded-[28px] border border-[#e1e9e4] bg-[#f8faf9] p-4 sm:p-6"
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 7%, black 93%, transparent 100%)',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-full items-start">
          {/* Column 1 Scrolling Up */}
          <div className="relative overflow-hidden h-full">
            <div
              className={`flex flex-col gap-4 sm:gap-6 ${col1AnimationClass} ${
                isPaused ? 'reviews-marquee-paused' : ''
              }`}
            >
              {col1Repeated.map((item, idx) => renderReviewCard(item, `col1-${idx}`))}
            </div>
          </div>

          {/* Column 2 Scrolling Up (Offset Speed) */}
          <div className="relative overflow-hidden h-full hidden md:block">
            <div
              className={`flex flex-col gap-4 sm:gap-6 ${col2AnimationClass} ${
                isPaused ? 'reviews-marquee-paused' : ''
              }`}
            >
              {col2Repeated.map((item, idx) => renderReviewCard(item, `col2-${idx}`))}
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Proof Summary Badges Below Reviews */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-[18px] p-4 border border-[#e1e9e4] text-center">
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#101c19]">4.9 / 5.0</p>
          <div className="flex items-center justify-center gap-1 my-1 text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-[11px] text-[#596960]">Average Client Satisfaction</p>
        </div>

        <div className="bg-white rounded-[18px] p-4 border border-[#e1e9e4] text-center">
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#0c9256]">1,200+</p>
          <p className="text-xs font-semibold text-[#101c19] mt-1">Active Workspaces</p>
          <p className="text-[11px] text-[#596960]">Agencies, studios & teams</p>
        </div>

        <div className="bg-white rounded-[18px] p-4 border border-[#e1e9e4] text-center">
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#101c19]">94%</p>
          <p className="text-xs font-semibold text-[#101c19] mt-1">Weekly Task Delivery</p>
          <p className="text-[11px] text-[#596960]">Average team completion</p>
        </div>

        <div className="bg-white rounded-[18px] p-4 border border-[#e1e9e4] text-center">
          <p className="text-xl sm:text-2xl font-bold tracking-tight text-[#0c9256]">&lt; 2 min</p>
          <p className="text-xs font-semibold text-[#101c19] mt-1">Daily Standup Routine</p>
          <p className="text-[11px] text-[#596960]">Zero status meetings needed</p>
        </div>
      </div>
    </div>
  );
}
