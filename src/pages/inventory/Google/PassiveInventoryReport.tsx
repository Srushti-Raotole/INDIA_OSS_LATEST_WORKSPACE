import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const PassiveInventoryReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Passive Inventory Report page opened", actionName: "EPNM_PASSIVE_INVENTORY_PAGE", module: "INVENTORY" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Passive Inventory Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/inventory/epnm-passiveinv-report.jsp"
    />
  );
};

export default PassiveInventoryReport;
