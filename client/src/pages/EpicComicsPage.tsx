import { motion } from "framer-motion";
import { useFeaturedComics } from "@/hooks/useFeaturedComics";
import { useAdmin } from "@/context/AdminContext";
import { useCreatorSpotlight } from "@/hooks/useCreatorSpotlight";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { PlayCircle } from "lucide-react";
import bg from "@/assets/364329bc-77bb-4a42-a9b8-df1e9e77b1b3.png";
import { Helmet } from "react-helmet";
import EpicComicsStories from "@/components/common/EpicComicsStories";

export default function EpicComicsPage() {
  const { comics, addComic, updateComic, deleteComic } = useFeaturedComics();
  const { creators, isLoading: creatorsLoading, addCreator, updateCreator, deleteCreator } = useCreatorSpotlight();
  const [genre, setGenre] = useState<string | null>(null);
  const { isAdmin } = useAdmin();
  const genres = [
    "Fantasy",
    "Romance",
    "Action",
    "Sci-fi",
    "Comedy",
    "Horror",
    "Slice of Life",
    "Superhero",
  ];
  const filtered = useMemo(
    () => (genre ? comics.filter((c: any) => c.tags.includes(genre)) : comics),
    [genre, comics]
  );

  const [, navigate] = useLocation();
  const comicOfDay = comics[Math.floor(Date.now() / 8.64e7) % comics.length];

  return (
    <div className="relative min-h-screen text-black dark:text-amber-50 font-sans" style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <Helmet>
        <title>Epic Comics – Discover, Read & Create Comics</title>
      </Helmet>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

      {/* Hero */}
      <section className="relative container mx-auto px-4 pt-24 pb-32 text-center flex flex-col items-center gap-6 z-10">
        <h1 className="font-bangers text-5xl md:text-7xl text-yellow-400 drop-shadow-lg">
          Welcome to Comics Land
        </h1>
        <p className="text-xl md:text-2xl text-white/90 max-w-xl">
          Where imagination meets ink.
        </p>
        <div className="flex gap-4 mt-4 flex-wrap justify-center">
          <Link href="/talecraft">
            <button className="px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md flex items-center gap-2">
              <PlayCircle size={20} /> Create Your Own
            </button>
          </Link>
          <Link href="/publish-comic">
            <button className="px-6 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md flex items-center gap-2">
              <PlusCircle size={20} /> Publish Comic
            </button>
          </Link>
        </div>
      </section>

      {/* Comic of the day */}
      {comicOfDay && (
        <div className="relative z-10 mb-16">
          <div className="container mx-auto px-4">
            <div className="relative max-w-4xl mx-auto p-6 bg-white/90 dark:bg-[#2d1a08]/80 rounded-2xl shadow-lg border-2 border-dashed border-black/20 dark:border-amber-600 text-center">
              <span className="font-bangers text-2xl text-red-600">Comic of the Day</span>
              <h3 className="text-3xl font-extrabold mt-2">{comicOfDay.title}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Featured Comics */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <h2 className="font-bangers text-4xl md:text-5xl text-center mb-10 text-purple-700 dark:text-amber-400">Featured Comics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((comic: any, i: number) => (
            <motion.div key={comic.id} whileHover={{ scale: 1.05 }} onClick={() => navigate(`/story/${comic.id}`)} className="relative group rounded-xl overflow-hidden shadow-lg cursor-pointer">
              <img src={comic.cover} alt={comic.title} className="h-72 w-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
                {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={(e)=>{e.stopPropagation(); const title=prompt('New title', comic.title); if(title) updateComic(comic.id,{...comic, title});}} className="bg-white p-1 rounded shadow"><Pencil size={16}/></button>
                      <button onClick={(e)=>{e.stopPropagation(); if(confirm('Delete this comic?')) deleteComic(comic.id);}} className="bg-white p-1 rounded shadow"><Trash2 size={16}/></button>
                    </div>
                  )}
                  <span className="text-white font-bold">{comic.title}</span>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {comic.tags.map((tag: string) => (
                    <span key={tag} className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Published Stories in Epic Comics */}
        <EpicComicsStories />
      </section>

      {/* Genres */}
      <section className="relative z-10 container mx-auto px-4 pb-20">
        <h2 className="font-bangers text-3xl md:text-4xl text-center mb-8 text-green-700 dark:text-amber-300">Browse by Genre</h2>
        <div className="overflow-x-auto whitespace-nowrap px-4 flex gap-4">
          {genres.map((g) => (
            <button key={g} onClick={() => setGenre(g === genre ? null : g)} className={`inline-flex flex-col items-center justify-center w-24 h-24 shrink-0 rounded-full shadow border text-sm transition ${g === genre ? "bg-pink-600 text-white" : "bg-white dark:bg-[#3b2914] hover:scale-105"}`}>
              <img src={`https://api.dicebear.com/7.x/icons/svg?seed=${g}`} alt={g} className="h-10 w-10 mb-1" />
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 container mx-auto px-4 pb-20">
        <h2 className="font-bangers text-3xl md:text-4xl text-center mb-12 text-blue-700 dark:text-amber-300">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: "📖", title: "Read", desc: "Dive into thousands of free comics." },
            { icon: "✍️", title: "Create", desc: "Use our drag-and-drop editor." },
            { icon: "🚀", title: "Share", desc: "Publish & earn fans worldwide." },
          ].map((step, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="p-6 bg-white/70 dark:bg-[#2d1a08]/80 backdrop-blur rounded-2xl shadow-lg text-center">
              <div className="text-5xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-sm opacity-80 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Creators */}
      <section className="relative z-10 container mx-auto px-4 pb-32">
        <h2 className="font-bangers text-3xl md:text-4xl text-center mb-8 text-pink-700 dark:text-amber-300">Top Creators of the Month</h2>
        <div className="flex flex-wrap gap-6 justify-center">
          {creatorsLoading && <span className="text-white">Loading...</span>}
          {creators.slice(0,5).map((c) => (
            <div key={c.id} className="relative flex flex-col items-center gap-2 group">
              {isAdmin && (
                <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={()=>{const username=prompt('Username', c.username); if(username) updateCreator(c.id,{username});}} className="bg-white p-0.5 rounded shadow"><Pencil size={14}/></button>
                  <button onClick={()=>{if(confirm('Delete creator?')) deleteCreator(c.id);}} className="bg-white p-0.5 rounded shadow"><Trash2 size={14}/></button>
                </div>
              )}
              <img src={c.avatar} alt={c.username} className="h-20 w-20 rounded-full shadow-lg border-4 border-yellow-400" />
              <span className="font-semibold text-sm">{c.username}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
