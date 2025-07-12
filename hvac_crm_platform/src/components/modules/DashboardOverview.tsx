import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Users, 
  Wrench, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";

export function DashboardOverview() {
  const contacts = useQuery(api.contacts.list, {});
  const jobs = useQuery(api.jobs.list, {});
  const upcomingJobs = useQuery(api.jobs.getUpcoming, {});
  const quotes = useQuery(api.quotes.list, {});
  const equipment = useQuery(api.equipment.list, { lowStock: true });

  const stats = [
    {
      title: "Total Contacts",
      value: contacts?.length || 0,
      icon: Users,
      color: "bg-blue-500",
      change: "+12%"
    },
    {
      title: "Active Jobs",
      value: jobs?.filter(j => j.status === "in_progress").length || 0,
      icon: Wrench,
      color: "bg-orange-500",
      change: "+8%"
    },
    {
      title: "This Week",
      value: upcomingJobs?.length || 0,
      icon: Calendar,
      color: "bg-green-500",
      change: "+15%"
    },
    {
      title: "Pending Quotes",
      value: quotes?.filter(q => q.status === "sent").length || 0,
      icon: DollarSign,
      color: "bg-purple-500",
      change: "+5%"
    }
  ];

  const recentJobs = jobs?.slice(0, 5) || [];
  const lowStockItems = equipment?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your HVAC business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
          </div>
          <div className="p-6">
            {recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        job.priority === "urgent" ? "bg-red-100" :
                        job.priority === "high" ? "bg-orange-100" :
                        job.priority === "medium" ? "bg-yellow-100" : "bg-green-100"
                      }`}>
                        <Wrench className={`w-4 h-4 ${
                          job.priority === "urgent" ? "text-red-600" :
                          job.priority === "high" ? "text-orange-600" :
                          job.priority === "medium" ? "text-yellow-600" : "text-green-600"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        job.status === "completed" ? "bg-green-100 text-green-800" :
                        job.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                        job.status === "scheduled" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent jobs</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
              Low Stock Alerts
            </h2>
          </div>
          <div className="p-6">
            {lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.brand} - {item.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        {item.quantity} left
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {item.minStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">All equipment is well stocked</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 text-blue-500 mr-2" />
            Upcoming This Week
          </h2>
        </div>
        <div className="p-6">
          {upcomingJobs && upcomingJobs.length > 0 ? (
            <div className="space-y-4">
              {upcomingJobs.map((job) => (
                <div key={job._id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : "No date set"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{job.type}</p>
                    <p className="text-xs text-gray-500">{job.priority} priority</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming jobs this week</p>
          )}
        </div>
      </div>
    </div>
  );
}
