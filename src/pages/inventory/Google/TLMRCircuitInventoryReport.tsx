import React, { useEffect, useState } from "react";
import { Divider, Box, IconButton, Typography } from "@mui/material";
import { useOutletContext } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { FETCH_GOOGLE_TLMR_CIRCUIT_INVENTORY_REPORT } from "@/api/apis";
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

const AWSInfrCircuitInventory: React.FC = () => {
  const { open, handleDrawerOpen } = useOutletContext<OutletContextType>();
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const TABLE_ID = "TLMR_CircuitInventory_report";

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
      activity: "TLMR Circuit Inventory Report page opened",
      actionName: "TLMR_CIRCUIT_INVENTORY",
      module: "INVENTORY",
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`${FETCH_GOOGLE_TLMR_CIRCUIT_INVENTORY_REPORT}`, {});
        
        let apiData = response.data;
        console.log("Fetched Circuit Inventory Report Data:", apiData);

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
          // copy["Last Synchronized"] = convertToIST(copy["Last Synchronized"]);
          // copy["Last State Updated"] = convertToIST(copy["Last State Updated"]);
          return copy;
        });

        if (updated.length > 0) {
          setColumnOrder(Object.keys(updated[0]));
        }

        setTableData(updated);
      } catch (error) {
        console.error("Error fetching circuit details:", error);
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
          height: "calc(100vh - 72px)", // Shared inventory height variable constraint
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading ? (
          <FullPageLoader message="Loading TLMR Circuit Inventory Report..." />
        ) : (
          <InvReportTable
            dataObjects={tableData}
            pageSize={25}
            tableId={TABLE_ID}
            renderTopToolbarCustomActions={() => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap' }}>
                
                {/* Embedded Inline Sidebar Open Controller Trigger */}
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
                  fileName="TLMR_Circuit_Inventory_Report"
                />

                {/* Center-locked header text label with text-clipping constraints */}
                <Typography 
                  title="TLMR - CIRCUIT INVENTORY REPORT"
                  sx={{ 
                    fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em',
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'auto',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: open ? '35vw' : '50vw'
                  }}
                >
                  TLMR - CIRCUIT INVENTORY REPORT
                </Typography>
              </Box>
            )}
          />
        )}
      </Box>
    </Box>
  );
};

export default AWSInfrCircuitInventory;