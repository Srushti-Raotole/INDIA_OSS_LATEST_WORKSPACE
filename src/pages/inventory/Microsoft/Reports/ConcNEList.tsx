import React, { useEffect, useState } from "react";
import { Divider, Box, IconButton, Typography } from "@mui/material";
import { useOutletContext, useParams } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { FETCH_CONC_NE_LIST_REPORT } from "@/api/apis";
import ExcelDownloadButton from "../../../../components/common/ExcelDownloadButton";
import InvReportTable from "../../InventoryReportTable";
import FullPageLoader from "../../../../components/common/FullPageLoader";
import { Menu } from "lucide-react";

type OutletContextType = {
  open: boolean;
  handleDrawerOpen: () => void;
};

const CONCNEListReport: React.FC = () => {
  const { open, handleDrawerOpen } = useOutletContext<OutletContextType>();
  const { client } = useParams<{ client: string }>();

  const clientLabel = decodeURIComponent(client || "");
  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const TABLE_ID = "INVENTORY_CONC_NE_LIST";

  useEffect(() => {
    if (!client) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(FETCH_CONC_NE_LIST_REPORT, {
          params: {
            client: clientLabel,
            adapter: "CONC"
          },
        });

        let apiData = response.data;
        if (apiData && !Array.isArray(apiData)) {
          apiData = apiData.data || apiData.result || apiData.results || apiData.items;
        }

        if (!Array.isArray(apiData)) {
          setTableData([]);
          return;
        }

        const updated = apiData.map((item: any) => ({ ...item }));
        if (updated.length > 0) {
          setColumnOrder(Object.keys(updated[0]));
        }
        setTableData(updated);
      } catch (err) {
        console.error("Error fetching CONC NE List:", err);
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
          height: "calc(100vh - 72px)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {loading ? (
          <FullPageLoader message={`Loading CONC ${clientLabel} NE List data...`} />
        ) : (
          <InvReportTable
            dataObjects={tableData}
            pageSize={25}
            tableId={TABLE_ID}
            renderTopToolbarCustomActions={() => (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap' }}>

                {/* Embedded Sidebar Open Trigger */}
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
                  fileName={`CONC_${clientLabel}_NE_List_Report`}
                />

                {/* Centered Heading Layout Configuration */}
                <Typography
                  title={`CONC ${clientLabel} – NE LIST REPORT`}
                  sx={{
                    fontSize: '0.8rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em',
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'auto',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: open ? '35vw' : '50vw'
                  }}
                >
                  CONC {clientLabel} – NE LIST REPORT
                </Typography>
              </Box>
            )}
          />
        )}
      </Box>
    </Box>
  );
};

export default CONCNEListReport;