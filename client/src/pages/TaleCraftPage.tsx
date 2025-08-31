import { Link } from "wouter";
import { useState } from "react";
import TaleCraftEditorPage from "./TaleCraftEditorPage";
import { Helmet } from "react-helmet";
import { Hammer } from "lucide-react";

interface WorkshopStory {
  id: number;
  title: string;
  author: string;
  summary: string;
  cover: string; // emoji or url
}

const workshopStories: WorkshopStory[] = [
  {
    id: 301,
    title: "Forged in Starlight",
    author: "Eira Stormforge",
    summary:
      "Crafted during the Celestial Smithing workshop, this tale follows a blacksmith who forges weapons from fallen stars.",
    cover: "✨",
  },
  {
    id: 302,
    title: "The Whispering Quill",
    author: "Rowan Inkweaver",
    summary:
      "A sentient quill guides a scribe through a maze of magical parchment. Born in the Art of Quills workshop.",
    cover: "🖋️",
  },
  {
    id: 303,
    title: "Chronicles of the Clockwork Garden",
    author: "Thalia Gearheart",
    summary:
      "From the Mechanized Worlds workshop—discover a garden where flowers tick and vines chime.",
    cover: "⏰",
  },
];

export default function TaleCraftPage() {
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  
  return (
    <>
      {view === "dashboard" && (
        <>
          <Helmet>
            <title>TaleCraft Workshops</title>
            <meta
              name="description"
              content="Explore standout stories produced in the TaleCraft community workshops."
            />
          </Helmet>

          <section className="py-20 px-4 bg-gradient-to-br from-amber-800 via-brown-dark to-midnight-blue text-amber-50">
            <div className="container mx-auto max-w-6xl text-center">
              <div className="flex justify-center items-center gap-4 mb-6">
                <Hammer className="h-8 w-8 text-amber-400" />
                <h1 className="font-cinzel text-4xl md:text-5xl font-bold">TaleCraft Workshops</h1>
                <Hammer className="h-8 w-8 text-amber-400" />
              </div>
              <button
                onClick={() => setView("editor")}
                className="inline-block mb-6 bg-emerald-600 hover:bg-emerald-700 text-white font-cinzel text-sm py-2 px-6 rounded-full transition-colors"
              >
                ✨ Create Comic
              </button>

              <p className="max-w-3xl mx-auto text-amber-200 mb-12 text-lg font-cormorant italic">
                Masterpieces forged in the fires of collaboration. Dive into stories refined within our community workshops.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {workshopStories.map((story) => (
                  <div
                    key={story.id}
                    className="bg-amber-50/10 p-6 rounded-lg border border-amber-500 backdrop-filter backdrop-blur-sm hover:shadow-lg transition-all flex flex-col items-center"
                  >
                    <div className="text-6xl mb-4">{story.cover}</div>
                    <h3 className="font-cinzel text-2xl font-bold text-amber-100 mb-2 text-center">
                      {story.title}
                    </h3>
                    <p className="text-amber-200 text-sm mb-4 text-center">by {story.author}</p>
                    <p className="text-amber-50 text-sm leading-relaxed mb-6 line-clamp-3">
                      {story.summary}
                    </p>
                    <Link
                      href={`/stories/${story.id}`}
                      className="bg-amber-500 hover:bg-amber-600 text-amber-50 font-cinzel text-sm py-2 px-6 rounded-full transition-colors"
                    >
                      Read Story
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
      {view === "editor" && (
        <div className="min-h-screen bg-slate-900">
          <TaleCraftEditorPage />
        </div>
      )}
    </>
  );
}
