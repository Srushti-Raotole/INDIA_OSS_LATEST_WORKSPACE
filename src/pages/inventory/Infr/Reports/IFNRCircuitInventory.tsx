import React, { useEffect, useState } from "react";
import { Divider, Box, IconButton, Typography } from "@mui/material";
import { useOutletContext, useParams } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import { FETCH_INFR_CIRCUIT_INVENTORY_REPORT } from "@/api/apis";

import ExcelDownloadButton from "../../../../components/common/ExcelDownloadButton";
import InvReportTable from "../../InventoryReportTable";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import FullPageLoader from "../../../../components/common/FullPageLoader";

// ---------- Lucide React Custom Control Icons ----------
import { Menu } from "lucide-react";

dayjs.extend(utc);
dayjs.extend(timezone);

type OutletContextType = { 
  open: boolean;
  handleDrawerOpen: () => void;
};

const IFNRCircuitInventory: React.FC = () => {
  const { open, handleDrawerOpen } = useOutletContext<OutletContextType>();
  const { client } = useParams<{ client: string }>();

  const clientLabel = decodeURIComponent(client || "").toUpperCase();

  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const TABLE_ID = "INFR_IFNR_Circuit_Inventory";

  /* ================= TIME CONVERSION ================= */
  const convertToIST = (val: any) => {
    if (!val) return val;

    const str = String(val).trim();
    const hasTZ = /Z$/.test(str) || /[+-]\d{2}:\d{2}$/.test(str);

    const d = hasTZ
      ? dayjs(str).tz("Asia/Kolkata")
      : dayjs.tz(str, "Asia/Kolkata");

    if (!d.isValid()) return val;

    return d.format("YYYY-MM-DD HH:mm:ss");
  };

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!client) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await axiosClient.get(
          FETCH_INFR_CIRCUIT_INVENTORY_REPORT,
          {
            params: {
              client: clientLabel,
            },
          }
        );
        let apiData = response.data;
        if (apiData && !Array.isArray(apiData)) {
          apiData = apiData.data || apiData.result || apiData.results || apiData.items;
        }

        if (!Array.isArray(apiData)) {
          setTableData([]);
          return;
        }

        const updated = apiData.map((item: any) => {
          const copy = { ...item };
          // copy["Last Synchronized"] = convertToIST(copy["Last Synchronized"]);
          // copy["Last State Updated"] = convertToIST(copy["Last State Updated"]);
          return copy;
        });

        if (updated.length > 0) {
          setColumnOrder(Object.keys(updated[0]));
        }

        setTableData(updated);
      } catch (err) {
        console.error("Error fetching IFNR Circuit Inventory:", err);
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client]);

  return (
    <Box sx={{ backgroundColor: "#ffffff", height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          padding: "0",
          m: 0,
          width: "100%",
          height: "calc(100vh - 72px)", // Ensures dynamic structural height alignment
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading ? (
          <FullPageLoader message={`Loading IFNR ${clientLabel} Circuit Inventory data...`} />
        ) : (
          <InvReportTable
            dataObjects={tableData}
            pageSize={25}
            tableId={TABLE_ID}
            renderTopToolbarCustomActions={() => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap' }}>
                
                {/* Custom Inline Menu Toggle Button */}
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
                  fileName={`IFNR_${clientLabel}_Circuit_Inventory_Report`}
                />

                {/* Centered Truncated Heading Component */}
                <Typography 
                  title={`IFNR ${clientLabel} – CIRCUIT INVENTORY REPORT`}
                  sx={{ 
                    fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em',
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'auto',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: open ? '35vw' : '50vw'
                  }}
                >
                  IFNR {clientLabel} – CIRCUIT INVENTORY REPORT
                </Typography>
              </Box>
            )}
          />
        )}
      </Box>
    </Box>
  );
};

export default IFNRCircuitInventory;