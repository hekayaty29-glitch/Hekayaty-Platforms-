import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useClub, useSendClubMessage, useJoinClub } from '@/hooks/useClubs';
import { useAuth } from '@/lib/auth';
import { 
  Users, 
  MessageCircle, 
  Send, 
  Crown, 
  Settings, 
  UserPlus,
  ArrowLeft,
  Hash,
  Smile,
  Image,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';

const ClubDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const clubId = id || '';
  const { data: club, isLoading } = useClub(clubId);
  const sendMessage = useSendClubMessage();
  const joinClub = useJoinClub();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('general');
  
  const currentUserId = user?.id ? String(user.id) : '';
  const isMember = club?.members?.includes(currentUserId) || false;
  const isCreator = club?.founder_id === currentUserId;
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isMember) return;
    
    try {
      await sendMessage.mutateAsync({
        clubId: clubId,
        userId: currentUserId,
        text: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleJoinClub = async () => {
    try {
      await joinClub.mutateAsync({ clubId: clubId, userId: currentUserId });
    } catch (error) {
      console.error('Failed to join club:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914] flex items-center justify-center">
        <div className="text-white text-xl">Loading club...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914] flex items-center justify-center">
        <div className="text-white text-xl">Club not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914]">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-b border-green-500/20 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/community?tab=clubs')}
              className="p-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {club.name}
                {isCreator && <Crown className="h-5 w-5 text-yellow-400" />}
              </h1>
              <p className="text-green-300 text-sm">{club.members?.length || 0} members</p>
            </div>
          </div>
          
          {!isMember && (
            <Button
              onClick={handleJoinClub}
              disabled={joinClub.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {joinClub.isPending ? 'Joining...' : 'Join Club'}
            </Button>
          )}
        </div>
      </div>

      {!isMember ? (
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-8 border border-green-500/20">
            <Users className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Join {club.name}</h2>
            <p className="text-gray-300 mb-6">{club.description}</p>
            <Button
              onClick={handleJoinClub}
              disabled={joinClub.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {joinClub.isPending ? 'Joining...' : 'Join Club'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Sidebar */}
            <div className="lg:col-span-1 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl p-4 border border-green-500/20">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                <p className="text-gray-300 text-sm">{club.description}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Channels</h3>
                <div className="space-y-2">
                  {['general', 'writing', 'feedback', 'resources'].map((channel) => (
                    <button
                      key={channel}
                      onClick={() => setActiveChannel(channel)}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-center gap-2 ${
                        activeChannel === channel
                          ? 'bg-green-500/20 text-green-300'
                          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <Hash className="h-4 w-4" />
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Members</h3>
                <div className="space-y-2">
                  {club.members?.slice(0, 10).map((memberId, index) => (
                    <div key={memberId} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-xs text-white">
                        {index + 1}
                      </div>
                      Member {index + 1}
                      {memberId === club.founder_id && <Crown className="h-3 w-3 text-yellow-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl border border-green-500/20 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-green-500/20">
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-green-400" />
                  <h2 className="text-xl font-semibold text-white">{activeChannel}</h2>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {club.messages?.map((message) => (
                    <div key={message.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-sm text-white">
                        U
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-green-300">User</span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-300">{message.text}</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-400 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-green-500/20">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message #${activeChannel}`}
                      className="bg-gray-800/50 border-gray-600 text-white pr-20"
                      disabled={sendMessage.isPending}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button type="button" className="p-1 text-gray-400 hover:text-white">
                        <Smile className="h-4 w-4" />
                      </button>
                      <button type="button" className="p-1 text-gray-400 hover:text-white">
                        <Image className="h-4 w-4" />
                      </button>
                      <button type="button" className="p-1 text-gray-400 hover:text-white">
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessage.isPending}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetailPage;
