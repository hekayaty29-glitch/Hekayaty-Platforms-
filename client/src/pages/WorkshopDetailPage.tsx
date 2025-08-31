import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useWorkshop, useSendWorkshopMessage, useJoinWorkshop, useUpdateWorkshopDraft } from '@/hooks/useWorkshops';
import { useAuth } from '@/lib/auth';
import { 
  PenTool, 
  Users, 
  MessageCircle, 
  Send, 
  Crown, 
  ArrowLeft,
  FileText,
  Palette,
  Save,
  Download,
  Upload,
  Smile,
  Image as ImageIcon,
  Mic,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';

const WorkshopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const workshopId = id || '';
  const { data: workshop, isLoading } = useWorkshop(workshopId);
  const sendMessage = useSendWorkshopMessage();
  const joinWorkshop = useJoinWorkshop();
  const updateDraft = useUpdateWorkshopDraft();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'writing' | 'drawing'>('chat');
  const [novelDraft, setNovelDraft] = useState('');
  const [drawingCanvas, setDrawingCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const currentUserId = user?.id?.toString() || '';
  const isMember = workshop?.members?.includes(currentUserId) || false;
  const isInstructor = workshop?.host_id === currentUserId;
  
  useEffect(() => {
    if (workshop?.draft) {
      setNovelDraft(workshop.draft);
    }
  }, [workshop?.draft]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isMember) return;
    
    try {
      await sendMessage.mutateAsync({
        workshopId: workshopId,
        userId: currentUserId,
        text: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleJoinWorkshop = async () => {
    try {
      await joinWorkshop.mutateAsync({ workshopId: workshopId, userId: currentUserId });
    } catch (error) {
      console.error('Failed to join workshop:', error);
    }
  };

  const handleSaveDraft = async () => {
    if (!isInstructor) return;
    
    try {
      await updateDraft.mutateAsync({
        workshopId: workshopId,
        draft: novelDraft
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const initializeCanvas = (canvas: HTMLCanvasElement) => {
    setDrawingCanvas(canvas);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingCanvas) return;
    setIsDrawing(true);
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = drawingCanvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingCanvas) return;
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = drawingCanvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!drawingCanvas) return;
    const ctx = drawingCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914] flex items-center justify-center">
        <div className="text-white text-xl">Loading workshop...</div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914] flex items-center justify-center">
        <div className="text-white text-xl">Workshop not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A150E] via-[#2B2115] to-[#3D2914]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-purple-500/20 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/community?tab=workshops')}
              className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <PenTool className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {workshop.name}
                {isInstructor && <Crown className="h-5 w-5 text-yellow-400" />}
              </h1>
              <p className="text-purple-300 text-sm">{workshop.members?.length || 0} participants</p>
            </div>
          </div>
          
          {!isMember && (
            <Button
              onClick={handleJoinWorkshop}
              disabled={joinWorkshop.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Users className="h-4 w-4 mr-2" />
              {joinWorkshop.isPending ? 'Joining...' : 'Join Workshop'}
            </Button>
          )}
        </div>
      </div>

      {!isMember ? (
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-8 border border-purple-500/20">
            <PenTool className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Join {workshop.name}</h2>
            <p className="text-gray-300 mb-6">{workshop.description}</p>
            <Button
              onClick={handleJoinWorkshop}
              disabled={joinWorkshop.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Users className="h-4 w-4 mr-2" />
              {joinWorkshop.isPending ? 'Joining...' : 'Join Workshop'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'chat', label: 'Chat', icon: MessageCircle },
              { id: 'writing', label: 'Novel Writing', icon: FileText },
              { id: 'drawing', label: 'Drawing', icon: Palette }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
            {/* Sidebar */}
            <div className="lg:col-span-1 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl p-4 border border-purple-500/20">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                <p className="text-gray-300 text-sm">{workshop.description}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Participants</h3>
                <div className="space-y-2">
                  {workshop.members?.slice(0, 10).map((memberId, index) => (
                    <div key={memberId} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-xs text-white">
                        {index + 1}
                      </div>
                      Participant {index + 1}
                      {memberId === workshop.host_id && <Crown className="h-3 w-3 text-yellow-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-2xl border border-purple-500/20 flex flex-col">
              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <>
                  <div className="p-4 border-b border-purple-500/20">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-purple-400" />
                      Workshop Chat
                    </h2>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {workshop.messages?.map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-sm text-white">
                            U
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-purple-300">User</span>
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

                  <div className="p-4 border-t border-purple-500/20">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Message the workshop..."
                          className="bg-gray-800/50 border-gray-600 text-white pr-20"
                          disabled={sendMessage.isPending}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                          <button type="button" className="p-1 text-gray-400 hover:text-white">
                            <Smile className="h-4 w-4" />
                          </button>
                          <button type="button" className="p-1 text-gray-400 hover:text-white">
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendMessage.isPending}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              )}

              {/* Writing Tab */}
              {activeTab === 'writing' && (
                <>
                  <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-400" />
                      Collaborative Novel
                    </h2>
                    {isInstructor && (
                      <Button
                        onClick={handleSaveDraft}
                        disabled={updateDraft.isPending}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateDraft.isPending ? 'Saving...' : 'Save Draft'}
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <Textarea
                      value={novelDraft}
                      onChange={(e) => setNovelDraft(e.target.value)}
                      placeholder="Start writing your collaborative novel here..."
                      className="w-full h-full bg-gray-800/50 border-gray-600 text-white resize-none"
                      disabled={!isInstructor}
                    />
                  </div>

                  <div className="p-4 border-t border-purple-500/20">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Words: {novelDraft.split(/\s+/).filter(Boolean).length}</span>
                      <span>Characters: {novelDraft.length}</span>
                      {isInstructor && <span className="text-green-400">✓ Instructor Mode</span>}
                    </div>
                  </div>
                </>
              )}

              {/* Drawing Tab */}
              {activeTab === 'drawing' && (
                <>
                  <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-400" />
                      Drawing Canvas
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        onClick={clearCanvas}
                        variant="outline"
                        className="border-purple-600 text-purple-300 hover:bg-purple-700"
                      >
                        Clear
                      </Button>
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                        <Upload className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 p-4 flex items-center justify-center">
                    <canvas
                      ref={initializeCanvas}
                      width={600}
                      height={400}
                      className="border-2 border-purple-500/30 rounded-lg bg-white cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>

                  <div className="p-4 border-t border-purple-500/20">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Click and drag to draw</span>
                      <span>•</span>
                      <span>Share your artwork with the workshop</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopDetailPage;
