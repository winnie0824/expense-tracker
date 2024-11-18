'use client'

import { useState } from 'react'
import { 
  PlusCircle, 
  MinusCircle, 
  Trash2, 
  Search, 
  Calendar, 
  DollarSign,
  ArrowUpDown,
  Filter,
  PieChart,
  Wallet
} from 'lucide-react'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
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

  const filteredEntries = entries
    .filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || entry.type === typeFilter
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

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

  const handleDelete = (id: number) => {
    if (confirm('確定要刪除這筆記錄嗎？')) {
      setEntries(entries.filter(entry => entry.id !== id))
    }
  }

  const handleClearAll = () => {
    if (confirm('確定要清空所有記錄嗎？此操作無法復原！')) {
      setEntries([])
    }
  }

  return (
    <main className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Wallet className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
              收支管理系統
            </h1>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 flex items-center space-x-2"
            >
              {showForm ? (
                <>
                  <MinusCircle size={20} />
                  <span>取消</span>
                </>
              ) : (
                <>
                  <PlusCircle size={20} />
                  <span>新增記錄</span>
                </>
              )}
            </button>
            {entries.length > 0 && (
              <button
                onClick={handleClearAll}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 flex items-center space-x-2"
              >
                <Trash2 size={20} />
                <span>清空記錄</span>
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="mb-8">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>日期</span>
                  </label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                    <Filter size={16} />
                    <span>類型</span>
                  </label>
                  <select
                    value={newEntry.type}
                    onChange={e => setNewEntry({ ...newEntry, type: e.target.value as 'income' | 'expense' })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  >
                    <option value="income">收入</option>
                    <option value="expense">支出</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                    <PieChart size={16} />
                    <span>說明</span>
                  </label>
                  <input
                    type="text"
                    value={newEntry.description}
                    onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="輸入說明..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-1">
                    <DollarSign size={16} />
                    <span>金額</span>
                  </label>
                  <input
                    type="number"
                    value={newEntry.amount}
                    onChange={e => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="輸入金額..."
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-all duration-200 flex items-center space-x-2"
                >
                  <PlusCircle size={20} />
                  <span>保存</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-blue-200">
            <div className="flex items-center space-x-2 text-blue-600 font-semibold mb-2">
              <PlusCircle size={20} />
              <span>總收入</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              ${totalIncome.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-lg border border-red-200">
            <div className="flex items-center space-x-2 text-red-600 font-semibold mb-2">
              <MinusCircle size={20} />
              <span>總支出</span>
            </div>
            <div className="text-2xl font-bold text-red-700">
              ${totalExpense.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-lg border border-green-200">
            <div className="flex items-center space-x-2 text-green-600 font-semibold mb-2">
              <Wallet size={20} />
              <span>結餘</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              ${balance.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="搜尋說明..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="all">所有類型</option>
                <option value="income">僅收入</option>
                <option value="expense">僅支出</option>
              </select>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <ArrowUpDown className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="desc">最新優先</option>
                <option value="asc">最舊優先</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="text-left p-4 text-gray-600">日期</th>
                <th className="text-left p-4 text-gray-600">說明</th>
                <th className="text-left p-4 text-gray-600">類型</th>
                <th className="text-right p-4 text-gray-600">金額</th>
                <th className="text-center p-4 text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    沒有找到符合條件的記錄
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="border-t hover:bg-gray-50 transition-colors duration-150">
                    <td className="p-4">{entry.date}</td>
                    <td className="p-4">{entry.description}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                        entry.type === 'income' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.type === 'income' ? (
                          <>
                            <PlusCircle size={14} />
                            <span>收入</span>
                          </>
                        ) : (
                          <>
                            <MinusCircle size={14} />
                            <span>支出</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-medium ${
                      entry.type === 'income' ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      ${entry.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
