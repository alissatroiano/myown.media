/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Portfolio, FaceConfig, AccentColor, FontPair } from '../types';
import { STOCK_ART_OPTIONS, TEMPLATES } from '../data/templates';
import { 
  X, Plus, RefreshCw, Layers, Check, Copy, Share2, Palette, Type, Upload, Link, 
  Trash2, Sliders, ChevronDown, Sparkles, AlertCircle, FileText, Globe, Grid, Columns 
} from 'lucide-react';
import { User } from 'firebase/auth';

interface CreatorStudioProps {
  portfolio: Portfolio;
  onUpdatePortfolio: (p: Portfolio) => void;
  onClose: () => void;
  savedPortfolios: { id: string; name: string }[];
  onLoadPortfolio: (id: string) => void;
  onSaveNewPortfolio: (name: string) => void;
  onDeletePortfolio: (id: string) => void;
  walkthroughTab?: 'faces' | 'styling' | 'library' | 'share';
  currentUser: User | null;
  isAuthLoading: boolean;
  cloudPortfolios: Portfolio[];
  isCloudLoading: boolean;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  onSaveToCloud: () => Promise<void>;
  onCloudDelete: (id: string) => Promise<void>;
}

export default function CreatorStudio({
  portfolio,
  onUpdatePortfolio,
  onClose,
  savedPortfolios,
  onLoadPortfolio,
  onSaveNewPortfolio,
  onDeletePortfolio,
  walkthroughTab,
  currentUser,
  isAuthLoading,
  cloudPortfolios,
  isCloudLoading,
  onGoogleSignIn,
  onSignOut,
  onSaveToCloud,
  onCloudDelete
}: CreatorStudioProps) {
  const [activeTab, setActiveTab] = useState<'faces' | 'styling' | 'library' | 'share'>('faces');

  // Keep tab in sync with walkthrough steps
  React.useEffect(() => {
    if (walkthroughTab) {
      setActiveTab(walkthroughTab);
    }
  }, [walkthroughTab]);
  const [activeFaceIdx, setActiveFaceIdx] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [assetSelectorOpen, setAssetSelectorOpen] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('url');
  const [imageUrlBuffer, setImageUrlBuffer] = useState('');
  const [compressionLoading, setCompressionLoading] = useState(false);

  const activeFace = portfolio.faces[activeFaceIdx] || portfolio.faces[0];

  const handleUpdateFaceField = (field: keyof FaceConfig, value: any) => {
    const updatedFaces = [...portfolio.faces];
    updatedFaces[activeFaceIdx] = {
      ...updatedFaces[activeFaceIdx],
      [field]: value
    };
    onUpdatePortfolio({
      ...portfolio,
      faces: updatedFaces
    });
  };

  const handleUpdateFaceStat = (statIndex: number, field: 'label' | 'value', value: string) => {
    const updatedFaces = [...portfolio.faces];
    const updatedStats = [...updatedFaces[activeFaceIdx].stats];
    updatedStats[statIndex] = {
      ...updatedStats[statIndex],
      [field]: value
    };
    updatedFaces[activeFaceIdx] = {
      ...updatedFaces[activeFaceIdx],
      stats: updatedStats
    };
    onUpdatePortfolio({
      ...portfolio,
      faces: updatedFaces
    });
  };

  // Safe image helper with high performance canvas resize
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressionLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const srcStr = event.target?.result as string;
      
      // Client-side resizing and compression to prevent localStorage overflow
      const img = new Image();
      img.src = srcStr;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 550;
        const MAX_HEIGHT = 550;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedResult = canvas.toDataURL('image/jpeg', 0.8);
          handleUpdateFaceField('imageSrc', compressedResult);
        } else {
          handleUpdateFaceField('imageSrc', srcStr);
        }
        setCompressionLoading(false);
      };
      img.onerror = () => {
        setCompressionLoading(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSavePortfolioBtn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;
    onSaveNewPortfolio(newPortfolioName.trim());
    setNewPortfolioName('');
  };

  // Encode the complete current portfolio into compressed base64 URI parameter
  const getShareableLink = () => {
    // If portfolio is backed up to Cloud, prefer the crisp and compact cloud query parameter link!
    if (portfolio.userId) {
      return `${window.location.origin}${window.location.pathname}?id=${portfolio.id}`;
    }
    try {
      const miniState = {
        n: portfolio.name,
        d: portfolio.description,
        a: portfolio.accentColor,
        f: portfolio.fontPair,
        t: portfolio.theme,
        g: portfolio.showGridLines,
        w: portfolio.cubeGlow,
        lm: portfolio.layoutMode || 'split',
        soc: portfolio.socials ? {
          ig: portfolio.socials.instagram || '',
          tw: portfolio.socials.twitter || '',
          wb: portfolio.socials.website || '',
          gh: portfolio.socials.github || ''
        } : undefined,
        fc: portfolio.faces.map(face => ({
          fn: face.faceName,
          tl: face.tagline,
          ti: face.title,
          bd: face.body,
          is: face.imageSrc,
          st: face.stats.map(s => [s.label, s.value]),
          ct: face.ctaText
        }))
      };
      const jsonStr = JSON.stringify(miniState);
      const encoded = window.btoa(unescape(encodeURIComponent(jsonStr)));
      
      const appBaseUrl = window.location.origin + window.location.pathname;
      return `${appBaseUrl}#exhibit=${encoded}`;
    } catch {
      return window.location.href;
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.warn('Fallback copy failed:', err);
    }
  };

  const handleCopyLink = () => {
    const link = getShareableLink();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        })
        .catch(() => {
          fallbackCopy(link);
        });
    } else {
      fallbackCopy(link);
    }
  };

  const fontConfigNames: { id: FontPair; label: string; desc: string }[] = [
    { id: 'bebas-mono', label: 'Bebas Neue & DM Mono', desc: 'Sleek structural design. Ideal for modern, conceptual portfolios.' },
    { id: 'space-mono', label: 'Space Grotesk & JetBrains Mono', desc: 'Clean, technical look. Perfect for product, tech, or generative designers.' },
    { id: 'playfair-inter', label: 'Playfair Display & Inter', desc: 'Editorial elegance. Timeless aesthetic for photography and visual art.' },
    { id: 'inter-sans', label: 'Inter Sans-Serif Minimalist', desc: 'Stark, highly architectural design focusing purely on core artwork layout.' }
  ];

  const accents: { id: AccentColor; colorClass: string; name: string }[] = [
    { id: 'amber', colorClass: 'bg-amber-500', name: 'Amber Gold' },
    { id: 'emerald', colorClass: 'bg-emerald-600', name: 'Emerald Forest' },
    { id: 'azure', colorClass: 'bg-sky-500', name: 'Azure Tide' },
    { id: 'crimson', colorClass: 'bg-rose-600', name: 'Crimson Fire' },
    { id: 'violet', colorClass: 'bg-purple-500', name: 'Orchid Dream' },
    { id: 'monochrome', colorClass: 'bg-neutral-400 dark:bg-neutral-100', name: 'Stark Accent' }
  ];

  const getFacePositionName = (idx: number) => {
    const baseNames = ['TOP FACE', 'FRONT FACE', 'RIGHT FACE', 'BACK FACE', 'LEFT FACE', 'BOTTOM FACE'];
    if (idx < 6) return baseNames[idx];
    return `ADDITIONAL FACE ${idx - 5}`;
  };

  const handleAddFace = () => {
    const newIdx = portfolio.faces.length;
    const newFace: FaceConfig = {
      faceName: `SERIES 0${newIdx + 1}`,
      tagline: `${String(newIdx + 1).padStart(2, '0')} — New Series`,
      title: 'NEW ARTWORK',
      body: 'narrative description for this face canvas.',
      imageSrc: '',
      stats: [
        { label: 'Year', value: String(new Date().getFullYear()) },
        { label: 'Medium', value: 'Creative AI' },
        { label: 'Asset ID', value: `0${newIdx + 1}` }
      ],
      ctaText: 'Turn'
    };
    onUpdatePortfolio({
      ...portfolio,
      faces: [...portfolio.faces, newFace]
    });
    setActiveFaceIdx(newIdx);
  };

  const handleDeleteFace = (idxToDelete: number) => {
    if (portfolio.faces.length <= 4) {
      alert('Keep at least 4 exhibition slides to preserve the 3D rotating balance!');
      return;
    }
    const updatedFaces = portfolio.faces.filter((_, idx) => idx !== idxToDelete);
    onUpdatePortfolio({
      ...portfolio,
      faces: updatedFaces
    });
    setActiveFaceIdx((prev) => {
      if (prev >= updatedFaces.length) {
        return updatedFaces.length - 1;
      }
      return prev;
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-neutral-950 text-neutral-100 border-l border-neutral-800 z-50 flex flex-col shadow-2xl overflow-hidden studio-scrollbar">
      {/* Top Header */}
      <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/40">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="font-mono text-xs font-bold tracking-widest uppercase">Creator Studio</h2>
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-1.5 py-0.5 rounded font-mono">beta</span>
        </div>
        <button 
          id="studio_close"
          onClick={onClose}
          className="p-1 px-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-100 transition cursor-pointer"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Setup Info Banner */}
      <div className="px-6 py-3.5 bg-neutral-900 border-b border-neutral-800/60 flex items-center gap-3 select-none">
        <FileText className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
        <div className="text-[11px] leading-snug text-neutral-400 font-mono">
          Configure dynamic exhibition slides mapped seamlessly to your rotating 3D canvas. Updates live.
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-neutral-800 text-xs font-mono">
        <button 
          id="studio_tab_faces"
          onClick={() => { setActiveTab('faces'); setAssetSelectorOpen(false); }}
          className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${activeTab === 'faces' ? 'border-[var(--accent)] text-[var(--accent)] bg-neutral-900/30' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
        >
          Faces ({portfolio.faces.length})
        </button>
        <button 
          id="studio_tab_styling"
          onClick={() => { setActiveTab('styling'); setAssetSelectorOpen(false); }}
          className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${activeTab === 'styling' ? 'border-[var(--accent)] text-[var(--accent)] bg-neutral-900/30' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
        >
          Styling
        </button>
        <button 
          id="studio_tab_library"
          onClick={() => { setActiveTab('library'); setAssetSelectorOpen(false); }}
          className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${activeTab === 'library' ? 'border-[var(--accent)] text-[var(--accent)] bg-neutral-900/30' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
        >
          Exhibits
        </button>
        <button 
          id="studio_tab_share"
          onClick={() => { setActiveTab('share'); setAssetSelectorOpen(false); }}
          className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${activeTab === 'share' ? 'border-[var(--accent)] text-[var(--accent)] bg-neutral-900/30' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
        >
          Publish
        </button>
      </div>

      {/* Main Form Scroller */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 studio-scrollbar">

        {/* Tab 1: Faces Customization */}
        {activeTab === 'faces' && (
          <div className="space-y-6">
            
            {/* 3D Cube Face Index Selector Grid */}
            <div className="space-y-2">
              <label className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span>Select active face to edit</span>
                <span className="text-[9px] text-neutral-500 font-mono lowercase">{portfolio.faces.length} slide dynamic layout</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2 max-h-[155px] overflow-y-auto pr-1 studio-scrollbar">
                {portfolio.faces.map((f, idx) => {
                  const isCur = activeFaceIdx === idx;
                  const label = String(idx + 1).padStart(2, '0');
                  const name = getFacePositionName(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveFaceIdx(idx);
                        setAssetSelectorOpen(false);
                      }}
                      className={`p-3 text-left rounded border transition cursor-pointer flex flex-col font-mono text-[11px] ${
                        isCur 
                          ? 'bg-neutral-900 border-[var(--accent)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30' 
                          : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700/80 hover:text-neutral-200'
                      }`}
                    >
                      <span className={`text-[9px] ${isCur ? 'text-[var(--accent)] font-bold' : 'text-neutral-500'}`}>{label}</span>
                      <span className="font-semibold tracking-wider truncate mb-1">{name}</span>
                      <span className="text-[9px] font-light text-neutral-500 truncate">
                        {f?.faceName || 'UNTITLED'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Add & Delete Slide action tools */}
              <div className="flex gap-2 pt-1 pb-1">
                <button
                  type="button"
                  onClick={handleAddFace}
                  className="flex-1 py-1 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-[var(--accent)] text-neutral-200 hover:text-white font-medium rounded text-[10.5px] font-mono uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Add Art Frame</span>
                </button>
                
                {portfolio.faces.length > 4 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteFace(activeFaceIdx)}
                    className="py-1 px-3 bg-neutral-900 hover:bg-red-950/20 border border-neutral-800 hover:border-red-950/55 text-neutral-450 hover:text-red-400 rounded text-[10.5px] font-mono uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Delete current artwork slide"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Delete Slide</span>
                  </button>
                )}
              </div>
            </div>

            {/* Individual Face properties card */}
            <div className="p-4 rounded border border-neutral-800 bg-neutral-900/30 space-y-4">
              <h3 className="font-sans font-medium text-xs text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800/60 pb-2 mb-2 select-none">
                <Sliders className="w-3.5 h-3.5" />
                <span>Editing Art Frame 0{activeFaceIdx + 1}: {getFacePositionName(activeFaceIdx)}</span>
              </h3>

              {/* Face Title Mapping */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                  Face Tag (Scroll label)
                </label>
                <input 
                  type="text" 
                  value={activeFace.faceName}
                  onChange={(e) => handleUpdateFaceField('faceName', e.target.value.toUpperCase())}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                  placeholder="e.g. REBELLION"
                />
              </div>

              {/* Artwork Image Picker */}
              <div className="space-y-2">
                <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 flex justify-between items-center">
                  <span>Artwork Image</span>
                  <span className="text-[9px] lowercase text-neutral-500 font-mono">JPG, PNG or Unsplash preset</span>
                </label>

                {/* Picture selector options preview */}
                <div className="flex gap-3 items-center">
                  <div className="w-16 h-16 rounded border border-neutral-800 overflow-hidden bg-neutral-950 flex-shrink-0 flex items-center justify-center">
                    {activeFace.imageSrc ? (
                      <img 
                        src={activeFace.imageSrc} 
                        alt="Preview face" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-[9px] text-neutral-600 font-mono uppercase">None</span>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setAssetSelectorOpen(!assetSelectorOpen)}
                        className="flex-1 py-1.5 px-2 bg-neutral-900 border border-neutral-800 rounded text-[10.5px] tracking-wider uppercase hover:bg-neutral-800 hover:border-neutral-700 text-neutral-200 transition cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                      >
                        <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                        <span>Curated Lib</span>
                      </button>
                      
                      <label className="flex-1 py-1.5 px-2 bg-neutral-900 border border-neutral-800 rounded text-[10.5px] tracking-wider uppercase hover:bg-neutral-800 hover:border-neutral-700 text-neutral-200 transition cursor-pointer flex items-center justify-center gap-1.5 font-mono text-center">
                        <Upload className="w-3 h-3 text-neutral-400" />
                        <span>{compressionLoading ? 'Compres...' : 'Upload'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setImageInputMode(imageInputMode === 'url' ? 'file' : 'url');
                          setAssetSelectorOpen(false);
                        }}
                        className="p-1 px-1.5 rounded text-[10px] text-neutral-500 hover:text-neutral-300 font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <Link className="w-3 h-3" />
                        <span>Toggle Image Link input</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Image Link input */}
                {imageInputMode === 'url' && (
                  <div className="pt-1.5 flex gap-1.5">
                    <input 
                      type="url"
                      value={activeFace.imageSrc || ''}
                      onChange={(e) => handleUpdateFaceField('imageSrc', e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-[11px] focus:outline-none focus:border-[var(--accent)]"
                      placeholder="Paste high-res secure image URL"
                    />
                    {activeFace.imageSrc && (
                      <button 
                        onClick={() => handleUpdateFaceField('imageSrc', '')}
                        className="p-2 border border-rose-950 text-rose-500 bg-rose-950/20 rounded hover:bg-rose-900/30 transition cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Curated Pre-baked Studio Art List */}
                {assetSelectorOpen && (
                  <div className="p-3 border border-neutral-800/80 bg-neutral-950 rounded mt-2 space-y-3 animation-fade">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Click to apply curated masterpiece</span>
                      </h4>
                      <button 
                        onClick={() => setAssetSelectorOpen(false)}
                        className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        Hide
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1.5 max-h-[175px] overflow-y-auto pr-1 studio-scrollbar">
                      {STOCK_ART_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            handleUpdateFaceField('imageSrc', opt.imageSrc);
                            setAssetSelectorOpen(false);
                          }}
                          className="group relative h-12 rounded border border-neutral-800/80 overflow-hidden hover:border-[var(--accent)] transition cursor-pointer"
                          title={`${opt.title} by ${opt.author}`}
                        >
                          <img 
                            src={opt.imageSrc} 
                            alt={opt.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <span className="text-[8px] font-mono leading-none bg-neutral-950/90 text-[var(--accent)] p-0.5 px-1 rounded uppercase truncate max-w-[90%]">
                              Apply
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Taglines */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                      Card Tagline
                    </label>
                    <input 
                      type="text" 
                      value={activeFace.tagline}
                      onChange={(e) => handleUpdateFaceField('tagline', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                      placeholder="e.g. 01 — Modern Rebellion"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 flex justify-between items-center">
                      <span>Card Display Title</span>
                      <span className="text-[8.5px] lowercase text-neutral-500">Insert linebreaks manually</span>
                    </label>
                    <textarea 
                      value={activeFace.title}
                      onChange={(e) => handleUpdateFaceField('title', e.target.value)}
                      rows={2}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)] leading-relaxed resize-none"
                      placeholder="FLIP THE&#10;PROMPT"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                    Card Narrative Body (Up to 220 chars)
                  </label>
                  <textarea 
                    value={activeFace.body}
                    onChange={(e) => handleUpdateFaceField('body', e.target.value)}
                    rows={4}
                    maxLength={320}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)] leading-relaxed"
                    placeholder="Describe this artwork, series theme or methodology..."
                  />
                </div>
              </div>

              {/* Card stats properties panel */}
              <div className="space-y-2 border-t border-neutral-800/50 pt-3">
                <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400 flex items-center justify-between select-none">
                  <span>Artwork Stats / Metadata Group (Up to 3)</span>
                  <span className="text-[9px] text-neutral-500 font-mono lowercase">labels and values</span>
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  {activeFace.stats.map((s, idx) => (
                    <div key={idx} className="p-2 bg-neutral-950/50 rounded border border-neutral-800 space-y-1.5">
                      <div className="text-[8.5px] font-mono text-neutral-500 uppercase tracking-wider font-bold">
                        Stat #{idx + 1}
                      </div>
                      <input 
                        type="text"
                        value={s.value}
                        onChange={(e) => handleUpdateFaceStat(idx, 'value', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-[10px] font-mono text-center text-[var(--accent)] placeholder-neutral-700"
                        placeholder="Value (e.g. 2026)"
                      />
                      <input 
                        type="text"
                        value={s.label}
                        onChange={(e) => handleUpdateFaceStat(idx, 'label', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[8.5px] font-mono text-center text-neutral-400 placeholder-neutral-700"
                        placeholder="Label"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation button configuration overlay */}
              <div className="grid grid-cols-1 gap-2 pt-1 border-t border-neutral-800/30">
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                    Exhibition Action CTA text
                  </label>
                  <input 
                    type="text" 
                    value={activeFace.ctaText || ''}
                    onChange={(e) => handleUpdateFaceField('ctaText', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                    placeholder="e.g. Turn / Step In"
                  />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Core Styling settings */}
        {activeTab === 'styling' && (
          <div className="space-y-6">

            {/* Accent Color Palettes */}
            <div className="space-y-2.5">
              <label className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-400 flex justify-between select-none">
                <span>Branding Accent Color</span>
                <span className="text-[9px] text-neutral-500">Affects key labels, buttons & lines</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {accents.map((acc) => {
                  const isCur = portfolio.accentColor === acc.id;
                  return (
                    <button
                      key={acc.id}
                      id={`accent-btn-${acc.id}`}
                      onClick={() => onUpdatePortfolio({ ...portfolio, accentColor: acc.id })}
                      className={`p-2.5 rounded border text-left flex items-center gap-2 transition cursor-pointer ${
                        isCur 
                          ? 'bg-neutral-900 border-[var(--accent)] text-white' 
                          : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${acc.colorClass} border border-black/30`} />
                      <span className="font-mono text-[10.5px] truncate">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Pairing list config */}
            <div className="space-y-3">
              <label className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-400 select-none block">
                Typography Selection
              </label>
              
              <div className="space-y-2">
                {fontConfigNames.map((pair) => {
                  const isCur = portfolio.fontPair === pair.id;
                  return (
                    <button
                      key={pair.id}
                      onClick={() => onUpdatePortfolio({ ...portfolio, fontPair: pair.id })}
                      className={`w-full p-4 rounded border text-left transition cursor-pointer flex flex-col gap-1 ${
                        isCur 
                          ? 'bg-neutral-900 border-[var(--accent)]' 
                          : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`font-mono text-xs font-semibold tracking-wide ${isCur ? 'text-[var(--accent)]' : 'text-neutral-100'}`}>
                          {pair.label}
                        </span>
                        {isCur && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                      </div>
                      <p className="text-[10px] leading-relaxed text-neutral-500 font-mono mt-0.5">
                        {pair.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Artwork Layout Selection */}
            <div className="space-y-3">
              <label className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-400 select-none block flex items-center justify-between">
                <span>Artwork Exhibition Layout</span>
                <span className="text-[9px] text-[var(--accent)] font-bold">TechWeek NYC Live Layouts</span>
              </label>

              <div className="space-y-2">
                {[
                  {
                    id: 'split',
                    title: 'Cinematic Split-Frame',
                    source: 'ogBvbEB Pen Inspired',
                    desc: 'Displaced asymmetry with fine dividing lines, compact metadata rails, and spacious offset layout balancing.',
                    icon: <Columns className="w-4 h-4 text-neutral-300" />
                  },
                  {
                    id: 'bento',
                    title: 'Modular Glass Bento',
                    source: 'qERWZNP Pen Inspired',
                    desc: 'Glassmorphic panel split into translucent sub-compartments, giving structured micro-grids for mobile screens.',
                    icon: <Grid className="w-4 h-4 text-neutral-300" />
                  },
                  {
                    id: 'brutalist',
                    title: 'Stark Brutalist Rail',
                    source: 'OPLxQWx Pen Inspired',
                    desc: 'Industrial raw design featuring corner crosshairs, heavy pixelated dividers, and vertical metadata coordinate bars.',
                    icon: <Layers className="w-4 h-4 text-neutral-300" />
                  }
                ].map((l) => {
                  const isCur = (portfolio.layoutMode || 'split') === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => onUpdatePortfolio({ ...portfolio, layoutMode: l.id as any })}
                      className={`w-full p-3.5 rounded border text-left transition cursor-pointer flex gap-3 ${
                        isCur 
                          ? 'bg-neutral-900 border-[var(--accent)]' 
                          : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
                      }`}
                    >
                      <div className={`p-2 rounded flex items-center justify-center self-start ${isCur ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30' : 'bg-neutral-950 border border-neutral-800'}`}>
                        {React.cloneElement(l.icon, { className: `w-4 h-4 ${isCur ? 'text-[var(--accent)]' : 'text-neutral-500'}` })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-xs font-semibold tracking-wide ${isCur ? 'text-white' : 'text-neutral-100'}`}>
                            {l.title}
                          </span>
                          <span className="text-[8.5px] font-mono text-neutral-500 tracking-tight">{l.source}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-neutral-500 font-mono mt-1">
                          {l.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layout parameters switch panel */}
            <div className="p-4 rounded border border-neutral-800 bg-neutral-900/30 space-y-4">
              <h3 className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-300 border-b border-neutral-800/60 pb-1.5 mb-2 flex items-center gap-1.5 select-none">
                <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Exhibition Mode options</span>
              </h3>

              {/* Theme Toggle Check */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-xs font-semibold text-neutral-200">Default Contrast Canvas</h4>
                  <p className="text-[9.5px] font-mono text-neutral-500">Initial display background theme</p>
                </div>
                <div className="flex border border-neutral-800 rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onUpdatePortfolio({ ...portfolio, theme: 'dark' })}
                    className={`px-3 py-1 text-[10px] font-mono uppercase cursor-pointer ${portfolio.theme === 'dark' ? 'bg-[var(--accent)] text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400'}`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePortfolio({ ...portfolio, theme: 'light' })}
                    className={`px-3 py-1 text-[10px] font-mono uppercase cursor-pointer ${portfolio.theme === 'light' ? 'bg-[var(--accent)] text-neutral-950 font-bold animate-pulse-once' : 'bg-neutral-900 text-neutral-400'}`}
                  >
                    Light
                  </button>
                </div>
              </div>

              {/* Cube Grid Lines Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="font-mono text-xs font-semibold text-neutral-200">Render Cube Grid Lines</h4>
                  <p className="text-[9.5px] font-mono text-neutral-500">Drapes vector grid across face meshes</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdatePortfolio({ ...portfolio, showGridLines: !portfolio.showGridLines })}
                  className={`w-12 h-6 rounded-full p-1 transition duration-200 cursor-pointer ${portfolio.showGridLines ? 'bg-[var(--accent)] flex justify-end' : 'bg-neutral-800 flex justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-neutral-100 block" />
                </button>
              </div>

              {/* Ethereal Cube Glow Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h4 className="font-mono text-xs font-semibold text-neutral-200">Atmospheric Ambient Glow</h4>
                  <p className="text-[9.5px] font-mono text-neutral-500">Adds subtle background accent aura illumination</p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdatePortfolio({ ...portfolio, cubeGlow: !portfolio.cubeGlow })}
                  className={`w-12 h-6 rounded-full p-1 transition duration-200 cursor-pointer ${portfolio.cubeGlow ? 'bg-[var(--accent)] flex justify-end' : 'bg-neutral-800 flex justify-start'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-neutral-100 block" />
                </button>
              </div>
            </div>

            {/* Exhibition Description metadata */}
            <div className="space-y-2.5">
              <label className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-400 block select-none">
                Exhibition Portfolio Metadata
              </label>
              
              <div className="space-y-3 p-4 bg-neutral-900/30 rounded border border-neutral-800">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400">Show Title</span>
                  <input 
                    id="studio_exhibit_name"
                    type="text"
                    value={portfolio.name}
                    onChange={(e) => onUpdatePortfolio({ ...portfolio, name: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)]"
                    placeholder="e.g. Reverse Creativity"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400">Concept Description</span>
                  <textarea 
                    value={portfolio.description}
                    onChange={(e) => onUpdatePortfolio({ ...portfolio, description: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)] resize-none"
                    rows={2}
                    placeholder="Short summary description"
                  />
                </div>
              </div>
            </div>

            {/* Social Coordinates metadata */}
            <div className="space-y-2.5">
              <label className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-400 block select-none">
                Artist Social Coordinates & Handles
              </label>
              
              <div className="space-y-3 p-4 bg-neutral-900/30 rounded border border-neutral-800">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400">Instagram Handle</span>
                  <input 
                    type="text"
                    value={portfolio.socials?.instagram || ''}
                    onChange={(e) => {
                      const socials = { ...portfolio.socials, instagram: e.target.value };
                      onUpdatePortfolio({ ...portfolio, socials });
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)] text-neutral-100"
                    placeholder="e.g. @luis_martinez_art"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400">Twitter / X Handle</span>
                  <input 
                    type="text"
                    value={portfolio.socials?.twitter || ''}
                    onChange={(e) => {
                      const socials = { ...portfolio.socials, twitter: e.target.value };
                      onUpdatePortfolio({ ...portfolio, socials });
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)] text-neutral-100"
                    placeholder="e.g. @luismart_art"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400">Website URL</span>
                  <input 
                    type="text"
                    value={portfolio.socials?.website || ''}
                    onChange={(e) => {
                      const socials = { ...portfolio.socials, website: e.target.value };
                      onUpdatePortfolio({ ...portfolio, socials });
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)] text-neutral-100"
                    placeholder="e.g. https://mywork.art"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-400">GitHub Username</span>
                  <input 
                    type="text"
                    value={portfolio.socials?.github || ''}
                    onChange={(e) => {
                      const socials = { ...portfolio.socials, github: e.target.value };
                      onUpdatePortfolio({ ...portfolio, socials });
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:border-[var(--accent)] text-neutral-100"
                    placeholder="e.g. luismartinezofficial"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Local Portfolio Exhibits Library */}
        {activeTab === 'library' && (
          <div className="space-y-6">

            {/* Current Loaded exhibit status card */}
            <div className="p-4 rounded border border-neutral-800/80 bg-neutral-900/20 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs text-green-500 font-mono tracking-wider font-semibold uppercase">
                <Check className="w-3.5 h-3.5" />
                <span>Currently Active:</span>
              </div>
              <h3 className="font-sans text-xl font-bold tracking-tight text-neutral-100">{portfolio.name}</h3>
              <p className="text-[10px] leading-relaxed text-neutral-500 font-mono italic">
                {portfolio.description || 'No catalog meta description has been entered.'}
              </p>
            </div>

            {/* Cloud Portfolio Backup */}
            <div className="space-y-3 p-4 border border-neutral-800/80 bg-neutral-900/30 rounded">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 flex justify-between select-none">
                <span>Cloud Portfolio Backup</span>
                <span className="text-[9px] text-emerald-500 font-mono lowercase tracking-wide">Firestore Auth</span>
              </div>

              {isAuthLoading ? (
                <div className="text-center p-3 border border-neutral-800 rounded bg-neutral-900/10 text-xs font-mono text-neutral-500">
                  Checking cloud credentials...
                </div>
              ) : !currentUser ? (
                <div className="p-3 border border-dashed border-neutral-800/80 rounded bg-neutral-900/25 text-center space-y-3">
                  <p className="text-[10px] leading-relaxed text-neutral-400 font-mono">
                    Sign in with Google to backup portfolios to secure cloud Firestore and share lightweight, robust links!
                  </p>
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="w-full py-2 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold font-mono text-[10.5px] uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.67 0 3.19.57 4.38 1.69l3.27-3.27C17.65 1.58 15.02 1 12 1 7.37 1 3.41 3.66 1.45 7.55l3.8 2.95C6.18 7.35 8.87 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.88c2.18-2.01 3.71-4.97 3.71-8.62z" />
                      <path fill="#FBBC05" d="M5.25 14.5c-.25-.75-.39-1.55-.39-2.38s.14-1.63.39-2.38L1.45 6.79C.52 8.65 0 10.74 0 13s.52 4.35 1.45 6.21l3.8-2.71z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.72-2.88c-1.11.75-2.52 1.19-4.24 1.19-3.13 0-5.82-2.31-6.75-5.46l-3.8 2.95C3.41 20.34 7.37 23 12 23z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-5.5 h-5.5 rounded-full border border-neutral-700" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-5.5 h-5.5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[9px] font-bold text-[var(--accent)] font-mono">
                          {currentUser.email?.[0].toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="font-mono min-w-0 leading-tight">
                        <p className="text-[10px] font-bold text-neutral-200 truncate">{currentUser.displayName || 'Artist'}</p>
                        <p className="text-[8px] text-neutral-500 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-100 rounded text-[9px] uppercase font-mono transition cursor-pointer flex-shrink-0"
                    >
                      Sign Out
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onSaveToCloud}
                    className="w-full py-1.5 px-3 bg-[var(--accent)] text-zinc-950 font-bold font-mono text-[10px] uppercase rounded hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Backup Active to Cloud</span>
                  </button>

                  <div className="space-y-2 pt-2 border-t border-neutral-800/50">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider select-none">Your Cloud Exhibits ({cloudPortfolios.length})</span>
                    {isCloudLoading ? (
                      <div className="text-center p-2 text-neutral-500 font-mono text-[10px]">Loading cloud index...</div>
                    ) : cloudPortfolios.length === 0 ? (
                      <p className="text-[9.5px] italic text-neutral-500 font-mono">No active cloud exhibits saved yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-[155px] overflow-y-auto pr-1 studio-scrollbar">
                        {cloudPortfolios.map((item) => {
                          const isActive = item.id === portfolio.id;
                          return (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800/85 hover:border-neutral-700/80 transition">
                              <span className={`text-[10.5px] truncate max-w-[65%] font-mono ${isActive ? 'text-[var(--accent)] font-bold' : 'text-neutral-300'}`}>
                                {item.name}
                              </span>
                              <div className="flex gap-1 items-center flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onLoadPortfolio(item.id)}
                                  disabled={isActive}
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition ${isActive ? 'text-neutral-600 bg-transparent' : 'bg-neutral-900 border border-neutral-800 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-neutral-950'}`}
                                >
                                  {isActive ? 'Active' : 'Load'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onCloudDelete(item.id)}
                                  className="p-1 rounded border border-neutral-800 text-neutral-500 hover:text-rose-450 hover:bg-rose-950/15 transition cursor-pointer"
                                  title="Delete from Cloud"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Form Save New Preset */}
            <form onSubmit={handleSavePortfolioBtn} className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block select-none">
                Clone / Save Current State As New Exhibit
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[var(--accent)] text-neutral-100"
                  placeholder="New exhibit name..."
                />
                <button
                  type="submit"
                  disabled={!newPortfolioName.trim()}
                  className="py-1.5 px-4 bg-neutral-900 border border-neutral-800 text-[10.5px] uppercase tracking-wider font-semibold rounded hover:bg-neutral-800 hover:border-neutral-700 disabled:opacity-50 text-[var(--accent)] font-mono transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>

            {/* Saved items list */}
            <div className="space-y-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 flex justify-between select-none">
                <span>Stored Portfolio Exhibits ({savedPortfolios.length})</span>
                <span className="text-[9px] text-neutral-500 font-mono">browser local index</span>
              </div>
              
              {savedPortfolios.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-neutral-800 rounded bg-neutral-900/15">
                  <AlertCircle className="w-6 h-6 text-neutral-600 mx-auto mb-2" />
                  <p className="text-[11px] font-mono text-neutral-500">
                    No custom portfolio creations found in local library. Clone this template to start.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 studio-scrollbar">
                  {savedPortfolios.map((item) => {
                    const isActive = item.id === portfolio.id;
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center justify-between p-3.5 rounded border transition ${
                          isActive 
                            ? 'bg-neutral-900 border-[var(--accent)]/50' 
                            : 'bg-neutral-900/30 border-neutral-800/80'
                        }`}
                      >
                        <div className="flex-1 truncate max-w-[70%] select-none">
                          <h4 className={`text-xs font-semibold truncate font-sans ${isActive ? 'text-[var(--accent)]' : 'text-neutral-200'}`}>
                            {item.name}
                          </h4>
                          <span className="text-[8.5px] text-neutral-500 font-mono tracking-wider block">ID: {item.id.substring(0, 12)}...</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => onLoadPortfolio(item.id)}
                            className={`p-1.5 px-2.5 rounded text-[10px] font-semibold uppercase font-mono tracking-wider transition cursor-pointer ${
                              isActive 
                                ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 cursor-default' 
                                : 'bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-neutral-950 font-bold'
                            }`}
                            disabled={isActive}
                          >
                            {isActive ? 'Loaded' : 'Load'}
                          </button>
                          
                          <button
                            onClick={() => onDeletePortfolio(item.id)}
                            className="p-1.5 rounded border border-neutral-800 hover:border-rose-950/40 text-neutral-500 hover:bg-rose-950/25 hover:text-rose-500 transition cursor-pointer"
                            title="Delete exhibition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Template defaults reset section */}
            <div className="space-y-2 border-t border-neutral-800/60 pt-4">
              <label className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 block select-none">
                Default system galleries
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to load templates "${tpl.name}"? It will overwrite any unsaved changes.`)) {
                        onUpdatePortfolio({
                          ...tpl,
                          id: `custom-id-${Date.now()}` // Trigger fresh clone
                        });
                      }
                    }}
                    className="p-2.5 bg-neutral-900/40 border border-neutral-800 rounded truncate hover:border-neutral-700 hover:text-neutral-200 flex items-center gap-1.5 transition text-left cursor-pointer font-mono text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3 text-[var(--accent)] flex-shrink-0" />
                    <span className="truncate">{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: Publishing & Instant Share */}
        {activeTab === 'share' && (
          <div className="space-y-6">

            <div className="p-5 border border-neutral-800/80 bg-neutral-900/15 rounded text-center space-y-3">
              <Globe className="w-10 h-10 text-[var(--accent)] mx-auto animate-pulse" />
              <h3 className="font-sans text-lg font-bold tracking-tight text-neutral-100">Live Web Presence</h3>
              <p className="text-[11px] leading-relaxed text-neutral-400 font-mono">
                No database or deployment configuration needed. Any changes you make are instantly baked directly into a secure encrypted sharing link!
              </p>
            </div>

            {/* Action panel */}
            <div className="space-y-3">
              <h4 className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-400 select-none">
                Share exhibition link
              </h4>
              
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded font-mono text-[10px] break-all max-h-[140px] overflow-y-auto text-neutral-400 text-left select-all">
                {getShareableLink()}
              </div>

              <div className="flex gap-2">
                <button
                  id="studio_copy_link"
                  onClick={handleCopyLink}
                  className="flex-1 py-3 px-4 bg-[var(--accent)] border border-transparent rounded text-xs tracking-wider font-mono uppercase transition cursor-pointer text-neutral-950 font-bold flex items-center justify-center gap-1.5 hover:shadow-lg hover:brightness-105 active:scale-[0.99]"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-neutral-950" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-950" />
                      <span>Copy Encoded Sharing Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {portfolio.faces.some(face => face.imageSrc?.startsWith('data:image/')) && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-amber-500 font-bold uppercase">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Large Image Upload Detected</span>
                </div>
                <p className="text-[9.5px] leading-relaxed text-neutral-400 font-mono">
                  You have uploaded local files as slide images. Since your entire exhibition state is encrypted directly inside the share link, local files make the link extremely large, which can exceed modern browser limits and cause your changes to fail to load when shared.
                  <span className="text-amber-500/95 block mt-1 font-semibold">Recommendation: Use web URL image links (like Unsplash) to make your sharing URL compact and 100% reliable.</span>
                </p>
              </div>
            )}

            <div className="p-4 rounded border border-neutral-800 bg-neutral-900/30 space-y-3">
              <h4 className="font-mono text-[10.5px] uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 select-none">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>How URL sharing works</span>
              </h4>
              <ul className="text-[10px] leading-relaxed text-neutral-400 list-disc pl-4 font-mono space-y-1.5 text-left">
                <li>Your customized titles, text, themes, and image references are encoded using safe UTF-8 base64.</li>
                <li>Anyone who loads this URL will see your curated 3D showcase immediately in read-only immersive mode.</li>
                <li>They can inspect with interactive inertia scrolling on mobile or desktop without signing up!</li>
              </ul>
            </div>

          </div>
        )}

      </div>

      {/* Footer controls */}
      <div className="px-6 py-4 border-t border-neutral-800 font-mono text-[10px] text-neutral-500 flex justify-between bg-neutral-950">
        <span>myown.media / craft 2026</span>
        <span>ESC to toggle</span>
      </div>
    </div>
  );
}
