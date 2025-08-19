import React, { useState } from "react";

export default function KnowledgeUploadPage({ onSubmit }) {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  // --- ADDED: State management for API call ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prevFiles) => {
      const existingFileNames = new Set(prevFiles.map((f) => f.name));
      const uniqueNewFiles = newFiles.filter(
        (f) => !existingFileNames.has(f.name)
      );
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  // --- MODIFIED: canSubmit now accounts for loading state ---
  const canSubmit = files.length > 0 && !isLoading;

  // --- MODIFIED: handleSubmit now performs the API call ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/ingest/upload_bulk", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to upload files.");
      }
      // --- FIX: Pass the 'files' array to the onSubmit handler ---
      onSubmit(files);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileChange({ target: { files: e.dataTransfer.files } });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-black">
              Step 1: Build Your Knowledge Base
            </h2>
            <p className="text-gray-500 text-sm">
              Upload all relevant context documents (PDFs).
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File input and drag-and-drop area */}
          <label
            htmlFor="knowledge-file-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative block border-2 border-dashed rounded-lg p-10 text-center transition-colors duration-300 cursor-pointer ${
              isDragOver
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-red-400 hover:bg-gray-50"
            }`}
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
              Click to upload or drag & drop
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              Multiple PDFs supported
            </span>
            <input
              id="knowledge-file-upload"
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {/* List of selected files */}
          {files.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-2">
                Selected Files ({files.length}):
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-100 p-2 rounded-md text-sm text-gray-800 flex items-center gap-3"
                  >
                    <svg
                      className="w-5 h-5 text-red-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                    <span className="font-medium truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform disabled:bg-gray-400 disabled:cursor-not-allowed enabled:bg-red-600 enabled:hover:bg-red-700 enabled:hover:-translate-y-1 enabled:shadow-lg"
          >
            Next: Choose Focus Document
          </button>
        </form>
      </div>
    </div>
  );
}
