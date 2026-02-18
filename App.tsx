import React, { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Versions from './components/Versions';
import Owners from './components/Owners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import VersionDetail from './components/VersionDetail';
import { VERSIONS, GALLERY_PROMPTS, OWNERS } from './constants';
import { ShieldCheck } from 'lucide-react';

// Supabase Initialization - Safe guard against missing keys
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

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

const getLocalAsset = async (key: string): Promise<any> => {
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

const saveLocalAsset = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
    });
  } catch (e) {
    console.error("Archive: Local Storage error", e);
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

  const persistAsset = async (key: string, data: any) => {
    await saveLocalAsset(key, data);
    if (supabase) {
      try {
        await supabase.from('assets').upsert({ id: key, data: data });
      } catch (err) {
        console.warn(`Supabase sync failed for ${key}. Content remains local.`, err);
      }
    }
  };

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
        let assetsMap: Record<string, any> = {};

        if (supabase) {
          try {
            const { data: remoteAssets } = await supabase.from('assets').select('*');
            if (remoteAssets) {
              remoteAssets.forEach((row: any) => {
                assetsMap[row.id] = row.data;
              });
            }
          } catch (e) {
            console.warn("Could not connect to Supabase for global sync.", e);
          }
        }

        const getMergedAsset = async (key: string) => {
          if (assetsMap[key]) {
            await saveLocalAsset(key, assetsMap[key]);
            return assetsMap[key];
          }
          return await getLocalAsset(key);
        };

        const [h, hist, vers, own, gal] = await Promise.all([
          getMergedAsset('heroImage'),
          getMergedAsset('historyImage'),
          getMergedAsset('versionImages'),
          getMergedAsset('ownerImages'),
          getMergedAsset('galleryImages')
        ]);

        if (h) setHeroImage(h);
        if (hist) setHistoryImage(hist);
        if (vers) setVersionImages(vers || {});
        if (own) setOwnerImages(own || {});
        if (gal) setGalleryImages(gal || []);

        setIsInitializing(false);
      } catch (err) {
        console.error("Bootstrap error:", err);
        setIsInitializing(false);
      }
    };
    bootstrapArchive();
  }, []);

  const handleHeroUpdate = async (base64: string) => {
    setHeroImage(base64);
    await persistAsset('heroImage', base64);
  };

  const handleHistoryUpdate = async (base64: string) => {
    setHistoryImage(base64);
    await persistAsset('historyImage', base64);
  };

  const handleVersionUpdate = async (id: string, base64: string) => {
    const newVers = { ...versionImages, [id]: base64 };
    setVersionImages(newVers);
    await persistAsset('versionImages', newVers);
  };

  const handleOwnerUpdate = async (id: string, base64: string) => {
    const newOwners = { ...ownerImages, [id]: base64 };
    setOwnerImages(newOwners);
    await persistAsset('ownerImages', newOwners);
  };

  const handleGalleryUpdate = async (id: number, base64: string) => {
    const exists = galleryImages.some(img => img.id === id);
    let newGal;
    if (exists) {
      newGal = galleryImages.map(img => img.id === id ? { ...img, url: base64 } : img);
    } else {
      const promptInfo = GALLERY_PROMPTS.find(p => p.id === id);
      newGal = [...galleryImages, { ...promptInfo!, url: base64 }];
    }
    setGalleryImages(newGal);
    await persistAsset('galleryImages', newGal);
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
      if(window.confirm("Purge Local Vault and Re-Sync with Global?")) {
        indexedDB.deleteDatabase(DB_NAME);
        window.location.reload();
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center">
           <div className="w-12 h-[1px] bg-rosso animate-pulse mb-4"></div>
           <span className="text-[10px] text-white/20 uppercase tracking-[0.4em]">
             {isAdmin ? "Establishing Sync" : "Accessing Archive"}
           </span>
        </div>
      </div>
    );
  }

  const selectedVersion = VERSIONS.find(v => v.id === currentView);

  return (
    <div className="min-h-screen selection:bg-rosso/30 selection:text-rosso outline-none relative bg-white" id="top" onKeyDown={handleKeyDown} tabIndex={0}>
      
      {/* Admin Privilege Badge should only appear to admin */}
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-[100] bg-black border border-white px-4 py-2 flex items-center space-x-3 text-rosso shadow-2xl">
          <ShieldCheck size={14} className="text-rosso" />
          <span className="text-[11px] uppercase tracking-[0.1em] font-bold text-rosso">LOCAL OVERRIDES ENABLED</span>
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