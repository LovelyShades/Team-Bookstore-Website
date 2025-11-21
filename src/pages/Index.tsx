import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HeroCarousel } from "@/components/HeroCarousel";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Book, Coffee, Heart, TrendingUp } from "lucide-react";
import { Item } from "@/types";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Index = () => {
  const { data: latestReleases = [] } = useQuery({
    queryKey: ['latest-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Item[];
    },
  });

  const { data: saleItems = [], isLoading: saleItemsLoading } = useQuery({
    queryKey: ['sale-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('active', true)
        .eq('on_sale', true)
        .gt('stock', 0)
        .order('sale_percentage', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Item[];
    },
  });

  const latestSection = useScrollAnimation();
  const saleSection = useScrollAnimation();
  const testimonialsSection = useScrollAnimation();
  const whyChooseSection = useScrollAnimation();
  const newsletterSection = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Latest Releases Section - Compact */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-background">
        <div
          ref={latestSection.elementRef}
          className={`max-w-7xl mx-auto transition-all duration-700 ${
            latestSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Latest Releases
              </h2>
              <p className="text-base text-muted-foreground">
                Discover our newest arrivals
              </p>
            </div>
            <Link to="/catalog">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex border-border hover:bg-accent/10 hover:text-accent hover:border-accent transition-all"
              >
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {latestReleases.map((book) => {
              const displayPrice = book.on_sale && book.sale_price_cents
                ? `$${(book.sale_price_cents / 100).toFixed(2)}`
                : `$${(book.price_cents / 100).toFixed(2)}`;
              const originalPrice = book.on_sale && book.sale_price_cents
                ? `$${(book.price_cents / 100).toFixed(2)}`
                : undefined;

              return (
                <Link key={book.id} to={`/book/${book.id}`}>
                  <div className="hover-scale h-full relative">
                    {book.on_sale && book.sale_percentage && (
                      <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                        {Math.round(book.sale_percentage)}% OFF
                      </div>
                    )}
                    <BookCard
                      title={book.name}
                      author={book.author || 'Unknown Author'}
                      price={displayPrice}
                      originalPrice={originalPrice}
                      image={book.img_url || '/placeholder.svg'}
                      stock={book.stock}
                      onSale={book.on_sale || false}
                      compact={true}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* On Sale Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-subtle relative overflow-hidden">
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-accent/5" />

        <div
          ref={saleSection.elementRef}
          className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${
            saleSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                On Sale
              </h2>
              <p className="text-base text-muted-foreground">
                Limited time offers - grab them while they last!
              </p>
            </div>
            <Link to="/discounts">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex border-accent/50 hover:bg-accent/10 hover:text-accent hover:border-accent transition-all"
              >
                View All Sales
              </Button>
            </Link>
          </div>

          {saleItemsLoading ? (
            <p className="text-center text-muted-foreground py-8">
              Loading sale books...
            </p>
          ) : saleItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No books are on sale right now. Check back soon!
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {saleItems.map((book) => {
                const displayPrice = book.sale_price_cents
                  ? `$${(book.sale_price_cents / 100).toFixed(2)}`
                  : `$${(book.price_cents / 100).toFixed(2)}`;
                const originalPrice = book.sale_price_cents
                  ? `$${(book.price_cents / 100).toFixed(2)}`
                  : undefined;

                return (
                  <Link key={book.id} to={`/book/${book.id}`}>
                    <div className="hover-scale h-full relative">
                      {book.sale_percentage && (
                        <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                          {Math.round(book.sale_percentage)}% OFF
                        </div>
                      )}
                      <BookCard
                        title={book.name}
                        author={book.author || 'Unknown Author'}
                        price={displayPrice}
                        originalPrice={originalPrice}
                        image={book.img_url || '/placeholder.svg'}
                        stock={book.stock}
                        onSale={true}
                        compact={true}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-subtle relative overflow-hidden">
        {/* Subtle overlay for modern feel */}
        <div className="absolute inset-0 bg-black/10" />

        <div
          ref={testimonialsSection.elementRef}
          className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${
            testimonialsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              What Our Readers Say
            </h2>
            <p className="text-base text-muted-foreground">
              Join thousands of satisfied book lovers
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`flex flex-col space-y-3 p-5 rounded-xl bg-card/90 backdrop-blur-sm border border-border hover:border-accent/50 hover:shadow-soft hover:-translate-y-1 transition-all duration-500 group ${testimonialsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: testimonialsSection.isVisible ? '0ms' : '0ms' }}>
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-accent text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed flex-1">
                "The curation is exceptional. Every book I've purchased has been a gem. This is my go-to bookstore now."
              </p>
              <div className="pt-2 border-t border-border/50">
                <p className="font-semibold text-foreground text-sm">Sarah Mitchell</p>
                <p className="text-xs text-muted-foreground">Book Enthusiast</p>
              </div>
            </div>

            <div className={`flex flex-col space-y-3 p-5 rounded-xl bg-card/90 backdrop-blur-sm border border-border hover:border-accent/50 hover:shadow-soft hover:-translate-y-1 transition-all duration-500 group ${testimonialsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: testimonialsSection.isVisible ? '100ms' : '0ms' }}>
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-accent text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed flex-1">
                "Fast delivery and beautiful book conditions. The browsing experience is so cozy and welcoming!"
              </p>
              <div className="pt-2 border-t border-border/50">
                <p className="font-semibold text-foreground text-sm">James Peterson</p>
                <p className="text-xs text-muted-foreground">Regular Customer</p>
              </div>
            </div>

            <div className={`flex flex-col space-y-3 p-5 rounded-xl bg-card/90 backdrop-blur-sm border border-border hover:border-accent/50 hover:shadow-soft hover:-translate-y-1 transition-all duration-500 group ${testimonialsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: testimonialsSection.isVisible ? '200ms' : '0ms' }}>
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-accent text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed flex-1">
                "I love the personalized recommendations. They really understand what readers want and need."
              </p>
              <div className="pt-2 border-t border-border/50">
                <p className="font-semibold text-foreground text-sm">Emily Chen</p>
                <p className="text-xs text-muted-foreground">Fiction Lover</p>
              </div>
            </div>

            <div className={`flex flex-col space-y-3 p-5 rounded-xl bg-card/90 backdrop-blur-sm border border-border hover:border-accent/50 hover:shadow-soft hover:-translate-y-1 transition-all duration-500 group ${testimonialsSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: testimonialsSection.isVisible ? '300ms' : '0ms' }}>
              <div className="flex gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-accent text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed flex-1">
                "Premium quality books at great prices. The attention to detail in their selection is impressive."
              </p>
              <div className="pt-2 border-t border-border/50">
                <p className="font-semibold text-foreground text-sm">Michael Torres</p>
                <p className="text-xs text-muted-foreground">Collector</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-background">
        <div
          ref={whyChooseSection.elementRef}
          className={`max-w-7xl mx-auto transition-all duration-700 ${
            whyChooseSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Why Choose Hearts & Pages
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              More than just a bookstore - we're your literary companion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`text-center p-6 rounded-xl bg-card/60 backdrop-blur-sm border border-border hover:border-accent/50 hover:shadow-soft hover:-translate-y-1 transition-all duration-500 ${whyChooseSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: whyChooseSection.isVisible ? '0ms' : '0ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                <Book className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Curated Collection</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every book is carefully selected by our team of literary experts to ensure quality and diversity
              </p>
            </div>

            <div className={`text-center p-6 rounded-xl bg-card/60 backdrop-blur-sm border border-border hover:border-accent/50 hover:shadow-soft hover:-translate-y-1 transition-all duration-500 ${whyChooseSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: whyChooseSection.isVisible ? '100ms' : '0ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                <Heart className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Personalized Service</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get tailored book recommendations based on your reading preferences and history
              </p>
            </div>

            <div className={`text-center p-6 rounded-xl bg-card/60 backdrop-blur-sm border border-border hover:border-accent/50 hover:shadow-soft hover:-translate-y-1 transition-all duration-500 ${whyChooseSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: whyChooseSection.isVisible ? '200ms' : '0ms' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                <TrendingUp className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">First Access</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Be the first to get your hands on new releases and exclusive editions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-newsletter border-t border-border">
        <div
          ref={newsletterSection.elementRef}
          className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${
            newsletterSection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
            <Coffee className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Join Our Reading Community
          </h2>
          <p className="text-base md:text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
            Get personalized book recommendations, exclusive offers, and invitations to our literary events
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-4 rounded-lg bg-card/50 border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all backdrop-blur-sm"
            />
            <Button
              size="lg"
              className="bg-gradient-warm text-accent-foreground hover:opacity-90 hover:scale-105 transition-all shadow-medium whitespace-nowrap px-8 py-4"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
