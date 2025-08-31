import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useWorkshop, useSendWorkshopMessage, useUpdateWorkshopDraft, useRenameWorkshop, useUpdateWorkshopCover } from '@/hooks/useWorkshops';
import { useRequestJoinWorkshop, useApproveWorkshopMember, useRejectWorkshopMember, useWorkshopMembers, usePendingWorkshopMembers } from '@/hooks/useWorkshopMembership';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Crown, Edit3, ImagePlus, Image as ImageIcon, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WorkshopPage() {
  const [, params] = useRoute('/workshops/:id');
  const id = params ? Number(params.id) : 0;

  const { user } = useAuth();
  const { data: workshop, isLoading, isError } = useWorkshop(id);
  const requestJoinWorkshop = useRequestJoinWorkshop();
  const approveMember = useApproveWorkshopMember();
  const rejectMember = useRejectWorkshopMember();
  const sendWorkshopMessage = useSendWorkshopMessage();
  const updateWorkshopDraft = useUpdateWorkshopDraft();
  const renameWorkshop = useRenameWorkshop();
  const updateWorkshopCover = useUpdateWorkshopCover();
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [localDraft, setLocalDraft] = useState(workshop?.draft ?? '');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(workshop?.name ?? '');

  if (isLoading) return <p className="p-8 text-white">Loading...</p>;
  if (isError || !workshop) return <p className="p-8 text-white">Workshop not found.</p>;

  const currentUserId = user?.id?.toString() || '';
  const { data: members = [] } = useWorkshopMembers(id);
  const { data: pending = [] } = usePendingWorkshopMembers(id);
  const joined = members.includes(currentUserId);
  const isPending = pending.includes(currentUserId);
  const isHost = workshop.host_id === currentUserId;
  const isAdmin = false;
  const canEditIdea = isHost || isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914] text-gray-200 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* header */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img src={workshop.cover_url ?? ''} alt={workshop.name} className="w-20 h-20 rounded-lg object-cover" />
            {canEditIdea && (
              <label className="absolute inset-0 bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                <ImagePlus className="w-6 h-6" />
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
                        formData.append('folder', 'workshop-covers');

                        const resp = await fetch('/api/upload/file', {
                          method: 'POST',
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                          body: formData,
                        });
                        if (!resp.ok) throw new Error('Upload failed');
                        const json = await resp.json();
                        updateWorkshopCover.mutate({ workshopId: id, url: json.url });
                      } catch (error) {
                        console.error('Workshop cover upload failed:', error);
                      }
                    }
                  }}
                />
              </label>
            )}
          </div>
          <div className="flex-1">
            {editingName ? (
              <div className="flex gap-2 items-center">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
                <Button
                  onClick={() => {
                    renameWorkshop.mutate({ workshopId: id, name: newName.trim() || workshop.name });
                    setEditingName(false);
                  }}
                >
                  Save
                </Button>
              </div>
            ) : (
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {workshop.name}
                {isHost && (
                  <Edit3
                    className="w-5 h-5 cursor-pointer hover:text-amber-400"
                    onClick={() => {
                      setNewName(workshop.name);
                      setEditingName(true);
                    }}
                  />
                )}
              </h1>
            )}
            <p className="text-gray-400">Hosted by {workshop.host_id}</p>
          </div>
          {!joined && !isPending && (
            <Button onClick={() => user && requestJoinWorkshop.mutate({ workshopId: id, userId: user.id.toString() })} className="bg-amber-600 hover:bg-amber-700">
              Request to Join
            </Button>
          )}
          {isPending && <Button disabled className="bg-yellow-700 cursor-default">Pending</Button>}
          {joined && <Button disabled className="bg-green-600 cursor-default">Member</Button>}
        </div>

        {/* Pending Requests for Host */}
        {isHost && pending.length > 0 && (
          <section className="bg-black/20 p-6 rounded-xl border border-yellow-400/30">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">Pending Requests ({pending.length})</h2>
            <div className="space-y-2">
              {pending.map((u) => (
                <div key={u} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <span className="text-white">{u}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => approveMember.mutate({ workshopId: id, userId: u })} className="bg-green-600 hover:bg-green-700 px-3 py-1 flex gap-1 items-center">
                      <Check className="w-4 h-4" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => rejectMember.mutate({ workshopId: id, userId: u })} className="bg-red-600 hover:bg-red-700 px-3 py-1 flex gap-1 items-center">
                      <X className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Draft editor */}
        <section className="bg-black/20 p-6 rounded-xl border border-white/10 flex flex-col gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" /> Main Novel Idea
          </h2>
          <textarea
            value={localDraft}
            onChange={(e) => canEditIdea && setLocalDraft(e.target.value)}
            onBlur={() => canEditIdea && updateWorkshopDraft.mutate({ workshopId: id, draft: localDraft })}
            className="w-full min-h-[200px] bg-white/5 p-3 rounded-lg focus:outline-none disabled:opacity-60"
            placeholder="Describe the core idea or synopsis here..."
            disabled={!canEditIdea}
          />
          <p className="text-xs text-gray-400">{canEditIdea ? 'Share and refine the central concept for this workshop\'s novel.' : 'Only the workshop host or site admin can modify this section.'}</p>
        </section>

        {/* Chat */}
        <section className="bg-black/20 p-6 rounded-xl border border-white/10 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Workshop Chat</h2>
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
            {workshop.messages.length === 0 && <p className="italic text-gray-400">No messages yet.</p>}
            {workshop.messages.map((m) => (
              <div key={m.id} className="bg-white/5 p-3 rounded-lg">
                <div className="text-sm text-amber-400 font-semibold">{m.user_id}</div>
                {m.text && <div>{m.text}</div>}
                {m.image_url && <img src={m.image_url} alt="uploaded" className="max-w-xs rounded mt-2" />}
                <div className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (message.trim() && user) {
                sendWorkshopMessage.mutate({ workshopId: id, userId: user.id.toString(), text: message.trim() });
                setMessage('');
              }
            }}
            className="flex items-center gap-2"
          >
            <label className="cursor-pointer text-amber-300 hover:text-amber-400">
              <ImageIcon className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  setUploading(true);
                  try {
                    const { data: sessionData } = await supabase.auth.getSession();
                    const token = sessionData.session?.access_token;
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('folder', 'workshop-chat');

                    const resp = await fetch('/api/upload/file', {
                      method: 'POST',
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                      body: formData,
                    });
                    if (!resp.ok) throw new Error('Upload failed');
                    const json = await resp.json();
                    sendWorkshopMessage.mutate({ workshopId: id, userId: user.id.toString(), text: '', imageUrl: json.url });
                  } catch (error) {
                    console.error('Workshop image upload failed:', error);
                  }
                  setUploading(false);
                }}
              />
            </label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1" disabled={uploading} />
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={uploading || !message.trim()}>
              {uploading ? 'Uploading...' : 'Send'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
