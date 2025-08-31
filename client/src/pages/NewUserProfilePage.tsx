import React, { useEffect, useState, useRef } from 'react';
import profileBg from '@/assets/9814ae82-9631-4241-a961-7aec31f9aa4d_09-11-19.png';
import { User, Settings, Edit3, Camera, Book, FileText, Crown, Eye, Lock, Mail, Bell, CreditCard, Shield, Upload, Plus, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUserProfile, useUserStories, useUserComics, useUpdateUserProfile, useEnsureUserProfile } from '@/hooks/useUserData';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Link } from 'wouter';

const UserProfile = () => {
  // Auth & queries
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const userId = user?.id;

  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: allStories = [], isLoading: storiesLoading } = useUserStories(userId);
  const { data: comicsData = [], isLoading: comicsLoading } = useUserComics(userId);
  const updateProfile = useUpdateUserProfile(userId);
  const ensureProfile = useEnsureUserProfile(userId);
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('stories');
  const [isEditing, setIsEditing] = useState(false);

  // Ensure profile row exists on first load
  useEffect(() => {
    if (!profileLoading && !profile && userId) {
      ensureProfile.mutate();
    }
  }, [profileLoading, profile, userId]);

  // Sync fetched profile into local editable state
  useEffect(() => {
    if (profile) {
      const p: any = profile;
      setUserProfile({
        id: p.id,
        name: p.full_name ?? '',
        username: `@${p.username}`,
        bio: p.bio ?? '',
        profileImage: p.avatar_url ?? '',
        coverUrl: p.cover_url ?? '',
        followers: p.followers_count ?? 0,
        following: p.following_count ?? 0,
        location: p.location ?? '',
        website: p.website ?? '',
        joinDate: new Date(p.created_at).toLocaleDateString(),
        subscription: p.is_premium ? 'Premium' : 'Free',
      });
    }
  }, [profile]);
  const [showSettings, setShowSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // Derived content lists
  const stories = allStories;
  const comics: any[] = comicsData;

  // Avatar upload input ref
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');

      const resp = await fetch('/api/upload/file', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) throw new Error('Upload failed');
      const json = await resp.json();
      setUserProfile((prev: any) => ({ ...prev, profileImage: json.url }));
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    }
  };

  const handleProfileUpdate = (field: string, value: any) => {
    setUserProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const ProfileHeader = () => {
    if (!userProfile) return (
      <div className="h-48 w-full flex items-center justify-center text-gray-400">Loading profile...</div>
    );
    return (
    <div className="relative mb-8">
      {/* Cover image removed as per user request */}
      
      {/* Profile Info */}
      <div className="relative px-6 -mt-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Image */}
            <div className="relative">
              <img 
                src={userProfile.profileImage} 
                alt={userProfile.name}
                className="w-32 h-32 rounded-full object-cover object-center border-4 border-white shadow-xl"
              />
              {isEditing && (
                <button onClick={handleAvatarClick} className="absolute bottom-0 right-0 bg-amber-700 text-white p-2 rounded-full hover:bg-amber-800 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Basic Info */}
            <div className="text-white md:mb-4">
              {isEditing ? (
                <input
                  value={userProfile.name ?? ''}
                  onChange={(e) => handleProfileUpdate('name', e.target.value)}
                  className="text-3xl font-bold mb-1 bg-transparent border-b border-amber-300 focus:outline-none focus:border-amber-500 text-brown-dark"
                />
              ) : (
                <h1 className="text-3xl font-bold mb-1 text-yellow-400">{userProfile.name}</h1>
              )}
              <p className="text-brown-dark mb-2">{userProfile.username}</p>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center space-x-1">
                  <span className="font-semibold text-brown-dark">{userProfile.followers.toLocaleString()}</span>
                  <span className="text-brown-dark">followers</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="font-semibold text-brown-dark">{userProfile.following}</span>
                  <span className="text-brown-dark">following</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={async () => {
                if (isEditing) {
                  // save
                  try {
                    await updateProfile.mutateAsync({ bio: userProfile.bio, avatar_url: userProfile.profileImage });
                    toast.success('Profile updated');
                    setIsEditing(false);
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to update profile');
                  }
                } else {
                  setIsEditing(true);
                }
              }}
              className="flex items-center space-x-2 bg-white text-amber-900 px-4 py-2 rounded-lg font-medium hover:bg-amber-50 transition-colors border border-white/20"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ backgroundImage: `url(${profileBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* hidden file input for avatar upload */}
      <input type="file" accept="image/*" hidden ref={fileRef} onChange={handleFileChange} />
      <div className="max-w-6xl mx-auto p-4">
        <ProfileHeader />
        <ProfileDetailsComponent userProfile={userProfile} isEditing={isEditing} handleProfileUpdate={handleProfileUpdate} />
        <ContentTabsComponent activeTab={activeTab} setActiveTab={setActiveTab} stories={stories} comics={comics} />
        <SettingsPanelComponent showSettings={showSettings} setShowSettings={setShowSettings} />
      </div>
    </div>
  );
};

const ProfileDetailsComponent = ({ userProfile, isEditing, handleProfileUpdate }: any) => {
  if (!userProfile) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">About</h3>
          {isEditing ? (
            <textarea
              value={userProfile.bio ?? ''}
              onChange={(e) => handleProfileUpdate('bio', e.target.value)}
              className="w-full p-3 border border-amber-200 rounded-lg resize-none h-24 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50/50 text-brown-dark"
              placeholder="Tell your story..."
            />
          ) : (
            <p className="text-gray-600 leading-relaxed">{userProfile.bio}</p>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-amber-700 text-sm">Location:</span>
            {isEditing ? (
              <input
                value={userProfile.location ?? ''}
                onChange={(e) => handleProfileUpdate('location', e.target.value)}
                className="flex-1 p-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50/50 text-brown-dark"
              />
            ) : (
              <span className="text-gray-600">{userProfile.location}</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-amber-700 text-sm">Website:</span>
            {isEditing ? (
              <input
                value={userProfile.website ?? ''}
                onChange={(e) => handleProfileUpdate('website', e.target.value)}
                className="flex-1 p-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50/50 text-brown-dark"
              />
            ) : (
              <a href={`https://${userProfile.website}`} className="text-amber-700 hover:text-amber-900 font-medium">{userProfile.website}</a>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-amber-700 text-sm">Joined:</span>
            <span className="text-gray-600">{userProfile.joinDate}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Crown className="w-4 h-4 text-amber-600" />
            <span className="text-gray-600">{userProfile.subscription} Member</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentTabsComponent = ({ activeTab, setActiveTab, stories, comics }: any) => (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'stories'
                ? 'border-amber-600 text-amber-800 bg-white/60'
                : 'border-transparent text-amber-600 hover:text-amber-800 hover:bg-white/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Stories ({stories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('comics')}
            className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'comics'
                ? 'border-amber-600 text-amber-800 bg-white/60'
                : 'border-transparent text-amber-600 hover:text-amber-800 hover:bg-white/40'
            }`}
          >
            <Book className="w-4 h-4" />
            <span>Comics ({comics.length})</span>
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'stories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-amber-900">Published Stories</h3>
              <Link href="/talecraft" className="flex items-center space-x-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Story</span>
              </Link>
            </div>
            
            <div className="grid gap-6">
              {stories.map((story: any) => (
                <div key={story.id} className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 p-4 border border-amber-100 rounded-lg hover:shadow-md hover:bg-amber-50/30 transition-all">
                  <img 
                    src={story.image} 
                    alt={story.title}
                    className="w-full md:w-48 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-xl font-semibold text-amber-900 hover:text-amber-700 cursor-pointer">
                        {story.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        story.status === 'Published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {story.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{story.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-amber-600">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{story.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{story.comments}</span>
                        </span>
                        <span>{story.published}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-amber-500 hover:text-amber-700 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-amber-500 hover:text-amber-700 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-amber-500 hover:text-amber-700 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'comics' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-amber-900">Published Comics</h3>
              <Link href="/talecraft" className="flex items-center space-x-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors">
                <Plus className="w-4 h-4" />
                <span>New Comic</span>
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comics.map((comic: any) => (
                <div key={comic.id} className="bg-amber-50 rounded-lg p-4 hover:shadow-md hover:bg-amber-100/50 transition-all border border-amber-100">
                  <img 
                    src={comic.cover} 
                    alt={comic.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-lg font-semibold text-amber-900 mb-2">{comic.title}</h4>
                  <div className="flex items-center justify-between text-sm text-amber-600 mb-3">
                    <span className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{comic.likes}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{comic.views}</span>
                    </span>
                  </div>
                  <p className="text-sm text-amber-600">{comic.published}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

const SettingsPanelComponent = ({ showSettings, setShowSettings }: any) => {
    if (!showSettings) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50">
            <h2 className="text-2xl font-bold text-amber-900">Account Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-amber-600 hover:text-amber-800 transition-colors text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Subscription Section */}
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center space-x-2">
                <Crown className="w-5 h-5 text-amber-600" />
                <span>Subscription</span>
              </h3>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-amber-900">Premium Plan</h4>
                    <p className="text-amber-700">Unlimited stories, comics, and premium features</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-amber-900">$9.99</span>
                    <span className="text-amber-600">/month</span>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-amber-700 to-yellow-700 text-white py-3 rounded-lg font-medium hover:from-amber-800 hover:to-yellow-800 transition-all transform hover:scale-105 shadow-lg">
                  Upgrade to Pro ($19.99/month)
                </button>
              </div>
            </div>
            
            {/* Account Settings */}
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-amber-600" />
                <span>Account</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-amber-100">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-amber-900">Email</p>
                      <p className="text-sm text-amber-600">alex@example.com</p>
                    </div>
                  </div>
                  <button className="text-amber-700 hover:text-amber-900 font-medium">Change</button>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-amber-100">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-amber-900">Password</p>
                      <p className="text-sm text-amber-600">Last updated 3 months ago</p>
                    </div>
                  </div>
                  <button className="text-amber-700 hover:text-amber-900 font-medium">Change</button>
                </div>
              </div>
            </div>
            
            {/* Privacy Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy</span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Profile Visibility</p>
                    <p className="text-sm text-gray-500">Who can see your profile</p>
                  </div>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Public</option>
                    <option>Followers Only</option>
                    <option>Private</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Story Comments</p>
                    <p className="text-sm text-gray-500">Who can comment on your stories</p>
                  </div>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Everyone</option>
                    <option>Followers Only</option>
                    <option>Nobody</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Notifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Email notifications', desc: 'Receive updates via email' },
                  { label: 'Push notifications', desc: 'Browser notifications' },
                  { label: 'New followers', desc: 'When someone follows you' },
                  { label: 'Comments & likes', desc: 'When someone interacts with your content' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default UserProfile;