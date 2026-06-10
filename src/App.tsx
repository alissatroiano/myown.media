/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Portfolio, AccentColor, FontPair } from './types';
import { TEMPLATES } from './data/templates';
import CubeExhibition from './components/CubeExhibition';
import CreatorStudio from './components/CreatorStudio';
import { Palette, ExternalLink, HelpCircle, Check, BookOpen, Layers, Sparkles, QrCode, Play, Pause } from 'lucide-react';
import QRCode from 'qrcode';

import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { 
  validateFirestoreConnection, 
  savePortfolioToFirestore, 
  deletePortfolioFromFirestore, 
  getUserPortfoliosFromFirestore, 
  getPortfolioFromFirestore 
} from './lib/firebaseService';

const LOCAL_STORAGE_KEY_PREFIX = 'myown-media-portfolio-';
const PORTFOLIO_INDEX_KEY = 'myown-media-index';

// Decode custom state from URL hash
const parseUrlExhibit = (): Portfolio | null => {
  try {
    const hash = window.location.hash || window.location.search;
    if (!hash || !hash.includes('exhibit=')) return null;
    
    let base64Str = '';
    if (hash.includes('exhibit=')) {
      base64Str = hash.split('exhibit=')[1];
    }
    if (!base64Str) return null;

    // Clean potential trailing fragment/query artifacts
    base64Str = base64Str.split('&')[0].split('?')[0];

    // Decode URL-safe base64 replacements
    let cleanedBase64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add missing padding characters
    while (cleanedBase64.length % 4 !== 0) {
      cleanedBase64 += '=';
    }

    const decodedStr = decodeURIComponent(escape(window.atob(cleanedBase64)));
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
      socials: s.soc ? {
        instagram: s.soc.ig || '',
        twitter: s.soc.tw || '',
        website: s.soc.wb || '',
        github: s.soc.gh || ''
      } : {
        instagram: '',
        twitter: '',
        website: '',
        github: ''
      },
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
  const [qrHasStrippedImages, setQrHasStrippedImages] = useState<boolean>(false);
  
  // Stored showcases index { id: string, name: string }[]
  const [savedPortfolios, setSavedPortfolios] = useState<{ id: string; name: string }[]>([]);

  // Walkthrough Tour State
  const [walkthroughStep, setWalkthroughStep] = useState<number>(-1); // -1 = inactive
  const [isTourPaused, setIsTourPaused] = useState<boolean>(false);
  const [tourMessage, setTourMessage] = useState<string>('');
  const [cursorState, setCursorState] = useState<{
    x: number;
    y: number;
    visible: boolean;
    clicking: boolean;
  }>({ x: 0, y: 0, visible: false, clicking: false });

  // Firebase configurations & authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [cloudPortfolios, setCloudPortfolios] = useState<Portfolio[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(false);
  const [isCloudSharedLoading, setIsCloudSharedLoading] = useState<boolean>(false);

  // Authentication callbacks
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign in failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Sync auth updates & load cloud portfolios index list
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        setIsCloudLoading(true);
        try {
          const list = await getUserPortfoliosFromFirestore(user.uid);
          setCloudPortfolios(list);
        } catch (err) {
          console.error("Failed to load user cloud portfolios:", err);
        } finally {
          setIsCloudLoading(false);
        }
      } else {
        setCloudPortfolios([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveToCloud = async () => {
    if (!currentUser || !activePortfolio) return;
    try {
      let documentToSave = { ...activePortfolio };
      // Assign ownership details
      documentToSave.userId = currentUser.uid;
      (documentToSave as any).ownerEmail = currentUser.email || '';
      
      // If saving over standard templates, clone them first
      if (documentToSave.id === 'default-creativity' || documentToSave.id.startsWith('shared-')) {
        documentToSave.id = `exhibit-${Date.now()}`;
      }
      
      await savePortfolioToFirestore(documentToSave, currentUser.uid, currentUser.email || '');
      
      // Keep local list in sync as fallback
      const hasItem = savedPortfolios.some(item => item.id === documentToSave.id);
      let updatedSaved = [...savedPortfolios];
      if (!hasItem) {
        updatedSaved = [{ id: documentToSave.id, name: documentToSave.name }, ...savedPortfolios];
        localStorage.setItem(PORTFOLIO_INDEX_KEY, JSON.stringify(updatedSaved));
        setSavedPortfolios(updatedSaved);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + documentToSave.id, JSON.stringify(documentToSave));
      
      setActivePortfolio(documentToSave);
      
      // Fetch latest list from Firestore
      setIsCloudLoading(true);
      const list = await getUserPortfoliosFromFirestore(currentUser.uid);
      setCloudPortfolios(list);
      setIsCloudLoading(false);
    } catch (err) {
      console.error("Failed to backup portfolio to cloud:", err);
    }
  };

  const handleCloudDelete = async (id: string) => {
    if (!currentUser) return;
    try {
      if (window.confirm("Are you sure you want to delete this exhibition from the Cloud storage? This action cannot be undone.")) {
        await deletePortfolioFromFirestore(id);
        const list = await getUserPortfoliosFromFirestore(currentUser.uid);
        setCloudPortfolios(list);
      }
    } catch (err) {
      console.error("Failed to delete exhibition from cloud:", err);
    }
  };

  // Safe name updater for typing simulations avoiding stale closure problems
  const handleUpdatePortfolioName = (newName: string) => {
    setActivePortfolio(prev => {
      if (!prev) return null;
      const updated = { ...prev, name: newName };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + updated.id, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleStartWalkthrough = () => {
    // If they are visiting as guest, programmatically clone to their workspace first!
    if (isReadOnly && activePortfolio) {
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
        window.location.hash = ''; // Clear shared hash
      } catch (err) {
        console.warn("Local storage sandboxing clone warning:", err);
      }
    }
    
    setIsStudioOpen(false); // Make sure studio drawer is closed so the tour can click open!
    setIsTourPaused(false);
    setTourMessage('');
    setWalkthroughStep(0);
  };

  // Track target coordinates dynamically (fully responsive support)
  useEffect(() => {
    if (walkthroughStep === -1) {
      setCursorState(prev => ({ ...prev, visible: false }));
      return;
    }

    let targetSelector = '';
    let msg = '';

    switch (walkthroughStep) {
      case 0:
        msg = "Welcome to the myown.media interactive Tour! Let's build your custom 3D catalog. This walkthrough is fully automated with a pause control.";
        setCursorState({ x: window.innerWidth / 2, y: window.innerHeight / 2, visible: true, clicking: false });
        break;
      case 1:
        msg = "First, let's open the Studio Panel where all dynamic page layouts and metadata reside.";
        targetSelector = '#studio_toggle';
        break;
      case 2:
        msg = "Let's open the Styling tab to configure customized aesthetic options like accent colors and dark/light modes.";
        targetSelector = '#studio_tab_styling';
        break;
      case 3:
        msg = "Watch how changing our theme accent color config to 'Azure' updates the background graphics instantly!";
        targetSelector = '#accent-btn-azure';
        break;
      case 4:
        msg = "Next, let's personalize our exhibition name. Watch as 'NEO-SPACE' types itself letter-by-letter live!";
        targetSelector = '#studio_exhibit_name';
        break;
      case 5:
        msg = "Now let's spin the 3D exhibition cube to see the rotation of face items in action!";
        targetSelector = '#scene-dot-1';
        break;
      case 6:
        msg = "Everything you create is backed into an encrypted direct link. Let's open the Publish tab!";
        targetSelector = '#studio_tab_share';
        break;
      case 7:
        msg = "Click the 'Copy Link' button to instantly grab your shareable exhibition link to share with your audience!";
        targetSelector = '#studio_copy_link';
        break;
      case 8:
        msg = "Tour complete! You're ready to create masterpieces. Enjoy personalizing your 3D Exhibition!";
        targetSelector = '#studio_close';
        break;
      default:
        break;
    }

    setTourMessage(msg);

    if (!targetSelector) return;

    const updatePosition = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCursorState(prev => ({
          ...prev,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          visible: true
        }));
      }
    };

    updatePosition();
    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    
    // Interval check as well in case drawer panel opens/slides
    const posInterval = setInterval(updatePosition, 100);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      clearInterval(posInterval);
    };
  }, [walkthroughStep]);

  // Walkthrough Autosave/Auto-Action Progression
  useEffect(() => {
    if (walkthroughStep === -1 || isTourPaused) return;

    let autoTimer: any;
    let actionTimer: any;

    if (walkthroughStep === 0) {
      // Welcome screen: wait 7.5s then go to next
      autoTimer = setTimeout(() => {
        setWalkthroughStep(1);
      }, 7500);
    } else if (walkthroughStep === 1) {
      // Click open the Studio drawer button
      actionTimer = setTimeout(() => {
        setCursorState(prev => ({ ...prev, clicking: true }));
        setTimeout(() => {
          setCursorState(prev => ({ ...prev, clicking: false }));
          const toggleBtn = document.querySelector('#studio_toggle') as HTMLButtonElement;
          if (toggleBtn) {
            toggleBtn.click();
          } else {
            setIsStudioOpen(true);
          }
          setWalkthroughStep(2);
        }, 300);
      }, 5500);
    } else if (walkthroughStep === 2) {
      // Click styling tab header
      actionTimer = setTimeout(() => {
        setCursorState(prev => ({ ...prev, clicking: true }));
        setTimeout(() => {
          setCursorState(prev => ({ ...prev, clicking: false }));
          const tabBtn = document.querySelector('#studio_tab_styling') as HTMLButtonElement;
          if (tabBtn) {
            tabBtn.click();
          }
          setWalkthroughStep(3);
        }, 300);
      }, 5500);
    } else if (walkthroughStep === 3) {
      // Choose azure accent color
      actionTimer = setTimeout(() => {
        setCursorState(prev => ({ ...prev, clicking: true }));
        setTimeout(() => {
          setCursorState(prev => ({ ...prev, clicking: false }));
          const btn = document.querySelector('#accent-btn-azure') as HTMLButtonElement;
          if (btn) {
            btn.click();
          } else if (activePortfolio) {
            handleUpdatePortfolio({ ...activePortfolio, accentColor: 'azure' });
          }
          setWalkthroughStep(4);
        }, 300);
      }, 5500);
    } else if (walkthroughStep === 4) {
      // Fill and type "NEO-SPACE"
      actionTimer = setTimeout(() => {
        const textToType = "NEO-SPACE";
        let currentIndex = 0;
        const typingInterval = setInterval(() => {
          if (isTourPaused) {
            clearInterval(typingInterval);
            return;
          }
          if (currentIndex < textToType.length) {
            currentIndex++;
            const partial = textToType.substring(0, currentIndex);
            handleUpdatePortfolioName(partial + " EXHIBIT");
          } else {
            clearInterval(typingInterval);
            setTimeout(() => {
              setWalkthroughStep(5);
            }, 1800);
          }
        }, 160);
      }, 4500);
    } else if (walkthroughStep === 5) {
      // Rotate cube (click scene-dot-1)
      actionTimer = setTimeout(() => {
        setCursorState(prev => ({ ...prev, clicking: true }));
        setTimeout(() => {
          setCursorState(prev => ({ ...prev, clicking: false }));
          const dot = document.querySelector('#scene-dot-1') as HTMLAnchorElement;
          if (dot) {
            dot.click();
          } else {
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
          }
          setWalkthroughStep(6);
        }, 300);
      }, 6000);
    } else if (walkthroughStep === 6) {
      // Open Publish tab header
      actionTimer = setTimeout(() => {
        setCursorState(prev => ({ ...prev, clicking: true }));
        setTimeout(() => {
          setCursorState(prev => ({ ...prev, clicking: false }));
          const publishTabBtn = document.querySelector('#studio_tab_share') as HTMLButtonElement;
          if (publishTabBtn) {
            publishTabBtn.click();
          }
          setWalkthroughStep(7);
        }, 300);
      }, 5500);
    } else if (walkthroughStep === 7) {
      // Click the copy link button
      actionTimer = setTimeout(() => {
        setCursorState(prev => ({ ...prev, clicking: true }));
        setTimeout(() => {
          setCursorState(prev => ({ ...prev, clicking: false }));
          const copyBtn = document.querySelector('#studio_copy_link') as HTMLButtonElement;
          if (copyBtn) {
            copyBtn.click();
          }
          setWalkthroughStep(8);
        }, 300);
      }, 5500);
    } else if (walkthroughStep === 8) {
      // Close studio
      actionTimer = setTimeout(() => {
        setCursorState(prev => ({ ...prev, clicking: true }));
        setTimeout(() => {
          setCursorState(prev => ({ ...prev, clicking: false }));
          const closeBtn = document.querySelector('#studio_close') as HTMLButtonElement;
          if (closeBtn) {
            closeBtn.click();
          } else {
            setIsStudioOpen(false);
          }
          setTimeout(() => {
            setWalkthroughStep(-1);
          }, 2000);
        }, 300);
      }, 6500);
    }

    return () => {
      clearTimeout(autoTimer);
      clearTimeout(actionTimer);
    };
  }, [walkthroughStep, activePortfolio, isTourPaused]);

  // System setup or state recovery
  useEffect(() => {
    // Validate Firestore connection on component load
    validateFirestoreConnection();

    const loadPortfolioData = async () => {
      // 1. Check if we have a direct Firestore cloud link ID (e.g. ?id=ex_123 or #id=ex_123)
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('id');
      const hashPart = window.location.hash;
      const hashIdMatch = hashPart.match(/[#&]id=([^&]+)/);
      const cloudPortfolioId = queryId || (hashIdMatch ? hashIdMatch[1] : null);

      if (cloudPortfolioId) {
        setIsCloudSharedLoading(true);
        try {
          const docFetched = await getPortfolioFromFirestore(cloudPortfolioId);
          if (docFetched) {
            setActivePortfolio(docFetched);
            setIsReadOnly(true);
            setIsStudioOpen(false);
            return;
          }
        } catch (err) {
          console.error("Cloud document load failed, falling back to other storage methods.", err);
        } finally {
          setIsCloudSharedLoading(false);
        }
      }

      // 2. Check if the URL has an embedded base64 exhibit hash parameter
      const sharedExhibit = parseUrlExhibit();
      if (sharedExhibit) {
        setActivePortfolio(sharedExhibit);
        setIsReadOnly(true);
        setIsStudioOpen(false); // Default to viewing when shared
        return;
      }

      // 3. Fetch local saved index if none encoded in hash/url
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

      // 4. Fallback: Load the standard Luis Martinez "Reverse Creativity" template
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
    };

    loadPortfolioData();
  }, []);

  // Listen to hash change to support dynamic router mapping
  useEffect(() => {
    const handleHashChange = async () => {
      // Check cloud portfolio link first
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get('id');
      const hashPart = window.location.hash;
      const hashIdMatch = hashPart.match(/[#&]id=([^&]+)/);
      const cloudPortfolioId = queryId || (hashIdMatch ? hashIdMatch[1] : null);

      if (cloudPortfolioId) {
        setIsCloudSharedLoading(true);
        try {
          const docFetched = await getPortfolioFromFirestore(cloudPortfolioId);
          if (docFetched) {
            setActivePortfolio(docFetched);
            setIsReadOnly(true);
            setIsStudioOpen(false);
            return;
          }
        } catch (err) {
          console.error("Cloud hash load failed:", err);
        } finally {
          setIsCloudSharedLoading(false);
        }
      }

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
      let urlToEncode = window.location.href;
      let stripped = false;

      // Check if URL is too long or contains base64 images, and proactively compact it
      const hasBase64 = activePortfolio.faces.some(face => face.imageSrc?.startsWith('data:image/'));
      if (hasBase64 || urlToEncode.length > 2000) {
        try {
          const miniState = {
            n: activePortfolio.name,
            d: activePortfolio.description,
            a: activePortfolio.accentColor,
            f: activePortfolio.fontPair,
            t: activePortfolio.theme,
            g: activePortfolio.showGridLines,
            w: activePortfolio.cubeGlow,
            lm: activePortfolio.layoutMode || 'split',
            soc: activePortfolio.socials ? {
              ig: activePortfolio.socials.instagram || '',
              tw: activePortfolio.socials.twitter || '',
              wb: activePortfolio.socials.website || '',
              gh: activePortfolio.socials.github || ''
            } : undefined,
            fc: activePortfolio.faces.map(face => ({
              fn: face.faceName,
              tl: face.tagline,
              ti: face.title,
              bd: face.body,
              is: face.imageSrc?.startsWith('data:image/') ? '' : face.imageSrc, // Replace giant base64 with empty string for QR compatibility
              st: face.stats.map(s => [s.label, s.value]),
              ct: face.ctaText
            }))
          };
          const jsonStr = JSON.stringify(miniState);
          const encoded = window.btoa(unescape(encodeURIComponent(jsonStr)));
          const appBaseUrl = window.location.origin + window.location.pathname;
          urlToEncode = `${appBaseUrl}#exhibit=${encoded}`;
          stripped = true;
        } catch (e) {
          console.warn('Failed to compact local portfolio data for QR sharing:', e);
        }
      }

      try {
        // High-contrast clean styling to guarantee rapid camera focus on all phones
        const url = await QRCode.toDataURL(urlToEncode, {
          color: {
            dark: '#18181b', // Zn 900
            light: '#ffffff' // Pure White
          },
          margin: 1.5,
          width: 260,
          errorCorrectionLevel: 'M'
        });
        setQrCodeUrl(url);
        setQrHasStrippedImages(stripped);
      } catch (err) {
        console.error('Failed to generate exhibition QR link:', err);
        // Fallback to origin url if still fails so QR component doesn't stay on "generating..." forever
        try {
          const fallbackUrl = await QRCode.toDataURL(window.location.origin, {
            color: { dark: '#18181b', light: '#ffffff' },
            margin: 1.5,
            width: 260,
            errorCorrectionLevel: 'M'
          });
          setQrCodeUrl(fallbackUrl);
          setQrHasStrippedImages(true);
        } catch (fallbackErr) {
          console.error('QR code generation hard failure:', fallbackErr);
        }
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
        onStartWalkthrough={handleStartWalkthrough}
      />

      {/* Guest QR Code scan popover */}
      {isReadOnly && showQr && (
        <div className="fixed bottom-28 left-4 right-4 sm:left-auto sm:bottom-[100px] sm:right-6 z-[40] sm:w-64 bg-neutral-950/95 border border-neutral-800 p-4 rounded-lg backdrop-blur-md shadow-2xl animate-slide-up-fade font-mono flex flex-col items-center">
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
          
          {qrHasStrippedImages ? (
            <div className="mt-3 text-[8px] leading-relaxed text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 rounded text-left select-none w-full">
              <span className="font-bold block uppercase mb-0.5">⚠️ Large Images Omitted in QR</span>
              Only layout, text & theme were packed to guarantee scan suitability. Use Unsplash image URLs to load slides on mobile.
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-1.5 text-[8.5px] text-neutral-500 border-t border-neutral-800/60 pt-2.5 w-full justify-center select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Exhibition ready for camera scan</span>
            </div>
          )}
        </div>
      )}

      {/* Guest/Preview banner if visiting via sharing hash */}
      {isReadOnly && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[40] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-sm sm:max-w-none bg-neutral-950/95 border border-neutral-800 p-3.5 rounded-lg backdrop-blur-md shadow-2xl animate-bounce-subtle select-none">
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
      {isStudioOpen && !isReadOnly && (() => {
        let walkthroughTab: 'faces' | 'styling' | 'library' | 'share' | undefined = undefined;
        if (walkthroughStep !== -1) {
          if (walkthroughStep <= 1) {
            walkthroughTab = 'faces';
          } else if (walkthroughStep >= 2 && walkthroughStep <= 4) {
            walkthroughTab = 'styling';
          } else if (walkthroughStep === 5) {
            walkthroughTab = 'styling';
          } else if (walkthroughStep >= 6) {
            walkthroughTab = 'share';
          }
        }
        return (
          <CreatorStudio
            portfolio={activePortfolio}
            onUpdatePortfolio={handleUpdatePortfolio}
            onClose={() => setIsStudioOpen(false)}
            savedPortfolios={savedPortfolios}
            onLoadPortfolio={handleLoadPortfolio}
            onSaveNewPortfolio={handleSaveNewPortfolio}
            onDeletePortfolio={handleDeletePortfolio}
            walkthroughTab={walkthroughTab}
            currentUser={currentUser}
            isAuthLoading={isAuthLoading}
            cloudPortfolios={cloudPortfolios}
            isCloudLoading={isCloudLoading}
            onGoogleSignIn={handleGoogleSignIn}
            onSignOut={handleSignOut}
            onSaveToCloud={handleSaveToCloud}
            onCloudDelete={handleCloudDelete}
          />
        );
      })()}

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

      {/* Interactive Autopilot Walkthrough HUD Panel */}
      {walkthroughStep !== -1 && (
        <div className="fixed bottom-6 left-1/2 -as-center -translate-x-1/2 z-[1000] w-[calc(100%-32px)] max-w-lg bg-neutral-950/95 border border-[var(--accent)] rounded-lg p-4 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-md animate-slide-up-fade text-white font-mono flex flex-col md:flex-row gap-4 items-center justify-between select-none">
          <div className="flex-1 space-y-2 text-left w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 relative">
                {isTourPaused ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 absolute animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[10px] tracking-widest text-amber-500 uppercase font-bold pl-1">
                      TOUR PAUSED
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping absolute" />
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                    <span className="text-[10px] tracking-widest text-[var(--accent)] uppercase font-bold pl-1">
                      AUTOPILOT TOUR
                    </span>
                  </>
                )}
              </div>
              <span className="text-[9px] text-neutral-400 font-bold bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                STEP {walkthroughStep + 1} OF 9
              </span>
            </div>
            
            <p className="text-[10.5px] leading-relaxed text-zinc-205">
              {tourMessage}
            </p>

            {/* Visual Micro Progress line tracker */}
            <div className="w-full h-[2.5px] bg-neutral-900 border border-neutral-800/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--accent)] transition-all duration-500 rounded-full shadow-[0_0_8px_var(--accent)]" 
                style={{ width: `${((walkthroughStep + 1) / 9) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-1.5 w-full md:w-auto shrink-0 justify-end flex-wrap">
            <button
              onClick={() => setIsTourPaused(!isTourPaused)}
              className={`flex-1 md:flex-initial py-2 px-3 flex items-center justify-center gap-1 border text-[9.5px] font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                isTourPaused 
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 shadow-[0_0_8px_rgba(255,255,255,0.05)]'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700 hover:text-white'
              }`}
              title={isTourPaused ? "Resume automated tour progression" : "Pause automated tour progression"}
            >
              {isTourPaused ? (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Pause</span>
                </>
              )}
            </button>
            {walkthroughStep < 8 && (
              <button
                onClick={() => setWalkthroughStep(prev => prev + 1)}
                className="flex-1 md:flex-initial py-2 px-3 border border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-200 text-[9.5px] font-bold uppercase tracking-wider rounded transition cursor-pointer"
              >
                Next Step
              </button>
            )}
            <button
              onClick={() => {
                setIsStudioOpen(false);
                setWalkthroughStep(-1);
              }}
              className="flex-grow md:flex-grow-0 py-2 px-3 bg-red-950/20 border border-red-900/30 hover:bg-red-950/45 hover:border-red-900/50 text-red-400 text-[9.5px] uppercase font-bold tracking-wider rounded transition cursor-pointer"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Glowing virtual interactive cursor representation */}
      {walkthroughStep !== -1 && cursorState.visible && (
        <div 
          className="fixed pointer-events-none z-[10001] select-none"
          style={{
            left: `${cursorState.x}px`,
            top: `${cursorState.y}px`,
            transition: 'left 0.85s cubic-bezier(0.16, 1, 0.3, 1), top 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: `translate(-50%, -50%) scale(${cursorState.clicking ? 0.72 : 1.0})`,
          }}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Pulsing ring during clicking tap */}
            {cursorState.clicking && (
              <span className="absolute w-12 h-12 rounded-full border-2 border-[var(--accent)] animate-ping opacity-85" />
            )}
            
            {/* Secondary radial pulse halo */}
            <span className="w-8 h-8 rounded-full bg-[var(--accent)] absolute opacity-10 animate-pulse" />
            
            {/* Primary tracking ring */}
            <span className="w-5 h-5 rounded-full border-2 border-[var(--accent)] bg-neutral-950/30 backdrop-blur-[0.5px] absolute shadow-[0_0_12px_var(--accent)]" />
            
            {/* Laser core pointer */}
            <span className="w-1.5 h-1.5 rounded-full bg-white absolute shadow-[0_0_6px_#fff]" />
            
            {/* Custom SVG pointer tail */}
            <svg 
              className="w-4 h-4 text-[var(--accent)] absolute -top-1 -left-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M4.5 3v13.5l4-4 2.5 5.5 2-1-2.5-5.5 5-1z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}
    </main>
  );
}
