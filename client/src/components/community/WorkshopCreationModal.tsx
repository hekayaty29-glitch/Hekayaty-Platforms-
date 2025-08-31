import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAddWorkshop } from '@/hooks/useWorkshops';
import { useAuth } from '@/lib/auth';
import { PenTool, Sparkles, Calendar, Clock } from 'lucide-react';

interface WorkshopCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkshopCreationModal: React.FC<WorkshopCreationModalProps> = ({ open, onOpenChange }) => {
  const [workshopData, setWorkshopData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({ name: '', description: '' });
  const addWorkshop = useAddWorkshop();
  const { user } = useAuth();

  const validateForm = () => {
    const newErrors = { name: '', description: '' };
    
    if (!workshopData.name.trim()) {
      newErrors.name = 'Workshop name is required';
    } else if (workshopData.name.trim().length < 3) {
      newErrors.name = 'Workshop name must be at least 3 characters';
    } else if (workshopData.name.trim().length > 100) {
      newErrors.name = 'Workshop name must be less than 100 characters';
    }

    if (!workshopData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (workshopData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (workshopData.description.trim().length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.description;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user?.id) return;

    try {
      await addWorkshop.mutateAsync({
        name: workshopData.name.trim(),
        description: workshopData.description.trim(),
        hostId: user.id.toString()
      });
      
      // Reset form and close modal
      setWorkshopData({ name: '', description: '' });
      setErrors({ name: '', description: '' });
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        setErrors(prev => ({ ...prev, name: 'A workshop with this name already exists' }));
      } else {
        setErrors(prev => ({ ...prev, name: 'Failed to create workshop. Please try again.' }));
      }
    }
  };

  const handleClose = () => {
    setWorkshopData({ name: '', description: '' });
    setErrors({ name: '', description: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 border-2 border-purple-500/30 max-w-md mx-auto">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <PenTool className="h-6 w-6 text-purple-400" />
            Create Workshop
            <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
          </DialogTitle>
          <p className="text-gray-300 text-sm">Share knowledge through interactive sessions</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              Workshop Name
            </label>
            <Input
              placeholder="Enter workshop title..."
              value={workshopData.name}
              onChange={(e) => setWorkshopData(prev => ({ ...prev, name: e.target.value }))}
              className={`bg-purple-800/30 border-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 ${
                errors.name ? 'border-red-500' : 'border-purple-600 focus:border-purple-400'
              }`}
              maxLength={100}
            />
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
            <p className="text-xs text-gray-400">{workshopData.name.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              Description & Goals
            </label>
            <Textarea
              placeholder="Describe what participants will learn, activities planned, and workshop objectives..."
              value={workshopData.description}
              onChange={(e) => setWorkshopData(prev => ({ ...prev, description: e.target.value }))}
              className={`bg-purple-800/30 border-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 min-h-[120px] resize-none ${
                errors.description ? 'border-red-500' : 'border-purple-600 focus:border-purple-400'
              }`}
              maxLength={1000}
            />
            {errors.description && <p className="text-red-400 text-xs">{errors.description}</p>}
            <p className="text-xs text-gray-400">{workshopData.description.length}/1000 characters</p>
          </div>

          <div className="bg-purple-800/20 p-4 rounded-lg border border-purple-600/30">
            <h4 className="text-sm font-medium text-purple-300 mb-2">Workshop Features:</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Real-time chat with participants</li>
              <li>• Collaborative novel writing tools</li>
              <li>• Drawing and photo sharing</li>
              <li>• Automatic scheduling (starts immediately)</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-purple-600 text-purple-300 hover:bg-purple-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addWorkshop.isPending || !workshopData.name.trim() || !workshopData.description.trim()}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {addWorkshop.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Launch Workshop
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
