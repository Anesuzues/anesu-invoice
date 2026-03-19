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

    if (error || !invoice) {
      throw new Error('Invoice not found');
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
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .invoice-details { background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
        .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isReminder ? '⏰ Payment Reminder' : '📄 New Invoice'}</h1>
          <p>Hello ${client.name},</p>
          <p>${isReminder 
            ? `This is a friendly reminder that invoice ${invoice.invoice_number} is due for payment.`
            : `Please find your invoice ${invoice.invoice_number} from ${company.name}.`
          }</p>
        </div>
        
        <div class="invoice-details">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <p><strong>Amount Due:</strong> <span class="amount">$${invoice.total.toFixed(2)}</span></p>
          
          ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
        </div>
        
        <a href="https://anesu-invoice.vercel.app/invoice/${invoice.id}" class="button">
          View Invoice Online
        </a>
        
        <div class="footer">
          <p><strong>${company.name}</strong></p>
          ${company.address ? `<p>${company.address}</p>` : ''}
          ${company.email ? `<p>Email: ${company.email}</p>` : ''}
          ${company.phone ? `<p>Phone: ${company.phone}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}