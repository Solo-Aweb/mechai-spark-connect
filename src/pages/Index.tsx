
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ArrowRight, Code, LineChart, Settings } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Settings className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold">MechAI</span>
        </div>
        
        {loading ? (
          <div className="animate-pulse h-10 w-32 bg-gray-700 rounded-md"></div>
        ) : user ? (
          <Button 
            onClick={() => navigate('/app/dashboard')}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/login')}
              variant="outline"
              size="lg"
              className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Sign Up
            </Button>
          </div>
        )}
      </nav>
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Intelligent Manufacturing Assistant
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                MechAI simplifies CNC operations, optimizes production workflows, and helps you make data-driven decisions to improve manufacturing efficiency.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-6 pt-4">
              {!loading && !user && (
                <>
                  <Button 
                    onClick={() => navigate('/signup')}
                    size="lg"
                    className="px-8 text-lg bg-blue-500 hover:bg-blue-600"
                  >
                    Get Started for Free
                  </Button>
                  <Button 
                    onClick={() => navigate('/login')}
                    size="lg"
                    variant="outline"
                    className="px-8 text-lg border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Learn More
                  </Button>
                </>
              )}
              {!loading && user && (
                <Button 
                  onClick={() => navigate('/app/dashboard')}
                  size="lg"
                  className="px-8 text-lg bg-blue-500 hover:bg-blue-600"
                >
                  Continue to Dashboard
                </Button>
              )}
            </div>
          </div>
          
          <div className="rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-500/30 transform lg:translate-y-0 translate-y-8">
            <AspectRatio ratio={16/9}>
              <div className="bg-gray-800 h-full w-full flex items-center justify-center p-8">
                <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-4xl font-bold text-blue-500 flex items-center gap-3">
                    <Code className="h-10 w-10" />
                    <span>MechAI</span>
                  </div>
                </div>
              </div>
            </AspectRatio>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 backdrop-blur-sm hover:border-blue-500/30 transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
              <Settings className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Optimized Workflows</h3>
            <p className="text-gray-400">Automate your manufacturing processes with AI-powered optimization that increases efficiency by up to 35%.</p>
          </div>
          
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 backdrop-blur-sm hover:border-blue-500/30 transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <Code className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">CNC Integration</h3>
            <p className="text-gray-400">Seamlessly connect with your CNC machines for better control and real-time monitoring of your operations.</p>
          </div>
          
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 backdrop-blur-sm hover:border-blue-500/30 transition-all hover:-translate-y-1">
            <div className="h-14 w-14 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
              <LineChart className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Smart Analytics</h3>
            <p className="text-gray-400">Track performance metrics and identify optimization opportunities with powerful real-time analytics.</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Settings className="h-5 w-5 text-blue-400" />
            <span className="font-bold">MechAI</span>
          </div>
          <div className="text-gray-500 text-sm">
            © 2025 MechAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
