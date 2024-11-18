'use client'

import { useState } from 'react'

interface Entry {
  id: number
  date: string
  description: string
  type: 'income' | 'expense'
  amount: number
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, date: '2024-01-01', description: '薪資', type: 'income', amount: 50000 },
    { id: 2, date: '2024-01-02', description: '房租', type: 'expense', amount: 15000 },
  ])

  // 新增的狀態
  const [showForm, setShowForm] = useState(false)
  const [newEntry, setNewEntry] = useState<Omit<Entry, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'income',
    amount: 0
  })

  const totalIncome = entries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const totalExpense = entries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const balance = totalIncome - totalExpense

  // 新增的處理函數
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.description || !newEntry.amount) return

    setEntries([
      ...entries,
      {
        id: Math.max(0, ...entries.map(e => e.id)) + 1,
        ...newEntry
      }
    ])
    setShowForm(false)
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      description: '',
      type: 'income',
      amount: 0
    })
  }

  // 新增刪除功能
  const handleDelete = (id: number) => {
    if (confirm('確定要刪除這筆記錄嗎？')) {
      setEntries(entries.filter(entry => entry.id !== id))
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* 標題和新增按鈕 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">收支管理系統</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showForm ? '取消' : '新增記錄'}
          </button>
        </div>

        {/* 新增表單 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日期
                </label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  類型
                </label>
                <select
                  value={newEntry.type}
                  onChange={e => setNewEntry({ ...newEntry, type: e.target.value as 'income' | 'expense' })}
                  className="w-full border rounded-lg p-2"
                  required
                >
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  說明
                </label>
                <input
