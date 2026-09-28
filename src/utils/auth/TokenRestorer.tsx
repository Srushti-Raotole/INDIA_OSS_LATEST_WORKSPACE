

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TOKEN_KEY = "LS_AUTH_TOKEN";

function TokenRestorer() {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      // Security Issue Fix - Store incoming URL token in sessionStorage (not localStorage).
      // sessionStorage is tab-scoped and cleared on tab close, preventing token leakage.
      sessionStorage.setItem(TOKEN_KEY, token);
      window.history.replaceState({}, document.title, window.location.pathname);

    }
  }, [location]);

  return null;
}

export default TokenRestorer;