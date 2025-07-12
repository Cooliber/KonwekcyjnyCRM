import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Euro
} from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceFilters {
  status?: string;
  district?: string;
  dateFrom?: number;
  dateTo?: number;
}

export const InvoicesModule: React.FC = () => {
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Get invoices with filters
  const invoices = useQuery(api.invoices.list, filters);
  
  // Get revenue analytics
  const revenueAnalytics = useQuery(api.invoices.getRevenueAnalytics, {
    dateFrom: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
    dateTo: Date.now(),
    groupBy: "district"
  });

  // Get revenue boost simulation
  const revenueBoost = useQuery(api.invoices.simulateRevenueBoost, {
    dateFrom: Date.now() - 30 * 24 * 60 * 60 * 1000,
    dateTo: Date.now()
  });

  // Mutations
  const updateInvoiceStatus = useMutation(api.invoices.updateStatus);
  const generatePDFData = useQuery(
    selectedInvoice ? api.invoices.generatePDFData : "skip",
    selectedInvoice ? { id: selectedInvoice._id } : "skip"
  );

  const warsawDistricts = [
    'Śródmieście', 'Mokotów', 'Wilanów', 'Żoliborz', 
    'Ursynów', 'Wola', 'Praga-Południe', 'Targówek'
  ];

  const invoiceStatuses = [
    { value: 'draft', label: 'Draft', color: 'gray', icon: <Edit className="w-4 h-4" /> },
    { value: 'sent', label: 'Sent', color: 'blue', icon: <Clock className="w-4 h-4" /> },
    { value: 'paid', label: 'Paid', color: 'green', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'overdue', label: 'Overdue', color: 'red', icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'canceled', label: 'Canceled', color: 'gray', icon: <AlertTriangle className="w-4 h-4" /> }
  ];

  const handleStatusUpdate = async (invoiceId: string, status: string) => {
    try {
      await updateInvoiceStatus({ id: invoiceId as any, status: status as any });
      toast.success('Invoice status updated successfully');
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };

  const handleExportPDF = async (invoice: any) => {
    try {
      // In a real implementation, this would generate and download a PDF
      toast.success('PDF export initiated');
      console.log('PDF Data:', generatePDFData);
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = invoiceStatuses.find(s => s.value === status);
    return statusConfig?.color || 'gray';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  };

  const renderInvoiceCard = (invoice: any) => (
    <div key={invoice._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
          <p className="text-sm text-gray-600">{invoice.contact?.name}</p>
          <div className="flex items-center space-x-2 mt-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{invoice.contact?.district}</span>
            {invoice.districtMultiplier !== 1.0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {Math.round((invoice.districtMultiplier - 1) * 100)}% premium
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(invoice.totalAmount)}
          </p>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            getStatusColor(invoice.status) === 'green' ? 'bg-green-100 text-green-800' :
            getStatusColor(invoice.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
            getStatusColor(invoice.status) === 'red' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {invoiceStatuses.find(s => s.value === invoice.status)?.icon}
            <span className="ml-1">{invoiceStatuses.find(s => s.value === invoice.status)?.label}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Issue Date:</span>
          <span>{new Date(invoice.issueDate).toLocaleDateString('pl-PL')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Due Date:</span>
          <span>{new Date(invoice.dueDate).toLocaleDateString('pl-PL')}</span>
        </div>
        {invoice.efficiencyDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Route Efficiency Discount:</span>
            <span className="text-green-600">-{formatCurrency(invoice.efficiencyDiscount)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedInvoice(invoice)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExportPDF(invoice)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Export PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        
        <select
          value={invoice.status}
          onChange={(e) => handleStatusUpdate(invoice._id, e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {invoiceStatuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Revenue Boost Metrics */}
      {revenueBoost && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Dynamic Pricing Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-blue-100">Revenue Boost</p>
                  <p className="text-2xl font-bold">
                    {revenueBoost.revenueBoost}%
                    {revenueBoost.targetMet && <span className="text-green-300 ml-2">✓ Target Met</span>}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100">Additional Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(revenueBoost.actualRevenue - revenueBoost.baselineRevenue)}
                  </p>
                </div>
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200" />
          </div>
        </div>
      )}

      {/* District Analytics */}
      {revenueAnalytics?.byDistrict && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by District</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(revenueAnalytics.byDistrict).map(([district, data]: [string, any]) => (
              <div key={district} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{district}</h4>
                  <span className="text-xs text-gray-500">
                    {Math.round((data.multiplier - 1) * 100)}% premium
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(data.revenue)}
                </p>
                <p className="text-sm text-gray-600">
                  {data.count} invoices • Avg: {formatCurrency(data.averageValue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Metrics */}
      {revenueAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(revenueAnalytics.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {revenueAnalytics.totalInvoices}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(revenueAnalytics.averageInvoiceValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Efficiency Savings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(revenueAnalytics.totalEfficiencyDiscounts)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Invoice Management
          </h1>
          <p className="text-gray-600">Dynamic pricing with Warsaw district optimization</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showAnalytics 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && renderAnalytics()}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {invoiceStatuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
            <select
              value={filters.district || ''}
              onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Districts</option>
              {warsawDistricts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <input
              type="date"
              onChange={(e) => setFilters({ 
                ...filters, 
                dateFrom: e.target.value ? new Date(e.target.value).getTime() : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <input
              type="date"
              onChange={(e) => setFilters({ 
                ...filters, 
                dateTo: e.target.value ? new Date(e.target.value).getTime() : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {invoices && invoices.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {invoices.map(renderInvoiceCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600 mb-6">Create your first invoice with dynamic pricing</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create First Invoice
            </button>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Invoice {selectedInvoice.invoiceNumber}
                </h2>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Client</p>
                    <p className="text-gray-900">{selectedInvoice.contact?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">District</p>
                    <p className="text-gray-900">{selectedInvoice.contact?.district}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Items</h3>
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(selectedInvoice.totalTax)}</span>
                    </div>
                    {selectedInvoice.efficiencyDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Route Efficiency Discount:</span>
                        <span>-{formatCurrency(selectedInvoice.efficiencyDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export for use in other components
export default InvoicesModule;
