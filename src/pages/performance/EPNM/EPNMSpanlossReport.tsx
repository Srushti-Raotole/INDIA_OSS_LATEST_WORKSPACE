import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMSpanlossReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Spanloss Report page opened", actionName: "EPNM_SPANLOSS_REPORT_PAGE", module: "PERFORMANCE" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Spanloss Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/performance-reports/epnm-spanloss-report.jsp"
    />
  );
};

export default EPNMSpanlossReport;
