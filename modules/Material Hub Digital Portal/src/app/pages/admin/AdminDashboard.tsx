import { TrendingUp, TrendingDown, Package, AlertTriangle, FileText, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { useLiveHubData } from "../../hooks/useLiveHubData";

export function AdminDashboard() {
  const { hubs, inventory, isLoading, error } = useLiveHubData();

  const totalStock = inventory.reduce((sum, hub) => 
    sum + hub.materials.reduce((s, m) => s + m.closing, 0), 0
  );
  
  const totalDamaged = inventory.reduce((sum, hub) => 
    sum + hub.materials.reduce((s, m) => s + m.damaged, 0), 0
  );

  const avgStockPercentage = hubs.length > 0
    ? Math.round(hubs.reduce((sum, hub) => sum + hub.stockPercentage, 0) / hubs.length)
    : 0;

  const pendingRequests = 0;

  // Chart data
  const hubStockData = hubs.map(hub => ({
    name: hub.location,
    stock: hub.stockPercentage,
    damage: hub.damagePercentage,
  }));

  const statusData = [
    { name: 'Ready', value: hubs.filter((hub) => hub.status === 'ready').length },
    { name: 'Moderate', value: hubs.filter((hub) => hub.status === 'moderate').length },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  const monthlyTrend = [
    { month: 'Sep', issued: 2400, received: 3200 },
    { month: 'Oct', issued: 2800, received: 2900 },
    { month: 'Nov', issued: 3100, received: 3500 },
    { month: 'Dec', issued: 2700, received: 3100 },
    { month: 'Jan', issued: 3200, received: 3800 },
    { month: 'Feb', issued: 2900, received: 3300 },
  ];

  if (isLoading) {
    return <div className="text-gray-600">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Real-time monitoring of material hubs and operations</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Package className="h-10 w-10 opacity-80" />
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="text-3xl font-bold mb-2">{totalStock.toLocaleString()}</div>
          <div className="text-emerald-100">Total Stock Items</div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="h-10 w-10 opacity-80" />
            <span className="text-2xl font-bold">{avgStockPercentage}%</span>
          </div>
                  <div className="text-3xl font-bold mb-2">{hubs.length} Hubs</div>
          <div className="text-blue-100">Average Stock Level</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FileText className="h-10 w-10 opacity-80" />
            {pendingRequests > 0 && <span className="px-2 py-1 bg-white/20 rounded-full text-xs">Action Required</span>}
          </div>
          <div className="text-3xl font-bold mb-2">{pendingRequests}</div>
          <div className="text-orange-100">Pending Requests</div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-10 w-10 opacity-80" />
            <TrendingDown className="h-6 w-6" />
          </div>
          <div className="text-3xl font-bold mb-2">{totalDamaged.toLocaleString()}</div>
          <div className="text-red-100">Damaged Items</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hub Stock Levels */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Hub Stock & Damage Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hubStockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="stock" fill="#10b981" name="Stock %" />
              <Bar dataKey="damage" fill="#ef4444" name="Damage %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Request Status Distribution */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Issuance Request Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Material Flow Trend */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Material Flow Trend (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="issued" stroke="#3b82f6" strokeWidth={2} name="Issued" />
            <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} name="Received" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Hub Updates</h3>
          <div className="space-y-4">
            {hubs.slice(0, 3).map((hub) => (
              <div key={hub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{hub.name}</p>
                  <p className="text-sm text-gray-600">{hub.location} • {hub.district}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  hub.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {hub.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Alerts</h3>
          <div className="space-y-4">
            {hubs.filter((h) => h.damagePercentage > 10).slice(0, 2).map((hub) => (
              <div key={hub.id} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">{hub.name} Damage Risk</p>
                  <p className="text-sm text-red-700">Damage level {hub.damagePercentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/inventory"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer"
          >
            <Package className="h-8 w-8 mb-3" />
            <p className="font-semibold text-lg">Manage Inventory</p>
            <p className="text-emerald-100 text-sm">Update stock levels</p>
          </a>
          <a
            href="/admin/issuance"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer"
          >
            <FileText className="h-8 w-8 mb-3" />
            <p className="font-semibold text-lg">Review Requests</p>
            <p className="text-emerald-100 text-sm">{pendingRequests} pending approval</p>
          </a>
          <a
            href="/admin/damage"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer"
          >
            <AlertTriangle className="h-8 w-8 mb-3" />
            <p className="font-semibold text-lg">Damage Reports</p>
            <p className="text-emerald-100 text-sm">Review reported issues</p>
          </a>
        </div>
      </div>
    </div>
  );
}
