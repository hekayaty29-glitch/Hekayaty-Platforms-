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
        
        let sessionData;
        if (code) {
          console.log('Exchanging code for session...');
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          console.log('Code exchange result:', { exchangeData, exchangeError });
          if (exchangeError) {
            console.error('Code exchange failed:', exchangeError);
            navigate('/signin?error=code_exchange_failed');
            return;
          }
          sessionData = exchangeData;
        } else {
          // Handle the OAuth callback
          const { data, error } = await supabase.auth.getSession();
          sessionData = data;
        }
        
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
          console.log('No session found, redirecting to signin');
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
