import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

import bg from "@/assets/364329bc-77bb-4a42-a9b8-df1e9e77b1b3.png";
export default function ComicsLandSection() {
  return (
    <section className="relative mx-auto px-4 py-24 text-center overflow-hidden" style={{backgroundImage:`url(${bg})`, backgroundSize:'cover', backgroundPosition:'center'}}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative container mx-auto">
      <motion.h2 initial={{y: 40, opacity:0}} whileInView={{y:0, opacity:1}} viewport={{once:true}} transition={{duration:0.6}} className="font-bangers text-4xl md:text-5xl text-pink-600 mb-6">
        Comics Land
      </motion.h2>
      <p className="max-w-2xl mx-auto text-amber-200 mb-8">Discover colorful comics, manga and webtoons crafted by our community.</p>
      <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg">
        <Link href="/comics">Enter Comics Land</Link>
      </Button>
          </div>
    </section>
  );
}
