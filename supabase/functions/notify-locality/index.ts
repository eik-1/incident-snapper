
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@2.0.0";

// Get environment variables
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Log environment variable status (for debugging)
console.log("RESEND_API_KEY exists:", !!resendApiKey);
console.log("RESEND_API_KEY value:", resendApiKey?.substring(0, 5) + "...");
console.log("SUPABASE_URL exists:", !!supabaseUrl);
console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseServiceKey);

// Initialize clients
if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is required");
}

const resend = new Resend(resendApiKey);
const supabase = createClient(supabaseUrl as string, supabaseServiceKey as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  incidentId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { incidentId } = await req.json() as NotifyRequest;
    
    console.log("Received request to notify for incident:", incidentId);
    
    // Fetch the approved incident
    const { data: incident, error: incidentError } = await supabase
      .from("incidents")
      .select("*")
      .eq("id", incidentId)
      .eq("status", "approved")
      .single();
    
    if (incidentError || !incident) {
      console.error("Error fetching incident:", incidentError);
      return new Response(
        JSON.stringify({ error: "Incident not found or not approved" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log("Found incident:", incident.title, "in locality:", incident.locality);

    // Fetch users in the same locality
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("locality", incident.locality);
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({ error: "Error fetching users in locality" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log(`Found ${users?.length || 0} users in locality ${incident.locality}`);

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found in locality" }),
        { 
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Send email to each user in the locality
    const emailPromises = users.map(user => {
      console.log(`Sending email to ${user.email}`);
      return resend.emails.send({
        from: "Incident Snapper <onboarding@resend.dev>",
        to: user.email,
        subject: `Alert: New Incident in ${incident.locality}`,
        html: `
          <h1>New Incident Reported in ${incident.locality}</h1>
          <p>Hello ${user.name || "there"},</p>
          <p>A new incident has been reported and verified in your area:</p>
          <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h2>${incident.title}</h2>
            <p><strong>Location:</strong> ${incident.location}</p>
            <p><strong>Description:</strong> ${incident.description}</p>
            ${incident.image_url ? `<img src="${incident.image_url}" alt="Incident Image" style="max-width: 100%; height: auto; margin-top: 10px;">` : ''}
          </div>
          <p>Please stay alert and take necessary precautions.</p>
          <p>Regards,<br>Incident Snapper Team</p>
        `,
      });
    });

    try {
      const results = await Promise.all(emailPromises);
      console.log(`Successfully sent notifications to ${emailPromises.length} users in ${incident.locality}`);
      console.log("Email send results:", results);
    } catch (emailError) {
      console.error("Error sending emails:", emailError);
      return new Response(
        JSON.stringify({ error: "Error sending email notifications", details: emailError.message }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${emailPromises.length} users in ${incident.locality}` 
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("Error in notify-locality function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
