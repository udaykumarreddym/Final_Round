// src/components/SelectedTextDisplay.jsx
import React from "react";

export default function SelectedTextDisplay({ text }) {
  if (!text) {
    return (
      <div className="bg-gradient-to-br from-red-500 to-red-700 text-white p-6 rounded-xl shadow-lg text-center">
        <div className="flex justify-center items-center mb-3">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-1">Analysis Workbench</h2>
        <p className="opacity-80 text-sm">
          Highlight text in the document to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 animate-fade-in-up">
      <h2 className="text-xl font-bold text-black mb-3">Your Query</h2>
      <blockquote className="border-l-4 border-red-500 bg-gray-50 p-4 rounded-r-lg text-gray-700 italic text-sm">
        “{text}”
      </blockquote>
    </div>
  );
}
