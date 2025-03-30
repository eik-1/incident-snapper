
import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
const supabase = createClient(
  "https://your-supabase-url.supabase.co",
  "your-anon-key"
);

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

    // 3. Insert incident record
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

    // 4. Notify users in the same locality (this would be handled by a Supabase Edge Function)
    // For demonstration, we'll just log this
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

    // If approved, send email notifications (would be handled by Supabase Edge Function)
    if (status === "approved") {
      console.log(`Notifications would be sent for incident ${incidentId}`);
    }

    return data[0] as Incident;
  } catch (error) {
    console.error("Error updating incident status:", error);
    throw error;
  }
};
