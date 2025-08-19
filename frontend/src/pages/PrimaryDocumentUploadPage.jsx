import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PrimaryDocumentUploadPage({ onSubmit }) {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  // --- ADDED: State management for API call ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  // --- MODIFIED: canSubmit now accounts for loading state ---
  const canSubmit = file !== null && !isLoading;

  // --- MODIFIED: handleSubmit now performs the API call ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/ingest/upload_single", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to process document.");
      }
      onSubmit(file); // Navigate on success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-black">
              Step 2: Upload Focus Document
            </h2>
            <p className="text-gray-500 text-sm">
              Select the single document you want to read.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* The single file input */}
          <label
            htmlFor="file-upload"
            className="relative cursor-pointer bg-gray-50 hover:bg-red-50 border-2 border-dashed border-gray-300 hover:border-red-400 rounded-lg p-10 text-center block transition-colors duration-300"
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="mt-2 block text-sm font-medium text-red-600">
              {file ? "Change file..." : "Click to upload a document"}
            </span>
            <span className="mt-1 block text-xs text-gray-500">PDF only</span>
            <input
              id="file-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {/* Display the name of the selected file */}
          {file && (
            <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-800 flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
              <span className="font-semibold truncate">{file.name}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full sm:w-auto text-gray-800 bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg font-semibold transition-colors duration-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full sm:flex-grow text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform disabled:bg-gray-400 disabled:cursor-not-allowed enabled:bg-red-600 enabled:hover:bg-red-700 enabled:hover:-translate-y-1 enabled:shadow-lg"
            >
              Analyze Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
