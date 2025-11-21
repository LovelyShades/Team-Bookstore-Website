/* =====================================================
 *  HeroCarousel — Fixed Height + Line-Clamp + Sale Tag
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

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

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

      {/* ===== MAIN CONTENT WRAPPER ===== */}
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
                    gap-10
                    w-full
                    md:ml-6 lg:ml-10
                  "
                >
                  {/* ===== LEFT: WHITE CARD ===== */}
                  <div className="w-full md:w-[47%]">
                    <div
                      className="
                        bg-white/80 backdrop-blur-xl
                        rounded-xl border border-white/40 p-8

                        h-[340px] md:h-[380px] lg:h-[420px]
                        grid grid-rows-[auto,1fr,auto] gap-3
                      "
                    >
                      {/* Row 1: tag, title, author */}
                      <div>
                        <span className="text-accent text-xs font-semibold uppercase tracking-widest">
                          Featured Collection
                        </span>

                        <h1
                          className="
                            text-3xl md:text-4xl lg:text-5xl
                            font-bold mt-2 text-foreground
                            leading-snug
                            line-clamp-2
                          "
                        >
                          {book.name}
                        </h1>

                        <p className="text-base md:text-lg text-muted-foreground mt-1">
                          {book.author || "Unknown Author"}
                        </p>
                      </div>

                      {/* Row 2: description */}
                      <div className="overflow-hidden max-h-[4.5rem] md:max-h-[6rem] lg:max-h-[7.5rem]">
                        <p
                          className="
                            text-sm text-muted-foreground leading-relaxed
                            line-clamp-3 md:line-clamp-3 lg:line-clamp-3
                          "
                        >
                          {book.description ||
                            "A wonderful addition to your collection. Discover engaging stories and beautiful editions from our curated selection."}
                        </p>
                      </div>

                      {/* Row 3: bottom — price + button */}
                      <div className="pt-1">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold text-accent">
                            {(book.price_cents / 100).toFixed(2)}
                          </span>
                        </div>

                        <Link to={`/book/${book.id}`}>
                          <Button className="mt-4 w-full bg-accent text-accent-foreground rounded-lg hover:opacity-90">
                            See Details
                            <ChevronRight className="ml-1 h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* ===== RIGHT: BOOK IMAGE + SALE TAG ===== */}
                  <div
                    className="
                      w-full md:w-[53%]
                      flex justify-end items-center
                      md:mr-10 lg:mr-20
                    "
                  >
                    <div className="relative">
                      {/* Sale tag */}
                      {book.on_sale && book.sale_percentage && (
                        <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground px-3 py-1 rounded-md text-xs font-bold shadow-lg">
                          {Math.round(book.sale_percentage)}% OFF
                        </div>
                      )}

                      <img
                        src={book.img_url || "/placeholder.svg"}
                        alt={book.name}
                        className="
                          h-[340px] md:h-[380px] lg:h-[420px]
                          object-contain rounded-lg
                        "
                      />
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* ===== ARROWS ===== */}
          <CarouselPrevious
            className="
              hidden md:flex
              absolute left-0 -translate-x-10
              top-1/2 -translate-y-1/2
              h-10 w-10
              items-center justify-center
              bg-transparent hover:bg-transparent
              text-white hover:text-accent
              border-none shadow-none
              hover:scale-110 transition-all
              z-40
            "
          />
          <CarouselNext
            className="
              hidden md:flex
              absolute right-0 translate-x-10
              top-1/2 -translate-y-1/2
              h-10 w-10
              items-center justify-center
              bg-transparent hover:bg-transparent
              text-white hover:text-accent
              border-none shadow-none
              hover:scale-110 transition-all
              z-40
            "
          />
        </Carousel>
      </div>
    </div>
  );
};
