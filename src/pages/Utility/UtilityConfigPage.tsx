import React, { useEffect, useState } from "react";
import { logActivity } from "../../utils/activityLogger";
import axiosClient from "@/api/axiosClient";
import { UTILITY_CONFIG_ARCHIVE_URL } from "@/api/apis";

const NAVBAR_HEIGHT = "5vh";

const UtilityConfigPage: React.FC = () => {
  // Security Issue Fix - authkey no longer hardcoded in source.
  // The full config archive URL (including authkey) is stored in application.properties
  // on the backend and served via a JWT-protected endpoint at runtime.
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    logActivity({ activity: "Utility Config page opened", actionName: "UTILITY_CONFIG_PAGE", module: "UTILITY" });

    axiosClient
      .get<{ url: string }>(UTILITY_CONFIG_ARCHIVE_URL)
      .then((res) => setIframeSrc(res.data.url))
      .catch(() => setError(true));
  }, []);

  return (
    <div
      style={{
        height: `calc(100vh - ${NAVBAR_HEIGHT})`,
        width: "100vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {error ? (
        <p style={{ color: "#888" }}>Unable to load config archive. Please try again.</p>
      ) : iframeSrc ? (
        <iframe
          title="Utility Config"
          src={iframeSrc}
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
      ) : (
        <p style={{ color: "#888" }}>Loading...</p>
      )}
    </div>
  );
};

export default UtilityConfigPage;
