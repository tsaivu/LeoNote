import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error("Service worker registration failed", error);
    },
  });

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="pwa-status pwa-status-offline" role="status">
        Offline. Viewing the app shell only; saving and loading task data requires a connection.
      </div>
    );
  }

  if (needRefresh) {
    return (
      <div className="pwa-status pwa-status-update" role="status">
        <span>A new version is available.</span>
        <button type="button" onClick={() => updateServiceWorker(true)}>
          Update
        </button>
        <button className="pwa-status-dismiss" type="button" aria-label="Dismiss update" onClick={() => setNeedRefresh(false)}>
          ×
        </button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="pwa-status pwa-status-ready" role="status">
        <span>App shell is ready for offline launch.</span>
        <button className="pwa-status-dismiss" type="button" aria-label="Dismiss message" onClick={() => setOfflineReady(false)}>
          ×
        </button>
      </div>
    );
  }

  return null;
}
