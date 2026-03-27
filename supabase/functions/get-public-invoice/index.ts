import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Methods': string;
}

const corsHeaders: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // @ts-ignore - Deno.env not available in IDE
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore - Deno.env not available in IDE  
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const invoiceId = url.pathname.split('/').pop();

    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }

    // Get invoice with company and client details using service role (bypasses RLS)
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(*),
        companies(*),
        invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // Mark invoice as viewed (only if not already viewed)
    if (!invoice.viewed_at) {
      await supabase
        .from('invoices')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', invoiceId);
    }

    return new Response(JSON.stringify({ success: true, invoice }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in get-public-invoice:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch invoice' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});