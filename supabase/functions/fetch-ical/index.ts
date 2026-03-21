import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  dtstart: string;
  dtend: string;
  status: string;
}

function parseICalDate(dateStr: string): string {
  if (!dateStr) return "";
  // Handle TZID format: TZID=America/New_York:20250120T180000
  const tzidMatch = dateStr.match(/TZID=[^:]+:(.+)/);
  const raw = tzidMatch ? tzidMatch[1] : dateStr.replace(/[Z]/g, "");

  // Format: 20250120T180000
  if (raw.length >= 15) {
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(9, 11);
    const min = raw.slice(11, 13);
    const sec = raw.slice(13, 15);
    return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
  }
  // Date only: 20250120
  if (raw.length >= 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00`;
  }
  return dateStr;
}

function unfoldLines(text: string): string {
  // iCal spec: lines can be folded by inserting CRLF + whitespace
  return text.replace(/\r?\n[ \t]/g, "");
}

function parseICal(icalText: string): CalendarEvent[] {
  const unfolded = unfoldLines(icalText);
  const events: CalendarEvent[] = [];
  const lines = unfolded.split(/\r?\n/);

  let inEvent = false;
  let current: Partial<CalendarEvent> = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      events.push({
        uid: current.uid || "",
        summary: current.summary || "Untitled Event",
        description: current.description || "",
        location: current.location || "",
        dtstart: current.dtstart || "",
        dtend: current.dtend || "",
        status: current.status || "",
      });
      continue;
    }
    if (!inEvent) continue;

    // Parse property:value, handling parameters like DTSTART;TZID=...
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const propPart = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1).replace(/\\n/g, "\n").replace(/\\,/g, ",");
    const propName = propPart.split(";")[0].toUpperCase();

    switch (propName) {
      case "UID":
        current.uid = value;
        break;
      case "SUMMARY":
        current.summary = value;
        break;
      case "DESCRIPTION":
        current.description = value;
        break;
      case "LOCATION":
        current.location = value;
        break;
      case "DTSTART":
        current.dtstart = parseICalDate(
          propPart.includes(";") ? `${propPart.split(";").slice(1).join(";")}:${value}` : value
        );
        break;
      case "DTEND":
        current.dtend = parseICalDate(
          propPart.includes(";") ? `${propPart.split(";").slice(1).join(";")}:${value}` : value
        );
        break;
      case "STATUS":
        current.status = value;
        break;
    }
  }

  return events;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the iCal URL from site_settings
    const { data: setting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "tripleseat_ical_url")
      .maybeSingle();

    const icalUrl = setting?.value;
    if (!icalUrl) {
      return new Response(
        JSON.stringify({ events: [], error: "No iCal URL configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the iCal feed
    const icalResponse = await fetch(icalUrl);
    if (!icalResponse.ok) {
      throw new Error(`Failed to fetch iCal feed: ${icalResponse.status}`);
    }

    const icalText = await icalResponse.text();
    const events = parseICal(icalText);

    // Sort by start date
    events.sort((a, b) => a.dtstart.localeCompare(b.dtstart));

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching iCal:", error);
    return new Response(
      JSON.stringify({ events: [], error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
