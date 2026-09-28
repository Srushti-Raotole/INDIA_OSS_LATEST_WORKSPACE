import React, { useEffect } from "react";
import EPNMIframe from "../../IframePageRedirect";
import { logActivity } from "../../../utils/activityLogger";

const EPNMTicketingTrend: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "EPNM Ticketing Trend Report page opened", actionName: "EPNM_TICKETING_TREND_PAGE", module: "PERFORMANCE" });
  }, []);
  return (
    <EPNMIframe
      title="EPNM Ticketing Trend"
      src="https://dciossprod.lightstorm.in/dci/noc-web/performance-reports/epnm-ticketing-trend-report.jsp"
    />
  );
};

export default EPNMTicketingTrend;
