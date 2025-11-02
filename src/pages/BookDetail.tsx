import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ArrowLeft, ShoppingCart, BookOpen, Calendar, User, Hash, FileText, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Item } from '@/types';
import { bookService } from '@/services/bookService';

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

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

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate('/auth');
        return;
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
    onError: () => {
      toast.error('Failed to add to cart');
    },
  });

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
      {/* Hero Background */}
      <div
        className="h-40 bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${book.img_url || '/placeholder.svg'})`,
          filter: 'blur(20px)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-background via-background/95 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Back Button */}
        <Link to="/catalog">
          <Button variant="ghost" className="mb-6 bg-background/80 hover:bg-background/90 backdrop-blur-sm text-foreground shadow-md">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Catalog
          </Button>
        </Link>

        {/* Book Details - Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Column 1: Book Cover (3 columns) */}
          <div className="lg:col-span-3">
            <div className="relative group">
              <div className="absolute -inset-4 bg-accent/20 rounded-2xl blur-xl group-hover:bg-accent/30 transition-all duration-500" />
              <img
                src={book.img_url || '/placeholder.svg'}
                alt={book.name}
                className="relative w-full object-cover rounded-xl shadow-medium transform group-hover:scale-105 transition-transform duration-500"
              />
              <p className="text-center text-base text-muted-foreground mt-4">by {book.author || 'Unknown Author'}</p>
            </div>
          </div>

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
            <div className="p-6 bg-card/50 rounded-xl space-y-6 sticky top-24">
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
                <span className="text-2xl font-bold text-accent">
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
                className="w-full"
                disabled={book.stock === 0}
                onClick={() => addToCartMutation.mutate()}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>

        {/* Related Books */}
        {relatedBooks.length > 0 && (
          <section className="pb-12">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {relatedBooks.map((item) => (
                <Link key={item.id} to={`/book/${item.id}`}>
                  <div className="border p-2">
                    {item.img_url && <img src={item.img_url} alt={item.name} className="w-full h-40 object-cover mb-2" />}
                    <div className="font-bold truncate">{item.name}</div>
                    <div className="text-sm truncate">{item.author || 'Unknown'}</div>
                    <div className="font-bold">${(item.price_cents / 100).toFixed(2)}</div>
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
