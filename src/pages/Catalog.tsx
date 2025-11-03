// src/pages/Catalog.tsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Item } from "@/types";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Catalog = () => {
  const [filters, setFilters] = useState({
    q: "",
    sort: "created_at",
    available: "0",
  });

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["catalog", filters],
    queryFn: async () => {
      let query = supabase
        .from("items")
        .select("id, name, price_cents, stock, img_url, active, created_at")
        .eq("active", true);

      if (filters.q) {
        query = query.ilike("name", `%${filters.q.trim()}%`);
      }

      if (filters.available === "1") {
        query = query.gt("stock", 0);
      }

      if (filters.sort === "price_low") {
        query = query.order("price_cents", { ascending: true });
      } else if (filters.sort === "price_high") {
        query = query.order("price_cents", { ascending: false });
      } else if (filters.sort === "name") {
        query = query.order("name", { ascending: true });
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
      q: form.get("q")?.toString() ?? "",
      sort: form.get("sort")?.toString() ?? "created_at",
      available: form.get("available")?.toString() ?? "0",
    });
  };

  if (error)
    return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📚 Book Catalog
            </h1>
            <p className="text-gray-600">Discover your next great read</p>
          </div>
          <Link
            to="/admin"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Admin Dashboard
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-gray-200 p-4">
          <form
            className="flex flex-col sm:flex-row flex-wrap gap-3"
            onSubmit={handleSubmit}
          >
            <input
              name="q"
              placeholder="🔍 Search by book name..."
              defaultValue={filters.q}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />

            {/* Sort Dropdown */}
            <label htmlFor="sort" className="sr-only">
              Sort books by
            </label>
            <select
              id="sort"
              name="sort"
              aria-label="Sort books by"
              defaultValue={filters.sort}
              className="min-w-[180px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="created_at">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>

            {/* Availability Dropdown */}
            <label htmlFor="available" className="sr-only">
              Filter by availability
            </label>
            <select
              id="available"
              name="available"
              aria-label="Filter by availability"
              defaultValue={filters.available}
              className="min-w-[160px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="0">All Books</option>
              <option value="1">In Stock Only</option>
            </select>

            <Button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Apply Filters
            </Button>
          </form>
        </Card>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          {items.length === 0 ? (
            <p>No items found. Try adjusting your filters.</p>
          ) : (
            <p>
              Showing{" "}
              <span className="font-semibold text-gray-900">{items.length}</span>{" "}
              {items.length === 1 ? "book" : "books"}
            </p>
          )}
        </div>

        {/* Items grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-gray-100 animate-pulse rounded-lg"
                />
              ))
            : items.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden bg-white border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full h-48 bg-gray-100">
                    {item.img_url ? (
                      <img
                        src={item.img_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg
                          className="w-16 h-16"
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
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-slate-700">
                        ${(item.price_cents / 100).toFixed(2)}
                      </div>
                      {item.stock > 0 ? (
                        <span className="text-sm text-gray-500">In Stock</span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <div className="pt-2">
                      <Link
                        to={`/book/${item.id}`}
                        className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
        </section>

        {/* Empty state */}
        {items.length === 0 && !isLoading && (
          <Card className="text-center bg-white border border-gray-200 py-12">
            <svg
              className="w-24 h-24 mx-auto text-gray-200 mb-4"
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No books found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Button
              onClick={() =>
                setFilters({ q: "", sort: "created_at", available: "0" })
              }
              className="bg-indigo-600 text-white hover:bg-indigo-700"
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
