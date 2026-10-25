
import React, { useRef } from 'react';
import SectionTitle from './SectionTitle';
import { Camera, Zap, Activity, Shield } from 'lucide-react';

interface ColomboEngineProps {
  customImage?: string;
  onUpdateImage?: (base64: string) => void;
  isAdmin?: boolean;
}

const ColomboEngine: React.FC<ColomboEngineProps> = ({ customImage, onUpdateImage, isAdmin }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateImage) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdateImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const specs = [
    { label: 'Displacement', value: '4823 cc', icon: <Activity size={16} /> },
    { label: 'Architecture', value: '60° V12', icon: <Shield size={16} /> },
    { label: 'Induction', value: '6 Weber Carbs', icon: <Zap size={16} /> },
    { label: 'Valvetrain', value: 'Quad-Cam', icon: <Activity size={16} /> },
  ];

  return (
    <section id="engine" className="py-24 bg-neutral-900 text-white relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex items-center justify-center">
        <span className="text-[20rem] font-serif font-bold italic select-none">V12</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionTitle 
          title="The Colombo Masterpiece" 
          subtitle="The Mechanical Heart of a Legend" 
          light
        />

        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative group">
            <div className="relative border border-white/10 p-2 bg-black shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
              {customImage ? (
                <img 
                  src={customImage} 
                  alt="Colombo V12 Engine" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                />
              ) : (
                <div className="text-center opacity-20">
                  <p className="text-[8px] uppercase tracking-[0.5em] font-bold italic">Blueprint Ref: F101.400</p>
                </div>
              )}

              {isAdmin && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-rosso text-white px-6 py-3 text-[10px] uppercase font-bold tracking-widest flex items-center space-x-3 shadow-2xl hover:scale-105 transition-transform"
                  >
                    <Camera size={16} />
                    <span>Upload Engine Asset</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </div>
              )}
            </div>
            
            <div className="absolute -bottom-6 -right-6 bg-rosso p-8 hidden md:block border-4 border-neutral-900 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.3em] font-bold mb-1">Max Power</p>
              <p className="text-4xl font-serif font-bold">340 HP</p>
              <p className="text-[9px] uppercase tracking-widest text-white/60 mt-2">@ 6200 RPM</p>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-serif text-rosso italic">"The smoothness of silk, the roar of a storm."</h3>
              <p className="text-gray-400 leading-relaxed text-lg">
                The Ferrari 400 was powered by the ultimate evolution of the Colombo V12. This engine family, which began in 1947, reached a peak of refinement in the 400 series. With four overhead camshafts and a light-alloy block, it offered effortless torque and an orchestral exhaust note that defined 1970s luxury.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Whether breathing through six twin-choke Weber carburetors or the later Bosch fuel injection system, the 4.8-liter unit provided the massive low-end power required for a 2+2 grand tourer to vanish toward the horizon.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
              {specs.map((spec, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 p-4 hover:bg-rosso/10 hover:border-rosso/30 transition-all group">
                  <div className="flex items-center space-x-3 text-rosso mb-1">
                    {spec.icon}
                    <span className="text-[9px] uppercase tracking-widest font-bold group-hover:text-white transition-colors">
                      {spec.label}
                    </span>
                  </div>
                  <p className="text-xl font-serif group-hover:translate-x-1 transition-transform">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ColomboEngine;
