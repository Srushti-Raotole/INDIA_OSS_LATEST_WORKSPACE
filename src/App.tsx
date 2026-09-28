import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useReduxTheme } from "./theme/theme";
import { SnackbarProvider } from "./components/common/SnackbarProvider";
import { TooltipProvider } from "@radix-ui/react-tooltip";

// Auth & Context
import ProtectedRoute from "./utils/auth/ProtectedRoute";
import AuthLanding from "./components/AuthLanding";
import TokenRestorer from "./utils/auth/TokenRestorer";

// Pages - Top Level & Utilities
import IndiaNetworkTopology from "./pages/indiaNetworkTopology";
import ScheduledReport from "./pages/scheduled/ScheduledReport";
import UtilityConfigPage from "./pages/Utility/UtilityConfigPage";
import UtilitySIListPage from "./pages/Utility/UtilitySIListPage";

// Pages - Faults
import ActiveFaultTest from "./pages/Faults/ActiveFaultTest";
import HistoricalFaultsTest from "./pages/Faults/HistoricalFaultsTest";
import TicketingPageTest from "./pages/Faults/TicketingPageTest";

// Pages - Inventory
import InventoryHome from "./pages/inventory/InventoryHome";
import AllPhysicalInventory from "./pages/inventory/AllPhysicalInventory/AllPhysicalInventory";
import TLMRNEListReport from "./pages/inventory/Google/TLMRNEListReport";
import TLMRCircuitInventoryReport from "./pages/inventory/Google/TLMRCircuitInventoryReport";
import EPNMNEListReport from "./pages/inventory/Google/EPNMNEListReport";
import PassiveInventoryReport from "./pages/inventory/Google/PassiveInventoryReport";
import ServiceInventoryReport from "./pages/inventory/Google/ServiceInventoryReport";
import DiscoveryReport from "./pages/inventory/Google/DiscoveryReport";
import InventoryDashboard from "./pages/inventory/Google/InventoryDashboard";
import CONCCircuitInventoryResolver from "./pages/inventory/Microsoft/CONCCircuitInventoryResolver";
import CONCNEListResolver from "./pages/inventory/Microsoft/CONCNEListResolver";
import IFNRCircuitInventoryResolver from "./pages/inventory/Infr/IFNRCircuitInventoryResolver";
import NEListReport from "./pages/inventory/Ciena/NEListReport";
import EquipmentDetailsReport from "./pages/inventory/Ciena/EquipmentDetailsReport";
import ChannelDetailsReport from "./pages/inventory/Ciena/ChannelDetailsReport";
import OTSDetailsReport from "./pages/inventory/Ciena/OTSDetailsReport";
import FeasibilityDetailsReport from "./pages/inventory/Ciena/FeasibilityReport";
import NfmtDeviceDetailsReport from "./pages/inventory/NFMT/NfmtDeviceDetailsReport";
import NfmtEquipmentDetailsReport from "./pages/inventory/NFMT/NfmtEquipmentDetailsReport";

// Pages - Performance
import PerformanceHome from "./pages/performance/PerformanceHome";
import CONCReportResolver from "./pages/performance/CONC/CONCReportResolver";
import ADVAReportResolver from "./pages/performance/ADVA/ADVAreportResolver";
import IFNRReportResolver from "./pages/performance/IFNR/IFNRReportResolver";
import TlmrEthernetReport from "./pages/performance/TLMR/TlmrEthernetReport";
import TlmrTemperatureReport from "./pages/performance/TLMR/TlmrTemperatureReport";
import TlmrCpuReport from "./pages/performance/TLMR/TlmrCpuReport";
import TlmrMemoryReport from "./pages/performance/TLMR/TlmrMemoryReport";
import TlmrOtnReport from "./pages/performance/TLMR/TlmrOtnReport";
import TlmrSpanlossReport from "./pages/performance/TLMR/TlmrSpanlossReport";
import EPNMEthernetReport from "./pages/performance/EPNM/EPNMEthernetReport";
import EPNMSpanlossReport from "./pages/performance/EPNM/EPNMSpanlossReport";
import EPNMTemperatureReport from "./pages/performance/EPNM/EPNMTemperatureReport";
import EPNMCPUUtilizationReport from "./pages/performance/EPNM/EPNMCPUUtilizationReport";
import EPNMLambdaUtilizationReport from "./pages/performance/EPNM/EPNMLambdaUtilizationReport";
import EPNMOTNReport from "./pages/performance/EPNM/EPNMOTNReport";
import EPNMAffectedServices from "./pages/performance/EPNM/EPNMAffectedServices";
import EPNMTicketingTrend from "./pages/performance/EPNM/EPNMTicketingTrend";
import MCPSpanlossReport from "./pages/performance/MCP/MCPSpanloss";
import MCPOSSMETRICSReport from "./pages/performance/MCP/MCP_ADJOssmetrics";
import {
  CreateTopology,
  EditTopology,
  ManageTopology,
  MonitorTopology,
  ViewTopology,
  TopologyPage,
} from "./pages/topologyUtility";
import TopologyHome from "./pages/Topology/TopologyHome";
import ConcDcTopology from "./pages/Topology/CONC_DC_Topology/ConcDcTopology";
import CONCSpanTopology from "./pages/Topology/RedirectTopology/CONCSpanTopology";
import InfineraDCTopologyPage from "./pages/Topology/IFNR_DC_Topology/InfineraDCTopologyPage";
import TelemetryTopologyPage from "./pages/Topology/TLMR_DC_Topology/TelemetryTopologyPage";
import GISTopology from "./pages/Topology/RedirectTopology/GISTopology";
import LogicalTopology from "./pages/Topology/RedirectTopology/LogicalTopology";
import ServiceTopology from "./pages/Topology/RedirectTopology/ServiceTopology";

// Pages - Admin
import AdminActivityLogs from "./pages/admin/UserManagement/ActivityLogs/AdminActivityLogs";
import NotificationSetting from "./pages/admin/UserManagement/NotificationSetting/NotificationSetting";
import TicketingPageAdmin from "./pages/admin/Ticketing/TicketingPageAdmin";
import ReconciliationSettingsPage from "./pages/admin/Reconcililation/ReconciliationSettingsPage";
import AuditPage from "./pages/admin/Audit/AuditPage";
import AlarmCount from "./pages/admin/Reconcililation/AlarmCount/AlarmCount";
import ActiveServer from "./pages/admin/ActiveServer/ActiveServer";
import Discovery from "./pages/admin/inv-discovery/Discovery";
import StaticSpanlossPage from "./pages/StaticSpanloss";
import NocLayout from "./components/Navbar/NocLayout";
import AdminLayout from "./components/Navbar/AdminLayout";
import AlarmMaskingPage from "./pages/admin/AlarmMasking/AlarmMaskingPage";
import AdvaNEListReport from "./pages/inventory/ADVA/NEListReport";
import NFMTSpanlossReport from "./pages/performance/NFMT/NFMTSpanloss";
import MCPOSS_ETTP_METRICSReport from "./pages/performance/MCP/MCP_ETTPOssmetrics";
import MCPOSS_PTP_METRICSReport from "./pages/performance/MCP/MCP_PTPOssmetrics";

function App() {
  const theme = useReduxTheme();
  useEffect(() => {
    console.log("App component mounted");
  }, []);
  return (
    <SnackbarProvider>
      <TooltipProvider delayDuration={200}>
        <TokenRestorer />

        <div className="app-container">
          <div className="app-content">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute allow={["INDIA_NOC", "INDIA_ADMIN"]}>
                    <NocLayout />
                  </ProtectedRoute>
                }
              >
                {/* Role-based landing */}
                <Route index element={<AuthLanding />} />
                <Route
                  path="indianetwork/map"
                  element={<IndiaNetworkTopology />}
                />

                {/* Faults */}
                <Route path="faults/active" element={<ActiveFaultTest />} />
                <Route
                  path="faults/historical"
                  element={<HistoricalFaultsTest />}
                />
                <Route
                  path="faults/ticketing"
                  element={<TicketingPageTest />}
                />

                {/* Inventory Layout */}
                <Route path="inventory" element={<InventoryHome />}>
                  <Route index element={<AllPhysicalInventory />} />
                  <Route
                    path="all-physical-inventory"
                    element={<AllPhysicalInventory />}
                  />
                  <Route
                    path="microsoft/adva/ne-list-report"
                    element={<AdvaNEListReport />}
                  />
                  {/* Google */}
                  <Route
                    path="google/tlmr/ne-list-report"
                    element={<TLMRNEListReport />}
                  />
                  <Route
                    path="google/tlmr/circuit-inventory-report"
                    element={<TLMRCircuitInventoryReport />}
                  />
                  <Route
                    path="google/epnm/ne-list-report"
                    element={<EPNMNEListReport />}
                  />
                  <Route
                    path="google/epnm/passive-inventory-report"
                    element={<PassiveInventoryReport />}
                  />
                  <Route
                    path="google/epnm/service-inventory-report"
                    element={<ServiceInventoryReport />}
                  />
                  <Route
                    path="google/epnm/discovery-report"
                    element={<DiscoveryReport />}
                  />
                  <Route
                    path="google/epnm/inventory-dashboard"
                    element={<InventoryDashboard />}
                  />

                  {/* Microsoft / Infr */}
                  <Route
                    path="microsoft/conc/:client/circuit-inventory-report"
                    element={<CONCCircuitInventoryResolver />}
                  />
                  <Route
                    path="microsoft/conc/:client/ne-list-report"
                    element={<CONCNEListResolver />}
                  />
                  <Route
                    path="ifnr/:client/circuit-inventory-report"
                    element={<IFNRCircuitInventoryResolver />}
                  />

                  {/* MCP (Ciena) */}
                  <Route
                    path="ciena/ne-list-report"
                    element={<NEListReport />}
                  />
                  <Route
                    path="ciena/equipment-details-report"
                    element={<EquipmentDetailsReport />}
                  />
                  <Route
                    path="ciena/channel-details-report"
                    element={<ChannelDetailsReport />}
                  />
                  <Route
                    path="ciena/ots-details-report"
                    element={<OTSDetailsReport />}
                  />
                  <Route
                    path="ciena/feasibility-ui"
                    element={<FeasibilityDetailsReport />}
                  />

                  {/* NFMT (Nokia) */}
                  <Route
                    path="nfmt/device-details-report"
                    element={<NfmtDeviceDetailsReport />}
                  />
                  <Route
                    path="nfmt/equipment-details-report"
                    element={<NfmtEquipmentDetailsReport />}
                  />
                </Route>

                {/* Performance Layout */}
                <Route path="performance-report" element={<PerformanceHome />}>
                  <Route
                    index
                    element={
                      <Navigate
                        to="adva/Microsoft/temperature-report"
                        replace
                      />
                    }
                  />

                  {/* General Resolvers */}
                  <Route
                    path="conc/:client/:report"
                    element={<CONCReportResolver />}
                  />
                  <Route
                    path="adva/:client/:report"
                    element={<ADVAReportResolver />}
                  />
                  <Route
                    path="ifnr/:client/:report"
                    element={<IFNRReportResolver />}
                  />

                  {/* TLMR */}
                  <Route
                    path="tlmr/ethernet-report"
                    element={<TlmrEthernetReport />}
                  />
                  <Route
                    path="tlmr/temperature-report"
                    element={<TlmrTemperatureReport />}
                  />
                  <Route
                    path="tlmr/cpu-utilization-report"
                    element={<TlmrCpuReport />}
                  />
                  <Route
                    path="tlmr/memory-utilization-report"
                    element={<TlmrMemoryReport />}
                  />
                  <Route path="tlmr/otn-report" element={<TlmrOtnReport />} />
                  <Route
                    path="tlmr/spanloss-report"
                    element={<TlmrSpanlossReport />}
                  />

                  {/* EPNM */}
                  <Route
                    path="epnm/ethernet-report"
                    element={<EPNMEthernetReport />}
                  />
                  <Route
                    path="epnm/spanloss-report"
                    element={<EPNMSpanlossReport />}
                  />
                  <Route
                    path="epnm/temperature-report"
                    element={<EPNMTemperatureReport />}
                  />
                  <Route
                    path="epnm/cpu-utilization-report"
                    element={<EPNMCPUUtilizationReport />}
                  />
                  <Route
                    path="epnm/lambda-utilization-report"
                    element={<EPNMLambdaUtilizationReport />}
                  />
                  <Route path="epnm/otn-report" element={<EPNMOTNReport />} />
                  <Route
                    path="epnm/affected-services-report"
                    element={<EPNMAffectedServices />}
                  />
                  <Route
                    path="epnm/ticketing-report"
                    element={<EPNMTicketingTrend />}
                  />

                  {/* MCP */}
                  <Route
                    path="mcp/spanloss-report"
                    element={<MCPSpanlossReport />}
                  />
                  <Route
                    path="mcp/oss-report"
                    element={<MCPOSSMETRICSReport />}
                  />
                  <Route
                    path="mcp/oss-report/ettp"
                    element={<MCPOSS_ETTP_METRICSReport />}
                  />
                  <Route
                    path="mcp/oss-report/ptp"
                    element={<MCPOSS_PTP_METRICSReport />}
                  />

                  <Route path="mcp/ne-list-report" element={<NEListReport />} />
                  <Route
                    path="mcp/equipment-details-report"
                    element={<EquipmentDetailsReport />}
                  />
                  <Route
                    path="mcp/channel-details-report"
                    element={<ChannelDetailsReport />}
                  />

                  {/* NFMT */}
                  <Route
                    path="nfmt/spanloss-report"
                    element={<NFMTSpanlossReport />}
                  />
                </Route>

                {/* Scheduled & Utilities */}
                <Route path="scheduled-report" element={<ScheduledReport />} />
                <Route path="utility/config" element={<UtilityConfigPage />} />
                <Route path="utility/si-list" element={<UtilitySIListPage />} />

                {/* Topology Utilities */}
                <Route path="monitor-topology" element={<MonitorTopology />} />
                <Route path="create-topology" element={<CreateTopology />} />
                <Route path="manage-topology" element={<ManageTopology />} />
                <Route path="edit-topology/:id" element={<EditTopology />} />
                <Route path="view-topology" element={<ViewTopology />} />
                <Route path="view-topology/:id" element={<ViewTopology />} />
                <Route path="topology" element={<TopologyPage />} />
                <Route path="topology/:id" element={<TopologyPage />} />

                {/* Topology Old */}
                <Route path="topology-old" element={<TopologyHome />}>
                  <Route index element={<ConcDcTopology />} />
                  <Route
                    path="microsoft/CONCDcTopology"
                    element={<ConcDcTopology />}
                  />
                  <Route
                    path="microsoft/CONCSpanTopology"
                    element={<CONCSpanTopology />}
                  />
                  <Route
                    path="google/IFNRDCTopology"
                    element={<InfineraDCTopologyPage />}
                  />
                  <Route
                    path="google/TLMRDCTopology"
                    element={<TelemetryTopologyPage />}
                  />
                  <Route
                    path="google/epnm/gis-topology"
                    element={<GISTopology />}
                  />
                  <Route
                    path="google/epnm/logical-topology"
                    element={<LogicalTopology />}
                  />
                  <Route
                    path="google/epnm/service-topology"
                    element={<ServiceTopology />}
                  />
                </Route>
              </Route>

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allow={["INDIA_ADMIN"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminActivityLogs />} />

                {/* User Management */}
                <Route
                  path="users/admin-activity-logs"
                  element={<AdminActivityLogs />}
                />
                <Route
                  path="users/notification-setting"
                  element={<NotificationSetting />}
                />

                {/* Ticketing, Recon & Audit */}
                <Route path="ticketing" element={<TicketingPageAdmin />} />
                <Route
                  path="/admin/alarm-masking"
                  element={<AlarmMaskingPage />}
                />
                <Route
                  path="reconciliation"
                  element={<ReconciliationSettingsPage />}
                />
                <Route path="alarm-count" element={<AlarmCount />} />
                <Route path="audit" element={<AuditPage />} />

                {/* Utilities */}
                <Route path="active-server" element={<ActiveServer />} />
                <Route path="inv-discovery" element={<Discovery />} />
                <Route
                  path="static-span-loss"
                  element={<StaticSpanlossPage />}
                />

                {/* Topology utilities inside Admin */}
                <Route path="create-topology" element={<CreateTopology />} />
                <Route path="manage-topology" element={<ManageTopology />} />
                <Route path="edit-topology/:id" element={<EditTopology />} />
                <Route path="view-topology" element={<ViewTopology />} />
                <Route path="view-topology/:id" element={<ViewTopology />} />
                <Route path="topology" element={<TopologyPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </TooltipProvider>
    </SnackbarProvider>
  );
}

export default App;
