import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Search, Wrench, Clock, CheckCircle, AlertTriangle, List, Columns } from "lucide-react";
import { toast } from "sonner";
import { JobsKanban } from "./JobsKanban";

export function JobsModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const jobs = useQuery(api.jobs.list, {
    status: filterStatus || undefined,
    type: filterType || undefined,
    search: searchQuery || undefined,
  });

  const contacts = useQuery(api.contacts.list, {});
  const createJob = useMutation(api.jobs.create);
  const updateJob = useMutation(api.jobs.update);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contactId: "",
    type: "repair" as "installation" | "repair" | "maintenance" | "inspection" | "emergency",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    scheduledDate: "",
    estimatedHours: "",
    assignedTechnicians: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJob({
        ...formData,
        contactId: formData.contactId as any,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).getTime() : undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        assignedTechnicians: formData.assignedTechnicians as any[],
      });
      toast.success("Job created successfully");
      setShowAddForm(false);
      setFormData({
        title: "",
        description: "",
        contactId: "",
        type: "repair",
        priority: "medium",
        scheduledDate: "",
        estimatedHours: "",
        assignedTechnicians: [],
      });
    } catch (error) {
      toast.error("Failed to create job");
    }
  };

  const handleStatusChange = async (jobId: string, status: string) => {
    try {
      await updateJob({ 
        id: jobId as any, 
        status: status as any,
        completedDate: status === "completed" ? Date.now() : undefined,
      });
      toast.success("Job status updated");
    } catch (error) {
      toast.error("Failed to update job");
    }
  };

  const statusColors: Record<string, string> = {
    lead: "bg-gray-100 text-gray-800",
    quoted: "bg-purple-100 text-purple-800",
    approved: "bg-blue-100 text-blue-800",
    scheduled: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    invoiced: "bg-orange-100 text-orange-800",
    paid: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const typeIcons: Record<string, any> = {
    installation: Wrench,
    repair: AlertTriangle,
    maintenance: Clock,
    inspection: CheckCircle,
    emergency: AlertTriangle,
    warranty: Wrench,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Jobs</h1>
          <p className="text-gray-600">Manage HVAC service jobs and assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="w-4 h-4 mr-1 inline" />
              List
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Columns className="w-4 h-4 mr-1 inline" />
              Kanban
            </button>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Job</span>
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
                placeholder="Search jobs..."
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
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="installation">Installation</option>
            <option value="repair">Repair</option>
            <option value="maintenance">Maintenance</option>
            <option value="inspection">Inspection</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </div>

      {/* Jobs Content */}
      {viewMode === "kanban" ? (
        <JobsKanban jobs={jobs || []} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {jobs && jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Job</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Priority</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Scheduled</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => {
                  const TypeIcon = typeIcons[job.type];
                  return (
                    <tr key={job._id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            job.priority === "urgent" ? "bg-red-100" :
                            job.priority === "high" ? "bg-orange-100" :
                            job.priority === "medium" ? "bg-yellow-100" : "bg-green-100"
                          }`}>
                            <TypeIcon className={`w-4 h-4 ${
                              job.priority === "urgent" ? "text-red-600" :
                              job.priority === "high" ? "text-orange-600" :
                              job.priority === "medium" ? "text-yellow-600" : "text-green-600"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{job.title}</p>
                            <p className="text-sm text-gray-500">{job.description.substring(0, 50)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900 capitalize">
                          {job.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[job.priority]}`}>
                          {job.priority}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job._id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${statusColors[job.status]}`}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">
                          {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : "Not scheduled"}
                        </div>
                        {job.estimatedHours && (
                          <div className="text-xs text-gray-500">
                            Est. {job.estimatedHours}h
                          </div>
                        )}
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
            <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No jobs found</p>
          </div>
        )}
        </div>
      )}

      {/* Add Job Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Job</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title *
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
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="installation">Installation</option>
                    <option value="repair">Repair</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inspection">Inspection</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
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
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
