// In src/components/SnippetNavigator.jsx

import React from "react";

export default function SnippetNavigator({ snippets, onSnippetClick }) {
  // A helper function to extract just the filename from the full path
  const getFileName = (fullPath) => {
    if (!fullPath) return "Unknown Source";
    return fullPath.split("/").pop();
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-black mb-4">Relevant Sections</h2>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {snippets && snippets.length > 0 ? (
          snippets.map((snippet, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 p-3 rounded-lg"
            >
              {/* --- FIX: Use the correct, case-sensitive property names --- */}
              <h3 className="font-semibold text-gray-800">{snippet.Header}</h3>
              <p className="text-xs text-gray-500 mb-2 truncate">
                Source: {getFileName(snippet.PDF_Name)}
              </p>
              <p className="text-sm text-gray-600 mb-3">{snippet.Content}</p>
              <button
                onClick={() =>
                  onSnippetClick(snippet.Page, getFileName(snippet.PDF_Name))
                }
                className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors"
              >
                Go to Page {snippet.Page}
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No relevant sections found.</p>
        )}
      </div>
    </div>
  );
}
