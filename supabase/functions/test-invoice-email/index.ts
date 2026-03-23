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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    // Create a mock invoice for testing
    const mockInvoice = {
      id: 'test-invoice-123',
      invoice_number: 'INV-0001',
      issue_date: '2026-03-23',
      due_date: '2026-04-23',
      total: 1250.00,
      subtotal: 1000.00,
      tax_amount: 250.00,
      discount_amount: 0,
      notes: 'Thank you for your business!',
      companies: {
        name: 'Anesu Invoice Company',
        email: 'contact@anesuinvoice.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business St',
        city: 'Business City',
        state: 'BC',
        zip: '12345'
      },
      clients: {
        name: 'Test Client',
        email: 'anesukamombe8@gmail.com'
      },
      invoice_items: [
        {
          description: 'Web Development Services',
          quantity: 10,
          unit_price: 100.00,
          amount: 1000.00,
          tax_rate: 25
        }
      ]
    };

    const emailHtml = generateTestInvoiceEmail(mockInvoice);

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['anesukamombe8@gmail.com'],
        subject: `Test Invoice ${mockInvoice.invoice_number} from ${mockInvoice.companies.name}`,
        html: emailHtml,
        reply_to: mockInvoice.companies.email,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Email API failed: ${JSON.stringify(emailResult)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test invoice email sent successfully!',
        emailId: emailResult.id,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending test invoice email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateTestInvoiceEmail(invoice: any): string {
  const company = invoice.companies;
  const client = invoice.clients;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Test Invoice</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 25px; color: white; text-align: center; }
        .invoice-details { background: #f8f9fa; border: 2px solid #e9ecef; padding: 25px; border-radius: 10px; margin: 20px 0; }
        .amount { font-size: 28px; font-weight: bold; color: #28a745; background: #d4edda; padding: 10px 15px; border-radius: 8px; display: inline-block; }
        .button { display: inline-block; background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .footer { margin-top: 40px; padding-top: 25px; border-top: 2px solid #dee2e6; font-size: 14px; color: #6c757d; text-align: center; }
        .highlight { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 32px;">📄 Test Invoice</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Hello ${client.name},</p>
          <div class="highlight" style="background: rgba(255,255,255,0.2); border-left: 4px solid white; margin-top: 20px;">
            <p style="margin: 0; font-size: 16px;">This is a test invoice email to verify your email system is working correctly!</p>
          </div>
        </div>
        
        <div class="invoice-details">
          <h3 style="color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px;">📋 Invoice Details</h3>
          <table style="width: 100%; margin-top: 15px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Invoice Number:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${invoice.invoice_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Issue Date:</td>
              <td style="padding: 8px 0; text-align: right;">${new Date(invoice.issue_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Due Date:</td>
              <td style="padding: 8px 0; text-align: right; color: #28a745;">${new Date(invoice.due_date).toLocaleDateString()}</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 25px 0;">
            <p style="margin: 0; font-size: 16px; color: #6c757d;">Amount Due</p>
            <span class="amount">$${invoice.total.toFixed(2)}</span>
          </div>
          
          <div class="highlight">
            <p style="margin: 0;"><strong>📝 Notes:</strong> ${invoice.notes}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://anesu-invoice.vercel.app" class="button">
            🔍 View Invoice Online
          </a>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d;">
            Click the button above to view your invoice management system
          </p>
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #495057;">${company.name}</h4>
            <p style="margin: 5px 0;">${company.address}</p>
            <p style="margin: 5px 0;">${company.city}, ${company.state} ${company.zip}</p>
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 15px;">
            <p style="margin: 5px 0;">📧 ${company.email}</p>
            <p style="margin: 5px 0;">📞 ${company.phone}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6; font-size: 12px; color: #adb5bd;">
            <p style="margin: 0;">✅ This is a test email to verify your invoice email system is working correctly!</p>
            <p style="margin: 5px 0 0 0;">If you received this, your email automation is ready to go! 🎉</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}