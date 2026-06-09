/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Portfolio, AccentColor, FontPair } from './types';
import { TEMPLATES } from './data/templates';
import CubeExhibition from './components/CubeExhibition';
import CreatorStudio from './components/CreatorStudio';
import { Palette, ExternalLink, HelpCircle, Check, BookOpen, Layers, Sparkles, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

const LOCAL_STORAGE_KEY_PREFIX = 'myown-media-portfolio-';
const PORTFOLIO_INDEX_KEY = 'myown-media-index';

// Decode custom state from URL hash
const parseUrlExhibit = (): Portfolio | null => {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#exhibit=')) return null;
    const base64Str = hash.split('#exhibit=')[1];
    if (!base64Str) return null;

    const decodedStr = decodeURIComponent(escape(window.atob(base64Str)));
    const s = JSON.parse(decodedStr);
    
    // Safely structure and return inflated portfolio
    const inflated: Portfolio = {
      id: `shared-${Date.now()}`,
      name: s.n || 'Shared Exhibit',
      description: s.d || '',
      accentColor: (s.a as AccentColor) || 'crimson',
      fontPair: (s.f as FontPair) || 'space-mono',
      theme: s.t || 'dark',
      showGridLines: s.g !== undefined ? s.g : true,
      cubeGlow: s.w !== undefined ? s.w : true,
      layoutMode: s.lm || 'split',
      faces: (s.fc || []).map((face: any, i: number) => ({
        faceName: face.fn || `FACE ${i + 1}`,
        tagline: face.tl || '',
        title: face.ti || '',
        body: face.bd || '',
        imageSrc: face.is || '',
        stats: (face.st || []).map((pair: any) => ({
          label: pair[0] || '',
          value: pair[1] || ''
        })),
        ctaText: face.ct || 'Turn'
      }))
    };
    return inflated;
  } catch (err) {
    console.error("Failed to decode compressed sharing URL:", err);
    return null;
  }
};

export default function App() {
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // QR mobile sharing state
  const [showQr, setShowQr] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  // Stored showcases index { id: string, name: string }[]
  const [savedPortfolios, setSavedPortfolios] = useState<{ id: string; name: string }[]>([]);

  // System setup or state recovery
  useEffect(() => {
    // 1. Check if the URL has an embedded exhibit hash
    const sharedExhibit = parseUrlExhibit();
    if (sharedExhibit) {
      setActivePortfolio(sharedExhibit);
      setIsReadOnly(true);
      setIsStudioOpen(false); // Default to viewing when shared
      return;
    }

    // 2. Fetch local saved index if none encoded in hash
    try {
      const storedIndexStr = localStorage.getItem(PORTFOLIO_INDEX_KEY);
      let portfolioList: { id: string; name: string }[] = [];
      if (storedIndexStr) {
        portfolioList = JSON.parse(storedIndexStr);
        setSavedPortfolios(portfolioList);
      }

      if (portfolioList.length > 0) {
        // Load the first saved or recently modified portfolio
        const targetId = portfolioList[0].id;
        const targetDataStr = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + targetId);
        if (targetDataStr) {
          setActivePortfolio(JSON.parse(targetDataStr));
          return;
        }
      }
    } catch (e) {
      console.warn("Retrying initialization default space...", e);
    }

    // 3. Fallback: Load the standard Luis Martinez "Reverse Creativity" template
    const defaultTemplate = TEMPLATES[0];
    const initialClone: Portfolio = {
      ...defaultTemplate,
      id: 'default-creativity'
    };
    setActivePortfolio(initialClone);
    
    // Save to local storage right away to initialize index
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + initialClone.id, JSON.stringify(initialClone));
      const freshList = [{ id: initialClone.id, name: initialClone.name }];
      localStorage.setItem(PORTFOLIO_INDEX_KEY, JSON.stringify(freshList));
      setSavedPortfolios(freshList);
    } catch {}
  }, []);

  // Listen to hash change to support dynamic router mapping
  useEffect(() => {
    const handleHashChange = () => {
      const shared = parseUrlExhibit();
      if (shared) {
        setActivePortfolio(shared);
        setIsReadOnly(true);
        setIsStudioOpen(false);
      } else {
        // If they cleared hash, restore their local database portfolios
        setIsReadOnly(false);
        try {
          const indexStr = localStorage.getItem(PORTFOLIO_INDEX_KEY);
          if (indexStr) {
            const list = JSON.parse(indexStr);
            if (list.length > 0) {
              const targetStr = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + list[0].id);
              if (targetStr) {
                setActivePortfolio(JSON.parse(targetStr));
                setSavedPortfolios(list);
              }
            }
          }
        } catch {}
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Escape key toggle shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isReadOnly) {
          setIsStudioOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadOnly]);

  // Dynamic high-contrast QR code generation for the shared URL hash
  useEffect(() => {
    if (!isReadOnly || !activePortfolio) return;

    const generateQr = async () => {
      try {
        // High-contrast clean styling to guarantee rapid camera focus on all phones
        const url = await QRCode.toDataURL(window.location.href, {
          color: {
            dark: '#18181b', // Zn 900
            light: '#ffffff' // Pure White
          },
          margin: 1.5,
          width: 260,
          errorCorrectionLevel: 'M'
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to generate exhibition QR link:', err);
      }
    };

    generateQr();
  }, [isReadOnly, activePortfolio]);

  // Update active state and write incrementally to storage
  const handleUpdatePortfolio = (updated: Portfolio) => {
    setActivePortfolio(updated);
    if (!isReadOnly) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + updated.id, JSON.stringify(updated));
        
        // Sync name in index as well if it changed
        const currentList = [...savedPortfolios];
        const matchIdx = currentList.findIndex(item => item.id === updated.id);
        if (matchIdx !== -1 && currentList[matchIdx].name !== updated.name) {
          currentList[matchIdx].name = updated.name;
          localStorage.setItem(PORTFOLIO_INDEX_KEY, JSON.stringify(currentList));
          setSavedPortfolios(currentList);
        }
      } catch (err) {
        console.error("Local storage sync error:", err);
      }
    }
  };

  // Create or load presets from library lists
  const handleLoadPortfolio = (id: string) => {
    try {
      const dataStr = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + id);
      if (dataStr) {
        setActivePortfolio(JSON.parse(dataStr));
      }
    } catch {}
  };

  const handleSaveNewPortfolio = (name: string) => {
    if (!activePortfolio) return;
    const newId = `exhibit-${Date.now()}`;
    const newRecord: Portfolio = {
      ...activePortfolio,
      id: newId,
      name: name
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + newId, JSON.stringify(newRecord));
      const newList = [{ id: newId, name: name }, ...savedPortfolios];
      localStorage.setItem(PORTFOLIO_INDEX_KEY, JSON.stringify(newList));
      setSavedPortfolios(newList);
      setActivePortfolio(newRecord);
    } catch {}
  };

  const handleDeletePortfolio = (id: string) => {
    // If they delete what's currently active, we swap to another first
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + id);
      const filteredList = savedPortfolios.filter(item => item.id !== id);
      localStorage.setItem(PORTFOLIO_INDEX_KEY, JSON.stringify(filteredList));
      setSavedPortfolios(filteredList);
      
      if (activePortfolio?.id === id) {
        if (filteredList.length > 0) {
          handleLoadPortfolio(filteredList[0].id);
        } else {
          // If deleted last element, restore Luis Martinez preset
          const fresh = {
            ...TEMPLATES[0],
            id: 'default-creativity'
          };
          localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + fresh.id, JSON.stringify(fresh));
          const restoredIndex = [{ id: fresh.id, name: fresh.name }];
          localStorage.setItem(PORTFOLIO_INDEX_KEY, JSON.stringify(restoredIndex));
          setSavedPortfolios(restoredIndex);
          setActivePortfolio(fresh);
        }
      }
    } catch {}
  };

  // Instantly take an encoded read-only exhibit, and copy it to creator database space
  const handleCloneSharedToLocal = () => {
    if (!activePortfolio) return;
    const cloneId = `exhibit-${Date.now()}`;
    const clonedRecord: Portfolio = {
      ...activePortfolio,
      id: cloneId,
      name: `${activePortfolio.name} (Clone)`
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + cloneId, JSON.stringify(clonedRecord));
      const storedIndexStr = localStorage.getItem(PORTFOLIO_INDEX_KEY);
      let list = [];
      if (storedIndexStr) {
        list = JSON.parse(storedIndexStr);
      }
      list = [{ id: cloneId, name: clonedRecord.name }, ...list];
      localStorage.setItem(PORTFOLIO_INDEX_KEY, JSON.stringify(list));
      
      setSavedPortfolios(list);
      setIsReadOnly(false);
      setActivePortfolio(clonedRecord);
      setIsStudioOpen(true); // Open the studio directly for their new clone!
      window.location.hash = ''; // Clear shared hash parameters
    } catch {
      alert("Failed to clone space. Local storage index might be full!");
    }
  };

  const handleToggleTheme = () => {
    if (!activePortfolio) return;
    handleUpdatePortfolio({
      ...activePortfolio,
      theme: activePortfolio.theme === 'light' ? 'dark' : 'light'
    });
  };

  if (!activePortfolio) {
    return (
      <div className="w-full h-screen bg-neutral-950 font-mono text-neutral-400 flex flex-col items-center justify-center select-none">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-800 border-t-[var(--accent)] animate-spin-slow mb-3" />
        <span className="text-xs tracking-wider">loading myown.media active matrices...</span>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen relative overflow-hidden selection:bg-[var(--accent)] selection:text-neutral-950">
      
      {/* 3D Exhibition Stage */}
      <CubeExhibition 
        portfolio={activePortfolio}
        isReadOnly={isReadOnly}
        onOpenStudio={() => setIsStudioOpen(!isStudioOpen)}
        onToggleTheme={handleToggleTheme}
      />

      {/* Guest QR Code scan popover */}
      {isReadOnly && showQr && (
        <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:bottom-[96px] sm:right-6 z-30 sm:w-64 bg-neutral-950/95 border border-neutral-800 p-4 rounded-lg backdrop-blur-md shadow-2xl animate-slide-up-fade font-mono flex flex-col items-center">
          <div className="text-center mb-3">
            <span className="text-[var(--accent)] font-semibold text-[10px] tracking-wider uppercase block select-none">Exhibition QR Code</span>
            <span className="text-[8.5px] text-neutral-400 leading-normal block mt-1 select-none">Scan with your phone camera to transition this 3D gallery to mobile seamlessly</span>
          </div>
          
          <div 
            className="p-2 bg-white rounded-md flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-[1.02]"
            style={{ border: `3px solid var(--accent)` }}
          >
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Exhibition mobile access QR code" 
                className="w-36 h-36 select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-36 h-36 bg-neutral-900 animate-pulse flex items-center justify-center text-[10px] text-neutral-500">
                generating...
              </div>
            )}
          </div>
          
          <div className="mt-3 flex items-center gap-1.5 text-[8.5px] text-neutral-500 border-t border-neutral-800/60 pt-2.5 w-full justify-center select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Exhibition ready for camera scan</span>
          </div>
        </div>
      )}

      {/* Guest/Preview banner if visiting via sharing hash */}
      {isReadOnly && (
        <div className="fixed top-20 left-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto z-30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-sm sm:max-w-none bg-neutral-950/90 border border-neutral-800 p-3.5 rounded-lg backdrop-blur-md shadow-2xl animate-bounce-subtle select-none">
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-neutral-300">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
            <span>Viewing as guest /</span>
            <span className="text-[var(--accent)] font-semibold uppercase">{activePortfolio.name}</span>
          </div>
          
          <div className="flex gap-1.5 justify-end">
            <button
              onClick={() => setShowQr(prev => !prev)}
              className={`py-1.5 px-3 rounded font-mono text-[10px] uppercase tracking-wider transition duration-250 cursor-pointer flex items-center gap-1.5 border whitespace-nowrap ${
                showQr 
                  ? 'bg-[var(--accent)] text-neutral-950 border-[var(--accent)] font-bold' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
              }`}
              title="Toggle Mobile QR Scan code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQr ? 'Hide QR' : 'Mobile QR'}</span>
            </button>
            <button
              onClick={handleCloneSharedToLocal}
              className="py-1.5 px-3 bg-[var(--accent)] text-neutral-950 rounded font-mono text-[10px] uppercase font-bold tracking-wider hover:scale-[1.02] shadow transition cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Clone & Edit</span>
            </button>
            <button
              onClick={() => {
                window.location.hash = ''; // Navigates client to their editing workspace
              }}
              className="py-1.5 px-3 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded font-mono text-[10px] uppercase tracking-wider hover:bg-neutral-800 transition cursor-pointer"
            >
              My Workspace
            </button>
          </div>
        </div>
      )}

      {/* Studio configuration drawer panel */}
      {isStudioOpen && !isReadOnly && (
        <CreatorStudio
          portfolio={activePortfolio}
          onUpdatePortfolio={handleUpdatePortfolio}
          onClose={() => setIsStudioOpen(false)}
          savedPortfolios={savedPortfolios}
          onLoadPortfolio={handleLoadPortfolio}
          onSaveNewPortfolio={handleSaveNewPortfolio}
          onDeletePortfolio={handleDeletePortfolio}
        />
      )}

      {/* Background overlay grid lines matching Luis Martinez design aesthetic */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 select-none opacity-20 dark:opacity-40 transition-opacity"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, var(--muted) 1px, transparent 0),
            linear-gradient(to right, rgba(255,255,255,0.01) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.01) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px, 120px 120px, 120px 120px'
        }}
      />
    </main>
  );
}
