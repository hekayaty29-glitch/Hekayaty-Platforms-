import { useEffect, useRef, useState } from "react";

export interface AudioScene {
  id: number;
  audioUrl?: string;
  photoUrl?: string;
  text?: string;
}

export function useAudioScenes(scenes: AudioScene[]) {
  const [index, setIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = scenes[index] ?? null;

  const play = () => {
    if (audioRef.current) audioRef.current.play();
  };
  const pause = () => {
    if (audioRef.current) audioRef.current.pause();
  };

  const next = () => {
    pause();
    setIndex((i) => (i + 1 < scenes.length ? i + 1 : i));
  };
  const prev = () => {
    pause();
    setIndex((i) => (i - 1 >= 0 ? i - 1 : 0));
  };

  useEffect(() => {
    // autoplay on scene change
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [index]);

  return { current, index, next, prev, audioRef, play, pause };
}
