import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/signin?error=auth_failed');
          return;
        }

        if (data.session?.user) {
          // Check if user has a username set up in profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', data.session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile check error:', profileError);
            navigate('/signin?error=profile_check_failed');
            return;
          }

          // If no profile exists or username is empty, go to setup
          if (!profile || !profile.username) {
            navigate('/setup-username');
          } else {
            // User has username, go to profile
            navigate('/profile');
          }
        } else {
          navigate('/signin?error=no_session');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/signin?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <p className="text-amber-800 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
