import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Search, Filter, Phone, Mail, Building, MapPin, Mic } from "lucide-react";
import { toast } from "sonner";
import { EnhancedAddressInput } from "../ui/AddressInput";
import { TranscriptionModal } from "./TranscriptionModal";

export function ContactsModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "lead" | "customer">("all");
  const [filterStatus, setFilterStatus] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);

  const contacts = useQuery(api.contacts.list, {
    type: filterType === "all" ? undefined : filterType,
    status: filterStatus || undefined,
    search: searchQuery || undefined,
  });

  const createContact = useAction(api.contacts.createWithGeocoding);
  const updateContact = useMutation(api.contacts.update);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "Warsaw",
    district: "",
    zipCode: "",
    coordinates: undefined as { lat: number; lng: number } | undefined,
    type: "lead" as "lead" | "customer" | "vip",
    source: "",
    notes: "",
    gdprConsent: false,
    marketingConsent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact(formData);
      toast.success("Contact created successfully");
      setShowAddForm(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        city: "Warsaw",
        district: "",
        zipCode: "",
        coordinates: undefined,
        type: "lead",
        source: "",
        notes: "",
        gdprConsent: false,
        marketingConsent: false,
      });
    } catch (error) {
      toast.error("Failed to create contact");
    }
  };

  const handleStatusChange = async (contactId: string, status: string) => {
    try {
      await updateContact({ 
        id: contactId as any, 
        status: status as any 
      });
      toast.success("Contact status updated");
    } catch (error) {
      toast.error("Failed to update contact");
    }
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-purple-100 text-purple-800",
    proposal: "bg-orange-100 text-orange-800",
    won: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts & Leads</h1>
          <p className="text-gray-600">Manage your customers and potential leads</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTranscriptionModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Mic className="w-4 h-4" />
            <span>AI Transcription</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="lead">Leads</option>
            <option value="customer">Customers</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {contacts && contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Contact</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Company</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Location</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{contact.name}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          {contact.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="w-3 h-3 mr-1" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {contact.company && (
                        <div className="flex items-center text-sm text-gray-900">
                          <Building className="w-4 h-4 mr-2 text-gray-400" />
                          {contact.company}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        contact.type === "customer" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {contact.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={contact.status}
                        onChange={(e) => handleStatusChange(contact._id, e.target.value)}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${statusColors[contact.status as keyof typeof statusColors]}`}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="py-4 px-6">
                      {(contact.city || contact.district) && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {contact.city}{contact.city && contact.district && ", "}{contact.district}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">👥</span>
            </div>
            <p className="text-gray-500">No contacts found</p>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Contact</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="lead">Lead</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="Website, referral, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <EnhancedAddressInput
                  value={formData.address}
                  onChange={(value, metadata) => {
                    setFormData({
                      ...formData,
                      address: value,
                      district: metadata?.district || formData.district,
                      coordinates: metadata?.coordinates
                    });
                  }}
                  placeholder="Enter Warsaw address (e.g., ul. Marszałkowska 1, Śródmieście)"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mokotów, Śródmieście"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Transcription Modal */}
      <TranscriptionModal
        isOpen={showTranscriptionModal}
        onClose={() => setShowTranscriptionModal(false)}
        onContactCreated={(contactId) => {
          setShowTranscriptionModal(false);
          toast.success("Contact created from transcription!");
        }}
      />
    </div>
  );
}
