import React, { useEffect } from "react";
import { logActivity } from "../../utils/activityLogger";

const NAVBAR_HEIGHT = "5vh";

const UtilitySIListPage: React.FC = () => {
  useEffect(() => {
    logActivity({ activity: "Service Inventory List page opened", actionName: "UTILITY_SI_LIST_PAGE", module: "UTILITY" });
  }, []);

  return (
    <div
      style={{
        height: `calc(100vh - ${NAVBAR_HEIGHT})`,
        width: "100vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <iframe
        title="Utility Config"
        src="https://ldcnoc.lightstorm.in/Service_Inventory/login"
        style={{
          border: "none",
          height: "100%",
          width: "100%",
          display: "block",
        }}
        loading="lazy"
        scrolling="yes"
        allowFullScreen
      />
    </div>
  );
};

export default UtilitySIListPage;
