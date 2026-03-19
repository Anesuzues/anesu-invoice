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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Find invoices that need reminders
    const { data: invoicesNeedingReminders, error } = await supabase
      .from('invoices')
      .select(`
        *,
        companies(*),
        clients(*)
      `)
      .in('status', ['sent', 'overdue'])
      .or(`due_date.lte.${threeDaysFromNow.toISOString().split('T')[0]},due_date.lte.${sevenDaysAgo.toISOString().split('T')[0]}`);

    if (error) throw error;

    const results = [];

    for (const invoice of invoicesNeedingReminders || []) {
      const dueDate = new Date(invoice.due_date);
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let shouldSendReminder = false;
      let reminderType = '';

      if (daysDiff === -3) {
        // 3 days before due date
        shouldSendReminder = true;
        reminderType = 'upcoming';
      } else if (daysDiff === 0) {
        // Due today
        shouldSendReminder = true;
        reminderType = 'due_today';
      } else if (daysDiff === 7 || daysDiff === 14 || daysDiff === 30) {
        // Overdue reminders
        shouldSendReminder = true;
        reminderType = 'overdue';
        
        // Update status to overdue if not already
        if (invoice.status !== 'overdue') {
          await supabase
            .from('invoices')
            .update({ status: 'overdue' })
            .eq('id', invoice.id);
        }
      }

      if (shouldSendReminder) {
        // Call the send-invoice-email function
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-invoice-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            sendReminder: true,
          }),
        });

        if (emailResponse.ok) {
          results.push({
            invoice_number: invoice.invoice_number,
            client_email: invoice.clients.email,
            reminder_type: reminderType,
            days_overdue: daysDiff > 0 ? daysDiff : 0,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: results.length,
        details: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending payment reminders:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});