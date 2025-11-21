import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { BookCard } from "@/components/BookCard";

interface WishlistItem {
  id: number;
  name: string;
  price_cents: number;
  img_url: string;
  author?: string;
}

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setWishlistItems(saved);
  }, []);

  const removeFromWishlist = (bookId: number) => {
    const updated = wishlistItems.filter((item) => item.id !== bookId);
    setWishlistItems(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    toast.success("Removed from wishlist");
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 pt-20">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="bg-gradient-warm p-3 rounded-xl">
            <Heart className="h-8 w-8 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              My Wishlist
            </h1>
            <p className="text-muted-foreground">Books you've saved for later</p>
          </div>
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <Card className="bg-card p-12 text-center border-border">
            <Heart className="h-16 w-16 text-muted mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Start adding books you love!
            </p>
            <Link to="/catalog">
              <Button className="btn-primary">Browse Catalog</Button>
            </Link>
          </Card>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {wishlistItems.map((item) => (
              <div key={item.id} className="relative group">

                {/* Remove Button */}
                {/* Remove Button */}
<button
  aria-label="Remove from wishlist"
  title="Remove from wishlist"
  onClick={() => removeFromWishlist(item.id)}
  className="
    absolute top-2 right-2 z-20 
    bg-white/90 dark:bg-black/80 
    border border-border rounded-full 
    p-1 transition hover:bg-accent hover:text-accent-foreground
  "
>
  <Heart className="w-4 h-4 fill-accent group-hover:fill-accent-foreground" />
</button>


                {/* Book Card */}
                <Link to={`/book/${item.id}`} className="block">
                  <BookCard
                    title={item.name}
                    author={item.author || "Unknown Author"}
                    price={`$${(item.price_cents / 100).toFixed(2)}`}
                    image={item.img_url}
                    stock={999}  // wishlist ignores stock
                    compact={true}
                  />
                </Link>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Wishlist;
