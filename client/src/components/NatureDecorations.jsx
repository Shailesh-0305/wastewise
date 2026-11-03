import React from 'react';

/**
 * Subtle botanical tree silhouettes for pale green background sections.
 * Blends gently into backgrounds without interfering with text or controls.
 */
export const ForestSilhouettes = ({ opacity = 0.12, height = 120, className = 'nature-tree-sway' }) => (
  <svg
    viewBox="0 0 800 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      bottom: 0,
      right: 0,
      height,
      width: 'auto',
      maxWidth: '65%',
      opacity,
      pointerEvents: 'none',
      zIndex: 0
    }}
    className={className}
    aria-hidden="true"
  >
    {/* Deciduous Tree 1 */}
    <path
      d="M680 160 L680 115 C665 110 650 95 650 75 C650 50 670 35 695 35 C720 35 740 50 740 75 C740 95 725 110 710 115 L710 160 Z"
      fill="#15803D"
    />
    {/* Pine Tree 1 */}
    <polygon points="560,160 600,160 580,100" fill="#166534" />
    <polygon points="550,110 610,110 580,65" fill="#166534" />
    <polygon points="560,70 600,70 580,30" fill="#15803D" />
    
    {/* Small decorative plant */}
    <path
      d="M625 160 Q630 135 640 130 Q635 145 632 160"
      stroke="#15803D"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M628 145 Q615 138 618 132 Q628 138 628 145"
      fill="#15803D"
    />

    {/* Pine Tree 2 (Taller, in background) */}
    <polygon points="460,160 510,160 485,85" fill="#15803D" opacity="0.8" />
    <polygon points="450,95 520,95 485,45" fill="#15803D" opacity="0.8" />
    <polygon points="465,55 505,55 485,15" fill="#166534" opacity="0.8" />

    {/* Gentle ground curve */}
    <path
      d="M400 160 Q550 148 800 152 L800 160 Z"
      fill="#166534"
      opacity="0.5"
    />
  </svg>
);

/**
 * Floating leaf accent for nature cards and headers.
 */
export const FloatingLeaf = ({ size = 28, top = 16, right = 16, rotate = 15, opacity = 0.22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top,
      right,
      transform: `rotate(${rotate}deg)`,
      opacity,
      pointerEvents: 'none',
      zIndex: 0
    }}
    className="nature-leaf-float"
    aria-hidden="true"
  >
    <path
      d="M42 6 C28 6 10 18 8 38 C28 36 40 18 42 6 Z"
      fill="#15803D"
    />
    <path
      d="M8 38 Q24 24 42 6"
      stroke="#EAF6EA"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M20 26 Q16 20 18 16"
      stroke="#EAF6EA"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M28 18 Q32 14 36 16"
      stroke="#EAF6EA"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Natural organic curve pattern for section dividers or cards.
 */
export const NaturalCurves = ({ opacity = 0.08 }) => (
  <svg
    viewBox="0 0 600 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: 60,
      opacity,
      pointerEvents: 'none'
    }}
    aria-hidden="true"
  >
    <path
      d="M0 30 Q150 5 300 35 T600 20 L600 0 L0 0 Z"
      fill="#166534"
    />
  </svg>
);
