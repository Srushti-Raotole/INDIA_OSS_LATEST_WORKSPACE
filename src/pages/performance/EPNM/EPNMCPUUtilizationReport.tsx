import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMCPUUtilizationReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM CPU Utilization Report page opened", actionName: "EPNM_CPU_REPORT_PAGE", module: "PERFORMANCE" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM CPU Utilization Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/performance-reports/epnm-cpu-report.jsp"
    />
  );
};

export default EPNMCPUUtilizationReport;
