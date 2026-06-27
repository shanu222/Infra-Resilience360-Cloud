import { useState } from "react";
import { FileText, CheckCircle, Clock, XCircle, Send, Eye } from "lucide-react";
import { mockIssuanceRequests } from "../../data/mockData";

export function IssuanceWorkflow() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const filteredRequests = filter === "all" 
    ? mockIssuanceRequests 
    : mockIssuanceRequests.filter(r => r.status === filter);

  const selectedDetails = mockIssuanceRequests.find(r => r.id === selectedRequest);

  const statusCounts = {
    all: mockIssuanceRequests.length,
    pending: mockIssuanceRequests.filter(r => r.status === 'pending').length,
    approved: mockIssuanceRequests.filter(r => r.status === 'approved').length,
    dispatched: mockIssuanceRequests.filter(r => r.status === 'dispatched').length,
    completed: mockIssuanceRequests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Issuance Workflow</h1>
        <p className="text-gray-600">Digital material request and approval system</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === "all" 
              ? "bg-emerald-50 border-emerald-500" 
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-3xl font-bold text-gray-900 mb-1">{statusCounts.all}</div>
          <div className="text-sm text-gray-600">All Requests</div>
        </button>

        <button
          onClick={() => setFilter("pending")}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === "pending" 
              ? "bg-yellow-50 border-yellow-500" 
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-3xl font-bold text-yellow-600 mb-1">{statusCounts.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </button>

        <button
          onClick={() => setFilter("approved")}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === "approved" 
              ? "bg-green-50 border-green-500" 
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-3xl font-bold text-green-600 mb-1">{statusCounts.approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </button>

        <button
          onClick={() => setFilter("dispatched")}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === "dispatched" 
              ? "bg-blue-50 border-blue-500" 
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-3xl font-bold text-blue-600 mb-1">{statusCounts.dispatched}</div>
          <div className="text-sm text-gray-600">Dispatched</div>
        </button>

        <button
          onClick={() => setFilter("completed")}
          className={`p-4 rounded-xl border-2 transition-all ${
            filter === "completed" 
              ? "bg-purple-50 border-purple-500" 
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-3xl font-bold text-purple-600 mb-1">{statusCounts.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </button>
      </div>

      {/* Workflow Diagram */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-8 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Digital Issuance Workflow</h3>
        <div className="flex items-center justify-between">
          {[
            { icon: FileText, label: "PDMA Request", color: "blue" },
            { icon: Eye, label: "HQ Review", color: "purple" },
            { icon: CheckCircle, label: "Approval", color: "green" },
            { icon: Send, label: "Dispatch", color: "orange" },
            { icon: CheckCircle, label: "Completed", color: "emerald" },
          ].map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex items-center">
                <div className="text-center">
                  <div className={`bg-${step.color}-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`h-8 w-8 text-${step.color}-600`} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{step.label}</p>
                </div>
                {idx < 4 && (
                  <div className="w-12 h-1 bg-gray-300 mx-2"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Request #</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PDMA Office</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">District</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Assessment Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Request Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Urgency</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">{request.requestNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{request.pdmaOffice}</td>
                  <td className="px-6 py-4 text-gray-700">{request.district}</td>
                  <td className="px-6 py-4 text-gray-700">{request.assessmentType}</td>
                  <td className="px-6 py-4 text-gray-700">
                    {new Date(request.requestDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {request.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'approved' ? 'bg-green-100 text-green-700' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      request.status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                      request.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedRequest(request.id)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && selectedDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Details</h3>
                <p className="text-gray-600">{selectedDetails.requestNumber}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Request Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">PDMA Office</p>
                <p className="text-gray-900">{selectedDetails.pdmaOffice}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">District</p>
                <p className="text-gray-900">{selectedDetails.district}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Assessment Type</p>
                <p className="text-gray-900">{selectedDetails.assessmentType}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Urgency Level</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedDetails.urgency === 'high' ? 'bg-red-100 text-red-700' :
                  selectedDetails.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedDetails.urgency}
                </span>
              </div>
            </div>

            {/* Requested Materials */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Requested Materials</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {selectedDetails.requestedMaterials.map((material, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-900">{material.materialName}</span>
                    <span className="font-semibold text-gray-900">{material.quantity.toLocaleString()} units</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Request Submitted</p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedDetails.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedDetails.approvalDate && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Approved</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedDetails.approvalDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {selectedDetails.dispatchDate && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Send className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Dispatched</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedDetails.dispatchDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {selectedDetails.status === 'pending' && (
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    alert('Request rejected');
                    setSelectedRequest(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    alert('Request approved! Dispatch order generated.');
                    setSelectedRequest(null);
                  }}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors"
                >
                  Approve Request
                </button>
              </div>
            )}

            {selectedDetails.status === 'approved' && (
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    alert('Materials dispatched successfully!');
                    setSelectedRequest(null);
                  }}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Mark as Dispatched
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
