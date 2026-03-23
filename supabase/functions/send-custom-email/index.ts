import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CustomEmailRequest {
  invoiceId: string;
  template: 'professional' | 'friendly' | 'urgent' | 'thank_you';
  customMessage?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { invoiceId, template, customMessage }: CustomEmailRequest = await req.json();

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

    const emailHtml = generateCustomEmail(invoice, template, customMessage);
    const emailSubject = getEmailSubject(invoice, template);

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

    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    return new Response(
      JSON.stringify({ success: true, message: 'Custom email sent successfully', template }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending custom email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getEmailSubject(invoice: any, template: string): string {
  const subjects = {
    professional: `Invoice ${invoice.invoice_number} - ${invoice.companies.name}`,
    friendly: `Your invoice is ready! 😊 - ${invoice.invoice_number}`,
    urgent: `⚠️ URGENT: Payment Required - Invoice ${invoice.invoice_number}`,
    thank_you: `Thank you! 🙏 Invoice ${invoice.invoice_number}`
  };
  return subjects[template as keyof typeof subjects] || subjects.professional;
}

function generateCustomEmail(invoice: any, template: string, customMessage?: string): string {
  const company = invoice.companies;
  const client = invoice.clients;
  
  const templates = {
    professional: generateProfessionalTemplate(invoice, company, client, customMessage),
    friendly: generateFriendlyTemplate(invoice, company, client, customMessage),
    urgent: generateUrgentTemplate(invoice, company, client, customMessage),
    thank_you: generateThankYouTemplate(invoice, company, client, customMessage)
  };
  
  return templates[template as keyof typeof templates] || templates.professional;
}

function generateProfessionalTemplate(invoice: any, company: any, client: any, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.8; color: #2c3e50; background: #ecf0f1; }
        .container { max-width: 650px; margin: 0 auto; padding: 30px; background: white; border: 1px solid #bdc3c7; }
        .header { text-align: center; border-bottom: 3px solid #34495e; padding-bottom: 20px; margin-bottom: 30px; }
        .invoice-details { background: #f8f9fa; padding: 25px; border-left: 5px solid #34495e; }
        .amount { font-size: 24px; font-weight: bold; color: #27ae60; }
        .button { background: #34495e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 3px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #bdc3c7; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #34495e; margin: 0;">INVOICE</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">#{invoice.invoice_number}</p>
        </div>
        
        <p>Dear ${client.name},</p>
        <p>We are pleased to present you with invoice ${invoice.invoice_number} for services rendered.</p>
        
        ${customMessage ? `<div style="background: #e8f4fd; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;"><p style="margin: 0; font-style: italic;">${customMessage}</p></div>` : ''}
        
        <div class="invoice-details">
          <h3>Invoice Summary</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> <span class="amount">$${invoice.total.toFixed(2)}</span></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://anesu-invoice.vercel.app/invoice/${invoice.id}" class="button">View Invoice</a>
        </div>
        
        <p>Please remit payment by the due date specified above. Should you have any questions regarding this invoice, please do not hesitate to contact us.</p>
        
        <div class="footer">
          <p><strong>${company.name}</strong></p>
          <p>${company.email} | ${company.phone}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateFriendlyTemplate(invoice: any, company: any, client: any, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Invoice is Ready! 😊</title>
      <style>
        body { font-family: 'Comic Sans MS', cursive, sans-serif; line-height: 1.6; color: #333; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .header { text-align: center; background: linear-gradient(45deg, #ff6b6b, #feca57); padding: 30px; border-radius: 15px; color: white; margin-bottom: 25px; }
        .invoice-details { background: #f1f2f6; padding: 20px; border-radius: 15px; border: 3px dashed #ff6b6b; }
        .amount { font-size: 32px; font-weight: bold; color: #ff6b6b; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); }
        .button { background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; }
        .emoji { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">🎉</div>
          <h1 style="margin: 10px 0;">Hey ${client.name}!</h1>
          <p style="margin: 0; font-size: 18px;">Your invoice is ready and waiting! 📄✨</p>
        </div>
        
        <p>Hope you're having an amazing day! 😊</p>
        <p>We've prepared your invoice ${invoice.invoice_number} with lots of love and attention to detail!</p>
        
        ${customMessage ? `<div style="background: #ffeaa7; padding: 15px; border-radius: 10px; border-left: 5px solid #fdcb6e; margin: 20px 0;"><p style="margin: 0;">💬 <em>${customMessage}</em></p></div>` : ''}
        
        <div class="invoice-details">
          <h3>📋 What's Inside:</h3>
          <p>🔢 <strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          <p>📅 <strong>Created:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
          <p>⏰ <strong>Due:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <div style="text-align: center; margin: 20px 0;">
            <p style="margin: 0;">💰 <strong>Total Amount:</strong></p>
            <span class="amount">$${invoice.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://anesu-invoice.vercel.app/invoice/${invoice.id}" class="button">🔍 View Your Invoice</a>
        </div>
        
        <p>Thanks for being such an awesome client! 🙏 If you have any questions, just hit reply - we're here to help! 💪</p>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #ddd6fe; border-radius: 10px;">
          <p style="margin: 0;"><strong>🏢 ${company.name}</strong></p>
          <p style="margin: 5px 0;">📧 ${company.email} | 📞 ${company.phone}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Made with ❤️ for our amazing clients!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateUrgentTemplate(invoice: any, company: any, client: any, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>URGENT: Payment Required</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #721c24; background: #f8d7da; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; border: 3px solid #dc3545; border-radius: 10px; }
        .header { background: #dc3545; color: white; padding: 25px; text-align: center; border-radius: 8px; margin-bottom: 25px; }
        .warning { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .invoice-details { background: #f8f9fa; padding: 20px; border: 2px solid #dc3545; border-radius: 8px; }
        .amount { font-size: 28px; font-weight: bold; color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; }
        .button { background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">⚠️ URGENT NOTICE ⚠️</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Immediate Payment Required</p>
        </div>
        
        <div class="warning">
          <h3 style="margin: 0 0 10px 0; color: #856404;">🚨 PAYMENT OVERDUE</h3>
          <p style="margin: 0;">Dear ${client.name}, this invoice requires immediate attention.</p>
        </div>
        
        ${customMessage ? `<div style="background: #d1ecf1; padding: 15px; border-left: 4px solid #bee5eb; margin: 20px 0;"><p style="margin: 0;"><strong>Important Message:</strong> ${customMessage}</p></div>` : ''}
        
        <div class="invoice-details">
          <h3 style="color: #dc3545;">📄 Overdue Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Original Due Date:</strong> <span style="color: #dc3545; font-weight: bold;">${new Date(invoice.due_date).toLocaleDateString()}</span></p>
          <p><strong>Days Overdue:</strong> <span style="color: #dc3545; font-weight: bold;">${Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} days</span></p>
          <div style="text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">AMOUNT DUE:</p>
            <span class="amount">$${invoice.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://anesu-invoice.vercel.app/invoice/${invoice.id}" class="button">🔥 PAY NOW</a>
        </div>
        
        <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
          <p style="margin: 0; font-weight: bold;">Please remit payment immediately to avoid:</p>
          <ul style="margin: 10px 0;">
            <li>Late payment fees</li>
            <li>Service interruption</li>
            <li>Collection proceedings</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 15px; border-top: 2px solid #dc3545;">
          <p style="margin: 0;"><strong>${company.name}</strong></p>
          <p style="margin: 5px 0;">${company.email} | ${company.phone}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateThankYouTemplate(invoice: any, company: any, client: any, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Thank You! 🙏</title>
      <style>
        body { font-family: 'Georgia', serif; line-height: 1.7; color: #2c3e50; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
        .container { max-width: 600px; margin: 0 auto; padding: 25px; background: white; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 35px; border-radius: 12px; color: white; margin-bottom: 30px; }
        .thank-you { background: #d4edda; border: 2px solid #28a745; padding: 25px; border-radius: 10px; text-align: center; margin: 25px 0; }
        .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 5px solid #28a745; }
        .amount { font-size: 24px; font-weight: bold; color: #28a745; }
        .button { background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 36px;">🙏 Thank You!</h1>
          <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">We truly appreciate your business</p>
        </div>
        
        <div class="thank-you">
          <h2 style="margin: 0 0 15px 0; color: #155724;">✨ Payment Received! ✨</h2>
          <p style="margin: 0; font-size: 18px;">Dear ${client.name}, thank you for your prompt payment!</p>
        </div>
        
        ${customMessage ? `<div style="background: #e2e3e5; padding: 20px; border-radius: 8px; border-left: 4px solid #6c757d; margin: 25px 0;"><p style="margin: 0; font-style: italic;">"${customMessage}"</p></div>` : ''}
        
        <div class="invoice-details">
          <h3 style="color: #495057;">📋 Payment Summary</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Amount Paid:</strong> <span class="amount">$${invoice.total.toFixed(2)}</span></p>
          <p style="color: #28a745; font-weight: bold;">✅ Status: PAID IN FULL</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://anesu-invoice.vercel.app/invoice/${invoice.id}" class="button">📄 View Receipt</a>
        </div>
        
        <div style="background: #e7f3ff; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
          <h3 style="margin: 0 0 15px 0; color: #0c5460;">🌟 Why We Love Working With You</h3>
          <p style="margin: 0;">Your prompt payments and professional approach make our partnership a joy. Thank you for being such a valued client!</p>
        </div>
        
        <div style="text-align: center; margin-top: 35px; padding: 25px; background: #f8f9fa; border-radius: 10px;">
          <p style="margin: 0 0 10px 0;"><strong>🏢 ${company.name}</strong></p>
          <p style="margin: 0 0 15px 0;">${company.email} | ${company.phone}</p>
          <p style="margin: 0; font-size: 14px; color: #6c757d; font-style: italic;">Looking forward to serving you again! 🤝</p>
        </div>
      </div>
    </body>
    </html>
  `;
}