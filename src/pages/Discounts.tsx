import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Item } from "@/types";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, TrendingDown, Grid3x3, List } from "lucide-react";
import { BookCard } from '@/components/BookCard';

const Discounts = () => {
  const [filters, setFilters] = useState({
    q: "",
    sort: "discount",
    available: "1", // 0 = all, 1 = in stock, 2 = out of stock
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
        <div className="flex items-center gap-4">
          <div className="bg-gradient-warm p-3 rounded-xl">
            <Tag className="h-8 w-8 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Books on Sale
            </h1>
            <p className="text-muted-foreground">Special discounts on selected books</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border p-4">
          <form
            className="flex flex-col sm:flex-row flex-wrap gap-3"
            onSubmit={handleSubmit}
          >
            <input
              name="q"
              placeholder="Search discounted books..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="flex-1 min-w-[200px] px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-accent"
            />

            {/* SORT SELECT — FIXED */}
            <select
              id="sort"
              name="sort"
              aria-label="Sort discounts"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="min-w-[180px] px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-accent"
            >
              <option value="discount">Best Discount</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>

            {/* AVAILABILITY SELECT — FIXED */}
            <select
              id="available"
              name="available"
              aria-label="Filter by availability"
              value={filters.available}
              onChange={(e) => setFilters({ ...filters, available: e.target.value })}
              className="min-w-[160px] px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-accent"
            >
              <option value="1">In Stock Only</option>
              <option value="0">All Books</option>
              <option value="2">Out of Stock</option>
            </select>
          </form>
        </Card>

        {/* Results count and view toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {items.length === 0 ? (
              <p>No discounted books available right now.</p>
            ) : (
              <p>
                <span className="font-semibold text-foreground">{items.length}</span>{" "}
                {items.length === 1 ? "book" : "books"} on sale
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-accent text-accent-foreground' : ''}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-accent text-accent-foreground' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Link to="/catalog">
              <Button variant="outline" size="sm">View All Books</Button>
            </Link>
          </div>
        </div>

        {/* Items grid or list */}
        <section className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6' : 'flex flex-col gap-4'}>
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

                if (viewMode === 'list') {
                  return (
                    <Link key={item.id} to={`/book/${item.id}`}>
                      <Card className="hover:shadow-lg transition-shadow">
                        <div className="flex gap-4 p-4">
                          <div className="relative flex-shrink-0">
                            {item.on_sale && item.sale_percentage && (
                              <div className="absolute top-0 left-0 z-10 bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs font-bold shadow-lg flex items-center gap-1">
                                <TrendingDown size={12} />
                                {Math.round(item.sale_percentage)}% OFF
                              </div>
                            )}
                            <img
                              src={item.img_url || '/placeholder.svg'}
                              alt={item.name}
                              className="w-24 h-32 object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.author || 'Unknown Author'}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-accent">{displayPrice}</span>
                                {originalPrice && (
                                  <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
                                )}
                              </div>
                              <span className={`text-sm ${item.stock > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                                {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                }

                return (
                  <Link key={item.id} to={`/book/${item.id}`}>
                    <div className="relative">
                      {item.on_sale && item.sale_percentage && (
                        <div className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs font-bold shadow-lg flex items-center gap-1">
                          <TrendingDown size={14} />
                          {Math.round(item.sale_percentage)}% OFF
                        </div>
                      )}
                      <BookCard
                        title={item.name}
                        author={item.author || 'Unknown Author'}
                        price={displayPrice}
                        originalPrice={originalPrice}
                        image={item.img_url || '/placeholder.svg'}
                        stock={item.stock}
                        onSale={item.on_sale || false}
                        compact={true}
                      />
                    </div>
                  </Link>
                );
              })}
        </section>

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
