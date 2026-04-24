"use client";
import React from "react";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFilterStore } from "@/lib/stores";

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideDuration = 10000;
  const router = useRouter();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const {
    categories: categoriesData,
    loading,
    error,
  } = useFilterStore();


  useEffect(() => {
    if (isPaused || !categoriesData || categoriesData.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % categoriesData.length);
    }, slideDuration);

    return () => clearInterval(timer);
  }, [isPaused, categoriesData.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIndex(
          (prev) => (prev - 1 + categoriesData.length) % categoriesData.length,
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % categoriesData.length);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [categoriesData.length]);

  const scrollToContent = () => {
    const content = document.getElementById("main-content");
    if (content) content.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubcategoryClick = (category: any, subcategory: any) => {
    const params = new URLSearchParams();
    params.set("subcategories", subcategory.name.toLowerCase());
    router.push(
      `/collections/${encodeURIComponent(category.name)}?${params.toString()}`,
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setActiveIndex((prev) => (prev + 1) % categoriesData.length);
    } else if (isRightSwipe) {
      setActiveIndex(
        (prev) => (prev - 1 + categoriesData.length) % categoriesData.length,
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <section className="relative h-[70vh] w-full bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        <div className="relative z-10 h-full max-w-[1800px] mx-auto px-8 flex flex-col justify-center">
          <div className="max-w-4xl">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-32 mb-6"></div>
              <div className="h-20 bg-gray-700 rounded w-96 mb-4"></div>
              <div className="h-12 bg-gray-700 rounded w-64"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error || !categoriesData || categoriesData.length === 0) {
    return (
      <section className="relative h-[70vh] w-full bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        <div className="relative z-10 h-full max-w-[1800px] mx-auto px-8 flex flex-col justify-center">
          <div className="max-w-4xl text-center">
            <h2 className="text-white text-5xl font-serif leading-[0.85] tracking-tighter mb-4">
              Discover Our Collection
            </h2>
            <p className="text-white/80 text-xl mb-8">
              Explore our handcrafted sarees and traditional wear
            </p>
            <button
              onClick={() => router.push("/collections")}
              className="bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Shop Now
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative h-[70vh] w-full bg-zinc-950 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product categories slideshow"
      tabIndex={0}
    >
      {/* Background Layers */}
      {categoriesData.map((cat, idx) => (
        <div
          key={cat.id}
          className={`absolute inset-0 transition-all duration-[1500ms] ease-out ${activeIndex === idx ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}
        >
          <img
            src={cat?.imageUrl || ""}
            className="w-full h-full object-cover brightness-[0.6]"
            alt={cat?.name}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        </div>
      ))}

      {/* Content Layer */}
      <div className="relative z-10 h-full max-w-[1800px] mx-auto px-8 flex flex-col justify-center">
        <div className="max-w-4xl">
          <p className="text-amber-500 font-bold tracking-[0.5em] uppercase text-xs mb-6 overflow-hidden">
            <span className="inline-block animate-in slide-in-from-bottom-full duration-700">
              Premium Collection
            </span>
          </p>
          <h2 className="text-white text-5xl font-serif leading-[0.85] tracking-tighter">
            {categoriesData[activeIndex]?.name}
            <span className="mt-2 block italic font-light text-2xl tracking-wide opacity-80">
              {categoriesData[activeIndex]?.description}
            </span>
          </h2>

          <div className="flex flex-wrap gap-3 md:gap-4 mt-8 md:mt-12">
            {categoriesData?.[activeIndex]?.subcategories?.map(
              (sub: any, sIdx: any) => (
                <button
                  key={sub.id}
                  onClick={() =>
                    handleSubcategoryClick(categoriesData[activeIndex], sub)
                  }
                  style={{ animationDelay: `${sIdx * 100}ms` }}
                  className="group bg-white/10 backdrop-blur-md border border-white/20 px-4 md:px-6 py-3 md:py-4 rounded-full flex items-center gap-3 md:gap-4 text-white hover:bg-white hover:text-black transition-all duration-500 animate-in fade-in slide-in-from-bottom-4"
                >
                  <div className="text-left">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100">
                      Explore
                    </p>
                    <p className="font-medium text-xs md:text-sm">{sub.name}</p>
                  </div>

                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-black/20 group-hover:rotate-45 transition-all">
                    <ArrowUpRight
                      size={10}
                      className="text-white group-hover:text-black w-5 h-5 md:w-10 md:h-10"
                    />
                  </div>
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 left-8 right-8 z-20 flex justify-between items-end">
        <div className="flex gap-2 md:gap-4">
          {categoriesData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className="relative group transition-all"
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={activeIndex === idx ? "true" : "false"}
              role="tab"
            >
              {/* Mobile: Dots */}
              <div className="md:hidden w-2 h-2 rounded-full bg-white/20 group-hover:bg-white/40 transition-all">
                <div
                  className={`w-2 h-2 rounded-full bg-amber-500 transition-all ${activeIndex === idx ? "opacity-100 scale-125" : "opacity-0"}`}
                />
              </div>

              {/* Desktop: Bars */}
              <div className="hidden md:block relative h-1 w-24 bg-white/20 overflow-hidden group transition-all">
                <div
                  className={`absolute inset-0 bg-amber-500 transition-all ${activeIndex === idx && !isPaused ? "translate-x-0" : "-translate-x-full"}`}
                  style={{
                    transitionDuration:
                      activeIndex === idx && !isPaused
                        ? `${slideDuration}ms`
                        : "0ms",
                    transitionTimingFunction: "linear",
                  }}
                />
                <span
                  className={`absolute -top-6 left-0 text-[10px] font-bold tracking-widest transition-opacity duration-500 ${activeIndex === idx ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                >
                  0{idx + 1}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-12 text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase">
          <span className="hover:text-white cursor-pointer transition-colors">
            Instagram
          </span>
          <span className="text-white/20">
            Use ← → arrows to navigate • Space to pause
          </span>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        onClick={scrollToContent}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2 animate-bounce cursor-pointer z-20 hover:text-amber-500 transition-colors"
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
          Explore
        </span>
        <ArrowDown size={14} />
      </div>
    </section>
  );
}
