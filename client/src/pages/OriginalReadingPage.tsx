import { useRoute, Link, useLocation } from "wouter";
import { useChapterPage } from "@/hooks/useChapterPage";
import { Button } from "@/components/ui/button";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PageData {
  id: number;
  content: string;
  bannerUrl: string;
  audioUrl: string;
  nextPage?: number;
  prevPage?: number;
}

export default function OriginalReadingPage() {
  const [, params] = useRoute("/originals/:storyId/chapters/:chapterId/pages/:pageNum");
  const storyId = params ? parseInt(params.storyId) : 0;
  const chapterId = params ? parseInt(params.chapterId) : 0;
  const pageNum = params ? parseInt(params.pageNum) : 1;
  const [, navigate] = useLocation();

  const { data: fetchedPage } = useChapterPage(storyId, chapterId, pageNum);

  const mockPage: PageData = {
    id: pageNum,
    bannerUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80",
    content: `<p>Princess Liora tightened the cloak around her shoulders as the cold forest mist wrapped its fingers around her. Every crack of a branch echoed like thunder in her chest. Somewhere behind, the palace still burned, embers rising like vengeful fireflies into the night sky...</p><p>Sir Edrik stepped from the shadows, his armor dull yet eyes ablaze with a violet curse. \"Your Highness,\" he knelt, voice like gravel, \"destiny binds us this night.\"</p>`,
    audioUrl: "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Kai_Engel/Chapter_One/Kai_Engel_-_03_-_Warm_of_Me.mp3",
    nextPage: pageNum < 2 ? pageNum + 1 : undefined,
    prevPage: pageNum > 1 ? pageNum - 1 : undefined,
  };

  const page = fetchedPage ?? mockPage;

  const [audio] = useState<HTMLAudioElement | null>(() => (page?.audioUrl ? new Audio(page.audioUrl) : null));
  const [playing, setPlaying] = useState(false);

  const toggleAudio = () => {
    if (!audio) return;
    if (playing) audio.pause(); else audio.play();
    setPlaying(!playing);
  };

  useEffect(() => {
    return () => {
      audio?.pause();
    };
  }, [audio]);

  if (!page) return <div className="h-[70vh] flex items-center justify-center font-cinzel">Loading…</div>;

  return (
    <div className="min-h-screen bg-amber-50 py-8 px-4 lg:px-28 font-cinzel overflow-hidden relative">
      {/* Banner */}
      <div className="relative h-56 lg:h-72 w-full overflow-hidden rounded-lg shadow-xl border-4 border-amber-500/50">
        <img src={page.bannerUrl} alt="Scene" className="object-cover w-full h-full" />
      </div>

      {/* Audio orb */}
      <button
        onClick={toggleAudio}
        className={cn("fixed top-6 right-6 z-50 p-4 rounded-full bg-amber-600 shadow-lg hover:bg-amber-700", playing && "animate-pulse-soft")}
      >
        {playing ? <Pause className="w-6 h-6 text-white"/> : <Play className="w-6 h-6 text-white"/>}
      </button>

      {/* Story content */}
      <article className="mt-10 bg-amber-100/60 p-6 lg:p-10 rounded-lg shadow-md border-amber-400/40 prose lg:prose-lg max-w-none mx-auto leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>

      {/* Navigation */}
      <div className="mt-12 flex justify-between max-w-4xl mx-auto">
        {page.prevPage ? (
          <Button asChild variant="outline" className="gap-1">
            <Link href={`/originals/${storyId}/chapters/${chapterId}/pages/${page.prevPage}`}><ChevronLeft/> Previous</Link>
          </Button>
        ) : <div />}

        {page.nextPage ? (
          <Button asChild className="gap-1 bg-amber-600 hover:bg-amber-700">
            <Link href={`/originals/${storyId}/chapters/${chapterId}/pages/${page.nextPage}`}>Next <ChevronRight/></Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>End of Chapter</Button>
        )}
      </div>
    </div>
  );
}
