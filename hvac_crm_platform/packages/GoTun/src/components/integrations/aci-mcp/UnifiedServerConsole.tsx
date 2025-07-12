/**
 * @fileoverview ACI-MCP Unified Server Console Component
 * @description Interactive console for managing ACI-MCP unified server functions and executions
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Play,
  Square,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Brain,
  Zap,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Code,
  Database,
  Globe,
  Cpu,
  BarChart3,
  TrendingUp,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '../../../utils';
import { GOTUN_COLORS, GOTUN_ANIMATIONS } from '../../constants';
import type { ACIFunction, ACIExecutionResult, ACIServerStatus } from '../../../types';

interface UnifiedServerConsoleProps {
  functions: ACIFunction[];
  executionHistory: ACIExecutionResult[];
  serverStatus: ACIServerStatus;
  onExecuteFunction: (functionId: string, parameters: Record<string, any>) => Promise<ACIExecutionResult>;
  onRefreshFunctions: () => Promise<void>;
  onServerAction: (action: 'start' | 'stop' | 'restart') => Promise<void>;
  className?: string;
  enableRealTime?: boolean;
  enableLogging?: boolean;
}

interface FunctionCardProps {
  func: ACIFunction;
  onExecute: (parameters: Record<string, any>) => void;
  isExecuting?: boolean;
  lastResult?: ACIExecutionResult;
}

interface ExecutionLogProps {
  executions: ACIExecutionResult[];
  onClear: () => void;
  maxEntries?: number;
}

interface ParameterInputProps {
  parameter: ACIFunction['parameters'][0];
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

const ParameterInput: React.FC<ParameterInputProps> = ({
  parameter,
  value,
  onChange,
  error
}) => {
  const renderInput = () => {
    switch (parameter.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={parameter.defaultValue as string || `Enter ${parameter.name}`}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              error ? "border-red-300" : "border-gray-300"
            )}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={parameter.defaultValue?.toString() || `Enter ${parameter.name}`}
            min={parameter.validation?.min}
            max={parameter.validation?.max}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              error ? "border-red-300" : "border-gray-300"
            )}
          />
        );
      
      case 'boolean':
        return (
          <select
            value={value?.toString() || 'false'}
            onChange={(e) => onChange(e.target.value === 'true')}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              error ? "border-red-300" : "border-gray-300"
            )}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
        );
      
      case 'array':
        return (
          <textarea
            value={Array.isArray(value) ? value.join('\n') : value || ''}
            onChange={(e) => onChange(e.target.value.split('\n').filter(Boolean))}
            placeholder="Enter one item per line"
            rows={3}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              error ? "border-red-300" : "border-gray-300"
            )}
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${parameter.name}`}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              error ? "border-red-300" : "border-gray-300"
            )}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {parameter.name}
          {parameter.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <span className="text-xs text-gray-500">{parameter.type}</span>
      </div>
      {renderInput()}
      {parameter.description && (
        <p className="text-xs text-gray-500">{parameter.description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

const FunctionCard: React.FC<FunctionCardProps> = ({
  func,
  onExecute,
  isExecuting,
  lastResult
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateParameters = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    func.parameters.forEach(param => {
      if (param.required && !parameters[param.name]) {
        newErrors[param.name] = 'This parameter is required';
      }
      
      if (param.validation) {
        const value = parameters[param.name];
        if (value !== undefined && value !== null) {
          if (param.validation.min !== undefined && value < param.validation.min) {
            newErrors[param.name] = `Value must be at least ${param.validation.min}`;
          }
          if (param.validation.max !== undefined && value > param.validation.max) {
            newErrors[param.name] = `Value must be at most ${param.validation.max}`;
          }
          if (param.validation.pattern && !new RegExp(param.validation.pattern).test(value)) {
            newErrors[param.name] = 'Value does not match required pattern';
          }
          if (param.validation.enum && !param.validation.enum.includes(value)) {
            newErrors[param.name] = `Value must be one of: ${param.validation.enum.join(', ')}`;
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [func.parameters, parameters]);

  const handleExecute = useCallback(() => {
    if (validateParameters()) {
      onExecute(parameters);
    }
  }, [parameters, validateParameters, onExecute]);

  const getStatusIcon = () => {
    if (isExecuting) {
      return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
    }
    if (lastResult) {
      return lastResult.success ? (
        <CheckCircle className="w-4 h-4 text-green-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      );
    }
    return <Play className="w-4 h-4 text-gray-400" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'sales_automation': GOTUN_COLORS.primary[500],
      'marketing_automation': GOTUN_COLORS.accent[500],
      'business_intelligence': GOTUN_COLORS.success[500],
      'team_communication': GOTUN_COLORS.info[500],
      'workflow_automation': GOTUN_COLORS.warning[500],
      'system_integration': GOTUN_COLORS.secondary[500],
      'artificial_intelligence': GOTUN_COLORS.primary[600],
      'data_management': GOTUN_COLORS.neutral[600]
    };
    return colors[category as keyof typeof colors] || GOTUN_COLORS.neutral[500];
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Function Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <h3 className="font-semibold text-gray-900">{func.name}</h3>
            </div>
            <span
              className="px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getCategoryColor(func.category) }}
            >
              {func.category.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">{func.app}</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">{func.description}</p>
        
        {lastResult && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Last executed: {new Date(lastResult.metadata.timestamp).toLocaleString()}
            </span>
            <span className="text-gray-500">
              Duration: {lastResult.metadata.executionTime}ms
            </span>
          </div>
        )}
      </div>

      {/* Function Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Parameters */}
              {func.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Parameters</h4>
                  <div className="space-y-3">
                    {func.parameters.map((param) => (
                      <ParameterInput
                        key={param.name}
                        parameter={param}
                        value={parameters[param.name]}
                        onChange={(value) => setParameters(prev => ({ ...prev, [param.name]: value }))}
                        error={errors[param.name]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {func.examples.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Examples</h4>
                  <div className="space-y-2">
                    {func.examples.slice(0, 2).map((example, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-2">{example.description}</p>
                        <button
                          onClick={() => setParameters(example.parameters)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Use this example
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execute Button */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Return type: {func.returnType}
                </div>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || Object.keys(errors).length > 0}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
                    isExecuting || Object.keys(errors).length > 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  )}
                >
                  {isExecuting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>Execute</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ExecutionLog: React.FC<ExecutionLogProps> = ({
  executions,
  onClear,
  maxEntries = 100
}) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [executions]);

  const getStatusColor = (success: boolean) => {
    return success ? GOTUN_COLORS.success[500] : GOTUN_COLORS.error[500];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Execution Log</h3>
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {executions.length}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Clear
        </button>
      </div>
      
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm"
      >
        {executions.slice(-maxEntries).map((execution, index) => (
          <motion.div
            key={execution.metadata.requestId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50"
          >
            <div
              className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
              style={{ backgroundColor: getStatusColor(execution.success) }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-900 font-medium truncate">
                  {execution.metadata.functionId}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(execution.metadata.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {execution.success ? (
                <div className="text-green-700 text-xs">
                  ✓ Success ({execution.metadata.executionTime}ms)
                </div>
              ) : (
                <div className="text-red-700 text-xs">
                  ✗ Error: {execution.error?.message}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        
        {executions.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No executions yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const UnifiedServerConsole: React.FC<UnifiedServerConsoleProps> = ({
  functions,
  executionHistory,
  serverStatus,
  onExecuteFunction,
  onRefreshFunctions,
  onServerAction,
  className,
  enableRealTime = true,
  enableLogging = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [executingFunctions, setExecutingFunctions] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter functions based on search and category
  const filteredFunctions = useMemo(() => {
    return functions.filter(func => {
      const matchesSearch = func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           func.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           func.app.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || func.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [functions, searchTerm, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(functions.map(f => f.category)));
    return ['all', ...cats];
  }, [functions]);

  const handleExecuteFunction = useCallback(async (functionId: string, parameters: Record<string, any>) => {
    setExecutingFunctions(prev => new Set(prev).add(functionId));
    try {
      await onExecuteFunction(functionId, parameters);
    } finally {
      setExecutingFunctions(prev => {
        const newSet = new Set(prev);
        newSet.delete(functionId);
        return newSet;
      });
    }
  }, [onExecuteFunction]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefreshFunctions();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefreshFunctions]);

  const getServerStatusColor = () => {
    switch (serverStatus.status) {
      case 'running': return GOTUN_COLORS.success[500];
      case 'stopped': return GOTUN_COLORS.error[500];
      case 'starting': return GOTUN_COLORS.warning[500];
      case 'error': return GOTUN_COLORS.error[600];
      default: return GOTUN_COLORS.neutral[500];
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Console Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">ACI-MCP Unified Server</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getServerStatusColor() }}
              />
              <span className="text-sm text-gray-600 capitalize">
                {serverStatus.status}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg",
                "hover:bg-gray-50 transition-colors",
                isRefreshing && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onServerAction(serverStatus.status === 'running' ? 'stop' : 'start')}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
                serverStatus.status === 'running'
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {serverStatus.status === 'running' ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{serverStatus.status === 'running' ? 'Stop' : 'Start'}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search functions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Server Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600">Functions</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{functions.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Executions</span>
            </div>
            <p className="text-xl font-bold text-green-900">{executionHistory.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-600">Active</span>
            </div>
            <p className="text-xl font-bold text-purple-900">{executingFunctions.size}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-600">Uptime</span>
            </div>
            <p className="text-xl font-bold text-orange-900">{serverStatus.uptime || '0s'}</p>
          </div>
        </div>
      </div>

      {/* Console Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Functions Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            {filteredFunctions.map((func) => (
              <FunctionCard
                key={func.id}
                func={func}
                onExecute={(parameters) => handleExecuteFunction(func.id, parameters)}
                isExecuting={executingFunctions.has(func.id)}
                lastResult={executionHistory.find(h => h.metadata.functionId === func.id)}
              />
            ))}
            
            {filteredFunctions.length === 0 && (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <div className="text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No functions found</h3>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Execution Log Panel */}
        {enableLogging && (
          <div className="w-96 border-l border-gray-200 p-6">
            <ExecutionLog
              executions={executionHistory}
              onClear={() => {/* Handle clear */}}
            />
          </div>
        )}
      </div>
    </div>
  );
};
