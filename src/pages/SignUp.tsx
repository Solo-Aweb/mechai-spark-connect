
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app/dashboard`,
        }
      });
      
      if (error) throw error;
      
      toast.success("Sign up successful! Please check your email to verify your account.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/app/dashboard`,
        }
      });
      
      if (error) throw error;
      
      setMagicLinkSent(true);
      toast.success("Magic link sent! Please check your email.");
    } catch (error: any) {
      toast.error(error.message || "An error occurred sending the magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create an account to continue</CardDescription>
        </CardHeader>
        <Tabs defaultValue="email-password">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email-password">Email & Password</TabsTrigger>
            <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
          </TabsList>
          <TabsContent value="email-password">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  className="w-full" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </Button>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <a 
                    href="/login" 
                    className="text-primary hover:underline"
                  >
                    Log in
                  </a>
                </div>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="magic-link">
            <form onSubmit={handleMagicLink}>
              <CardContent className="space-y-4 pt-4">
                {magicLinkSent ? (
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <Mail className="mx-auto h-8 w-8 mb-2 text-primary" />
                    <h3 className="text-lg font-medium">Check your email</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      We've sent a magic link to <strong>{email}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input 
                      id="magic-email" 
                      type="email" 
                      placeholder="Email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                )}
              </CardContent>
              {!magicLinkSent && (
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    className="w-full" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Magic Link"}
                  </Button>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <a 
                      href="/login" 
                      className="text-primary hover:underline"
                    >
                      Log in
                    </a>
                  </div>
                </CardFooter>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
