
import React from 'react';
import SectionTitle from './SectionTitle';
import { OWNERS } from '../constants';

interface OwnersProps {
  images?: Record<string, string>;
}

const Owners: React.FC<OwnersProps> = ({ images = {} }) => {
  return (
    <section id="owners" className="py-24 bg-black text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-rosso/5 -skew-x-12 transform translate-x-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionTitle 
          title="Distinguished Owners" 
          subtitle="Cultural Impact & Legacy" 
          light
        />

        <div className="grid md:grid-cols-3 gap-12">
          {OWNERS.map((owner) => (
            <div key={owner.id} className="text-center group">
              <div className="relative mb-8 mx-auto w-48 h-48 rounded-full overflow-hidden border-2 border-rosso/20 group-hover:border-rosso transition-all p-2 bg-neutral-900 flex items-center justify-center">
                {images[owner.id] ? (
                  <img 
                    src={images[owner.id]} 
                    alt={owner.name} 
                    className="w-full h-full object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-1000 animate-in fade-in"
                  />
                ) : (
                  <div className="text-[8px] uppercase tracking-widest text-white/10 px-4 italic font-bold">Heritage Profile {owner.id}</div>
                )}
              </div>
              <h3 className="text-2xl font-serif mb-2 text-rosso">{owner.name}</h3>
              <p className="text-gray-400 mb-6 font-light uppercase tracking-widest text-xs">{owner.description}</p>
              <div className="bg-rosso/10 p-6 border-l-2 border-rosso italic text-sm text-gray-300 leading-relaxed">
                {owner.fact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Owners;
