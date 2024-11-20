'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { 
  Briefcase, 
  PlusCircle, 
  MinusCircle, 
  Trash2,
  DollarSign,
  FileText,
  RefreshCcw,
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

// 動態導入 Bar 元件
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false })

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

type Currency = 'TWD' | 'JPY' | 'USD'

interface ExchangeRate {
  currency: Currency;
  rate: number;
  lastUpdated: string;
}

interface PrepItem {
  id: number;
  type: 'hotel' | 'flight' | 'transport' | 'other';
  name: string;
  status: 'pending' | 'completed';
  cost: number;
  currency: Currency;
  dueDate: string;
  notes?: string;
}

interface Tour {
  id: number;
  name: string;
  date: string;
  entries: Entry[];
  prepItems: PrepItem[];
}

interface Entry {
  id: number;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  currency: Currency;
  date: string;
  amountTWD?: number;
}

interface EditState {
  isEditing: boolean;
  editingId: number | null;
  editingType: 'entry' | 'prepItem' | null;
}

const EXCHANGE_RATE_API_URL = 'https://api.coolman.tw/tw/exchange/bank/taiwan-bank'
const BACKUP_EXCHANGE_RATE_API_URL = 'https://api.example.com/exchange-rates'

const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('保存到本地存儲失敗:', error)
  }
}

const getFromLocalStorage = (key: string, defaultValue: any): any => {
  try {
    const savedData = localStorage.getItem(key)
    return savedData ? JSON.parse(savedData) : defaultValue
  } catch (error) {
    console.error('從本地存儲讀取失敗:', error)
    return defaultValue
  }
}

export default function Page(): JSX.Element {
  const [tours, setTours] = useState<Tour[]>(() => {
    if (typeof window !== 'undefined') {
      return getFromLocalStorage('tourData', [])
    }
    return []
  })

  const [exchangeRates, setExchangeRates] = useState<{ [key in Currency]: ExchangeRate }>({
    TWD: { currency: 'TWD', rate: 1, lastUpdated: new Date().toISOString() },
    JPY: { currency: 'JPY', rate: 0.22, lastUpdated: new Date().toISOString() },
    USD: { currency: 'USD', rate: 31.5, lastUpdated: new Date().toISOString() }
  })

  const [isUpdatingRates, setIsUpdatingRates] = useState(false)
  const [currentTour, setCurrentTour] = useState<Tour | null>(null)
  const [showNewTourForm, setShowNewTourForm] = useState(false)

  const fetchExchangeRates = async () => {
    setIsUpdatingRates(true)
    try {
      const response = await fetch(EXCHANGE_RATE_API_URL)
      if (!response.ok) throw new Error('匯率 API 請求失敗')
      const data = await response.json()
      const now = new Date().toISOString()
      setExchangeRates({
        TWD: { currency: 'TWD', rate: 1, lastUpdated: now },
        JPY: { 
          currency: 'JPY', 
          rate: 1 / parseFloat(data.data.find((rate: any) => rate.currency === 'JPY')?.buy || '0.22'), 
          lastUpdated: now 
        },
        USD: { 
          currency: 'USD', 
          rate: parseFloat(data.data.find((rate: any) => rate.currency === 'USD')?.buy || '31.5'), 
          lastUpdated: now 
        }
      })
    } catch (error) {
      console.error('匯率更新失敗:', error)
    } finally {
      setIsUpdatingRates(false)
    }
  }

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
    const newTour: Tour = {
      id: tours.length + 1,
      name: `團隊${tours.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      entries: [],
      prepItems: []
    }
    const updatedTours = [...tours, newTour]
    setTours(updatedTours)
    saveToLocalStorage('tourData', updatedTours)
    setShowNewTourForm(false)
  }

  const handleExportExcel = async () => {
    if (!currentTour) return
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      const entriesSheet = XLSX.utils.json_to_sheet(
        currentTour.entries.map(e => ({
          日期: e.date,
          說明: e.description,
          類型: e.type,
          金額: e.amount,
          幣種: e.currency
        }))
      )
      XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Entries')
      XLSX.writeFile(workbook, `${currentTour.name}-report.xlsx`)
    } catch (error) {
      console.error('匯出失敗:', error)
    }
  }

  useEffect(() => {
    fetchExchangeRates()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-indigo-600">旅行團收支管理</h1>
        </div>

        {/* 新增團體 */}
        <button
          onClick={() => setShowNewTourForm(!showNewTourForm)}
          className="mb-4 px-4 py-2 bg-indigo-500 text-white rounded-md"
        >
          {showNewTourForm ? '取消' : '新增團體'}
        </button>
        {showNewTourForm && (
          <form onSubmit={handleAddTour} className="mb-4">
            <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md">
              確定新增
            </button>
          </form>
        )}

        {/* 匯率 */}
        <button
          onClick={fetchExchangeRates}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md"
          disabled={isUpdatingRates}
        >
          {isUpdatingRates ? '更新中...' : '更新匯率'}
        </button>

        {/* 旅遊團體選擇 */}
        <div className="mb-4">
          <select
            value={currentTour?.id || ''}
            onChange={e => setCurrentTour(tours.find(t => t.id === Number(e.target.value)) || null)}
            className="p-2 border rounded-md"
          >
            <option value="">選擇團體</option>
            {tours.map(tour => (
              <option key={tour.id} value={tour.id}>
                {tour.name}
              </option>
            ))}
          </select>
        </div>

        {/* 團體資訊 */}
        {currentTour && (
          <div>
            <h2 className="text-xl font-semibold">{currentTour.name}</h2>
            <button
              onClick={handleExportExcel}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md"
            >
              匯出報表
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
