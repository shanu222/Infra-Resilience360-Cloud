import { TrendingUp, Package, DollarSign, Clock } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { mockInventory, mockHubs, mockIssuanceRequests } from "../../data/mockData";

export function Analytics() {
  // Material distribution data
  const materialDistribution = [
    { name: 'Bamboo Poles', value: 11800, percentage: 35 },
    { name: 'CGI Sheets', value: 10050, percentage: 30 },
    { name: 'EPS Panels', value: 7200, percentage: 21 },
    { name: 'Chick Mats', value: 5800, percentage: 17 },
    { name: 'Tarpaulin', value: 4200, percentage: 12 },
  ];

  // Hub performance comparison
  const hubPerformance = mockHubs.map(hub => ({
    name: hub.location,
    efficiency: 75 + Math.random() * 20,
    utilization: hub.stockPercentage,
    responseTime: 12 + Math.random() * 8,
  }));

  // Monthly trends
  const monthlyTrends = [
    { month: 'Aug', stock: 12000, issued: 2100, received: 2800, requests: 15 },
    { month: 'Sep', stock: 12700, issued: 2400, received: 3200, requests: 18 },
    { month: 'Oct', stock: 13500, issued: 2800, received: 2900, requests: 22 },
    { month: 'Nov', stock: 13600, issued: 3100, received: 3500, requests: 25 },
    { month: 'Dec', stock: 14000, issued: 2700, received: 3100, requests: 20 },
    { month: 'Jan', stock: 15100, issued: 3200, received: 3800, requests: 28 },
    { month: 'Feb', stock: 15800, issued: 2900, received: 3300, requests: 24 },
  ];

  // Issuance by district
  const districtIssuance = [
    { district: 'Gilgit', value: 3200, color: '#10b981' },
    { district: 'Muzaffargarh', value: 4100, color: '#3b82f6' },
    { district: 'Sukkur', value: 4500, color: '#8b5cf6' },
    { district: 'Ghizer', value: 2100, color: '#f59e0b' },
    { district: 'Others', value: 3600, color: '#ef4444' },
  ];

  // Response time trends
  const responseTimes = [
    { week: 'Week 1', avgTime: 18, target: 24 },
    { week: 'Week 2', avgTime: 16, target: 24 },
    { week: 'Week 3', avgTime: 14, target: 24 },
    { week: 'Week 4', avgTime: 12, target: 24 },
    { week: 'Week 5', avgTime: 15, target: 24 },
    { week: 'Week 6', avgTime: 13, target: 24 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Performance metrics and insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-10 w-10 opacity-80" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded">↑ 12%</span>
          </div>
          <div className="text-3xl font-bold mb-2">94.2%</div>
          <div className="text-emerald-100">Avg Fulfillment Rate</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-10 w-10 opacity-80" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded">↓ 18%</span>
          </div>
          <div className="text-3xl font-bold mb-2">14.5h</div>
          <div className="text-blue-100">Avg Response Time</div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Package className="h-10 w-10 opacity-80" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded">↑ 8%</span>
          </div>
          <div className="text-3xl font-bold mb-2">
            {mockInventory.reduce((sum, hub) => sum + hub.materials.reduce((s, m) => s + m.issued, 0), 0).toLocaleString()}
          </div>
          <div className="text-purple-100">Items Issued (Month)</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-10 w-10 opacity-80" />
            <span className="text-sm bg-white/20 px-2 py-1 rounded">↓ 5%</span>
          </div>
          <div className="text-3xl font-bold mb-2">3.2%</div>
          <div className="text-orange-100">Material Wastage Rate</div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Level Trends */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Stock Level Trends (7 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="stock" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Total Stock" />
              <Area type="monotone" dataKey="received" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Received" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Material Distribution */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Material Distribution by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={materialDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name.split(' ')[0]}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {materialDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hub Performance */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Hub Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hubPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="efficiency" fill="#10b981" name="Efficiency Score" />
              <Bar dataKey="utilization" fill="#3b82f6" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Trends */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Response Time Trends (Hours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responseTimes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgTime" stroke="#3b82f6" strokeWidth={3} name="Avg Response" />
              <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} name="Target (24h)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issuance & Request Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Issuance */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Issuance by District</h3>
          <div className="space-y-4">
            {districtIssuance.map((item, idx) => {
              const total = districtIssuance.reduce((sum, d) => sum + d.value, 0);
              const percentage = Math.round((item.value / total) * 100);
              
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{item.district}</span>
                    <span className="text-gray-600">{item.value.toLocaleString()} items ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all"
                      style={{ width: `${percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Request Processing Stats */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Request Processing Metrics</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-emerald-900">Approval Rate</p>
                <p className="text-3xl font-bold text-emerald-600">91.2%</p>
              </div>
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-12 w-12 text-emerald-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-1">Avg Processing</p>
                <p className="text-2xl font-bold text-blue-600">2.8 days</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-semibold text-purple-900 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">87.5%</p>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm font-semibold text-orange-900 mb-2">Peak Request Hours</p>
              <p className="text-gray-700">10:00 AM - 2:00 PM (63% of requests)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Request Trend */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Request & Fulfillment Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={3} name="Requests Received" />
            <Line yAxisId="left" type="monotone" dataKey="issued" stroke="#10b981" strokeWidth={3} name="Items Issued" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Efficiency Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">Best Performer</p>
              <p className="text-sm text-emerald-700">Gilgit Hub</p>
            </div>
          </div>
          <p className="text-sm text-emerald-800">
            Highest efficiency score (94.2%) with fastest response time of 12.3 hours
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-blue-900">Most Requested</p>
              <p className="text-sm text-blue-700">Bamboo Poles</p>
            </div>
          </div>
          <p className="text-sm text-blue-800">
            35% of total inventory, requested in 78% of all material requisitions
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-purple-900">Time Improvement</p>
              <p className="text-sm text-purple-700">18% faster</p>
            </div>
          </div>
          <p className="text-sm text-purple-800">
            Response time reduced from 17.6h to 14.5h since implementing digital workflow
          </p>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Export Reports</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold">
            Export to PDF
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
            Export to Excel
          </button>
          <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
            Generate Custom Report
          </button>
          <button className="px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold">
            Schedule Email Report
          </button>
        </div>
      </div>
    </div>
  );
}
