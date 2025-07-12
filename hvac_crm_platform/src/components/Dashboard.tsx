import { DashboardOverview } from "./modules/DashboardOverview";
import { ContactsModule } from "./modules/ContactsModule";
import { JobsModule } from "./modules/JobsModule";
import { EquipmentModule } from "./modules/EquipmentModule";
import { QuotesModule } from "./modules/QuotesModule";
import { ScheduleModule } from "./modules/ScheduleModule";
import { MapModule } from "./modules/MapModule";
import { ProphecyDashboard } from "./modules/ProphecyDashboard";
import { SalesPipelineModule } from "./modules/SalesPipelineModule";
import { BusinessIntelligenceDashboard } from "./modules/BusinessIntelligenceDashboard";
import { FileUploadManager } from "./modules/FileUploadManager";
import { RealTimeSubscriptionManager } from "./modules/RealTimeSubscriptionManager";

interface DashboardProps {
  activeModule: string;
}

export function Dashboard({ activeModule }: DashboardProps) {
  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <DashboardOverview />;
      case "contacts":
        return <ContactsModule />;
      case "jobs":
        return <JobsModule />;
      case "schedule":
        return <ScheduleModule />;
      case "equipment":
        return <EquipmentModule />;
      case "quotes":
        return <QuotesModule />;
      case "documents":
        return <div className="card"><p>Documents module coming soon...</p></div>;
      case "chat":
        return <div className="card"><p>Chat module coming soon...</p></div>;
      case "settings":
        return <div className="card"><p>Settings module coming soon...</p></div>;
      case "map":
        return <MapModule />;
      case "suppliers":
        return <div className="card"><p>Suppliers module coming soon...</p></div>;
      case "transcriptions":
        return <div className="card"><p>AI Transcriptions coming soon...</p></div>;
      case "analytics":
        return <ProphecyDashboard />;
      case "sales_pipeline":
        return <SalesPipelineModule />;
      case "business_intelligence":
        return <BusinessIntelligenceDashboard />;
      case "file_manager":
        return <FileUploadManager />;
      case "realtime_manager":
        return <RealTimeSubscriptionManager />;
      default:
        return <DashboardOverview />;
    }
  };

  return <div className="h-full">{renderModule()}</div>;
}
