import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMNEListReport: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM NE List Report page opened", actionName: "EPNM_NE_LIST_REPORT_PAGE", module: "INVENTORY" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM NE List Report"
      src="https://dciossprod.lightstorm.in/dci/noc-web/inventory/epnm-nelist-report.jsp"
    />
  );
};

export default EPNMNEListReport;
