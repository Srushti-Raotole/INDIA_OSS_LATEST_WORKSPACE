import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const ServiceInventoryReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Service Inventory Report page opened", actionName: "EPNM_SERVICE_INVENTORY_PAGE", module: "INVENTORY" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Service Inventory Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/inventory/epnm-servinv-report.jsp"
    />
  );
};

export default ServiceInventoryReport;
