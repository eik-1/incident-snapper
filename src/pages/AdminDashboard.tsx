
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { getPendingIncidents, Incident } from "@/services/incidentService";
import IncidentCard from "@/components/IncidentCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingIncidents, setPendingIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingIncidents = async () => {
      try {
        setLoading(true);
        const incidents = await getPendingIncidents();
        setPendingIncidents(incidents);
      } catch (error) {
        toast.error("Failed to load pending incidents");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingIncidents();
  }, []);

  const handleStatusChange = (updatedIncident: Incident) => {
    setPendingIncidents(prev => 
      prev.filter(incident => incident.id !== updatedIncident.id)
    );
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Access Denied</CardTitle>
              <CardDescription className="text-center">
                You don't have permission to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <ShieldAlert className="h-8 w-8 text-incident-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Review and manage incident reports</p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review
              {pendingIncidents.length > 0 && (
                <span className="ml-2 bg-incident-100 text-incident-800 py-0.5 px-2 rounded-full text-xs">
                  {pendingIncidents.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : pendingIncidents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingIncidents.map((incident) => (
                  <IncidentCard 
                    key={incident.id} 
                    incident={incident} 
                    isAdmin={true}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-white">
                <CardContent className="text-center py-12">
                  <ShieldAlert className="h-12 w-12 text-incident-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No pending incidents</h3>
                  <p className="mt-2 text-gray-500">
                    All incidents have been reviewed. Check back later for new reports.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
