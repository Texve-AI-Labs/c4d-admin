import React, { useEffect, useRef } from "react";

const GEO_INTELLIGENCE_URL = "https://geointelligence-cd5f6.web.app";

const GeoIntelligence = () => {
  const iframeRef = useRef(null);

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("loggedInUser") || "{}");
    } catch {
      return {};
    }
  };

  const buildPayload = () => {
    const user = getStoredUser();
    const token = localStorage.getItem("token") || "";

    return {
      type: "C4D_PORTAL_AUTH",
      source: "c4d-admin-portal",
      session: token,
      token,
      userId: user?.id || null,
      userName: user?.name || user?.email || "",
      role: user?.role || user?.userType || "",
      deviceToken: user?.deviceToken || "",
    };
  };

  const postMessageToIframe = () => {
    const iframeWindow = iframeRef.current?.contentWindow;
    const payload = buildPayload();

    // console.log("[Geo Intelligence] prepared auth payload", payload);

    if (!iframeWindow) {
      console.warn("[Geo Intelligence] iframe window is not available");
      return;
    }

    // console.log("[Geo Intelligence] sending postMessage to iframe");
    iframeWindow.postMessage(payload, "*");
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return undefined;

    const handleLoad = () => {
      // console.log("[Geo Intelligence] iframe loaded", GEO_INTELLIGENCE_URL);
      postMessageToIframe();
    };

    iframe.addEventListener("load", handleLoad);

    const retryTimer = window.setTimeout(() => {
      console.log("[Geo Intelligence] retrying postMessage");
      postMessageToIframe();
    }, 800);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      window.clearTimeout(retryTimer);
    };
  }, []);

  return (
    <div className="flex h-full w-full">
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <iframe
          ref={iframeRef}
          title="Geo Intelligence"
          src={GEO_INTELLIGENCE_URL}
          className="h-full w-full"
          referrerPolicy="no-referrer-when-downgrade"
          allow="clipboard-read; clipboard-write; geolocation"
        />
      </div>
    </div>
  );
};

export default GeoIntelligence;