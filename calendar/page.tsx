"use client";
import { useEffect, useState } from "react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { fetchWithAuth } from "@/lib/auth";
import { Calendar } from "@/components/Calendar";
import { useUIStore } from "@/stores/ui-store";
import { generateWeek } from "@/lib/api";
import { PostEditor } from "@/components/PostEditor";

export default function CalendarPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const view = useUIStore((s) => s.calendarView);
  const setView = useUIStore((s) => s.setCalendarView);

  useEffect(() => {
    const now = new Date();
    const start = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    fetchWithAuth(`/api/v1/calendar?startDate=${start}&endDate=${end}`)
      .then((r) => r.json())
      .then(setPosts);
  }, []);

  const handleGenerate = async () => {
    const { jobId } = await generateWeek();
    setTimeout(() => {
      const now = new Date();
      const start = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const end = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
      fetchWithAuth(`/api/v1/calendar?startDate=${start}&endDate=${end}`)
        .then((r) => r.json())
        .then(setPosts);
    }, 3000);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setView("week")}>Week</button>
        <button onClick={() => setView("month")}>Month</button>
        <button onClick={handleGenerate}>Generate Week</button>
      </div>
      <Calendar posts={posts} view={view} />
      <PostEditor />
    </div>
  );
}
