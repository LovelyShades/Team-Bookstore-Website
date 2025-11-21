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
import { ArrowLeft, ShoppingCart, BookOpen, Calendar, User, Hash, FileText, ChevronDown, Heart, Share2, Facebook, Instagram, ZoomIn, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Item } from '@/types';
import { bookService } from '@/services/bookService';

// Custom X (formerly Twitter) icon
const XIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Item;
    },
  });

  // Fetch enriched data from Google Books if ISBN exists
  const { data: enrichedData } = useQuery({
    queryKey: ['google-books-details', book?.isbn],
    queryFn: async () => {
      if (!book?.isbn) return null;
      return await bookService.getBookDetailsByISBN(book.isbn);
    },
    enabled: !!book?.isbn,
  });

  const { data: relatedBooks = [] } = useQuery({
    queryKey: ['related-items', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('active', true)
        .neq('id', id)
        .limit(5);
      
      if (error) throw error;
      return data as Item[];
    },
    enabled: !!id,
  });

  // Track recently viewed books and check wishlist status
  useEffect(() => {
    if (book) {
      // Track recently viewed
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const bookData = { id: book.id, name: book.name, price_cents: book.price_cents, img_url: book.img_url, author: book.author };
      
      const filtered = recentlyViewed.filter((b: any) => b.id !== book.id);
      const updated = [bookData, ...filtered].slice(0, 6);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      
      // Check if in wishlist
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setIsFavorited(wishlist.some((b: any) => b.id === book.id));
    }
  }, [book]);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.warning('Please sign in to add items to your cart.');
        navigate('/auth');
        throw new Error('User not signed in');
      }

      // Get or create cart
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

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('qty')
        .eq('cart_id', cart.id)
        .eq('item_id', id)
        .single();

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ qty: existingItem.qty + quantity })
          .eq('cart_id', cart.id)
          .eq('item_id', id);
        
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cart.id,
            item_id: id,
            qty: quantity,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
      toast.success('Added to cart!');
    },
    onError: (error) => {
      if (error.message == 'User not signed in') {
        return;
      }

      toast.error('Failed to add to cart');
    },
  });

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${book?.name}!`;
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      instagram: 'https://www.instagram.com/'
    };

    if (platform === 'instagram') {
      window.open(shareUrls[platform], '_blank');
      toast.info('Copy the link and share on Instagram!');
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      toast.info('Opening share dialog...');
    }
  };

  const toggleFavorite = () => {
    if (!book) return;
    
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const bookData = { id: book.id, name: book.name, price_cents: book.price_cents, img_url: book.img_url, author: book.author };
    
    if (isFavorited) {
      const filtered = wishlist.filter((b: any) => b.id !== book.id);
      localStorage.setItem('wishlist', JSON.stringify(filtered));
      setIsFavorited(false);
      toast.success('Removed from wishlist!');
    } else {
      const updated = [bookData, ...wishlist];
      localStorage.setItem('wishlist', JSON.stringify(updated));
      setIsFavorited(true);
      toast.success('Added to wishlist!');
    }
  };

  // Mock review data (you can replace with real data from database)
  const mockReviews = [
    { id: 1, name: 'Sarah M.', rating: 5, date: '2024-11-15', text: `Absolutely loved "${book?.name}"! The writing is captivating and the story kept me hooked from start to finish.` },
    { id: 2, name: 'John D.', rating: 4, date: '2024-11-10', text: `"${book?.name}" exceeded my expectations. Well-written and engaging throughout.` },
    { id: 3, name: 'Emily R.', rating: 5, date: '2024-11-05', text: `One of the best books I've read this year! Highly recommend "${book?.name}".` }
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
          <Button variant="ghost" className="mb-4 bg-background/80 hover:bg-background/90 backdrop-blur-sm text-foreground shadow-md rounded-lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>
        </Link>

        {/* Book Details - Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Column 1: Book Cover (3 columns) */}
          <div className="lg:col-span-3">
            <div className="relative group cursor-pointer" onClick={() => setIsImageZoomed(true)}>
              <div className="absolute -inset-4 bg-accent/20 rounded-2xl blur-xl group-hover:bg-accent/30 transition-all duration-500" />
              <img
                src={book.img_url || '/placeholder.svg'}
                alt={book.name}
                className="relative w-full object-cover rounded-xl shadow-medium transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-xl flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={40} />
              </div>
              <p className="text-center text-base text-muted-foreground mt-4">by {book.author || 'Unknown Author'}</p>
            </div>
            
            {/* Social Sharing Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={toggleFavorite}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isFavorited
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                    : 'border-2 border-gray-300 text-gray-700 hover:border-pink-500'
                }`}
              >
                <Heart
                  size={20}
                  className={isFavorited ? 'fill-current' : ''}
                />
                {isFavorited ? 'In Wishlist' : 'Add to Wishlist'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleShare('facebook')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-info text-white rounded-lg hover:opacity-90 transition-all"
                >
                  <Facebook size={18} />
                  <span className="text-sm font-medium">Share</span>
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-all"
                >
                  <XIcon size={18} />
                  <span className="text-sm font-medium">Post</span>
                </button>
                <button
                  onClick={() => handleShare('instagram')}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-warm text-accent-foreground rounded-lg hover:opacity-90 transition-all"
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

          {/* Column 2: Title, Description, and Details (6 columns) */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{book.name}</h1>
            </div>
            
            {/* Description */}
            <div className="p-4 bg-card/50 rounded-xl border border-border">
              {(() => {
                const description = book.description || enrichedData?.description || 'No description available for this book.';
                const isLongDescription = description.length > 200;
                const truncatedDescription = isLongDescription ? description.slice(0, 200) + '...' : description;

                return (
                  <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
                    <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-accent" />
                      Description
                    </h3>
                    <div className="text-sm text-foreground/80 leading-relaxed">
                      {!isDescriptionOpen && isLongDescription ? (
                        <p>{truncatedDescription}</p>
                      ) : (
                        <CollapsibleContent className="animate-accordion-down">
                          <p>{description}</p>
                        </CollapsibleContent>
                      )}
                    </div>
                    {isLongDescription && (
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-accent hover:text-accent/80 p-0 h-auto font-medium"
                        >
                          {isDescriptionOpen ? 'Read Less' : 'Read More'}
                          <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isDescriptionOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  </Collapsible>
                );
              })()}
            </div>

            {/* Book Details */}
            {(book.publisher || enrichedData?.publisher?.[0] || book.publish_year || enrichedData?.publish_year?.[0] || book.page_count || enrichedData?.number_of_pages || book.isbn || book.isbn_10) && (
              <div className="p-4 bg-card/50 rounded-xl border border-border">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  Book Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(book.publisher || enrichedData?.publisher?.[0]) && (
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Publisher</p>
                        <p className="text-foreground font-medium">{book.publisher || enrichedData?.publisher?.[0]}</p>
                      </div>
                    </div>
                  )}
                  {(book.publish_year || enrichedData?.publish_year?.[0]) && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Published</p>
                        <p className="text-foreground font-medium">{book.publish_year || enrichedData?.publish_year?.[0]}</p>
                      </div>
                    </div>
                  )}
                  {(book.page_count || enrichedData?.number_of_pages) && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Pages</p>
                        <p className="text-foreground font-medium">{book.page_count || enrichedData?.number_of_pages}</p>
                      </div>
                    </div>
                  )}
                  {book.isbn && (
                    <div className="flex items-start gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">ISBN-13</p>
                        <p className="text-foreground font-medium text-xs">{book.isbn}</p>
                      </div>
                    </div>
                  )}
                  {book.isbn_10 && (
                    <div className="flex items-start gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">ISBN-10</p>
                        <p className="text-foreground font-medium text-xs">{book.isbn_10}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Price, Quantity, and Add to Cart (3 columns) */}
          <div className="lg:col-span-3">
            <div className="p-6 bg-card/50 rounded-xl space-y-6 sticky top-24 relative">
              {/* Check if book is on sale - for demo, books with prices ending in specific patterns */}
              {(() => {
                const lastDigit = book.price_cents % 10;
                const isOnSale = lastDigit === 0 || lastDigit === 5;
                const salePercent = lastDigit === 0 ? 15 : lastDigit === 5 ? 20 : 0;
                
                return isOnSale ? (
                  <div className="absolute -top-3 -right-3 bg-gradient-warm text-accent-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10 flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                    {salePercent}% OFF SALE!
                  </div>
                ) : null;
              })()}
              
              {/* Stock Status */}
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

              {/* Price Breakdown */}
              <div className="space-y-3 border-b border-border pb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-lg font-semibold text-foreground">
                    ${(book.price_cents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <span className="text-sm font-medium text-foreground">{quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-base font-semibold text-foreground">
                    ${((book.price_cents * quantity) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tax (estimated)</span>
                  <span className="text-sm text-muted-foreground">
                    ${(((book.price_cents * quantity) / 100) * 0.08).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${(((book.price_cents * quantity) / 100) * 1.08).toFixed(2)}
                </span>
              </div>

              {/* Quantity Selector */}
              {book.stock > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Select Quantity</label>
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
                  <p className="text-xs text-muted-foreground text-center">
                    {book.stock} available
                  </p>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                size="lg"
                className="btn-primary w-full"
                disabled={book.stock === 0}
                onClick={() => addToCartMutation.mutate()}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
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
                <span className="text-lg font-semibold text-foreground">4.67</span>
                <span className="text-sm text-muted-foreground">({mockReviews.length} reviews)</span>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="mb-8 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = mockReviews.filter(r => r.rating === rating).length;
                const percentage = (count / mockReviews.length) * 100;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-12">{rating} star</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              {mockReviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{review.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="pb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {relatedBooks.map((item) => (
                <Link key={item.id} to={`/book/${item.id}`}>
                  <div className="group bg-card/50 border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    {item.img_url && (
                      <div className="overflow-hidden rounded-md mb-3">
                        <img 
                          src={item.img_url} 
                          alt={item.name} 
                          className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                      </div>
                    )}
                    <h3 className="font-bold text-foreground truncate group-hover:text-accent transition-colors">{item.name}</h3>
                    <p className="text-sm text-muted-foreground truncate mt-1">{item.author || 'Unknown'}</p>
                    <p className="font-bold text-gray-900 mt-2">${(item.price_cents / 100).toFixed(2)}</p>
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
