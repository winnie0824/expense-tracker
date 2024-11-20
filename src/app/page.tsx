'use client'

import { useState, useEffect } from 'react'
import { 
  Briefcase, 
  PlusCircle, 
  MinusCircle, 
  Trash2,
  DollarSign,
  Calendar,
  FileText,
  PieChart,
  RefreshCcw,
  Wallet,
  Edit2
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

type Currency = 'TWD' | 'JPY' | 'USD'

type ExchangeRate = {
  currency: Currency
  rate: number
  lastUpdated: string
}

type PrepItem = {
  id: number
  type: 'hotel' | 'flight' | 'transport' | 'other'
  name: string
  status: 'pending' | 'completed'
  cost: number
  currency: Currency
  dueDate: string
  notes?: string
}

type Tour = {
  id: number
  name: string
  date: string
  entries: Entry[]
  prepItems: PrepItem[]
}

type Entry = {
  id: number
  description: string
  type: 'income' | 'expense'
  amount: number
  currency: Currency
  date: string
  amountTWD?: number
}

interface EditState {
  isEditing: boolean;
  editingId: number | null;
  editingType: 'entry' | 'prepItem' | null;
}

// 台銀匯率 API URL
const EXCHANGE_RATE_API_URL = 'https://api.coolman.tw/tw/exchange/bank/taiwan-bank'

// 格式化日期時間
const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
export default function Home() {
  const [tours, setTours] = useState<Tour[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tourData')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  const [exchangeRates, setExchangeRates] = useState<{[key in Currency]: ExchangeRate}>({
    TWD: { currency: 'TWD', rate: 1, lastUpdated: new Date().toISOString() },
    JPY: { currency: 'JPY', rate: 0.22, lastUpdated: new Date().toISOString() },
    USD: { currency: 'USD', rate: 31.5, lastUpdated: new Date().toISOString() }
  })
  
  const [isUpdatingRates, setIsUpdatingRates] = useState(false)
  const [currentTour, setCurrentTour] = useState<Tour | null>(null)
  const [showNewTourForm, setShowNewTourForm] = useState(false)
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const [showPrepItemsForm, setShowPrepItemsForm] = useState(false)
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    editingId: null,
    editingType: null
  });

  const [newTour, setNewTour] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [newEntry, setNewEntry] = useState<Omit<Entry, 'id' | 'amountTWD'>>({
    description: '',
    type: 'income',
    currency: 'TWD',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  })

  const [newPrepItem, setNewPrepItem] = useState<Omit<PrepItem, 'id'>>({
    type: 'hotel',
    name: '',
    status: 'pending',
    cost: 0,
    currency: 'TWD',
    dueDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // 抓取台銀匯率
  const fetchExchangeRates = async () => {
    setIsUpdatingRates(true)
    try {
      const response = await fetch(EXCHANGE_RATE_API_URL)
      const data = await response.json()
      
      const now = new Date().toISOString()
      setExchangeRates({
        TWD: { currency: 'TWD', rate: 1, lastUpdated: now },
        JPY: { 
          currency: 'JPY', 
          rate: 1 / parseFloat(data.data.find((rate: any) => rate.currency === 'JPY').buy), 
          lastUpdated: now 
        },
        USD: { 
          currency: 'USD', 
          rate: parseFloat(data.data.find((rate: any) => rate.currency === 'USD').buy), 
          lastUpdated: now 
        }
      })
    } catch (error) {
      console.error('匯率更新失敗:', error)
    } finally {
      setIsUpdatingRates(false)
    }
  }

  // 自動更新匯率
  useEffect(() => {
    fetchExchangeRates()
    // 每30分鐘更新一次
    const interval = setInterval(fetchExchangeRates, 1800000)
    return () => clearInterval(interval)
  }, [])

  // 轉換為台幣
  const convertToTWD = (amount: number, currency: Currency) => {
    return amount * exchangeRates[currency].rate
  }

  const handleStartEdit = (type: 'entry' | 'prepItem', id: number) => {
    setEditState({
      isEditing: true,
      editingId: id,
      editingType: type
    });

    if (type === 'entry') {
      const entry = currentTour?.entries.find(e => e.id === id);
      if (entry) {
        setNewEntry({
          description: entry.description,
          type: entry.type,
          currency: entry.currency,
          amount: entry.amount,
          date: entry.date
        });
        setShowNewEntryForm(true);
      }
    } else {
      const prepItem = currentTour?.prepItems.find(p => p.id === id);
      if (prepItem) {
        setNewPrepItem({
          type: prepItem.type,
          name: prepItem.name,
          status: prepItem.status,
          cost: prepItem.cost,
          currency: prepItem.currency,
          dueDate: prepItem.dueDate,
          notes: prepItem.notes
        });
        setShowPrepItemsForm(true);
      }
    }
  };
// 計算統計數據
  const calculateTourStats = (tour: Tour) => {
    const calculateTotal = (entries: Entry[], type: 'income' | 'expense') => {
      return entries
        .filter(e => e.type === type)
        .reduce((sum, e) => sum + convertToTWD(e.amount, e.currency), 0)
    }

    const totalIncome = calculateTotal(tour.entries, 'income')
    const totalExpense = calculateTotal(tour.entries, 'expense')
    
    // 加入準備事項的預估成本
    const totalPrepCost = tour.prepItems
      ? tour.prepItems.reduce((sum, item) => sum + convertToTWD(item.cost, item.currency), 0)
      : 0
    
    return {
      income: totalIncome,
      expense: totalExpense + totalPrepCost,
      profit: totalIncome - (totalExpense + totalPrepCost)
    }
  }

  // 處理添加新團體
  const handleAddTour = (e: React.FormEvent) => {
    e.preventDefault()
    const newTourEntry = {
      id: tours.length + 1,
      ...newTour,
      entries: [],
      prepItems: []
    }
    const updatedTours = [...tours, newTourEntry]
    setTours(updatedTours)
    localStorage.setItem('tourData', JSON.stringify(updatedTours))
    setCurrentTour(newTourEntry)
    setShowNewTourForm(false)
    setNewTour({ name: '', date: new Date().toISOString().split('T')[0] })
  }

  // 處理添加新記錄
  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTour) return;

    if (editState.isEditing && editState.editingType === 'entry') {
      // 更新現有記錄
      const updatedEntries = currentTour.entries.map(entry =>
        entry.id === editState.editingId
          ? {
              ...entry,
              ...newEntry,
              amountTWD: convertToTWD(newEntry.amount, newEntry.currency)
            }
          : entry
      );

      const updatedTour = {
        ...currentTour,
        entries: updatedEntries
      };

      const updatedTours = tours.map(t =>
        t.id === currentTour.id ? updatedTour : t
      );

      setTours(updatedTours);
      localStorage.setItem('tourData', JSON.stringify(updatedTours));
      setCurrentTour(updatedTour);
      setEditState({ isEditing: false, editingId: null, editingType: null });
    } else {
      // 原有的新增邏輯
      const newEntryWithId = {
        id: currentTour.entries.length + 1,
        ...newEntry,
        amountTWD: convertToTWD(newEntry.amount, newEntry.currency)
      };

      const updatedTour = {
        ...currentTour,
        entries: [...currentTour.entries, newEntryWithId]
      };

      const updatedTours = tours.map(t => 
        t.id === currentTour.id ? updatedTour : t
      );

      setTours(updatedTours);
      localStorage.setItem('tourData', JSON.stringify(updatedTours));
      setCurrentTour(updatedTour);
    }

    setShowNewEntryForm(false);
    setNewEntry({
      description: '',
      type: 'income',
      currency: 'TWD',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    });
  }

  // 處理添加準備事項
  const handleAddPrepItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTour) return;

    if (editState.isEditing && editState.editingType === 'prepItem') {
      const updatedPrepItems = currentTour.prepItems.map(item =>
        item.id === editState.editingId
          ? {
              ...item,
              ...newPrepItem
            }
          : item
      );

      const updatedTour = {
        ...currentTour,
        prepItems: updatedPrepItems
      };

      const updatedTours = tours.map(t =>
        t.id === currentTour.id ? updatedTour : t
      );

      setTours(updatedTours);
      localStorage.setItem('tourData', JSON.stringify(updatedTours));
      setCurrentTour(updatedTour);
      setEditState({ isEditing: false, editingId: null, editingType: null });
    } else {
      const newItemWithId = {
        id: currentTour.prepItems?.length ? Math.max(...currentTour.prepItems.map(item => item.id)) + 1 : 1,
        ...newPrepItem
      };

      const updatedTour = {
        ...currentTour,
        prepItems: [...(currentTour.prepItems || []), newItemWithId]
      };

      const updatedTours = tours.map(t => 
        t.id === currentTour.id ? updatedTour : t
      );

      setTours(updatedTours);
      localStorage.setItem('tourData', JSON.stringify(updatedTours));
      setCurrentTour(updatedTour);
    }

    setShowPrepItemsForm(false);
    setNewPrepItem({
      type: 'hotel',
      name: '',
      status: 'pending',
      cost: 0,
      currency: 'TWD',
      dueDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  }

  // 處理更新準備事項狀態
  const handleUpdatePrepItemStatus = (itemId: number, status: 'pending' | 'completed') => {
    if (!currentTour) return

    const updatedTour = {
      ...currentTour,
      prepItems: currentTour.prepItems.map(item =>
        item.id === itemId ? { ...item, status } : item
      )
    }

    const updatedTours = tours.map(t => 
      t.id === currentTour.id ? updatedTour : t
    )

    setTours(updatedTours)
    localStorage.setItem('tourData', JSON.stringify(updatedTours))
    setCurrentTour(updatedTour)
  }

  // 處理刪除準備事項
  const handleDeletePrepItem = (itemId: number) => {
    if (!currentTour || !confirm('確定要刪除此準備事項？')) return

    const updatedTour = {
      ...currentTour,
      prepItems: currentTour.prepItems.filter(item => item.id !== itemId)
    }

    const updatedTours = tours.map(t => 
      t.id === currentTour.id ? updatedTour : t
    )

    setTours(updatedTours)
    localStorage.setItem('tourData', JSON.stringify(updatedTours))
    setCurrentTour(updatedTour)
  }

  // 處理刪除記錄
  const handleDeleteEntry = (entryId: number) => {
    if (!currentTour || !confirm('確定要刪除這筆記錄嗎？')) return

    const updatedTour = {
      ...currentTour,
      entries: currentTour.entries.filter(e => e.id !== entryId)
    }

    const updatedTours = tours.map(t => 
      t.id === currentTour.id ? updatedTour : t
    )

    setTours(updatedTours)
    localStorage.setItem('tourData', JSON.stringify(updatedTours))
    setCurrentTour(updatedTour)
  }

  // 處理清除所有數據
  const handleClearAllData = () => {
    if (confirm('確定要清除所有數據嗎？此操作無法恢復！')) {
      setTours([])
      setCurrentTour(null)
      localStorage.removeItem('tourData')
    }
  }

  // 處理更新匯率
  const handleUpdateRates = async () => {
    await fetchExchangeRates()
  }
return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
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
          <div className="space-x-2">
            <button
              onClick={handleUpdateRates}
              className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUpdatingRates}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative flex items-center gap-2">
                <RefreshCcw size={20} className={isUpdatingRates ? 'animate-spin' : ''} />
                <span>更新匯率</span>
              </div>
            </button>
            <button
              onClick={handleClearAllData}
              className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative flex items-center gap-2">
                <Trash2 size={20} />
                <span>清除所有數據</span>
              </div>
            </button>
          </div>
        </div>

        {/* 匯率資訊 */}
        <div className="mb-8 bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">即時匯率</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(exchangeRates).map(rate => (
              <div key={rate.currency} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{rate.currency}/TWD</span>
                  <span className="text-lg font-semibold">
                    {rate.currency === 'TWD' ? '1.0000' : rate.rate.toFixed(4)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  更新時間: {new Date(rate.lastUpdated).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
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
              className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative flex items-center gap-2">
                <PlusCircle size={20} />
                <span>新增團體</span>
              </div>
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
                          NT$ {value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
{/* 準備事項區域 */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">準備事項清單</h3>
                  <button
                    onClick={() => setShowPrepItemsForm(!showPrepItemsForm)}
                    className="group relative overflow-hidden px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                    <div className="relative flex items-center gap-2">
                      <PlusCircle size={16} />
                      <span>新增準備事項</span>
                    </div>
                  </button>
                </div>

                {/* 準備事項表單 */}
                {showPrepItemsForm && (
                  <form onSubmit={handleAddPrepItem} className="mb-6 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">
                      {editState.isEditing && editState.editingType === 'prepItem' ? '編輯準備事項' : '新增準備事項'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                        <select
                          value={newPrepItem.type}
                          onChange={e => setNewPrepItem({ ...newPrepItem, type: e.target.value as PrepItem['type'] })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                        >
                          <option value="hotel">住宿</option>
                          <option value="flight">機票</option>
                          <option value="transport">交通</option>
                          <option value="other">其他</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">名稱/說明</label>
                        <input
                          type="text"
                          value={newPrepItem.name}
                          onChange={e => setNewPrepItem({ ...newPrepItem, name: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                          placeholder="例：東京希爾頓飯店"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">完成期限</label>
                        <input
                          type="date"
                          value={newPrepItem.dueDate}
                          onChange={e => setNewPrepItem({ ...newPrepItem, dueDate: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">預估成本</label>
                        <input
                          type="number"
                          value={newPrepItem.cost}
                          onChange={e => setNewPrepItem({ ...newPrepItem, cost: Number(e.target.value) })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">幣種</label>
                        <select
                          value={newPrepItem.currency}
                          onChange={e => setNewPrepItem({ ...newPrepItem, currency: e.target.value as Currency })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          required
                        >
                          <option value="TWD">新台幣 (TWD)</option>
                          <option value="JPY">日圓 (JPY)</option>
                          <option value="USD">美元 (USD)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                        <input
                          type="text"
                          value={newPrepItem.notes || ''}
                          onChange={e => setNewPrepItem({ ...newPrepItem, notes: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg p-2.5"
                          placeholder="選填"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        {editState.isEditing ? '更新' : '新增'}
                      </button>
                    </div>
                  </form>
                )}

                {/* 準備事項列表 */}
                <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <th className="text-left p-4 text-gray-600">類型</th>
                        <th className="text-left p-4 text-gray-600">名稱/說明</th>
                        <th className="text-center p-4 text-gray-600">完成期限</th>
                        <th className="text-right p-4 text-gray-600">預估成本</th>
                        <th className="text-center p-4 text-gray-600">狀態</th>
                        <th className="text-center p-4 text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!currentTour.prepItems?.length ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            尚無準備事項
                          </td>
                        </tr>
                      ) : (
                        currentTour.prepItems
                          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                          .map(item => (
                            <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors">
                              <td className="p-4">
                                <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                                  {item.type === 'hotel' ? '住宿' :
                                   item.type === 'flight' ? '機票' :
                                   item.type === 'transport' ? '交通' : '其他'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="font-medium">{item.name}</div>
                                {item.notes && (
                                  <div className="text-sm text-gray-500 mt-1">{item.notes}</div>
                                )}
                              </td>
                              <td className="p-4 text-center">{item.dueDate}</td>
                              <td className="p-4 text-right">
                                {item.currency === 'TWD' ? 'NT$' : 
                                 item.currency === 'JPY' ? '¥' : 
                                 item.currency === 'USD' ? '$' : ''}{item.cost.toLocaleString()}
                                <div className="text-sm text-gray-500">
                                  ≈ NT${(convertToTWD(item.cost, item.currency)).toLocaleString()}
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <select
                                  value={item.status}
                                  onChange={e => handleUpdatePrepItemStatus(item.id, e.target.value as 'pending' | 'completed')}
                                  className={`px-3 py-1 rounded-full text-sm border ${
                                    item.status === 'completed'
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  }`}
                                >
                                  <option value="pending">待處理</option>
                                  <option value="completed">已完成</option>
                                </select>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleStartEdit('prepItem', item.id)}
                                    className="text-blue-500 hover:text-blue-700 transition-colors"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePrepItem(item.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
{/* 新增記錄按鈕和表單 */}
              <div className="mb-8">
                <button
                  onClick={() => setShowNewEntryForm(!showNewEntryForm)}
                  className="mb-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <PlusCircle size={20} />
                  <span>新增收支記錄</span>
                </button>

                {showNewEntryForm && (
                  <form onSubmit={handleAddEntry} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">
                      {editState.isEditing && editState.editingType === 'entry' ? '編輯收支記錄' : '新增收支記錄'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                        <input
                          type="date"
                          value={newEntry.date}
                          onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">類型</label>
                        <select
                          value={newEntry.type}
                          onChange={e => setNewEntry({ ...newEntry, type: e.target.value as 'income' | 'expense' })}
                          className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                          required
                        >
                          <option value="income">收入</option>
                          <option value="expense">支出</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">幣種</label>
                        <select
                          value={newEntry.currency}
                          onChange={e => setNewEntry({ ...newEntry, currency: e.target.value as Currency })}
                          className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                          required
                        >
                          <option value="TWD">新台幣 (TWD)</option>
                          <option value="JPY">日圓 (JPY)</option>
                          <option value="USD">美元 (USD)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                        <input
                          type="number"
                          value={newEntry.amount}
                          onChange={e => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                          className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
                        <input
                          type="text"
                          value={newEntry.description}
                          onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        {editState.isEditing ? '更新' : '新增'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 記錄表格 */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="text-left p-4 text-gray-600">日期</th>
                      <th className="text-left p-4 text-gray-600">說明</th>
                      <th className="text-left p-4 text-gray-600">類型</th>
                      <th className="text-right p-4 text-gray-600">金額</th>
                      <th className="text-right p-4 text-gray-600">台幣金額</th>
                      <th className="text-center p-4 text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTour.entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
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
                              {entry.currency === 'TWD' ? 'NT$' : 
                               entry.currency === 'JPY' ? '¥' : 
                               entry.currency === 'USD' ? '$' : ''}{entry.amount.toLocaleString()}
                            </td>
                            <td className={`p-4 text-right font-medium ${
                              entry.type === 'income' ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              NT${(convertToTWD(entry.amount, entry.currency)).toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleStartEdit('entry', entry.id)}
                                  className="text-blue-500 hover:text-blue-700 transition-colors"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
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
                          'rgba(59, 130, 246, 0.5)',  // 藍色
                          'rgba(239, 68, 68, 0.5)',   // 紅色
                          'rgba(16, 185, 129, 0.5)'   // 綠色
                        ],
                        borderColor: [
                          'rgb(59, 130, 246)',
                          'rgb(239, 68, 68)',
                          'rgb(16, 185, 129)'
                        ],
                        borderWidth: 1,
                        borderRadius: 8,
                        hoverBackgroundColor: [
                          'rgba(59, 130, 246, 0.7)',
                          'rgba(239, 68, 68, 0.7)',
                          'rgba(16, 185, 129, 0.7)'
                        ]
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: true,
                          text: '收支統計圖表',
                          font: {
                            size: 16,
                            weight: 'bold'
                          },
                          padding: {
                            bottom: 20
                          },
                          color: '#374151'
                        },
                        tooltip: {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          titleColor: '#374151',
                          bodyColor: '#374151',
                          bodyFont: {
                            size: 14
                          },
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderWidth: 1,
                          padding: 12,
                          displayColors: true,
                          callbacks: {
                            label: function(context) {
                              return `NT$ ${context.parsed.y.toLocaleString()}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                          },
                          ticks: {
                            callback: function(value) {
                              return 'NT$ ' + value.toLocaleString();
                            },
                            font: {
                              size: 12
                            },
                            color: '#6B7280'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            font: {
                              size: 12
                            },
                            color: '#6B7280'
                          }
                        }
                      }
                    }}
                    height={300}
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
