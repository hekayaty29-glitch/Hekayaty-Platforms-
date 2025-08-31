import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import bannerImg from "@/assets/tales-banner.png";

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Types for Tales API response
interface TalesContent {
  prophets: { slug: string; name: string; img: string }[];
  companions: { slug: string; name: string; img: string }[];
}

// Fetch Tales of Prophets content from backend
const useTalesContent = () => {
  return useQuery<TalesContent>({
    queryKey: ['tales-of-prophets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tales-of-prophets');
      return await response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

const morals: { slug: string; name: string; img: string }[] = [];

function SectionGrid({ title, items }: { title: string; items: { slug: string; name: string; img: string }[] }) {
  return (
    <div className="space-y-6">
      <h3 className="font-cinzel text-2xl text-amber-100 text-center mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-center text-amber-200 italic">Coming soon...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <Link key={it.slug} href={`/stories/${it.slug}`} className="group">
              <motion.div
                whileHover={{ y: -5, boxShadow: "0 0 10px rgba(248,220,130,0.5)" }}
                className="rounded-lg overflow-hidden border border-amber-600 bg-[#1d140c]/60 backdrop-blur-sm shadow-md"
              >
                <img src={it.img} alt={it.name} className="w-full h-40 object-cover" />
                <div className="p-3 text-center">
                  <p className="font-cinzel text-amber-100 group-hover:text-amber-200 text-sm md:text-base">
                    {it.name}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TalesOfProphetsSection() {
  const { data: talesContent, isLoading } = useTalesContent();
  const prophets = talesContent?.prophets || [];
  const companions = talesContent?.companions || [];

  return (
    <section className="py-20 bg-[#15100A] relative overflow-hidden">
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="text-amber-400 w-8 h-8" />
            <h2 className="font-cinzel text-4xl md:text-5xl text-amber-100 font-bold">
              Tales of the Prophets
            </h2>
            <Sparkles className="text-amber-400 w-8 h-8" />
          </div>
          <p className="text-xl text-amber-200 max-w-3xl mx-auto leading-relaxed">
            Discover the timeless stories of wisdom, faith, and guidance that have shaped humanity for millennia.
          </p>
        </motion.div>

        {/* Banner Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <img
            src={bannerImg}
            alt="Tales of the Prophets"
            className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl border border-amber-400/20"
          />
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-amber-200">
            <p>Loading tales...</p>
          </div>
        )}

        {/* Content Grid */}
        {!isLoading && (
          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <SectionGrid title="Prophets" items={prophets} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <SectionGrid title="Companions" items={companions} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <SectionGrid title="Moral Stories" items={morals} />
            </motion.div>
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <Link href="/tales-of-prophets">
            <button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Explore All Tales
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
