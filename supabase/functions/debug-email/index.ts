import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseServiceKey: supabaseServiceKey ? 'SET' : 'MISSING',
      resendApiKey: resendApiKey ? 'SET' : 'MISSING'
    });

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    
    console.log('Request body:', body);

    // Test database connection
    const { data: testQuery, error: dbError } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .limit(1);

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database connection failed: ${dbError.message}`);
    }

    console.log('Database test successful:', testQuery);

    // Test Resend API
    const testEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'test@resend.dev',
        to: ['anesukamombe8@gmail.com'],
        subject: 'Debug Test Email',
        html: '<p>This is a debug test email to verify the setup.</p>',
      }),
    });

    const emailResult = await testEmailResponse.json();
    console.log('Email test result:', emailResult);

    if (!testEmailResponse.ok) {
      throw new Error(`Email API failed: ${JSON.stringify(emailResult)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All systems working correctly',
        database: 'Connected',
        email: 'Working',
        emailId: emailResult.id,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Debug error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});