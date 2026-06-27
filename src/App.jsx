import { useState, useRef } from 'react'

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

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

const emptyForm = { name: '', amount: '', category: 'Utilities', dueDay: '', status: 'Unpaid' }

export default function App() {
  const [bills, setBills] = useState(initialBills)
  const [form, setForm] = useState(emptyForm)
  const nextId = useRef(9)
  const today = new Date().getDate()

  // days until due: positive = future, negative = past, within current month
  const daysUntilDue = (dueDay) => dueDay - today

  const totalSpend   = bills.reduce((s, b) => s + b.amount, 0)
  const paidTotal    = bills.filter(b => b.status === 'Paid').reduce((s, b) => s + b.amount, 0)
  const outstanding  = totalSpend - paidTotal
  const dueSoonCount = bills.filter(b =>
    b.status === 'Unpaid' && daysUntilDue(b.dueDay) >= 0 && daysUntilDue(b.dueDay) <= 7
  ).length

  const addBill = () => {
    if (!form.name.trim() || !form.amount || !form.dueDay) return
    setBills(prev => [
      ...prev,
      { id: nextId.current++, name: form.name.trim(), amount: parseFloat(form.amount),
        category: form.category, dueDay: parseInt(form.dueDay), status: form.status },
    ])
    setForm(emptyForm)
  }

  const togglePaid = (id) =>
    setBills(prev => prev.map(b =>
      b.id === id ? { ...b, status: b.status === 'Paid' ? 'Unpaid' : 'Paid' } : b
    ))

  const deleteBill = (id) => setBills(prev => prev.filter(b => b.id !== id))

  const sortedBills = [...bills].sort((a, b) => a.dueDay - b.dueDay)

  // Category breakdown
  const categoryMap = {}
  for (const b of bills) {
    categoryMap[b.category] = (categoryMap[b.category] || 0) + b.amount
  }
  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])
  const maxCatAmount = categoryEntries[0]?.[1] || 1

  const rowClass = (bill) => {
    if (bill.status === 'Paid') return 'bg-white'
    const d = daysUntilDue(bill.dueDay)
    if (d < 0) return 'bg-red-50'
    if (d <= 7) return 'bg-amber-50'
    return 'bg-white'
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Bill Tracker</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
          <StatCard label="Total Monthly" value={fmt(totalSpend)} color="text-gray-900" />
          <StatCard label="Paid This Month" value={fmt(paidTotal)} color="text-green-600" />
          <StatCard label="Outstanding" value={fmt(outstanding)} color="text-red-600" />
          <StatCard label="Due Soon" value={dueSoonCount} suffix="bills" color="text-amber-600" />
        </div>

        {/* Add Bill Form */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Add Bill</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bill name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Amount ($)"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              type="number"
              min="1"
              max="31"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Due day (1–31)"
              value={form.dueDay}
              onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))}
            />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            >
              <option>Unpaid</option>
              <option>Paid</option>
            </select>
            <button
              onClick={addBill}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Add Bill
            </button>
          </div>
        </section>

        {/* Bills List */}
        <section className="bg-white rounded-xl border border-gray-200 mb-8 overflow-hidden">
          <h2 className="text-base font-semibold text-gray-800 px-5 py-4 border-b border-gray-100">Bills</h2>

          {bills.length === 0 ? (
            <p className="text-center text-gray-400 py-16 text-sm">No bills yet — add one above</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Due Day</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBills.map(bill => {
                      const d = daysUntilDue(bill.dueDay)
                      return (
                        <tr key={bill.id} className={`${rowClass(bill)} border-b border-gray-50 last:border-0`}>
                          <td className="px-5 py-3 font-medium text-gray-900">{bill.name}</td>
                          <td className="px-3 py-3 text-gray-600">{bill.category}</td>
                          <td className="px-3 py-3 font-medium text-gray-900">{fmt(bill.amount)}</td>
                          <td className="px-3 py-3 text-gray-600">
                            {bill.dueDay}
                            {bill.status === 'Unpaid' && d < 0 && (
                              <span className="ml-1 text-xs text-red-500 font-medium">overdue</span>
                            )}
                            {bill.status === 'Unpaid' && d >= 0 && d <= 7 && (
                              <span className="ml-1 text-xs text-amber-600 font-medium">soon</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {bill.status === 'Paid' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Unpaid</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => togglePaid(bill.id)}
                                className="text-xs px-2.5 py-1 rounded-md border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                {bill.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                              </button>
                              <button
                                onClick={() => deleteBill(bill.id)}
                                className="text-xs px-2 py-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {sortedBills.map(bill => {
                  const d = daysUntilDue(bill.dueDay)
                  const bg = rowClass(bill)
                  return (
                    <div key={bill.id} className={`${bg} px-4 py-4`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{bill.name}</p>
                          <p className="text-xs text-gray-500">{bill.category} · Due day {bill.dueDay}
                            {bill.status === 'Unpaid' && d < 0 && (
                              <span className="ml-1 text-red-500 font-medium">overdue</span>
                            )}
                            {bill.status === 'Unpaid' && d >= 0 && d <= 7 && (
                              <span className="ml-1 text-amber-600 font-medium">soon</span>
                            )}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{fmt(bill.amount)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {bill.status === 'Paid' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Paid</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Unpaid</span>
                        )}
                        <button
                          onClick={() => togglePaid(bill.id)}
                          className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 transition-colors"
                        >
                          {bill.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                        <button
                          onClick={() => deleteBill(bill.id)}
                          className="text-xs px-2 py-1 rounded-md text-red-400 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>

        {/* Category Breakdown */}
        {categoryEntries.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Spend by Category</h2>
            <div className="space-y-3">
              {categoryEntries.map(([cat, total]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{cat}</span>
                    <span className="text-gray-900 font-semibold">{fmt(total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${(total / maxCatAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

function StatCard({ label, value, color, suffix }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {value}{suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}
