'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
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
  isEditing: boolean
  editingId: number | null
  editingType: 'entry' | 'prepItem' | null
}

// 台銀匯率 API URL (添加備用 API)
const EXCHANGE_RATE_API_URL = 'https://api.coolman.tw/tw/exchange/bank/taiwan-bank'
const BACKUP_EXCHANGE_RATE_API_URL = 'https://api.example.com/exchange-rates' // 備用 API

// 格式化日期時間
const formatDateTime = (date: Date): string => {
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
// 本地存儲操作的輔助函數
const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('保存到本地存儲失敗:', error)
    // 可以添加使用者提示
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

export default function Home() {
  const [tours, setTours] = useState<Tour[]>(() => {
    if (typeof window !== 'undefined') {
      return getFromLocalStorage('tourData', [])
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
  })

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
  // 抓取匯率
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
    // 使用備用 API 或顯示錯誤訊息
    try {
      const backupResponse = await fetch(BACKUP_EXCHANGE_RATE_API_URL)
      // 處理備用 API 邏輯...
    } catch (backupError) {
      console.error('備用匯率更新也失敗:', backupError)
    }
  } finally {
    setIsUpdatingRates(false)
  }
}

// 自動更新匯率
useEffect(() => {
  fetchExchangeRates()
  const interval = setInterval(fetchExchangeRates, 1800000) // 每30分鐘
  return () => clearInterval(interval)
}, [])

// 轉換為台幣
const convertToTWD = (amount: number, currency: Currency): number => {
  const rate = exchangeRates[currency]?.rate || 1
  return amount * rate
}
  // 計算統計數據
const calculateTourStats = (tour: Tour) => {
  const calculateTotal = (entries: Entry[], type: 'income' | 'expense') => {
    return entries
      .filter(e => e.type === type)
      .reduce((sum, e) => sum + convertToTWD(e.amount, e.currency), 0)
  }

  const totalIncome = calculateTotal(tour.entries, 'income')
  const totalExpense = calculateTotal(tour.entries, 'expense')
  
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
  saveToLocalStorage('tourData', updatedTours)
  setCurrentTour(newTourEntry)
  setShowNewTourForm(false)
  setNewTour({ name: '', date: new Date().toISOString().split('T')[0] })
}
  // 處理添加新記錄
const handleAddEntry = (e: React.FormEvent) => {
  e.preventDefault()
  if (!currentTour) return

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
    )

    const updatedTour = {
      ...currentTour,
      entries: updatedEntries
    }

    const updatedTours = tours.map(t =>
      t.id === currentTour.id ? updatedTour : t
    )

    setTours(updatedTours)
    saveToLocalStorage('tourData', updatedTours)
    setCurrentTour(updatedTour)
    setEditState({ isEditing: false, editingId: null, editingType: null })
  } else {
    // 新增記錄
    const newEntryWithId = {
      id: currentTour.entries.length + 1,
      ...newEntry,
      amountTWD: convertToTWD(newEntry.amount, newEntry.currency)
    }

    const updatedTour = {
      ...currentTour,
      entries: [...currentTour.entries, newEntryWithId]
    }

    const updatedTours = tours.map(t => 
      t.id === currentTour.id ? updatedTour : t
    )

    setTours(updatedTours)
    saveToLocalStorage('tourData', updatedTours)
    setCurrentTour(updatedTour)
  }

  setShowNewEntryForm(false)
  setNewEntry({
    description: '',
    type: 'income',
    currency: 'TWD',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  })
}
  // 處理添加準備事項
const handleAddPrepItem = (e: React.FormEvent) => {
  e.preventDefault()
  if (!currentTour) return

  if (editState.isEditing && editState.editingType === 'prepItem') {
    const updatedPrepItems = currentTour.prepItems.map(item =>
      item.id === editState.editingId
        ? {
            ...item,
            ...newPrepItem
          }
        : item
    )

    const updatedTour = {
      ...currentTour,
      prepItems: updatedPrepItems
    }

    const updatedTours = tours.map(t =>
      t.id === currentTour.id ? updatedTour : t
    )

    setTours(updatedTours)
    saveToLocalStorage('tourData', updatedTours)
    setCurrentTour(updatedTour)
    setEditState({ isEditing: false, editingId: null, editingType: null })
  } else {
    const newItemWithId = {
      id: currentTour.prepItems?.length ? Math.max(...currentTour.prepItems.map(item => item.id)) + 1 : 1,
      ...newPrepItem
    }

    const updatedTour = {
      ...currentTour,
      prepItems: [...(currentTour.prepItems || []), newItemWithId]
    }

    const updatedTours = tours.map(t => 
      t.id === currentTour.id ? updatedTour : t
    )

    setTours(updatedTours)
    saveToLocalStorage('tourData', updatedTours)
    setCurrentTour(updatedTour)
  }

  setShowPrepItemsForm(false)
  setNewPrepItem({
    type: 'hotel',
    name: '',
    status: 'pending',
    cost: 0,
    currency: 'TWD',
    dueDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
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
  saveToLocalStorage('tourData', updatedTours)
  setCurrentTour(updatedTour)
}

// 處理刪除準備事項
const handleDeletePrepItem = (itemId: number) => {
  if (!currentTour || !window.confirm('確定要刪除此準備事項？')) return

  const updatedTour = {
    ...currentTour,
    prepItems: currentTour.prepItems.filter(item => item.id !== itemId)
  }

  const updatedTours = tours.map(t => 
    t.id === currentTour.id ? updatedTour : t
  )

  setTours(updatedTours)
  saveToLocalStorage('tourData', updatedTours)
  setCurrentTour(updatedTour)
}
  // 處理刪除記錄
const handleDeleteEntry = (entryId: number) => {
  if (!currentTour || !window.confirm('確定要刪除這筆記錄嗎？')) return

  const updatedTour = {
    ...currentTour,
    entries: currentTour.entries.filter(e => e.id !== entryId)
  }

  const updatedTours = tours.map(t => 
    t.id === currentTour.id ? updatedTour : t
  )

  setTours(updatedTours)
  saveToLocalStorage('tourData', updatedTours)
  setCurrentTour(updatedTour)
}

// 處理清除所有數據
const handleClearAllData = () => {
  if (window.confirm('確定要清除所有數據嗎？此操作無法恢復！')) {
    setTours([])
    setCurrentTour(null)
    localStorage.removeItem('tourData')
  }
}

// 處理更新匯率
const handleUpdateRates = async () => {
  await fetchExchangeRates()
}

// 處理開始編輯
const handleStartEdit = (type: 'entry' | 'prepItem', id: number) => {
  setEditState({
    isEditing: true,
    editingId: id,
    editingType: type
  })

  if (type === 'entry') {
    const entry = currentTour?.entries.find(e => e.id === id)
    if (entry) {
      setNewEntry({
        description: entry.description,
        type: entry.type,
        currency: entry.currency,
        amount: entry.amount,
        date: entry.date
      })
      setShowNewEntryForm(true)
    }
  } else {
    const prepItem = currentTour?.prepItems.find(p => p.id === id)
    if (prepItem) {
      setNewPrepItem({
        type: prepItem.type,
        name: prepItem.name,
        status: prepItem.status,
        cost: prepItem.cost,
        currency: prepItem.currency,
        dueDate: prepItem.dueDate,
        notes: prepItem.notes
      })
      setShowPrepItemsForm(true)
    }
  }
}
  // 匯出 Excel
const handleExportExcel = async () => {
  if (!currentTour) return

  try {
    // 動態導入 xlsx
    const XLSX = await import('xlsx');

    // 準備準備事項數據
    const prepItemsData = currentTour.prepItems.map(item => ({
      日期: item.dueDate,
      類型: item.type === 'hotel' ? '住宿' :
           item.type === 'flight' ? '機票' :
           item.type === 'transport' ? '交通' : '其他',
      名稱: item.name,
      狀態: item.status === 'completed' ? '已完成' : '待處理',
      預估成本: item.cost,
      幣種: item.currency,
      台幣金額: convertToTWD(item.cost, item.currency),
      備註: item.notes || ''
    }));

    // 準備收支記錄數據
    const entriesData = currentTour.entries.map(entry => ({
      日期: entry.date,
      說明: entry.description,
      類型: entry.type === 'income' ? '收入' : '支出',
      金額: entry.amount,
      幣種: entry.currency,
      台幣金額: convertToTWD(entry.amount, entry.currency)
    }));

    // 準備統計數據
    const stats = calculateTourStats(currentTour);
    const summaryData = [{
      項目: '總收入',
      金額: stats.income
    }, {
      項目: '總支出',
      金額: stats.expense
    }, {
      項目: '淨利潤',
      金額: stats.profit
    }];

    const wb = XLSX.utils.book_new();
      
    // 添加準備事項表
    const ws1 = XLSX.utils.json_to_sheet(prepItemsData);
    XLSX.utils.book_append_sheet(wb, ws1, "準備事項");
      
    // 添加收支記錄表
    const ws2 = XLSX.utils.json_to_sheet(entriesData);
    XLSX.utils.book_append_sheet(wb, ws2, "收支記錄");
      
    // 添加統計表
    const ws3 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws3, "統計摘要");
      
    // 導出文件
    XLSX.writeFile(wb, `${currentTour.name}-報表.xlsx`);
  } catch (error) {
    console.error('匯出 Excel 失敗:', error);
    alert('匯出 Excel 失敗，請稍後再試');
  }
}

// 返回 JSX
return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
    {/* 這裡是整個 UI 的返回內容 */}
  </div>
)
