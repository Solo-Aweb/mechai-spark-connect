
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { pdfUrl, fileName, partId } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log(`Processing PDF to SVG conversion for file: ${fileName}`)
    
    // For this demo, we'll simulate the conversion by creating a simple SVG
    // In a real implementation, you would:
    // 1. Download the PDF from Storage
    // 2. Use a PDF to SVG conversion library or service
    // 3. Upload the resulting SVG

    // Generate a simple placeholder SVG
    const svgContent = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f0f0f0" />
      <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle">
        ${fileName}
      </text>
    </svg>`
    
    // Create a unique filename to avoid collisions
    const timestamp = Date.now()
    const uniqueFileName = fileName.replace('.pdf', `-${timestamp}.svg`)
    const svgPath = `models/${uniqueFileName}`
    
    // Upload the SVG to storage with upsert option to overwrite if file exists
    const { data: svgUploadData, error: svgUploadError } = await supabase
      .storage
      .from('svg_files')
      .upload(svgPath, svgContent, {
        contentType: 'image/svg+xml',
        cacheControl: '3600',
        upsert: true // This will overwrite the file if it exists
      })
    
    if (svgUploadError) throw svgUploadError
    
    // Get the public URL for the SVG
    const { data: { publicUrl: svgUrl } } = supabase
      .storage
      .from('svg_files')
      .getPublicUrl(svgPath)
    
    // Update the part record with the SVG URL
    const { error: updateError } = await supabase
      .from('parts')
      .update({ svg_url: svgUrl })
      .eq('id', partId)
    
    if (updateError) throw updateError
    
    return new Response(
      JSON.stringify({ success: true, svgUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in pdfToSvg function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
