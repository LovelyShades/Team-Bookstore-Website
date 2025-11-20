import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Item } from "@/types";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, TrendingDown } from "lucide-react";

const Discounts = () => {
  const [filters, setFilters] = useState({
    q: "",
    sort: "discount",
    available: "1", // 0 = all, 1 = in stock, 2 = out of stock
  });

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["discounts", filters],
    queryFn: async () => {
      let query = supabase
        .from("items")
        .select("id, name, price_cents, stock, img_url, active, created_at, author")
        .eq("active", true);

      // Don't apply stock filter to the query - we'll filter after selection
      const { data, error } = await query;
      if (error) throw error;

      // Use a deterministic method to select the same 10 books
      // Select books based on their position in the array to ensure we always have books
      const allItems = data as Item[];
      
      // Sort by ID first to ensure consistency
      const sortedItems = [...allItems].sort((a, b) => Number(a.id) - Number(b.id));
      
      // Priority books that must always appear on sale
      const priorityBookNames = [
        'beware the cats meow',
        'beware the cat\'s meow',
        'kitten\'s cooler',
        'kittens cooler',
        'working mom\'s 411',
        'working moms 411',
        'luke'
      ];
      
      const priorityBooks = sortedItems.filter(item => {
        const itemName = item.name.toLowerCase().replace(/[^\w\s]/g, ''); // Remove punctuation
        return priorityBookNames.some(name => {
          const searchName = name.toLowerCase().replace(/[^\w\s]/g, '');
          return itemName.includes(searchName) || searchName.includes(itemName.split(' ')[0]);
        });
      });
      
      // Get remaining books to fill up to 10 total
      const remainingSlots = 10 - priorityBooks.length;
      const otherBooks = sortedItems
        .filter(item => !priorityBooks.find(pb => pb.id === item.id))
        .filter((_, index) => index % 3 === 0)
        .slice(0, remainingSlots);
      
      // Combine priority books first, then other books
      const selectedForSale = [...priorityBooks, ...otherBooks];
      
      const discountedItems = selectedForSale.map((item, index) => {
        // Assign varied discount percentages (5%, 10%, 15%, 20%, 25%, 30%, 35%, 40%, 45%, 50%)
        const discounts = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
        const discountPercent = discounts[index % discounts.length];
        
        // Calculate inflated "original" price to show discount
        // Actual price stays the same (book.price_cents)
        const originalPrice = Math.round(item.price_cents / (1 - discountPercent / 100));
        
        return { 
          ...item, 
          originalPrice, // Inflated "original" price for display
          discountPercent 
        }; // price_cents stays the same (actual price)
      });

      // Apply stock filter AFTER selecting sale books
      let filteredItems = discountedItems;
      if (filters.available === "1") {
        filteredItems = filteredItems.filter(item => item.stock > 0);
      } else if (filters.available === "2") {
        filteredItems = filteredItems.filter(item => item.stock === 0);
      }

      // Apply search filter after selection
      if (filters.q) {
        filteredItems = filteredItems.filter(item => 
          item.name.toLowerCase().includes(filters.q.toLowerCase())
        );
      }

      // Sort by discount
      if (filters.sort === "discount") {
        filteredItems.sort((a, b) => b.discountPercent - a.discountPercent);
      } else if (filters.sort === "price_low") {
        filteredItems.sort((a, b) => a.price_cents - b.price_cents);
      } else if (filters.sort === "price_high") {
        filteredItems.sort((a, b) => b.price_cents - a.price_cents);
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
    <main className="min-h-screen bg-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-xl">
            <Tag className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-purple-600 mb-2">
              Books on Sale
            </h1>
            <p className="text-gray-600">Special discounts on selected books</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-gray-200 p-4">
          <form
            className="flex flex-col sm:flex-row flex-wrap gap-3"
            onSubmit={handleSubmit}
          >
            <input
              name="q"
              placeholder="🔍 Search discounted books..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />

            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="min-w-[180px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="discount">Best Discount</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>

            <select
              id="available"
              name="available"
              value={filters.available}
              onChange={(e) => setFilters({ ...filters, available: e.target.value })}
              className="min-w-[160px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1">In Stock Only</option>
              <option value="0">All Books</option>
              <option value="2">Out of Stock</option>
            </select>
          </form>
        </Card>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {items.length === 0 ? (
              <p>No discounted books available right now.</p>
            ) : (
              <p>
                <span className="font-semibold text-gray-900">{items.length}</span>{" "}
                {items.length === 1 ? "book" : "books"} on sale
              </p>
            )}
          </div>
          <Link to="/catalog">
            <Button variant="outline">View All Books</Button>
          </Link>
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
                  className="overflow-hidden bg-white border-2 border-purple-200 hover:shadow-lg transition-shadow relative"
                >
                  {/* Discount Badge */}
                  <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <TrendingDown size={14} />
                    {item.discountPercent}% OFF
                  </div>

                  <Link to={`/book/${item.id}`}>
                    <div className="relative w-full h-48 bg-gray-100">
                      {item.img_url ? (
                        <img
                          src={item.img_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Tag className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4 space-y-2">
                    <Link to={`/book/${item.id}`}>
                      <h3 className="font-bold text-gray-900 hover:text-purple-600 transition-colors line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                    {item.author && (
                      <p className="text-sm text-gray-600 line-clamp-1">{item.author}</p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          ${(item.price_cents / 100).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ${(item.originalPrice / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Link to={`/book/${item.id}`} className="block">
                      <Button className="w-full bg-purple-600 hover:bg-indigo-700 mt-2">
                        View Deal
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
        </section>

        {items.length === 0 && !isLoading && (
          <Card className="bg-white p-12 text-center">
            <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              No sales at the moment
            </h2>
            <p className="text-gray-600 mb-6">
              Check back later for amazing deals!
            </p>
            <Link to="/catalog">
              <Button className="bg-purple-600 hover:bg-indigo-700">
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
