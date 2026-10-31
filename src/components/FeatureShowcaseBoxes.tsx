import React from 'react';
import { motion } from 'motion/react';
import { ZENDO_COPY } from '../data/zendoCopy';
import { CheckCircle2, Clock, Zap } from 'lucide-react';

interface FeatureShowcaseBoxesProps {
  copyMode: 'zendo' | 'metrivello';
  onInspectFeature?: (index: number) => void;
}

export const FeatureShowcaseBoxes: React.FC<FeatureShowcaseBoxesProps> = ({
  copyMode,
  onInspectFeature,
}) => {
  const cards = [
    {
      index: 0,
      type: 'bars' as const,
      pillText: copyMode === 'metrivello' ? '↗ 14.6% revenue' : '↗ 10× faster',
      bars: [36, 46, 41, 56, 51, 66, 61, 80, 84, 98],
      bigStat: copyMode === 'metrivello' ? '4.20x' : '10× faster',
      statLabel:
        copyMode === 'metrivello' ? 'PAID-MEDIA ROAS' : 'AI PROPOSAL DRAFTING',
      title:
        copyMode === 'metrivello'
          ? 'See the whole marketing picture.'
          : ZENDO_COPY.featuresSection.items[0].title.endsWith('.')
          ? ZENDO_COPY.featuresSection.items[0].title
          : `${ZENDO_COPY.featuresSection.items[0].title}.`,
      description:
        copyMode === 'metrivello'
          ? 'Bring spend, leads, and attributed revenue into one shared view.'
          : ZENDO_COPY.featuresSection.items[0].description,
      staggerClass: '',
    },
    {
      index: 1,
      type: 'line' as const,
      miniLabel: copyMode === 'metrivello' ? 'COST PER LEAD' : 'PERSONALIZED PROPOSALS',
      miniValue: copyMode === 'metrivello' ? '$38.75' : 'Tailored scope',
      badgeText: 'Signal detected',
      linePoints: '8,64 32,60 56,54 80,58 104,44 128,50 152,38 176,46 200,22 224,25 248,6 268,14 288,4',
      dotX: 288,
      dotY: 4,
      bigStat: copyMode === 'metrivello' ? '+20.6%' : 'Made for every client',
      statLabel:
        copyMode === 'metrivello' ? 'META ADS CPL' : 'PERSONALIZED PROPOSALS',
      title:
        copyMode === 'metrivello'
          ? 'Catch changes worth a closer look.'
          : ZENDO_COPY.featuresSection.items[1].title.endsWith('.')
          ? ZENDO_COPY.featuresSection.items[1].title
          : `${ZENDO_COPY.featuresSection.items[1].title}.`,
      description:
        copyMode === 'metrivello'
          ? 'Spot unusual movement and decide what to investigate.'
          : ZENDO_COPY.featuresSection.items[1].description,
      staggerClass: 'lg:mt-10',
    },
    {
      index: 2,
      type: 'milestones' as const,
      pillText: 'Active pipeline',
      milestones: [
        { label: 'Proposal sent to Acme Corp', time: 'Viewed 2h ago', done: true },
        { label: 'AI follow-up drafted', time: 'Scheduled 9:00 AM', done: true },
        { label: 'Client signature & deposit', time: 'Awaiting approval', done: false },
      ],
      bigStat: 'Never lose an opportunity',
      statLabel: 'PROPOSAL FOLLOW-UP',
      title:
        ZENDO_COPY.featuresSection.items[2].title.endsWith('.')
          ? ZENDO_COPY.featuresSection.items[2].title
          : `${ZENDO_COPY.featuresSection.items[2].title}.`,
      description: ZENDO_COPY.featuresSection.items[2].description,
      staggerClass: 'lg:mt-20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 items-start">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{
            duration: 0.48,
            delay: idx * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
          onClick={() => onInspectFeature?.(idx)}
          className={`${card.staggerClass} group bg-white rounded-[28px] sm:rounded-[32px] p-3.5 sm:p-4 pb-7 sm:pb-8 border border-[#e3ede7] shadow-[0_4px_24px_rgba(16,28,25,0.03)] hover:shadow-[0_12px_36px_rgba(16,28,25,0.07)] transition-all cursor-pointer`}
        >
          {/* INNER MINT-GREEN ROUNDED GRAPHIC BOX */}
          <div className="rounded-[20px] sm:rounded-[22px] bg-gradient-to-b from-[#d5efe1] via-[#e3f5ec] to-[#eff9f4] px-5 sm:px-6 pt-6 pb-7 flex flex-col justify-between min-h-[320px] sm:min-h-[340px]">
            {card.type === 'bars' ? (
              /* STYLE A: RISING GREEN GRADIENT BARS + FLOATING PILL */
              <div className="relative pt-3 pb-2">
                <div className="absolute right-0 top-0 z-10 bg-white rounded-full px-3.5 py-1.5 shadow-[0_2px_10px_rgba(16,28,25,0.06)] inline-flex items-center gap-1">
                  <span className="text-[11px] font-medium text-[#157f50] tracking-[-0.01em]">
                    {card.pillText}
                  </span>
                </div>

                <div className="relative h-[138px] flex items-end gap-2 sm:gap-2.5 pt-6 px-1">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-6 bottom-0 flex flex-col justify-between"
                  >
                    <div className="border-b border-[#0c9256]/[0.07] w-full" />
                    <div className="border-b border-[#0c9256]/[0.07] w-full" />
                    <div className="border-b border-[#0c9256]/[0.07] w-full" />
                    <div className="border-b border-[#0c9256]/[0.07] w-full" />
                  </div>

                  {card.bars?.map((h, barIdx) => (
                    <div
                      key={barIdx}
                      style={{ height: `${h}%` }}
                      className="relative z-1 flex-1 rounded-t-[6px] bg-gradient-to-b from-[#17a566] via-[#34c179] to-[#8ee59b] transition-transform duration-300 group-hover:scale-y-[1.03] origin-bottom"
                    />
                  ))}
                </div>
              </div>
            ) : card.type === 'line' ? (
              /* STYLE B: WHITE FLOATING LINE-CHART CARD */
              <div className="bg-white rounded-[18px] p-4 sm:p-5 shadow-[0_4px_18px_rgba(16,28,25,0.04)] space-y-2">
                <div>
                  <p className="text-[9px] font-medium tracking-[0.08em] uppercase text-[#596960]">
                    {card.miniLabel}
                  </p>
                  <p className="text-[22px] sm:text-[24px] font-normal tracking-[-0.03em] text-[#101c19] mt-0.5 leading-none">
                    {card.miniValue}
                  </p>
                </div>

                <div className="relative pt-2 pb-1">
                  <svg
                    viewBox="0 0 296 72"
                    className="w-full h-[64px] overflow-visible"
                    aria-label={card.miniLabel}
                  >
                    <line
                      x1="4"
                      y1="50"
                      x2="292"
                      y2="50"
                      stroke="#d6e3dd"
                      strokeWidth="1.2"
                      strokeDasharray="3.5 3.5"
                    />
                    <polyline
                      fill="none"
                      stroke="#0c9256"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={card.linePoints}
                    />
                    <circle
                      cx={card.dotX}
                      cy={card.dotY}
                      r="4.2"
                      fill="#f19a4c"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              /* STYLE C: WHITE MILESTONE / FOLLOW-UP PROGRESS CARD */
              <div className="bg-white rounded-[18px] p-4 sm:p-5 shadow-[0_4px_18px_rgba(16,28,25,0.04)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8f7ee] text-[#087443] text-[10px] font-semibold">
                    <Zap className="w-3 h-3" />
                    <span>Active Follow-up Queue</span>
                  </div>
                  <span className="text-[10px] text-[#596960] font-medium">Real-time</span>
                </div>

                <div className="space-y-2 pt-1">
                  {card.milestones?.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf9f5] border border-[#e1e9e4] text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            m.done ? 'bg-[#0c9256] text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {m.done ? '✓' : '•'}
                        </div>
                        <span className="font-semibold text-[#101c19]">{m.label}</span>
                      </div>
                      <span className="text-[10px] text-[#596960]">{m.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Stat & Copy */}
            <div className="pt-6">
              <div className="mb-2">
                <span className="text-2xl sm:text-[28px] font-normal tracking-[-0.03em] text-[#101c19] block leading-none mb-1">
                  {card.bigStat}
                </span>
                <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#157f50]">
                  {card.statLabel}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-medium text-[#101c19] tracking-[-0.02em] mb-1.5 leading-snug">
                {card.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-[#596960] leading-relaxed font-normal">
                {card.description}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
