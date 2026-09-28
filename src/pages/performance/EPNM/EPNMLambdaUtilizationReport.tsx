import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMLambdaUtilizationReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Lambda Utilization Report page opened", actionName: "EPNM_LAMBDA_REPORT_PAGE", module: "PERFORMANCE" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Lambda Utilization Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/performance-reports/epnm-lambda-report.jsp"
    />
  );
};

export default EPNMLambdaUtilizationReport;
