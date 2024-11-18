import './globals.css'

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">收支管理系統</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">日期</th>
                <th className="text-left p-2">說明</th>
                <th className="text-left p-2">類型</th>
                <th className="text-right p-2">金額</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">2024-01-01</td>
                <td className="p-2">銷售收入</td>
                <td className="p-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    收入
                  </span>
                </td>
                <td className="p-2 text-right text-blue-600">$50,000</td>
              </tr>
              <tr className="border-b">
                <td className="p-2">2024-01-02</td>
                <td className="p-2">原料成本</td>
                <td className="p-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                    支出
                  </span>
                </td>
                <td className="p-2 text-right text-red-600">-$20,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
