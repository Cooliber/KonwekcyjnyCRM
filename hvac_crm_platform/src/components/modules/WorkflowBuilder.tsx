import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  Workflow, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  Edit,
  Zap,
  Target,
  Clock,
  Users,
  Bell,
  Route,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// Type definitions for workflow conditions and actions
interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with';
  value: string | number | boolean;
}

interface WorkflowAction {
  type: 'SEND_NOTIFICATION' | 'CREATE_TASK' | 'ASSIGN_TECHNICIAN' | 'UPDATE_STATUS' | 'TRIGGER_ROUTE_OPTIMIZATION';
  parameters: {
    message?: string;
    recipient?: string;
    taskTitle?: string;
    technicianId?: string;
    newStatus?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    [key: string]: unknown;
  };
}

interface WorkflowRule {
  id?: string;
  name: string;
  description?: string;
  triggerEvent: string;
  triggerCondition: {
    entityType: 'job' | 'contact' | 'quote' | 'equipment';
    conditions: WorkflowCondition[];
  };
  actions: WorkflowAction[];
  priority?: number;
  district?: string;
  status: 'active' | 'disabled';
}

export const WorkflowBuilder: React.FC = () => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowRule | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState('');

  // Get workflows
  const workflows = useQuery(api.workflows.list, {});
  
  // Mutations
  const createWorkflow = useMutation(api.workflows.create);
  const updateWorkflow = useMutation(api.workflows.update);
  const executeWorkflows = useMutation(api.workflows.executeWorkflows);

  const triggerEvents = [
    { value: 'JOB_STATUS_CHANGE', label: 'Job Status Change', icon: <Target className="w-4 h-4" /> },
    { value: 'CONTACT_CREATED', label: 'New Contact Created', icon: <Users className="w-4 h-4" /> },
    { value: 'INVOICE_GENERATED', label: 'Invoice Generated', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'EQUIPMENT_LOW_STOCK', label: 'Low Stock Alert', icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'SCHEDULED_TIME', label: 'Scheduled Time', icon: <Clock className="w-4 h-4" /> }
  ];

  const actionTypes = [
    { value: 'ASSIGN_TECHNICIAN', label: 'Auto-Assign Technician', icon: <Users className="w-4 h-4" /> },
    { value: 'SEND_NOTIFICATION', label: 'Send Notification', icon: <Bell className="w-4 h-4" /> },
    { value: 'UPDATE_STATUS', label: 'Update Status', icon: <Settings className="w-4 h-4" /> },
    { value: 'CREATE_TASK', label: 'Create Task', icon: <Plus className="w-4 h-4" /> },
    { value: 'TRIGGER_ROUTE_OPTIMIZATION', label: 'Optimize Routes', icon: <Route className="w-4 h-4" /> }
  ];

  const operators = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'gt', label: 'Greater Than' },
    { value: 'lt', label: 'Less Than' },
    { value: 'contains', label: 'Contains' }
  ];

  const warsawDistricts = [
    'Śródmieście', 'Mokotów', 'Wilanów', 'Żoliborz', 'Ursynów', 
    'Wola', 'Praga-Południe', 'Targówek'
  ];

  const handleCreateWorkflow = async (workflowData: Omit<WorkflowRule, 'id'>) => {
    try {
      await createWorkflow(workflowData);
      toast.success('Workflow created successfully');
      setIsBuilderOpen(false);
      setEditingWorkflow(null);
    } catch (error) {
      toast.error('Failed to create workflow');
    }
  };

  const handleUpdateWorkflow = async (id: string, workflowData: Partial<WorkflowRule>) => {
    try {
      await updateWorkflow({ id: id as any, ...workflowData });
      toast.success('Workflow updated successfully');
      setEditingWorkflow(null);
    } catch (error) {
      toast.error('Failed to update workflow');
    }
  };

  const handleTestWorkflow = async (workflow: any) => {
    try {
      const result = await executeWorkflows({
        triggerEvent: workflow.triggerEvent,
        entityId: 'test-entity',
        entityType: workflow.triggerCondition.entityType,
        entityData: { status: 'test', district: 'Śródmieście' }
      });
      
      toast.success(`Test completed: ${result.successfulExecutions} successful, ${result.failedExecutions} failed`);
    } catch (error) {
      toast.error('Test execution failed');
    }
  };

  const renderWorkflowCard = (workflow: any) => (
    <div key={workflow._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${workflow.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Workflow className={`w-5 h-5 ${workflow.status === 'active' ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
            <p className="text-sm text-gray-600">{workflow.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleTestWorkflow(workflow)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Test Workflow"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditingWorkflow(workflow)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Edit Workflow"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleUpdateWorkflow(workflow._id, { 
              status: workflow.status === 'active' ? 'disabled' : 'active' 
            })}
            className={`p-2 rounded-lg transition-colors ${
              workflow.status === 'active' 
                ? 'text-red-600 hover:bg-red-50' 
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={workflow.status === 'active' ? 'Disable' : 'Enable'}
          >
            {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium text-gray-700">Trigger:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            {triggerEvents.find(t => t.value === workflow.triggerEvent)?.label}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium text-gray-700">Actions:</span>
          <div className="flex flex-wrap gap-1">
            {workflow.actions.map((action: any, index: number) => (
              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {actionTypes.find(a => a.value === action.type)?.label}
              </span>
            ))}
          </div>
        </div>

        {workflow.district && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium text-gray-700">District:</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
              {workflow.district}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Executions: {workflow.metrics.executions}</span>
            <span>Success Rate: {workflow.metrics.executions > 0 
              ? Math.round((workflow.metrics.successes / workflow.metrics.executions) * 100) 
              : 0}%</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            workflow.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {workflow.status}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Workflow className="w-6 h-6 mr-2 text-blue-600" />
            Workflow Automation
          </h1>
          <p className="text-gray-600">Automate Jobs and Contacts with custom rules</p>
        </div>
        
        <button
          onClick={() => setIsBuilderOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Workflow</span>
        </button>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Workflows</p>
              <p className="text-2xl font-semibold text-gray-900">
                {workflows?.filter(w => w.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Executions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {workflows?.reduce((sum, w) => sum + w.metrics.executions, 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {workflows && workflows.length > 0 
                  ? Math.round((workflows.reduce((sum, w) => sum + w.metrics.successes, 0) / 
                               workflows.reduce((sum, w) => sum + w.metrics.executions, 0)) * 100) || 0
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Execution</p>
              <p className="text-2xl font-semibold text-gray-900">&lt;1s</p>
              <p className="text-xs text-green-600">Target: &lt;1s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Active Workflows</h2>
        
        {workflows && workflows.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.map(renderWorkflowCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
            <p className="text-gray-600 mb-6">Create your first workflow to automate Jobs and Contacts</p>
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create First Workflow
            </button>
          </div>
        )}
      </div>

      {/* Workflow Builder Modal */}
      {(isBuilderOpen || editingWorkflow) && (
        <WorkflowBuilderModal
          workflow={editingWorkflow}
          onSave={editingWorkflow ? 
            (data) => handleUpdateWorkflow(editingWorkflow._id, data) : 
            handleCreateWorkflow
          }
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingWorkflow(null);
          }}
          triggerEvents={triggerEvents}
          actionTypes={actionTypes}
          operators={operators}
          districts={warsawDistricts}
        />
      )}
    </div>
  );
};

// Type definitions for modal props
interface TriggerEvent {
  id: string;
  name: string;
  description: string;
  entityType: string;
}

interface ActionType {
  id: string;
  name: string;
  description: string;
  parameters: string[];
}

interface Operator {
  id: string;
  name: string;
  symbol: string;
  description: string;
}

// Workflow Builder Modal Component (simplified for space)
interface WorkflowBuilderModalProps {
  workflow?: WorkflowRule;
  onSave: (data: WorkflowRule) => void;
  onClose: () => void;
  triggerEvents: TriggerEvent[];
  actionTypes: ActionType[];
  operators: Operator[];
  districts: string[];
}

const WorkflowBuilderModal: React.FC<WorkflowBuilderModalProps> = ({
  workflow,
  onSave,
  onClose,
  triggerEvents,
  actionTypes,
  operators,
  districts
}) => {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    triggerEvent: workflow?.triggerEvent || '',
    triggerCondition: workflow?.triggerCondition || {
      entityType: 'job',
      conditions: [{ field: 'status', operator: 'eq', value: '' }]
    },
    actions: workflow?.actions || [{ type: '', parameters: {} }],
    priority: workflow?.priority || 5,
    district: workflow?.district || '',
    status: workflow?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {workflow ? 'Edit Workflow' : 'Create New Workflow'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District (Optional)
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Districts</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Trigger Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger Event
            </label>
            <select
              value={formData.triggerEvent}
              onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Trigger</option>
              {triggerEvents.map(trigger => (
                <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
              ))}
            </select>
          </div>

          {/* Actions Configuration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actions
            </label>
            <div className="space-y-3">
              {formData.actions.map((action, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <select
                    value={action.type}
                    onChange={(e) => {
                      const newActions = [...formData.actions];
                      newActions[index] = { ...action, type: e.target.value };
                      setFormData({ ...formData, actions: newActions });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Action</option>
                    {actionTypes.map(actionType => (
                      <option key={actionType.value} value={actionType.value}>{actionType.label}</option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newActions = formData.actions.filter((_, i) => i !== index);
                      setFormData({ ...formData, actions: newActions });
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    actions: [...formData.actions, { type: '', parameters: {} }]
                  });
                }}
                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Action
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {workflow ? 'Update Workflow' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
