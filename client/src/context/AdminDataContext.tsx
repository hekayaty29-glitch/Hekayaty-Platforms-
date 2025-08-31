import React, { createContext, useState, useContext, ReactNode } from "react";

// --- Data models ---
export interface User {
  id: string;
  name: string;
  email: string;
  banned: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Workshop {
  id: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  owner?: string;
}

export interface Club {
  id: string;
  name: string;
  category: string;
  ownerId: string;
}

export interface Artwork {
  id: string;
  title: string;
  url: string;
  reported: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

// ---- Hall of Quills models ----
export interface BestWriter {
  id: string; // user id
  name: string;
  avatar?: string;
  description?: string;
  profileLink?: string;
}

export interface ActiveWriter {
  id: string;
  name: string;
  avatar?: string;
  storiesCount: number;
}

export interface Competition {
  id: string;
  title: string;
  winnerNames: string;
  date: string;
  prize?: string;
  storyLink?: string;
  badgeUrl?: string;
}

export interface HonorableMention {
  id: string;
  name: string;
  reason: string;
  badgeUrl?: string;
}

// --- Meet the Legends ---
export interface LegendaryCharacter {
  id: string;
  name: string;
  photo: string;
  shortDescription: string;
  fullBio: string;
  role: string;
  origin: string;
  powers?: string;
}

interface AdminDataContextType {
  // Hall of Quills
  bestWriters: BestWriter[];
  setBestWriters: React.Dispatch<React.SetStateAction<BestWriter[]>>;
  activeWriters: ActiveWriter[];
  setActiveWriters: React.Dispatch<React.SetStateAction<ActiveWriter[]>>;
  competitions: Competition[];
  setCompetitions: React.Dispatch<React.SetStateAction<Competition[]>>;
  honorableMentions: HonorableMention[];
  legendaryCharacters: LegendaryCharacter[];
  setLegendaryCharacters: React.Dispatch<React.SetStateAction<LegendaryCharacter[]>>;
  setHonorableMentions: React.Dispatch<React.SetStateAction<HonorableMention[]>>;

  // Existing
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  workshops: Workshop[];
  setWorkshops: React.Dispatch<React.SetStateAction<Workshop[]>>;
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  artworks: Artwork[];
  setArtworks: React.Dispatch<React.SetStateAction<Artwork[]>>;
  communityNews: NewsArticle[];
  setCommunityNews: React.Dispatch<React.SetStateAction<NewsArticle[]>>;
  mainNews: NewsArticle[];
  setMainNews: React.Dispatch<React.SetStateAction<NewsArticle[]>>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  // Initialize with dummy data; later could be loaded from localStorage or API.
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Alice", email: "alice@example.com", banned: false },
    { id: "2", name: "Bob", email: "bob@example.com", banned: true },
  ]);

  const [comments, setComments] = useState<Comment[]>([
    { id: "c1", userId: "1", content: "Great story!", createdAt: new Date().toISOString() },
  ]);

  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [bestWriters, setBestWriters] = useState<BestWriter[]>([]);
  const [activeWriters, setActiveWriters] = useState<ActiveWriter[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [honorableMentions, setHonorableMentions] = useState<HonorableMention[]>([]);

  const [legendaryCharacters, setLegendaryCharacters] = useState<LegendaryCharacter[]>([]);

  const [communityNews, setCommunityNews] = useState<NewsArticle[]>([]);
  const [mainNews, setMainNews] = useState<NewsArticle[]>([]);

  return (
    <AdminDataContext.Provider
      value={{
        users,
        setUsers,
        comments,
        setComments,
        workshops,
        setWorkshops,
        clubs,
        setClubs,
        artworks,
        setArtworks,
        bestWriters,
        setBestWriters,
        activeWriters,
        setActiveWriters,
        competitions,
        setCompetitions,
        honorableMentions,
        setHonorableMentions,
        legendaryCharacters,
        setLegendaryCharacters,
        communityNews,
        setCommunityNews,
        mainNews,
        setMainNews,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
