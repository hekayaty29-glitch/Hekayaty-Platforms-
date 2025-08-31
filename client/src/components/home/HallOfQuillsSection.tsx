import React from "react";
import { Feather, ScrollText, Star, BookOpen } from "lucide-react";
import AdminOnly from "@/components/auth/AdminOnly";
import { Link } from "wouter";
import hallBg from "@/assets/hall-of-quills-banner.jpg";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

// Data arrays – will be filled from backend later
// Placeholder before data loads; will be filled via API
const initialActiveWriters: Writer[] = [];
const initialBestWriters: Writer[] = [];
type Competition = { id:number; name:string; winner:{ name:string; avatar:string }; storyTitle:string };
const initialCompetitions: Competition[] = [];
type Honorable = { id:number; name:string; quote:string };
const initialHonorableMentions: Honorable[] = [];
const archive: any[] = [];

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Backend provides avatar/role flags via Supabase profiles

type Writer = {
  id: number;
  name: string;
  title: string;
  avatar: string;
  stories: number;
  reads: string;
};
// ---------------------------------------------------------------------------
export default function HallOfQuillsSection() {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  const [activeWriters, setActiveWriters] = React.useState<Writer[]>(initialActiveWriters);
  const queryClient = useQueryClient();
const [bestWriters, setBestWriters] = React.useState<Writer[]>(initialBestWriters);

  const [competitions, setCompetitions] = React.useState(initialCompetitions);
  const [honorableMentions, setHonorableMentions] = React.useState(initialHonorableMentions);

  // Fetch competitions
useQuery({
  queryKey:['competitions'],
  queryFn: async () => {
    const res = await fetch('/api/hall-of-quills/competitions');
    if(!res.ok) throw new Error('Failed to load competitions');
    const json: Competition[] = await res.json();
    setCompetitions(json);
    return json;
  }
});
// Fetch honorable mentions
useQuery({
  queryKey:['honorable'],
  queryFn: async () => {
    const res = await fetch('/api/hall-of-quills/honorable');
    if(!res.ok) throw new Error('Failed to load honorable');
    const json: Honorable[] = await res.json();
    setHonorableMentions(json);
    return json;
  }
});

// Fetch active writers (top 3 by story + comic count)
  useQuery({
    queryKey: ['activeWriters'],
    queryFn: async () => {
      const res = await fetch('/api/hall-of-quills/active?limit=3');
      if (!res.ok) throw new Error('Failed to load active writers');
      const json: Writer[] = await res.json();
      setActiveWriters(json);
      return json;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch best writers of the month (top 5)
  useQuery({
    queryKey: ['bestWriters'],
    queryFn: async () => {
      const res = await fetch('/api/hall-of-quills/best');
      if (!res.ok) throw new Error('Failed to load best writers');
      const json: Writer[] = await res.json();
      setBestWriters(json);
      return json;
    },
    staleTime: 5 * 60 * 1000,
  });

  // ------------------------- Backend mutations ----------------
const addCompetitionMutation = useMutation({
  mutationFn: async ({ name, winnerName, storyTitle }: { name:string; winnerName:string; storyTitle:string }) => {
    const res = await apiRequest('POST','/api/hall-of-quills/competitions',{ name, winnerName, storyTitle });
    return res.json();
  },
  onSuccess: (data: Competition) => {
    queryClient.invalidateQueries({ queryKey:['competitions'] });
    setCompetitions(prev=>[data,...prev]);
  }
});

const addHonorableMutation = useMutation({
  mutationFn: async ({ name, quote}:{name:string; quote:string})=>{
    const res = await apiRequest('POST','/api/hall-of-quills/honorable',{ name, quote });
    return res.json();
  },
  onSuccess: (data: Honorable)=>{
    queryClient.invalidateQueries({ queryKey:['honorable'] });
    setHonorableMentions(prev=>[data,...prev]);
  }
});

function addCompetition(name: string, winnerName: string, storyTitle: string) {
    addCompetitionMutation.mutate({ name, winnerName, storyTitle });
  }

  function addActiveWriter(name: string, title: string) {
    const newEntry = { id: Date.now(), name, title, avatar: '', stories: 0, reads: '0' };
    setActiveWriters((prev) => [newEntry, ...prev]);
  }

  function addBestWriter(name: string, title: string) {
    const newEntry: Writer = { id: Date.now(), name, title, avatar: '', stories: 0, reads: '0' };
    setBestWriters((prev) => [newEntry, ...prev]);
  }

  function addHonorable(name: string, quote: string) {
    addHonorableMutation.mutate({ name, quote });
  }
  return (
    <section className="relative overflow-hidden text-amber-50 bg-gradient-to-b from-[#2b1d0e] to-[#120d07]">
      {/* Magical floating particles */}
      <div className="pointer-events-none absolute inset-0 animate-pulse-slow bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,128,0.15),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(255,225,160,0.08),transparent_45%)]"></div>

      {/* Banner */}
      <div className="relative flex items-center justify-center h-72 md:h-96 bg-cover bg-center" style={{ backgroundImage: `url(${hallBg})` }}>
        <Link href="/hall-of-quills" className="group">
          <h2 className="font-cinzel text-4xl md:text-6xl text-center text-amber-100 drop-shadow-lg animate-fadeIn group-hover:text-amber-200" style={{ textShadow: "0 0 12px rgba(255,221,160,0.8)" }}>
            Hall of Quills
          </h2>
        </Link>
      </div>

      {/* Featured Writers */}
        {isAdmin && (
          <div className="bg-[#1d140c]/40 p-4 rounded-md mb-6 space-y-3">
            <h4 className="font-cinzel text-lg">Add Active Writer</h4>
            <div className="flex flex-col md:flex-row gap-3">
              <input placeholder="Name" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="activeName" />
              <input placeholder="Title" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="activeTitle" />
              <button onClick={() => {
                const n=(document.getElementById('activeName') as HTMLInputElement).value.trim();
                const t=(document.getElementById('activeTitle') as HTMLInputElement).value.trim();
                if(n&&t){addActiveWriter(n,t);(document.getElementById('activeName') as HTMLInputElement).value='';(document.getElementById('activeTitle') as HTMLInputElement).value='';}
              }} className="bg-amber-700 hover:bg-amber-800 text-white px-4 rounded-md text-sm">Add</button>
            </div>
            <h4 className="font-cinzel text-lg mt-6">Add Best Writer</h4>
            <div className="flex flex-col md:flex-row gap-3">
              <input placeholder="Name" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="bestName" />
              <input placeholder="Title" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="bestTitle" />
              <button onClick={() => {
                const n=(document.getElementById('bestName') as HTMLInputElement).value.trim();
                const t=(document.getElementById('bestTitle') as HTMLInputElement).value.trim();
                if(n&&t){addBestWriter(n,t);(document.getElementById('bestName') as HTMLInputElement).value='';(document.getElementById('bestTitle') as HTMLInputElement).value='';}
              }} className="bg-amber-700 hover:bg-amber-800 text-white px-4 rounded-md text-sm">Add</button>
            </div>
          </div>
        )}

        <SectionHeading icon={<Feather className="h-6 w-6 mr-2" />} title="Active Writers" />
        <div className="flex gap-6 overflow-x-auto pb-4">
          {activeWriters.slice(0,3).map((w) => (
            <motion.div key={w.id} className="min-w-[240px] bg-[#1d140c]/50 backdrop-blur-sm border border-amber-600 rounded-lg p-4 flex-shrink-0 shadow-lg hover:scale-105 transition-transform">
              <img src={w.avatar} alt={w.name} className="h-24 w-24 rounded-full border-2 border-amber-500 mx-auto" />
              <h3 className="mt-4 font-cinzel text-xl text-center">{w.name}</h3>
              <p className="text-amber-400 text-center text-sm">{w.title}</p>
            </motion.div>
          ))}
        </div>

        <SectionHeading icon={<Feather className="h-6 w-6 mr-2" />} title="Best Writers" />
        <div className="flex gap-6 overflow-x-auto pb-4">
          {bestWriters.slice(0,5).map((h: Writer) => (
            <motion.div key={h.id} className="min-w-[240px] bg-[#1d140c]/50 backdrop-blur-sm border border-amber-600 rounded-lg p-4 flex-shrink-0 shadow-lg hover:scale-105 transition-transform">
              <img src={h.avatar} alt={h.name} className="h-24 w-24 rounded-full border-2 border-amber-500 mx-auto" />
              <h3 className="mt-4 font-cinzel text-xl text-center">{h.name}</h3>
              <p className="text-amber-400 text-center text-sm">{h.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Competition Winners */}
        {isAdmin && (
          <div className="bg-[#1d140c]/40 p-4 rounded-md mb-6 space-y-3">
            <h4 className="font-cinzel text-lg">Add Competition Winner</h4>
            <div className="flex flex-col md:flex-row gap-3">
              <input placeholder="Competition Name" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="compName" />
              <input placeholder="Winner Name" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="winnerName" />
              <input placeholder="Story Title" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="storyTitle" />
              <button
                onClick={() => {
                  const name = (document.getElementById('compName') as HTMLInputElement).value.trim();
                  const wn = (document.getElementById('winnerName') as HTMLInputElement).value.trim();
                  const st = (document.getElementById('storyTitle') as HTMLInputElement).value.trim();
                  if (name && wn && st) {
                    addCompetition(name, wn, st);
                    (document.getElementById('compName') as HTMLInputElement).value = '';
                    (document.getElementById('winnerName') as HTMLInputElement).value = '';
                    (document.getElementById('storyTitle') as HTMLInputElement).value = '';
                  }
                }}
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 rounded-md text-sm"
              >
                Add
              </button>
            </div>
          </div>
        )}
        <SectionHeading icon={<ScrollText className="h-6 w-6 mr-2" />} title="Competition Winners" />
        <div className="relative border-l-2 border-amber-600 ml-4 pl-6 space-y-10">
          {competitions.map((c) => (
            <div key={c.id} className="flex gap-4 items-start">
              <div className="bg-amber-600 rounded-full h-3 w-3 mt-2" />
              <div>
                <h4 className="font-cinzel text-lg text-amber-200 mb-1">{c.name}</h4>
                <div className="flex items-center gap-3">
                  <img src={c.winner.avatar} className="h-10 w-10 rounded-full border border-amber-500" />
                  <span className="font-medium">{c.winner.name}</span>
                  <span className="text-amber-400 italic">\u2014 \"{c.storyTitle}\"</span>
                  <Button asChild size="sm" className="ml-auto bg-amber-700 hover:bg-amber-800 text-white">
                    <a href="#">Read Story</a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Honorable Mentions */}
        {isAdmin && (
          <div className="bg-[#1d140c]/40 p-4 rounded-md mb-6 space-y-3">
            <h4 className="font-cinzel text-lg">Add Honorable Mention</h4>
            <div className="flex flex-col md:flex-row gap-3">
              <input placeholder="Author Name" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="honName" />
              <input placeholder="Quote" className="flex-1 bg-black/30 px-3 py-2 rounded-md text-sm" id="honQuote" />
              <button
                onClick={() => {
                  const name = (document.getElementById('honName') as HTMLInputElement).value.trim();
                  const quote = (document.getElementById('honQuote') as HTMLInputElement).value.trim();
                  if (name && quote) {
                    addHonorable(name, quote);
                    (document.getElementById('honName') as HTMLInputElement).value = '';
                    (document.getElementById('honQuote') as HTMLInputElement).value = '';
                  }
                }}
                className="bg-amber-700 hover:bg-amber-800 text-white px-4 rounded-md text-sm"
              >
                Add
              </button>
            </div>
          </div>
        )}
        <SectionHeading icon={<Star className="h-6 w-6 mr-2" />} title="Honorable Mentions" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {honorableMentions.map((h) => (
            <div key={h.id} className="bg-[#1d140c]/50 backdrop-blur-sm p-6 border border-amber-600 rounded-lg shadow-lg hover:shadow-amber-700/40 transition-shadow">
              <h5 className="font-cinzel text-lg mb-2">{h.name}</h5>
              <p className="italic text-sm text-amber-300">{h.quote}</p>
              <Star className="h-5 w-5 text-amber-500 mt-4" />
            </div>
          ))}
        </div>

        {/* Archive */}
        <SectionHeading icon={<BookOpen className="h-6 w-6 mr-2" />} title="Hall Archive" />
        <Accordion type="single" collapsible className="w-full">
          {archive.map((year) => (
            <AccordionItem key={year.year.toString()} value={year.year.toString()}>
              <AccordionTrigger className="font-cinzel text-lg bg-[#22170c]/60 px-4 py-2 border border-amber-600 rounded-md">
                {year.year}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 bg-[#1b120a]/40 p-4 border border-t-0 border-amber-700 rounded-b-md">
                {year.events.map((e: any) => (
                  <div key={e.id}>
                    <h6 className="font-cinzel text-amber-200 mb-1">{e.name}</h6>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {e.winners.map((w: any, idx: number) => (
                        <li key={idx}>
                          <span className="font-medium">{w.name}</span> — <span className="italic">{w.story}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
   );
 }

// ---------------------------------------------------------------------------
function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center mb-6">
      {icon}
      <h3 className="font-cinzel text-2xl">{title}</h3>
    </div>
  );
}
