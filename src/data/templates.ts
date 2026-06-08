/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Portfolio, PresetAsset } from '../types';

export const STOCK_ART_OPTIONS: PresetAsset[] = [
  {
    id: 'art-1',
    title: 'Surrealist Inversion',
    author: 'Codepen Raw 01',
    imageSrc: 'https://assets.codepen.io/573855/demo-raw-01.webp'
  },
  {
    id: 'art-2',
    title: 'Minimalist Rebellion',
    author: 'Codepen Raw 02',
    imageSrc: 'https://assets.codepen.io/573855/demo-raw-02.webp'
  },
  {
    id: 'art-3',
    title: 'Moo Walk',
    author: 'Codepen Raw 03',
    imageSrc: 'https://assets.codepen.io/573855/demo-raw-03.webp'
  },
  {
    id: 'art-4',
    title: 'Bad Art Reverse',
    author: 'Codepen Raw 04',
    imageSrc: 'https://assets.codepen.io/573855/demo-raw-04.webp'
  },
  {
    id: 'art-5',
    title: 'Nonsense Center',
    author: 'Codepen Raw 05',
    imageSrc: 'https://assets.codepen.io/573855/demo-raw-05.webp'
  },
  {
    id: 'art-6',
    title: 'Raw Super Monsters',
    author: 'Codepen Raw 06',
    imageSrc: 'https://assets.codepen.io/573855/demo-raw-06.webp'
  },
  {
    id: 'art-7',
    title: 'Fluid Gradient Wave',
    author: 'Joel Filipe',
    imageSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'art-8',
    title: 'Ethereal Geometry',
    author: 'Simeon Muller',
    imageSrc: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'art-9',
    title: 'Abstract Coral Flow',
    author: 'Pawel Czerwinski',
    imageSrc: 'https://images.unsplash.com/photo-1618005198143-e528346436f1?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'art-10',
    title: 'Surreal Bold Canvas',
    author: 'Steve Johnson',
    imageSrc: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'art-11',
    title: 'Vibrant Neon Splash',
    author: 'Lucas Benjamin',
    imageSrc: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'art-12',
    title: 'Psychedelic Echoes',
    author: 'Adrien Converse',
    imageSrc: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=800&q=85'
  }
];

export const TEMPLATES: Portfolio[] = [
  {
    id: 'reverse-creativity',
    name: 'Reverse Creativity',
    description: 'Luis Martinez design theme investigating what happens when you ask AI to break models and leave mistakes in place.',
    accentColor: 'crimson',
    fontPair: 'space-mono',
    theme: 'dark',
    showGridLines: true,
    cubeGlow: true,
    faces: [
      {
        faceName: 'DESCENT',
        tagline: 'Cube Gallery — Bad Art',
        title: 'WORK AGAINST THE MODEL',
        body: 'What happens when you ask AI to do the opposite of what it was built for? Break proportion. Flip symmetry. Leave the mistakes in place. Scroll to find out.',
        imageSrc: 'https://assets.codepen.io/573855/demo-raw-01.webp',
        stats: [
          { label: 'Exhibits', value: '1' },
          { label: 'Type', value: 'Solo' },
          { label: 'Origin', value: 'Web' }
        ],
        ctaText: 'Enter'
      },
      {
        faceName: 'REBELLION',
        tagline: '01 — Art Rebellion',
        title: 'FLIP THE PROMPT',
        body: 'A cow walking a monster instead of a monster walking a cow. That inversion is enough to break template thinking. The cape ends up on the wrong body.',
        imageSrc: 'https://assets.codepen.io/573855/demo-raw-02.webp',
        stats: [
          { label: 'Medium', value: 'Inverted' },
          { label: 'AI Error', value: 'Cape Match' },
          { label: 'Year', value: '2026' }
        ],
        ctaText: 'Turn'
      },
      {
        faceName: 'MOO WALK',
        tagline: '02 — Moo Walk',
        title: 'NEITHER LEADS',
        body: 'Clashing colors. No balance. A dance with no choreography. When the model works against itself something more genuine surfaces.',
        imageSrc: 'https://assets.codepen.io/573855/demo-raw-03.webp',
        stats: [
          { label: 'Contrast', value: 'High' },
          { label: 'Pacing', value: 'Ethereal' },
          { label: 'Grid', value: 'Offcenter' }
        ],
        ctaText: 'Turn'
      },
      {
        faceName: 'BAD ART',
        tagline: '03 — Bad Art',
        title: 'REVERSE CREATIVITY',
        body: 'AI is trained to polish and regularize. The harder direction is unlearning that. A television for a head is not an error. It is the point.',
        imageSrc: 'https://assets.codepen.io/573855/demo-raw-04.webp',
        stats: [
          { label: 'Works', value: '6' },
          { label: 'Degrees', value: '360' },
          { label: 'Objects', value: '1' }
        ],
        ctaText: 'Turn'
      },
      {
        faceName: 'NO RULES',
        tagline: '04 — No Rules',
        title: 'NONSENSE AT CENTER',
        body: 'Dada and the surrealists knew this. Put the absurd at the center and the edges stop pretending. Nine heads in the branches. The sun has a face and it approves.',
        imageSrc: 'https://assets.codepen.io/573855/demo-raw-05.webp',
        stats: [
          { label: 'Style', value: 'Dada' },
          { label: 'Surreal', value: '98%' },
          { label: 'System', value: 'Loose' }
        ],
        ctaText: 'Turn'
      },
      {
        faceName: 'SUPER',
        tagline: '05 — Super Monsters',
        title: 'RAW NOT POLISHED',
        body: 'Forward creativity takes a sketch and makes it real. This goes the other way. Imperfection left in place is closer to something honest.',
        imageSrc: 'https://assets.codepen.io/573855/demo-raw-06.webp',
        stats: [
          { label: 'Polishing', value: '0%' },
          { label: 'Honesty', value: 'Direct' },
          { label: 'Vibe', value: 'Monstrous' }
        ],
        ctaText: 'Begin Again'
      }
    ]
  },
  {
    id: 'ethereal-botanicals',
    name: 'Ethereal Botanicals',
    description: 'A study of digital nature and botanical abstract art, utilizing soothing emerald accents and serif-based fonts.',
    accentColor: 'emerald',
    fontPair: 'playfair-inter',
    theme: 'light',
    showGridLines: false,
    cubeGlow: true,
    faces: [
      {
        faceName: 'FLORA',
        tagline: 'Digital Greenhouse',
        title: 'SILENT GROWING ECHOES',
        body: 'In the digital greenhouse, growth is measured in operations per second. Flowers shape themselves based on mathematical fluid flows.',
        imageSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=85',
        stats: [
          { label: 'Species', value: 'Synth-Ivy' },
          { label: 'Resolution', value: '4K' },
          { label: 'Atmosphere', value: '95%' }
        ],
        ctaText: 'Step In'
      },
      {
        faceName: 'GEOMETRY',
        tagline: 'Study 01',
        title: 'PETALS AND ANGLES',
        body: 'Why should nature follow only soft curves? Here we explore the sharp angles of virtual chrysanthemums, rigid but floating.',
        imageSrc: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=85',
        stats: [
          { label: 'Angles', value: 'Aesthetic' },
          { label: 'Symmetry', value: '6-Fold' },
          { label: 'Shading', value: 'Glass' }
        ],
        ctaText: 'Turn'
      },
      {
        faceName: 'MUTATION',
        tagline: 'Study 02',
        title: 'LIQUID REPLICATOR',
        body: 'Colors that bleed, shapes that shift. Digital coral and orchid cells merge into a brand new genus of marine plant-life.',
        imageSrc: 'https://images.unsplash.com/photo-1618005198143-e528346436f1?auto=format&fit=crop&w=800&q=85',
        stats: [
          { label: 'Framerate', value: 'Adaptive' },
          { label: 'Color Space', value: 'P3' },
          { label: 'Growth', value: 'Exponential' }
        ],
        ctaText: 'Turn'
      },
      {
        faceName: 'SOIL',
        tagline: 'Study 03',
        title: 'FERTILE GROUNDWORK',
        body: 'Underneath the vibrant growth is the complex substrate that nourishes it. Generative noise acts as digital manure.',
        imageSrc: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=800&q=85',
        stats: [
          { label: 'Depth', value: 'Over 9000' },
          { label: 'Contrast', value: 'Stark' },
          { label: 'Texture', value: 'Coarse' }
        ],
        ctaText: 'Turn'
      },
      {
        faceName: 'HARVEST',
        tagline: 'Study 04',
        title: 'GATHERING CHIPS',
        body: 'Picking the best generative iterations. A garden requires heavy pruning to strip away the algorithmic noise and showcase the clear vision.',
        imageSrc: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=85',
        stats: [
          { label: 'Prunes', value: '124' },
          { label: 'Selected', value: '6' },
          { label: 'Harvest', value: 'Autumnal' }
        ],
        ctaText: 'Turn'
      },
      {
        faceName: 'SPORES',
        tagline: 'Study 05',
        title: 'DISPERSAL STAGE',
        body: 'Releasing code packages into the global registry. Seeds find purchase in other servers, sprouting new galleries across the nodes.',
        imageSrc: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=800&q=85',
        stats: [
          { label: 'Reach', value: 'Global' },
          { label: 'Seeds', value: 'Inf' },
          { label: 'Ecosystem', value: 'Active' }
        ],
        ctaText: 'Regrow'
      }
    ]
  }
];
