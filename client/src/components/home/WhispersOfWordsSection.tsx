import { BookOpenIcon, Search } from "lucide-react";
import bgImg from "@/assets/63b76a44-095a-4fae-997f-ed1c910c07c1.png";
import { useState } from "react";
import { Link } from "wouter";

// No fake data - will be populated with real content
const showcase: any[] = [];

export default function WhispersOfWordsSection() {
  const [query, setQuery] = useState("");

  const filtered = showcase.filter((novel) =>
    novel.genre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section
      className="relative py-16 px-4 text-amber-50 bg-center bg-cover"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <div className="absolute inset-0 bg-brown-dark/25" />
      <div className="relative container mx-auto max-w-6xl">
        {/* Heading */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <BookOpenIcon className="h-6 w-6 text-amber-400" />
          <Link href="/whispers" className="hover:text-amber-400 transition-colors">
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-center">
              Whispers of Words
            </h2>
          </Link>
          <BookOpenIcon className="h-6 w-6 text-amber-400" />
        </div>

        {/* Genre search */}
        <div className="relative max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Search by genre... (e.g., Fantasy)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
        </div>

        {/* Novels grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((novel) => (
            <Link
              key={novel.id}
              href={`/listen/${novel.id}`}
              className="story-card bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all flex flex-col items-center"
            >
              <div className="text-6xl mb-4">{novel.cover}</div>
              <h4 className="font-cinzel text-xl font-bold text-amber-100 mb-1 text-center">
                {novel.title}
              </h4>
              <p className="text-amber-50 text-lg font-semibold">{novel.genre}</p>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-center col-span-full text-amber-100">
              No novels found for the selected genre.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
