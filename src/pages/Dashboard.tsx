
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { getUserIncidents, getLocalityIncidents, Incident } from "@/services/incidentService";
import IncidentCard from "@/components/IncidentCard";
import { Bell, Plus } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [localityIncidents, setLocalityIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        if (user) {
          const [myIncidents, localIncidents] = await Promise.all([
            getUserIncidents(user.id),
            getLocalityIncidents(user.locality)
          ]);
          
          setUserIncidents(myIncidents);
          setLocalityIncidents(localIncidents);
        }
      } catch (error) {
        toast.error("Failed to load incidents");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
          </div>
          <Link to="/report">
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="locality" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="locality">Community Incidents</TabsTrigger>
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="locality">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : localityIncidents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localityIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <Bell className="h-12 w-12 text-incident-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No incidents reported</h3>
                <p className="mt-2 text-gray-500">
                  There are no approved incidents in your locality yet.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-reports">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : userIncidents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <Bell className="h-12 w-12 text-incident-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No reports yet</h3>
                <p className="mt-2 text-gray-500">
                  You haven't reported any incidents yet.
                </p>
                <Link to="/report">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Report Incident
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
