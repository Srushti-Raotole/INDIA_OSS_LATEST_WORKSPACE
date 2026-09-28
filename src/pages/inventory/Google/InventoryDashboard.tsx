import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const InventoryDashboard: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Inventory Dashboard page opened", actionName: "EPNM_INVENTORY_DASHBOARD_PAGE", module: "INVENTORY" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Inventory Dashboard"
      src="https://dciossprod.lightstorm.in/dci/noc-web/inventory/epnm-invdash-report.jsp"
    />
  );
};

export default InventoryDashboard;
