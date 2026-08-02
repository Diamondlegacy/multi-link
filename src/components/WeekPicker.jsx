import React, { useEffect, useState } from "react";
import { getWeeksAsync } from "../services/dataService.js";

export default function WeekPicker({ selectedWeek, onChange }) {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeksAsync()
      .then((data) => {
        setWeeks(data.weeks);
        if (!selectedWeek) onChange(data.currentWeekNumber);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || weeks.length === 0) return null;

  return (
    <select
      className="week-picker"
      value={selectedWeek || ""}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {weeks.map((w) => (
        <option key={w.weekNumber} value={w.weekNumber}>
          Week {w.weekNumber} ({formatShort(w.startDate)} – {formatShort(w.endDate)})
        </option>
      ))}
    </select>
  );
}

function formatShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}
