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

  const totalIncome = entries
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const totalExpense = entries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const balance = totalIncome - totalExpense

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">收支管理系統</h1>
        
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

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4">日期</th>
                <th className="text-left p-4">說明</th>
                <th className="text-left p-4">類型</th>
                <th className="text-right p-4">金額</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-t">
                  <td className="p-4">{entry.date}</td>
                  <td className="p-4">{entry.description}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                      entry.type === 'income' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {entry.type === 'income' ? '收入' : '支出'}
                    </span>
                  </td>
                  <td className={`p-4 text-right ${
                    entry.type === 'income' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    ${entry.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
