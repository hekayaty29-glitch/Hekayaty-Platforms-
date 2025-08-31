import { Helmet } from "react-helmet";
import { ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const books = [
  { id: 501, title: "Shadow of the Phoenix", author: "Iris Dawn", price: "$4.99", cover: "🔥" },
  { id: 502, title: "Echoes in Amber", author: "Felix Gold", price: "$3.49", cover: "🧡" },
  { id: 503, title: "Dreamweaver's Lullaby", author: "Seren Night", price: "$5.99", cover: "💤" },
];

export default function BookBazaarPage() {
  const [search, setSearch] = useState("");
  const filtered = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Helmet>
        <title>The Book Bazaar</title>
        <meta name="description" content="Purchase exclusive books from our community." />
      </Helmet>

      <section className="py-20 px-4 bg-gradient-to-br from-amber-800 via-brown-dark to-midnight-blue text-amber-50">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex justify-center items-center gap-4 mb-6">
            <ShoppingBag className="h-8 w-8 text-amber-400" />
            <h1 className="font-cinzel text-4xl md:text-5xl font-bold">The Book Bazaar</h1>
            <ShoppingBag className="h-8 w-8 text-amber-400" />
          </div>

          <div className="relative max-w-md mx-auto mb-12">
            <input
              type="text"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <ShoppingBag className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filtered.map((book) => (
              <div key={book.id} className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center">
                <div className="text-6xl mb-4">{book.cover}</div>
                <h3 className="font-cinzel text-2xl font-bold text-amber-100 mb-2 text-center">{book.title}</h3>
                <p className="text-amber-200 text-sm mb-2 text-center">by {book.author}</p>
                <p className="text-amber-50 text-lg font-semibold mb-4">{book.price}</p>
                <Link href={`/purchase/${book.id}`} className="bg-amber-500 hover:bg-amber-600 text-amber-50 font-cinzel text-sm py-2 px-6 rounded-full transition-colors">
                  Buy Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
