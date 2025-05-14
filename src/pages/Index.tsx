
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };
    
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold mb-4">Welcome to MechAI</h1>
        <p className="text-xl text-gray-600 mb-8">
          A comprehensive platform for manufacturing management and CNC operations
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {loading ? (
            <p>Loading...</p>
          ) : user ? (
            <Button 
              onClick={() => navigate('/app/dashboard')}
              size="lg"
              className="px-8"
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => navigate('/signup')}
                size="lg"
                className="px-8"
              >
                Sign Up
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                size="lg"
                variant="outline"
                className="px-8"
              >
                Log In
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
