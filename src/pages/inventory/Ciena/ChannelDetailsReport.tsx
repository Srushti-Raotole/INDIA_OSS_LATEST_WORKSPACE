import React, { useEffect, useState } from "react";
import { Divider, Box, IconButton, Typography } from "@mui/material";
import { useOutletContext } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { FETCH_INVENTORY_CHANNEL_REPORT_DATA } from "@/api/apis";
import ExcelDownloadButton from "../../../components/common/ExcelDownloadButton";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import InvReportTable from "../InventoryReportTable";
import FullPageLoader from "../../../components/common/FullPageLoader";
import { logActivity } from "../../../utils/activityLogger";

// ---------- Lucide React Custom Control Icons ----------
import { Menu } from "lucide-react";

dayjs.extend(utc);
dayjs.extend(timezone);

type OutletContextType = { 
  open: boolean;
  handleDrawerOpen: () => void;
};

const ChannelDetailsReport: React.FC = () => {
  const { open, handleDrawerOpen } = useOutletContext<OutletContextType>();
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const TABLE_ID = "infr-google-circuits-dynamic";

  const convertToIST = (val: any) => {
    if (!val) return val;
    const str = String(val).trim();
    const hasTZ = /Z$/.test(str) || /[+-]\d{2}:\d{2}$/.test(str);

    let d;
    if (hasTZ) {
      d = dayjs(str).tz("Asia/Kolkata");
    } else {
      d = dayjs.tz(str, "Asia/Kolkata");
    }

    if (!d.isValid()) return val;
    return d.format("YYYY-MM-DD HH:mm:ss");
  };

  useEffect(() => {
    logActivity({
      activity: "CIENA Channel Details Report page opened",
      actionName: "CHANNEL_DETAILS_REPORT",
      module: "INVENTORY",
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`${FETCH_INVENTORY_CHANNEL_REPORT_DATA}`, {});
        
        let apiData = response.data;
        console.log("Fetched Channel Details Report Data:", apiData);

        if (apiData && !Array.isArray(apiData)) {
          apiData = apiData.data || apiData.result || apiData.results || apiData.items;
        }
        
        if (!Array.isArray(apiData)) {
          console.error("API did not return array", apiData);
          setTableData([]);
          return;
        }

        const updated = apiData.map((item) => {
          const copy = { ...item };
          // copy["Last Updated Admin State"] = convertToIST(copy["Last Updated Admin State"]);
          // copy["Last Updated Operational State"] = convertToIST(copy["Last Updated Operational State"]);
          return copy;
        });

        if (updated.length > 0) {
          setColumnOrder(Object.keys(updated[0]));
        }

        setTableData(updated);
      } catch (error) {
        console.error("Error fetching channel details:", error);
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
          height: "calc(100vh - 72px)", // Standard fluid view height metric mapping
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading ? (
          <FullPageLoader message="Loading CIENA Channel Details..." />
        ) : (
          <InvReportTable
            dataObjects={tableData}
            pageSize={25}
            tableId={TABLE_ID}
            renderTopToolbarCustomActions={() => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap' }}>
                
                {/* Embedded Inline Sidebar Open Trigger */}
                {!open && handleDrawerOpen && (
                  <IconButton
                    onClick={handleDrawerOpen}
                    size="small"
                    sx={{
                      bgcolor: "#f1f5f9", color: "#475569", width: 32, height: 32, borderRadius: 1.5, border: "1px solid #e2e8f0",
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
                  fileName="Ciena_Channel_Details_Report"
                />

                {/* Center-locked typography banner with custom layout ellipsis filters */}
                <Typography 
                  title="CIENA – CHANNEL DETAILS REPORT"
                  sx={{ 
                    fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em',
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'auto',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: open ? '35vw' : '50vw'
                  }}
                >
                  CIENA – CHANNEL DETAILS REPORT
                </Typography>
              </Box>
            )}
          />
        )}
      </Box>
    </Box>
  );
};

export default ChannelDetailsReport;