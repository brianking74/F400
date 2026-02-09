
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

const DB_NAME = 'FERRARI_400_PERMANENT_VAULT';
const STORE_NAME = 'archival_assets';
const MANIFEST_KEY = 'f400_archive_permanent_lock_v1';
const ADMIN_KEY = 'f400_admin_active_session'; // Changed key for session storage

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
  const [currentView, setCurrentView] = useState<'home' | string>('home');
  const synthesisInFlight = useRef(false);

  useEffect(() => {
    // Admin Detection - Using SessionStorage for better isolation
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

        const isLocked = localStorage.getItem(MANIFEST_KEY) === 'true';
        if (isLocked) return;

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
    if (!aiKey) return;
    const ai = new GoogleGenAI({ apiKey: aiKey });

    const generateImage = async (prompt: string, label: string): Promise<string | null> => {
      try {
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
      if (!(await getAsset('heroImage'))) {
        const hImg = await generateImage(HERO_PROMPT, 'Hero');
        if (hImg) { setHeroImage(hImg); await saveAsset('heroImage', hImg); }
      }
      if (!(await getAsset('historyImage'))) {
        const histImg = await generateImage(HISTORY_PROMPT, 'History');
        if (histImg) { setHistoryImage(histImg); await saveAsset('historyImage', histImg); }
      }
      const dbVers = await getAsset('versionImages') || {};
      const vMap = { ...dbVers };
      let vChanged = false;
      for (const v of VERSIONS) {
        if (!vMap[v.id]) {
          const data = await generateImage(v.prompt, `Variant ${v.name}`);
          if (data) { vMap[v.id] = data; vChanged = true; setVersionImages({...vMap}); }
        }
      }
      if (vChanged) await saveAsset('versionImages', vMap);

      const dbOwners = await getAsset('ownerImages') || {};
      const oMap = { ...dbOwners };
      let oChanged = false;
      for (const o of OWNERS) {
        if (!oMap[o.id]) {
          const data = await generateImage(o.prompt, `Owner ${o.name}`);
          if (data) { oMap[o.id] = data; oChanged = true; setOwnerImages({...oMap}); }
        }
      }
      if (oChanged) await saveAsset('ownerImages', oMap);

      const dbGal = await getAsset('galleryImages') || [];
      const gList = [...dbGal];
      let gChanged = false;
      for (const gp of GALLERY_PROMPTS) {
        if (!gList.find(g => g.id === gp.id)) {
          const url = await generateImage(gp.prompt, `Gallery ${gp.id}`);
          if (url) { gList.push({ ...gp, url }); gChanged = true; setGalleryImages([...gList]); }
        }
      }
      if (gChanged) await saveAsset('galleryImages', gList);
      localStorage.setItem(MANIFEST_KEY, 'true');
    } catch (err) {
      console.error("Archive Error:", err);
    } finally {
      synthesisInFlight.current = false;
    }
  };

  const handleHeroUpdate = async (base64: string) => {
    setHeroImage(base64);
    await saveAsset('heroImage', base64);
    localStorage.setItem(MANIFEST_KEY, 'true');
  };

  const handleHistoryUpdate = async (base64: string) => {
    setHistoryImage(base64);
    await saveAsset('historyImage', base64);
    localStorage.setItem(MANIFEST_KEY, 'true');
  };

  const handleVersionUpdate = async (id: string, base64: string) => {
    const newVers = { ...versionImages, [id]: base64 };
    setVersionImages(newVers);
    await saveAsset('versionImages', newVers);
    localStorage.setItem(MANIFEST_KEY, 'true');
  };

  const handleOwnerUpdate = async (id: string, base64: string) => {
    const newOwners = { ...ownerImages, [id]: base64 };
    setOwnerImages(newOwners);
    await saveAsset('ownerImages', newOwners);
    localStorage.setItem(MANIFEST_KEY, 'true');
  };

  const handleGalleryUpdate = async (id: number, base64: string) => {
    const newGal = galleryImages.map(img => img.id === id ? { ...img, url: base64 } : img);
    setGalleryImages(newGal);
    await saveAsset('galleryImages', newGal);
    localStorage.setItem(MANIFEST_KEY, 'true');
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
      if(window.confirm("Purge Archival Vault?")) {
        localStorage.removeItem(MANIFEST_KEY);
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
        />
      ) : null}
    </div>
  );
};

export default App;
