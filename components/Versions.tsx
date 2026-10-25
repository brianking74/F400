import React, { useRef } from 'react';
import SectionTitle from './SectionTitle';
import { VERSIONS } from '../constants';
import { Settings, Zap, History as HistoryIcon, Camera } from 'lucide-react';

interface VersionsProps {
  images?: Record<string, string>;
  onNavigate: (id: string) => void;
  onUpdateImage?: (id: string, base64: string) => void;
  isAdmin?: boolean;
}

const Versions: React.FC<VersionsProps> = ({ images = {}, onNavigate, onUpdateImage, isAdmin }) => {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateImage(id, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <section id="versions" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle 
          title="The Evolution" 
          subtitle="Variants and Specifications" 
        />

        <div className="grid lg:grid-cols-3 gap-10">
          {VERSIONS.map((v) => (
            <div key={v.id} className="bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden flex flex-col">
              <div className="aspect-video overflow-hidden relative bg-neutral-900 flex items-center justify-center p-0">
                {images[v.id] ? (
                  <img 
                    src={images[v.id]} 
                    alt={v.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 animate-in fade-in"
                  />
                ) : (
                  <div className="text-center opacity-20">
                    <p className="text-[8px] uppercase tracking-[0.5em] text-white font-bold italic">Spec Document: {v.id}</p>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-rosso text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                  {v.year}
                </div>

                {isAdmin && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                    <button 
                      onClick={() => fileInputRefs.current[v.id]?.click()}
                      className="bg-rosso text-white px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest flex items-center space-x-2 shadow-xl hover:scale-105 transition-transform"
                    >
                      <Camera size={12} />
                      <span>Update Variant Image</span>
                    </button>
                    <input 
                      type="file" 
                      ref={el => fileInputRefs.current[v.id] = el} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(v.id, e)} 
                    />
                  </div>
                )}
              </div>
              
              <div className="p-8 flex-grow flex flex-col bg-white">
                <h3 className="text-2xl font-serif mb-4 group-hover:text-rosso transition-colors text-black">{v.name}</h3>
                <p className="text-gray-600 group-hover:text-gray-900 mb-8 leading-relaxed text-sm transition-colors duration-300">
                  {v.description}
                </p>
                
                <div className="space-y-4 mb-10 pt-6 border-t border-gray-100 mt-auto">
                  <div className="flex items-center text-xs text-gray-700">
                    <Zap size={14} className="text-rosso mr-3 shrink-0" />
                    <span className="font-semibold mr-2">Engine:</span> {v.specs.engine}
                  </div>
                  <div className="flex items-center text-xs text-gray-700">
                    <Settings size={14} className="text-rosso mr-3 shrink-0" />
                    <span className="font-semibold mr-2">Transmission:</span> {v.specs.transmission}
                  </div>
                  <div className="flex items-center text-xs text-gray-700">
                    <HistoryIcon size={14} className="text-rosso mr-3 shrink-0" />
                    <span className="font-semibold mr-2">Top Speed:</span> {v.specs.topSpeed}
                  </div>
                </div>

                <button 
                  onClick={() => onNavigate(v.id)}
                  className="w-full py-4 border border-black text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-all"
                >
                  Discover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Versions;