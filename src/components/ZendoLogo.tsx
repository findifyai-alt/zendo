import React from 'react';

interface ZendoLogoProps {
  className?: string;
  color?: string;
  size?: number;
}

const TOP_HALF_PATH = `
  M 17.2 36.2
  L 29.5 36.2
  Q 31.6 36.2 33.1 34.7
  L 47.2 20.6
  Q 48.8 19.0 51.2 19.0
  L 62.2 19.0
  Q 66.2 19.0 66.2 23.0
  L 66.2 32.2
  Q 66.2 36.2 70.2 36.2
  L 83.4 36.2
  Q 86.8 36.2 86.8 39.2
  Q 86.8 40.8 85.5 42.1
  L 76.8 50.8
  Q 75.4 52.2 73.4 52.2
  L 55.2 52.2
  Q 52.8 52.2 52.8 50.1
  Q 52.8 48.9 53.9 47.8
  L 63.6 38.1
  Q 64.7 37.0 64.4 35.6
  Q 64.1 34.4 62.4 34.4
  L 48.6 34.4
  Q 46.6 34.4 45.1 35.9
  L 30.6 50.4
  Q 29.0 52.0 26.8 52.0
  L 17.2 52.0
  Q 13.5 52.0 13.5 48.3
  L 13.5 39.9
  Q 13.5 36.2 17.2 36.2
  Z
`;

export const ZendoLogo: React.FC<ZendoLogoProps> = ({
  className = 'w-8 h-8',
  color = 'currentColor',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={size ? undefined : className}
      aria-hidden="true"
    >
      {/* Top Geometric Z-Ribbon */}
      <path d={TOP_HALF_PATH} fill={color} />
      {/* Bottom Geometric Z-Ribbon (Exact 180-degree Rotational Symmetry) */}
      <path d={TOP_HALF_PATH} fill={color} transform="rotate(180 50 50)" />
    </svg>
  );
};
