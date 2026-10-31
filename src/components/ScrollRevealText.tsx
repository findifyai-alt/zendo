import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  delay?: number;
  highlightWords?: string[];
  serifWords?: string[];
}

export const ScrollRevealText: React.FC<ScrollRevealTextProps> = ({
  text,
  as: Component = 'h2',
  className = '',
  delay = 0,
  highlightWords = [],
  serifWords = [],
}) => {
  const words = text.split(' ');

  return (
    <Component className={className} aria-label={text}>
      {words.map((word, index) => {
        const cleanWord = word.replace(/[.,—!?]/g, '').toLowerCase();
        const isHighlighted = highlightWords.some(
          (hw) => hw.toLowerCase() === cleanWord
        );
        const isSerif = serifWords.some((sw) => sw.toLowerCase() === cleanWord);

        return (
          <React.Fragment key={`${word}-${index}`}>
            <motion.span
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{
                duration: 0.42,
                delay: delay + index * 0.035,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`inline-block ${
                isHighlighted ? 'text-[#0c9256]' : ''
              } ${
                isSerif
                  ? 'font-serif-editorial italic font-normal tracking-normal px-0.5'
                  : ''
              }`}
            >
              {word}
            </motion.span>
            {index < words.length - 1 && ' '}
          </React.Fragment>
        );
      })}
    </Component>
  );
};
