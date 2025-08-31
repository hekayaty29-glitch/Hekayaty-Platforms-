import { NewStory } from "@/components/story/StoryCreateForm";

export const mockStories: (NewStory & { id: number; userId: string; chapters: any[] })[] = [
  {
    id: 1,
    userId: 'admin-user-1',
    title: "Kingdoms of Ashes",
    description: "In a realm forged from flame and prophecy, a banished princess must reclaim her throne before darkness consumes the land.",
    coverUrl: "https://images.unsplash.com/photo-1503431760782-aaa0f4918a36?auto=format&fit=crop&w=800&q=60",
    posterUrl: "https://images.unsplash.com/photo-1496449903671-3e46f5a7f8b4?auto=format&fit=crop&w=800&q=60",
    soundtrackUrl: "https://www.youtube.com/embed/2gCk5pmpXSU",
    extraPhotos: [],
    genres: ["Fantasy"],
    tags: ["epic", "magic"],
    chapters: [
      {
        id: 101,
        title: "Embers of Exile",
        description: "The princess awakens in a foreign desert.",
        photoUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=60",
        scenes: [
          {
            id: 1001,
            text: "Heat shimmered above the dunes as Aurelia opened her eyes...",
            photoUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=60",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          },
          {
            id: 1002,
            text: "A distant roar echoed— the dragon's warning.",
            photoUrl: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=800&q=60",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          },
        ],
      },
    ],
  },
];
