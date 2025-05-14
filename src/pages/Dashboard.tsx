import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { Wrench, File, Package } from "lucide-react";

type CountStats = {
  machines: number;
  tools: number;
  materials: number;
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CountStats>({
    machines: 0,
    tools: 0,
    materials: 0,
  });

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getUser();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      // Get counts from each table
      const [machinesResponse, toolsResponse, materialsResponse] = await Promise.all([
        supabase.from("machines").select("id", { count: "exact", head: true }),
        supabase.from("tooling").select("id", { count: "exact", head: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        machines: machinesResponse.count || 0,
        tools: toolsResponse.count || 0,
        materials: materialsResponse.count || 0,
      });
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Machines</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.machines}</div>
              <p className="text-xs text-muted-foreground">Total machines</p>
            </CardContent>
            <CardFooter>
              <Link to="/app/machines">
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tooling</CardTitle>
              <File className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tools}</div>
              <p className="text-xs text-muted-foreground">Total tools</p>
            </CardContent>
            <CardFooter>
              <Link to="/app/tooling">
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materials</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.materials}</div>
              <p className="text-xs text-muted-foreground">Total materials</p>
            </CardContent>
            <CardFooter>
              <Link to="/app/materials">
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/app/machines">
              <Button className="w-full" variant="outline">
                <Wrench className="mr-2 h-4 w-4" />
                Manage Machines
              </Button>
            </Link>
            <Link to="/app/tooling">
              <Button className="w-full" variant="outline">
                <File className="mr-2 h-4 w-4" />
                Manage Tooling
              </Button>
            </Link>
            <Link to="/app/materials">
              <Button className="w-full" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Manage Materials
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
