import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMOTNReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM OTN Report page opened", actionName: "EPNM_OTN_REPORT_PAGE", module: "PERFORMANCE" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM OTN Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/performance-reports/epnm-otn-report.jsp"
    />
  );
};

export default EPNMOTNReport;
