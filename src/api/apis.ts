// =============================================================================
// INDIA OSS — API Constants
// =============================================================================

// ---------------------------------------------------------------------------
// Activity Logger  (utils/activityLogger.ts)
// ---------------------------------------------------------------------------
export const PUSH_ACTIVITY_LOGS = '/v1/log/activitylogs';

// ---------------------------------------------------------------------------
// Active Fault Page  (pages/Faults/ActiveFaultTest.tsx)
// Active Fault Actions — Clear / Acknowledge / Favourite
//   (components/faults/active/faults/AckFavClear/*)
//   (components/faults/active/faults/ActiveFaultTableForSidebar.tsx)
// ---------------------------------------------------------------------------
export const FETCH_ACTIVE_FAULTS_TABLE_DATA           = '/v1/faultbrowser/active-traps';
export const CLEAR_OR_ACK_ACTIVE_TRAP_API             = '/v1/faultbrowser/clearOrAck';
export const CREATE_TICKET                            = '/v1/faultbrowser/forward-ticket';
export const DISTINCT_Adapter_LIST_API                = '/v1/faultbrowser/distinctAdapter';
export const DISTINCT_TRAP_TYPES_LIST_API             = '/v1/faultbrowser/distinctTrapTypes';
export const DISTINCT_GROUP_TRAP_Adapter_LIST_API     = '/v1/faultbrowser/groupTrapAdapterList';
export const CREATE_OR_UPDATE_FAV_GROUP               = '/v1/faultbrowser/createOrUpdateGroup';

// ---------------------------------------------------------------------------
// Historical Fault Page  (pages/Faults/HistoricalFaultsTest.tsx)
// ---------------------------------------------------------------------------
export const FETCH_HISTORICAL_FAULTS_TABLE_DATA = '/v1/faultbrowserhist/historical-traps';

// ---------------------------------------------------------------------------
// Ticketing Page — NOC  (pages/Faults/TicketingPageTest.tsx)
// ---------------------------------------------------------------------------
export const FETCH_TICKETING_TABLE_DATA = `/v1/faultbrowserticketing/ticketing`;

// ---------------------------------------------------------------------------
// Admin — Ticketing Management  (pages/admin/Ticketing/TicketingPageAdmin.tsx)
//   also used by ActiveFaultTableForSidebar.tsx for the alarm list
// ---------------------------------------------------------------------------
export const FETCH_TICKETING_ALARMS          = `v1/admin/customticketing/current`;
export const CREATE_TICKETING_ALARM          = `/v1/admin/customticketing/add/alarm`;
export const BULK_UPLOAD_TICKETING_ALARMS    = `/v1/admin/customticketing/add/bulk`;
export const DELETE_TICKETING_ALARM          = `/v1/admin/customticketing/delete`;
export const FETCH_TICKETING_ALARM_LIST      = `/v1/admin/customticketing/alarms`; // AddAlarmDialog alarm dropdown

// ---------------------------------------------------------------------------
// Admin — Activity Logs Page  (pages/admin/UserManagement/ActivityLogs/AdminActivityLogs.tsx)
// ---------------------------------------------------------------------------
export const FETCH_ADMIN_ACTIVITY_LOGS = `/v1/admin/users/adminlogs`;

// ---------------------------------------------------------------------------
// Admin — Notification Settings  (pages/admin/UserManagement/NotificationSetting/*)
//   Dialogs: NotiEditDialog.tsx (PUT by id), NotiDelDialog.tsx (DELETE by id)
// ---------------------------------------------------------------------------
export const FETCH_NOTIFICATION_USERS   = `/v1/admin/notifications/users`;
export const ADD_NOTIFICATION_USER      = `/v1/admin/notifications/users`;
export const UPDATE_NOTIFICATION_USER   = `/v1/admin/notifications/users`;
export const DELETE_NOTIFICATION_USERS  = `/v1/admin/notifications/users/delete`;
export const NOTIFICATION_USER_BY_ID    = (id: number) => `/v1/admin/notifications/users/${id}`;

// ---------------------------------------------------------------------------
// Login Page  (pages/LoginPage.tsx)
// ---------------------------------------------------------------------------
export const LOGIN = `/v1/auth/login`;

// ---------------------------------------------------------------------------
// Token Renewal  (utils/auth/useTokenRefresh.ts)
// Silent JWT renewal called 5 min before expiry.
// ---------------------------------------------------------------------------
export const RENEW_TOKEN = `/v1/apiauth/renew`;

// ---------------------------------------------------------------------------
// Utility — Config Archive URL  (pages/Utility/UtilityConfigPage.tsx)
// Security Issue Fix - authkey is stored server-side in application.properties.
// Frontend fetches the full URL (with authkey) at runtime via this JWT-protected endpoint.
// authkey is never hardcoded in client-side source or JS bundles.
// ---------------------------------------------------------------------------
export const UTILITY_CONFIG_ARCHIVE_URL = `/v1/utility/config-archive-url`;

// ---------------------------------------------------------------------------
// Admin — Discovery Settings  (pages/admin/Discovery/DiscoverySettingPage.tsx)
//                              (pages/admin/Discovery/SetDiscoveryDialog.tsx)
// ---------------------------------------------------------------------------
export const ADMIN_CURRENT_DISCOVERY_SETTING = `/v1/admin/discovery/current`;
export const ADMIN_DISCOVERY_RECORD          = `/v1/admin/discovery/records`;
export const SET_DISCOVERY_AUTO              = `/v1/admin/discovery/set/auto`;
export const SET_DISCOVERY_ONDEAMND          = `/v1/admin/discovery/ondemand`;

// ---------------------------------------------------------------------------
// Admin — Reconciliation  (pages/admin/Reconcililation/ReconciliationSettingsPage.tsx)
//                          (pages/admin/Reconcililation/AlarmCount/AlarmCount.tsx)
// ---------------------------------------------------------------------------
export const ADMIN_RECON_HISTORY_LOGS      = `/v1/admin/reconcil/logs`;
export const ADMIN_RUN_RECONCILIATION      = `/v1/admin/reconcil/run`;
export const ADMIN_POST_RECONCILATION_LOGS = `/v1/admin/reconcil/writelogs`;

// ---------------------------------------------------------------------------
// Admin — Alarm Count / NMS-vs-OSS  (pages/admin/Reconcililation/AlarmCount/AlarmCount.tsx)
// ---------------------------------------------------------------------------
export const GET_NMS_COUNT = '/v1/alarmcount/latest-nms-count';
export const GET_OSS_COUNT = '/v1/alarmcount/latest-oss-count';

// ---------------------------------------------------------------------------
// Admin — Active Server Switch  (pages/admin/ActiveServer/ActiveServer.tsx)
// ---------------------------------------------------------------------------
export const ACTIVE_SERVER_INFO               = '/v1/admin/serverswitch/active-server-info';
export const ACTIVE_SERVER_LOGS               = '/v1/admin/serverswitch/logs';
export const ACTIVE_SERVER_SWITCH             = '/v1/admin/serverswitch/make-active';
export const ACTIVE_SERVER_SWITCH_LOGS        = '/v1/admin/serverswitch/push-logs';
export const ACTIVE_SERVER_SWITCH_LAST_SWITCH = '/v1/admin/serverswitch/last-switch';

// ---------------------------------------------------------------------------
// Inventory Discovery Page  (pages/admin/inv-discovery/Discovery.tsx)
// ---------------------------------------------------------------------------
export const FETCH_DISCOVERY_LOGS       = "/v1/admin/discovery/ondemand/logs";
export const WRITE_DISCOVERY_LOGS       = "/v1/admin/discovery/ondemand/writelogs";
export const FETCH_DAILY_DISCOVERY_LOGS = "/v1/admin/discovery/daily/logs";
export const RUN_DISCOVERY              = "/v1/admin/discovery/ondemand/run";

// Discovery NE list download  (pages/admin/Discovery/Table/DiscoveryRecordsTable.tsx)
export const FETCH_DISCOVERY_NE_LIST = `/v1/admin/discovery/ne-list`;

// ---------------------------------------------------------------------------
// Inventory On Demand  (pages/admin/InventoryOnDemand/InventoryControlPage.tsx)
// NOTE: These use /inventory/ context path, NOT /v1/ — different backend path.
// ---------------------------------------------------------------------------
export const INVENTORY_ON_DEMAND_LOGS = `/inventory/logs`;
export const INVENTORY_ON_DEMAND_RUN  = `/inventory/run`;

// ---------------------------------------------------------------------------
// Alarm Masking Page  (pages/admin/AlarmMasking/AlarmMaskingPage.tsx)
// ---------------------------------------------------------------------------
export const ALARM_MASKING_GETALL           = "/v1/device-ticket-exclusion";
export const ALARM_MASKING_ADD_DEVICE       = "/v1/device-ticket-exclusion/add/device";
export const ALARM_MASKING_ADD_BULK_DEVICES = "/v1/device-ticket-exclusion/add/bulk-devices";
export const ALARM_MASKING_DELETE_DEVICE    = "/v1/device-ticket-exclusion/delete";
export const ALARM_MASKING_EDIT_DEVICE      = "/v1/device-ticket-exclusion/edit";
export const ALARM_MASKING_VENDOR_DEVICES   = "/v1/device-ticket-exclusion/getdevicevendorwise";

// =============================================================================
// INVENTORY
// =============================================================================

// ---------------------------------------------------------------------------
// All Physical Inventory  (pages/inventory/AllPhysicalInventory/AllPhysicalInventory.tsx)
// ---------------------------------------------------------------------------
export const FETCH_PHYSICAL_INVENTORY_DATA          = `/v1/physicalInventory`;
export const FETCH_PHYSICAL_INVENTORY_CAPTURED_TIME = `/v1/physicalInventory/max-time`;
export const FETCH_PHYSICAL_INV_TREEVIEW_DOWNLOAD   = `/v1/physicalInventory/download`;
export const FETCH_PHYSICAL_INVENTORY_TLMR_DATA     = `/v1/google/tlmr/physical`;
export const FETCH_PHYSICAL_INVENTORY_EPNM_DATA     = `/v1/google/epnm/physical`;
export const FETCH_INVENTORY_INFR_CLIENTS           = '/v1/pm/ifnr/clients';
export const FETCH_INVENTORY_CONC_CLIENTS           = '/v1/microsoft/pm/conc/clients';
export const FETCH_INVENTORY_ADVA_CLIENTS           = '/v1/microsoft/pm/adva/clients';

// ---------------------------------------------------------------------------
// Inventory — IFNR Circuit Inventory  (pages/inventory/Infr/Reports/IFNRCircuitInventory.tsx)
// ---------------------------------------------------------------------------
export const FETCH_INFR_CIRCUIT_INVENTORY_REPORT = `/v1/ifnr/circuit-inventory-report`;

// ---------------------------------------------------------------------------
// Inventory — Google TLMR  (pages/inventory/Google/TLMRNEListReport.tsx)
//                           (pages/inventory/Google/TLMRCircuitInventoryReport.tsx)
// ---------------------------------------------------------------------------
export const FETCH_GOOGLE_TLMR_NE_LIST_REPORT            = `/v1/google/tlmr/ne-list-report`;
export const FETCH_GOOGLE_TLMR_CIRCUIT_INVENTORY_REPORT  = `/v1/google/tlmr/circuit-inventory-report`;

// ---------------------------------------------------------------------------
// Inventory — Microsoft CONC  (pages/inventory/Microsoft/Reports/ConcNEList.tsx)
//                              (pages/inventory/Microsoft/Reports/CONCCircuitInventory.tsx)
// ---------------------------------------------------------------------------
export const FETCH_CONC_NE_LIST_REPORT          = `/v1/microsoft/conc/ne-list-report`;
export const FETCH_CONC_CIRCUIT_INVENTORY_REPORT = `/v1/microsoft/conc/circuit-inventory-report`;

// ---------------------------------------------------------------------------
// Inventory — ADVA NE List  (pages/inventory/ADVA/NEListReport.tsx)
// ⚠️ BUG: This URL is identical to FETCH_CONC_NE_LIST_REPORT — likely a wrong endpoint.
// ---------------------------------------------------------------------------
export const FETCH_ADVA_NE_LIST_REPORT = `/v1/microsoft/conc/ne-list-report`;

// ---------------------------------------------------------------------------
// Admin — Static Span Loss  (pages/StaticSpanloss/services/spanLossApi.ts)
// ---------------------------------------------------------------------------
export const SPAN_LOSS_RECORDS     = `/v1/admin/spaninsert/records`;
export const SPAN_LOSS_BULK_INSERT = `/v1/admin/spaninsert/bulk-insert`;

// ---------------------------------------------------------------------------
// Inventory — CIENA / MCP  (pages/inventory/Ciena/*)
// ---------------------------------------------------------------------------
export const FETCH_INVENTORY_NE_LIST_REPORT_DATA  = `/v1/mcp/ne-list-report`;
export const FETCH_INVENTORY_CHANNEL_REPORT_DATA  = `/v1/mcp/channel-details-report`;
export const FETCH_INVENTORY_EQUIPMENT_REPORT_DATA = `/v1/mcp/equipment-details-report`;
export const FETCH_INVENTORY_OTS_REPORT_DATA      = `/v1/mcp/ots-details-report`;
export const FEASIBILITY_NORMAL_JSON              = "/v1/mcp/feasibilityui";

// ---------------------------------------------------------------------------
// Inventory — Nokia NFMT  (pages/inventory/NFMT/*)
// ---------------------------------------------------------------------------
export const FETCH_INVENTORY_NFMT_DEVICE_DETAILS_DATA    = `/v1/nfmt/device-report`;
export const FETCH_INVENTORY_NFMT_EQUIPMENT_REPORT_DATA  = `/v1/nfmt/equipment-report`;

// =============================================================================
// SCHEDULED REPORTS
// =============================================================================

// ---------------------------------------------------------------------------
// Scheduled Report Page  (pages/scheduled/ScheduledReport.tsx)
// ---------------------------------------------------------------------------
export const FETCH_SCHEDULED_REPORT = `/v1/scheduled`;

// =============================================================================
// PERFORMANCE REPORTS
// =============================================================================

// ---------------------------------------------------------------------------
// Performance — ADVA  (pages/performance/ADVA/Reports/*)
//                      (pages/performance/SidebarMenu.tsx)
// ---------------------------------------------------------------------------
export const FETCH_PM_ADVA_CLIENTS                      = '/v1/microsoft/pm/adva/clients';
export const FETCH_PERFORMANCE_ADVA_SPANLOSS_REPORT     = `/v1/microsoft/pm/adva/spanloss`;
export const FETCH_PERFORMANCE_ADVA_SPANLOSS_SPANFILTER = `/v1/microsoft/pm/adva/spanfilter`;
export const FETCH_PERFORMANCE_ADVA_SPANLOSS_PLOT       = `/v1/microsoft/pm/adva/spanlossplot`;
export const FETCH_PERFORMANCE_ADVA_TEMPERATURE_REPORT  = `/v1/microsoft/pm/adva/temperature`;
export const FETCH_PERFORMANCE_ADVA_TEMPERATURE_SPANFILTER = `/v1/microsoft/pm/adva/spanfilter`; // shared with spanloss spanfilter
export const FETCH_PERFORMANCE_ADVA_TEMPERATURE_PLOT    = `/v1/microsoft/pm/adva/temperatureplot`;

// ---------------------------------------------------------------------------
// Performance — Microsoft CONC  (pages/performance/CONC/Reports/*)
//                                (pages/performance/SidebarMenu.tsx)
// ---------------------------------------------------------------------------
export const FETCH_PM_CONC_CLIENTS                    = '/v1/microsoft/pm/conc/clients';
export const FETCH_PERFORMANCE_CONC_ETHERNET_REPORT   = `/v1/microsoft/pm/conc/ethernet`;
export const FETCH_PERFORMANCE_CONC_ETHERNET_NODELIST = `/v1/microsoft/pm/conc/nodelist`;
export const FETCH_PERFORMANCE_CONC_OTN_REPORT        = `/v1/microsoft/pm/conc/otn`;
export const FETCH_PERFORMANCE_CONC_OTN_NODELIST      = `/v1/microsoft/pm/conc/nodelist`; // shared with ethernet nodelist

// ---------------------------------------------------------------------------
// Performance — Google TLMR  (pages/performance/TLMR/*)
// ---------------------------------------------------------------------------
export const FETCH_PERFORMANCE_TLMR_ETHERNET_REPORT    = `/v1/google/pm/tlmr/ethernet`;
export const FETCH_PERFORMANCE_TLMR_ETHERNET_NODELIST  = `/v1/google/pm/tlmr/nodelist`;
export const FETCH_PERFORMANCE_TLMR_TEMPERATURE_REPORT = `/v1/google/pm/tlmr/temperature`;
export const FETCH_PERFORMANCE_TLMR_TEMPERATURE_PLOT   = `/v1/google/pm/tlmr/temperatureplot`;
export const FETCH_PERFORMANCE_TLMR_CPU_REPORT         = `/v1/google/pm/tlmr/cpu`;
export const FETCH_PERFORMANCE_TLMR_CPU_PLOT           = `/v1/google/pm/tlmr/cpuplot`;
export const FETCH_PERFORMANCE_TLMR_MEMORY_REPORT      = `/v1/google/pm/tlmr/memory`;
export const FETCH_PERFORMANCE_TLMR_MEMORY_PLOT        = `/v1/google/pm/tlmr/memoryplot`;
export const FETCH_PERFORMANCE_TLMR_OTN_REPORT         = `/v1/google/pm/tlmr/otn`;
export const FETCH_PERFORMANCE_TLMR_OTN_NODELIST       = `/v1/google/pm/tlmr/nodelist`; // shared with ethernet nodelist
export const FETCH_PERFORMANCE_TLMR_SPANLOSS_REPORT    = `/v1/google/pm/tlmr/spanloss`;

// ---------------------------------------------------------------------------
// Performance — IFNR  (pages/performance/IFNR/*)
//                      (pages/performance/SidebarMenu.tsx)
//                      (pages/performance/IFNR/useIFNRClients.ts)
// ---------------------------------------------------------------------------
export const FETCH_PERFORMANCE_INFR_CLIENTS           = '/v1/pm/ifnr/clients';
export const FETCH_PERFORMANCE_INFR_CPU_REPORT        = `/v1/pm/ifnr/cpu`;
export const FETCH_PERFORMANCE_INFR_CPU_PLOT          = `/v1/pm/ifnr/cpuplot`;
export const FETCH_PERFORMANCE_IFNR_MEMORY_REPORT     = `/v1/pm/ifnr/memory`;
export const FETCH_PERFORMANCE_IFNR_MEMORY_PLOT       = `/v1/pm/ifnr/memoryplot`;
export const FETCH_PERFORMANCE_IFNR_SPANLOSS_REPORT   = `/v1/pm/ifnr/spanloss`;
export const FETCH_PERFORMANCE_IFNR_ETHERNET_REPORT   = `/v1/pm/ifnr/ethernet`;
export const FETCH_PERFORMANCE_IFNR_ETHERNET_NODELIST = `/v1/pm/ifnr/nodelist`;
export const FETCH_PERFORMANCE_IFNR_OTN_REPORT        = `/v1/pm/ifnr/otn`;
export const FETCH_PERFORMANCE_IFNR_OTN_NODELIST      = `/v1/pm/ifnr/nodelist`; // shared with ethernet nodelist

// ---------------------------------------------------------------------------
// Performance — MCP  (pages/performance/MCP/*)
// ---------------------------------------------------------------------------
export const FETCH_PERFORMANCE_MCP_SPANLOSS_REPORT         = '/v1/pm/mcp/spanloss';
export const FETCH_PERFORMANCE_MCP_ADJ_OSS_METRICS_REPORT  = '/v1/pm/mcp/adjacencydetails';
export const FETCH_PERFORMANCE_MCP_ETTP_OSS_METRICS_REPORT = '/v1/pm/mcp/ettpdetails';
export const FETCH_PERFORMANCE_MCP_PTP_OSS_METRICS_REPORT  = '/v1/pm/mcp/ptpdetails';
export const FETCH_PERFORMANCE_MCP_NODE_LIST_6500          = '/v1/pm/mcp/6500nodelist';

// ---------------------------------------------------------------------------
// Performance — Nokia NFMT  (pages/performance/NFMT/NFMTSpanloss.tsx)
// ---------------------------------------------------------------------------
export const FETCH_PERFORMANCE_NFMT_SPANLOSS_REPORT = '/v1/pm/nfmt/spanloss';

// =============================================================================
// DC TOPOLOGY PAGES (old/legacy topology views)
// =============================================================================

// ---------------------------------------------------------------------------
// CONC DC Topology  (pages/Topology/CONC_DC_Topology/ConcDcTopology.tsx)
// ---------------------------------------------------------------------------
export const CONC_DC_TOPOLOGY_API_URL     = `/v1/topology/conc/topo`;

// ---------------------------------------------------------------------------
// IFNR DC Topology  (pages/Topology/IFNR_DC_Topology/InfineraDCTopologyPage.tsx)
// ---------------------------------------------------------------------------
export const INFINERA_TOPOLOGY_API_URL      = `/v1/topology/ifnr/topo`;
export const INFINERA_TOPOLOGY_UPDATE_API_URL = `/v1/topology/ifnr/topo/updatecord`;
export const INFINERA_CONNECTIVITY_API_URL  = `v1/topology/ifnr/topo/connections`;

// ---------------------------------------------------------------------------
// TLMR DC Topology  (pages/Topology/TLMR_DC_Topology/TelemetryTopologyPage.tsx)
// ---------------------------------------------------------------------------
export const TELEMETRY_TOPOLOGY_API_URL      = `/v1/topology/tlmr/topo`;
export const TELEMETRY_CONNECTIVITY_API_URL  = `v1/topology/tlmr/topo/connections`;

// =============================================================================
// TOPOLOGY UTILITY (create / edit / manage / monitor topologies)
// =============================================================================

// ---------------------------------------------------------------------------
// Topology Utility  (pages/topologyUtility/services/topologyApi.ts)
// ---------------------------------------------------------------------------
export const TOPOLOGY_SAVE          = '/v1/topoutil/save';
export const TOPOLOGY_BASE          = '/v1/topoutil';
export const GET_TOPOLOGY_TRAPTYPES = 'v1/admin/customticketing/alarms';

// =============================================================================
// INDIA NETWORK MAP  (pages/indiaNetworkTopology/*)
// =============================================================================

// ---------------------------------------------------------------------------
// Network circuits / capacity  (services/networkApi.ts, dashboardApi.ts)
// ---------------------------------------------------------------------------
export const GET_CKT_CHANNEL_DETAILS          = `/v1/dashboard/getCktChannelDetails`;
export const GET_SECTOR_WISE_CAPACITY_SUMMARY = '/v1/dashboard/getCapacitySummaryDetailedReport';
export const GET_TOTAL_CAPACITY_SUMMARY       = '/v1/dashboard/getCapacitySummaryCityWiseReport';
export const GET_TOP_10_CUSTOMERS             = '/v1/dashboard/gettopcustomers';
export const GET_IP_LAST_CAPTURE_TIME         = "v1/dashboard/ip-optical/lastcapturetime";
export const GET_FIBER_LAST_CAPTURE_TIME      = "/v1/dashboard/fiber/lastcapturetime";

// ---------------------------------------------------------------------------
// Fiber layer  (services/fiberApi.ts)
// ---------------------------------------------------------------------------
export const GET_FIBER_ROUTES = "/v1/dashboard/fiber/routes";
export const GET_FIBER_SITES  = "/v1/dashboard/fiber/sites";

// ---------------------------------------------------------------------------
// Alarms / OTS  (services/alarmApi.ts, otsApi.ts)
// ---------------------------------------------------------------------------
export const GET_ALARM_DETAILS       = "/v1/dashboard/getAlarmDetails";
export const GET_OTS_DETAILS         = '/v1/dashboard/getOtsDetails';
export const GET_PLOT_ALARMS         = '/v1/dashboard/plotAlarms';

// ---------------------------------------------------------------------------
// Sector summary  (services/sectorSummaryApi.ts)
// ---------------------------------------------------------------------------
export const GET_SECTOR_WISE_SUMMARY_DATA = "/v1/dashboard/getSectorWiseSummary";


// =============================================================================
// UNUSED APIS
// Listed here for reference. These constants are defined but not imported
// anywhere in the application. Safe to remove once confirmed obsolete.
// =============================================================================

// --- Authentication (validation endpoint — no page currently imports these) ---
export const CHECK_TOKEN_VALIDITY_RENDER = "/v1/testing/validate";
export const LOGOUT = "/auth/logout"; // app uses samlAxios logout in utils/auth/auth.ts, not this

// --- Active Fault — Trap-trend graph (no graph component currently active) ---
export const FETCH_GRAPH_DATA_API = (adapName: string, st: string, ed: string) =>
  `/v1/faultbrowser/active-traps/graphtrend?AdapterName=${adapName}&dateStart=${st}&dateEnd=${ed}`;

// --- Topology list (superseded by TOPOLOGY_BASE used in topologyApi.ts) ---
export const TOPOLOGY_LIST = '/api/topologies';

// --- User Management (no admin user-list page currently uses these;
//     FETCH_ADMIN_ACTIVE_USERS and UPDATE_USER_STATUS also have a wrong URL) ---
export const FETCH_ADMIN_ALL_USERS    = `/v1/admin/users`;
export const FETCH_ADMIN_ACTIVE_USERS = `/v1/google/tlmr/circuit-inventory-report`; // ⚠️ wrong URL
export const UPDATE_USER_STATUS       = `/v1/google/tlmr/circuit-inventory-report`; // ⚠️ wrong URL

// --- Ticketing — bulk upload (UI button not wired up yet) ---
// BULK_UPLOAD_TICKETING_ALARMS already declared in the used section above.

// --- Ticketing — old alias (superseded by FETCH_TICKETING_ALARM_LIST in used section) ---
export const FETCHING_DISTINCT_TICKETING = `v1/admin/customticketing/alarms`;

// --- Audit Page (AuditPage.tsx fetches data via a different mechanism) ---
export const AUDIT_ALARMS_AUDIT   = `/v1/admin/audit/alarms`;
export const AUDIT_SPANLOSS_AUDIT = `/v1/admin/audit/spanloss`;

// --- CONC DC Topology extra endpoints (ConcDcTopology.tsx only uses the base URL) ---
export const CONC_DC_TOPOLOGY_UPDATE_API_URL = `/v1/topology/conc/topo/updatecord`;
export const CONC_DC_CONNECTIVITY_API_URL    = `v1/topology/conc-dc/connectivity`;

// --- India Network Map — duplicate URL aliases (the canonical constant is used instead) ---
export const INDIA_NETWORK_TOPOLOGY = `/v1/dashboard/getCktChannelDetails`; // duplicate of GET_CKT_CHANNEL_DETAILS
export const GET_CITY_WISE_CAPACITY  = "/v1/dashboard/getCapacitySummaryCityWiseReport"; // duplicate of GET_TOTAL_CAPACITY_SUMMARY
export const GET_TYPE_WISE_CAPACITY  = "/v1/dashboard/getCapacitySummaryDetailedReport"; // duplicate of GET_SECTOR_WISE_CAPACITY_SUMMARY

// --- Topology utility — placeholder constants (all point to /api/topologies, never imported) ---
export const TOPOLOGY_ALARMS      = '/api/topologies';
export const TOPOLOGY_NODE_ALARMS = '/api/topologies';
export const TOPOLOGY_SUMMARY     = '/api/topologies';
export const TOPOLOGY_CONNECTIVITY = '/api/topologies';


// --- CIENA Feasibility (superseded by FEASIBILITY_NORMAL_JSON) ---
export const FEASIBILITY_API = "/v1/mcp/feasibility";

// --- API Management (no page currently uses this feature) ---
export const FETCH_ALL_APIS        = "/v1/apimanagement/list";
export const CREATE_API_ENTRY      = "/v1/apimanagement/create";
export const UPDATE_API_ENTRY      = "/v1/apimanagement/update";
export const DELETE_API_ENTRY      = "/v1/apimanagement/delete";
export const RUN_API_ENTRY         = "/v1/apimanagement/run";
export const FETCH_API_RUN_HISTORY = "/v1/apimanagement/history";
