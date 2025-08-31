import React from 'react';
import { Users, MessageCircle, Calendar, Crown } from 'lucide-react';
import { Club } from '@/hooks/useClubs';

interface ClubCardProps {
  club: Club;
  onJoin: (clubId: string) => void;
  onEnter: (clubId: string) => void;
  isJoined: boolean;
  isCreator: boolean;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, onJoin, onEnter, isJoined, isCreator }) => {
  return (
    <div className="group bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-6 border border-green-500/20 hover:border-green-400/50 transition-all duration-300 hover:shadow-2xl hover:scale-105">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors flex items-center gap-2">
              {club.name}
              {isCreator && <Crown className="h-4 w-4 text-yellow-400" />}
            </h3>
            <p className="text-gray-400 text-sm">Created {new Date(club.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <p className="text-gray-300 mb-4 line-clamp-3 min-h-[4.5rem]">
        {club.description || 'No description provided'}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{club.members?.length || 0} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Active</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isJoined ? (
          <button
            onClick={() => onEnter(club.id)}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Enter Club
          </button>
        ) : (
          <button
            onClick={() => onJoin(club.id)}
            className="flex-1 py-3 bg-green-500/20 text-green-300 rounded-xl font-semibold hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 border border-green-500/30"
          >
            <Users className="h-4 w-4" />
            Join Club
          </button>
        )}
      </div>
    </div>
  );
};
