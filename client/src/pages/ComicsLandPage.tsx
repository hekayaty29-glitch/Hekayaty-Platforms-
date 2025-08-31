import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, PenTool, Share2, Pencil, PlusCircle, Users, Trash2 } from "lucide-react";

import { useFeaturedComics } from "@/hooks/useFeaturedComics";
import { useState } from "react";
import { useTopCreators } from "@/hooks/useTopCreators";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import bg from "@/assets/364329bc-77bb-4a42-a9b8-df1e9e77b1b3.png";

export default function ComicsLandPage() {
  const { comics } = useFeaturedComics();
  const { creators } = useTopCreators();
  const [genre, setGenre] = useState<string | null>(null);
  const displayed = genre ? comics.filter((c: any)=>c.tags.includes(genre)) : comics;

  return (
    <div className="relative text-black dark:text-amber-50 font-sans" style={{backgroundImage:`url(${bg})`,backgroundSize:'cover',backgroundPosition:'center'}}>
      <div className="absolute inset-0 bg-black/30 dark:bg-black/60"/>
      {/* Hero */}
      <section className="relative overflow-hidden">

        <div className="relative z-10 container mx-auto px-4 py-32 flex flex-col items-center text-center gap-6">
          <motion.h1 initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} transition={{duration:0.6}} className="font-bangers text-5xl md:text-7xl text-red-600 drop-shadow-lg">Welcome to Comics Land</motion.h1>
          <p className="font-comic text-xl md:text-2xl text-blue-600 dark:text-amber-200">Where imagination meets ink.</p>
          <div className="flex gap-4 mt-6 flex-wrap justify-center">
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
              <Link href="/browse-comics">Explore Comics</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-amber-900/30 dark:border-amber-400 dark:text-amber-300">
              <Link href="/tale-craft"><ArrowRight className="mr-2 h-5 w-5"/>Create Your Own</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Comics */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="font-bangers text-4xl md:text-5xl text-center mb-10 text-purple-700 dark:text-amber-400">Featured Comics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayed.map((comic: any, i: number)=>(
            <motion.div key={comic.id} onClick={()=> window.location.href=`/story/${comic.id}`} whileHover={{scale:1.05}} className="relative group rounded-xl overflow-hidden shadow-lg cursor-pointer">
              <img src={`https://source.unsplash.com/random/400x600?sig=${i}&comic`} alt="comic" className="h-72 w-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
                <span className="text-white font-bold">{comic.title}</span>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {comic.tags.map((tag: string)=>(
                    <span key={tag} className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Genres Carousel */}
      <section className="bg-yellow-100 dark:bg-[#2a1b0a] py-16">
        <h2 className="font-bangers text-3xl md:text-4xl text-center mb-8 text-green-700 dark:text-amber-300">Browse by Genre</h2>
        <div className="overflow-x-auto whitespace-nowrap px-4 flex gap-4">
          {['Fantasy','Romance','Action','Sci-fi','Comedy','Horror','Slice of Life','Superhero'].map(g=> (
            <button key={g} onClick={()=> setGenre(g===genre?null:g)} className={`inline-flex flex-col items-center justify-center w-24 h-24 shrink-0 rounded-full shadow border text-sm transition ${g===genre? 'bg-pink-600 text-white' : 'bg-white dark:bg-[#3b2914] hover:scale-105'} `}>
              <img src={`https://api.dicebear.com/7.x/icons/svg?seed=${g}`} alt="{g}" className="h-10 w-10 mb-1" />
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="font-bangers text-4xl text-center text-blue-700 dark:text-amber-400 mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-10 text-center">
          <div>
            <PlayCircle className="mx-auto h-12 w-12 text-red-600"/>
            <h3 className="font-bold text-xl mt-4">Read</h3>
            <p className="mt-2 text-gray-600 dark:text-amber-200">Dive into thousands of digital comics from creators around the world.</p>
          </div>
          <div>
            <PenTool className="mx-auto h-12 w-12 text-green-600"/>
            <h3 className="font-bold text-xl mt-4">Create</h3>
            <p className="mt-2 text-gray-600 dark:text-amber-200">Use our drag-and-drop editor to bring your own stories to life.</p>
          </div>
          <div>
            <Share2 className="mx-auto h-12 w-12 text-yellow-600"/>
            <h3 className="font-bold text-xl mt-4">Share</h3>
            <p className="mt-2 text-gray-600 dark:text-amber-200">Publish instantly and gather fans, reactions, and feedback.</p>
          </div>
        </div>
      </section>

      {/* Top Creators */}
      <section className="bg-blue-50 dark:bg-[#1e1405] py-16">
        <h2 className="font-bangers text-3xl md:text-4xl text-center text-red-600 dark:text-amber-300 mb-8">Top Creators of the Month</h2>
        <div className="flex flex-wrap justify-center gap-8 px-4">
          {creators.map((creator) => (
            <div key={creator.id} className="flex flex-col items-center">
              <img
                src={creator.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${creator.username}`}
                className="h-24 w-24 rounded-full border-4 border-yellow-400"
              />
              <span className="mt-2 font-semibold">{creator.username}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Editor Teaser */}
      <section className="container mx-auto px-4 py-20 flex flex-col-reverse md:flex-row items-center gap-10">
        <div className="flex-1 space-y-4">
          <h2 className="font-bangers text-4xl text-purple-700 dark:text-amber-400">Unleash Your Inner Artist</h2>
          <p className="text-gray-700 dark:text-amber-200">Our powerful, intuitive editor lets you drag, drop, and publish with ease—no art degree required!</p>
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white">
            <Link href="/tale-craft">Start Creating Now!</Link>
          </Button>
        </div>
        <motion.img initial={{x:100,opacity:0}} whileInView={{x:0,opacity:1}} transition={{duration:0.6}} viewport={{once:true}} src="https://images.unsplash.com/photo-1558888406-94f8043c0f2b?auto=format&fit=crop&w=800&q=60" alt="Editor preview" className="flex-1 rounded-xl shadow-lg"/>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-10">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bangers text-2xl">Comics Land</h3>
            <p className="text-sm mt-2">Draw your world.</p>
          </div>
          <nav className="space-y-2">
            <a href="/about" className="block hover:underline">About</a>
            <a href="/contact" className="block hover:underline">Contact</a>
            <a href="/terms" className="block hover:underline">Terms</a>
          </nav>
          <div className="flex gap-4 items-center">
            <a href="#" aria-label="twitter"><svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 001.88-2.37 8.59 8.59 0 01-2.72 1.04 4.28 4.28 0 00-7.29 3.9A12.15 12.15 0 013 4.8a4.28 4.28 0 001.32 5.71 4.27 4.27 0 01-1.94-.54v.05a4.28 4.28 0 003.43 4.2 4.3 4.3 0 01-1.93.07 4.28 4.28 0 004 2.97A8.6 8.6 0 012 19.54 12.14 12.14 0 008.29 21c7.55 0 11.68-6.26 11.68-11.68l-.01-.53A8.32 8.32 0 0022.46 6z"/></svg></a>
            <a href="#" aria-label="instagram"><svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.5-.9a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2z"/></svg></a>
          </div>
        </div>
      </footer>
          </div>
  );
}
