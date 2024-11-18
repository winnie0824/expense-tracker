'use client'

import { useState } from 'react'
import { 
  Briefcase, 
  PlusCircle, 
  MinusCircle, 
  Trash2,
  DollarSign,
  Calendar,
  FileText,
  PieChart
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

type Tour = {
  id: number
  name: string
  date: string
  entries: Entry[]
}

type Entry = {
  id: number
  description: string
  type: 'income' | 'expense'
  category?: string
  amount: number
  date: string
}

export default function Home() {
  const [tours, setTours] = useState<Tour[]>([])
  const [currentTour, setCurrentTour] = useState<Tour | null>(null)
  const [showNewTourForm, setShowNewTourForm] = useState(false)
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  
  const [newTour, setNewTour] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [newEntry, setNewEntry] = useState<Omit<Entry, 'id'>>({
    description: '',
    type: 'income',
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  })

  const calculateTourStats = (tour: Tour) => {
    const totalIncome = tour.entries
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0)
    
    const totalExpense = tour.entries
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0)
    
    return {
      income: totalIncome,
      expense: totalExpense,
      profit: totalIncome - totalExpense
    }
  }

  const handleAddTour = (e: React.FormEvent) => {
    e.preventDefault()
    const newTourEntry = {
      id: tours.length + 1,
      ...newTour,
      entries: []
    }
    setTours([...tours, newTourEntry])
    setCurrentTour(newTourEntry)
    setShowNewTourForm(false)
    setNewTour({ name: '', date: new Date().toISOString().split('T')[0] })
  }

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTour) return

    const newEntryWithId = {
      id: currentTour.entries.length + 1,
      ...newEntry
    }

    const updatedTour = {
      ...currentTour,
      entries: [...currentTour.entries, newEntryWithId]
    }

    setTours(tours.map(t => t.id === currentTour.id ? updatedTour : t))
    setCurrentTour(updatedTour)
    setShowNewEntryForm(false)
    setNewEntry({
      description: '',
      type: 'income',
      category: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    })
  }

  const handleDeleteEntry = (entryId: number) => {
    if (!currentTour || !confirm('確定要刪除這筆記錄嗎？')) return

    const updatedTour = {
      ...currentTour,
      entries: currentTour.entries.filter(e => e.id !== entryId)
    }

    setTours(tours.map(t => t.id === currentTour.id ? updatedTour : t))
    setCurrentTour(updatedTour)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-75"></div>
            <div className="relative bg-white rounded-full p-4">
              <Briefcase className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
            旅行團收支管理
          </h1>
        </div>

        {/* 主要內容區 */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 p-8">
          {/* 團體選擇和新增按鈕 */}
          <div className="flex gap-4 mb-8">
            <select
              value={currentTour?.id || ''}
              onChange={e => setCurrentTour(tours.find(t => t.id === Number(e.target.value)) || null)}
              className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">選擇旅行團</option>
              {tours.map(tour => (
                <option key={tour.id} value={tour.id}>
                  {tour.name} ({tour.date})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewTourForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <PlusCircle size={20} />
              <span>新增團體</span>
            </button>
          </div>

          {/* 新增團體表單 */}
          {showNewTourForm && (
            <form onSubmit={handleAddTour} className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold mb-4">新增旅行團</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">團體名稱</label>
                  <input
                    type="text"
                    value={newTour.name}
                    onChange={e => setNewTour({ ...newTour, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">出發日期</label>
                  <input
                    type="date"
                    value={newTour.date}
                    onChange={e => setNewTour({ ...newTour, date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  建立團體
                </button>
              </div>
            </form>
          )}

          {currentTour && (
            <>
              {/* 收支統計 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {['收入', '支出', '利潤'].map((label, index) => {
                  const stats = calculateTourStats(currentTour)
                  const value = [stats.income, stats.expense, stats.profit][index]
                  const colors = [
                    'from-blue-500 to-blue-600',
                    'from-red-500 to-red-600',
                    'from-green-500 to-green-600'
                  ][index]
                  const textColors = [
                    'text-blue-600',
                    'text-red-600',
                    'text-green-600'
                  ][index]
                  const icons = [PlusCircle, MinusCircle, DollarSign][index]
                  const Icon = icons

                  return (
                    <div key={label} className="relative group">
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${colors} rounded-2xl blur opacity-75 group-hover:opacity-100 transition`}></div>
                      <div className="relative bg-white rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Icon size={20} className={textColors} />
                          <span className="font-medium">{label}</span>
                        </div>
                        <div className={`text-3xl font-bold ${textColors}`}>
                          ${value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 新增記錄按鈕和表單 */}
              <div className="mb-8">
                <button
                  onClick={() => setShowNewEntryForm(!showNewEntryForm)}
                  className="mb-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <PlusCircle size={20} />
                  <span>新增記錄</span>
                </button>

                {showNewEntryForm && (
                  <form onSubmit={handleAddEntry} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                        <input
                          type="date"
                          value={newEntry.date}
                          onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                        <select
                          value={newEntry.type}
                          onChange={e => setNewEntry({ ...newEntry, type: e.target.value as 'income' | 'expense' })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                        >
                          <option value="income">收入</option>
                          <option value="expense">支出</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                        <input
                          type="number"
                          value={newEntry.amount}
                          onChange={e => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
                        <input
                          type="text"
                          value={newEntry.description}
                          onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        新增
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 記錄列表 */}
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
                    {currentTour.entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          尚無記錄
                        </td>
                      </tr>
                    ) : (
                      currentTour.entries
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(entry => (
                          <tr key={entry.id} className="border-t hover:bg-gray-50 transition-colors">
                            <td className="p-4">{entry.date}</td>
                            <td className="p-4">{entry.description}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                                entry.type ===
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
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
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

              {/* 收支圖表 */}
              {currentTour.entries.length > 0 && (
                <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <Bar
                    data={{
                      labels: ['收入', '支出', '利潤'],
                      datasets: [{
                        label: '金額',
                        data: [
                          calculateTourStats(currentTour).income,
                          calculateTourStats(currentTour).expense,
                          calculateTourStats(currentTour).profit
                        ],
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.5)',
                          'rgba(239, 68, 68, 0.5)',
                          'rgba(16, 185, 129, 0.5)'
                        ],
                        borderColor: [
                          'rgb(59, 130, 246)',
                          'rgb(239, 68, 68)',
                          'rgb(16, 185, 129)'
                        ],
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: true,
                          text: '收支統計圖表'
                        }
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
