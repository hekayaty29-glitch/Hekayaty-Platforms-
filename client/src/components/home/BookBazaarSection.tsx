import { ShoppingBag, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Fetch bazaar books
const useBazaarBooks = () =>
  useQuery<any[]>({
    queryKey: ["/api/bazaar/books"],
    staleTime: 1000 * 60 * 5,
  });

export default function BookBazaarSection() {
  const [search, setSearch] = useState("");
  const { data: showcase, isLoading } = useBazaarBooks();
  const filtered = (showcase || []).filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-r from-brown-dark to-midnight-blue text-amber-50" id="bazaar">
        <div className="container mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="animate-pulse bg-amber-50/10 rounded-lg h-40" />
            ))}
        </div>
      </section>
    );
  }

  if (!filtered.length) {
    return (
      <section className="py-16 px-4 bg-gradient-to-r from-brown-dark to-midnight-blue text-center text-amber-50" id="bazaar">
        <Link href="/bazaar" className="group">
          <h3 className="font-cinzel text-2xl md:text-3xl group-hover:text-amber-300 transition-colors">Visit The Book Bazaar</h3>
        </Link>
        <p className="font-cormorant italic mt-2">No books available yet. Check back soon!</p>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-brown-dark to-midnight-blue text-amber-50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-center gap-3 mb-10">
          <ShoppingBag className="h-6 w-6 text-amber-400" />
          <Link href="/bazaar" className="hover:text-amber-400 transition-colors">
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-center">
              The Book Bazaar
            </h2>
          </Link>
          <ShoppingBag className="h-6 w-6 text-amber-400" />
        </div>

        <div className="relative max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((book) => (
            <Link
              key={book.id}
              href={`/bazaar`}
              className="story-card bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center"
            >
              <div className="text-6xl mb-4">{book.cover}</div>
              <h4 className="font-cinzel text-xl font-bold text-amber-100 mb-1 text-center">
                {book.title}
              </h4>
              <p className="text-amber-50 text-lg font-semibold">{book.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
