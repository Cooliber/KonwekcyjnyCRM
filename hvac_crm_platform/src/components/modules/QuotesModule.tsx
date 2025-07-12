import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Search, FileText, Eye, CheckCircle, XCircle, Clock, Send } from "lucide-react";
import { toast } from "sonner";

export function QuotesModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const quotes = useQuery(api.quotes.list, {
    status: filterStatus || undefined,
    search: searchQuery || undefined,
  });

  const contacts = useQuery(api.contacts.list, {});
  const createQuote = useMutation(api.quotes.create);
  const updateQuote = useMutation(api.quotes.update);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contactId: "",
    validUntil: "",
    proposals: [{
      id: "1",
      title: "Standard Installation",
      description: "",
      lineItems: [{
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
        type: "labor" as "labor" | "material" | "equipment"
      }],
      subtotal: 0,
      tax: 0,
      total: 0,
      recommended: true
    }]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quoteNumber = `Q-${Date.now().toString().slice(-6)}`;
      await createQuote({
        ...formData,
        quoteNumber,
        contactId: formData.contactId as any,
        validUntil: new Date(formData.validUntil).getTime(),
      });
      toast.success("Quote created successfully");
      setShowAddForm(false);
      // Reset form
    } catch (error) {
      toast.error("Failed to create quote");
    }
  };

  const handleStatusChange = async (quoteId: string, status: string) => {
    try {
      await updateQuote({ 
        id: quoteId as any, 
        status: status as any 
      });
      toast.success("Quote status updated");
    } catch (error) {
      toast.error("Failed to update quote");
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    viewed: "bg-purple-100 text-purple-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-orange-100 text-orange-800",
  };

  const statusIcons: Record<string, any> = {
    draft: FileText,
    sent: Send,
    viewed: Eye,
    accepted: CheckCircle,
    rejected: XCircle,
    expired: Clock,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes & Proposals</h1>
          <p className="text-gray-600">Create and manage customer quotes</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quote</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Quotes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {quotes && quotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Quote</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Customer</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Total</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Valid Until</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotes.map((quote) => {
                  const StatusIcon = statusIcons[quote.status];
                  const totalAmount = quote.proposals.reduce((sum, proposal) => sum + proposal.total, 0);
                  
                  return (
                    <tr key={quote._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <StatusIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{quote.quoteNumber}</p>
                            <p className="text-sm text-gray-500">{quote.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">
                          {/* We'll need to fetch contact details */}
                          Customer #{quote.contactId.slice(-6)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={quote.status}
                          onChange={(e) => handleStatusChange(quote._id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${statusColors[quote.status]}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="viewed">Viewed</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-gray-900">
                          {totalAmount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">
                          {new Date(quote.validUntil).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No quotes found</p>
          </div>
        )}
      </div>

      {/* Add Quote Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Quote</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quote Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    required
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select customer...</option>
                    {contacts?.map((contact) => (
                      <option key={contact._id} value={contact._id}>
                        {contact.name} {contact.company && `(${contact.company})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until *
                </label>
                <input
                  type="date"
                  required
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Proposal Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposal Title
                    </label>
                    <input
                      type="text"
                      value={formData.proposals[0].title}
                      onChange={(e) => {
                        const newProposals = [...formData.proposals];
                        newProposals[0].title = e.target.value;
                        setFormData({ ...formData, proposals: newProposals });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposal Description
                    </label>
                    <textarea
                      value={formData.proposals[0].description}
                      onChange={(e) => {
                        const newProposals = [...formData.proposals];
                        newProposals[0].description = e.target.value;
                        setFormData({ ...formData, proposals: newProposals });
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Line Items</h4>
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 mb-2">
                      <div className="col-span-4">Description</div>
                      <div className="col-span-2">Qty</div>
                      <div className="col-span-2">Unit Price</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Total</div>
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Item description"
                        value={formData.proposals[0].lineItems[0].description}
                        onChange={(e) => {
                          const newProposals = [...formData.proposals];
                          newProposals[0].lineItems[0].description = e.target.value;
                          setFormData({ ...formData, proposals: newProposals });
                        }}
                        className="col-span-4 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        min="1"
                        value={formData.proposals[0].lineItems[0].quantity}
                        onChange={(e) => {
                          const newProposals = [...formData.proposals];
                          const quantity = parseInt(e.target.value) || 1;
                          newProposals[0].lineItems[0].quantity = quantity;
                          newProposals[0].lineItems[0].total = quantity * newProposals[0].lineItems[0].unitPrice;
                          setFormData({ ...formData, proposals: newProposals });
                        }}
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.proposals[0].lineItems[0].unitPrice}
                        onChange={(e) => {
                          const newProposals = [...formData.proposals];
                          const unitPrice = parseFloat(e.target.value) || 0;
                          newProposals[0].lineItems[0].unitPrice = unitPrice;
                          newProposals[0].lineItems[0].total = newProposals[0].lineItems[0].quantity * unitPrice;
                          setFormData({ ...formData, proposals: newProposals });
                        }}
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <select
                        value={formData.proposals[0].lineItems[0].type}
                        onChange={(e) => {
                          const newProposals = [...formData.proposals];
                          newProposals[0].lineItems[0].type = e.target.value as any;
                          setFormData({ ...formData, proposals: newProposals });
                        }}
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="labor">Labor</option>
                        <option value="material">Material</option>
                        <option value="equipment">Equipment</option>
                      </select>
                      <div className="col-span-2 px-2 py-1 text-sm font-medium">
                        {formData.proposals[0].lineItems[0].total.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
