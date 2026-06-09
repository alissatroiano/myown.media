/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Portfolio, FaceConfig } from '../types';
import { Sun, Moon, ArrowRight, ArrowLeft, Settings, Share2, HelpCircle } from 'lucide-react';

interface CubeExhibitionProps {
  portfolio: Portfolio;
  isReadOnly?: boolean;
  onOpenStudio?: () => void;
  onToggleTheme?: () => void;
}

export function faceAtStop(i: number, N: number): number {
  if (i < 6) return i;
  return 1 + ((i - 2) % 4);
}

export function buildStops(n: number) {
  const base = [
    { rx: 90, ry: 0 },     // 0: Top
    { rx: 0, ry: 0 },      // 1: Front
    { rx: 0, ry: -90 },    // 2: Right
    { rx: 0, ry: -180 },   // 3: Back
    { rx: 0, ry: -270 },   // 4: Left
    { rx: -90, ry: -360 }  // 5: Bottom
  ];
  if (n <= 6) {
    return base.slice(0, n);
  }
  const out = [...base];
  for (let i = 6; i < n; i++) {
    out.push({ rx: 0, ry: -360 - (i - 6) * 90 });
  }
  return out;
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

export default function CubeExhibition({
  portfolio,
  isReadOnly = false,
  onOpenStudio,
  onToggleTheme
}: CubeExhibitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // HUD and active state refs for direct DOM updates (high-performance 60fps)
  const hudPctRef = useRef<HTMLDivElement>(null);
  const progFillRef = useRef<HTMLDivElement>(null);
  const sceneNameRef = useRef<HTMLDivElement>(null);
  const captionNumRef = useRef<HTMLDivElement>(null);
  const captionNameRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  // React state for low-frequency changes (mostly tracking visible section to apply staggered fades)
  const [activeFaceIdx, setActiveFaceIdx] = useState(0);
  const [visibleCards, setVisibleCards] = useState<boolean[]>([true, false, false, false, false, false]);

  // Keep visibleCards synced dynamically with portfolio.faces.length
  useEffect(() => {
    setVisibleCards((prev) => {
      const len = portfolio.faces.length;
      const next = Array(len).fill(false);
      for (let i = 0; i < Math.min(prev.length, len); i++) {
        next[i] = prev[i];
      }
      if (next.length > 0 && !next.some(v => v)) {
        next[0] = true;
      }
      return next;
    });
  }, [portfolio.faces.length]);

  // Map 6 physical faces to dynamic portfolios slide indexes
  const [mappedIndices, setMappedIndices] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const mappedIndicesRef = useRef<number[]>([0, 1, 2, 3, 4, 5]);

  // Set initial mapping of slide indices for physical faces on N change
  useEffect(() => {
    const N = portfolio.faces.length;
    const initialMapped = Array.from({ length: 6 }, (_, f) => {
      let bestCandidate = -1;
      let minDiff = Infinity;
      for (let k = 0; k < N; k++) {
        if (faceAtStop(k, N) === f) {
          const diff = Math.abs(k - 0); // s = 0 initially
          if (diff < minDiff) {
            minDiff = diff;
            bestCandidate = k;
          }
        }
      }
      return bestCandidate;
    });
    mappedIndicesRef.current = initialMapped;
    setMappedIndices(initialMapped);
  }, [portfolio.faces.length]);

  const activeFaceConfigRef = useRef<number>(0);
  const maxScrollRef = useRef<number>(1);
  const targetScrollProgressRef = useRef<number>(0);
  const smoothScrollProgressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isSelfScrollingRef = useRef<boolean>(false);
  const anchorAnimationRef = useRef<number | null>(null);

  // Listen to attributes on root element for accent, font and theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', portfolio.theme);
    document.documentElement.setAttribute('data-font', portfolio.fontPair);
    document.documentElement.setAttribute('data-accent', portfolio.accentColor);
    document.documentElement.style.colorScheme = portfolio.theme;
  }, [portfolio.theme, portfolio.fontPair, portfolio.accentColor]);

  // Recalculate dimensions
  const layoutCalculations = () => {
    const docHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    maxScrollRef.current = Math.max(1, docHeight - viewportHeight);
  };

  // Scroll smooth to dynamic Y
  const smoothScrollToY = (targetY: number, duration: number = 850) => {
    if (anchorAnimationRef.current) {
      cancelAnimationFrame(anchorAnimationRef.current);
    }
    isSelfScrollingRef.current = true;
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeInOutCubic(progress);
      
      const nextY = startY + difference * easedProgress;
      window.scrollTo(0, nextY);

      if (progress < 1) {
        anchorAnimationRef.current = requestAnimationFrame(tick);
      } else {
        anchorAnimationRef.current = null;
        isSelfScrollingRef.current = false;
      }
    };
    anchorAnimationRef.current = requestAnimationFrame(tick);
  };

  const handleDotClick = (e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
    e.preventDefault();
    const sections = document.querySelectorAll('.gallery-section');
    if (sections[index]) {
      const rect = sections[index].getBoundingClientRect();
      const targetY = rect.top + window.scrollY;
      smoothScrollToY(targetY);
    }
  };

  const currentFace = portfolio.faces[activeFaceIdx] || portfolio.faces[0];

  useEffect(() => {
    layoutCalculations();

    const onScroll = () => {
      if (maxScrollRef.current <= 0) return;
      const currentScroll = window.scrollY;
      targetScrollProgressRef.current = Math.max(0, Math.min(1, currentScroll / maxScrollRef.current));
    };

    const onResize = () => {
      layoutCalculations();
      onScroll();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Initial setup
    onScroll();

    // IntersectionObserver for text-cards staggered entry
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idStr = entry.target.getAttribute('id');
        if (idStr && idStr.startsWith('s')) {
          const index = parseInt(idStr.substring(1), 10);
          if (entry.isIntersecting) {
            setVisibleCards((prev) => {
              const updated = [...prev];
              updated[index] = true;
              return updated;
            });
          }
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.gallery-section');
    sections.forEach((section) => cardObserver.observe(section));

    // Animation frames for 3D physics / inertia loop
    const renderFrame = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      // Exponential smoothing for buttery visual transformation
      smoothScrollProgressRef.current += (targetScrollProgressRef.current - smoothScrollProgressRef.current) * (1 - Math.exp(-deltaTime * 7.5));
      const s = Math.max(0, Math.min(1, smoothScrollProgressRef.current));

      // 1. Progress HUD Update
      const percentage = Math.round(s * 100);
      if (hudPctRef.current) {
        hudPctRef.current.textContent = `${String(percentage).padStart(3, '0')}%`;
      }
      if (progFillRef.current) {
        progFillRef.current.style.width = `${percentage}%`;
      }

      // 2. Linear interpolate 3D coordinates based on active stop bands
      const N = portfolio.faces.length;
      if (cubeRef.current && N >= 2) {
        const totalTracks = N - 1;
        const currentZoneFloat = s * totalTracks;
        const stopIndex = Math.min(Math.floor(currentZoneFloat), totalTracks - 1);
        const subProgress = currentZoneFloat - stopIndex;
        const easedTransition = easeIO(subProgress);

        const stops = buildStops(N);
        const aStop = stops[stopIndex] || stops[0];
        const bStop = stops[stopIndex + 1] || stops[1];

        const rx = aStop.rx + (bStop.rx - aStop.rx) * easedTransition;
        const ry = aStop.ry + (bStop.ry - aStop.ry) * easedTransition;

        cubeRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      }

      // 3. Dynamic physical face to slide index mapping calculations on the fly
      const nextMapped = Array.from({ length: 6 }, (_, f) => {
        let bestCandidate = -1;
        let minDiff = Infinity;
        for (let k = 0; k < N; k++) {
          if (faceAtStop(k, N) === f) {
            const diff = Math.abs(k - (s * (N - 1)));
            if (diff < minDiff) {
              minDiff = diff;
              bestCandidate = k;
            }
          }
        }
        return bestCandidate;
      });
      const isMappedChanged = nextMapped.some((val, idx) => val !== mappedIndicesRef.current[idx]);
      if (isMappedChanged) {
        mappedIndicesRef.current = nextMapped;
        setMappedIndices(nextMapped);
      }

      // 4. Update active indices and static headings precisely on zone crossing
      const activeIdx = Math.max(0, Math.min(Math.floor((s * N) + 0.5), N - 1));
      if (activeIdx !== activeFaceConfigRef.current) {
        activeFaceConfigRef.current = activeIdx;
        setActiveFaceIdx(activeIdx);

        // Update direct DOM captions and side dot states quickly
        const activeName = portfolio.faces[activeIdx]?.faceName || 'TITLE';
        if (sceneNameRef.current) sceneNameRef.current.textContent = activeName;
        if (captionNameRef.current) captionNameRef.current.textContent = activeName;
        if (captionNumRef.current) captionNumRef.current.textContent = String(activeIdx + 1).padStart(2, '0');

        // Toggle dot focus css classes
        if (dotsRef.current) {
          const dots = dotsRef.current.querySelectorAll('.scene-dot');
          dots.forEach((dot, idx) => {
            if (idx === activeIdx) {
              dot.classList.add('active');
            } else {
              dot.classList.remove('active');
            }
          });
        }
      }

      requestAnimationFrame(renderFrame);
    };

    const frameId = requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      if (anchorAnimationRef.current) {
        cancelAnimationFrame(anchorAnimationRef.current);
      }
      cardObserver.disconnect();
    };
  }, [portfolio.faces]);

  // Touch triggers stop animation
  const handleUserInteract = () => {
    if (anchorAnimationRef.current) {
      cancelAnimationFrame(anchorAnimationRef.current);
      anchorAnimationRef.current = null;
    }
    isSelfScrollingRef.current = false;
  };

  const layoutMode = portfolio.layoutMode || 'split';
  const isLight = portfolio.theme === 'light';

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleUserInteract}
      onTouchStart={handleUserInteract}
      className={`relative w-full min-h-screen layout-mode-${layoutMode}`}
    >
      {/* Brutalist technical viewfinders */}
      {layoutMode === 'brutalist' && (
        <>
          <div className="crosshair crosshair-tl" />
          <div className="crosshair crosshair-tr" />
          <div className="crosshair crosshair-bl" />
          <div className="crosshair crosshair-br" />
        </>
      )}

      {/* 3D Scene viewport (Fixed back layer) */}
      <div id="scene" aria-hidden="true" className="select-none">
        <div 
          ref={cubeRef} 
          id="cube"
          style={{ transform: `rotateX(90deg) rotateY(0deg)` }}
          className={portfolio.cubeGlow ? "cube-glow-active" : ""}
        >
          {mappedIndices.map((slideIdx, f) => {
            const positions = ["top", "front", "right", "back", "left", "bottom"];
            const facePos = positions[f] || "front";
            const slide = slideIdx !== -1 ? portfolio.faces[slideIdx] : null;
            return (
              <div 
                key={f} 
                className="face" 
                data-face={facePos}
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                }}
              >
                {portfolio.showGridLines && <div className="face-grid-lines" />}
                {slide && slide.imageSrc ? (
                  <img 
                    src={slide.imageSrc} 
                    alt={slide.faceName} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover select-none pointer-events-none" 
                  />
                ) : (
                  <div className="face-placeholder">
                    <span className="face-ph">{slide ? slide.faceName : facePos.toUpperCase()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating HUD Overlays */}
      <div id="hud" className="fixed top-8 right-8 z-20 text-right pointer-events-none select-none">
        <div ref={hudPctRef} className="hud-label font-bold text-xs">000%</div>
        <div className="progress-bar w-24 h-[1px] bg-neutral-700 dark:bg-neutral-800 relative overflow-hidden mt-1 ml-auto">
          <div ref={progFillRef} className="absolute inset-y-0 left-0 w-0 bg-[var(--accent)] transition-all duration-75" />
        </div>
        <div ref={sceneNameRef} className="hud-accent-text tracking-widest text-[10px] mt-2 font-medium">
          {portfolio.faces[0]?.faceName || 'DESCENT'}
        </div>
      </div>

      {/* Side dots navigator */}
      <div 
        ref={dotsRef} 
        id="scene_strip" 
        className="fixed left-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-3"
      >
        {portfolio.faces.map((f, i) => (
          <a
            key={i}
            href={`#s${i}`}
            onClick={(e) => handleDotClick(e, i)}
            className={`scene-dot w-1.5 h-1.5 rounded-full select-none cursor-pointer transition-all duration-300 block bg-neutral-500 hover:bg-[var(--accent)] ${i === 0 ? 'active' : ''}`}
            title={f.faceName}
            aria-label={`Go to section ${i + 1}: ${f.faceName}`}
          />
        ))}
      </div>

      {/* Theme selector at bottom left */}
      <button 
        id="theme_toggle"
        onClick={onToggleTheme}
        className={`fixed bottom-8 left-8 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
          isLight
            ? 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-neutral-200'
            : 'bg-neutral-900 border-neutral-800/80 text-[var(--accent)] hover:bg-neutral-800'
        }`}
        title="Toggle contrast modes"
        aria-label="Toggle light/dark mode"
      >
        {isLight ? (
          <Moon className="w-4 h-4 text-neutral-800" />
        ) : (
          <Sun className="w-4 h-4 text-[var(--accent)]" />
        )}
      </button>

      {/* Bottom Center Dynamic Slide Descriptor caption and title */}
      <div id="face_caption" className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none select-none hidden sm:block">
        <div ref={captionNumRef} className="caption-num font-mono text-[9px] tracking-widest">01</div>
        <div ref={captionNameRef} className="caption-name font-sans">
          {portfolio.faces[0]?.faceName || 'DESCENT'}
        </div>
      </div>

      {/* Credit anchor or Studio Toggle */}
      <div id="credit" className="fixed right-8 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-90 origin-right-center z-10 hidden lg:block uppercase font-mono tracking-widest text-[9px]">
        <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>myown.media gallery exhibition / </span>
        <span className="text-[var(--accent)] font-medium">{portfolio.name}</span>
      </div>

      {/* Responsive floating top bar / logo / action triggers */}
      <header className="fixed top-6 left-8 z-30 flex items-center gap-4 select-none">
        <div className="flex flex-col gap-[2px]">
          <h1 className={`font-mono text-xs tracking-widest font-bold flex items-center gap-2 ${
            isLight ? 'text-neutral-900' : 'text-neutral-100'
          }`}>
            myown.media
            <span className="inline-block w-[8px] h-[8px] rounded-full bg-gradient-to-tr from-[#ff3e00] to-[#ffbe00] shadow-[0_0_12px_rgba(255,62,0,0.85)] animate-pulse" />
          </h1>
          <span className={`font-mono text-[9px] tracking-wider ${
            isLight ? 'text-neutral-600' : 'text-neutral-400'
          }`}>
            {portfolio.name}
          </span>
        </div>

        {!isReadOnly && onOpenStudio && (
          <button
            onClick={onOpenStudio}
            className={`flex items-center gap-1.5 py-1 px-3 border text-[10px] tracking-wider rounded font-mono uppercase transition cursor-pointer shadow-md ${
              isLight 
                ? 'bg-neutral-100 border-neutral-300 text-neutral-800 hover:bg-neutral-200 hover:border-[var(--accent)]' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:border-[var(--accent)]'
            }`}
          >
            <Settings className="w-3 h-3 text-[var(--accent)] animate-spin-slow" />
            <span>Studio Panel</span>
          </button>
        )}
      </header>

      {/* Vertical Scrolling Containers */}
      <div ref={scrollContainerRef} id="scroll_container" className="relative z-10 flex flex-col">
        {portfolio.faces.map((f, i) => {
          const isCardRight = i % 2 !== 0; // alternates alignment for artistic rhythms
          const isVisible = visibleCards[i];

          return (
            <section 
              key={i} 
              id={`s${i}`}
              className="gallery-section min-h-screen flex items-center justify-start outline-none"
            >
              <div className={`w-full flex items-stretch gap-2 ${isCardRight ? 'justify-end ml-auto' : 'justify-start'}`}>
                
                {/* Left Brutalist Coordinate strip */}
                {layoutMode === 'brutalist' && !isCardRight && (
                  <div className="hidden sm:flex flex-col items-center justify-center border-l border-y border-neutral-800/60 px-2 text-center bg-neutral-950/20 py-4 select-none">
                    <span className="brutalist-rail">[ SYS.0x{i} // EXH.{i*8 + 12} ]</span>
                  </div>
                )}

                <div 
                  className={`text-card select-text ${isCardRight ? 'card-right' : ''} ${
                    i === 0 ? 'max-w-[27rem]' : ''
                  }`}
                >
                  {layoutMode !== 'bento' ? (
                    /* NORMAL AND CINEMATIC SPLIT / BRUTALIST PARTITION STRUCTURE */
                    <>
                      {i > 0 && layoutMode === 'split' && (
                        <div className={`h-line-init ${isVisible ? 'h-line-active' : ''}`} />
                      )}

                      <div className={`tag reveal-init ${isVisible ? 'reveal-active' : ''} text-[10px] uppercase font-mono tracking-widest text-[var(--accent)] mb-3`}>
                        {f.tagline || `${String(i).padStart(2, '0')} — Art Series`}
                      </div>

                      <h2 className={`card-title reveal-init ${isVisible ? 'reveal-active' : ''} uppercase tracking-tight leading-none ${
                        i === 0 ? 'large' : ''
                      }`}>
                        {f.title ? f.title.split('\n').map((line, lIdx) => (
                          <React.Fragment key={lIdx}>
                            {line}
                            <br />
                          </React.Fragment>
                        )) : 'EXHIBITION'}
                      </h2>

                      <p className={`body-text reveal-init ${isVisible ? 'reveal-active' : ''} mt-4`}>
                        {f.body || 'No description available for this face catalog design.'}
                      </p>

                      {/* Face stats row */}
                      {f.stats && f.stats.length > 0 && (
                        <div className={`stat-row reveal-init ${isVisible ? 'reveal-active' : ''} flex gap-8 flex-wrap mt-6 mb-2 ${
                          isCardRight ? 'justify-end' : 'justify-start'
                        }`}>
                          {f.stats.map((st, sIdx) => {
                            if (!st.label && !st.value) return null;
                            return (
                              <div key={sIdx} className="stat flex flex-col">
                                <span className="stat-num font-sans text-2xl font-normal text-[var(--accent)] select-all leading-none">{st.value || '-'}</span>
                                <span className="stat-label mt-0.5">{st.label || 'Metric'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Multi-directional step guides */}
                      <div className={`cta-row reveal-init ${isVisible ? 'reveal-active' : ''} flex items-center gap-3 mt-6 ${
                        isCardRight ? 'justify-end' : 'justify-start'
                      }`}>
                        {i > 0 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const sections = document.querySelectorAll('.gallery-section');
                              const prevSection = sections[i - 1];
                              if (prevSection) {
                                smoothScrollToY(prevSection.getBoundingClientRect().top + window.scrollY);
                              }
                            }}
                            className="cta-back-button pr-3 py-2 text-[10px]"
                            aria-label="Back to previous face"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const sections = document.querySelectorAll('.gallery-section');
                            const nextIndex = (i + 1) % portfolio.faces.length;
                            const nextSection = sections[nextIndex];
                            if (nextSection) {
                              smoothScrollToY(nextSection.getBoundingClientRect().top + window.scrollY);
                            }
                          }}
                          className="cta-button py-2 px-4 text-[10px]"
                          aria-label={i === portfolio.faces.length - 1 ? "Loop back to start" : "Proceed to next slide"}
                        >
                          <span>{f.ctaText || (i === portfolio.faces.length - 1 ? 'Begin Again' : 'Turn')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* BENTO GLASS MODULAR STRUCTURE */
                    <div className="flex flex-col text-left">
                      {/* Bento Box Part 1: Header */}
                      <div className="bento-partition">
                        <div className={`tag reveal-init ${isVisible ? 'reveal-active' : ''} text-[10px] uppercase font-mono tracking-widest text-[var(--accent)] mb-2`}>
                          {f.tagline || `${String(i).padStart(2, '0')} — Art Series`}
                        </div>
                        <h2 className={`card-title reveal-init ${isVisible ? 'reveal-active' : ''} uppercase tracking-tight leading-none ${
                          i === 0 ? 'large' : ''
                        }`}>
                          {f.title ? f.title.split('\n').map((line, lIdx) => (
                            <React.Fragment key={lIdx}>
                              {line}
                              <br />
                            </React.Fragment>
                          )) : 'EXHIBITION'}
                        </h2>
                      </div>

                      {/* Bento Box Part 2: Body text description */}
                      <div className="bento-partition">
                        <p className={`body-text reveal-init ${isVisible ? 'reveal-active' : ''}`}>
                          {f.body || 'No description available for this face catalog design.'}
                        </p>
                      </div>

                      {/* Bento Box Part 3: Stats Grid */}
                      {f.stats && f.stats.length > 0 && (
                        <div className={`bento-stats-grid reveal-init ${isVisible ? 'reveal-active' : ''}`}>
                          {f.stats.map((st, sIdx) => {
                            if (!st.label && !st.value) return null;
                            return (
                              <div key={sIdx} className="bento-stat-block flex flex-col justify-center">
                                <span className="stat-num font-sans text-xl font-normal text-[var(--accent)] select-all leading-none">{st.value || '-'}</span>
                                <span className="stat-label mt-1">{st.label || 'Metric'}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Bento Box Part 4: CTA sliders */}
                      <div className="bento-partition bento-partition-last flex items-center gap-2 justify-between">
                        {i > 0 ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const sections = document.querySelectorAll('.gallery-section');
                              const prevSection = sections[i - 1];
                              if (prevSection) {
                                smoothScrollToY(prevSection.getBoundingClientRect().top + window.scrollY);
                              }
                            }}
                            className="px-3 py-1.5 border border-dashed border-neutral-700/60 hover:border-neutral-500 text-neutral-400 hover:text-white rounded font-mono text-[9px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition"
                            aria-label="Back to previous face"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Back</span>
                          </button>
                        ) : (
                          <div className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest pl-1">Exhibit Init</div>
                        )}

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            const sections = document.querySelectorAll('.gallery-section');
                            const nextIndex = (i + 1) % portfolio.faces.length;
                            const nextSection = sections[nextIndex];
                            if (nextSection) {
                              smoothScrollToY(nextSection.getBoundingClientRect().top + window.scrollY);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-[var(--accent)] text-neutral-950 font-bold rounded font-mono text-[9px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-100 transition shadow"
                          aria-label={i === portfolio.faces.length - 1 ? "Loop back to start" : "Proceed to next slide"}
                        >
                          <span>{f.ctaText || (i === portfolio.faces.length - 1 ? 'Begin Again' : 'Turn')}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Brutalist Coordinate strip */}
                {layoutMode === 'brutalist' && isCardRight && (
                  <div className="hidden sm:flex flex-col items-center justify-center border-r border-y border-neutral-800/60 px-2 text-center bg-neutral-950/20 py-4 select-none">
                    <span className="brutalist-rail">[ SYS.0x{i} // EXH.{i*8 + 12} ]</span>
                  </div>
                )}

              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
