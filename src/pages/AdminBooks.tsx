import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bookService } from '@/services/bookService';
import { OpenLibraryBook, Item } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Search, Plus, Trash2, Edit, BookOpen, Loader2 } from 'lucide-react';
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
  
  const [formData, setFormData] = useState({
    price_cents: 2999,
    stock: 10,
    active: true,
    featured: false,
    description: '',
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
      setFormData({ price_cents: 2999, stock: 10, active: true, featured: false, description: '' });
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
      setFormData({ price_cents: 2999, stock: 10, active: true, featured: false, description: '' });
    },
    onError: (error) => {
      toast.error('Failed to update book: ' + error.message);
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
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
    
    const bookData = {
      price_cents: formData.price_cents,
      stock: formData.stock,
      active: formData.active,
      featured: formData.featured,
      description: formData.description || null,
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
    });
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
                      <Label htmlFor="price">Price (cents)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price_cents}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_cents: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        ${(formData.price_cents / 100).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
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
                      <Label htmlFor="featured">Add to Hero Banner</Label>
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
                          setFormData({ price_cents: 2999, stock: 10, active: true, featured: false, description: '' });
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
                      <Label htmlFor="price">Price (cents)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price_cents}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_cents: parseInt(e.target.value) || 0 }))}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        ${(formData.price_cents / 100).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
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
                      <Label htmlFor="featured">Add to Hero Banner</Label>
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
                          setFormData({ price_cents: 2999, stock: 10, active: true, featured: false, description: '' });
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
            <CardTitle>Existing Books ({existingBooks?.length || 0})</CardTitle>
            <CardDescription>Manage your book catalog</CardDescription>
          </CardHeader>
          <CardContent>
            {booksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {existingBooks?.map((book) => (
                  <Card key={book.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4 items-start">
                        {book.img_url && (
                          <img
                            src={book.img_url}
                            alt={book.name}
                            className="w-16 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold">{book.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {book.author || 'Unknown Author'}
                          </p>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            <span>${(book.price_cents / 100).toFixed(2)}</span>
                            <span>Stock: {book.stock}</span>
                            {book.isbn && <span>ISBN: {book.isbn}</span>}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {book.active && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                                ● In Catalog
                              </span>
                            )}
                            {book.featured && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium">
                                ⭐ Featured
                              </span>
                            )}
                            {book.stock === 0 && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
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
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
