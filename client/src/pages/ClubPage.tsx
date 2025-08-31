import React from 'react';
import { useRoute } from 'wouter';
import { useClub, useJoinClub, useSendClubMessage, useUpdateClubLogo } from '@/hooks/useClubs';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Crown, ImagePlus, Check, X } from 'lucide-react';

export default function ClubPage() {
  const [message, setMessage] = React.useState('');
  // Extract :id param from route
  const [, params] = useRoute<{ id: string }>('/clubs/:id');
  const idParam = params?.id ?? '';
  const { user } = useAuth();
  const numericId = Number(idParam);
  
  const { data: club, isLoading, error } = useClub(numericId);
  const joinClub = useJoinClub();
  const sendMessage = useSendClubMessage();
  const updateLogo = useUpdateClubLogo();

  if (isLoading) return <p className="p-8 text-white">Loading...</p>;
  if (error || !club) return <p className="p-8 text-white">Club not found.</p>;

  const currentUserId = user?.id?.toString() || '';
  const isMember = club.members.includes(currentUserId);
  const isFounder = club.founder_id === currentUserId;
  const canEditLogo = isFounder;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914] text-gray-200 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img src={club.logo_url || 'https://placehold.co/80x80?text=Club'} alt={club.name} className="w-16 h-16 rounded-full object-cover" />
            {canEditLogo && (
              <label className="absolute inset-0 bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <ImagePlus className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const { data: sessionData } = await supabase.auth.getSession();
                        const token = sessionData.session?.access_token;
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('folder', 'club-logos');

                        const resp = await fetch('/api/upload/file', {
                          method: 'POST',
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                          body: formData,
                        });
                        if (!resp.ok) throw new Error('Upload failed');
                        const json = await resp.json();
                        updateLogo.mutate({ clubId: numericId, url: json.url });
                      } catch (error) {
                        console.error('Club logo upload failed:', error);
                      }
                    }
                  }}
                />
              </label>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" /> {club.name}
            </h1>
            <p className="text-gray-400">Founded by {club.founder_id}</p>
          </div>
        </div>

        <p className="text-lg leading-relaxed">{club.description}</p>

        {!isMember && (
          <button
            onClick={() => joinClub.mutate({ clubId: numericId, userId: currentUserId })}
            className="px-6 py-2 rounded font-semibold bg-amber-600 hover:bg-amber-700 transition"
            disabled={joinClub.isPending}
          >
            {joinClub.isPending ? 'Joining...' : 'Join Club'}
          </button>
        )}
        {isMember && (
          <div className="px-6 py-2 rounded font-semibold bg-green-600 cursor-default">
            Member
          </div>
        )}

        <section className="bg-black/20 p-6 rounded-xl border border-white/10">
          <h2 className="text-2xl font-bold mb-4">Club Members ({club.members.length})</h2>
          <ul className="space-y-1 list-disc list-inside">
            {club.members.map((memberId) => (
              <li key={memberId}>{memberId}</li>
            ))}
          </ul>
        </section>


        <section className="bg-black/20 p-6 rounded-xl border border-white/10 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Club Chat</h2>
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
            {club.messages.length === 0 && <p className="italic text-gray-400">No messages yet.</p>}
            {club.messages.map((m) => (
              <div key={m.id} className="bg-white/5 p-3 rounded-lg">
                <div className="text-sm text-amber-400 font-semibold">{m.user_id}</div>
                <div>{m.text}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
          {isMember && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim()) {
                  sendMessage.mutate({ clubId: numericId, userId: currentUserId, text: message.trim() });
                  setMessage('');
                }
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={message}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                Send
              </Button>
            </form>
          )}
          {!isMember && (
            <p className="text-gray-400 italic">You must be a member to send messages.</p>
          )}
        </section>
      </div>
    </div>
  );
}
