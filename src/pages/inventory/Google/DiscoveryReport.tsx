import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const DiscoveryReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Discovery Report page opened", actionName: "EPNM_DISCOVERY_REPORT_PAGE", module: "INVENTORY" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Discovery Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/inventory/epnm-discover-report.jsp"
    />
  );
};

export default DiscoveryReport;
