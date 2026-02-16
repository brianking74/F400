import React from 'react';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
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
    <footer className="bg-black text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <h2 className="text-3xl font-serif font-bold text-rosso mb-6">F400 Homage</h2>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              An independent archival project dedicated to the legacy, history, and craftsmanship of the Ferrari 400 series. Bridging the gap between the classic V12 era and modern luxury cruising.
            </p>
          </div>
          
          <div>
            <h4 className="uppercase tracking-widest text-sm font-bold mb-6">Explore</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#history" onClick={(e) => scrollToSection(e, '#history')} className="hover:text-rosso transition-colors">Heritage</a></li>
              <li><a href="#versions" onClick={(e) => scrollToSection(e, '#versions')} className="hover:text-rosso transition-colors">The Models</a></li>
              <li><a href="#owners" onClick={(e) => scrollToSection(e, '#owners')} className="hover:text-rosso transition-colors">Collectors</a></li>
              <li><a href="#gallery" onClick={(e) => scrollToSection(e, '#gallery')} className="hover:text-rosso transition-colors">Visual Archive</a></li>
            </ul>
          </div>

          <div>
            <h4 className="uppercase tracking-widest text-sm font-bold mb-6">Connect</h4>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-rosso transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-rosso transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-rosso transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-rosso transition-colors"><Mail size={20} /></a>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:row justify-between items-center text-xs text-gray-600 uppercase tracking-widest gap-4">
          <p>© {new Date().getFullYear()} Ferrari 400 Archive. This is a non-commercial homage site.</p>
          <div className="flex space-x-8">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Credits</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;