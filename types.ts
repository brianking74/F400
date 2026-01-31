
export interface CarVersion {
  id: string;
  name: string;
  year: string;
  description: string;
  imageUrl: string;
  specs: {
    engine: string;
    power: string;
    transmission: string;
    topSpeed: string;
  };
}

export interface Owner {
  id: string;
  name: string;
  description: string;
  fact: string;
  imageUrl: string;
}

export interface GalleryImage {
  id: number;
  url: string;
  category: 'Exterior' | 'Interior' | 'Details';
  caption: string;
}
