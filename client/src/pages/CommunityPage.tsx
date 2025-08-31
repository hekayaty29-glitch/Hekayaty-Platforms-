import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  BookOpen,
  Paintbrush2,
  PenTool,
  Trophy,
  ImagePlus,
  Send,
  PlusCircle,
  MessageCircle,
  Heart,
  Share2,
  Eye,
  Star,
  Crown,
  Zap,
  Globe,
  Clock,
  Filter,
  Search,
  TrendingUp,
  Award,
  Flame,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Camera,
  Mic,
  Video,
  FileText,
  Link,
  Hash,
  AtSign,
  Pin,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Plus,
  Trash2
} from 'lucide-react';
import heroBg from '@/assets/c79d8e3c-1594-4711-97bf-606619c10341.png';

import { useCommunityPosts, useCreatePost, useLikePost, usePostComments, useAddComment, useLikeComment, useDeletePost, useDeleteComment } from '@/hooks/useCommunityPosts';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReportDialog from '@/components/common/ReportDialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useClubs, useJoinClub, useAddClub } from '@/hooks/useClubs';
import { useWorkshops, useJoinWorkshop, useAddWorkshop } from '@/hooks/useWorkshops';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ClubCreationModal } from '@/components/community/ClubCreationModal';
import { WorkshopCreationModal } from '@/components/community/WorkshopCreationModal';
import { ClubCard } from '@/components/community/ClubCard';
import { WorkshopCard } from '@/components/community/WorkshopCard';

// Comments component for individual discussions
const DiscussionComments: React.FC<{ discussionId: string }> = ({ discussionId }) => {
  const { data: comments = [], isLoading } = usePostComments(discussionId);
  const addCommentMutation = useAddComment();
  const likeCommentMutation = useLikeComment();
  const { user } = useAuth();
  const currentUser = user?.username || 'You';

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('comment') as HTMLInputElement;
    if (input.value.trim()) {
      addCommentMutation.mutate({ postId: discussionId, content: input.value.trim() });
      input.value = '';
    }
  };

  const handleLikeComment = (commentId: string) => {
    likeCommentMutation.mutate({ commentId, postId: discussionId });
  };

  if (isLoading) {
    return <div className="mt-4 text-gray-400">Loading comments...</div>;
  }

  return (
    <div className="mt-4 space-y-4">
      {comments.length === 0 && <p className="italic text-gray-400">No comments yet.</p>}
      {comments.map((comment: any) => (
        <div key={comment.id} className="bg-white/5 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-amber-400 font-semibold">User</span>
            <div className="flex items-center gap-2">
              <ReportDialog 
                contentId={comment.id} 
                contentType="comment" 
                triggerClassName="border-red-500 text-red-500 hover:bg-red-600 hover:text-white px-1 py-0.5 text-[10px]" 
              />
              <button 
                onClick={() => handleLikeComment(comment.id)} 
                className={`flex items-center gap-1 text-sm transition-colors ${
                  comment.user_has_liked ? 'text-red-400' : 'text-blue-200 hover:text-blue-300'
                }`}
              >
                <ThumbsUp className="w-3 h-3" /> 
                {comment.like_count || 0}
              </button>
            </div>
          </div>
          <div className="text-gray-300">{comment.content}</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(comment.created_at).toLocaleString()}
          </div>
        </div>
      ))}
      <form onSubmit={handleAddComment} className="flex gap-2">
        <Input 
          name="comment" 
          placeholder="Add a comment..." 
          className="flex-1" 
          disabled={addCommentMutation.isPending}
        />
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700" 
          disabled={addCommentMutation.isPending}
        >
          {addCommentMutation.isPending ? 'Posting...' : 'Post'}
        </Button>
      </form>
    </div>
  );
};

const CommunityPage: React.FC = () => {
  const { data: clubs = [] } = useClubs();
  const joinClub = useJoinClub();
  const addClub = useAddClub();
  const { data: workshops = [] } = useWorkshops();
  const joinWorkshop = useJoinWorkshop();
  const addWorkshop = useAddWorkshop();
  const [, setLocation] = useLocation();
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [workshopModalOpen, setWorkshopModalOpen] = useState(false);
  // Mock data and state management
  const [activeTab, setActiveTab] = useState('discussions');
  const { user } = useAuth();
  const currentUserId: string = user?.id ? String(user.id) : '';
  const currentUser: string = user?.username ?? 'You';
  const isAdmin = currentUser === 'Admin';

  interface DiscussionComment { id: string; user: string; text: string; likes: number; }
  interface DiscussionItem {
    id: string;
    title: string;
    author: string;
    avatar: string;
    content: string;
    timestamp: string;
    likes: number;
    replies: number;
    views: number;
    tags: string[];
    category: string;
    isPinned: boolean;
    trending: boolean;
    comments: DiscussionComment[];
    user_has_liked?: boolean;
  }

  const { data: posts = [], isLoading: postsLoading } = useCommunityPosts();
  const deletePost = useDeletePost();
  const deleteCommentMutation = useDeleteComment();
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const addComment = useAddComment();
  const likeComment = useLikeComment();
  
  // Transform backend posts to match frontend interface
  const discussions = posts.map((post: any) => ({
    id: post.id,
    title: post.title || '',
    author: 'User', // TODO: fetch user data
    avatar: '👤',
    content: post.body || '',
    timestamp: new Date(post.created_at).toLocaleString() || 'Unknown',
    likes: post.like_count || 0,
    replies: post.comment_count ?? 0,
    views: 0,
    tags: post.tags || [],
    category: 'General',
    isPinned: false,
    trending: post.like_count > 5,
    comments: [],
    user_has_liked: post.user_has_liked || false,
  }));

  interface NewsItem { id:number; title:string; category:string; content:string; timestamp:string; }
  const [news,setNews] = useState<NewsItem[]>([
    {id:1,title:'Monthly Writing Contest Results Are In!',category:'Contest Winner Announcement',content:'Congratulations to all participants! The winning entries showcased incredible creativity and storytelling prowess.',timestamp:'2 hours ago'},
    {id:2,title:'New Features Released!',category:'Platform Update',content:"We've added real-time collaboration tools, enhanced search functionality, and improved mobile experience.",timestamp:'1 day ago'}
  ]);

  const addNews=(title:string,content:string)=>{
    const item:NewsItem={id:news.length+1,title,category:'Announcement',content,timestamp:'Just now'};
    setNews([item,...news]);
  };

  const [forums] = useState([
    { id: 1, name: 'Fantasy Writing', members: 1247, description: 'Epic tales and magical worlds', color: 'purple', posts: 3421 },
    { id: 2, name: 'Poetry Corner', members: 892, description: 'Verses that touch the soul', color: 'pink', posts: 2156 },
    { id: 3, name: 'Sci-Fi Chronicles', members: 1034, description: 'Future worlds and beyond', color: 'blue', posts: 2743 },
  ]);

  // legacy club data removed

  interface ArtItem { id:number; title:string; artist:string; likes:number; image:string | null; imageUrl?:string }
  const [gallery,setGallery] = useState<ArtItem[]>([
    { id: 1, title: 'Enchanted Castle', artist: 'ArtMage', likes: 156, image: '🏰' },
    { id: 2, title: "Dragon's Lair", artist: 'FirePainter', likes: 243, image: '🐉' },
    { id: 3, title: 'Mystic Forest', artist: 'NatureWitch', likes: 187, image: '🌲' },
    { id: 4, title: 'Starlit Path', artist: 'CelestialArt', likes: 298, image: '✨' },
  ]);

  const [newArt, setNewArt] = useState<{ title: string; artist: string; file: File | null }>({
    title: '',
    artist: '',
    file: null,
  });

  const likeArt = (id: number) =>
    setGallery((prev) => prev.map((a) => (a.id === id ? { ...a, likes: a.likes + 1 } : a)));

  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUploadArt = async (file: File, title: string, artist: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'community-art');

      const resp = await fetch('/api/upload/file', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) throw new Error('Upload failed');
      const json = await resp.json();
      
      const newArt: ArtItem = {
        id: gallery.length + 1,
        title,
        artist,
        likes: 0,
        image: null,
        imageUrl: json.url,
      };
      setGallery([newArt, ...gallery]);
    } catch (error) {
      console.error('Art upload failed:', error);
      alert('Failed to upload art. Please try again.');
    }
  };

  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '', tags: '', category: 'General' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');

  const categories = ['General', 'Writing', 'Art', 'Workshops', 'Challenges', 'Feedback', 'Announcements'];

  const [expandedDiscussion, setExpandedDiscussion] = useState<string|null>(null);

  const likeDiscussion = (id: string) => {
    likePost.mutate(id);
  };

  const handleAddComment = (discussionId: string, text: string) => {
    if (!text.trim()) return;
    addComment.mutate({ postId: discussionId, content: text.trim() });
  };

  const handleLikeComment = (discussionId: string, commentId: string) => {
    likeComment.mutate({ commentId, postId: discussionId });
  };

  const deleteDiscussion = (id: string) => {
    deletePost.mutate(id);
  };

  const deleteComment = (discussionId: string, commentId: string) => {
    deleteCommentMutation.mutate({ commentId, postId: discussionId });
  };

  const deleteArt = (id: number) =>
    setGallery((prev) => prev.filter((a) => a.id !== id));

  const handleCreateDiscussion = () => {
    if (!user) {
      alert('Please sign in to create posts');
      return;
    }
    
    if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
      alert('Please fill in both title and content fields');
      return;
    }
    
    console.log('Creating discussion:', newDiscussion);
    
    createPost.mutate({
      title: newDiscussion.title,
      body: newDiscussion.content,
      tags: newDiscussion.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }, {
      onSuccess: () => {
        console.log('Post created successfully');
        setNewDiscussion({ title: '', content: '', tags: '', category: 'General' });
      },
      onError: (error) => {
        console.error('Failed to create post:', error);
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          alert('Your session has expired. Please sign in again to create posts.');
        } else {
          alert('Failed to create post. Please try again.');
        }
      }
    });
  };

  const filteredDiscussions = discussions.filter((discussion: DiscussionItem) => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || discussion.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    switch (sortBy) {
      case 'trending':
        return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.likes - a.likes;
      case 'recent':
        // Using relative strings; fallback to original order
        return 0;
      case 'popular':
        return b.likes - a.likes;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914]">
      {/* Magical Hero Section */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-800/20"></div>
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              ✨
            </div>
          ))}
        </div>

        <div className="relative z-10 text-center py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300 bg-clip-text text-transparent mb-6">
              Hekayaty Universe
            </h1>
            <p className="text-2xl text-gray-200 mb-8 font-light">Where imagination knows no bounds and every voice creates magic</p>
            <div className="flex flex-wrap justify-center gap-4 text-lg text-gray-300">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <Users className="h-5 w-5 text-amber-400" />
                <span>12,847 Creators</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <MessageCircle className="h-5 w-5 text-amber-500" />
                <span>45,621 Stories</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <Heart className="h-5 w-5 text-amber-300" />
                <span>189K Connections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Creation Modals */}
      <ClubCreationModal open={clubModalOpen} onOpenChange={setClubModalOpen} />
      <WorkshopCreationModal open={workshopModalOpen} onOpenChange={setWorkshopModalOpen} />

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-4">
            {[
              { id: 'discussions', label: 'Free Discussions', icon: MessageCircle, color: 'blue' },
                            { id: 'clubs', label: 'Creative Clubs', icon: BookOpen, color: 'green' },
              { id: 'gallery', label: 'Art Gallery', icon: Paintbrush2, color: 'pink' },
              { id: 'workshops', label: 'Live Workshops', icon: PenTool, color: 'yellow' },
              { id: 'news', label: 'Community News', icon: Trophy, color: 'red' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-${tab.color}-500/30 text-${tab.color}-300 border border-${tab.color}-400/50 shadow-lg shadow-${tab.color}-500/20`
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {React.createElement(tab.icon, { className: 'h-5 w-5' })}
                <span className="font-medium">{tab.label}</span>
                {activeTab === tab.id && <Sparkles className="h-4 w-4 animate-pulse" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="space-y-8">
            {/* Create Discussion */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-blue-500/20 backdrop-blur-sm">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-blue-400" />
                Start a New Discussion
                <Zap className="h-6 w-6 text-yellow-400 animate-pulse" />
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="What's on your mind? Share your thoughts..."
                    value={newDiscussion.title}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                  />
                  <select
                    value={newDiscussion.category}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, category: e.target.value })}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-800">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Share your thoughts, ask questions, start conversations... This is your space to express freely!"
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  rows={4}
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />

                <div className="flex flex-wrap gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Add tags (comma separated)"
                    value={newDiscussion.tags}
                    onChange={(e) => setNewDiscussion({ ...newDiscussion, tags: e.target.value })}
                    className="flex-1 min-w-64 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />

                  <div className="flex gap-2">
                    <button className="p-3 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all">
                      <Camera className="h-5 w-5" />
                    </button>
                    <button className="p-3 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all">
                      <Link className="h-5 w-5" />
                    </button>
                    <button className="p-3 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all">
                      <Hash className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    onClick={handleCreateDiscussion}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Share Your Thoughts
                  </button>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap gap-4 items-center justify-between bg-black/20 p-6 rounded-2xl backdrop-blur-sm">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="all" className="bg-gray-800">
                    All Categories
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-800">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                {['trending', 'recent', 'popular'].map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort)}
                    className={`px-4 py-2 rounded-xl capitalize transition-all ${
                      sortBy === sort
                        ? `bg-blue-500/30 text-blue-300 border border-blue-400/50`
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {sort === 'trending' && <TrendingUp className="inline h-4 w-4 mr-1" />}
                    {sort === 'recent' && <Clock className="inline h-4 w-4 mr-1" />}
                    {sort === 'popular' && <Flame className="inline h-4 w-4 mr-1" />}
                    {sort}
                  </button>
                ))}
              </div>
            </div>

            {/* Discussions List */}
            <div className="space-y-6">
              {sortedDiscussions.map((discussion: DiscussionItem) => (
                <div
                  key={discussion.id}
                  className={`group bg-gradient-to-r from-white/5 to-white/10 rounded-2xl p-6 border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                    discussion.isPinned ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-900/20 to-orange-900/20' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
                        {discussion.avatar}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {discussion.isPinned && <Pin className="h-4 w-4 text-yellow-400" />}
                        {discussion.trending && <Flame className="h-4 w-4 text-orange-400" />}
                        <span className="text-blue-300 font-semibold">{discussion.author}</span>
                        <span className="text-gray-400 text-sm">{discussion.timestamp}</span>
                        <div className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">{discussion.category}</div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">{discussion.title}</h3>

                      <p className="text-gray-300 mb-4 line-clamp-2">{discussion.content}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {discussion.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full hover:bg-blue-500/30 cursor-pointer transition-all"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-gray-400">
                          <button 
                            onClick={() => likeDiscussion(discussion.id)} 
                            className={`flex items-center gap-2 transition-colors ${
                              discussion.user_has_liked ? 'text-red-400' : 'hover:text-red-400'
                            }`}
                            disabled={likePost.isPending}
                          >
                            <Heart className={`h-5 w-5 ${discussion.user_has_liked ? 'fill-current' : ''}`} />
                            <span>{discussion.likes}</span>
                          </button>
                          <button onClick={() => setExpandedDiscussion(expandedDiscussion===discussion.id?null:discussion.id)} className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                            <MessageSquare className="h-5 w-5" />
                            <span>{discussion.replies}</span>
                          </button>
                          <ReportDialog contentId={discussion.id} contentType="discussion" triggerClassName="border-red-500 text-red-500 hover:bg-red-600 hover:text-white px-2 py-1 text-xs" />
                          <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            <span>{discussion.views}</span>
                            {discussion.author === currentUser && (
                              <button onClick={() => deleteDiscussion(discussion.id)} className="text-red-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="p-2 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all">
                            <Bookmark className="h-4 w-4" />
                          </button>
                          <button className="p-2 bg-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all">
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {expandedDiscussion===discussion.id && (
                        <DiscussionComments discussionId={discussion.id} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forums Tab */}
        {false && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <Users className="h-10 w-10 text-purple-400" /> Topic Forums <Crown className="h-8 w-8 text-yellow-400" />
              </h2>
              <p className="text-xl text-gray-300">Dive deep into specialized discussions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forums.map((forum) => (
                <div
                  key={forum.id}
                  className="group bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r from-${forum.color}-500 to-${forum.color}-600 rounded-full flex items-center justify-center`}>
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{forum.name}</h3>
                      <p className="text-gray-400 text-sm">{forum.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Members</span>
                      <span className="text-white font-semibold">{forum.members.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Posts</span>
                      <span className="text-white font-semibold">{forum.posts.toLocaleString()}</span>
                    </div>
                  </div>

                  <button className="w-full mt-6 py-3 bg-purple-500/20 text-purple-300 rounded-xl font-semibold hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" /> Join Forum
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clubs Tab */}
        {activeTab === 'clubs' && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <BookOpen className="h-10 w-10 text-green-400" /> Creative Clubs <Star className="h-8 w-8 text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-xl text-gray-300">Join exclusive communities of passionate creators</p>
            </div>

            <div className="flex justify-center mb-8">
              <button
                onClick={() => setClubModalOpen(true)}
                className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
              >
                <Plus className="h-8 w-8" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => {
                const isMember = club.members?.includes(currentUserId) || false;
                const isCreator = club.founder_id === currentUserId;
                return (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onJoin={(clubId) => joinClub.mutate({ clubId, userId: currentUserId })}
                    onEnter={(clubId) => setLocation(`/clubs/${clubId}`)}
                    isJoined={isMember}
                    isCreator={isCreator}
                  />
                );
              })}
            </div>
          </div>

        )}

        {/* Gallery Tab */}
        {activeTab === 'workshops' && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <PenTool className="h-10 w-10 text-purple-400" /> Creative Workshops <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-xl text-gray-300">Collaborate on novels and hone your craft</p>
            </div>

            <div className="flex justify-center mb-8">
              <button
                onClick={() => setWorkshopModalOpen(true)}
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
              >
                <Plus className="h-8 w-8" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((ws) => {
                const isMember = ws.members?.includes(currentUserId) || false;
                const isInstructor = ws.host_id === currentUserId;
                return (
                  <WorkshopCard
                    key={ws.id}
                    workshop={ws}
                    onJoin={(workshopId) => joinWorkshop.mutate({ workshopId: workshopId, userId: currentUserId })}
                    onEnter={(workshopId) => setLocation(`/workshops/${workshopId}`)}
                    isJoined={isMember}
                    isInstructor={isInstructor}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <Paintbrush2 className="h-10 w-10 text-pink-400" /> Magical Art Gallery{' '}
                <Sparkles className="h-8 w-8 text-yellow-400 animate-spin" />
              </h2>
              <p className="text-xl text-gray-300">Showcase your creative masterpieces</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gallery.map((art) => (
                <div
                  key={art.id}
                  className="group bg-gradient-to-br from-pink-900/30 to-purple-900/30 rounded-2xl p-4 border border-pink-500/20 hover:border-pink-400/50 transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer"
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                     {art.imageUrl? <img src={art.imageUrl} alt={art.title} className="object-cover w-full h-full"/> : <span className="text-6xl">{art.image}</span>}
                   </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">{art.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">by {art.artist}</p>
                  <div className="flex items-center justify-between">
                    <button onClick={()=>likeArt(art.id)} className="flex items-center gap-2 text-pink-400 hover:text-pink-300">
                       <Heart className="h-4 w-4" />
                       <span className="text-sm">{art.likes}</span>
                     </button>
                    <button className="p-2 bg-pink-500/20 text-pink-300 rounded-lg hover:bg-pink-500/30 transition-all">
                      <Eye className="h-4 w-4" />
                    </button>
                    <ReportDialog contentId={art.id} contentType="art" triggerClassName="border-red-500 text-red-500 hover:bg-red-600 hover:text-white px-1 py-0.5 text-xs" />
                     {art.artist === currentUser && (
                       <button onClick={() => deleteArt(art.id)} className="text-red-500 hover:text-red-600">
                         <Trash2 className="h-4 w-4" />
                       </button>
                     )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newArt.file) return;
                  void handleUploadArt(newArt.file, newArt.title, newArt.artist);
                  setNewArt({ title: '', artist: '', file: null });
                }}
                className="max-w-md mx-auto space-y-4 bg-pink-900/20 p-6 rounded"
              >
                <h3 className="text-xl font-semibold text-white">Upload New Artwork</h3>
                <Input
                  placeholder="Artwork Title"
                  value={newArt.title}
                  onChange={(e) => setNewArt({ ...newArt, title: e.target.value })}
                  required
                />
                <Input
                  placeholder="Artist Name"
                  value={newArt.artist}
                  onChange={(e) => setNewArt({ ...newArt, artist: e.target.value })}
                  required
                />
                <Input
                  type="file"
                  accept="image/*"
                  ref={uploadInputRef}
                  onChange={(e) => setNewArt({ ...newArt, file: e.target.files?.[0] || null })}
                  required
                />
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">
                  Share Art
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Workshops Tab */}
        {activeTab === 'workshops' && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <PenTool className="h-10 w-10 text-yellow-400" /> Live Workshops{' '}
                <Zap className="h-8 w-8 text-yellow-400 animate-pulse" />
              </h2>
              <p className="text-xl text-gray-300">Learn, create, and grow together</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-2xl p-6 border border-yellow-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                    <PenTool className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Creative Writing Masterclass</h3>
                    <p className="text-gray-400 text-sm">Live • Starting in 2 hours</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Join renowned author Sarah Mitchell for an intensive session on character development and plot structure.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-semibold">156 attending</span>
                  <button className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-all">Join Workshop</button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Paintbrush2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Digital Art Techniques</h3>
                    <p className="text-gray-400 text-sm">Tomorrow • 3:00 PM</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">Master the art of digital illustration with professional artist Alex Chen.</p>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-semibold">89 registered</span>
                  <button className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all">Register Now</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <Trophy className="h-10 w-10 text-red-400" /> Community News{' '}
                <Award className="h-8 w-8 text-yellow-400 animate-bounce" />
              </h2>
              <p className="text-xl text-gray-300">Stay updated with latest happenings</p>
            </div>

            <div className="space-y-6">
              {isAdmin && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const titleInput = form.elements.namedItem('title') as HTMLInputElement;
                    const bodyInput = form.elements.namedItem('body') as HTMLTextAreaElement;
                    if (titleInput.value.trim() && bodyInput.value.trim()) {
                      addNews(titleInput.value.trim(), bodyInput.value.trim());
                      titleInput.value = '';
                      bodyInput.value = '';
                    }
                  }}
                  className="bg-white/5 p-4 rounded-xl space-y-3"
                >
                  <Input name="title" placeholder="News title" className="bg-black/20" />
                  <Textarea name="body" placeholder="News content" className="bg-black/20" />
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">Post News</Button>
                </form>
              )}

              {news.map((item) => (
                <div key={item.id} className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-2xl p-6 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                    <span className="text-red-300 font-semibold">{item.category}</span>
                    <span className="text-gray-400 text-sm">{item.timestamp}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-300 whitespace-pre-line">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        {/* FAB for create club/workshop */}
        {(activeTab === 'clubs' || activeTab === 'workshops') && (
          <button
            onClick={() => {
              if (activeTab === 'clubs') {
                setClubModalOpen(true);
              } else {
                setWorkshopModalOpen(true);
              }
            }}
            className="w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          >
            <Plus className="h-8 w-8" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
