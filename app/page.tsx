import { supabaseServer } from '@/lib/supabase/server';

// Type for URL search parameters
type Search = Record<string, string | string[]>;

export default async function Page({ searchParams }: { searchParams: Promise<Search> }) {
  // Get and parse search parameters
  const params = await searchParams;
  const q = String(params?.q ?? '');               // Search query
  const sort = String(params?.sort ?? 'created_at'); // Sort field
  const available = String(params?.available) === '1'; // In stock filter

  // Initialize Supabase client
  const supabase = await supabaseServer();
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user 
    ? await supabase.from('profiles').select('role').eq('id', user.id).single() 
    : { data: null };
  const isAdmin = profile?.role === 'admin';

  // Build the base query
  let query = supabase
    .from('items')
    .select('id, name, price_cents, stock, img_url, active, created_at');

  // Add search filter if query exists
  if (q) {
    query = query.ilike('name', `%${q.trim()}%`);
  }
  
  // Apply visibility and stock filters
  if (!isAdmin) {
    // Regular users only see active items
    query = query.eq('active', true);
  }
  
  // Apply stock filter if requested
  if (available) {
    query = query.gt('stock', 0);
  }
  
  // Apply sorting (ascending for names, descending for others)
  query = query.order(sort, { ascending: sort === 'name' });

  // Execute query
  const { data: items, error } = await query;
  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Catalog (example)</h1>
      <form className="flex flex-wrap gap-2" aria-label="catalog filters">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" placeholder="Search by name…" defaultValue={q} className="border rounded px-3 py-2" />
        <label htmlFor="sort" className="flex items-center">Sort:
          <select id="sort" name="sort" defaultValue={sort} className="ml-2 border rounded px-3 py-2" aria-label="Sort items">
            <option value="created_at">Newest</option>
            <option value="name">Name</option>
            <option value="price_cents">Price</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="available" value="1" defaultChecked={available} /> In stock only
        </label>
        <button className="border rounded px-3 py-2">Apply</button>
      </form>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((it) => (
          <article key={it.id} className="rounded-2xl shadow p-4">
            {it.img_url && <img src={it.img_url} alt={it.name} className="w-full h-40 object-cover rounded-xl" />}
            <div className="mt-2 font-semibold">{it.name}</div>
            <div>${(it.price_cents / 100).toFixed(2)}</div>
            <div className="mt-2 text-sm text-gray-500">ID: {it.id}</div>
            <div className="flex gap-2 mt-3">
              <a 
                href={`/book-ex?id=${it.id}`} 
                className="inline-block border rounded-xl px-3 py-2 bg-blue-50 hover:bg-blue-100"
              >
                View Details
              </a>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
