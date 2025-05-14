
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      if (!session) {
        navigate("/login");
        return;
      }
      
      setUser(session.user);
    };
    
    getUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "An error occurred signing out");
    }
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to MechAI</CardTitle>
              <CardDescription>You are signed in as {user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Your dashboard content will appear here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
