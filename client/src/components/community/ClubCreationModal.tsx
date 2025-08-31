import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAddClub } from '@/hooks/useClubs';
import { useAuth } from '@/lib/auth';
import { Users, Sparkles, BookOpen } from 'lucide-react';

interface ClubCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClubCreationModal: React.FC<ClubCreationModalProps> = ({ open, onOpenChange }) => {
  const [clubData, setClubData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({ name: '', description: '' });
  const addClub = useAddClub();
  const { user } = useAuth();

  const validateForm = () => {
    const newErrors = { name: '', description: '' };
    
    if (!clubData.name.trim()) {
      newErrors.name = 'Club name is required';
    } else if (clubData.name.trim().length < 3) {
      newErrors.name = 'Club name must be at least 3 characters';
    } else if (clubData.name.trim().length > 50) {
      newErrors.name = 'Club name must be less than 50 characters';
    }

    if (!clubData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (clubData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (clubData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.description;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user?.id) return;

    try {
      await addClub.mutateAsync({
        name: clubData.name.trim(),
        description: clubData.description.trim(),
        founderId: user.id.toString()
      });
      
      // Reset form and close modal
      setClubData({ name: '', description: '' });
      setErrors({ name: '', description: '' });
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        setErrors(prev => ({ ...prev, name: 'A club with this name already exists' }));
      } else {
        setErrors(prev => ({ ...prev, name: 'Failed to create club. Please try again.' }));
      }
    }
  };

  const handleClose = () => {
    setClubData({ name: '', description: '' });
    setErrors({ name: '', description: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-green-500/30 max-w-md mx-auto">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6 text-green-400" />
            Create New Club
            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
          </DialogTitle>
          <p className="text-gray-300 text-sm">Build your creative community</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-400" />
              Club Name
            </label>
            <Input
              placeholder="Enter your club name..."
              value={clubData.name}
              onChange={(e) => setClubData(prev => ({ ...prev, name: e.target.value }))}
              className={`bg-gray-800/50 border-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 ${
                errors.name ? 'border-red-500' : 'border-gray-600 focus:border-green-500'
              }`}
              maxLength={50}
            />
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
            <p className="text-xs text-gray-400">{clubData.name.length}/50 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">
              Description
            </label>
            <Textarea
              placeholder="Describe your club's purpose, activities, and what makes it special..."
              value={clubData.description}
              onChange={(e) => setClubData(prev => ({ ...prev, description: e.target.value }))}
              className={`bg-gray-800/50 border-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 min-h-[100px] resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-600 focus:border-green-500'
              }`}
              maxLength={500}
            />
            {errors.description && <p className="text-red-400 text-xs">{errors.description}</p>}
            <p className="text-xs text-gray-400">{clubData.description.length}/500 characters</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addClub.isPending || !clubData.name.trim() || !clubData.description.trim()}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {addClub.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create Club
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
