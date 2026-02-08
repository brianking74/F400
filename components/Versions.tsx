
import React from 'react';
import SectionTitle from './SectionTitle';
import { VERSIONS } from '../constants';
import { Settings, Zap, History as HistoryIcon } from 'lucide-react';

interface VersionsProps {
  images?: Record<string, string>;
}

const Versions: React.FC<VersionsProps> = ({ images = {} }) => {
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
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000 animate-in fade-in"
                  />
                ) : (
                  <div className="text-center opacity-20">
                    <p className="text-[8px] uppercase tracking-[0.5em] text-white font-bold italic">Spec Document: {v.id}</p>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-rosso text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                  {v.year}
                </div>
              </div>
              
              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-2xl font-serif mb-4 group-hover:text-rosso transition-colors">{v.name}</h3>
                <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                  {v.description}
                </p>
                
                <div className="space-y-4 mb-10 pt-6 border-t border-gray-100 mt-auto">
                  <div className="flex items-center text-xs">
                    <Zap size={14} className="text-rosso mr-3 shrink-0" />
                    <span className="font-semibold mr-2">Engine:</span> {v.specs.engine}
                  </div>
                  <div className="flex items-center text-xs">
                    <Settings size={14} className="text-rosso mr-3 shrink-0" />
                    <span className="font-semibold mr-2">Transmission:</span> {v.specs.transmission}
                  </div>
                  <div className="flex items-center text-xs">
                    <HistoryIcon size={14} className="text-rosso mr-3 shrink-0" />
                    <span className="font-semibold mr-2">Top Speed:</span> {v.specs.topSpeed}
                  </div>
                </div>

                <button className="w-full py-4 border border-black text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-all">
                  Request Archive Details
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
