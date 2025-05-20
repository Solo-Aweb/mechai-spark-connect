
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

const supabaseUrl = 'https://dhppkyaaedwpalnrwvmd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocHBreWFhZWR3cGFsbnJ3dm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTUxMTcsImV4cCI6MjA2Mjc5MTExN30.A2tGRdpiLQT4o2LhraQr1lS22-e56SU552HJ_QmMgIg';
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

// Add check for API key
if (!openaiApiKey) {
  console.error("OPENAI_API_KEY is missing. Please set this in your Supabase Function Secrets.");
}

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
    // Check if OpenAI API key is configured
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in the Supabase Function Secrets.' 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the auth token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse the request body
    const { partId } = await req.json();
    if (!partId) {
      return new Response(JSON.stringify({ error: 'Part ID is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client with the user's JWT
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Fetch the part data
    const { data: part, error: partError } = await supabase
      .from('parts')
      .select('*')
      .eq('id', partId)
      .single();

    if (partError) {
      console.error('Error fetching part:', partError);
      return new Response(JSON.stringify({ error: 'Error fetching part data' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch SVG content if available
    let svgContent = null;
    if (part.svg_url) {
      console.log('SVG URL found, fetching SVG content:', part.svg_url);
      try {
        const svgResponse = await fetch(part.svg_url);
        if (svgResponse.ok) {
          svgContent = await svgResponse.text();
          console.log('SVG content fetched successfully');
        } else {
          console.error('Failed to fetch SVG content:', svgResponse.statusText);
        }
      } catch (error) {
        console.error('Error fetching SVG content:', error);
      }
    }

    // Fetch all machines
    const { data: machines, error: machinesError } = await supabase
      .from('machines')
      .select('*');

    if (machinesError) {
      console.error('Error fetching machines:', machinesError);
      return new Response(JSON.stringify({ error: 'Error fetching machine data' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all tooling
    const { data: tooling, error: toolingError } = await supabase
      .from('tooling')
      .select('*');

    if (toolingError) {
      console.error('Error fetching tooling:', toolingError);
      return new Response(JSON.stringify({ error: 'Error fetching tooling data' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all materials
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*');

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      return new Response(JSON.stringify({ error: 'Error fetching materials data' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare prompt for OpenAI based on available data
    let prompt;
    if (svgContent) {
      prompt = `Given these 2D vectors ${JSON.stringify(svgContent)}, shop machines ${JSON.stringify(machines)}, tooling ${JSON.stringify(tooling)}, and materials ${JSON.stringify(materials)}, identify machining features (pockets, holes, slots), then plan ordered machining steps. Return JSON with steps, machine_id, tooling_id, time, cost, and flag unservable features.`;
    } else {
      prompt = `Given these machines ${JSON.stringify(machines)}, tooling ${JSON.stringify(tooling)}, and material ${JSON.stringify(materials)}, plan a sequence of machining steps for part with URL ${part.file_url || 'No file URL available'}. Return JSON with ordered steps, each step's assigned machine_id, tooling_id, estimated time (in minutes), and cost. Flag any unservable operations.`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a CNC machining expert tasked with planning machining operations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
        // Removed the temperature parameter as it's not supported by this model
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Error calling OpenAI API',
        details: errorData
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const openaiData = await response.json();
    console.log('OpenAI response:', JSON.stringify(openaiData));

    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      console.error('Invalid response from OpenAI:', openaiData);
      return new Response(JSON.stringify({ error: 'Invalid response from AI service' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract the itinerary from OpenAI's response
    let itinerary;
    try {
      const aiResponse = openaiData.choices[0].message.content;
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/```json\s+([\s\S]*?)\s+```/) || 
                       aiResponse.match(/{[\s\S]*}/);
      
      if (jsonMatch) {
        itinerary = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // If no JSON format is detected, try to parse the entire response
        itinerary = JSON.parse(aiResponse);
      }
    } catch (e) {
      console.error('Error parsing AI response:', e);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response',
        aiResponse: openaiData.choices[0].message.content 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calculate total cost
    let totalCost = 0;
    if (itinerary.steps) {
      totalCost = itinerary.steps.reduce((sum, step) => sum + (step.cost || 0), 0);
    }

    // Save the itinerary to Supabase
    const { data: itineraryData, error: itineraryError } = await supabase
      .from('itineraries')
      .insert({
        part_id: partId,
        steps: itinerary,
        total_cost: totalCost
      })
      .select()
      .single();

    if (itineraryError) {
      console.error('Error saving itinerary:', itineraryError);
      return new Response(JSON.stringify({ error: 'Error saving itinerary data', details: itineraryError }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Return the successful response
    return new Response(JSON.stringify({ 
      success: true, 
      itinerary: itineraryData 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
