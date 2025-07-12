import {
  Activity,
  BarChart3,
  Calendar,
  DollarSign,
  FileSignature,
  FileText,
  Globe,
  Home,
  MessageSquare,
  Package,
  PieChart,
  Radio,
  Settings,
  Shield,
  Smartphone,
  TrendingUp,
  Upload,
  Users,
  Wrench,
} from "lucide-react";

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "contacts", label: "Contacts & Leads", icon: Users },
  { id: "jobs", label: "Service Jobs", icon: Wrench },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "equipment", label: "Equipment", icon: Package },
  { id: "equipment_lifecycle", label: "Equipment Lifecycle", icon: Activity },
  { id: "quotes", label: "Quotes", icon: DollarSign },
  { id: "contract_management", label: "Contract Management", icon: FileSignature },
  { id: "service_agreements", label: "Service Agreements", icon: Shield },
  { id: "sales_pipeline", label: "Sales Pipeline", icon: TrendingUp },
  { id: "business_intelligence", label: "Business Intelligence", icon: BarChart3 },
  { id: "advanced_analytics", label: "Advanced Analytics", icon: PieChart },
  { id: "custom_reports", label: "Custom Reports", icon: FileText },
  { id: "customer_portal", label: "Customer Portal", icon: Globe },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "file_manager", label: "File Manager", icon: Upload },
  { id: "chat", label: "Team Chat", icon: MessageSquare },
  { id: "realtime_manager", label: "Real-time Updates", icon: Radio },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-xl font-bold">HVAC Pro CRM</h1>
        <p className="text-blue-300 text-sm mt-1">Professional Management</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onModuleChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "text-blue-100 hover:bg-blue-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile Interface Link */}
      <div className="mt-auto p-4 border-t border-blue-800">
        <a
          href="/mobile"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full p-3 text-sm font-medium text-blue-100 rounded-lg hover:bg-blue-800 hover:text-white transition-colors mb-4"
        >
          <div className="flex items-center">
            <Smartphone className="w-4 h-4 mr-3" />
            <span>Mobile App</span>
          </div>
          <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">PWA</span>
        </a>

        <div className="text-xs text-blue-300">© 2024 HVAC Pro CRM</div>
      </div>
    </div>
  );
}
