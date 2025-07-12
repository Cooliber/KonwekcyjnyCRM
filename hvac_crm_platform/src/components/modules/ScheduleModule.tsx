import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Calendar, Clock, MapPin, User, Plus, Filter } from "lucide-react";
import { toast } from "sonner";

export function ScheduleModule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("week");
  const [filterTechnician, setFilterTechnician] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Get jobs for the current time period
  const jobs = useQuery(api.jobs.list, {
    scheduledAfter: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime(),
    scheduledBefore: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getTime(),
  });

  const contacts = useQuery(api.contacts.list, {});
  const updateJob = useMutation(api.jobs.update);

  // Get current week dates
  const getWeekDates = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const getJobsForDate = (date: Date) => {
    if (!jobs) return [];
    
    return jobs.filter(job => {
      if (!job.scheduledDate) return false;
      const jobDate = new Date(job.scheduledDate);
      return jobDate.toDateString() === date.toDateString();
    });
  };

  const handleJobDrop = async (jobId: string, newDate: Date, newTime: string) => {
    try {
      const [hours, minutes] = newTime.split(':').map(Number);
      const scheduledDate = new Date(newDate);
      scheduledDate.setHours(hours, minutes);
      
      await updateJob({
        id: jobId as any,
        scheduledDate: scheduledDate.getTime(),
      });
      toast.success("Job rescheduled successfully");
    } catch (error) {
      toast.error("Failed to reschedule job");
    }
  };

  const priorityColors = {
    low: "bg-green-100 border-green-300 text-green-800",
    medium: "bg-yellow-100 border-yellow-300 text-yellow-800",
    high: "bg-orange-100 border-orange-300 text-orange-800",
    urgent: "bg-red-100 border-red-300 text-red-800",
  };

  const statusColors = {
    scheduled: "bg-blue-100 border-blue-300 text-blue-800",
    in_progress: "bg-purple-100 border-purple-300 text-purple-800",
    completed: "bg-green-100 border-green-300 text-green-800",
    cancelled: "bg-gray-100 border-gray-300 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule & Calendar</h1>
          <p className="text-gray-600">Manage technician schedules and job assignments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Job</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                →
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Today
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
            
            <select
              value={filterTechnician}
              onChange={(e) => setFilterTechnician(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Technicians</option>
              <option value="tech1">Jan Kowalski</option>
              <option value="tech2">Anna Nowak</option>
              <option value="tech3">Piotr Wiśniewski</option>
            </select>
          </div>
        </div>
      </div>

      {/* Week View Calendar */}
      {viewMode === "week" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-4 bg-gray-50 border-r border-gray-200">
              <span className="text-sm font-medium text-gray-500">Time</span>
            </div>
            {weekDates.map((date, index) => (
              <div key={index} className="p-4 bg-gray-50 border-r border-gray-200 last:border-r-0">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {date.toLocaleDateString('pl-PL', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold mt-1 ${
                    date.toDateString() === new Date().toDateString() 
                      ? 'text-blue-600' 
                      : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="max-h-96 overflow-y-auto">
            {Array.from({ length: 12 }, (_, i) => i + 7).map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                <div className="p-3 border-r border-gray-200 bg-gray-50">
                  <span className="text-sm text-gray-500">{hour}:00</span>
                </div>
                {weekDates.map((date, dateIndex) => {
                  const dayJobs = getJobsForDate(date).filter(job => {
                    if (!job.scheduledDate) return false;
                    const jobHour = new Date(job.scheduledDate).getHours();
                    return jobHour === hour;
                  });

                  return (
                    <div key={dateIndex} className="p-2 border-r border-gray-200 last:border-r-0 min-h-[60px]">
                      {dayJobs.map((job) => (
                        <div
                          key={job._id}
                          className={`p-2 rounded-lg text-xs mb-1 border-l-4 cursor-pointer hover:shadow-md transition-shadow ${priorityColors[job.priority]}`}
                          title={`${job.title} - ${job.description}`}
                        >
                          <div className="font-medium truncate">{job.title}</div>
                          <div className="text-xs opacity-75 truncate">
                            {job.type.replace('_', ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {currentDate.toLocaleDateString('pl-PL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          <div className="space-y-3">
            {getJobsForDate(currentDate).map((job) => (
              <div key={job._id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-shrink-0">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${priorityColors[job.priority]}`}>
                      {job.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[job.status as keyof typeof statusColors]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {job.scheduledDate ? new Date(job.scheduledDate).toLocaleTimeString('pl-PL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 'Not scheduled'}
                    </span>
                    {job.estimatedHours && (
                      <span>Est. {job.estimatedHours}h</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {getJobsForDate(currentDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No jobs scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Month View - Simple Grid */}
      {viewMode === "month" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center text-gray-500 py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Month view coming soon...</p>
            <p className="text-sm">Use week or day view for detailed scheduling</p>
          </div>
        </div>
      )}
    </div>
  );
}
