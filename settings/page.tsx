"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<any>({});

  useEffect(() => {
    fetchWithAuth("/api/v1/integrations/status")
      .then((r) => r.json())
      .then(setIntegrations);
  }, []);

  const connectDrive = () => {
    window.location.href = "/api/v1/integrations/drive/auth";
  };
  const connectDropbox = () => {
    window.location.href = "/api/v1/integrations/dropbox/auth";
  };

  return (
    <div>
      <h1>Integrations</h1>
      <div>
        <p>Google Drive: {integrations.google_drive ? "Connected" : "Not connected"}</p>
        <button onClick={connectDrive}>Connect Google Drive</button>
      </div>
      <div>
        <p>Dropbox: {integrations.dropbox ? "Connected" : "Not connected"}</p>
        <button onClick={connectDropbox}>Connect Dropbox</button>
      </div>
    </div>
  );
}
