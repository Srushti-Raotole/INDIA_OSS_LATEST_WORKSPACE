import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMEthernetReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Ethernet Report page opened", actionName: "EPNM_ETHERNET_REPORT_PAGE", module: "PERFORMANCE" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Ethernet Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/performance-reports/epnm-ethernet-report.jsp"
    />
  );
};

export default EPNMEthernetReport;
