/**
 * @fileoverview Main GoTun Component
 * @description Root component for the GoTun enterprise enhancement package
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Brain,
  Settings,
  Users,
  MapPin,
  Zap,
  BarChart3,
  MessageSquare,
  Shield,
  Globe,
  Cpu,
  Activity,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '../utils';
import { GOTUN_COLORS, GOTUN_LAYOUT, GOTUN_ANIMATIONS } from './constants';
import { AdvancedPipelineBoard } from './enterprise/sales/AdvancedPipelineBoard';
import { BIDashboardGrid } from './enterprise/analytics/BIDashboardGrid';
import { WarsawDistrictMap } from './hvac/analytics/WarsawDistrictMap';
import { UnifiedServerConsole } from './integrations/aci-mcp/UnifiedServerConsole';
import type { GoTunConfig, GoTunModule } from '../types';

interface GoTunProps {
  config?: Partial<GoTunConfig>;
  initialModule?: string;
  className?: string;
  onModuleChange?: (module: string) => void;
  enableFullscreen?: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<any>;
  category: 'enterprise' | 'hvac' | 'integrations' | 'core';
  description: string;
  badge?: string;
  aiPowered?: boolean;
}

interface GoTunHeaderProps {
  currentModule: string;
  onSearch: (term: string) => void;
  onToggleSidebar: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isSidebarCollapsed: boolean;
}

interface GoTunSidebarProps {
  navigationItems: NavigationItem[];
  currentModule: string;
  onModuleSelect: (moduleId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const GoTunHeader: React.FC<GoTunHeaderProps> = ({
  currentModule,
  onSearch,
  onToggleSidebar,
  onToggleFullscreen,
  isFullscreen,
  isSidebarCollapsed
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <header 
      className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-50"
      style={{ height: GOTUN_LAYOUT.header.height }}
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GoTun</h1>
              <p className="text-xs text-gray-500">Enterprise Enhancement</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
            <Brain className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">AI-Powered</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules, functions, or insights..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
        
        <button
          onClick={onToggleFullscreen}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-gray-600" />
          ) : (
            <Maximize2 className="w-5 h-5 text-gray-600" />
          )}
        </button>

        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
          <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-white">U</span>
          </div>
          <span className="text-sm font-medium text-gray-700">User</span>
        </div>
      </div>
    </header>
  );
};

const GoTunSidebar: React.FC<GoTunSidebarProps> = ({
  navigationItems,
  currentModule,
  onModuleSelect,
  isCollapsed,
  onToggleCollapse
}) => {
  const groupedItems = useMemo(() => {
    return navigationItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, NavigationItem[]>);
  }, [navigationItems]);

  const categoryLabels = {
    enterprise: 'Enterprise',
    hvac: 'HVAC Analytics',
    integrations: 'Integrations',
    core: 'Core'
  };

  const categoryIcons = {
    enterprise: BarChart3,
    hvac: MapPin,
    integrations: Globe,
    core: Settings
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? GOTUN_LAYOUT.sidebar.collapsedWidth : GOTUN_LAYOUT.sidebar.width }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-primary-900 text-white flex flex-col border-r border-primary-800 relative z-40"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-primary-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-accent-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">GoTun</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-primary-800 rounded transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => {
          const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];
          
          return (
            <div key={category}>
              {!isCollapsed && (
                <div className="flex items-center space-x-2 mb-3">
                  <CategoryIcon className="w-4 h-4 text-primary-300" />
                  <h3 className="text-xs font-semibold text-primary-300 uppercase tracking-wider">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                </div>
              )}
              
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onModuleSelect(item.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left",
                      currentModule === item.id
                        ? "bg-primary-700 text-white"
                        : "text-primary-200 hover:bg-primary-800 hover:text-white"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium truncate">{item.label}</span>
                            {item.aiPowered && (
                              <Brain className="w-3 h-3 text-accent-400" />
                            )}
                          </div>
                          <p className="text-xs text-primary-300 truncate">
                            {item.description}
                          </p>
                        </div>
                        {item.badge && (
                          <span className="bg-accent-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-primary-800">
        {!isCollapsed && (
          <div className="bg-primary-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">System Status</span>
            </div>
            <div className="space-y-1 text-xs text-primary-300">
              <div className="flex justify-between">
                <span>ACI-MCP:</span>
                <span className="text-green-400">Online</span>
              </div>
              <div className="flex justify-between">
                <span>Warsaw Analytics:</span>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span>AI Prophecy:</span>
                <span className="text-green-400">Running</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export const GoTun: React.FC<GoTunProps> = ({
  config,
  initialModule = 'dashboard',
  className,
  onModuleChange,
  enableFullscreen = true
}) => {
  const [currentModule, setCurrentModule] = useState(initialModule);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Navigation items configuration
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      component: BIDashboardGrid,
      category: 'core',
      description: 'Overview and metrics',
      aiPowered: true
    },
    {
      id: 'sales-pipeline',
      label: 'Sales Pipeline',
      icon: TrendingUp,
      component: AdvancedPipelineBoard,
      category: 'enterprise',
      description: 'Advanced deal management',
      aiPowered: true,
      badge: 'New'
    },
    {
      id: 'bi-analytics',
      label: 'Business Intelligence',
      icon: BarChart3,
      component: BIDashboardGrid,
      category: 'enterprise',
      description: 'Real-time analytics',
      aiPowered: true
    },
    {
      id: 'warsaw-analytics',
      label: 'Warsaw Districts',
      icon: MapPin,
      component: WarsawDistrictMap,
      category: 'hvac',
      description: 'District-specific insights',
      aiPowered: true
    },
    {
      id: 'aci-console',
      label: 'ACI-MCP Console',
      icon: Brain,
      component: UnifiedServerConsole,
      category: 'integrations',
      description: 'AI function management',
      aiPowered: true
    },
    {
      id: 'team-collaboration',
      label: 'Team Hub',
      icon: Users,
      component: () => <div>Team Collaboration Coming Soon</div>,
      category: 'enterprise',
      description: 'Workspace management'
    },
    {
      id: 'security',
      label: 'Security Center',
      icon: Shield,
      component: () => <div>Security Center Coming Soon</div>,
      category: 'integrations',
      description: 'Compliance & security'
    }
  ];

  const handleModuleChange = useCallback((moduleId: string) => {
    setCurrentModule(moduleId);
    onModuleChange?.(moduleId);
  }, [onModuleChange]);

  const handleToggleFullscreen = useCallback(() => {
    if (enableFullscreen) {
      setIsFullscreen(!isFullscreen);
    }
  }, [enableFullscreen, isFullscreen]);

  const currentModuleItem = navigationItems.find(item => item.id === currentModule);
  const CurrentComponent = currentModuleItem?.component || (() => <div>Module not found</div>);

  return (
    <div className={cn(
      "flex h-screen bg-gray-50 overflow-hidden",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      {/* Sidebar */}
      <GoTunSidebar
        navigationItems={navigationItems}
        currentModule={currentModule}
        onModuleSelect={handleModuleChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <GoTunHeader
          currentModule={currentModule}
          onSearch={setSearchTerm}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Module Content */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full"
            >
              <CurrentComponent
                searchTerm={searchTerm}
                config={config}
                {...(currentModuleItem?.id === 'sales-pipeline' && {
                  stages: [],
                  deals: [],
                  onDealMove: async () => {},
                  onDealUpdate: async () => {},
                  onStageUpdate: async () => {}
                })}
                {...(currentModuleItem?.id === 'bi-analytics' && {
                  widgets: [],
                  data: {},
                  onWidgetUpdate: () => {},
                  onWidgetDelete: () => {},
                  onWidgetAdd: () => {},
                  onLayoutChange: () => {}
                })}
                {...(currentModuleItem?.id === 'warsaw-analytics' && {
                  districtData: {},
                  demandData: [],
                  prophecyInsights: [],
                  onDistrictSelect: () => {}
                })}
                {...(currentModuleItem?.id === 'aci-console' && {
                  functions: [],
                  executionHistory: [],
                  serverStatus: { status: 'stopped' },
                  onExecuteFunction: async () => ({ success: true, metadata: { executionTime: 0, functionId: '', timestamp: '', requestId: '' } }),
                  onRefreshFunctions: async () => {},
                  onServerAction: async () => {}
                })}
              />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-40" />
      )}
    </div>
  );
};

export default GoTun;
