'use client'
import { useState } from 'react'
import './globals.css'

type Entry = {
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
  const [showForm, setShowForm] = useState(false)
  const [newEntry, setNewEntry] = useState<Omit<Entry, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'income',
    amount: 0
  })

  // 計算總收入
  const totalIncome = entries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0)

  // 計算總支出
  const totalExpense = entries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)

  // 計算結餘
  const balance = totalIncome - totalExpense

  // 處理添加新記錄
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

  // 處理刪除記錄
  const handleDelete = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">收支管理系統</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showForm ? '取消' : '新增記錄'}
          </button>
        </div>

        {/* 顯示總覽 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 font-semibold">總收入</div>
            <div className="text-2xl font-bold text-blue-700">
              ${totalIncome.toLocaleString()}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 font-semibold">總支出</div>
            <div className="text-2xl font-bold text-red-700">
              ${totalExpense.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 font-semibold">結餘</div>
            <div className="text-2xl font-bold text-green-700">
              ${balance.toLocaleString()}
            </div>
          </div>
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
                  className="w-full border rounded p-2"
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
                  className="w-full border rounded p-2"
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
                  type="text"
                  value={newEntry.description}
                  onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  金額
                </label>
                <input
                  type="number"
                  value={newEntry.amount}
                  onChange={e => setNewEntry({ ...newEntry, amount: Number(e.target.va
