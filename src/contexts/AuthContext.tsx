
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError, Session, WeakPassword } from "@supabase/supabase-js";
import { User as SupabaseUser } from "@supabase/supabase-js";

type User = {
  id: string;
  email: string;
  name: string;
  locality: string;
  isAdmin?: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, locality: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
    weakPassword?: WeakPassword | null;
  }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; locality?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setUser({
        id: userId,
        email: data.email,
        name: data.name || '',
        locality: data.locality || '',
        isAdmin: data.is_admin || false,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    locality: string
  ) => {
    try {
      setLoading(true);
      
      // First create the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            locality
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Now explicitly update the profiles table with the name and locality
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ 
            name, 
            locality,
            email // Make sure email is also set
          })
          .eq("id", data.user.id);

        if (profileError) throw profileError;
        
        toast.success("Account created successfully! Please verify your email.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign up");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Logged in successfully!");
      
      // Convert the Supabase user to our User type if available
      let appUser: User | null = null;
      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
          
        if (profileData) {
          appUser = {
            id: data.user.id,
            email: data.user.email || "",
            name: profileData.name || "",
            locality: profileData.locality || "",
            isAdmin: profileData.is_admin || false,
          };
        }
      }
      
      return {
        user: appUser,
        session: data.session,
        weakPassword: data.weakPassword
      };
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign in");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign out");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string; locality?: string }) => {
    try {
      setLoading(true);
      if (!user) throw new Error("No user logged in");

      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;

      // Update local user state
      setUser((prev) => (prev ? { ...prev, ...data } : null));
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "An error occurred updating your profile");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
