/* =====================================================
 *  HeroCarousel — Auto Scroll + Mobile Dots + Clean Logic
 * ===================================================== */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Item } from "@/types";

export const HeroCarousel = () => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  const { data: featuredBooks = [] } = useQuery({
    queryKey: ["featured-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as Item[];
    },
  });

  /* =====================================================
   *  Auto-scroll (slow) + Sync Slide State + Pause on Interaction
   * ===================================================== */
  useEffect(() => {
    if (!api) return;

    // Keep UI synced to carousel
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);

    // Pause auto-scroll when user interacts
    const onPointerDown = () => {
      setIsUserInteracting(true);
    };

    const onPointerUp = () => {
      // Resume auto-scroll after 3 seconds of no interaction
      setTimeout(() => setIsUserInteracting(false), 3000);
    };

    api.on("pointerDown", onPointerDown);
    api.on("pointerUp", onPointerUp);

    return () => {
      api.off("select", onSelect);
      api.off("pointerDown", onPointerDown);
      api.off("pointerUp", onPointerUp);
    };
  }, [api]);

  // Separate effect for auto-scroll that respects user interaction
  useEffect(() => {
    if (!api || isUserInteracting) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 8000);

    return () => clearInterval(interval);
  }, [api, isUserInteracting]);

  if (!featuredBooks.length) return null;

  return (
    <div className="relative w-full overflow-hidden min-h-[500px] md:min-h-[550px] lg:min-h-[600px]">

      {/* ===== BACKGROUND IMAGE ===== */}
      <div className="absolute inset-0">
        <img
          src={
            featuredBooks[current]?.hero_img_url ||
            featuredBooks[current]?.img_url ||
            "/placeholder.svg"
          }
          alt="Background"
          className="w-full h-full object-cover blur-3xl brightness-[0.55] scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative w-full mx-auto px-6 md:px-10 pt-20 pb-10 flex items-center justify-center">
        <Carousel
          setApi={setApi}
          opts={{ align: "center", loop: true }}
          className="w-full max-w-6xl"
        >
          <CarouselContent>
            {featuredBooks.map((book) => (
              <CarouselItem key={book.id} className="w-full">
                <div
                  className="
                    flex flex-col md:flex-row
                    items-center justify-between
                    gap-6 md:gap-10
                    w-full
                    md:ml-6 lg:ml-10
                  "
                >
                  {/* ===== Mobile Image ===== */}
                  <div className="w-full md:w-[53%] md:hidden flex justify-center">
                    <div className="relative">
                      {book.on_sale && book.sale_percentage && (
                        <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground px-3 py-1 rounded-md text-xs font-bold shadow-lg">
                          {Math.round(book.sale_percentage)}% OFF
                        </div>
                      )}
                      <img
                        src={book.img_url || "/placeholder.svg"}
                        alt={book.name}
                        className="h-[280px] sm:h-[320px] object-contain rounded-lg"
                      />
                    </div>
                  </div>

                  {/* ===== LEFT PANEL ===== */}
                  <div className="w-full md:w-[47%]">
                    <div
                      className="
                        bg-white/80 backdrop-blur-xl
                        rounded-xl border border-white/40 p-6 sm:p-8
                        h-auto md:h-[380px] lg:h-[420px]
                        grid grid-rows-[auto,1fr,auto] gap-3
                      "
                    >
                      <div>
                        <span className="text-accent text-xs font-semibold uppercase tracking-widest">
                          Featured Collection
                        </span>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-2 text-foreground leading-snug line-clamp-2 pb-2">
                          {book.name}
                        </h1>

                        <p className="text-base md:text-lg text-muted-foreground mt-1">
                          {book.author || "Unknown Author"}
                        </p>
                      </div>

                      {/* Description */}
                      <div className="overflow-hidden max-h-[4.5rem] md:max-h-[6rem] lg:max-h-[7.5rem]">
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {book.description ||
                            "A wonderful addition to your collection. Discover engaging stories and beautiful editions from our curated selection."}
                        </p>
                      </div>

                      {/* Price + Button */}
                      <div className="pt-1">
                        {(() => {
                          const isOnSale = book.on_sale && book.sale_price_cents;
                          const salePercent = book.sale_percentage || 0;
                          const discountedPrice = isOnSale
                            ? book.sale_price_cents || book.price_cents
                            : book.price_cents;

                          return (
                            <div className="flex items-center gap-3">
                              {isOnSale && (
                                <span className="text-lg line-through text-muted-foreground">
                                  ${(book.price_cents / 100).toFixed(2)}
                                </span>
                              )}
                              <span className="text-3xl font-bold text-accent">
                                ${(discountedPrice / 100).toFixed(2)}
                              </span>
                              {isOnSale && (
                                <span className="text-sm bg-accent/20 text-accent px-2 py-1 rounded-full font-semibold">
                                  {salePercent}% OFF
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        <Link to={`/book/${book.id}`}>
                          <Button className="mt-4 w-full bg-accent text-accent-foreground rounded-lg hover:opacity-90">
                            See Details
                            <ChevronRight className="ml-1 h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* ===== Desktop Image ===== */}
                  <div className="hidden md:flex w-full md:w-[53%] justify-end md:mr-10 lg:mr-20">
                    <div className="relative">
                      {book.on_sale && book.sale_percentage && (
                        <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground px-3 py-1 rounded-md text-xs font-bold shadow-lg">
                          {Math.round(book.sale_percentage)}% OFF
                        </div>
                      )}

                      <img
                        src={book.img_url || "/placeholder.svg"}
                        alt={book.name}
                        className="h-[380px] lg:h-[420px] object-contain rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* ===== Arrows (Desktop only) ===== */}
          <CarouselPrevious className="hidden md:flex absolute left-0 -translate-x-10 top-1/2 -translate-y-1/2 h-10 w-10 text-white hover:text-accent hover:scale-110 transition-all shadow-none border-none bg-transparent" />
          <CarouselNext className="hidden md:flex absolute right-0 translate-x-10 top-1/2 -translate-y-1/2 h-10 w-10 text-white hover:text-accent hover:scale-110 transition-all shadow-none border-none bg-transparent" />
        </Carousel>
      </div>

      {/* ======================== DOTS (Mobile only) ======================== */}
<div className="absolute bottom-6 w-full flex justify-center gap-2 md:hidden">
  {featuredBooks.map((_, index) => (
    <button
      key={index}
      onClick={() => api?.scrollTo(index)}
      aria-label={`Go to slide ${index + 1}`}   // ✔ accessibility fix
      className={`h-3 w-3 rounded-full transition-all ${
        current === index
          ? "bg-accent scale-110 shadow-md"
          : "bg-white/40 hover:bg-white/70"
      }`}
    />
  ))}
</div>

    </div>
  );
};
