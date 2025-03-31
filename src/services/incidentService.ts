
import { supabase } from "@/integrations/supabase/client";

export type Incident = {
  id: string;
  title: string;
  description: string;
  location: string;
  locality: string;
  image_url: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  user_id: string;
  user_name: string;
};

export const reportIncident = async (
  title: string,
  description: string,
  location: string,
  locality: string,
  imageFile: File,
  userId: string,
  userName: string
) => {
  try {
    // Make sure userName isn't empty
    if (!userName || userName.trim() === "") {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .single();
      
      if (!userError && userData) {
        userName = userData.name || "Anonymous User";
      } else {
        userName = "Anonymous User";
      }
    }

    // 1. Upload image to storage
    const fileName = `${userId}_${Date.now()}_${imageFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("incident-images")
      .upload(fileName, imageFile);

    if (uploadError) throw uploadError;

    // 2. Get the public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from("incident-images")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // 3. Insert incident record - ensure userName is included
    const { data, error } = await supabase.from("incidents").insert([
      {
        title,
        description,
        location,
        locality,
        image_url: imageUrl,
        status: "pending",
        user_id: userId,
        user_name: userName,
      },
    ]).select();

    if (error) throw error;

    console.log(`Notification would be sent to users in ${locality}`);

    return data[0];
  } catch (error) {
    console.error("Error reporting incident:", error);
    throw error;
  }
};

export const getUserIncidents = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Incident[];
  } catch (error) {
    console.error("Error fetching user incidents:", error);
    throw error;
  }
};

export const getLocalityIncidents = async (locality: string) => {
  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("locality", locality)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Incident[];
  } catch (error) {
    console.error("Error fetching locality incidents:", error);
    throw error;
  }
};

export const getPendingIncidents = async () => {
  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Incident[];
  } catch (error) {
    console.error("Error fetching pending incidents:", error);
    throw error;
  }
};

export const updateIncidentStatus = async (
  incidentId: string,
  status: "approved" | "rejected"
) => {
  try {
    const { data, error } = await supabase
      .from("incidents")
      .update({ status })
      .eq("id", incidentId)
      .select();

    if (error) throw error;

    // If approved, send email notifications to users in the same locality
    if (status === "approved") {
      try {
        const { error: notifyError } = await supabase.functions.invoke("notify-locality", {
          body: { incidentId: data[0].id }
        });
        
        if (notifyError) {
          console.error("Error sending notifications:", notifyError);
        }
      } catch (notifyError) {
        console.error("Failed to call notify-locality function:", notifyError);
      }
    }

    return data[0] as Incident;
  } catch (error) {
    console.error("Error updating incident status:", error);
    throw error;
  }
};

// New function to set a user as admin
export const setUserAsAdmin = async (userId: string, isAdmin: boolean) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", userId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Error updating user admin status:", error);
    throw error;
  }
};

// New function to get all users
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};
