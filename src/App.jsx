import { useState, useRef } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import Tesseract from 'tesseract.js'

/* ── helpers ── */
const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const initialBills = [
  { id: 1, name: 'Rent',        amount: 2200, category: 'Housing',       dueDay: 1,  status: 'Paid' },
  { id: 2, name: 'Electricity', amount: 95,   category: 'Utilities',     dueDay: 5,  status: 'Unpaid' },
  { id: 3, name: 'Internet',    amount: 49,   category: 'Utilities',     dueDay: 8,  status: 'Unpaid' },
  { id: 4, name: 'Netflix',     amount: 18,   category: 'Subscriptions', dueDay: 12, status: 'Paid' },
  { id: 5, name: 'Spotify',     amount: 12,   category: 'Subscriptions', dueDay: 15, status: 'Unpaid' },
  { id: 6, name: 'Phone',       amount: 40,   category: 'Utilities',     dueDay: 20, status: 'Unpaid' },
  { id: 7, name: 'Gym',         amount: 80,   category: 'Health',        dueDay: 25, status: 'Paid' },
  { id: 8, name: 'Insurance',   amount: 150,  category: 'Insurance',     dueDay: 28, status: 'Unpaid' },
]

const CATEGORIES = ['Housing', 'Utilities', 'Subscriptions', 'Health', 'Insurance', 'Food', 'Transport', 'Other']

const CAT_COLOR = {
  Housing: '#6366f1', Utilities: '#1CB0F6', Subscriptions: '#CE82FF',
  Health: '#58CC02', Insurance: '#FFC800', Food: '#FF4B4B',
  Transport: '#14b8a6', Other: '#AFAFAF',
}

const emptyForm = { name: '', amount: '', category: 'Utilities', dueDay: '', status: 'Unpaid' }

const MASCOTS = {
  happy:   '/mascot-happy.png',
  crash:   '/mascot-crash.png',
  secure:  '/mascot-secure.png',
  work:    '/mascot-work.png',
  goal:    '/mascot-goal.png',
  worried: '/mascot-worried.png',
}

/* ── icons ── */
const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)
const IconList = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="3" cy="6" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="3" cy="12" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="3" cy="18" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
)
const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 21H3"/><path d="M21 3v18"/><rect x="6" y="10" width="4" height="11" rx="1"/>
    <rect x="13" y="6" width="4" height="15" rx="1"/>
  </svg>
)
const IconPlus = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

/* ── custom tooltip for chart ── */
const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '2px solid #E5E5E5', borderRadius: 12, padding: '8px 14px', fontFamily: 'Nunito, sans-serif', fontWeight: 800 }}>
      <p style={{ color: '#4B4B4B', fontSize: 13 }}>{payload[0].name}</p>
      <p style={{ color: '#58CC02', fontSize: 15 }}>{fmt(payload[0].value)}</p>
    </div>
  )
}

/* ════════════════════════════════════════ */
export default function App() {
  const [bills, setBills] = useState(initialBills)
  const [form, setForm] = useState(emptyForm)
  const [tab, setTab] = useState('home')
  const [scanState, setScanState] = useState('idle') // 'idle' | 'scanning' | 'done' | 'error'
  const nextId = useRef(9)
  const scanInputRef = useRef(null)
  const today = new Date().getDate()

  async function handleScanFile(file) {
    setScanState('scanning')
    const url = URL.createObjectURL(file)
    try {
      const worker = await Tesseract.createWorker('eng')
      const { data: { text } } = await worker.recognize(url)
      await worker.terminate()
      URL.revokeObjectURL(url)
      const parsed = parseOCRText(text)
      setForm(f => ({ ...f, ...parsed }))
      setScanState(parsed.amount || parsed.name ? 'done' : 'error')
    } catch {
      URL.revokeObjectURL(url)
      setScanState('error')
    }
  }

  function resetScan() {
    setScanState('idle')
    if (scanInputRef.current) scanInputRef.current.value = ''
  }

  const daysUntil = (d) => d - today

  /* derived */
  const totalSpend  = bills.reduce((s, b) => s + b.amount, 0)
  const paidTotal   = bills.filter(b => b.status === 'Paid').reduce((s, b) => s + b.amount, 0)
  const outstanding = totalSpend - paidTotal
  const dueSoon     = bills.filter(b => b.status === 'Unpaid' && daysUntil(b.dueDay) >= 0 && daysUntil(b.dueDay) <= 7)
  const overdue     = bills.filter(b => b.status === 'Unpaid' && daysUntil(b.dueDay) < 0)
  const paidPct     = totalSpend > 0 ? Math.round((paidTotal / totalSpend) * 100) : 0

  /* handlers */
  const addBill = () => {
    if (!form.name.trim() || !form.amount || !form.dueDay) return
    setBills(p => [...p, {
      id: nextId.current++,
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      category: form.category,
      dueDay: parseInt(form.dueDay),
      status: form.status,
    }])
    setForm(emptyForm)
    setScanState('idle')
    setTab('bills')
  }

  const togglePaid = (id) =>
    setBills(p => p.map(b => b.id === id ? { ...b, status: b.status === 'Paid' ? 'Unpaid' : 'Paid' } : b))

  const deleteBill = (id) => setBills(p => p.filter(b => b.id !== id))

  const sortedBills = [...bills].sort((a, b) => a.dueDay - b.dueDay)

  /* category chart data */
  const catMap = {}
  for (const b of bills) catMap[b.category] = (catMap[b.category] || 0) + b.amount
  const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  const payData = [{ name: 'Paid', value: paidTotal }, { name: 'Outstanding', value: outstanding }]

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: '#F7F7F7', position: 'relative', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── content pages ── */}
      <div className="page-content">

        {/* ══ HOME ══ */}
        {tab === 'home' && (
          <div style={{ padding: '20px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <h1 style={{ fontWeight: 900, fontSize: 26, color: '#4B4B4B', marginBottom: 2 }}>Billy</h1>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#AFAFAF' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <img src={MASCOTS.work} alt="Billy mascot" style={{ width: 80, height: 80, objectFit: 'contain' }} />
            </div>
            <div style={{ marginBottom: 16 }} />

            {/* Progress bar */}
            <div className="duo-card" style={{ padding: '18px 18px 16px', marginBottom: 16 }}>
              {paidPct === 100 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img src={MASCOTS.goal} alt="Goal reached" style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 900, fontSize: 17, color: '#58CC02', marginBottom: 2 }}>All paid up! 🎉</p>
                    <p style={{ fontWeight: 800, fontSize: 13, color: '#AFAFAF' }}>You cleared {fmt(paidTotal)} this month</p>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 900, fontSize: 14, color: '#AFAFAF', textTransform: 'uppercase', letterSpacing: '.06em' }}>Monthly progress</span>
                    <span style={{ fontWeight: 900, fontSize: 16, color: '#58CC02' }}>{paidPct}%</span>
                  </div>
                  <div className="duo-progress">
                    <span style={{ width: `${paidPct}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#58CC02' }}>{fmt(paidTotal)} paid</span>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#FF4B4B' }}>{fmt(outstanding)} left</span>
                  </div>
                </>
              )}
            </div>

            {/* Stat pills row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <StatCard label="Total" value={fmt(totalSpend)} dot="#4B4B4B" />
              <StatCard label="Paid" value={fmt(paidTotal)} dot="#58CC02" />
              <StatCard label="Outstanding" value={fmt(outstanding)} dot="#FF4B4B" />
              <StatCard label="Due soon" value={`${dueSoon.length} bills`} dot="#FFC800" />
            </div>

            {/* Alert banners */}
            {overdue.length > 0 && (
              <div className="banner bad" style={{ marginBottom: 10 }}>
                <img src={MASCOTS.crash} alt="Overdue" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
                <span>{overdue.length} bill{overdue.length > 1 ? 's' : ''} overdue — {overdue.map(b => b.name).join(', ')}</span>
              </div>
            )}
            {dueSoon.length > 0 && (
              <div className="banner good" style={{ marginBottom: 10 }}>
                <img src={MASCOTS.worried} alt="Due soon" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
                <span>{dueSoon.length} bill{dueSoon.length > 1 ? 's' : ''} due soon</span>
              </div>
            )}
            {bills.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#AFAFAF', fontWeight: 800 }}>
                No bills yet — tap + to add one
              </div>
            )}
          </div>
        )}

        {/* ══ BILLS ══ */}
        {tab === 'bills' && (
          <div style={{ padding: '20px 16px 0' }}>
            <h2 style={{ fontWeight: 900, fontSize: 22, color: '#4B4B4B', marginBottom: 16 }}>Bills</h2>

            {bills.length === 0 ? (
              <div className="duo-card" style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ fontWeight: 800, color: '#AFAFAF', fontSize: 15 }}>No bills yet — tap + to add one</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sortedBills.map(bill => {
                  const d = daysUntil(bill.dueDay)
                  const isPaid = bill.status === 'Paid'
                  const isOverdue = !isPaid && d < 0
                  const isSoon = !isPaid && d >= 0 && d <= 7

                  return (
                    <div key={bill.id} className="duo-card" style={{
                      padding: '14px 16px',
                      borderColor: isOverdue ? '#FFCFCF' : isSoon ? '#FFE8A3' : '#E5E5E5',
                      background: isOverdue ? '#FFFAFA' : isSoon ? '#FFFDF0' : '#fff',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                            background: CAT_COLOR[bill.category] + '22',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18,
                          }}>
                            {catEmoji(bill.category)}
                          </span>
                          <div>
                            <p style={{ fontWeight: 900, fontSize: 15, color: '#4B4B4B' }}>{bill.name}</p>
                            <p style={{ fontWeight: 700, fontSize: 12, color: '#AFAFAF' }}>
                              {bill.category} · Day {bill.dueDay}
                              {isOverdue && <span style={{ color: '#FF4B4B', marginLeft: 4 }}>overdue</span>}
                              {isSoon && <span style={{ color: '#FF9600', marginLeft: 4 }}>due soon</span>}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 900, fontSize: 17, color: '#4B4B4B' }}>{fmt(bill.amount)}</p>
                          <span style={{
                            display: 'inline-block', marginTop: 2,
                            fontWeight: 800, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase',
                            padding: '3px 9px', borderRadius: 999,
                            background: isPaid ? '#E5FCC8' : '#F7F7F7',
                            color: isPaid ? '#3a7700' : '#AFAFAF',
                          }}>
                            {isPaid ? '✓ Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={`duo-btn-sm ${isPaid ? 'ghost' : 'ghost'}`}
                          style={{ flex: 1, color: isPaid ? '#777' : '#1CB0F6' }}
                          onClick={() => togglePaid(bill.id)}
                        >
                          {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                        <button className="duo-btn-sm red" onClick={() => deleteBill(bill.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ ADD ══ */}
        {tab === 'add' && (
          <div style={{ padding: '20px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <img src={MASCOTS.secure} alt="Secure" style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <h2 style={{ fontWeight: 900, fontSize: 22, color: '#4B4B4B', marginBottom: 2 }}>Add a Bill</h2>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#AFAFAF' }}>Fill in the details below</p>
              </div>
            </div>

            {/* ── Scan UI ── */}
            <input
              ref={scanInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => e.target.files[0] && handleScanFile(e.target.files[0])}
            />

            {scanState === 'idle' && (
              <button
                className="duo-btn ghost"
                style={{ marginBottom: 14 }}
                onClick={() => scanInputRef.current?.click()}
              >
                📷 Scan a Bill
              </button>
            )}

            {scanState === 'scanning' && (
              <div className="duo-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <img src={MASCOTS.worried} alt="Scanning" style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 900, fontSize: 15, color: '#4B4B4B', marginBottom: 6 }}>Reading your bill…</p>
                  <div className="scan-spinner" />
                </div>
              </div>
            )}

            {scanState === 'done' && (
              <div className="banner good" style={{ marginBottom: 14, justifyContent: 'space-between' }}>
                <span>✓ Filled in what we found — check the fields below</span>
                <button onClick={resetScan} style={{ background: 'none', border: 'none', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 13, color: '#3a7700', cursor: 'pointer', flexShrink: 0 }}>Scan again</button>
              </div>
            )}

            {scanState === 'error' && (
              <div className="banner bad" style={{ marginBottom: 14, justifyContent: 'space-between' }}>
                <span>Couldn't read that bill — try a clearer photo</span>
                <button onClick={resetScan} style={{ background: 'none', border: 'none', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 13, color: '#EA2B2B', cursor: 'pointer', flexShrink: 0 }}>Try again</button>
              </div>
            )}

            <div className="duo-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Bill name">
                <input
                  style={{ ...inputStyle, ...(scanState === 'done' && form.name ? { borderLeft: '3px solid #58CC02' } : {}) }}
                  placeholder="e.g. Netflix"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="Amount ($)">
                <input
                  type="number" min="0" step="0.01"
                  style={{ ...inputStyle, ...(scanState === 'done' && form.amount ? { borderLeft: '3px solid #58CC02' } : {}) }}
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </Field>
              <Field label="Category">
                <select
                  style={{ ...inputStyle, ...(scanState === 'done' && form.category !== 'Utilities' ? { borderLeft: '3px solid #58CC02' } : {}) }}
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Due day of month">
                <input
                  type="number" min="1" max="31"
                  style={{ ...inputStyle, ...(scanState === 'done' && form.dueDay ? { borderLeft: '3px solid #58CC02' } : {}) }}
                  placeholder="1 – 31"
                  value={form.dueDay}
                  onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
                />
              </Field>
              <Field label="Status">
                <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Unpaid</option>
                  <option>Paid</option>
                </select>
              </Field>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="duo-btn green" onClick={addBill}>Add Bill</button>
              <button className="duo-btn ghost" onClick={() => { setForm(emptyForm); setScanState('idle'); setTab('bills') }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ══ CHARTS ══ */}
        {tab === 'charts' && (
          <div style={{ padding: '20px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <img src={MASCOTS.happy} alt="Insights" style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <h2 style={{ fontWeight: 900, fontSize: 22, color: '#4B4B4B', marginBottom: 2 }}>Insights</h2>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#AFAFAF' }}>Where your money goes</p>
              </div>
            </div>

            {bills.length === 0 ? (
              <div className="duo-card" style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ fontWeight: 800, color: '#AFAFAF' }}>Add bills to see your spending breakdown</p>
              </div>
            ) : (
              <>
                {/* Category donut */}
                <div className="duo-card" style={{ padding: '18px 16px 10px', marginBottom: 14 }}>
                  <p style={{ fontWeight: 900, fontSize: 15, color: '#4B4B4B', marginBottom: 2 }}>Spend by Category</p>
                  <p style={{ fontWeight: 700, fontSize: 12, color: '#AFAFAF', marginBottom: 6 }}>Tap a slice for the amount</p>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                        {catData.map(e => <Cell key={e.name} fill={CAT_COLOR[e.name] || '#AFAFAF'} />)}
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 4 }}>
                    {catData.map(e => (
                      <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLOR[e.name] || '#AFAFAF', flexShrink: 0 }} />
                        <span style={{ fontWeight: 800, fontSize: 12, color: '#777' }}>{e.name}</span>
                        <span style={{ fontWeight: 900, fontSize: 12, color: '#4B4B4B' }}>{fmt(e.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paid vs outstanding donut */}
                <div className="duo-card" style={{ padding: '18px 16px 10px', marginBottom: 14 }}>
                  <p style={{ fontWeight: 900, fontSize: 15, color: '#4B4B4B', marginBottom: 2 }}>Payment Progress</p>
                  <p style={{ fontWeight: 700, fontSize: 12, color: '#AFAFAF', marginBottom: 6 }}>{paidPct}% of monthly spend cleared</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={payData} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                        <Cell fill="#58CC02" />
                        <Cell fill="#E5E5E5" />
                      </Pie>
                      <Tooltip content={<ChartTip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#58CC02' }} />
                      <span style={{ fontWeight: 900, fontSize: 12, color: '#3a7700' }}>Paid {fmt(paidTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E5E5E5' }} />
                      <span style={{ fontWeight: 900, fontSize: 12, color: '#777' }}>Left {fmt(outstanding)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <nav className="bottom-nav">
        <button className={`nav-tab${tab === 'home' ? ' active' : ''}`} onClick={() => setTab('home')}>
          <IconHome /><span className="nav-label">Home</span>
        </button>
        <button className={`nav-tab${tab === 'bills' ? ' active' : ''}`} onClick={() => setTab('bills')}>
          <IconList /><span className="nav-label">Bills</span>
        </button>
        <button className="nav-fab" onClick={() => setTab('add')} aria-label="Add bill">
          <IconPlus />
        </button>
        <button className={`nav-tab${tab === 'charts' ? ' active' : ''}`} onClick={() => setTab('charts')}>
          <IconChart /><span className="nav-label">Insights</span>
        </button>
        {/* spacer to balance FAB */}
        <div style={{ flex: 1 }} />
      </nav>
    </div>
  )
}

/* ── sub-components ── */
function StatCard({ label, value, dot }) {
  return (
    <div className="duo-card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <span style={{ fontWeight: 800, fontSize: 11, color: '#AFAFAF', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</span>
      </div>
      <p style={{ fontWeight: 900, fontSize: 18, color: '#4B4B4B' }}>{value}</p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 800, fontSize: 12, color: '#AFAFAF', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  fontFamily: 'Nunito, sans-serif',
  fontWeight: 700,
  fontSize: 15,
  color: '#4B4B4B',
  background: '#F7F7F7',
  border: '2px solid #E5E5E5',
  borderRadius: 12,
  padding: '12px 14px',
  outline: 'none',
}

function catEmoji(cat) {
  const map = { Housing: '🏠', Utilities: '⚡', Subscriptions: '📺', Health: '💪', Insurance: '🛡️', Food: '🍔', Transport: '🚗', Other: '📦' }
  return map[cat] || '📦'
}

function parseOCRText(text) {
  const result = {}

  // Amount — look for $ + digits, or "total/due/amount" near digits
  const amtDirect = text.match(/\$\s*([\d,]+\.?\d{0,2})/)
  const amtNear   = text.match(/(?:total|amount due|balance due|pay)[^$\d]{0,20}([\d,]+\.\d{2})/i)
  const raw = amtDirect?.[1] ?? amtNear?.[1]
  if (raw) result.amount = raw.replace(/,/g, '')

  // Due day — look for "due"/"pay by"/"due date" near a date like 07/15 or Jul 15
  const dateMatch = text.match(/(?:due|pay by|due date|payment due)[^\d]{0,20}(\d{1,2})[\/\-](\d{1,2})/i)
  if (dateMatch) {
    const day = parseInt(dateMatch[2])
    if (day >= 1 && day <= 31) result.dueDay = String(day)
  }

  // Category — keyword scan
  if (/netflix|spotify|hulu|disney\+|prime video|apple tv|subscription/i.test(text)) result.category = 'Subscriptions'
  else if (/electric|electricity|gas bill|water bill|internet|wi-fi|wifi|broadband/i.test(text)) result.category = 'Utilities'
  else if (/rent|mortgage|lease/i.test(text)) result.category = 'Housing'
  else if (/insurance|geico|allstate|progressive|state farm/i.test(text)) result.category = 'Insurance'
  else if (/gym|fitness|health|medical|doctor|clinic/i.test(text)) result.category = 'Health'
  else if (/restaurant|food|grocery|groceries|doordash|ubereats/i.test(text)) result.category = 'Food'

  // Name — first clean non-trivial line
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && /[a-zA-Z]/.test(l))
  if (lines.length > 0) result.name = lines[0].substring(0, 30).replace(/[^a-zA-Z0-9 &.,-]/g, '').trim()

  return result
}
