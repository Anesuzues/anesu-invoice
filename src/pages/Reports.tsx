import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { formatCurrency } from '../utils/currency';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isAfter, isBefore } from 'date-fns';
import type { Database } from '../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  clients: { name: string } | null;
};

type Period = '3m' | '6m' | '12m';

export default function Reports() {
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('6m');

  const currencyCode = (company as any)?.currency || 'ZAR';

  useEffect(() => {
    if (company) loadInvoices();
  }, [company]);

  const loadInvoices = async () => {
    if (!company) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(name)')
      .eq('company_id', company.id)
      .order('issue_date', { ascending: true });
    if (!error && data) setInvoices(data as Invoice[]);
    setLoading(false);
  };

  // ── Derived stats ────────────────────────────────────────────────
  const periodMonths = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  const periodStart = subMonths(new Date(), periodMonths - 1);

  const recentInvoices = invoices.filter(inv =>
    isAfter(parseISO(inv.issue_date), startOfMonth(periodStart))
  );

  // Revenue by month (paid invoices)
  const monthlyData = Array.from({ length: periodMonths }, (_, i) => {
    const month = subMonths(new Date(), periodMonths - 1 - i);
    const ms = startOfMonth(month);
    const me = endOfMonth(month);
    const paid = invoices.filter(inv =>
      inv.status === 'paid' &&
      inv.paid_at &&
      isAfter(parseISO(inv.paid_at), ms) &&
      isBefore(parseISO(inv.paid_at), me)
    );
    const sent = invoices.filter(inv =>
      ['sent', 'overdue'].includes(inv.status) &&
      isAfter(parseISO(inv.issue_date), ms) &&
      isBefore(parseISO(inv.issue_date), me)
    );
    return {
      label: format(month, periodMonths <= 3 ? 'MMM d' : 'MMM yy'),
      revenue: paid.reduce((s, inv) => s + inv.total, 0),
      outstanding: sent.reduce((s, inv) => s + inv.total, 0),
      count: paid.length,
    };
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0);
  const totalTax = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.tax_amount, 0);
  const totalDiscount = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.discount_amount, 0);

  const periodRevenue = recentInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const periodInvoices = recentInvoices.length;
  const periodPaid = recentInvoices.filter(i => i.status === 'paid').length;
  const conversionRate = periodInvoices ? Math.round((periodPaid / periodInvoices) * 100) : 0;

  // Top clients by revenue
  const clientMap = new Map<string, { name: string; total: number; count: number }>();
  invoices.filter(i => i.status === 'paid').forEach(inv => {
    const name = inv.clients?.name || 'Unknown';
    const existing = clientMap.get(name) || { name, total: 0, count: 0 };
    clientMap.set(name, { name, total: existing.total + inv.total, count: existing.count + 1 });
  });
  const topClients = Array.from(clientMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);

  // Status breakdown for donut
  const statusData = [
    { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: '#10b981' },
    { label: 'Sent', value: invoices.filter(i => i.status === 'sent').length, color: '#3b82f6' },
    { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: '#ef4444' },
    { label: 'Draft', value: invoices.filter(i => i.status === 'draft').length, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  // Bar chart dimensions
  const maxBar = Math.max(...monthlyData.map(m => Math.max(m.revenue, m.outstanding)), 1);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <div className="loading loading-dark"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p className="page-subtitle">Revenue, tax, and cash flow overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['3m', '6m', '12m'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ background: period === p ? undefined : 'white' }}
            >
              {p === '3m' ? '3 Months' : p === '6m' ? '6 Months' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <SummaryCard title="Total Revenue" value={formatCurrency(totalRevenue, currencyCode)} sub="All paid invoices" icon="💰" accent="#10b981" />
        <SummaryCard title="Outstanding" value={formatCurrency(totalOutstanding, currencyCode)} sub="Awaiting payment" icon="⏳" accent="#3b82f6" />
        <SummaryCard title="Overdue" value={formatCurrency(totalOverdue, currencyCode)} sub="Past due date" icon="⚠️" accent="#ef4444" />
        <SummaryCard title="Tax Collected" value={formatCurrency(totalTax, currencyCode)} sub="Paid invoices only" icon="🧾" accent="#8b5cf6" />
        <SummaryCard title="Discounts Given" value={formatCurrency(totalDiscount, currencyCode)} sub="Paid invoices only" icon="🏷️" accent="#f59e0b" />
        <SummaryCard title={`${period} Conversion`} value={`${conversionRate}%`} sub={`${periodPaid}/${periodInvoices} invoices paid`} icon="📈" accent="#06b6d4" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        {/* Revenue Bar Chart */}
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-900)' }}>Revenue Trend</h2>
              <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 2 }}>Last {periodMonths} months</p>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} />
                Revenue
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f618', border: '2px solid #3b82f6', display: 'inline-block' }} />
                Outstanding
              </span>
            </div>
          </div>
          <BarChart data={monthlyData} max={maxBar} currencyCode={currencyCode} />
        </div>

        {/* Status Donut */}
        <div className="card" style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 8 }}>Invoice Status</h2>
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 24 }}>All time breakdown</p>
          {statusData.length > 0 ? (
            <DonutChart data={statusData} total={invoices.length} />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gray-400)', fontSize: 14 }}>
              No invoices yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        {/* Top Clients */}
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 4 }}>Top Clients by Revenue</h2>
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 24 }}>Paid invoices only</p>
          {topClients.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--color-gray-400)', padding: 32, fontSize: 14 }}>No paid invoices yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topClients.map((client, i) => {
                const pct = totalRevenue ? (client.total / totalRevenue) * 100 : 0;
                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
                return (
                  <div key={client.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: `${colors[i]}20`,
                          color: colors[i], display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700
                        }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-gray-900)' }}>{client.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>{client.count} invoice{client.count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-gray-900)' }}>{formatCurrency(client.total, currencyCode)}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'var(--color-gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors[i], borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tax Summary */}
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-900)', marginBottom: 4 }}>Tax Summary</h2>
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 24 }}>Based on paid invoices</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <TaxRow label="Total Gross Revenue" value={formatCurrency(invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.subtotal, 0), currencyCode)} />
            <TaxRow label="Total Discounts" value={`-${formatCurrency(totalDiscount, currencyCode)}`} accent="#ef4444" />
            <TaxRow label="Net Revenue (ex. tax)" value={formatCurrency(totalRevenue - totalTax, currencyCode)} />
            <TaxRow label="Total Tax Collected" value={formatCurrency(totalTax, currencyCode)} accent="#8b5cf6" bold />
            <div style={{ height: 1, background: 'var(--color-gray-200)', margin: '12px 0' }} />
            <TaxRow label="Total Invoiced (incl. tax)" value={formatCurrency(totalRevenue, currencyCode)} bold accent="#10b981" />
          </div>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--color-gray-50)', borderRadius: 10, border: '1px solid var(--color-gray-200)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-gray-500)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Outstanding Tax (unpaid invoices)
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-gray-900)' }}>
              {formatCurrency(invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.tax_amount, 0), currencyCode)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 4 }}>Will be collectible when invoices are paid</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function SummaryCard({ title, value, sub, icon, accent }: { title: string; value: string; sub: string; icon: string; accent: string }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${accent}18`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-gray-900)', marginBottom: 4, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-gray-400)' }}>{sub}</div>
    </div>
  );
}

function TaxRow({ label, value, accent, bold }: { label: string; value: string; accent?: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-gray-100)' }}>
      <span style={{ fontSize: 13, color: 'var(--color-gray-600)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: bold ? 700 : 500, color: accent || 'var(--color-gray-900)' }}>{value}</span>
    </div>
  );
}

function BarChart({ data, max, currencyCode }: { data: { label: string; revenue: number; outstanding: number }[]; max: number; currencyCode: string }) {
  const height = 180;
  const barWidth = Math.max(16, Math.min(40, Math.floor(480 / data.length / 2.5)));
  const gap = barWidth * 0.6;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${Math.max(400, data.length * (barWidth * 2 + gap + 12) + 40)} ${height + 60}`} style={{ width: '100%', minWidth: 300 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <g key={pct}>
            <line x1="0" y1={height - height * pct} x2="100%" y2={height - height * pct} stroke="#f1f5f9" strokeWidth="1" />
            <text x="0" y={height - height * pct - 4} fontSize="10" fill="#94a3b8">
              {pct === 0 ? '' : formatCurrency(max * pct, currencyCode).replace(/\.00$/, '')}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = 40 + i * (barWidth * 2 + gap + 12);
          const revH = max ? (d.revenue / max) * height : 0;
          const outH = max ? (d.outstanding / max) * height : 0;
          return (
            <g key={d.label}>
              {/* Revenue bar */}
              <rect x={x} y={height - revH} width={barWidth} height={revH} fill="#10b981" rx="4" opacity="0.9" />
              {/* Outstanding bar */}
              <rect x={x + barWidth + 3} y={height - outH} width={barWidth} height={outH} fill="#3b82f618" stroke="#3b82f6" strokeWidth="1.5" rx="4" />
              {/* Label */}
              <text x={x + barWidth} y={height + 18} fontSize="11" fill="#64748b" textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
        {/* Base line */}
        <line x1="0" y1={height} x2="100%" y2={height} stroke="#e2e8f0" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function DonutChart({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) {
  const size = 160;
  const r = 58;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map(d => {
    const pct = d.value / total;
    const dash = circumference * pct;
    const slice = { ...d, pct, dash, offset, gap: 2 };
    offset += dash;
    return slice;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {slices.map((s, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${s.dash - 2} ${circumference - s.dash + 2}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-gray-900)', lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 2 }}>total</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-gray-600)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: 'inline-block' }} />
              {d.label}
            </span>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-gray-900)' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
