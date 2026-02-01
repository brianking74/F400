
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Versions from './components/Versions';
import Owners from './components/Owners';
import Gallery from './components/Gallery';
import Footer from './components/Footer';
import { VERSIONS, GALLERY_PROMPTS, OWNERS, HISTORY_PROMPT } from './constants';

// IndexedDB Helper for persistent storage
const DB_NAME = 'Ferrari400Archive';
const STORE_NAME = 'assets';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAsset = async (key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
};

const saveAsset = async (key: string, value: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => resolve();
  });
};

const App: React.FC = () => {
  const [heroImage, setHeroImage] = useState<string>('');
  const [heroVideo, setHeroVideo] = useState<string>('');
  const [historyImage, setHistoryImage] = useState<string>('');
  const [versionImages, setVersionImages] = useState<Record<string, string>>({});
  const [ownerImages, setOwnerImages] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsKey, setNeedsKey] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  useEffect(() => {
    const checkKeyAndCache = async () => {
      const cachedVideo = await getAsset('heroVideo');
      const cachedHeroImg = await getAsset('heroImage');
      const cachedHistoryImg = await getAsset('historyImage');
      const cachedVersions = await getAsset('versionImages');
      const cachedOwners = await getAsset('ownerImages');
      const cachedGallery = await getAsset('galleryImages');

      if (cachedVideo && cachedHeroImg) {
        setHeroVideo(URL.createObjectURL(cachedVideo));
        setHeroImage(cachedHeroImg);
        setHistoryImage(cachedHistoryImg);
        setVersionImages(cachedVersions || {});
        setOwnerImages(cachedOwners || {});
        setGalleryImages(cachedGallery || []);
        setLoading(false);
        return;
      }

      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setNeedsKey(true);
        setLoading(false);
      } else {
        startGeneration();
      }
    };
    checkKeyAndCache();
  }, []);

  const handleSelectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setNeedsKey(false);
    startGeneration();
  };

  const startGeneration = async () => {
    setLoading(true);

    const generateImage = async (prompt: string, retries = 3, delay = 3000): Promise<string | null> => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
              imageSize: "1K"
            }
          }
        });
        const part = res.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
        return null;
      } catch (error: any) {
        if (error?.message?.includes('429') && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return generateImage(prompt, retries - 1, delay * 2);
        }
        return null;
      }
    };

    const generateVideo = async (): Promise<string | null> => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      try {
        setLoadingStep('Initializing Cinematic Video Generation (Veo 3.1)...');
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: 'A cinematic one-take shot of a red 1977 Ferrari 400 driving in a single, unwavering direction along a straight scenic road. The camera is stationary on the roadside. The car starts in the distance, driving towards the camera. As the car passes the camera, the right side of the car glides gracefully past the lens. The camera smoothly pivots 180 degrees to follow the car from behind as it continues away in exactly the same direction. One continuous take, no cuts, no direction changes, showing the front, then strictly the right side, then the rear as it accelerates away. High-quality 1080p.',
          config: {
            numberOfVideos: 1,
            resolution: '1080p',
            aspectRatio: '16:9'
          }
        });

        while (!operation.done) {
          setLoadingStep('Developing Film Frames... This may take a minute.');
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await (ai as any).operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = (operation as any).response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
          const blob = await response.blob();
          await saveAsset('heroVideo', blob);
          return URL.createObjectURL(blob);
        }
        return null;
      } catch (error) {
        console.error("Video generation failed:", error);
        return null;
      }
    };

    try {
      const videoTask = generateVideo();

      setLoadingStep('Capturing Hero Profile: Ferrari 400 Series');
      const hImg = await generateImage("Masterpiece studio photography of a 1977 Ferrari 400, Rosso Corsa red, sharp angular Pininfarina wedge body, distinct three-box grand tourer silhouette, low front nose, five-spoke wheels, high resolution.");
      if (hImg) {
        setHeroImage(hImg);
        await saveAsset('heroImage', hImg);
      }

      setLoadingStep('Curating Historical Archives...');
      const histImg = await generateImage(HISTORY_PROMPT);
      if (histImg) {
        setHistoryImage(histImg);
        await saveAsset('historyImage', histImg);
      }

      setLoadingStep('Documenting Evolution & Variants...');
      const vMap: Record<string, string> = {};
      for (const v of VERSIONS) {
        const img = await generateImage(v.prompt);
        if (img) vMap[v.id] = img;
      }
      setVersionImages(vMap);
      await saveAsset('versionImages', vMap);

      setLoadingStep('Finalizing Visual Heritage...');
      const oMap: Record<string, string> = {};
      for (const o of OWNERS) {
        const img = await generateImage(o.prompt);
        if (img) oMap[o.id] = img;
      }
      setOwnerImages(oMap);
      await saveAsset('ownerImages', oMap);

      const gImages = [];
      for (const g of GALLERY_PROMPTS) {
        const img = await generateImage(g.prompt);
        if (img) gImages.push({ ...g, url: img });
      }
      setGalleryImages(gImages);
      await saveAsset('galleryImages', gImages);

      const vUrl = await videoTask;
      if (vUrl) setHeroVideo(vUrl);

    } catch (err) {
      console.error("Critical error in visual synthesis:", err);
    } finally {
      setLoading(false);
    }
  };

  if (needsKey) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white font-serif px-6 text-center">
        <h2 className="text-4xl md:text-5xl tracking-[0.4em] uppercase mb-6 font-bold text-rosso">Maranello Archive</h2>
        <p className="text-gray-400 max-w-lg mb-10 leading-relaxed font-sans font-light tracking-wide">
          This cinematic homage utilizes Veo 3.1 & Gemini 3 Pro to reconstruct the Ferrari 400's legacy. Please connect an authorized project to begin synthesis.
        </p>
        <button 
          onClick={handleSelectKey}
          className="px-12 py-5 bg-rosso text-white font-bold uppercase tracking-[0.3em] hover:bg-red-700 transition-all shadow-2xl transform hover:scale-105 mb-6"
        >
          Authorize Visual Archive
        </button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] text-gray-500 uppercase tracking-widest underline hover:text-white">Learn about project billing</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white font-serif">
        <div className="relative mb-12">
          <div className="w-24 h-24 border-2 border-rosso border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-rosso rounded-full animate-ping"></div>
          </div>
        </div>
        <h2 className="text-3xl tracking-[0.4em] uppercase mb-4 font-bold text-rosso">Maranello Engine</h2>
        <div className="space-y-4 text-center px-6">
          <p className="text-gray-400 animate-pulse tracking-widest text-xs uppercase max-w-sm mx-auto">{loadingStep || 'Verifying Visual Cache...'}</p>
          <div className="flex justify-center gap-1">
            <div className="w-1 h-1 bg-rosso/30 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1 h-1 bg-rosso/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1 h-1 bg-rosso rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" id="top">
      <Header />
      <main>
        <Hero customImage={heroImage} videoUrl={heroVideo} />
        <History customImage={historyImage} />
        <Versions images={versionImages} />
        <Owners images={ownerImages} />
        <Gallery images={galleryImages} />
      </main>
      <Footer />
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 bg-rosso text-white rounded-full flex items-center justify-center shadow-2xl z-40 hover:scale-110 transition-transform hidden sm:flex"
      >
        ↑
      </button>
      
      <div 
        className="fixed bottom-4 left-4 opacity-0 hover:opacity-10 cursor-pointer text-[10px] text-white"
        onClick={() => { indexedDB.deleteDatabase(DB_NAME); window.location.reload(); }}
      >
        RESET CACHE
      </div>
    </div>
  );
};

export default App;
