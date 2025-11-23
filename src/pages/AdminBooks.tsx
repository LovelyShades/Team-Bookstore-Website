import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bookService } from '@/services/bookService';
import { OpenLibraryBook, Item } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Search, Plus, Trash2, Edit, BookOpen, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminBooks() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenLibraryBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBook | null>(null);
  const [editingBook, setEditingBook] = useState<Item | null>(null);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterFeatured, setFilterFeatured] = useState<'all' | 'featured' | 'not-featured'>('all');
  const [filterSales, setFilterSales] = useState<'all' | 'on-sale' | 'not-on-sale'>('all');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [formData, setFormData] = useState({
    price_cents: 2999,
    stock: 10,
    active: true,
    featured: false,
    description: '',
    on_sale: false,
    sale_input_mode: 'price' as 'price' | 'percentage',
    sale_price_cents: '',
    sale_percentage: '',
    sale_ends_at: '',
  });

  const { data: existingBooks, isLoading: booksLoading } = useQuery({
    queryKey: ['admin-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Item[];
    },
  });

  const addBookMutation = useMutation({
    mutationFn: async (bookData: {
      name: string;
      price_cents: number;
      stock: number;
      active: boolean;
      featured: boolean;
      img_url: string | null;
      hero_img_url: string | null;
      isbn?: string | null;
      isbn_10?: string | null;
      author?: string | null;
      description?: string | null;
      publish_year?: number | null;
      open_library_id?: string | null;
      publisher?: string | null;
      page_count?: number | null;
    }) => {
      const { data, error } = await supabase
        .from('items')
        .insert([bookData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      queryClient.invalidateQueries({ queryKey: ['featured-items'] });
      toast.success('Book added successfully!');
      setSelectedBook(null);
      setSearchQuery('');
      setSearchResults([]);
      setFormData({ price_cents: 2999, stock: 10, active: true, featured: false, description: '', on_sale: false, sale_input_mode: 'price', sale_price_cents: '', sale_percentage: '', sale_ends_at: '' });
    },
    onError: (error) => {
      toast.error('Failed to add book: ' + error.message);
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, bookData }: { id: string; bookData: Partial<Item> }) => {
      const { data, error } = await supabase
        .from('items')
        .update(bookData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      queryClient.invalidateQueries({ queryKey: ['featured-items'] });
      toast.success('Book updated successfully!');
      setEditingBook(null);
      setFormData({ price_cents: 2999, stock: 10, active: true, featured: false, description: '', on_sale: false, sale_input_mode: 'price', sale_price_cents: '', sale_percentage: '', sale_ends_at: '' });
    },
    onError: (error) => {
      toast.error('Failed to update book: ' + error.message);
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use database function to delete book with CASCADE behavior
      const { error } = await supabase.rpc('fn_delete_book', {
        p_book_id: id,
      });

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      toast.success('Book deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      toast.error('Failed to delete book: ' + (error.message || 'Unknown error'));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Use database function to delete multiple books with CASCADE behavior
      const { error } = await supabase.rpc('fn_delete_books', {
        p_book_ids: ids,
      });

      if (error) {
        console.error('Bulk delete error:', error);
        throw error;
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] });
      setSelectedBooks(new Set());
      setSelectAll(false);
      toast.success(`Successfully deleted ${ids.length} book${ids.length > 1 ? 's' : ''}!`);
    },
    onError: (error: any) => {
      console.error('Bulk delete mutation error:', error);
      toast.error('Failed to delete books: ' + (error.message || 'Unknown error'));
    },
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearching(true);
    try {
      const results = await bookService.searchBooks(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info('No books found. Try a different search term.');
      } else {
        toast.success(`Found ${results.length} books`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search books. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBook = async (book: OpenLibraryBook) => {
    setSelectedBook(book);
    // Google Books already provides description, so just set it
    setFormData(prev => ({ ...prev, description: book.description || '' }));
  };

  const handleAddBook = () => {
    if (!selectedBook) return;

    const bookData = {
      ...bookService.formatBookForDatabase(selectedBook),
      price_cents: formData.price_cents,
      stock: formData.stock,
      active: formData.active,
      featured: formData.featured,
      description: formData.description || null,
    };

    addBookMutation.mutate(bookData);
  };

  const handleUpdateBook = () => {
    if (!editingBook) return;

    const salePriceCents = formData.on_sale
      ? (typeof formData.sale_price_cents === 'string' && formData.sale_price_cents ? parseInt(formData.sale_price_cents) : 0)
      : null;

    const salePercentage = formData.on_sale && salePriceCents
      ? Math.round(((formData.price_cents - salePriceCents) / formData.price_cents) * 100)
      : null;

    const bookData: any = {
      price_cents: formData.price_cents,
      stock: formData.stock,
      active: formData.active,
      featured: formData.featured,
      description: formData.description || null,
      on_sale: formData.on_sale,
      sale_price_cents: salePriceCents,
      sale_percentage: salePercentage,
      sale_ends_at: formData.on_sale && formData.sale_ends_at ? formData.sale_ends_at : null,
    };

    updateBookMutation.mutate({ id: editingBook.id, bookData });
  };

  const handleEditBook = (book: Item) => {
    setEditingBook(book);
    setSelectedBook(null);
    setFormData({
      price_cents: book.price_cents,
      stock: book.stock,
      active: book.active,
      featured: book.featured || false,
      description: book.description || '',
      on_sale: book.on_sale || false,
      sale_input_mode: 'price' as 'price' | 'percentage',
      sale_price_cents: book.sale_price_cents ? book.sale_price_cents.toString() : '',
      sale_percentage: book.sale_percentage ? book.sale_percentage.toString() : '',
      sale_ends_at: book.sale_ends_at ? new Date(book.sale_ends_at).toISOString().slice(0, 16) : '',
    });
    // Scroll to top to show the edit form
    window.scrollTo(0, 0);
  };

  const filteredBooks = existingBooks?.filter(book => {
    const matchesSearch = filterSearch === '' ||
      book.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      book.author?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      book.isbn?.includes(filterSearch);

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? book.active : !book.active);

    const matchesFeatured = filterFeatured === 'all' ||
      (filterFeatured === 'featured' ? book.featured : !book.featured);

    const matchesSales = filterSales === 'all' ||
      (filterSales === 'on-sale' ? book.on_sale : !book.on_sale);

    return matchesSearch && matchesStatus && matchesFeatured && matchesSales;
  }) || [];

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedBooks(new Set());
      setSelectAll(false);
    } else {
      setSelectedBooks(new Set(filteredBooks.map(book => book.id)));
      setSelectAll(true);
    }
  };

  const handleToggleBook = (bookId: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBooks(newSelected);
    setSelectAll(newSelected.size === filteredBooks.length && filteredBooks.length > 0);
  };

  const handleBulkDelete = () => {
    if (selectedBooks.size === 0) {
      toast.error('No books selected');
      return;
    }

    const count = selectedBooks.size;
    if (confirm(`Are you sure you want to delete ${count} book${count > 1 ? 's' : ''}?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedBooks));
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Book Management</h2>
          <p className="text-muted-foreground">Search and add books to your catalog</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle>Search Google Books</CardTitle>
              <CardDescription>Search by title, author, or ISBN</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for books..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searching && (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Searching Google Books...</p>
                  <p className="text-xs text-muted-foreground">
                    Fast search with complete metadata
                  </p>
                </div>
              )}


              {searchResults.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {searchResults.length} results
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searching && <Skeleton className="h-24" />}
                {searchResults.map((book) => (
                  <Card
                    key={book.key}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedBook?.key === book.key ? 'border-primary' : ''
                    }`}
                    onClick={() => handleSelectBook(book)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {book.cover?.large && (
                          <img
                            src={book.cover.large}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{book.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {book.author_name?.[0] || 'Unknown Author'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {book.first_publish_year || book.publish_year?.[0] || 'Year unknown'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit Book Form */}
          <Card>
            <CardHeader>
              <CardTitle>{editingBook ? 'Edit Book' : 'Add Book to Catalog'}</CardTitle>
              <CardDescription>
                {editingBook
                  ? 'Update pricing and availability'
                  : selectedBook
                    ? 'Configure pricing and availability'
                    : 'Select a book to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingBook ? (
                <>
                  <div className="flex gap-4 p-4 bg-muted rounded-lg">
                    {editingBook.img_url && (
                      <img
                        src={editingBook.img_url}
                        alt={editingBook.name}
                        className="w-24 h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{editingBook.name}</h3>
                      <p className="text-muted-foreground">
                        {editingBook.author || 'Unknown Author'}
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1 mt-2">
                        {editingBook.isbn && <p>ISBN: {editingBook.isbn}</p>}
                        {editingBook.publisher && <p>Publisher: {editingBook.publisher}</p>}
                        {editingBook.publish_year && <p>Year: {editingBook.publish_year}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="price"
                          type="text"
                          value={(formData.price_cents / 100).toFixed(2)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, '');
                            const cents = digits === '' ? 0 : parseInt(digits);
                            setFormData(prev => ({ ...prev, price_cents: cents }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                              e.preventDefault();
                              const currentCents = formData.price_cents;
                              const newCents = Math.floor(currentCents / 10);
                              setFormData(prev => ({ ...prev, price_cents: newCents }));
                            }
                          }}
                          className="pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setFormData(prev => ({ ...prev, stock: value }));
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="Book description..."
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="active">Show in Catalog</Label>
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="featured">Add to Featured Banner</Label>
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => {
                          if (checked && !editingBook?.featured) {
                            const featuredCount = existingBooks?.filter(b => b.featured && b.id !== editingBook?.id).length || 0;
                            if (featuredCount >= 3) {
                              toast.error('Only 3 books can be featured at once. Please remove a featured book first.');
                              return;
                            }
                          }
                          setFormData(prev => ({ ...prev, featured: checked }));
                        }}
                      />
                    </div>

                    {/* Sale Section */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Label htmlFor="on_sale" className="text-base font-semibold">Put on Sale</Label>
                          <p className="text-xs text-muted-foreground">Enable special pricing</p>
                        </div>
                        <Switch
                          id="on_sale"
                          checked={formData.on_sale}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, on_sale: checked }))}
                        />
                      </div>

                      {formData.on_sale && (
                        <div className="space-y-4 pl-4 border-l-2 border-accent">
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={formData.sale_input_mode === 'price' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, sale_input_mode: 'price' }))}
                                className="flex-1"
                              >
                                Set Price
                              </Button>
                              <Button
                                type="button"
                                variant={formData.sale_input_mode === 'percentage' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, sale_input_mode: 'percentage' }))}
                                className="flex-1"
                              >
                                Set % Off
                              </Button>
                            </div>

                            {formData.sale_input_mode === 'price' ? (
                              <div>
                                <Label htmlFor="sale_price">Sale Price</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input
                                    id="sale_price"
                                    type="text"
                                    value={formData.sale_price_cents ? ((typeof formData.sale_price_cents === 'string' ? parseInt(formData.sale_price_cents) : formData.sale_price_cents) / 100).toFixed(2) : '0.00'}
                                    onChange={(e) => {
                                      const digits = e.target.value.replace(/[^0-9]/g, '');
                                      const cents = digits === '' ? '' : parseInt(digits).toString();
                                      setFormData(prev => ({ ...prev, sale_price_cents: cents }));
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Backspace') {
                                        e.preventDefault();
                                        const currentCents = typeof formData.sale_price_cents === 'string' ? parseInt(formData.sale_price_cents) || 0 : formData.sale_price_cents;
                                        const newCents = Math.floor(currentCents / 10);
                                        setFormData(prev => ({ ...prev, sale_price_cents: newCents > 0 ? newCents.toString() : '' }));
                                      }
                                    }}
                                    className="pl-7"
                                    placeholder="0.00"
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Must be less than ${(formData.price_cents / 100).toFixed(2)}
                                  {formData.sale_price_cents && (
                                    <span className="text-accent font-semibold ml-2">
                                      ({Math.round(((formData.price_cents - parseInt(formData.sale_price_cents)) / formData.price_cents) * 100)}% off)
                                    </span>
                                  )}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <Label htmlFor="sale_percentage">Percentage Off</Label>
                                <div className="relative">
                                  <Input
                                    id="sale_percentage"
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={formData.sale_percentage}
                                    onChange={(e) => {
                                      const percentage = parseInt(e.target.value) || 0;
                                      if (percentage >= 0 && percentage <= 100) {
                                        const salePriceCents = Math.round(formData.price_cents * (1 - percentage / 100));
                                        setFormData(prev => ({
                                          ...prev,
                                          sale_percentage: e.target.value,
                                          sale_price_cents: salePriceCents.toString()
                                        }));
                                      }
                                    }}
                                    className="pr-7"
                                    placeholder="0"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {formData.sale_percentage && parseInt(formData.sale_percentage) > 0 && (
                                    <span className="text-accent font-semibold">
                                      Sale price: ${(formData.price_cents * (1 - parseInt(formData.sale_percentage) / 100) / 100).toFixed(2)}
                                    </span>
                                  )}
                                </p>
                              </div>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="sale_ends_at">Sale Ends (optional)</Label>
                            <Input
                              id="sale_ends_at"
                              type="datetime-local"
                              value={formData.sale_ends_at}
                              onChange={(e) => setFormData(prev => ({ ...prev, sale_ends_at: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Leave empty for indefinite sale
                            </p>
                          </div>
                        </div>
                      )}
                    </div>                   

                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateBook}
                        disabled={updateBookMutation.isPending}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update Book
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingBook(null);
                          setFormData({ price_cents: 2999, stock: 10, active: true, featured: false, description: '', on_sale: false, sale_input_mode: 'price', sale_price_cents: '', sale_percentage: '', sale_ends_at: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </>
              ) : selectedBook ? (
                <>
                  <div className="flex gap-4 p-4 bg-muted rounded-lg">
                    {selectedBook.cover?.large && (
                      <img
                        src={selectedBook.cover.large}
                        alt={selectedBook.title}
                        className="w-24 h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{selectedBook.title}</h3>
                      <p className="text-muted-foreground">
                        {selectedBook.author_name?.[0] || 'Unknown Author'}
                      </p>
                      <div className="text-sm text-muted-foreground space-y-1 mt-2">
                        {selectedBook.isbn?.[0] && <p>ISBN: {selectedBook.isbn[0]}</p>}
                        {selectedBook.publisher?.[0] && <p>Publisher: {selectedBook.publisher[0]}</p>}
                        {(selectedBook.first_publish_year || selectedBook.publish_year?.[0]) && (
                          <p>Year: {selectedBook.first_publish_year || selectedBook.publish_year?.[0]}</p>
                        )}
                        {selectedBook.number_of_pages && <p>Pages: {selectedBook.number_of_pages}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="price"
                          type="text"
                          value={(formData.price_cents / 100).toFixed(2)}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, '');
                            const cents = digits === '' ? 0 : parseInt(digits);
                            setFormData(prev => ({ ...prev, price_cents: cents }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                              e.preventDefault();
                              const currentCents = formData.price_cents;
                              const newCents = Math.floor(currentCents / 10);
                              setFormData(prev => ({ ...prev, price_cents: newCents }));
                            }
                          }}
                          className="pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                          setFormData(prev => ({ ...prev, stock: value }));
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        placeholder="Book description..."
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="active">Show in Catalog</Label>
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="featured">Add to Featured Banner</Label>
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const featuredCount = existingBooks?.filter(b => b.featured).length || 0;
                            if (featuredCount >= 3) {
                              toast.error('Only 3 books can be featured at once. Please remove a featured book first.');
                              return;
                            }
                          }
                          setFormData(prev => ({ ...prev, featured: checked }));
                        }}
                      />
                    </div>

{/* adds sale section for new books */}
<div className="border-t pt-4">
  <div className="flex items-center justify-between mb-4">
    <div>
      <Label htmlFor="on_sale_new" className="text-base font-semibold">Put on Sale</Label>
      <p className="text-xs text-muted-foreground">Enable special pricing</p>
    </div>
    <Switch
      id="on_sale_new"
      checked={formData.on_sale}
      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, on_sale: checked }))}
    />
  </div>

  {formData.on_sale && (
    <div className="space-y-4 pl-4 border-l-2 border-accent">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={formData.sale_input_mode === 'price' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormData(prev => ({ ...prev, sale_input_mode: 'price' }))}
            className="flex-1"
          >
            Set Price
          </Button>
          <Button
            type="button"
            variant={formData.sale_input_mode === 'percentage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFormData(prev => ({ ...prev, sale_input_mode: 'percentage' }))}
            className="flex-1"
          >
            Set % Off
          </Button>
        </div>

        {formData.sale_input_mode === 'price' ? (
          <div>
            <Label htmlFor="sale_price_new">Sale Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="sale_price_new"
                type="text"
                value={formData.sale_price_cents ? ((typeof formData.sale_price_cents === 'string' ? parseInt(formData.sale_price_cents) : formData.sale_price_cents) / 100).toFixed(2) : '0.00'}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '');
                  const cents = digits === '' ? '' : parseInt(digits).toString();
                  setFormData(prev => ({ ...prev, sale_price_cents: cents }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    e.preventDefault();
                    const currentCents = typeof formData.sale_price_cents === 'string' ? parseInt(formData.sale_price_cents) || 0 : formData.sale_price_cents;
                    const newCents = Math.floor(currentCents / 10);
                    setFormData(prev => ({ ...prev, sale_price_cents: newCents > 0 ? newCents.toString() : '' }));
                  }
                }}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="sale_percentage_new">Percentage Off</Label>
            <div className="relative">
              <Input
                id="sale_percentage_new"
                type="number"
                min="1"
                max="99"
                value={formData.sale_percentage}
                onChange={(e) => {
                  const percentage = parseInt(e.target.value) || 0;
                  if (percentage >= 0 && percentage <= 100) {
                    const salePriceCents = Math.round(formData.price_cents * (1 - percentage / 100));
                    setFormData(prev => ({
                      ...prev,
                      sale_percentage: e.target.value,
                      sale_price_cents: salePriceCents.toString()
                    }));
                  }
                }}
                className="pr-7"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="sale_ends_at_new">Sale Ends (optional)</Label>
        <Input
          id="sale_ends_at_new"
          type="datetime-local"
          value={formData.sale_ends_at}
          onChange={(e) => setFormData(prev => ({ ...prev, sale_ends_at: e.target.value }))}
        />
      </div>
    </div>
  )}
</div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddBook}
                        disabled={addBookMutation.isPending}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Catalog
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedBook(null);
                          setFormData({ price_cents: 2999, stock: 10, active: true, featured: false, description: '', on_sale: false, sale_input_mode: 'price', sale_price_cents: '', sale_percentage: '', sale_ends_at: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Search and select a book from Google Books to add it to your catalog</p>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Existing Books */}
      <Card>
          <CardHeader>
            <CardTitle>Existing Books ({filteredBooks.length}{existingBooks && filteredBooks.length !== existingBooks.length ? ` of ${existingBooks.length}` : ''})</CardTitle>
            <CardDescription>Manage your book catalog</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Bulk Actions */}
            {filteredBooks.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleToggleSelectAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="cursor-pointer font-medium">
                    Select All ({filteredBooks.length})
                  </Label>
                  {selectedBooks.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedBooks.size} selected
                    </span>
                  )}
                </div>
                {selectedBooks.size > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedBooks.size})
                  </Button>
                )}
              </div>
            )}

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="filter-search" className="text-sm">Search Books</Label>
                <Input
                  id="filter-search"
                  placeholder="Title, author, ISBN..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filter-status" className="text-sm">Status</Label>
                <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'inactive') => setFilterStatus(value)}>
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-featured" className="text-sm">Featured</Label>
                <Select value={filterFeatured} onValueChange={(value: 'all' | 'featured' | 'not-featured') => setFilterFeatured(value)}>
                  <SelectTrigger id="filter-featured">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="not-featured">Not Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filter-sales" className="text-sm">Sales</Label>
                <Select value={filterSales} onValueChange={(value: 'all' | 'on-sale' | 'not-on-sale') => setFilterSales(value)}>
                  <SelectTrigger id="filter-sales">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="on-sale">On Sale</SelectItem>
                    <SelectItem value="not-on-sale">Not On Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {booksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredBooks.map((book) => (
                  <Card key={book.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4 items-start">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedBooks.has(book.id)}
                            onCheckedChange={() => handleToggleBook(book.id)}
                            className="mt-1"
                          />
                          {book.img_url && (
                            <img
                              src={book.img_url}
                              alt={book.name}
                              className="w-16 h-20 object-cover rounded"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{book.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {book.author || 'Unknown Author'}
                          </p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            {book.on_sale && book.sale_price_cents ? (
                              <>
                                <span className="text-accent font-semibold">${(book.sale_price_cents / 100).toFixed(2)}</span>
                                <span className="line-through">${(book.price_cents / 100).toFixed(2)}</span>
                              </>
                            ) : (
                              <span>${(book.price_cents / 100).toFixed(2)}</span>
                            )}
                            <span>Stock: {book.stock}</span>
                            {book.isbn && <span>ISBN: {book.isbn}</span>}
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {book.active && (
                              <span className="status-success px-2 py-1 rounded-full text-xs font-medium">
                                In Catalog
                              </span>
                            )}
                            {book.featured && (
                              <span className="status-warning px-2 py-1 rounded-full text-xs font-medium">
                                Featured
                              </span>
                            )}
                            {book.on_sale && (
                              <span className="status-sale px-2 py-1 rounded-full text-xs font-medium">
                                {book.sale_percentage ? `${Math.round(book.sale_percentage)}% OFF` : 'On Sale'}
                              </span>
                            )}
                            {book.stock === 0 && (
                              <span className="status-error px-2 py-1 rounded-full text-xs font-medium">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditBook(book)}
                            title="Edit book"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${book.name}"?`)) {
                                deleteBookMutation.mutate(book.id);
                              }
                            }}
                            disabled={deleteBookMutation.isPending}
                            title="Delete book"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredBooks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No books found matching your filters</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
