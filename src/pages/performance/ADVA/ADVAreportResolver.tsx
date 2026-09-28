import React from "react";
import { useParams } from "react-router-dom";
import AdvaSpanlossReport from "./Reports/AdvaSpanlossReport";
import AdvaTemperatureReport from "./Reports/AdvaTemperatureReport";


export default function ADVAReportResolver() {
  const { report } = useParams();

  const reportMap: Record<string, React.ReactNode> = {
    "spanloss-report": <AdvaSpanlossReport />,
    "temperature-report": <AdvaTemperatureReport />,
  };

  return reportMap[report!] ?? <div>Report not found</div>;
}
