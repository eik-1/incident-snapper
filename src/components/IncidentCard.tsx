import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Incident, updateIncidentStatus } from "@/services/incidentService";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

type IncidentCardProps = {
  incident: Incident;
  isAdmin?: boolean;
  onStatusChange?: (incident: Incident) => void;
};

const IncidentCard = ({ incident, isAdmin, onStatusChange }: IncidentCardProps) => {
  const handleApprove = async () => {
    try {
      toast.loading("Approving incident...");
      const updatedIncident = await updateIncidentStatus(incident.id, "approved");
      toast.dismiss();
      toast.success("Incident approved successfully");
      onStatusChange?.(updatedIncident);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to approve incident");
      console.error("Error approving incident:", error);
    }
  };

  const handleReject = async () => {
    try {
      toast.loading("Rejecting incident...");
      const updatedIncident = await updateIncidentStatus(incident.id, "rejected");
      toast.dismiss();
      toast.success("Incident rejected");
      onStatusChange?.(updatedIncident);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to reject incident");
      console.error("Error rejecting incident:", error);
    }
  };

  const getStatusBadge = () => {
    switch (incident.status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative h-48 w-full">
        <img 
          src={incident.image_url || "/placeholder.svg"} 
          alt={incident.title} 
          className="h-full w-full object-cover"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{incident.title}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="flex items-center mt-1">
          <MapPin className="h-4 w-4 mr-1 text-gray-500" />
          {incident.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-gray-600">{incident.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start pt-2 border-t">
        <div className="flex justify-between w-full text-xs text-gray-500">
          <span>Reported by {incident.user_name}</span>
          <span>{formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</span>
        </div>
        
        {isAdmin && incident.status === "pending" && (
          <div className="flex space-x-2 mt-4 w-full">
            <Button 
              onClick={handleApprove} 
              size="sm" 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
            <Button 
              onClick={handleReject} 
              variant="outline" 
              size="sm" 
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              Reject
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default IncidentCard;
