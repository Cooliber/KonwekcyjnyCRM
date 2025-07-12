import { AdvancedAnalyticsDashboard } from "./modules/AdvancedAnalyticsDashboard";
import { BusinessIntelligenceDashboard } from "./modules/BusinessIntelligenceDashboard";
import { ContactsModule } from "./modules/ContactsModule";
import { ContractManagementModule } from "./modules/ContractManagementModule";
import { CustomerPortalModule } from "./modules/CustomerPortalModule";
import { CustomReportBuilder } from "./modules/CustomReportBuilder";
import { DashboardOverview } from "./modules/DashboardOverview";
import { EnhancedInstallationModule } from "./modules/EnhancedInstallationModule";
import { EnhancedServiceModule } from "./modules/EnhancedServiceModule";
import { EquipmentLifecycleModule } from "./modules/EquipmentLifecycleModule";
import { EquipmentModule } from "./modules/EquipmentModule";
import { FileUploadManager } from "./modules/FileUploadManager";
import { HVACDashboard } from "./modules/HVACDashboard";
import { JobsModule } from "./modules/JobsModule";
import { MapModule } from "./modules/MapModule";
import { ProphecyDashboard } from "./modules/ProphecyDashboard";
import { QuotesModule } from "./modules/QuotesModule";
import { RealTimeSubscriptionManager } from "./modules/RealTimeSubscriptionManager";
import { SalesPipelineModule } from "./modules/SalesPipelineModule";
import { ScheduleModule } from "./modules/ScheduleModule";
import { ServiceAgreementModule } from "./modules/ServiceAgreementModule";

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
        return (
          <div className="card">
            <p>Documents module coming soon...</p>
          </div>
        );
      case "chat":
        return (
          <div className="card">
            <p>Chat module coming soon...</p>
          </div>
        );
      case "settings":
        return (
          <div className="card">
            <p>Settings module coming soon...</p>
          </div>
        );
      case "map":
        return <MapModule />;
      case "suppliers":
        return (
          <div className="card">
            <p>Suppliers module coming soon...</p>
          </div>
        );
      case "transcriptions":
        return (
          <div className="card">
            <p>AI Transcriptions coming soon...</p>
          </div>
        );
      case "analytics":
        return <ProphecyDashboard />;
      case "sales_pipeline":
        return <SalesPipelineModule />;
      case "business_intelligence":
        return <BusinessIntelligenceDashboard />;
      case "custom_reports":
        return <CustomReportBuilder />;
      case "file_manager":
        return <FileUploadManager />;
      case "realtime_manager":
        return <RealTimeSubscriptionManager />;
      case "hvac_dashboard":
        return <HVACDashboard />;
      case "enhanced_installations":
        return <EnhancedInstallationModule />;
      case "enhanced_services":
        return <EnhancedServiceModule />;
      case "contract_management":
        return <ContractManagementModule />;
      case "service_agreements":
        return <ServiceAgreementModule />;
      case "advanced_analytics":
        return <AdvancedAnalyticsDashboard />;
      case "equipment_lifecycle":
        return <EquipmentLifecycleModule />;
      case "customer_portal":
        return <CustomerPortalModule />;
      default:
        return <DashboardOverview />;
    }
  };

  return <div className="h-full">{renderModule()}</div>;
}
