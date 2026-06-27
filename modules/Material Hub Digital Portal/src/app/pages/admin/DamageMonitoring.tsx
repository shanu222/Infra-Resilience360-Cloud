import { useState } from "react";
import { AlertTriangle, Camera, DollarSign, Calendar, MapPin, Eye, XCircle } from "lucide-react";
import { mockDamageReports } from "../../data/mockData";

export function DamageMonitoring() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showNewReportModal, setShowNewReportModal] = useState(false);

  const selectedDetails = mockDamageReports.find(r => r.id === selectedReport);

  const totalFinancialLoss = mockDamageReports.reduce((sum, report) => sum + report.financialLoss, 0);
  const highUrgencyReports = mockDamageReports.filter(r => r.urgencyLevel === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Damage Monitoring</h1>
          <p className="text-gray-600">Track and manage material damage across hubs</p>
        </div>
        <button
          onClick={() => setShowNewReportModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <AlertTriangle className="h-5 w-5" />
          <span>Report Damage</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-10 w-10 opacity-80" />
            <span className="text-2xl font-bold">{mockDamageReports.length}</span>
          </div>
          <div className="text-3xl font-bold mb-2">
            {mockDamageReports.reduce((sum, r) => sum + r.damagedCount, 0).toLocaleString()}
          </div>
          <div className="text-red-100">Total Damaged Items</div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-10 w-10 opacity-80" />
            <span className="px-2 py-1 bg-white/20 rounded text-xs">PKR</span>
          </div>
          <div className="text-3xl font-bold mb-2">
            {(totalFinancialLoss / 1000).toFixed(0)}K
          </div>
          <div className="text-orange-100">Estimated Financial Loss</div>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="h-10 w-10 opacity-80" />
            <span className="px-2 py-1 bg-white/20 rounded text-xs font-semibold">HIGH</span>
          </div>
          <div className="text-3xl font-bold mb-2">{highUrgencyReports}</div>
          <div className="text-amber-100">High Urgency Reports</div>
        </div>
      </div>

      {/* Damage Reports Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Damage Reports</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hub</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Material</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Damaged</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Damage %</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Financial Loss</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Report Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Urgency</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockDamageReports.map((report) => {
                const damagePercentage = Math.round((report.damagedCount / report.totalCount) * 100);
                
                return (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <span className="font-semibold text-gray-900">{report.hubName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{report.materialName}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-red-600">
                        {report.damagedCount.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm"> / {report.totalCount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-red-500"
                            style={{ width: `${damagePercentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-red-600 text-sm">{damagePercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-semibold">
                      PKR {report.financialLoss.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(report.reportDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        report.urgencyLevel === 'high' ? 'bg-red-100 text-red-700' :
                        report.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {report.urgencyLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedReport(report.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Common Damage Reasons */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Common Damage Causes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { cause: 'Humidity & Weather', count: 2, percentage: 67 },
            { cause: 'Pest Infestation', count: 1, percentage: 33 },
            { cause: 'Poor Storage', count: 1, percentage: 33 },
          ].map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900">{item.cause}</h4>
                <span className="text-2xl font-bold text-red-600">{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-red-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Reports mentioning this cause</p>
            </div>
          ))}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && selectedDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Damage Report Details</h3>
                <p className="text-gray-600">Report ID: {selectedDetails.id}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Hub & Material Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Hub Location</p>
                  <p className="text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedDetails.hubName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Material Type</p>
                  <p className="text-gray-900">{selectedDetails.materialName}</p>
                </div>
              </div>

              {/* Damage Statistics */}
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">Damaged Count</p>
                    <p className="text-3xl font-bold text-red-600">{selectedDetails.damagedCount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">Damage Rate</p>
                    <p className="text-3xl font-bold text-red-600">
                      {Math.round((selectedDetails.damagedCount / selectedDetails.totalCount) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">Financial Loss</p>
                    <p className="text-3xl font-bold text-red-600">
                      {(selectedDetails.financialLoss / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason & Timeline */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Damage Reason</p>
                <p className="text-gray-900 bg-gray-50 rounded-lg p-4">{selectedDetails.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Report Date</p>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {new Date(selectedDetails.reportDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Urgency Level</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedDetails.urgencyLevel === 'high' ? 'bg-red-100 text-red-700' :
                    selectedDetails.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedDetails.urgencyLevel}
                  </span>
                </div>
              </div>

              {/* Photos Section */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Damage Photos</p>
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-32 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    alert('Replacement order initiated');
                    setSelectedReport(null);
                  }}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors"
                >
                  Initiate Replacement
                </button>
                <button
                  onClick={() => {
                    alert('Report marked for investigation');
                    setSelectedReport(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-colors"
                >
                  Investigation Required
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Report Modal */}
      {showNewReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Report Material Damage</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hub</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option>Gilgit Material Hub</option>
                  <option>Muzaffargarh Material Hub</option>
                  <option>Sukkur Material Hub</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Material</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option>Bamboo Poles</option>
                  <option>EPS Panels</option>
                  <option>CGI Sheets</option>
                  <option>Chick Mats</option>
                  <option>Tarpaulin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Damaged Count</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Loss (PKR)</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Damage Reason</label>
                <textarea
                  rows={3}
                  placeholder="Describe the cause of damage..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency Level</label>
                <div className="flex space-x-3">
                  <button className="flex-1 py-2 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold">
                    High
                  </button>
                  <button className="flex-1 py-2 border-2 border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 font-semibold">
                    Medium
                  </button>
                  <button className="flex-1 py-2 border-2 border-gray-600 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold">
                    Low
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewReportModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Damage report submitted successfully!');
                  setShowNewReportModal(false);
                }}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
