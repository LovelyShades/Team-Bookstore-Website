// src/pages/Catalog.tsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Item } from "@/types";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { BookCard } from '@/components/BookCard';
import { BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SortDropdown, SortOption } from '@/components/filters/SortDropdown';
import { AvailabilityDropdown } from '@/components/filters/AvailabilityDropdown';
import { ViewToggle } from '@/components/ViewToggle';

const SORT_OPTIONS: SortOption[] = [
  { value: "created_at", label: "Newest First" },
  { value: "name", label: "Name (A-Z)" },
  { value: "stock_low", label: "Quantity: Low to High" },
  { value: "stock_high", label: "Quantity: High to Low" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

const Catalog = () => {
  const { isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    q: "",
    sort: "created_at",
    available: "1", // Default to "In Stock Only"
    priceMin: 0,
    priceMax: 100,
  });

  // local search updates when user is typing (live search)
  const [searchText, setSearchText] = useState(filters.q);

  //waits 300 ms before applying the "updated search"
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchText }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["catalog", filters],
    queryFn: async () => {
      let query = supabase
        .from("items")
        .select("*") // ✅ FIXED: prevents missing-column errors
        .eq("active", true);

      // Search filter
      if (filters.q) {
        const q = filters.q.trim();
        query = query.or(
          `name.ilike.%${q}%,author.ilike.%${q}%,isbn.ilike.%${q}%`
        );
      }

      // Price filter
      query = query.gte(
        "price_cents",
        filters.priceMin * 100
      );

      query = query.lte(
        "price_cents",
        filters.priceMax * 100
      );

      // Stock filter
      if (filters.available === "1") {
        query = query.gt("stock", 0);
      } else if (filters.available === "2") {
        query = query.eq("stock", 0);
      }

      // Sorting
      if (filters.sort === "price_low") {
        query = query.order("price_cents", { ascending: true });
      } else if (filters.sort === "price_high") {
        query = query.order("price_cents", { ascending: false });
      } else if (filters.sort === "name") {
        query = query.order("name", { ascending: true });
      } else if (filters.sort === "stock_low") {
        query = query.order("stock", { ascending: true });
      } else if (filters.sort === "stock_high") {
        query = query.order("stock", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Item[];
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    setFilters({
      ...filters, // keeps the price filters
      q: form.get("q")?.toString() ?? "",
      sort: form.get("sort")?.toString() ?? "created_at",
      available: form.get("available")?.toString() ?? "0",
    });
  };

  if (error)
    return <div className="p-6 text-error">Error: {error.message}</div>;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-4">
          <PageHeader
            icon={BookOpen}
            title="Book Catalog"
            description="Discover your next great read"
          />
          {isAdmin && (
            <Link
              to="/admin"
              className="btn-primary inline-block"
            >
              Admin Dashboard
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card className="bg-card border-border p-4">
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            {/* Search Bar */}
            <input
              name="q"
              placeholder="Search by book name, author, or ISBN..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring"
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
              <p>No items found. Try adjusting your filters.</p>
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

        {/* Empty state */}
        {items.length === 0 && !isLoading && (
          <Card className="text-center bg-card border-border py-12">
            <svg
              className="w-24 h-24 mx-auto text-muted mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No books found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Button
              onClick={() =>
                setFilters({ q: "", sort: "created_at", available: "1", priceMin: 0, priceMax: 100 })
              }
              className="btn-primary"
            >
              Clear Filters
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
};

export default Catalog;
