import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Item } from "@/types";

const Index = () => {
  const { data: latestReleases = [] } = useQuery({
    queryKey: ['latest-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data as Item[];
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Bookstore</h1>
      
      <section>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Latest Releases</h2>
          <Link to="/catalog">View All</Link>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {latestReleases.map((book) => (
            <Link key={book.id} to={`/book/${book.id}`}>
              <div className="border p-2">
                {book.img_url && <img src={book.img_url} alt={book.name} className="w-full h-40 object-cover mb-2" />}
                <div className="font-bold truncate">{book.name}</div>
                <div className="text-sm text-gray-600 truncate">{book.author || 'Unknown'}</div>
                <div className="font-bold">${(book.price_cents / 100).toFixed(2)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
