import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log('Received event:', JSON.stringify(body, null, 2));

    // Support both single event and batch events
    const events = Array.isArray(body) ? body : [body];
    
    const eventsToInsert = events.map(event => ({
      session_id: event.session_id || 'anonymous',
      event_type: event.event_type || 'unknown',
      event_name: event.event_name || 'unnamed_event',
      url: event.url || null,
      page_title: event.page_title || null,
      element_selector: event.element_selector || null,
      element_text: event.element_text || null,
      metadata: event.metadata || {},
      user_agent: req.headers.get('user-agent') || null,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
    }));

    const { data, error } = await supabase
      .from('behavior_events')
      .insert(eventsToInsert)
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Successfully inserted events:', data?.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Tracked ${data?.length || 0} event(s)`,
        ids: data?.map(e => e.id) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
