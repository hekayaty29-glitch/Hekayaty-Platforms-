import { Helmet } from "react-helmet";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import { useNews } from "@/hooks/useNews";
import { Search } from "lucide-react";

interface NewsItem {
  id: string;
  type: "main" | "community";
  title: string;
  content: string;
  created_at: string;
}


export default function HekayatyNewsPage() {
  const [search, setSearch] = useState("");
  const { data: news = [], isLoading, error } = useNews("main");
  const filtered = news.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#15100A] text-amber-50 py-20 px-4">
      <Helmet>
        <title>Hekayaty News & Announcements</title>
        <meta name="description" content="All official announcements, competition results and new story updates from Hekayaty." />
      </Helmet>

      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-center gap-3 mb-10">
          <Megaphone className="h-8 w-8 text-amber-400" />
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold">Hekayaty News</h1>
          <Megaphone className="h-8 w-8 text-amber-400" />
        </div>

        <div className="relative max-w-md mx-auto mb-12">
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-full bg-amber-50/10 placeholder-amber-100 text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
        </div>

        <div className="space-y-8">
          {isLoading && <p className="text-center">Loading…</p>}
          {error && <p className="text-center text-red-500">{(error as Error).message}</p>}
          {filtered.map((item) => (
            <div key={item.id} className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 hover:shadow-lg transition-all">
              <p className="text-sm text-amber-300 mb-2">{new Date(item.created_at).toLocaleDateString()}</p>
              <h2 className="font-cinzel text-2xl mb-2 text-amber-100">{item.title}</h2>
              <p className="text-amber-200 mb-2">{item.content}</p>
              <span className="inline-block bg-amber-500 text-brown-dark text-xs font-semibold px-3 py-1 rounded-full capitalize">
                {item.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
