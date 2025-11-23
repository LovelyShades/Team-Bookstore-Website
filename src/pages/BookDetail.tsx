import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  ArrowLeft,
  ShoppingCart,
  BookOpen,
  Calendar,
  Hash,
  FileText,
  ChevronDown,
  Heart,
  Facebook,
  Instagram,
  ZoomIn,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { Item } from '@/types';
import { bookService } from '@/services/bookService';
import { wishlistService } from '@/services/wishlistService';

// Custom X (formerly Twitter) icon
const XIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const bookId = id ?? '';

  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);

  // Scroll to top when book changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [bookId]);

  // ===== LOAD BOOK FROM SUPABASE =====
  const { data: book, isLoading } = useQuery({
    queryKey: ['item', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', bookId)
        .single();

      if (error) throw error;
      return data as Item;
    },
    enabled: !!bookId,
  });

  // Google Books enrichment
  const { data: enrichedData } = useQuery({
    queryKey: ['google-books-details', book?.isbn],
    queryFn: async () => {
      if (!book?.isbn) return null;
      return await bookService.getBookDetailsByISBN(book.isbn);
    },
    enabled: !!book?.isbn,
  });

  // Related books
  const { data: relatedBooks = [] } = useQuery({
    queryKey: ['related-items', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('active', true)
        .neq('id', bookId)
        .limit(5);

      if (error) throw error;
      return data as Item[];
    },
    enabled: !!bookId,
  });

  // ===== TRACK RECENT + CHECK WISHLIST =====
  useEffect(() => {
    if (!book) return;

    // Recently viewed
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const bookData = {
      id: book.id,
      name: book.name,
      price_cents: book.price_cents,
      img_url: book.img_url ?? "",
      author: book.author ?? undefined,
    };

    const filtered = recentlyViewed.filter((b: any) => b.id !== book.id);
    const updated = [bookData, ...filtered].slice(0, 6);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));

    // Check if book is in wishlist
    if (user) {
      wishlistService.isInWishlist(user.id, book.id).then(setIsFavorited);
    } else {
      setIsFavorited(false);
    }
  }, [book, user]);

  // ===== ADD TO CART =====
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.warning('Please sign in to add items to your cart.');
        navigate('/auth');
        throw new Error('User not signed in');
      }

      // Get/create cart
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!cart) {
        const { data: newCart, error } = await supabase
          .from('carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (error) throw error;
        cart = newCart;
      }

      // Update or add item
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('qty')
        .eq('cart_id', cart.id)
        .eq('item_id', bookId)
        .single();

      if (existingItem) {
        await supabase
          .from('cart_items')
          .update({ qty: existingItem.qty + quantity })
          .eq('cart_id', cart.id)
          .eq('item_id', bookId);
      } else {
        await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            item_id: bookId,
            qty: quantity,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Added to cart!');
      setJustAddedToCart(true);
    },
  });

  // ===== WISHLIST TOGGLE (DATABASE) =====
  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate("/auth");
        toast.success("Please log in to add to wishlist");
        throw new Error('User not authenticated');
      }

      if (!book) throw new Error('Book not found');

      if (isFavorited) {
        await wishlistService.removeFromWishlist(user.id, book.id);
        return { action: 'removed' };
      } else {
        await wishlistService.addToWishlist(user.id, book.id);
        return { action: 'added' };
      }
    },
    onSuccess: (data) => {
      if (data.action === 'added') {
        setIsFavorited(true);
        toast.success("Added to wishlist");
      } else {
        setIsFavorited(false);
        toast.success("Removed from wishlist");
      }
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (error: Error) => {
      if (error.message !== 'User not authenticated') {
        toast.error('Failed to update wishlist');
      }
    },
  });

  const toggleFavorite = () => {
    toggleWishlistMutation.mutate();
  };

  // Mock reviews
  const mockReviews = [
    { id: 1, name: 'Sarah M.', rating: 5, date: '2024-11-15', text: `Absolutely loved "${book?.name}"!` },
    { id: 2, name: 'John D.', rating: 4, date: '2024-11-10', text: `"${book?.name}" exceeded my expectations.` },
    { id: 3, name: 'Emily R.', rating: 5, date: '2024-11-05', text: `One of the best books I've read this year!` },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-12">
            <Skeleton className="h-[500px] rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Book not found</h1>
          <Link to="/catalog">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 relative z-10">

        {/* Back Button */}
        <Link to="/catalog">
          <Button
            variant="ghost"
            className="mb-4 bg-background/80 hover:bg-background/90 backdrop-blur-sm text-foreground shadow-md rounded-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>
        </Link>

        {/* Book Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12">

          {/* Book Cover */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-start order-first">
            <div
              className="relative group cursor-pointer w-full max-w-sm lg:max-w-none"
              onClick={() => setIsImageZoomed(true)}
            >
              <div className="absolute -inset-4 bg-accent/20 rounded-2xl blur-xl group-hover:bg-accent/30 transition-all duration-500" />
              <img
                src={book.img_url || '/placeholder.svg'}
                alt={book.name}
                className="relative w-full object-cover rounded-xl shadow-medium transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl flex items-center justify-center transition-opacity">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={40} />
              </div>
              <p className="text-center text-base text-muted-foreground mt-4">
                by {book.author || 'Unknown Author'}
              </p>
            </div>

            {/* Wishlist + Share */}
            <div className="mt-6 space-y-3 w-full max-w-sm lg:max-w-none">
              <button
                onClick={toggleFavorite}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isFavorited
                    ? 'bg-accent text-accent-foreground'
                    : 'border-2 border-border text-foreground hover:border-accent hover:bg-accent/10'
                }`}
              >
                <Heart size={20} className={isFavorited ? 'fill-current' : ''} />
                {isFavorited ? 'In Wishlist' : 'Add to Wishlist'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#1877F2] text-white rounded-lg hover:opacity-90"
                >
                  <Facebook size={18} />
                  <span className="text-sm font-medium">Share</span>
                </button>

                <button
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${book.name}!`)}`, '_blank')}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-foreground text-background rounded-lg hover:opacity-90"
                >
                  <XIcon size={18} />
                  <span className="text-sm font-medium">Post</span>
                </button>

                <button
                  onClick={() => {
                    window.open('https://www.instagram.com/', '_blank');
                    toast.info('Copy the link and share on Instagram!');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-warm text-accent-foreground rounded-lg hover:opacity-90"
                >
                  <Instagram size={18} />
                  <span className="text-sm font-medium">Post</span>
                </button>
              </div>
            </div>
          </div>

          {/* Image Zoom Modal */}
          <Dialog open={isImageZoomed} onOpenChange={setIsImageZoomed}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{book.name}</DialogTitle>
              </DialogHeader>
              <img
                src={book.img_url || '/placeholder.svg'}
                alt={book.name}
                className="w-full h-auto rounded-lg"
              />
            </DialogContent>
          </Dialog>

          {/* Middle Column - Title + Description */}
          <div className="lg:col-span-6 space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{book.name}</h1>

            {/* Description */}
            <div className="p-4 bg-card/50 rounded-xl border border-border">
              {(() => {
                const description =
                  book.description || enrichedData?.description || 'No description available.';
                const isLong = description.length > 200;
                const truncated = isLong ? description.slice(0, 200) + '...' : description;

                return (
                  <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
                    <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-accent" />
                      Description
                    </h3>

                    <div className="text-sm text-foreground/80 leading-relaxed">
                      {!isDescriptionOpen && isLong ? (
                        <p>{truncated}</p>
                      ) : (
                        <CollapsibleContent>
                          <p>{description}</p>
                        </CollapsibleContent>
                      )}
                    </div>

                    {isLong && (
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-accent hover:text-accent/80 p-0 h-auto font-medium"
                        >
                          {isDescriptionOpen ? 'Read Less' : 'Read More'}
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${
                            isDescriptionOpen ? 'rotate-180' : ''
                          }`} />
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  </Collapsible>
                );
              })()}
            </div>

            {/* Book Details */}
            {(book.publisher ||
              enrichedData?.publisher?.[0] ||
              book.publish_year ||
              enrichedData?.publish_year?.[0] ||
              book.page_count ||
              enrichedData?.number_of_pages ||
              book.isbn ||
              book.isbn_10) && (
              <div className="p-4 bg-card/50 rounded-xl border border-border">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  Book Details
                </h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(book.publisher || enrichedData?.publisher?.[0]) && (
                    <div>
                      <p className="text-xs text-muted-foreground">Publisher</p>
                      <p className="text-foreground font-medium">
                        {book.publisher || enrichedData?.publisher?.[0]}
                      </p>
                    </div>
                  )}

                  {(book.publish_year || enrichedData?.publish_year?.[0]) && (
                    <div>
                      <p className="text-xs text-muted-foreground">Published</p>
                      <p className="text-foreground font-medium">
                        {book.publish_year || enrichedData?.publish_year?.[0]}
                      </p>
                    </div>
                  )}

                  {(book.page_count || enrichedData?.number_of_pages) && (
                    <div>
                      <p className="text-xs text-muted-foreground">Pages</p>
                      <p className="text-foreground font-medium">
                        {book.page_count || enrichedData?.number_of_pages}
                      </p>
                    </div>
                  )}

                  {book.isbn && (
                    <div>
                      <p className="text-xs text-muted-foreground">ISBN-13</p>
                      <p className="text-foreground font-medium text-xs">{book.isbn}</p>
                    </div>
                  )}

                  {book.isbn_10 && (
                    <div>
                      <p className="text-xs text-muted-foreground">ISBN-10</p>
                      <p className="text-foreground font-medium text-xs">{book.isbn_10}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Price + Add to Cart */}
          <div className="lg:col-span-3 order-2 lg:order-last">
            <div className="p-4 sm:p-6 bg-card/50 rounded-xl space-y-4 sm:space-y-6 lg:sticky lg:top-24">

              {/* SALE BADGE */}
              {book.on_sale && book.sale_percentage && (
                <div className="absolute -top-3 -right-3 bg-gradient-warm text-accent-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10">
                  {book.sale_percentage}% OFF SALE!
                </div>
              )}

              {/* STOCK */}
              <div className="text-center">
                {book.stock < 5 && book.stock > 0 && (
                  <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-semibold">
                    Only {book.stock} left!
                  </span>
                )}
                {book.stock === 0 && (
                  <span className="inline-block px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-semibold">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* PRICE BREAKDOWN */}
              {(() => {
                const isOnSale = book.on_sale && book.sale_price_cents;
                const discounted = isOnSale
                  ? book.sale_price_cents || book.price_cents
                  : book.price_cents;

                return (
                  <>
                    <div className="space-y-3 border-b border-border pb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <div className="flex items-center gap-2">
                          {isOnSale && (
                            <span className="text-sm line-through text-muted-foreground">
                              ${(book.price_cents / 100).toFixed(2)}
                            </span>
                          )}
                          <span className={`text-lg font-semibold ${isOnSale ? 'text-accent' : ''}`}>
                            ${(discounted / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Quantity</span>
                        <span className="text-sm font-medium text-foreground">{quantity}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Subtotal</span>
                        <span className="text-base font-semibold text-foreground">
                          ${((discounted * quantity) / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Shipping</span>
                        <span className="text-sm text-muted-foreground">$0.00</span>
                      </div>
                    </div>

                    {/* FINAL TOTAL */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-foreground">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        ${((discounted * quantity) / 100).toFixed(2)}
                      </span>
                    </div>
                  </>
                );
              })()}

              {/* Quantity Selector */}
              {book.stock > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Quantity</label>
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(book.stock, Math.max(1, val)));
                      }}
                      className="w-20 text-center"
                      min={1}
                      max={book.stock}
                    />

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(book.stock, quantity + 1))}
                      disabled={quantity >= book.stock}
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{book.stock} available</p>
                </div>
              )}

              {/* Add to cart */}
              <Button
                size="lg"
                className="btn-primary w-full"
                disabled={book.stock === 0}
                onClick={() => addToCartMutation.mutate()}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              {/* Checkout */}
              {justAddedToCart && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-accent text-accent hover:bg-accent/10"
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mb-12">
          <div className="bg-card/50 rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Customer Reviews</h2>

              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={star <= 4.67 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">4.67</span>
                <span className="text-sm text-muted-foreground">({mockReviews.length} reviews)</span>
              </div>
            </div>

            <div className="mb-8 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = mockReviews.filter((r) => r.rating === rating).length;
                const percentage = (count / mockReviews.length) * 100;

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-12">{rating} star</span>

                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Individual reviews */}
            <div className="space-y-6">
              {mockReviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-none">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.name}</p>

                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }
                            />
                          ))}
                        </div>

                        <span className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-foreground/80">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="pb-12">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {relatedBooks.map((item) => (
                <Link key={item.id} to={`/book/${item.id}`}>
                  <div className="group bg-card/50 border border-border rounded-lg p-4 hover:shadow-lg hover:-translate-y-1 transition-all">
                    {item.img_url && (
                      <div className="overflow-hidden rounded-md mb-3">
                        <img
                          src={item.img_url}
                          alt={item.name}
                          className="w-full h-40 object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    )}

                    <h3 className="font-bold text-foreground truncate group-hover:text-accent">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {item.author || 'Unknown'}
                    </p>

                    <p className="font-bold text-gray-900 mt-2">
                      ${(item.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BookDetail;
