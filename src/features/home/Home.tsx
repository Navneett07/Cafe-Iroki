import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThreeHero } from './ThreeHero';
import { Reveal } from '../../components/Animation/Reveal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CAFE_METADATA } from '../../constants';
import { REVIEWS } from '../../data/reviews';
import { 
  Coffee, 
  MapPin, 
  Phone, 
  Users, 
  BookOpen, 
  Laptop, 
  Sparkles, 
  ArrowRight,
  MessageSquareCode
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // Statistics counters animated trigger
  const [stats, setStats] = useState({ coffeeServed: 0, reservations: 0, satisfaction: 0 });

  useEffect(() => {
    // Simple mock counter animation
    const interval = setInterval(() => {
      setStats((prev) => {
        const nextCoffee = prev.coffeeServed < 1240 ? prev.coffeeServed + 40 : 1240;
        const nextRes = prev.reservations < 450 ? prev.reservations + 15 : 450;
        const nextSat = prev.satisfaction < 98 ? prev.satisfaction + 2 : 98;
        
        if (nextCoffee === 1240 && nextRes === 450 && nextSat === 98) {
          clearInterval(interval);
        }
        return { coffeeServed: nextCoffee, reservations: nextRes, satisfaction: nextSat };
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const signatureDishes = [
    {
      id: 'burger-clt',
      name: 'New York CLT UFO Burger',
      desc: 'Our signature sealed-edge burger containing rich cheddar cheese, house sauce, and crispy salad.',
      price: '₹295',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'taiyaki-custard',
      name: 'Custard Cream Taiyaki',
      desc: 'Traditional Japanese fish-shaped waffle with Madagascar vanilla custard and a touch of sugar glaze.',
      price: '₹245',
      image: 'https://images.unsplash.com/photo-1582772643801-b8d9600d8be9?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'matcha-raspberry',
      name: 'Iced Raspberry Matcha',
      desc: 'A striking layered drink of ceremonial green tea whisked over cold raspberry foam and oat milk.',
      price: '₹245',
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
    }
  ];

  const timelineSteps = [
    { time: '08:00 AM', title: 'Morning Brew Focus', desc: 'Sip on pour-overs or ceremonial matcha while working in our quiet designated workspace corners.' },
    { time: '01:00 PM', title: 'Ramen & Lunch Bites', desc: 'Indulge in steaming hot bowls of Spicy Tofu or Hot Mushroom Ramen, perfect for mid-day fuel.' },
    { time: '05:00 PM', title: 'Evening Chill Hangout', desc: 'Unwind with friends over caramelized banana Taiyakis and signature clean sealed UFO Burgers.' },
    { time: '09:00 PM', title: 'Late Night Coffee & Reads', desc: 'Catch up on your favorite manga or sketch at our peaceful tables. Open till 11 PM.' }
  ];

  return (
    <div className="relative overflow-x-hidden min-h-screen">
      
      {/* 1. Cinematic Hero Section */}
      <section className="relative min-h-screen md:h-screen w-full flex items-center bg-brand-dark/20 text-white pt-24 pb-12 md:pt-16 md:pb-0">
        
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/40 via-brand-dark/25 to-bg-primary z-10 transition-colors" />

        {/* 3D WebGL Canvas Background */}
        <ThreeHero />

        {/* Floating Sakura Petals overlay backup (CSS anim) */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute bg-pink-200/40 rounded-full animate-sakura-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${5 + Math.random() * 10}%`,
                width: `${4 + Math.random() * 10}px`,
                height: `${6 + Math.random() * 12}px`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 8}s`,
              }}
            />
          ))}
        </div>

        {/* Main Hero Contents */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 w-full relative z-20 flex flex-col items-start gap-4">
          <Reveal direction="up" delay={0.2}>
            <span className="text-xs uppercase tracking-widest text-accent-gold font-bold flex items-center gap-2">
              <Sparkles size={14} className="animate-spin-slow" />
              Nagpur's Premium Japanese Experience
            </span>
          </Reveal>

          <Reveal direction="up" delay={0.4}>
            <h1 className="text-3xl md:text-6xl xl:text-7xl font-serif font-black tracking-tight leading-none text-text-primary dark:text-white drop-shadow-sm max-w-4xl">
              Experience Japanese Café Culture in Nagpur
            </h1>
          </Reveal>

          <Reveal direction="up" delay={0.6}>
            <p className="text-sm md:text-lg text-text-secondary dark:text-white/80 max-w-xl leading-relaxed mt-2">
              Step out of the busy world into Cafe Iroki. Explore premium single-origin pour overs, artisan sealed-edge UFO burgers, and authentic Uji matcha green tea bowls.
            </p>
          </Reveal>

          <Reveal direction="up" delay={0.8} className="mt-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="gold"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate('/menu')}
              >
                Order Online
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-text-primary border-text-primary dark:text-white dark:border-white hover:bg-white/10"
                onClick={() => navigate('/reserve')}
              >
                Reserve Table
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20 text-text-secondary">
          <span className="text-[9px] uppercase tracking-widest font-bold">Scroll Down</span>
          <div className="w-[1.5px] h-12 bg-border-subtle/50 relative overflow-hidden rounded">
            <div className="absolute top-0 left-0 right-0 h-4 bg-brand-primary rounded animate-bounce" />
          </div>
        </div>
      </section>

      {/* 2. About / Story Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 md:px-12 bg-bg-primary text-text-primary">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <Reveal direction="left" className="space-y-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
                The Craft of Iroki
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight">
                Where Peaceful Japanese Minimalism Meets Specialty Coffee
              </h2>
            </div>
            
            <p className="text-sm text-text-secondary leading-relaxed">
              Cafe Iroki was built to act as a peaceful sanctuary in Nagpur. Inspired by Japanese Wabi-Sabi aesthetics, our layout merges warm wood craft, earthy pottery, and curated reading rows.
            </p>
            
            {/* Features lists */}
            <div className="grid grid-cols-2 gap-6 pt-4 text-xs font-semibold">
              <div className="flex items-center gap-2.5">
                <Laptop className="text-brand-primary h-5 w-5" />
                <span>Peaceful Workspace</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BookOpen className="text-brand-primary h-5 w-5" />
                <span>Reading Book Nooks</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="text-brand-primary h-5 w-5" />
                <span>Ideal for Couples & Families</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Coffee className="text-brand-primary h-5 w-5" />
                <span>Artisanal Single Origin Coffee</span>
              </div>
            </div>
          </Reveal>

          {/* Visual card overlays block */}
          <Reveal direction="right" className="relative flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-lg overflow-hidden border border-border-subtle shadow-premium-lg">
              <img
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=85"
                alt="Cafe interior view"
                className="w-full h-full object-cover filter contrast-105 hover:scale-105 transition-all duration-700"
              />
              {/* Float badge */}
              <div className="absolute bottom-6 left-6 glassmorphism p-4 rounded-md border border-white/20 text-xs flex items-center gap-3">
                <div className="p-2 rounded bg-accent-gold text-white font-bold">
                  ★ 4.7
                </div>
                <div>
                  <p className="font-bold text-white">Cafe Iroki</p>
                  <p className="text-[10px] text-white/80">61 Verified Map Reviews</p>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* 3. Signature Highlight Cards */}
      <section className="py-24 bg-bg-secondary text-text-primary">
        <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col gap-12">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
                Special Creations
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight">
                Our Signature Dishes
              </h2>
            </div>
            <Button
              variant="outline"
              size="md"
              rightIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/menu')}
            >
              View Full Menu
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {signatureDishes.map((dish, i) => (
              <Reveal key={dish.id} direction="up" delay={i * 0.15}>
                <Card
                  variant="premium"
                  hover3dTilt={true}
                  className="group flex flex-col gap-4 h-full p-4 hover:border-accent-gold/40 hover:shadow-glow-gold"
                >
                  <div className="aspect-[4/3] rounded overflow-hidden relative">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <span className="absolute top-3 right-3 bg-brand-dark/80 text-accent-gold text-xs px-2.5 py-1 rounded font-bold backdrop-blur-xs">
                      {dish.price}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 flex-1">
                    <h3 className="font-serif font-bold text-lg group-hover:text-brand-primary transition-colors">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed flex-1">
                      {dish.desc}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-1 p-0 hover:bg-transparent hover:text-brand-primary group-hover:translate-x-1 transition-transform"
                      onClick={() => navigate('/menu')}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">Order Now</span>
                      <ArrowRight size={12} />
                    </Button>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* 4. Cafe Experience Timeline */}
      <section className="py-24 max-w-7xl mx-auto px-4 md:px-12 text-text-primary">
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
            Daily Timeline
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight">
            The Cafe Iroki Experience
          </h2>
          <p className="text-xs text-text-secondary max-w-md">
            From the quiet early-morning focus hours to relaxing late night wind downs, see how Iroki fits your day.
          </p>
        </div>

        <div className="relative border-l border-border-subtle max-w-3xl mx-auto pl-6 sm:pl-12 space-y-12">
          {timelineSteps.map((step, idx) => (
            <Reveal key={idx} direction="up" delay={idx * 0.1}>
              <div className="relative">
                {/* Timeline node */}
                <div className="absolute left-[-31px] sm:left-[-57px] top-1 h-4 w-4 rounded-full bg-brand-primary border border-bg-primary flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-sm font-bold text-accent-gold">{step.time}</span>
                  <h4 className="text-base font-sans font-bold text-text-primary">{step.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed mt-1">{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. Testimonials Slider Section */}
      <section className="py-24 bg-bg-secondary/40 text-text-primary border-t border-border-subtle/50">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center gap-10">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
              Guest Testimonials
            </span>
            <h2 className="text-3xl font-serif font-black tracking-tight">
              Aesthetic Reviews from Nagpur
            </h2>
          </div>

          <Reveal direction="up" className="w-full">
            <Card variant="premium" className="p-8 md:p-12 relative flex flex-col items-center gap-6 shadow-premium-lg border-accent-gold/20">
              {/* Star Rating display */}
              <div className="flex items-center gap-1 text-accent-gold text-sm">
                {Array.from({ length: REVIEWS[currentReviewIndex].rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>

              {/* Review Text block */}
              <p className="font-serif italic text-base md:text-lg text-text-primary leading-relaxed max-w-2xl">
                "{REVIEWS[currentReviewIndex].text}"
              </p>

              {/* Guest name */}
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold font-sans text-sm tracking-wide">
                  {REVIEWS[currentReviewIndex].authorName}
                </span>
                <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">
                  {REVIEWS[currentReviewIndex].relativeTime} • Verified Maps Reviewer
                </span>
              </div>

              {/* Category tags */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {REVIEWS[currentReviewIndex].tags?.map((tag) => (
                  <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/10">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Slider Arrows controls */}
              <div className="flex items-center gap-6 mt-4">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentReviewIndex((prev) =>
                      prev === 0 ? REVIEWS.length - 1 : prev - 1
                    )
                  }
                  className="p-2 border border-border-subtle/50 rounded-full hover:bg-border-subtle/20 hover:text-brand-primary active:scale-90 transition-all cursor-pointer"
                  aria-label="Previous Review"
                >
                  ←
                </button>
                <span className="text-xs font-semibold text-text-secondary select-none">
                  {currentReviewIndex + 1} / {REVIEWS.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentReviewIndex((prev) =>
                      prev === REVIEWS.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="p-2 border border-border-subtle/50 rounded-full hover:bg-border-subtle/20 hover:text-brand-primary active:scale-90 transition-all cursor-pointer"
                  aria-label="Next Review"
                >
                  →
                </button>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* 6. Metrics & Floating Contacts */}
      <section className="py-16 bg-bg-secondary border-t border-b border-border-subtle text-text-primary text-center">
        <div className="max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-4xl font-serif font-bold text-brand-primary">{stats.coffeeServed}+</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Specialty Drinks Served</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-4xl font-serif font-bold text-brand-primary">{stats.reservations}+</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Tables Booked Monthly</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-4xl font-serif font-bold text-brand-primary">{stats.satisfaction}%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Aesthetic & Vibe Rating</span>
          </div>
        </div>
      </section>

      {/* 6. Nagpur Map & Direction Contacts */}
      <section className="py-24 max-w-7xl mx-auto px-4 md:px-12 text-text-primary">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <Reveal direction="left" className="space-y-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-widest text-brand-primary font-bold">
                Find Your Sanctuary
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight">
                Conveniently Located in Samarth Nagar Nagpur
              </h2>
            </div>
            
            <p className="text-sm text-text-secondary leading-relaxed">
              We are located right off Wardha Road, near the Ajni Metro Station. Perfect for a quick coffee stop before your flight, a workspace day, or a cozy evening bite.
            </p>

            <ul className="space-y-4 text-xs">
              <li className="flex items-start gap-3">
                <MapPin className="text-brand-primary h-5 w-5 flex-shrink-0" />
                <span>
                  <strong>Address:</strong> {CAFE_METADATA.address.street}, Nagpur, {CAFE_METADATA.address.pincode}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-brand-primary h-5 w-5 flex-shrink-0" />
                <span>
                  <strong>Call Us:</strong> <a href={`tel:${CAFE_METADATA.phone}`} className="hover:underline">{CAFE_METADATA.phoneDisplay}</a>
                </span>
              </li>
            </ul>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${CAFE_METADATA.coordinates.lat},${CAFE_METADATA.coordinates.lng}`, '_blank')}
              >
                Get Directions
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => window.open(CAFE_METADATA.whatsappUrl, '_blank')}
              >
                WhatsApp Chat
              </Button>
            </div>
          </Reveal>

          {/* Interactive Google Map Mock */}
          <Reveal direction="right" className="h-[360px] rounded-lg overflow-hidden border border-border-subtle shadow-premium-lg relative group">
            <div className="absolute inset-0 bg-cover bg-center filter grayscale contrast-125 dark:invert" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80')" }}>
              <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-brand-dark/10 transition-colors" />
            </div>
            
            {/* Visual map pin markers */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-12 w-12 rounded-full bg-brand-primary/45 animate-ping" />
                <div className="relative h-6 w-6 rounded-full bg-brand-primary border-2 border-white flex items-center justify-center shadow-premium-lg">
                  <Coffee size={12} className="text-white" />
                </div>
              </div>
              <span className="mt-2 text-[10px] font-sans font-bold uppercase tracking-wider text-brand-dark bg-white py-1 px-2.5 rounded shadow-premium-md">
                Cafe Iroki
              </span>
            </div>
          </Reveal>

        </div>
      </section>

      {/* Floating Action Elements (WhatsApp + Book) */}
      <div className="fixed bottom-6 left-6 z-30 flex flex-col gap-3">
        <a
          href={CAFE_METADATA.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-[#25D366] text-white rounded-full shadow-premium-lg hover:scale-105 transition-all active:scale-95"
          title="Chat on WhatsApp"
        >
          <MessageSquareCode size={20} />
        </a>
      </div>

    </div>
  );
};
export default Home;
