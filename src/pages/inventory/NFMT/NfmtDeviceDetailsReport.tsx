import React, { useEffect, useState } from "react";
import { Divider, Box, IconButton, Typography } from "@mui/material";
import { useOutletContext } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { FETCH_INVENTORY_NFMT_DEVICE_DETAILS_DATA } from "@/api/apis";
import ExcelDownloadButton from "../../../components/common/ExcelDownloadButton";
import InvReportTable from "../InventoryReportTable";
import FullPageLoader from "../../../components/common/FullPageLoader";
import { logActivity } from "../../../utils/activityLogger";

import { Menu } from "lucide-react";

type OutletContextType = { 
  open: boolean;
  handleDrawerOpen: () => void;
};

const NfmtDeviceDetailsReport: React.FC = () => {
  const { open, handleDrawerOpen } = useOutletContext<OutletContextType>();
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const TABLE_ID = "ne-list-report-table";

  const formatToSimpleDateTime = (val: any) => {
    if (!val) return val;
    const str = String(val).trim();
    const match = str.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
    if (!match) return val;
    return `${match[1]} ${match[2]}`;
  };

  useEffect(() => {
    logActivity({
      activity: "NFMT Device Details Report page opened",
      actionName: "NFMT_NE_LIST",
      module: "INVENTORY",
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`${FETCH_INVENTORY_NFMT_DEVICE_DETAILS_DATA}`, {});
        let apiData = response.data;
        console.log("Fetched NFMT Device Details Report Data:", apiData);

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
          copy["Creation Time"] = formatToSimpleDateTime(copy["Creation Time"]);
          copy["Collection Time"] = formatToSimpleDateTime(copy["Collection Time"]);
          copy["OSS Insertion Time"] = formatToSimpleDateTime(copy["OSS Insertion Time"]);
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
          height: "calc(100vh - 72px)", // Shared workspace available layout boundaries
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading ? (
          <FullPageLoader message="Loading NFMT Device Details Report..." />
        ) : (
          <InvReportTable
            dataObjects={tableData}
            pageSize={25}
            tableId={TABLE_ID}
            renderTopToolbarCustomActions={() => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap' }}>
                
                {/* Embedded Dynamic Sidebar Open Controller Trigger */}
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
                  fileName="Device_Details_Report"
                />

                {/* Center-locked header text title with single-line truncation parameters */}
                <Typography 
                  title="NOKIA - NE LIST REPORT"
                  sx={{ 
                    fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em',
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'auto',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: open ? '35vw' : '50vw'
                  }}
                >
                  NOKIA - NE LIST REPORT
                </Typography>
              </Box>
            )}
          />
        )}
      </Box>
    </Box>
  );
};

export default NfmtDeviceDetailsReport;