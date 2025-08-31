import React from 'react';
import { PenTool, Users, MessageCircle, Calendar, Clock, Crown, Palette, FileText } from 'lucide-react';
import { Workshop } from '@/hooks/useWorkshops';

interface WorkshopCardProps {
  workshop: Workshop;
  onJoin: (workshopId: string) => void;
  onEnter: (workshopId: string) => void;
  isJoined: boolean;
  isInstructor: boolean;
}

export const WorkshopCard: React.FC<WorkshopCardProps> = ({ workshop, onJoin, onEnter, isJoined, isInstructor }) => {
  return (
    <div className="group bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <PenTool className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-2">
              {workshop.name}
              {isInstructor && <Crown className="h-4 w-4 text-yellow-400" />}
            </h3>
            <p className="text-gray-400 text-sm">Created {new Date(workshop.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
          Live
        </div>
      </div>

      <p className="text-gray-300 mb-4 line-clamp-3 min-h-[4.5rem]">
        {workshop.description || 'No description provided'}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{workshop.members?.length || 0} participants</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Active</span>
          </div>
        </div>
      </div>

      <div className="mb-4 p-3 bg-purple-800/20 rounded-lg border border-purple-600/30">
        <div className="flex items-center gap-4 text-xs text-purple-300">
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>Chat</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>Writing</span>
          </div>
          <div className="flex items-center gap-1">
            <Palette className="h-3 w-3" />
            <span>Drawing</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isJoined ? (
          <button
            onClick={() => onEnter(workshop.id)}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
          >
            <PenTool className="h-4 w-4" />
            Enter Workshop
          </button>
        ) : (
          <button
            onClick={() => onJoin(workshop.id)}
            className="flex-1 py-3 bg-purple-500/20 text-purple-300 rounded-xl font-semibold hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2 border border-purple-500/30"
          >
            <Users className="h-4 w-4" />
            Join Workshop
          </button>
        )}
      </div>
    </div>
  );
};
