
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { LayoutDashboard, Wrench, File, Package } from "lucide-react";

type NavLinkProps = {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
};

const NavLink = ({ to, label, icon, isActive }: NavLinkProps) => (
  <Link to={to}>
    <Button
      variant={isActive ? "default" : "ghost"}
      className="w-full justify-start"
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  </Link>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-background p-4 flex flex-col">
        <div className="text-xl font-bold mb-8">CNC Manager</div>
        
        <nav className="space-y-2 flex-1">
          <NavLink 
            to="/app/dashboard" 
            label="Dashboard"
            icon={<LayoutDashboard size={16} />}
            isActive={location.pathname === "/app/dashboard"}
          />
          <NavLink 
            to="/app/machines" 
            label="Machines"
            icon={<Wrench size={16} />}
            isActive={location.pathname === "/app/machines"}
          />
          <NavLink 
            to="/app/tooling" 
            label="Tooling"
            icon={<File size={16} />}
            isActive={location.pathname === "/app/tooling"}
          />
          <NavLink 
            to="/app/materials" 
            label="Materials"
            icon={<Package size={16} />}
            isActive={location.pathname === "/app/materials"}
          />
          <NavLink 
            to="/app/parts" 
            label="Parts"
            icon={<File size={16} />}
            isActive={location.pathname.startsWith("/app/parts")}
          />
        </nav>
        
        <div className="mt-auto pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
