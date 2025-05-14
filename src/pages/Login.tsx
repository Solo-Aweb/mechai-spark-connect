
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Login successful!");
      navigate("/app/dashboard");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success("Check your email for a password reset link");
      setResetPassword(false);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            {resetPassword ? "Reset Password" : "Login"}
          </CardTitle>
          <CardDescription>
            {resetPassword 
              ? "Enter your email to receive a reset link" 
              : "Enter your credentials to sign in"
            }
          </CardDescription>
        </CardHeader>
        {resetPassword ? (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Input 
                  id="reset-email" 
                  type="email" 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                variant="link"
                type="button"
                className="w-full"
                onClick={() => setResetPassword(false)}
              >
                Back to Login
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
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
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              <div className="flex justify-between w-full text-sm">
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  type="button"
                  onClick={() => setResetPassword(true)}
                >
                  Forgot Password?
                </Button>
                <a 
                  href="/signup" 
                  className="text-primary hover:underline"
                >
                  Create an account
                </a>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
