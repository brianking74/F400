
import { CarVersion, Owner, GalleryImage } from './types';

export const COLORS = {
  ROSSO: '#FF2800',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  LIGHT_GRAY: '#F8F8F8',
  CHARCOAL: '#333333',
  SILVER: '#C0C0C0',
};

// DO NOT MODIFY THIS PROMPT - IT IS THE STABLE HERO BANNER SOURCE
export const HERO_PROMPT = "A red Ferrari 400 driving on a winding coastal road at sunset, high angle shot, cinematic lighting, warm orange and yellow sky, motion blur on the wheels, professional automotive photography.";

export const HISTORY_PROMPT = "Studio photography of a classic 1977 Ferrari 400 grand tourer, Rosso Corsa red, sharp angular three-box silhouette, Pininfarina wedge design, perfectly straight horizontal waistline, five-spoke alloy wheels, low front nose with closed pop-up headlights, clean white background, photorealistic 1970s Italian aesthetic.";

export const VERSIONS: (CarVersion & { prompt: string })[] = [
  {
    id: '400gt',
    name: 'Ferrari 400 GT',
    year: '1976–1979',
    prompt: "Side profile of a red 1976 Ferrari 400 GT, sharp horizontal lines, long front hood, flat rear trunk deck, 1970s Pininfarina wedge shape, star-shaped 5-spoke wheels, professional automotive photography.",
    description: 'The purist’s choice. Equipped with a 5-speed manual gearbox and six Weber carburetors, it offered an unfiltered V12 experience for those who preferred total control.',
    imageUrl: '',
    specs: {
      engine: '4.8L Colombo V12',
      power: '340 HP',
      transmission: '5-Speed Manual',
      topSpeed: '245 km/h'
    }
  },
  {
    id: '400auto',
    name: 'Ferrari 400 Automatic',
    year: '1976–1979',
    prompt: "A 1978 Ferrari 400 Automatic in Rosso Corsa, rear three-quarter view, showcasing the four round circular red taillights and quad exhaust pipes, angular 1970s bodywork, parked in a luxury Italian villa driveway.",
    description: 'A historic milestone. The first production Ferrari to offer a factory automatic transmission, utilizing a robust GM Turbo-Hydramatic 3-speed for ultimate grand touring luxury.',
    imageUrl: '',
    specs: {
      engine: '4.8L Colombo V12',
      power: '340 HP',
      transmission: '3-Speed Automatic',
      topSpeed: '240 km/h'
    }
  },
  {
    id: '400i',
    name: 'Ferrari 400i',
    year: '1979–1985',
    prompt: "Frontal three-quarter view of a silver 1980 Ferrari 400i, sharp angular edges, Pininfarina logo on the lower side panel, executive 1980s grand tourer look, professional studio lighting.",
    description: 'The evolution. Introducing Bosch K-Jetronic fuel injection, the 400i refined the V12’s delivery while meeting stricter global emissions standards.',
    imageUrl: '',
    specs: {
      engine: '4.8L V12 (Injected)',
      power: '310 HP',
      transmission: 'Auto/Manual',
      topSpeed: '235 km/h'
    }
  }
];

export const GALLERY_PROMPTS: (GalleryImage & { prompt: string })[] = [
  // Exterior (3)
  { id: 1, category: 'Exterior', url: '', prompt: 'Side profile silhouette of a red Ferrari 400, perfectly horizontal lines, sharp wedge design, 1970s automotive poster aesthetic.', caption: 'The Pininfarina silhouette is a study in 1970s wedge-design elegance.' },
  { id: 4, category: 'Exterior', url: '', prompt: 'Rear view of a red Ferrari 400, four round circular taillights, sharp rear deck, chrome badging, quad exhaust.', caption: 'Dramatic rear view showing the iconic quad round taillights.' },
  { id: 7, category: 'Exterior', url: '', prompt: 'Cinematic front three-quarter view of a Rosso Corsa Ferrari 400 driving on a coastal road at golden hour, headlights pop-up closed, motion blur.', caption: 'The 400 in its natural element: the open road.' },
  
  // Interior (3)
  { id: 2, category: 'Interior', url: '', prompt: 'Luxurious 1970s Ferrari 400 cabin, tan Connolly leather, thick wood-rimmed steering wheel, silver gauges, elegant grand tourer interior.', caption: 'Luxurious Connolly leather and wood-accented instruments define the cabin.' },
  { id: 6, category: 'Interior', url: '', prompt: 'Center console of a Ferrari 400 Automatic, showing the T-shaped shift lever, tan leather surrounding, 1970s luxury details.', caption: 'The center console featuring the groundbreaking automatic transmission.' },
  { id: 8, category: 'Interior', url: '', prompt: 'Detailed shot of the Ferrari 400 rear 2+2 seats, premium tan leather with distinct stitching, luxurious 1970s grand tourer upholstery.', caption: 'The 2+2 configuration offered uncompromising luxury for four.' },

  // Details (3)
  { id: 3, category: 'Details', url: '', prompt: 'Close-up of a Ferrari 400 Colombo V12 engine, red crackle finish, silver intake manifolds, high detail mechanical photography.', caption: 'A V12 engine block, heart of the 400 series.' },
  { id: 5, category: 'Details', url: '', prompt: 'Macro shot of the black rectangular front grille of a 1977 Ferrari 400 with a chrome prancing horse badge.', caption: 'Classic Ferrari badge detail on the front nose.' },
  { id: 9, category: 'Details', url: '', prompt: 'Macro close-up of the "400 Automatic" chrome script badge on the rear trunk of a Ferrari, 1970s typography, high polished finish.', caption: 'Distinctive 1970s badging detail.' },
];

export const OWNERS: (Owner & { prompt: string })[] = [
  {
    id: 'enzo',
    name: 'Enzo Ferrari',
    description: 'The Commendatore',
    prompt: 'Macro artistic shot of the Ferrari 400 steering wheel badge, yellow background with black prancing horse, black and white style.',
    fact: 'Enzo Ferrari himself used a 400 Automatic as his personal daily driver for many years, appreciating its refined V12 and ease of use.',
    imageUrl: ''
  },
  {
    id: 'jagger',
    name: 'Mick Jagger',
    description: 'Rock & Roll Legend',
    prompt: 'Elegant macro shot of the Pininfarina logo script on a Ferrari 400, chrome texture, black and white noir style.',
    fact: 'The Rolling Stones frontman was a known enthusiast of the series, owning a silver 400i that perfectly matched his high-profile lifestyle.',
    imageUrl: ''
  },
  {
    id: 'clapton',
    name: 'Eric Clapton',
    description: 'Virtuoso Musician',
    prompt: 'Close-up of the star-shaped five-spoke wheel of a Ferrari 400, silver alloy, black and white artistic photography.',
    fact: 'A lifelong Ferrari collector, Clapton included the 400 series in his legendary garage, valuing its understated elegance over flashier models.',
    imageUrl: ''
  }
];
