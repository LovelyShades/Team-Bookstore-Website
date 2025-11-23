import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { BookCard } from "@/components/BookCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "@/services/wishlistService";
import { Skeleton } from "@/components/ui/skeleton";

const Wishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch wishlist from database
  const { data: wishlistData = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: () => user ? wishlistService.getUserWishlist(user.id) : [],
    enabled: !!user,
  });

  // Migrate localStorage wishlist on mount
  useEffect(() => {
    if (user) {
      wishlistService.migrateLocalWishlist(user.id);
    }
  }, [user]);

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: (itemId: string) => {
      if (!user) throw new Error('User not authenticated');
      return wishlistService.removeFromWishlist(user.id, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success("Removed from wishlist");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeFromWishlist = (itemId: string) => {
    removeMutation.mutate(itemId);
  };

  // Logged-out state
  if (!user) {
    return (
      <main className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md text-center bg-card backdrop-blur-sm border-border p-8">
          <Heart className="h-20 w-20 mx-auto mb-6 text-muted" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Sign in to view your wishlist
          </h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to access your wishlist.
          </p>
          <Link to="/auth">
            <Button size="lg" className="w-full rounded-lg">
              Go to Login
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-4xl font-bold text-foreground">My Wishlist</h1>
              <p className="text-muted-foreground">Books you've saved for later</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Wishlist</h1>
            <p className="text-muted-foreground">Books you've saved for later</p>
          </div>
        </div>

        {/* Empty State */}
        {wishlistData.length === 0 ? (
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
          // Wishlist Grid
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {wishlistData.map((wishlistItem: any) => {
              const item = wishlistItem.items;
              return (
                <div key={wishlistItem.id} className="relative group">

                  {/* Remove Button */}
                  <button
                    type="button"
                    aria-label="Remove from wishlist"
                    title="Remove from wishlist"
                    onClick={() => removeFromWishlist(item.id)}
                    disabled={removeMutation.isPending}
                    className="
                      absolute top-2 right-2 z-20
                      bg-white/90 dark:bg-black/80
                      border border-border rounded-full
                      p-1 transition hover:bg-accent hover:text-accent-foreground
                      disabled:opacity-50
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
                      stock={999}
                      compact={true}
                    />
                  </Link>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default Wishlist;
