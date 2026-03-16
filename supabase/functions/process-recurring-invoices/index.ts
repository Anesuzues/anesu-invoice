import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  is_recurring: boolean;
  recurring_frequency: 'monthly' | 'quarterly' | 'yearly' | null;
  next_invoice_date: string | null;
}

interface InvoiceItem {
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    const { data: recurringInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('is_recurring', true)
      .lte('next_invoice_date', today);

    if (fetchError) throw fetchError;

    const results = [];

    for (const invoice of recurringInvoices as (Invoice & { invoice_items: InvoiceItem[] })[]) {
      const nextInvoiceDate = new Date(invoice.next_invoice_date!);
      const issueDate = nextInvoiceDate.toISOString().split('T')[0];

      let dueDate = new Date(nextInvoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const lastInvoiceNumber = invoice.invoice_number;
      const numberPart = parseInt(lastInvoiceNumber.split('-')[1]) || 0;
      const newInvoiceNumber = `INV-${String(numberPart + 1).padStart(4, '0')}`;

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: newInvoiceNumber,
          company_id: invoice.company_id,
          client_id: invoice.client_id,
          issue_date: issueDate,
          due_date: dueDateStr,
          status: 'draft',
          subtotal: invoice.subtotal,
          tax_amount: invoice.tax_amount,
          discount_amount: invoice.discount_amount,
          total: invoice.total,
          notes: invoice.notes,
          terms: invoice.terms,
          is_recurring: true,
          recurring_frequency: invoice.recurring_frequency,
          next_invoice_date: calculateNextDate(nextInvoiceDate, invoice.recurring_frequency!),
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      for (const item of invoice.invoice_items) {
        await supabase.from('invoice_items').insert({
          invoice_id: newInvoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          amount: item.amount,
        });
      }

      await supabase
        .from('invoices')
        .update({
          next_invoice_date: calculateNextDate(nextInvoiceDate, invoice.recurring_frequency!),
        })
        .eq('id', invoice.id);

      results.push({
        original_invoice: invoice.invoice_number,
        new_invoice: newInvoiceNumber,
        issue_date: issueDate,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        invoices: results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error processing recurring invoices:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function calculateNextDate(currentDate: Date, frequency: 'monthly' | 'quarterly' | 'yearly'): string {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate.toISOString().split('T')[0];
}
