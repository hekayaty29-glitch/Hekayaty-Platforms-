import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAdmin } from "@/context/AdminContext";
import { Link } from "wouter";
import charactersBg from "@/assets/873e935e-c511-4eda-9951-9f09e141d1de_11-16-25.png";
import { Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Fetch characters from backend – empty array if none yet
// ---------------------------------------------------------------------------
import { useQuery } from "@tanstack/react-query";

const useCharacters = () =>
  useQuery<any[]>({
    queryKey: ["/api/characters"],
    queryFn: async () => (await apiRequest("GET", "/api/characters")).json(),
    staleTime: 1000 * 60 * 5,
  });

// Role filter options – expand once backend provides dynamic roles
const roles = ["All", "Hero", "Villain", "Creature"] as const;
const sorts = ["Featured", "Popularity", "Story"] as const;

// ---------------------------------------------------------------------------
export default function CharactersSection() {
  const [roleFilter, setRoleFilter] = useState<typeof roles[number]>("All");
  const [sortBy, setSortBy] = useState<typeof sorts[number]>("Featured");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", role: "Hero", image: "" });

  const { data: characters, isLoading } = useCharacters();
  const { isAdmin } = useAdmin();
  const qc = useQueryClient();

  const addCharacter = useMutation({
    mutationFn: async (data: { name: string; description: string; role: string; image: string }) => {
      await apiRequest("POST", "/api/characters", data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/characters"] });
      setShowAdd(false);
      setForm({ name: "", description: "", role: "Hero", image: "" });
    },
  });

  const sorted = [...(characters || [])].sort((a, b) => {
    if (sortBy === "Popularity") return (b as any).id - (a as any).id;
    if (sortBy === "Story") return (a as any).name.localeCompare((b as any).name);
    return 0;
  });

  const filtered = roleFilter === "All" ? sorted : sorted.filter((c: any) => c.role === roleFilter);

  // Loading skeleton
  if (isLoading) {
    return (
      <section
        className="relative py-16 px-4 text-amber-50 bg-center bg-cover"
        style={{ backgroundImage: `url(${charactersBg})` }}
        id="characters"
      >
        <div className="container mx-auto max-w-6xl grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="w-full h-48 bg-amber-900/40 rounded" />
                <div className="h-4 bg-amber-900/40 rounded w-1/2" />
                <div className="h-3 bg-amber-900/30 rounded w-3/4" />
              </div>
            ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (!filtered.length) {
    return (
      <section
        className="relative min-h-screen py-16 px-4 text-center text-amber-50 bg-center bg-cover"
        style={{ backgroundImage: `url(${charactersBg})` }}
        id="characters"
      >
        <Link href="/characters" className="group">
          <h2 className="font-cinzel text-3xl md:text-4xl group-hover:text-amber-300 transition-colors">Explore Characters</h2>
        </Link>
        <p className="font-cormorant italic mt-2 mb-6">Our legends are still being written. Check back later!</p>
        
        {/* New Character Button */}
        <div className="mt-8">
          <Link href="/characters/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-cinzel px-6 py-3 text-lg">
              ✨ Create New Character
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative min-h-screen py-16 px-4 bg-cover bg-center text-amber-50 overflow-hidden"
      style={{ backgroundImage: `url(${charactersBg})` }}
      id="characters"
    >
      {/* subtle magical particles */}
      <div className="pointer-events-none absolute inset-0 animate-pulse-slow bg-[radial-gradient(circle_at_30%_20%,rgba(255,225,160,0.12),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(255,225,160,0.08),transparent_50%)]"></div>

      <div className="relative container mx-auto max-w-6xl space-y-12">
        <header className="text-center space-y-3">
          <Link href="/characters" className="group">
            <h2 className="font-cinzel text-3xl md:text-4xl flex items-center justify-center gap-2 group-hover:text-amber-200">
            <Sparkles className="h-6 w-6 text-amber-300 animate-flicker" />
            <span>Meet the Legends of Hekayaty</span>
            <Sparkles className="h-6 w-6 text-amber-300 animate-flicker" />
          </h2>
          </Link>
          <p className="font-cormorant italic text-lg text-amber-200">Discover heroes, villains, and mystical creatures that roam our tales.</p>
        </header>

        {/* New Character Button - Available to all users */}
        <div className="text-center">
          <Link href="/characters/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-cinzel px-6 py-3 text-lg">
              ✨ New Character
            </Button>
          </Link>
        </div>

        {/* Admin Add Character (Legacy - keeping for quick admin access) */}
        {isAdmin && (
          <div className="text-right">
            {!showAdd ? (
              <Button onClick={() => setShowAdd(true)} className="bg-amber-700 hover:bg-amber-800 font-cinzel text-sm">
                ➕ Quick Add
              </Button>
            ) : (
              <div className="bg-[#1d140c]/70 p-4 rounded-md space-y-3">
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-1 rounded bg-amber-900/40 text-amber-100"
                />
                <textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-1 rounded bg-amber-900/40 text-amber-100"
                />
                <input
                  placeholder="Role (Hero/Villain)"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-1 rounded bg-amber-900/40 text-amber-100"
                />
                <input
                  placeholder="Image URL"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  className="w-full px-3 py-1 rounded bg-amber-900/40 text-amber-100"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
                  <Button
                    disabled={addCharacter.isPending}
                    onClick={() => addCharacter.mutate(form)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {addCharacter.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter + Sort Bar */}
        <div className="flex flex-wrap gap-4 justify-center items-center">
          {/* Role buttons */}
          <div className="flex gap-2">
            {roles.map((role) => (
              <Button
                key={role}
                size="sm"
                className={`font-cinzel ${roleFilter === role ? "bg-amber-600" : "bg-amber-800"}`}
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </Button>
            ))}
          </div>
          {/* Sort select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sorts[number])}
            className="bg-[#1d140c]/70 border border-amber-700 text-amber-100 text-sm rounded-md px-3 py-1 font-cinzel focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {sorts.map((s) => (
              <option key={s} value={s} className="bg-[#1d140c]">
                Sort: {s}
              </option>
            ))}
          </select>
        </div>

        {/* Character Grid */}
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((char) => (
            <motion.div
              key={char.id}
              whileHover={{ y: -6, boxShadow: "0 0 12px rgba(255,221,160,0.4)" }}
              className="bg-[#1d140c]/60 backdrop-blur-sm border border-amber-700 rounded-lg overflow-hidden shadow-lg transition-transform hover:shadow-amber-700/40"
            >
              <img src={char.image || char.photo_url || "/placeholder-character.jpg"} alt={char.name} className="w-full h-48 object-cover object-top" />
              <div className="p-4 space-y-2">
                <h3 className="font-cinzel text-xl text-amber-100">{char.name}</h3>
                <p className="text-sm text-amber-200 line-clamp-3 min-h-[3.6em]">{char.description}</p>
                <div className="flex gap-2 mt-4">
                  <Link href={`/characters/${char.id}`} className="flex-1">
                    <Button size="sm" variant="secondary" className="w-full bg-amber-700 hover:bg-amber-800 text-white font-cinzel">
                      <BookOpen className="h-4 w-4 mr-1" /> Read More
                    </Button>
                  </Link>
                  <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-cinzel">
                    ✍️ Write
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
