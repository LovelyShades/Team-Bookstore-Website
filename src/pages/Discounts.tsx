import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Item } from "@/types";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import { BookCard } from '@/components/BookCard';
import { PageHeader } from '@/components/PageHeader';
import { SortDropdown, SortOption } from '@/components/filters/SortDropdown';
import { AvailabilityDropdown } from '@/components/filters/AvailabilityDropdown';
import { ViewToggle } from '@/components/ViewToggle';

const SORT_OPTIONS: SortOption[] = [
  { value: "discount", label: "Best Discount" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

const Discounts = () => {
  const [filters, setFilters] = useState({
    q: "",
    sort: "discount",
    available: "1", // 0 = all, 1 = in stock, 2 = out of stock
    priceMin: 0,
    priceMax: 100,
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["discounts", filters],
    queryFn: async () => {
      let query = supabase
        .from("items")
        .select("*")
        .eq("active", true)
        .eq("on_sale", true);

      // Apply stock filter
      if (filters.available === "1") {
        query = query.gt("stock", 0);
      } else if (filters.available === "2") {
        query = query.eq("stock", 0);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredItems = data as Item[];

      // Apply search filter
      if (filters.q) {
        filteredItems = filteredItems.filter(item =>
          item.name.toLowerCase().includes(filters.q.toLowerCase())
        );
      }

      // Apply price range filter
      filteredItems = filteredItems.filter(item => {
        const price = (item.sale_price_cents || item.price_cents) / 100; // Convert to dollars
        return price >= filters.priceMin && price <= filters.priceMax;
      });

      // Sort results
      if (filters.sort === "discount") {
        filteredItems.sort((a, b) => (b.sale_percentage || 0) - (a.sale_percentage || 0));
      } else if (filters.sort === "price_low") {
        filteredItems.sort((a, b) => {
          const aPrice = a.sale_price_cents || a.price_cents;
          const bPrice = b.sale_price_cents || b.price_cents;
          return aPrice - bPrice;
        });
      } else if (filters.sort === "price_high") {
        filteredItems.sort((a, b) => {
          const aPrice = a.sale_price_cents || a.price_cents;
          const bPrice = b.sale_price_cents || b.price_cents;
          return bPrice - aPrice;
        });
      }

      return filteredItems;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    setFilters({
      q: form.get("q")?.toString() ?? "",
      sort: form.get("sort")?.toString() ?? "discount",
      available: form.get("available")?.toString() ?? "1",
    });
  };

  if (error)
    return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader
          icon={Tag}
          title="Books on Sale"
          description="Special discounts on selected books"
        />

        {/* Filters */}
        <Card className="bg-card border-border p-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            {/* Search Bar */}
            <input
              name="q"
              placeholder="Search discounted books..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-accent"
            />

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <SortDropdown
                sortValue={filters.sort}
                onSortChange={(value) => setFilters({ ...filters, sort: value })}
                sortOptions={SORT_OPTIONS}
                priceMin={filters.priceMin}
                priceMax={filters.priceMax}
                onPriceChange={(min, max) => setFilters({ ...filters, priceMin: min, priceMax: max })}
              />
              <AvailabilityDropdown
                value={filters.available}
                onChange={(value) => setFilters({ ...filters, available: value })}
              />
            </div>
          </form>
        </Card>

        {/* Results count and view toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {items.length === 0 ? (
              <p>No discounted books available right now.</p>
            ) : (
              <p>
                Showing{" "}
                <span className="font-semibold text-foreground">{items.length}</span>{" "}
                {items.length === 1 ? "book" : "books"}
              </p>
            )}
          </div>

          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Items display - Grid or List */}
        {viewMode === 'grid' ? (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-96 bg-muted animate-pulse rounded-lg"
                  />
                ))
              : items.map((item) => {
                  const displayPrice = item.sale_price_cents
                    ? `$${(item.sale_price_cents / 100).toFixed(2)}`
                    : `$${(item.price_cents / 100).toFixed(2)}`;

                  const originalPrice = item.sale_price_cents
                    ? `$${(item.price_cents / 100).toFixed(2)}`
                    : undefined;

                  return (
                    <Link key={item.id} to={`/book/${item.id}`}>
                      <BookCard
                        title={item.name}
                        author={item.author || 'Unknown Author'}
                        price={displayPrice}
                        originalPrice={originalPrice}
                        image={item.img_url || '/placeholder.svg'}
                        stock={item.stock}
                        onSale={item.on_sale || false}
                        salePercentage={item.sale_percentage}
                        compact={true}
                      />
                    </Link>
                  );
                })}
          </section>
        ) : (
          <section className="space-y-4">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted animate-pulse rounded-lg"
                  />
                ))
              : items.map((item) => {
                  const displayPrice = item.sale_price_cents
                    ? `$${(item.sale_price_cents / 100).toFixed(2)}`
                    : `$${(item.price_cents / 100).toFixed(2)}`;

                  const originalPrice = item.sale_price_cents
                    ? `$${(item.price_cents / 100).toFixed(2)}`
                    : undefined;

                  return (
                    <Link key={item.id} to={`/book/${item.id}`}>
                      <Card className="hover:shadow-lg transition-shadow">
                        <div className="flex gap-4 p-4">
                          {/* Book Image */}
                          <div className="relative w-24 h-32 flex-shrink-0">
                            <img
                              src={item.img_url || '/placeholder.svg'}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                            {item.stock === 0 && (
                              <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs px-1 py-0.5 rounded">
                                Out
                              </div>
                            )}
                          </div>

                          {/* Book Info */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-foreground text-lg line-clamp-2 hover:text-accent transition-colors">
                                  {item.name}
                                </h3>
                                {item.on_sale && item.sale_percentage && (
                                  <span className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                                    {Math.round(item.sale_percentage)}% OFF
                                  </span>
                                )}
                              </div>
                              <p className="text-muted-foreground text-sm mt-1">
                                {item.author || 'Unknown Author'}
                              </p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-foreground">
                                  {displayPrice}
                                </span>
                                {originalPrice && item.on_sale && (
                                  <span className="text-sm line-through text-muted-foreground">
                                    {originalPrice}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm">
                                {item.stock > 0 ? (
                                  <span className="bg-success/10 text-success px-2 py-1 rounded-md font-medium">In Stock: {item.stock}</span>
                                ) : (
                                  <span className="bg-destructive/10 text-destructive px-2 py-1 rounded-md font-medium">Out of Stock</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
          </section>
        )}

        {/* Empty State */}
        {items.length === 0 && !isLoading && (
          <Card className="bg-card p-12 text-center">
            <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              No sales at the moment
            </h2>
            <p className="text-muted-foreground mb-6">
              Check back later for amazing deals!
            </p>
            <Link to="/catalog">
              <Button className="bg-gradient-warm text-accent-foreground hover:opacity-90">
                Browse All Books
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </main>
  );
};

export default Discounts;
