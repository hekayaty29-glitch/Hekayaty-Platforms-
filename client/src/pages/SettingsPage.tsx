import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [username, setUsername] = useState<string>(user?.username || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        username,
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Profile updated');
  };

  const handleUpgrade = () => navigate('/subscribe');

  const handleDelete = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    setLoading(true);
    const { error } = await supabase.functions.invoke('delete-user', { body: { userId: user?.id } });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Account deleted');
      supabase.auth.signOut();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-amber-900 py-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl ring-1 ring-amber-100 p-8 md:p-10 space-y-10">
        <h1 className="text-2xl font-bold text-amber-900">Account Settings</h1>

        <section className="space-y-4 border-t border-amber-100 pt-8 first:border-none first:pt-0">
          <h2 className="text-lg font-semibold text-amber-800">Profile</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <Button onClick={handleSave} disabled={loading} className="mt-4 w-full">
            Save Changes
          </Button>
        </section>

        <section className="space-y-4 border-t border-amber-100 pt-8 first:border-none first:pt-0">
          <h2 className="text-lg font-semibold text-amber-800">Subscription</h2>
          <p className="text-sm text-gray-600">Current plan: {(user as any)?.plan || 'Free'}</p>
          <Button onClick={handleUpgrade} variant="secondary" className="w-full">
            Upgrade Plan
          </Button>
        </section>

        <section className="space-y-4 border-t border-amber-100 pt-8 first:border-none first:pt-0">
          <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>
          <p className="text-sm text-gray-600">Delete your account and all associated data.</p>
          <Button onClick={handleDelete} variant="destructive" disabled={loading} className="w-full">
            Delete Account
          </Button>
        </section>
      </div>
    </div>
  );
}
