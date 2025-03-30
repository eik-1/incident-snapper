
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { getAllUsers, setUserAsAdmin } from "@/services/incidentService";
import { toast } from "sonner";
import { Users, Shield, ShieldAlert } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type Profile = {
  id: string;
  email: string;
  name: string;
  locality: string;
  is_admin: boolean;
  created_at: string;
};

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data as Profile[]);
      } catch (error) {
        toast.error("Failed to load users");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await setUserAsAdmin(userId, !currentStatus);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, is_admin: !currentStatus } : user
        )
      );
      toast.success(`User ${currentStatus ? 'removed from' : 'added to'} admin role`);
    } catch (error) {
      toast.error("Failed to update user role");
      console.error(error);
    }
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
          <Users className="h-8 w-8 text-primary mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>
              Toggle admin status for users. Admins can review and approve incidents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Locality</TableHead>
                      <TableHead>Admin Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.name || "No name set"}
                        </TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>{profile.locality || "Not set"}</TableCell>
                        <TableCell>
                          {profile.is_admin ? (
                            <div className="flex items-center">
                              <ShieldAlert className="h-4 w-4 text-green-600 mr-1" />
                              <span className="text-green-600">Admin</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 text-gray-500 mr-1" />
                              <span className="text-gray-500">User</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={profile.is_admin}
                            onCheckedChange={() => handleToggleAdmin(profile.id, profile.is_admin)}
                            disabled={profile.id === user?.id}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
