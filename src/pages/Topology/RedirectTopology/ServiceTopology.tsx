import React from "react";
import EPNMIframe from "../../IframePageRedirect";


const ServiceTopology = () => {
  return (
    <EPNMIframe
      title="CONC DC Topology"
      src="https://dciossprod.lightstorm.in/dci/noc-web/topology/epnm-service-topo.jsp"
    />
  );
};

export default ServiceTopology;
