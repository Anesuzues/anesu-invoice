import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  invoiceId: string;
  sendReminder?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!; // Add this to your Supabase secrets
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { invoiceId, sendReminder = false }: EmailRequest = await req.json();

    // Get invoice with company and client details
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        companies(*),
        clients(*),
        invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }

    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    if (!invoice.clients?.email) {
      throw new Error('Client email is required but not found');
    }

    if (!invoice.companies?.name) {
      throw new Error('Company information is required but not found');
    }

    const emailSubject = sendReminder 
      ? `Payment Reminder: Invoice ${invoice.invoice_number}`
      : `Invoice ${invoice.invoice_number} from ${invoice.companies.name}`;

    const emailHtml = generateInvoiceEmail(invoice, sendReminder);

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${invoice.companies.name} <invoices@${invoice.companies.email?.split('@')[1] || 'yourdomain.com'}>`,
        to: [invoice.clients.email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    // Update invoice status and sent timestamp
    await supabase
      .from('invoices')
      .update({
        status: sendReminder ? invoice.status : 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    return new Response(
      JSON.stringify({ success: true, message: 'Invoice email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending invoice email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateInvoiceEmail(invoice: any, isReminder: boolean): string {
  const company = invoice.companies;
  const client = invoice.clients;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${isReminder ? 'Payment Reminder' : 'Invoice'}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin-bottom: 25px; color: white; text-align: center; }
        .logo { max-width: 150px; margin-bottom: 15px; }
        .invoice-details { background: #f8f9fa; border: 2px solid #e9ecef; padding: 25px; border-radius: 10px; margin: 20px 0; }
        .amount { font-size: 28px; font-weight: bold; color: #28a745; background: #d4edda; padding: 10px 15px; border-radius: 8px; display: inline-block; }
        .button { display: inline-block; background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
        .button:hover { background: linear-gradient(45deg, #218838, #1ea080); }
        .footer { margin-top: 40px; padding-top: 25px; border-top: 2px solid #dee2e6; font-size: 14px; color: #6c757d; text-align: center; }
        .highlight { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${company.logo_url ? `<img src="${company.logo_url}" alt="${company.name}" class="logo">` : ''}
          <h1 style="margin: 0; font-size: 32px;">${isReminder ? '⏰ Payment Reminder' : '📄 New Invoice'}</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Hello ${client.name},</p>
          <div class="highlight" style="background: rgba(255,255,255,0.2); border-left: 4px solid white; margin-top: 20px;">
            <p style="margin: 0; font-size: 16px;">${isReminder 
              ? `This is a friendly reminder that invoice ${invoice.invoice_number} is due for payment.`
              : `Thank you for your business! Please find your invoice ${invoice.invoice_number} from ${company.name}.`
            }</p>
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
              <td style="padding: 8px 0; text-align: right; color: ${new Date(invoice.due_date) < new Date() ? '#dc3545' : '#28a745'};">${new Date(invoice.due_date).toLocaleDateString()}</td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 25px 0;">
            <p style="margin: 0; font-size: 16px; color: #6c757d;">Amount Due</p>
            <span class="amount">$${invoice.total.toFixed(2)}</span>
          </div>
          
          ${invoice.notes ? `
            <div class="highlight">
              <p style="margin: 0;"><strong>📝 Notes:</strong> ${invoice.notes}</p>
            </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://anesu-invoice.vercel.app/invoice/${invoice.id}" class="button">
            🔍 View Invoice Online
          </a>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #6c757d;">
            Click the button above to view, download, or print your invoice
          </p>
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #495057;">${company.name}</h4>
            ${company.address ? `<p style="margin: 5px 0;">${company.address}</p>` : ''}
            ${company.city || company.state || company.zip ? `<p style="margin: 5px 0;">${[company.city, company.state, company.zip].filter(Boolean).join(', ')}</p>` : ''}
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 15px;">
            ${company.email ? `<p style="margin: 5px 0;">📧 ${company.email}</p>` : ''}
            ${company.phone ? `<p style="margin: 5px 0;">📞 ${company.phone}</p>` : ''}
            ${company.website ? `<p style="margin: 5px 0;">🌐 <a href="${company.website}" style="color: #007bff;">${company.website}</a></p>` : ''}
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6; font-size: 12px; color: #adb5bd;">
            <p style="margin: 0;">This invoice was generated automatically by ${company.name}'s invoice management system.</p>
            <p style="margin: 5px 0 0 0;">If you have any questions, please contact us using the information above.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}