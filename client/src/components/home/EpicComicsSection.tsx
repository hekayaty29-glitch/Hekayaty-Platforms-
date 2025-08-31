import { Link } from "wouter";
import { motion } from "framer-motion";
import bg from "@/assets/364329bc-77bb-4a42-a9b8-df1e9e77b1b3.png";

export default function EpicComicsSection() {
  return (
    <section className="relative h-72 md:h-80 lg:h-96 flex items-center justify-center overflow-hidden rounded-xl shadow-lg" style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative z-10 text-center space-y-4 px-4">
        <h2 className="font-bangers text-4xl md:text-5xl text-yellow-400 drop-shadow">Epic Comics</h2>
        <p className="text-white max-w-md mx-auto">Discover trending webtoons, manga-style adventures, and create your own comic worlds.</p>
        <Link href="/epic-comics">
          <button className="px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-md">Dive In</button>
        </Link>
      </motion.div>
    </section>
  );
}
