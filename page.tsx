"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchWithAuth("/api/v1/analytics/summary?days=30")
      .then((r) => r.json())
      .then(setSummary);
  }, []);

  return (
    <div>
      <h1>Analytics</h1>
      {summary && (
        <ul>
          <li>Impressions: {summary.impressions}</li>
          <li>Clicks: {summary.clicks}</li>
          <li>Conversions: {summary.conversions}</li>
        </ul>
      )}
    </div>
  );
}
