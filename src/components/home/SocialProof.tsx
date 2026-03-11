"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Users, Star, ArrowRight } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  location: string;
  avatar?: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Emma L.",
    location: "Brussels",
    text: "Found the most amazing hidden chapel I never knew existed in Brussels!",
    rating: 5,
  },
  {
    id: "2",
    name: "Thomas V.",
    location: "Antwerp",
    text: "Best way to explore Belgium's secrets. The offline maps are a game changer!",
    rating: 5,
  },
  {
    id: "3",
    name: "Sophie M.",
    location: "Bruges",
    text: "Discovered spots I never knew existed. Perfect for weekend adventures.",
    rating: 5,
  },
  {
    id: "4",
    name: "Lucas D.",
    location: "Ghent",
    text: "The gamification keeps me coming back. Love the explorer badges!",
    rating: 5,
  },
  {
    id: "5",
    name: "Marie K.",
    location: "Leuven",
    text: "Found amazing local spots that aren't in any tourist guide. Highly recommend!",
    rating: 5,
  },
];

export default function SocialProof() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        const { scrollWidth, clientWidth } = scrollRef.current;
        setIsOverflowing(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    if (scrollRef.current) {
      const cardWidth = 320; // Card width + gap
      const newIndex = direction === "right" 
        ? Math.min(activeIndex + 1, testimonials.length - 1)
        : Math.max(activeIndex - 1, 0);
      
      scrollRef.current.scrollTo({
        left: newIndex * cardWidth,
        behavior: "smooth",
      });
      setActiveIndex(newIndex);
    }
  }, [activeIndex]);

  return (
    <section className="py-10 md:py-14 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 rounded-full mb-4">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">12,000+ Explorers</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Join the Adventure
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            Discover what fellow explorers are saying about finding Belgium's hidden gems.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          {isOverflowing && (
            <>
              <button
                onClick={() => scroll("left")}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-all"
                aria-label="Previous testimonial"
              >
                <ArrowRight className="w-5 h-5 rotate-180 text-slate-600" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 items-center justify-center rounded-full bg-white shadow-lg border border-slate-200 hover:bg-slate-50 transition-all"
                aria-label="Next testimonial"
              >
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </button>
            </>
          )}

          {/* Scroll Container */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide md:px-8"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {testimonials.map((testimonial, index) => (
              <article
                key={testimonial.id}
                className="flex-shrink-0 w-[280px] md:w-[320px] snap-align-start"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="h-full p-5 md:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-sm md:text-base text-slate-700 leading-relaxed mb-4">
                    "{testimonial.text}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  scrollRef.current?.scrollTo({
                    left: index * 280,
                    behavior: "smooth",
                  });
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-6 bg-emerald-500"
                    : "bg-slate-300"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats Banner */}
        <div className="mt-10 md:mt-12 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-emerald-600">150+</p>
            <p className="text-xs md:text-sm text-slate-600">Hidden Gems</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-emerald-600">12K+</p>
            <p className="text-xs md:text-sm text-slate-600">Active Explorers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-emerald-600">50K+</p>
            <p className="text-xs md:text-sm text-slate-600">Visits Logged</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

