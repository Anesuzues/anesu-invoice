// @ts-ignore - Deno types not available in IDE
/// <reference types="https://deno.land/types/index.d.ts" />
// @ts-ignore - npm: imports are Deno-specific
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
// @ts-ignore - npm: imports are Deno-specific
import nodemailer from 'npm:nodemailer@6.9.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  invoiceId: string;
  sendReminder?: boolean;
}

// @ts-ignore - Deno global not available in IDE
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // @ts-ignore - Deno.env not available in IDE
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore - Deno.env not available in IDE
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    // Fallback Gmail credentials (used if a company hasn't set their own)
    // @ts-ignore - Deno.env not available in IDE
    const fallbackGmailUser = Deno.env.get('GMAIL_USER') || '';
    // @ts-ignore - Deno.env not available in IDE
    const fallbackGmailPassword = Deno.env.get('GMAIL_APP_PASSWORD') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { invoiceId, sendReminder = false }: EmailRequest = await req.json();

    if (!invoiceId) {
      throw new Error('invoiceId is required');
    }

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
      throw new Error(`Failed to fetch invoice: ${(error as any).message || JSON.stringify(error)}`);
    }

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found. Check that the invoice exists and the service role key is correctly set.`);
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

    // Use per-company credentials if set, otherwise fall back to env secrets
    const gmailUser = invoice.companies.smtp_gmail_user || fallbackGmailUser;
    const gmailPassword = invoice.companies.smtp_gmail_password || fallbackGmailPassword;

    if (!gmailUser || !gmailPassword) {
      throw new Error('No email credentials configured. Please add your Gmail address and App Password in Settings.');
    }

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    // Send email — to client, cc the company owner (if different email)
    await transporter.sendMail({
      from: `"${invoice.companies.name}" <${gmailUser}>`,
      to: invoice.clients.email,
      cc: invoice.companies.email && invoice.companies.email !== invoice.clients.email ? invoice.companies.email : undefined,
      subject: emailSubject,
      html: emailHtml,
    });

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
      JSON.stringify({ success: false, error: (error as any).message || 'Unknown error' }),
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