import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Versions from './components/Versions';
import ColomboEngine from './components/ColomboEngine';
import Owners from './components/Owners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import VersionDetail from './components/VersionDetail';
import { VERSIONS, GALLERY_PROMPTS, OWNERS } from './constants';
import { CLOUDINARY_ASSETS } from './cloudinaryAssets';
import { ShieldCheck, Cloud, Info } from 'lucide-react';

const DB_NAME = 'FERRARI_400_PERMANENT_VAULT';
const STORE_NAME = 'archival_assets';
const ADMIN_KEY = 'f400_admin_active_session';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
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
  } catch (e) { return null; }
};

const saveLocalAsset = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, key);
      transaction.oncomplete = () => resolve();
    });
  } catch (e) { console.error("Archive Error:", e); }
};

const App: React.FC = () => {
  // Images are delivered from the Cloudinary CDN (see cloudinaryAssets.ts).
  // Values below are the production defaults; admin uploads override them
  // per-browser via IndexedDB.
  const [heroImage, setHeroImage] = useState<string>(CLOUDINARY_ASSETS.heroImage || '');
  const [historyImage, setHistoryImage] = useState<string>(CLOUDINARY_ASSETS.historyImage || '');
  const [engineImage, setEngineImage] = useState<string>(CLOUDINARY_ASSETS.engineImage || '');
  const [versionImages, setVersionImages] = useState<Record<string, string>>(CLOUDINARY_ASSETS.versionImages);
  const [ownerImages, setOwnerImages] = useState<Record<string, string>>(CLOUDINARY_ASSETS.ownerImages);
  const [galleryImages, setGalleryImages] = useState<any[]>(CLOUDINARY_ASSETS.galleryImages.filter(img => img.url));

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | string>('home');

  const persistAsset = useCallback(async (key: string, data: any) => {
    await saveLocalAsset(key, data);
  }, []);

  const handleHeroUpdate = useCallback(async (base64: string) => {
    setHeroImage(base64);
    await persistAsset('heroImage', base64);
  }, [persistAsset]);

  const handleHistoryUpdate = useCallback(async (base64: string) => {
    setHistoryImage(base64);
    await persistAsset('historyImage', base64);
  }, [persistAsset]);

  const handleEngineUpdate = useCallback(async (base64: string) => {
    setEngineImage(base64);
    await persistAsset('engineImage', base64);
  }, [persistAsset]);

  const handleVersionUpdate = useCallback(async (id: string, base64: string) => {
    setVersionImages(prev => {
      const next = { ...prev, [id]: base64 };
      persistAsset('versionImages', next);
      return next;
    });
  }, [persistAsset]);

  const handleOwnerUpdate = useCallback(async (id: string, base64: string) => {
    setOwnerImages(prev => {
      const next = { ...prev, [id]: base64 };
      persistAsset('ownerImages', next);
      return next;
    });
  }, [persistAsset]);

  const handleGalleryUpdate = useCallback(async (id: number, base64: string) => {
    setGalleryImages(prev => {
      const next = prev.some(img => img.id === id)
        ? prev.map(img => img.id === id ? { ...img, url: base64 } : img)
        : [...prev, { id, url: base64 }];
      persistAsset('galleryImages', next);
      return next;
    });
  }, [persistAsset]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      sessionStorage.setItem(ADMIN_KEY, 'true');
      setIsAdmin(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      setIsAdmin(sessionStorage.getItem(ADMIN_KEY) === 'true');
    }

    // Local admin uploads (IndexedDB) take precedence over the Cloudinary defaults.
    const bootstrap = async () => {
      try {
        const [h, hist, eng, vers, own, gal] = await Promise.all([
          getLocalAsset('heroImage'), getLocalAsset('historyImage'), getLocalAsset('engineImage'), getLocalAsset('versionImages'), getLocalAsset('ownerImages'), getLocalAsset('galleryImages')
        ]);

        if (h) setHeroImage(h);
        if (hist) setHistoryImage(hist);
        if (eng) setEngineImage(eng);
        if (vers) setVersionImages(vers);
        if (own) setOwnerImages(own);
        if (gal && Array.isArray(gal) && gal.some(img => img?.url)) setGalleryImages(gal);
      } catch (e) {
        console.error("Bootstrap error:", e);
      }
    };
    bootstrap();
  }, []);

  const selectedVersion = VERSIONS.find(v => v.id === currentView);

  return (
    <div className="min-h-screen bg-black">
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-[100] bg-zinc-950 border border-white/10 p-6 flex flex-col space-y-4 shadow-[0_0_60px_rgba(0,0,0,1)] backdrop-blur-2xl animate-in fade-in slide-in-from-left duration-500 max-w-[340px] w-full">
          <div className="flex items-center justify-between text-rosso">
            <div className="flex items-center space-x-3">
              <ShieldCheck size={18} />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Maranello Archive Ops</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 text-[9px] uppercase tracking-widest bg-white/5 p-3 rounded border border-white/5">
              <Cloud size={12} className="text-green-500" />
              <span className="text-white/40">Status:</span>
              <span className="text-green-500 font-bold">CLOUDINARY LIVE</span>
            </div>

            <div className="bg-green-500/5 border border-green-500/20 p-2 text-[8px] text-green-500/80 uppercase tracking-widest flex items-start space-x-2 rounded-sm">
              <div className="mt-1"><Info size={14} className="shrink-0" /></div>
              <span>Images are delivered via the Cloudinary CDN. Local edits made here persist in this browser only — production images are managed in cloudinaryAssets.ts.</span>
            </div>
          </div>
        </div>
      )}

      {currentView === 'home' ? (
        <>
          <Header />
          <Hero customImage={heroImage} onUpdateImage={handleHeroUpdate} isAdmin={isAdmin} />
          <History customImage={historyImage} onUpdateImage={handleHistoryUpdate} isAdmin={isAdmin} />
          <Versions images={versionImages} onNavigate={setCurrentView} onUpdateImage={handleVersionUpdate} isAdmin={isAdmin} />
          <ColomboEngine customImage={engineImage} onUpdateImage={handleEngineUpdate} isAdmin={isAdmin} />
          <Owners images={ownerImages} onUpdateImage={handleOwnerUpdate} isAdmin={isAdmin} />
          <Gallery images={galleryImages} onUpdateImage={handleGalleryUpdate} isAdmin={isAdmin} />
          <Footer />
        </>
      ) : selectedVersion ? (
        <VersionDetail 
          version={selectedVersion} 
          imageUrl={versionImages[selectedVersion.id] || ''} 
          onBack={() => setCurrentView('home')}
          isAdmin={isAdmin}
          onUpdateImage={(img) => handleVersionUpdate(selectedVersion.id, img)}
        />
      ) : null}
    </div>
  );
};

export default App;