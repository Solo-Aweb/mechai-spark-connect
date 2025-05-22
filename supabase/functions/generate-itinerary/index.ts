
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

    // Organize machines by type for easier matching
    const machinesByType = machines.reduce((acc, machine) => {
      if (!acc[machine.type]) {
        acc[machine.type] = [];
      }
      acc[machine.type].push(machine);
      return acc;
    }, {});

    // Prepare enhanced prompt for OpenAI based on available data
    let prompt;
    if (svgContent) {
      prompt = `Given these 2D vectors ${JSON.stringify(svgContent)}, analyze and identify ALL required machining operations. For each operation, determine if we have a suitable machine and tool from our available equipment.

AVAILABLE MACHINES:
${JSON.stringify(machines)}

AVAILABLE TOOLS:
${JSON.stringify(tooling)}

AVAILABLE MATERIALS:
${JSON.stringify(materials)}

I want you to think like an expert machinist with decades of experience:

1. FIXTURING CONSIDERATIONS:
   - Break operations into separate steps when they require different workpiece orientations or fixtures
   - For each step, evaluate if it can be completed within a single setup/fixturing of the part
   - When multiple setups are needed, split into separate machining steps with clear fixturing instructions
   - Consider workholding stability requirements for each step

2. MACHINE CAPABILITY ANALYSIS:
   - Exploit capabilities of multi-axis machines when available (e.g., 3-axis/5-axis mills, mill-turn centers)
   - If a lathe has live tooling, consider performing drilling/threading operations without moving to a mill
   - Evaluate whether a CNC mill can complete features that might traditionally require separate processes
   - Consider feature accessibility within a single setup (can the tool reach all areas?)

3. OPERATION OPTIMIZATION:
   - Combine drilling and tapping operations when using the same machine
   - Group similar operations that use the same tool to minimize tool changes
   - Identify when special fixturing or workholding devices would be needed

For each machining step:
1. Identify the required machine type (mill, lathe, drill press, etc.)
2. Choose the most appropriate machine from our inventory
3. Choose the most appropriate tool from our inventory
4. If we don't have a suitable machine or tool:
   a. Mark the step as unservable
   b. Specify what type of machine would be required (e.g., "requires CNC mill")
   c. Provide a recommendation on what to purchase

IMPORTANT: Include ALL necessary steps, even if we don't have the equipment to perform them.
For steps that cannot be performed with our inventory, provide detailed recommendations about what machine type and/or tool would be needed.

Return ONLY valid JSON with a "steps" array of objects, where each object has:
- "description": detailed description of the machining step including specific fixturing requirements
- "machine_id": ID of selected machine (or null if unavailable)
- "tooling_id": ID of selected tool (or null if unavailable)
- "time": estimated time in minutes
- "cost": calculated cost
- "unservable": boolean indicating if we can't perform this step
- "required_machine_type": machine type needed if unavailable
- "recommendation": purchase recommendation if needed
- "fixture_requirements": specific fixturing needed for this step
- "setup_description": description of how the part should be positioned/secured`;
    } else {
      prompt = `Given part with URL ${part.file_url || 'No file URL available'}, plan a sequence of ALL necessary machining steps. For each step, determine if we have a suitable machine and tool from our equipment:

AVAILABLE MACHINES:
${JSON.stringify(machines)}

AVAILABLE TOOLS:
${JSON.stringify(tooling)}

AVAILABLE MATERIALS:
${JSON.stringify(materials)}

I want you to think like an expert machinist with decades of experience:

1. FIXTURING CONSIDERATIONS:
   - Break operations into separate steps when they require different workpiece orientations or fixtures
   - For each step, evaluate if it can be completed within a single setup/fixturing of the part
   - When multiple setups are needed, split into separate machining steps with clear fixturing instructions
   - Consider workholding stability requirements for each step

2. MACHINE CAPABILITY ANALYSIS:
   - Exploit capabilities of multi-axis machines when available (e.g., 3-axis/5-axis mills, mill-turn centers)
   - If a lathe has live tooling, consider performing drilling/threading operations without moving to a mill
   - Evaluate whether a CNC mill can complete features that might traditionally require separate processes
   - Consider feature accessibility within a single setup (can the tool reach all areas?)

3. OPERATION OPTIMIZATION:
   - Combine drilling and tapping operations when using the same machine
   - Group similar operations that use the same tool to minimize tool changes
   - Identify when special fixturing or workholding devices would be needed

For each machining step:
1. Identify the required machine type (mill, lathe, drill press, etc.)
2. Choose the most appropriate machine from our inventory
3. Choose the most appropriate tool from our inventory
4. If we don't have a suitable machine or tool:
   a. Mark the step as unservable
   b. Specify what type of machine would be required (e.g., "requires CNC mill")
   c. Provide a recommendation on what to purchase

IMPORTANT: Include ALL necessary steps, even if we don't have the equipment to perform them.
For steps that cannot be performed with our inventory, provide detailed recommendations about what machine type and/or tool would be needed.

Return ONLY valid JSON with a "steps" array of objects, where each object has:
- "description": detailed description of the machining step including specific fixturing requirements
- "machine_id": ID of selected machine (or null if unavailable)
- "tooling_id": ID of selected tool (or null if unavailable)
- "time": estimated time in minutes
- "cost": calculated cost
- "unservable": boolean indicating if we can't perform this step
- "required_machine_type": machine type needed if unavailable
- "recommendation": purchase recommendation if needed
- "fixture_requirements": specific fixturing needed for this step
- "setup_description": description of how the part should be positioned/secured`;
    }

    // Call OpenAI API with enhanced system prompt
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
            content: `You are an expert machinist with 30+ years of experience in CNC programming, fixturing, and multi-axis machining. You have deep knowledge of:
            
1. Advanced fixturing techniques and workholding solutions
2. Multi-axis machining strategies and tool path optimization
3. Combining operations to minimize setups and tool changes
4. Feature-based machining and design for manufacturability
5. Live tooling capabilities on lathes and mill-turn centers
6. Efficient use of machine capabilities to minimize setup changes
            
Your goal is to create the most efficient machining plan possible, intelligently grouping operations by fixturing requirements and machine capabilities. Return ONLY valid JSON with no markdown formatting or explanations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ]
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
      console.log('Raw AI response content:', aiResponse);

      // Try different parsing strategies
      try {
        // First attempt: direct JSON parsing of the entire content
        itinerary = JSON.parse(aiResponse);
        console.log('Successfully parsed JSON directly:', JSON.stringify(itinerary));
      } catch (parseError) {
        console.log('First parse attempt failed:', parseError.message);
        
        // Second attempt: extract JSON from markdown code blocks or surrounding text
        const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                          aiResponse.match(/{[\s\S]*?}/);
        
        if (jsonMatch) {
          const jsonText = jsonMatch[1] || jsonMatch[0];
          console.log('Extracted JSON text:', jsonText);
          try {
            itinerary = JSON.parse(jsonText);
            console.log('Successfully parsed extracted JSON:', JSON.stringify(itinerary));
          } catch (extractedParseError) {
            console.error('Failed to parse extracted JSON:', extractedParseError);
            throw new Error('Could not parse extracted JSON from the AI response');
          }
        } else {
          // If all parsing attempts fail, throw the error
          console.error('No JSON pattern found in response');
          throw new Error('Could not extract valid JSON from the AI response');
        }
      }

      // Debug log the initial parsed itinerary structure
      console.log('Initial parsed itinerary structure:', JSON.stringify({
        hasSteps: !!itinerary.steps,
        isStepsArray: itinerary.steps && Array.isArray(itinerary.steps),
        stepsLength: itinerary.steps ? itinerary.steps.length : 0,
        hasMachiningSteps: !!itinerary.machining_steps,
        isMachiningStepsArray: itinerary.machining_steps && Array.isArray(itinerary.machining_steps),
        machiningStepsLength: itinerary.machining_steps ? itinerary.machining_steps.length : 0,
        isWholeResponseArray: Array.isArray(itinerary)
      }));

      // Handle different response formats and normalize to expected structure
      if (itinerary.machining_steps && Array.isArray(itinerary.machining_steps)) {
        console.log('Converting machining_steps format to steps format');
        // Convert machining_steps to the expected steps format
        itinerary = {
          steps: itinerary.machining_steps.map(step => ({
            description: step.operation || step.description || step.feature || "Machining step",
            machine_id: step.machine_id,
            tooling_id: step.tooling_id,
            time: step.estimated_time || step.time || 0,
            cost: step.cost || 0,
            unservable: step.status === "unservable" || step.unservable || false,
            required_machine_type: step.required_machine_type || null,
            recommendation: step.recommendation || null,
            fixture_requirements: step.fixture_requirements || step.fixturing || null,
            setup_description: step.setup_description || step.setup || null
          })),
          total_cost: itinerary.machining_steps.reduce((sum, step) => sum + (parseFloat(step.cost) || 0), 0)
        };
      } else if (!itinerary.steps) {
        console.log('No steps property found, adapting structure');
        // If there's no steps array but we have other data, try to adapt it
        if (Array.isArray(itinerary)) {
          console.log('Response is an array, treating as steps');
          // If the entire response is an array, treat it as steps
          itinerary = {
            steps: itinerary.map(step => ({
              description: step.description || step.operation || "Unknown operation",
              machine_id: step.machine_id || null,
              tooling_id: step.tooling_id || null,
              time: step.time || 0,
              cost: step.cost || 0,
              unservable: step.unservable || false,
              required_machine_type: step.required_machine_type || null,
              recommendation: step.recommendation || null,
              fixture_requirements: step.fixture_requirements || step.fixturing || null,
              setup_description: step.setup_description || step.setup || null
            })),
            total_cost: itinerary.reduce((sum, step) => sum + (parseFloat(step.cost) || 0), 0)
          };
        } else {
          console.log('Creating default structure with empty steps');
          // Create a default structure with empty steps
          itinerary = {
            steps: [],
            total_cost: 0
          };
        }
      }

      // Final check to ensure we have a valid steps array
      if (!itinerary.steps || !Array.isArray(itinerary.steps)) {
        console.log('Final check failed, creating default steps array');
        itinerary.steps = [];
      }

      // Debug log the steps array after normalization
      console.log('Steps array after normalization:', JSON.stringify(itinerary.steps));
      console.log('Steps array length:', itinerary.steps.length);

      // Validate each step has required fields and convert string numbers to actual numbers
      itinerary.steps = itinerary.steps.map(step => ({
        description: step.description || step.operation || "Unknown operation",
        machine_id: step.machine_id || null,
        tooling_id: step.tooling_id || null,
        time: typeof step.time === 'string' ? parseFloat(step.time) : (step.time || 0),
        cost: typeof step.cost === 'string' ? parseFloat(step.cost) : (step.cost || 0),
        unservable: step.unservable || false,
        required_machine_type: step.required_machine_type || (step.unservable ? "Unknown machine type" : null),
        recommendation: step.recommendation || (step.unservable ? "Additional equipment needed" : null),
        fixture_requirements: step.fixture_requirements || step.fixturing || null,
        setup_description: step.setup_description || step.setup || null
      }));

      // Recalculate total cost
      itinerary.total_cost = itinerary.steps.reduce((sum, step) => sum + (parseFloat(step.cost) || 0), 0);
      console.log('Final total cost:', itinerary.total_cost);
      console.log('Final itinerary structure:', JSON.stringify(itinerary));

    } catch (e) {
      console.error('Error parsing AI response:', e);
      console.error('Original AI response was:', openaiData.choices[0].message.content);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response',
        message: e.message,
        aiResponse: openaiData.choices[0].message.content 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Save the itinerary to Supabase
    const { data: itineraryData, error: itineraryError } = await supabase
      .from('itineraries')
      .insert({
        part_id: partId,
        steps: itinerary,
        total_cost: itinerary.total_cost
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
    return new Response(JSON.stringify({ error: 'An unexpected error occurred', message: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
