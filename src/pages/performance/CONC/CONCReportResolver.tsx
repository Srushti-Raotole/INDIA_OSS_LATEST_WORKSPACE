import React from "react";
import { useParams } from "react-router-dom";
import CONCEthernetReport from "./Reports/ConcEthernetReport";
import CONCOtnReport from "./Reports/ConcOtnReport";



export default function CONCReportResolver() {
  const { report } = useParams();

  const reportMap: Record<string, React.ReactNode> = {
    "ethernet-report": <CONCEthernetReport />,
    "otn-report": <CONCOtnReport />,
  };

  return reportMap[report!] ?? <div>Report not found</div>;
}
