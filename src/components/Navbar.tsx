import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMobile } from "@/hooks/useMobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-incident-600 mr-2" />
            <span className="font-bold text-xl text-gray-900">IncidentSnapper</span>
          </Link>

          {!isMobile ? (
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 hover:text-incident-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/report" 
                    className="text-gray-700 hover:text-incident-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Report Incident
                  </Link>
                  {user.isAdmin && (
                    <>
                      <Link 
                        to="/admin" 
                        className="text-gray-700 hover:text-incident-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Admin Dashboard
                      </Link>
                      <Link 
                        to="/users" 
                        className="text-gray-700 hover:text-incident-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        User Management
                      </Link>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-incident-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-incident-600 text-white hover:bg-incident-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          ) : (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="pt-0">
                <SheetHeader className="place-items-start px-4 py-8">
                  <SheetTitle className="text-lg font-semibold">
                    IncidentSnapper
                  </SheetTitle>
                  <SheetDescription>
                    Navigate through the app.
                  </SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col space-y-2 px-4">
                  {user ? (
                    <>
                      <Link
                        to="/dashboard"
                        className="block py-2 text-gray-700 hover:text-incident-600 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/report"
                        className="block py-2 text-gray-700 hover:text-incident-600 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Report Incident
                      </Link>
                      {user.isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            className="block py-2 text-gray-700 hover:text-incident-600 rounded-md"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                           <Link
                            to="/users"
                            className="block py-2 text-gray-700 hover:text-incident-600 rounded-md"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            User Management
                          </Link>
                        </>
                      )}
                      <Button variant="destructive" className="mt-4" onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}>
                        Log Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block py-2 text-gray-700 hover:text-incident-600 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="block py-2 bg-incident-600 text-white hover:bg-incident-700 rounded-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
