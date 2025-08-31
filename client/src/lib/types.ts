// Extended types for frontend use

export interface UserStats {
  storiesCount: number;
  novelsCount: number;
  followersCount: number;
  followingCount: number;
  readingHistoryCount?: number;
  bookshelvesCount?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  avatar: string;
  isPremium: boolean;
  isAuthor: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  stats?: UserStats;
}

export interface AuthUser extends Omit<User, 'stats'> {
  /** Indicates if the user has administrative privileges */
  isAdmin: boolean;
  /** Authentication token for API requests */
  token?: string;
}

export interface StoryAuthor {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string;
  bio?: string;
}

export interface Genre {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface Novel extends Omit<StoryCard, 'isShortStory'> {
  isShortStory: false;
  chapters?: Array<{
    id: number;
    title: string;
    order: number;
    isPublished: boolean;
    wordCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  wordCount?: number;
  chapterCount?: number;
}

export interface StoryCard {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  authorId: number;
  isPremium: boolean;
  isPublished: boolean;
  isShortStory: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  ratingCount?: number;
  genres: Genre[];
  author: StoryAuthor | null;
}

export interface StoryDetail extends StoryCard {
  content: string;
  isBookmarked: boolean;
  /** Flag indicating this story belongs to Hekayaty Originals and is provided as a PDF */
  isOriginal?: boolean;
  /** Direct URL to the uploaded PDF */
  pdfUrl?: string;
  /** Optional soundtrack URL that should play alongside the PDF */
  soundtrackUrl?: string;
}

export interface Rating {
  id: number;
  userId: number;
  storyId: number;
  rating: number;
  review: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string;
  };
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

export interface PublishStoryFormData {
  title: string;
  description: string;
  content: string;
  coverImage: string;
  isPremium: boolean;
  isShortStory: boolean;
  isPublished: boolean;
  genreIds: number[];
}

export interface UserProfileUpdate {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ProfileUpdateData {
  fullName: string;
  bio: string;
  avatar?: string;
  isAuthor?: boolean;
  username?: string;
}

export interface RatingFormData {
  rating: number;
  review: string;
}

export interface GenreFilter {
  id: number;
  name: string;
  icon: string;
}
