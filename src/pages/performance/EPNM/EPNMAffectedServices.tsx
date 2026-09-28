import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMAffectedServices: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Affected Services Report page opened", actionName: "EPNM_AFFECTED_SERVICES_PAGE", module: "PERFORMANCE" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Affected Services"
      src="https://dciossprod.lightstorm.in/dci/noc-web/performance-reports/epnm-affected-services-report.jsp"
    />
  );
};

export default EPNMAffectedServices;
