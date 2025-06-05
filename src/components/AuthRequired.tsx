
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthRequired({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session with proper error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session validation error:', error);
          navigate("/login", { replace: true });
          return;
        }
        
        if (!session) {
          navigate("/login", { replace: true });
          return;
        }

        // Additional session validation - check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          console.warn('Session expired, redirecting to login');
          await supabase.auth.signOut();
          navigate("/login", { replace: true });
          return;
        }

        setSessionValid(true);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Enhanced auth state change handler with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        
        if (event === "SIGNED_OUT" || !session) {
          setSessionValid(false);
          navigate("/login", { replace: true });
          return;
        }
        
        if (event === "TOKEN_REFRESHED") {
          console.log('Token refreshed successfully');
          setSessionValid(true);
          return;
        }
        
        if (event === "SIGNED_IN") {
          setSessionValid(true);
          return;
        }
        
        // For any other events, validate the session
        if (session) {
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            console.warn('Session expired during state change');
            await supabase.auth.signOut();
            setSessionValid(false);
            navigate("/login", { replace: true });
          } else {
            setSessionValid(true);
          }
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }
  
  if (!sessionValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
