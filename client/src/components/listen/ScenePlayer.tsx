import React from "react";
import { Button } from "@/components/ui/button";
import { useAudioScenes, AudioScene } from "@/hooks/useAudioScenes";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

interface ScenePlayerProps {
  scenes: AudioScene[];
}

export default function ScenePlayer({ scenes }: ScenePlayerProps) {
  const { current, index, next, prev, audioRef, play, pause } = useAudioScenes(scenes);
  const [isPlaying, setIsPlaying] = React.useState(true);

  React.useEffect(() => {
    if (isPlaying) play();
    else pause();
  }, [isPlaying, play, pause]);

  if (!current) return <p>No scenes.</p>;

  return (
    <div className="space-y-4 text-center">
      {current.photoUrl && (
        <img src={current.photoUrl} alt="scene" className="max-h-64 w-full object-cover rounded-md mx-auto" />
      )}
      
      <audio ref={audioRef} src={current.audioUrl} onEnded={next} hidden />

      <div className="flex items-center justify-center gap-4 mt-3">
        <Button size="icon" variant="outline" onClick={prev} disabled={index === 0}>
          <ChevronLeft />
        </Button>
        <Button
          size="icon"
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => setIsPlaying((p) => !p)}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={next}
          disabled={index === scenes.length - 1}
        >
          <ChevronRight />
        </Button>
      </div>
      {current.text && (
        <p className="whitespace-pre-wrap text-brown-dark text-lg mt-4">
          {current.text}
        </p>
      )}
      <p className="text-sm text-gray-600 mt-2">
        Scene {index + 1} / {scenes.length}
      </p>
    </div>
  );
}
