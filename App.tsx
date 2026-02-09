
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Versions from './components/Versions';
import Owners from './components/Owners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import VersionDetail from './components/VersionDetail';
import { VERSIONS, GALLERY_PROMPTS, OWNERS, HISTORY_PROMPT, HERO_PROMPT } from './constants';
import { Loader2, database as DatabaseIcon, ShieldCheck } from 'lucide-react';

const DB_NAME = 'FERRARI_400_PERMANENT_VAULT';
const STORE_NAME = 'archival_assets';
const ADMIN_KEY = 'f400_admin_active_session';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAsset = async (key: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

const saveAsset = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
    });
  } catch (e) {
    console.error("Archive: Storage error", e);
  }
};

const App: React.FC = () => {
  const [heroImage, setHeroImage] = useState<string>('');
  const [historyImage, setHistoryImage] = useState<string>('');
  const [versionImages, setVersionImages] = useState<Record<string, string>>({});
  const [ownerImages, setOwnerImages] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [synthesisStatus, setSynthesisStatus] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | string>('home');
  const synthesisInFlight = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      sessionStorage.setItem(ADMIN_KEY, 'true');
      setIsAdmin(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setIsAdmin(sessionStorage.getItem(ADMIN_KEY) === 'true');
    }

    const bootstrapArchive = async () => {
      try {
        const [h, hist, vers, own, gal] = await Promise.all([
          getAsset('heroImage'),
          getAsset('historyImage'),
          getAsset('versionImages'),
          getAsset('ownerImages'),
          getAsset('galleryImages')
        ]);

        if (h) setHeroImage(h);
        if (hist) setHistoryImage(hist);
        if (vers) setVersionImages(vers || {});
        if (own) setOwnerImages(own || {});
        if (gal) setGalleryImages(gal || []);

        setIsInitializing(false);

        // Always attempt to fill missing gaps in the local vault
        if (!synthesisInFlight.current) {
          synthesisInFlight.current = true;
          runArchivalSynthesis();
        }
      } catch (err) {
        setIsInitializing(false);
      }
    };
    bootstrapArchive();
  }, []);

  const runArchivalSynthesis = async () => {
    const aiKey = process.env.API_KEY;
    if (!aiKey) {
      synthesisInFlight.current = false;
      return;
    }
    
    const ai = new GoogleGenAI({ apiKey: aiKey });

    const generateImage = async (prompt: string, label: string): Promise<string | null> => {
      try {
        setSynthesisStatus(`Restoring ${label}...`);
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "16:9" }, seed: 1976 }
        });
        const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part?.inlineData?.data ? `data:image/png;base64,${part.inlineData.data}` : null;
      } catch (e) {
        return null;
      }
    };

    try {
      // 1. Hero
      if (!heroImage) {
        const hImg = await generateImage(HERO_PROMPT, 'Master Hero Plate');
        if (hImg) { setHeroImage(hImg); await saveAsset('heroImage', hImg); }
      }

      // 2. History
      if (!historyImage) {
        const histImg = await generateImage(HISTORY_PROMPT, 'Heritage Archives');
        if (histImg) { setHistoryImage(histImg); await saveAsset('historyImage', histImg); }
      }

      // 3. Versions
      const currentVers = { ...versionImages };
      let vChanged = false;
      for (const v of VERSIONS) {
        if (!currentVers[v.id]) {
          const data = await generateImage(v.prompt, `Variant: ${v.name}`);
          if (data) { currentVers[v.id] = data; vChanged = true; setVersionImages({ ...currentVers }); }
        }
      }
      if (vChanged) await saveAsset('versionImages', currentVers);

      // 4. Owners
      const currentOwners = { ...ownerImages };
      let oChanged = false;
      for (const o of OWNERS) {
        if (!currentOwners[o.id]) {
          const data = await generateImage(o.prompt, `Profile: ${o.name}`);
          if (data) { currentOwners[o.id] = data; oChanged = true; setOwnerImages({ ...currentOwners }); }
        }
      }
      if (oChanged) await saveAsset('ownerImages', currentOwners);

      // 5. Gallery
      const currentGal = [...galleryImages];
      let gChanged = false;
      for (const gp of GALLERY_PROMPTS) {
        if (!currentGal.find(g => g.id === gp.id)) {
          const url = await generateImage(gp.prompt, `Gallery Asset ${gp.id}`);
          if (url) { 
            currentGal.push({ ...gp, url }); 
            gChanged = true; 
            setGalleryImages([...currentGal]); 
          }
        }
      }
      if (gChanged) await saveAsset('galleryImages', currentGal);

      setSynthesisStatus(null);
    } catch (err) {
      console.error("Vault Restoration Error:", err);
      setSynthesisStatus("Restoration Paused");
      setTimeout(() => setSynthesisStatus(null), 3000);
    } finally {
      synthesisInFlight.current = false;
    }
  };

  const handleHeroUpdate = async (base64: string) => {
    setHeroImage(base64);
    await saveAsset('heroImage', base64);
  };

  const handleHistoryUpdate = async (base64: string) => {
    setHistoryImage(base64);
    await saveAsset('historyImage', base64);
  };

  const handleVersionUpdate = async (id: string, base64: string) => {
    const newVers = { ...versionImages, [id]: base64 };
    setVersionImages(newVers);
    await saveAsset('versionImages', newVers);
  };

  const handleOwnerUpdate = async (id: string, base64: string) => {
    const newOwners = { ...ownerImages, [id]: base64 };
    setOwnerImages(newOwners);
    await saveAsset('ownerImages', newOwners);
  };

  const handleGalleryUpdate = async (id: number, base64: string) => {
    const exists = galleryImages.some(img => img.id === id);
    let newGal;
    if (exists) {
      newGal = galleryImages.map(img => img.id === id ? { ...img, url: base64 } : img);
    } else {
      const promptInfo = GALLERY_PROMPTS.find(p => p.id === id);
      newGal = [...galleryImages, { ...promptInfo, url: base64 }];
    }
    setGalleryImages(newGal);
    await saveAsset('galleryImages', newGal);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY);
    setIsAdmin(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      const newState = !isAdmin;
      setIsAdmin(newState);
      if (newState) sessionStorage.setItem(ADMIN_KEY, 'true');
      else sessionStorage.removeItem(ADMIN_KEY);
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      if(window.confirm("Purge Local Vault and Re-Synthesize?")) {
        indexedDB.deleteDatabase(DB_NAME);
        window.location.reload();
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-12 h-[1px] bg-rosso animate-pulse"></div>
      </div>
    );
  }

  const selectedVersion = VERSIONS.find(v => v.id === currentView);

  return (
    <div className="min-h-screen selection:bg-rosso selection:text-white outline-none relative" id="top" onKeyDown={handleKeyDown} tabIndex={0}>
      
      {/* Vault Status Indicator */}
      {synthesisStatus && (
        <div className="fixed bottom-6 right-6 z-[100] bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 flex items-center space-x-3 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Loader2 size={14} className="animate-spin text-rosso" />
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold">{synthesisStatus}</span>
        </div>
      )}

      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-[100] bg-rosso/10 backdrop-blur-md border border-rosso/30 px-4 py-2 flex items-center space-x-3 text-rosso shadow-2xl">
          <ShieldCheck size={14} />
          <span className="text-[9px] uppercase tracking-[0.2em] font-bold">Local Overrides Enabled</span>
        </div>
      )}

      {currentView === 'home' ? (
        <>
          <Header />
          <main className="animate-in fade-in duration-700">
            <Hero 
              customImage={heroImage} 
              onUpdateImage={handleHeroUpdate} 
              isAdmin={isAdmin} 
              onLogout={handleLogout} 
            />
            <History customImage={historyImage} onUpdateImage={handleHistoryUpdate} isAdmin={isAdmin} />
            <Versions images={versionImages} onNavigate={setCurrentView} onUpdateImage={handleVersionUpdate} isAdmin={isAdmin} />
            <Owners images={ownerImages} onUpdateImage={handleOwnerUpdate} isAdmin={isAdmin} />
            <Gallery images={galleryImages} onUpdateImage={handleGalleryUpdate} isAdmin={isAdmin} />
          </main>
          <Footer />
        </>
      ) : selectedVersion ? (
        <VersionDetail 
          version={selectedVersion} 
          imageUrl={versionImages[selectedVersion.id]} 
          onBack={() => setCurrentView('home')}
          isAdmin={isAdmin}
          onUpdateImage={(base64) => handleVersionUpdate(selectedVersion.id, base64)}
        />
      ) : null}
    </div>
  );
};

export default App;
