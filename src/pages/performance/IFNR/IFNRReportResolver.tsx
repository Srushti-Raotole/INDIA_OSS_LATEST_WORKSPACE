import React from "react";
import { useParams } from "react-router-dom";

import IFNRCPUReport from "./Reports/IFNRCPUReport";
import IFNRAWSMemoryUtilizationReport from "./Reports/IFNRMemoryUtilizationReport";
import IFNRSpanlossReport from "./Reports/IFNRSpanlossReport";
import IFNREthernetReport from "./Reports/IFNREthernetReport";
import IFNROtnReport from "./Reports/IFNROtnReport";

export default function IFNRReportResolver() {
  const { report } = useParams();

  const reportMap: Record<string, React.ReactNode> = {
    "cpu-utilization-report": <IFNRCPUReport />,
    "memory-utilization-report": <IFNRAWSMemoryUtilizationReport />,
    "spanloss-report": <IFNRSpanlossReport />,
    "ethernet-report": <IFNREthernetReport />,
    "otn-report": <IFNROtnReport />,
  };

  return reportMap[report!] ?? <div>Report not found</div>;
}
