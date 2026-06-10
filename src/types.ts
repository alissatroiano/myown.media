/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FaceConfig {
  faceName: string;    // e.g., "DESCENT", "REBELLION"
  tagline: string;     // e.g., "01 — Art Rebellion"
  title: string;       // e.g., "FLIP THE PROMPT" (can contain HTML or newlines, we can render with linebreaks)
  body: string;        // Description text
  imageSrc: string;    // base64, object URL, or absolute web URL
  stats: {
    label: string;
    value: string;
  }[];
  ctaText?: string;    // Button text (e.g., "Turn", "Enter")
}

export type FontPair = 'bebas-mono' | 'space-mono' | 'playfair-inter' | 'inter-sans';

export type AccentColor = 'amber' | 'emerald' | 'azure' | 'crimson' | 'violet' | 'monochrome';

export interface SocialHandles {
  instagram?: string;
  twitter?: string;
  website?: string;
  github?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  accentColor: AccentColor;
  fontPair: FontPair;
  theme: 'dark' | 'light';
  showGridLines: boolean;
  cubeGlow: boolean;
  faces: FaceConfig[];
  layoutMode?: 'split' | 'bento' | 'brutalist';
  socials?: SocialHandles;
  userId?: string;
  ownerEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PresetAsset {
  id: string;
  title: string;
  author: string;
  imageSrc: string;
}
