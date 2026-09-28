
import React, { useEffect, useState } from "react";
import { Divider, Box, IconButton, Typography } from "@mui/material";
import { useOutletContext } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { FETCH_INVENTORY_EQUIPMENT_REPORT_DATA } from "@/api/apis";
import ExcelDownloadButton from "../../../components/common/ExcelDownloadButton";
import InvReportTable from "../InventoryReportTable";
import FullPageLoader from "../../../components/common/FullPageLoader";
import { logActivity } from "../../../utils/activityLogger";

// ---------- Lucide React Custom Control Icons ----------
import { Menu } from "lucide-react";

type OutletContextType = { 
  open: boolean;
  handleDrawerOpen: () => void;
};

const EquipmentDetailsReport: React.FC = () => {
  const { open, handleDrawerOpen } = useOutletContext<OutletContextType>();
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const TABLE_ID = "infr-google-circuits-dynamic";

  useEffect(() => {
    logActivity({
      activity: "CIENA Equipment Details Report page opened",
      actionName: "EQUIPMENT_DETAILS_REPORT",
      module: "INVENTORY",
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`${FETCH_INVENTORY_EQUIPMENT_REPORT_DATA}`, {});
        
        let apiData = response.data;
        console.log("Fetched Equipment Details Report Data:", apiData);

        if (apiData && !Array.isArray(apiData)) {
          apiData = apiData.data || apiData.result || apiData.results || apiData.items;
        }

        if (!Array.isArray(apiData)) {
          console.error("API did not return array", apiData);
          setTableData([]);
          return;
        }

        if (apiData.length > 0) {
          setColumnOrder(Object.keys(apiData[0]));
        }

        setTableData(apiData);
      } catch (error) {
        console.error("Error fetching equipment details:", error);
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box sx={{ backgroundColor: "#ffffff", height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          padding: "0",
          m: 0,
          width: "100%",
          height: "calc(100vh - 72px)", // Dynamic functional view canvas constraint boundary
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading ? (
          <FullPageLoader message="Loading CIENA Equipment Details..." />
        ) : (
          <InvReportTable
            dataObjects={tableData}
            pageSize={25}
            tableId={TABLE_ID}
            renderTopToolbarCustomActions={() => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap' }}>
                
                {/* Custom Inline Menu Toggle Controller Trigger */}
                {!open && handleDrawerOpen && (
                  <IconButton
                    onClick={handleDrawerOpen}
                    size="small"
                    sx={{
                      bgcolor: "#f1f5f9",
                      color: "#475569",
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      border: "1px solid #e2e8f0",
                      "&:hover": { bgcolor: "#e2e8f0" },
                    }}
                  >
                    <Menu size={18} strokeWidth={2.5} />
                  </IconButton>
                )}

                <ExcelDownloadButton
                  data={tableData}
                  columnOrder={columnOrder}
                  tableId={TABLE_ID}
                  fileName="Ciena_Equipment_Details_Report"
                />

                {/* Center-locked header heading label string text with clean text clipping ellipsis filters */}
                <Typography 
                  title="CIENA - EQUIPMENT DETAILS REPORT"
                  sx={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: '#334155', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.04em',
                    position: 'absolute', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    textAlign: 'center', 
                    pointerEvents: 'auto',
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    maxWidth: open ? '35vw' : '50vw'
                  }}
                >
                  CIENA - EQUIPMENT DETAILS REPORT
                </Typography>
              </Box>
            )}
          />
        )}
      </Box>
    </Box>
  );
};

export default EquipmentDetailsReport;