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
        console.log('Auth callback page loaded');
        console.log('Current URL:', window.location.href);
        console.log('URL params:', window.location.search);
        
        // Exchange PKCE code for session on first load (safe no-op if not present)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        console.log('PKCE code from URL:', code);
        
        // Wait a moment for Supabase to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the current session (Supabase should have processed the OAuth callback automatically)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session after OAuth:', { sessionData, sessionError });
        
        console.log('Session data:', sessionData);
        
        if (sessionData?.session?.user) {
          console.log('User found in session:', sessionData.session.user.id);
          
          // Check if user has a username set up in profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', sessionData.session.user.id)
            .single();

          console.log('Profile data:', profile);
          console.log('Profile error:', profileError);

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile check error:', profileError);
            navigate('/signin?error=profile_check_failed');
            return;
          }

          // If no profile exists or username is empty, go to setup
          if (!profile || !profile.username) {
            console.log('No profile found, redirecting to setup-username');
            // Add a small delay to ensure navigation works properly
            setTimeout(() => navigate('/setup-username'), 100);
          } else {
            console.log('Profile exists, redirecting to profile');
            // User has username, go to profile
            setTimeout(() => navigate('/profile'), 100);
          }
        } else {
          console.log('No session found, redirecting to setup-username for new user');
          // If no session but we have a code, this is likely a new user
          if (code) {
            setTimeout(() => navigate('/setup-username'), 100);
          } else {
            navigate('/signin?error=no_session');
          }
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
