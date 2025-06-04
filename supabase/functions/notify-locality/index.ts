
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@2.0.0";

// Get environment variables
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Log environment variable status (for debugging)
console.log("RESEND_API_KEY exists:", !!resendApiKey);
console.log("RESEND_API_KEY first chars:", resendApiKey ? resendApiKey.substring(0, 5) + "..." : "undefined");
console.log("SUPABASE_URL exists:", !!supabaseUrl);
console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!supabaseServiceKey);

// Initialize clients
if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is required");
}

const resend = new Resend(resendApiKey);
const supabase = createClient(
  supabaseUrl || "", 
  supabaseServiceKey || ""
);

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
        JSON.stringify({ error: "Incident not found or not approved", details: incidentError }),
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
      .eq("locality", incident.locality)
      .neq("email", null);  // Only get users with valid emails
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({ error: "Error fetching users in locality", details: usersError }),
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
    const emailResults = [];
    const emailErrors = [];

    for (const user of users) {
      if (!user.email) {
        console.log("Skipping user with no email");
        continue;
      }
      
      try {
        console.log(`Attempting to send email to ${user.email}`);
        const result = await resend.emails.send({
          from: "Incident Snapper <notifications@reppans.xyz>",
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
        
        console.log(`Email sent successfully to ${user.email}:`, result);
        emailResults.push({ email: user.email, success: true, result });
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
        emailErrors.push({ email: user.email, error: emailError.message });
        
        // Check if it's a domain verification error
        if (emailError.message && emailError.message.includes("domain")) {
          console.error("DOMAIN VERIFICATION ISSUE: You need to verify your domain in Resend or use a verified email address for testing");
        }
      }
    }

    console.log(`Email sending complete. Successes: ${emailResults.length}, Errors: ${emailErrors.length}`);
    
    if (emailErrors.length > 0) {
      console.log("Email errors:", emailErrors);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sending attempted for ${users.length} users in ${incident.locality}`,
        results: {
          successful: emailResults.length,
          failed: emailErrors.length,
          details: emailErrors.length > 0 ? emailErrors : undefined
        }
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
