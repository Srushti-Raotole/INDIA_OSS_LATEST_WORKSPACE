import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMTemperatureReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Temperature Report page opened", actionName: "EPNM_TEMPERATURE_REPORT_PAGE", module: "PERFORMANCE" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Temperature Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/performance-reports/epnm-temperature-report.jsp"
    />
  );
};

export default EPNMTemperatureReport;
