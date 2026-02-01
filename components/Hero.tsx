
import React from 'react';
import { ChevronDown } from 'lucide-react';

interface HeroProps {
  customImage?: string;
  videoUrl?: string;
}

const Hero: React.FC<HeroProps> = ({ customImage, videoUrl }) => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        {videoUrl ? (
          <video 
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105"
          />
        ) : (
          <img 
            src={customImage || "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=90&w=2000"} 
            alt="Ferrari 400 Grand Tourer" 
            className="w-full h-full object-cover scale-105 animate-[subtle-zoom_20s_infinite_alternate]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90"></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="text-white font-serif text-5xl md:text-8xl mb-6 leading-tight drop-shadow-2xl">
          <span className="text-rosso block mb-2 opacity-0 animate-[fade-in-up_1s_ease-out_forwards]">Ferrari 400</span>
          <span className="block opacity-0 animate-[fade-in-up_1s_ease-out_0.3s_forwards]">The Grand Tourer</span>
        </h1>
        
        <p className="text-white text-xl md:text-2xl font-light tracking-wide mb-10 opacity-0 animate-[fade-in-up_1s_ease-out_0.6s_forwards] max-w-2xl mx-auto">
          Luxury Meets Performance. The First Automatic Ferrari. V12 2+2 Excellence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-[fade-in-up_1s_ease-out_0.9s_forwards]">
          <a 
            href="#history" 
            onClick={(e) => scrollToSection(e, '#history')}
            className="px-10 py-4 bg-rosso text-white font-semibold uppercase tracking-widest hover:bg-red-700 transition-all transform hover:scale-105 shadow-xl"
          >
            Discover the Legacy
          </a>
          <a 
            href="#gallery" 
            onClick={(e) => scrollToSection(e, '#gallery')}
            className="px-10 py-4 border border-white text-white font-semibold uppercase tracking-widest hover:bg-white hover:text-black transition-all transform"
          >
            View Gallery
          </a>
        </div>
      </div>

      <div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-10" 
        onClick={() => {
          const element = document.getElementById('history');
          if (element) {
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }}
      >
        <ChevronDown size={32} className="text-white/50 hover:text-rosso transition-colors" />
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-zoom {
          from { transform: scale(1.0); }
          to { transform: scale(1.1); }
        }
      `}</style>
    </header>
  );
};

export default Hero;
