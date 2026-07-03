import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Reveal } from '../../components/Animation/Reveal';
import { Maximize2, Sparkles } from 'lucide-react';

interface GalleryItem {
  id: string;
  category: 'food' | 'coffee' | 'interior' | 'events';
  title: string;
  desc: string;
  image: string;
  span?: string; // Masonry grid span configuration
}

const CATEGORIES = [
  { value: 'all', label: 'All Vibe' },
  { value: 'food', label: 'Food Items' },
  { value: 'coffee', label: 'Coffee & Matcha' },
  { value: 'interior', label: 'Cozy Interior' },
  { value: 'events', label: 'Events & Culture' },
];

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    category: 'coffee',
    title: 'Ceremonial Matcha Preparation',
    desc: 'Authentic Kyoto Uji green tea whisked using bamboo tools.',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    id: 'gal-2',
    category: 'food',
    title: 'Signature UFO Burger',
    desc: 'Our sealed-edge New York CLT, capturing juices without mess.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 'gal-3',
    category: 'interior',
    title: 'Minimalist Reading Corner',
    desc: 'Peaceful Japanese wooden aesthetics combined with reading lights.',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    span: 'md:col-span-1 md:row-span-2',
  },
  {
    id: 'gal-4',
    category: 'food',
    title: 'Golden Taiyaki Waffles',
    desc: 'Freshly baked fish-shaped waffles filled with custard.',
    image: 'https://images.unsplash.com/photo-1582772643801-b8d9600d8be9?w=800&auto=format&fit=crop&q=80',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 'gal-5',
    category: 'coffee',
    title: 'Slow Bar V-60 Drip',
    desc: 'Single origin pour-over coffee extracted with laboratory precision.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    id: 'gal-6',
    category: 'interior',
    title: 'Zen Workspace Desks',
    desc: 'Fitted workstations with charging sockets and high-speed WiFi.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    span: 'md:col-span-1 md:row-span-1',
  },
  {
    id: 'gal-7',
    category: 'events',
    title: 'Pour Over Cupping Workshop',
    desc: 'Nagpur coffee enthusiasts testing roast profiles.',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    id: 'gal-8',
    category: 'events',
    title: 'Late Night Acoustical Vibe',
    desc: 'Earthy sounds filling our cozy Japanese-themed hall.',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    span: 'md:col-span-1 md:row-span-1',
  }
];

export const Gallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  const filteredItems = useMemo(() => {
    return GALLERY_ITEMS.filter(
      (item) => selectedCategory === 'all' || item.category === selectedCategory
    );
  }, [selectedCategory]);

  return (
    <div className="pt-28 pb-24 bg-bg-primary text-text-primary min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col gap-10">
        
        {/* Header Title */}
        <div className="flex flex-col items-center text-center gap-3">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
            Pinterest Aesthetics
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-tight">
            The Iroki Vibe Gallery
          </h1>
          <p className="text-xs text-text-secondary max-w-md">
            Take a visual tour through our authentic Japanese interiors, fresh craft plates, and brewing workshops.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-2.5 overflow-x-auto w-full py-2 border-b border-border-subtle select-none scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`text-xs uppercase font-bold tracking-wider px-4 py-2 rounded-full border transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-brand-primary border-brand-primary text-white'
                  : 'bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Pinterest Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
          {filteredItems.map((item, idx) => (
            <Reveal
              key={item.id}
              direction="up"
              delay={idx * 0.05}
              className={`h-full ${item.span || 'md:col-span-1 md:row-span-1'}`}
            >
              <Card
                variant="outline"
                onClick={() => setActiveImage(item)}
                className="group relative h-full w-full p-0 overflow-hidden cursor-pointer border border-border-subtle/50 shadow-premium-sm hover:shadow-premium-md hover:border-accent-gold/40 rounded-md"
              >
                {/* Image element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />

                {/* Dark Hover Reveal Sheet */}
                <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white z-10">
                  <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-500 flex flex-col gap-1.5">
                    <span className="text-[9px] uppercase tracking-widest text-accent-gold font-bold">
                      {item.category}
                    </span>
                    <h3 className="font-serif font-bold text-base leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-white/70 leading-relaxed max-w-xs">
                      {item.desc}
                    </p>
                  </div>
                  <Maximize2 size={16} className="absolute top-4 right-4 text-white/60 group-hover:text-white transition-colors" />
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

      </div>

      {/* Lightbox Modal overlay */}
      <Modal
        isOpen={!!activeImage}
        onClose={() => setActiveImage(null)}
        title={activeImage?.title}
        size="lg"
      >
        {activeImage && (
          <div className="flex flex-col gap-4">
            <div className="rounded overflow-hidden border border-border-subtle max-h-[60vh]">
              <img
                src={activeImage.image}
                alt={activeImage.title}
                className="w-full h-full object-contain mx-auto"
              />
            </div>
            <div className="flex flex-col gap-1 px-1">
              <span className="text-xs uppercase tracking-widest text-brand-primary font-bold flex items-center gap-1">
                <Sparkles size={12} className="text-accent-gold" />
                <span>{activeImage.category}</span>
              </span>
              <p className="text-sm text-text-secondary leading-relaxed mt-1">
                {activeImage.desc}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default Gallery;
