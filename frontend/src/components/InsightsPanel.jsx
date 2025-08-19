import React from "react";

export default function InsightsPanel({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 h-full">
      <h2 className="text-xl font-bold text-black mb-4">Key Insights</h2>
      <ul className="space-y-3">
        {insights.map((insight, idx) => (
          <li
            key={idx}
            className="flex items-start p-3 bg-gray-50 rounded-lg border-l-4 border-yellow-400"
          >
            <svg
              className="w-6 h-6 mr-3 text-yellow-500 flex-shrink-0 mt-0.5"
              fill="currentColor" /* ... */
            ></svg>
            <span className="text-gray-700 text-sm">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
