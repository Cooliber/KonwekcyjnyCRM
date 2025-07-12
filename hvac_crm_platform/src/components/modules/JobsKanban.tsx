import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, User, MapPin, AlertTriangle, Wrench, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Job {
  _id: string;
  title: string;
  description: string;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  scheduledDate?: number;
  estimatedHours?: number;
  contact?: {
    name: string;
    address?: string;
    district?: string;
  };
}

interface JobsKanbanProps {
  jobs: Job[];
}

const statusColumns = [
  { id: "scheduled", title: "Scheduled", color: "bg-blue-50 border-blue-200" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-50 border-yellow-200" },
  { id: "completed", title: "Completed", color: "bg-green-50 border-green-200" },
  { id: "cancelled", title: "Cancelled", color: "bg-gray-50 border-gray-200" },
];

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

function JobCard({ job }: { job: Job }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const TypeIcon = typeIcons[job.type] || Wrench;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-grab hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${
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
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[job.priority]}`}>
            {job.priority}
          </span>
        </div>
      </div>

      <h3 className="font-medium text-gray-900 mb-2">{job.title}</h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>

      <div className="space-y-2">
        {job.contact && (
          <div className="flex items-center text-xs text-gray-500">
            <User className="w-3 h-3 mr-1" />
            {job.contact.name}
          </div>
        )}
        
        {job.contact?.address && (
          <div className="flex items-center text-xs text-gray-500">
            <MapPin className="w-3 h-3 mr-1" />
            {job.contact.district || job.contact.address}
          </div>
        )}

        {job.scheduledDate && (
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(job.scheduledDate).toLocaleDateString('pl-PL')}
            {job.estimatedHours && ` • ${job.estimatedHours}h`}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  title,
  color,
  jobs
}: {
  status: string;
  title: string;
  color: string;
  jobs: Job[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed ${color} p-4 min-h-[500px] transition-colors ${
        isOver ? 'bg-blue-50 border-blue-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
          {jobs.length}
        </span>
      </div>

      <SortableContext items={jobs.map(job => job._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function JobsKanban({ jobs }: JobsKanbanProps) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const updateJob = useMutation(api.jobs.update);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const job = jobs.find(j => j._id === event.active.id);
    setActiveJob(job || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    const jobId = active.id as string;
    const newStatus = over.id as string;

    // Find the job being moved
    const job = jobs.find(j => j._id === jobId);
    if (!job || job.status === newStatus) return;

    try {
      await updateJob({
        id: jobId as any,
        status: newStatus as any,
        completedDate: newStatus === "completed" ? Date.now() : undefined,
      });
      toast.success(`Job moved to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      toast.error("Failed to update job status");
    }
  };

  const getJobsByStatus = (status: string) => {
    return jobs.filter(job => job.status === status);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            status={column.id}
            title={column.title}
            color={column.color}
            jobs={getJobsByStatus(column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <JobCard job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
