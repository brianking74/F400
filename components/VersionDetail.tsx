
import React, { useEffect } from 'react';
import { ArrowLeft, Zap, Settings, History, Info, ChevronRight } from 'lucide-react';
import { CarVersion } from '../types';

interface VersionDetailProps {
  version: CarVersion;
  imageUrl: string;
  onBack: () => void;
}

const VersionDetail: React.FC<VersionDetailProps> = ({ version, imageUrl, onBack }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black animate-in fade-in slide-in-from-right duration-700">
      <div className="bg-black py-6 px-6 sticky top-0 z-50 shadow-xl border-b border-rosso/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-white hover:text-rosso transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs uppercase tracking-[0.3em] font-bold">Back to Heritage</span>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-serif font-bold text-rosso">F400</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40">Archive Dept.</span>
          </div>
        </div>
      </div>

      <div className="relative h-[60vh] bg-neutral-900 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={version.name} 
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-12 h-[1px] bg-rosso animate-pulse"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-12 max-w-7xl mx-auto">
          <span className="bg-rosso text-white text-[10px] font-bold px-4 py-2 uppercase tracking-[0.4em] mb-4 inline-block">
            {version.year}
          </span>
          <h1 className="text-6xl md:text-8xl font-serif font-bold mb-4 tracking-tight">
            {version.name}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <div className="flex items-center space-x-4 mb-6">
                <Info size={24} className="text-rosso" />
                <h2 className="text-3xl font-serif">Historical Context</h2>
              </div>
              <div className="prose prose-lg text-gray-700 leading-relaxed max-w-none">
                <p className="text-xl mb-6 font-light italic text-gray-900 border-l-4 border-rosso pl-8">
                  {version.description}
                </p>
                <p>
                  As an evolution of the 365 GT4 2+2, the {version.name} represents a peak in 1970s Italian grand touring. Designed by Leonardo Fioravanti at Pininfarina, the car featured a silhouette that broke away from the curvaceous 1960s, embracing a sharp, angular "wedge" philosophy that would define high-end automotive design for a decade.
                </p>
                <p>
                  The interior was a masterclass in luxury, utilizing only the finest Connolly leathers and high-quality veneers. Despite being a high-performance Ferrari, the focus was on effortless speed, making it the weapon of choice for European industrialists and cultural icons alike.
                </p>
              </div>
            </section>

            <section className="bg-gray-50 p-10 border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-serif mb-8 border-b border-gray-200 pb-4 flex items-center">
                <Settings size={20} className="mr-3 text-rosso" />
                Technical Narrative
              </h3>
              <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600">
                <div className="space-y-4">
                  <p>
                    <strong className="text-black">Engine Architecture:</strong> The {version.specs.engine} used a 60-degree V12 block, a direct descendant of the legendary Colombo designs. It featured four overhead camshafts and, depending on the variant, either Weber carburetors or Bosch K-Jetronic fuel injection.
                  </p>
                  <p>
                    <strong className="text-black">Chassis:</strong> A tubular steel spaceframe provided the structural integrity required for high-speed stability, while independent suspension at all four corners ensured a refined ride quality.
                  </p>
                </div>
                <div className="space-y-4">
                  <p>
                    <strong className="text-black">Dynamic Control:</strong> The {version.specs.transmission} was specifically tuned to match the V12's torque curve, providing smooth transitions whether navigating city streets or cruising the Autostrada at its {version.specs.topSpeed} limit.
                  </p>
                  <p>
                    <strong className="text-black">Braking & Wheels:</strong> Ventilated discs provided consistent stopping power, housed behind the iconic star-shaped five-spoke alloy wheels that have since become a signature of the era.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="bg-black text-white p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rosso/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h3 className="text-xl font-serif mb-10 tracking-widest uppercase border-b border-white/10 pb-4">
                Full Specifications
              </h3>
              <div className="space-y-8">
                <div className="group">
                  <div className="flex items-center text-rosso text-[10px] font-bold tracking-[0.3em] uppercase mb-1">
                    <Zap size={14} className="mr-2" /> Power Unit
                  </div>
                  <div className="text-2xl font-serif group-hover:text-rosso transition-colors">{version.specs.engine}</div>
                  <div className="text-white/40 text-xs mt-1">Quad-cam Colombo V12</div>
                </div>
                <div className="group">
                  <div className="flex items-center text-rosso text-[10px] font-bold tracking-[0.3em] uppercase mb-1">
                    <History size={14} className="mr-2" /> Output
                  </div>
                  <div className="text-2xl font-serif group-hover:text-rosso transition-colors">{version.specs.power}</div>
                  <div className="text-white/40 text-xs mt-1">Net Brake Horsepower</div>
                </div>
                <div className="group">
                  <div className="flex items-center text-rosso text-[10px] font-bold tracking-[0.3em] uppercase mb-1">
                    <Settings size={14} className="mr-2" /> Drivetrain
                  </div>
                  <div className="text-2xl font-serif group-hover:text-rosso transition-colors">{version.specs.transmission}</div>
                  <div className="text-white/40 text-xs mt-1">Rear Wheel Drive</div>
                </div>
                <div className="group">
                  <div className="flex items-center text-rosso text-[10px] font-bold tracking-[0.3em] uppercase mb-1">
                    <ChevronRight size={14} className="mr-2" /> Top Speed
                  </div>
                  <div className="text-4xl font-serif text-rosso">{version.specs.topSpeed}</div>
                  <div className="text-white/40 text-xs mt-1">Aerodynamically Limited</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default VersionDetail;
