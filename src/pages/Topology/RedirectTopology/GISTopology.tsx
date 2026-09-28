import React from "react";
import EPNMIframe from "../../IframePageRedirect";


const GISTopology = () => {
  return (
    <EPNMIframe
      title="CONC DC Topology"
      src="https://dciossprod.lightstorm.in/dci/noc-web/topology/epnm-gis-topo.jsp"
    />
  );
};

export default GISTopology;
