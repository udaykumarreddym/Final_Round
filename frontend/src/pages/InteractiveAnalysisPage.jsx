import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PDFViewer from "../components/PDFViewer";

export default function InteractiveAnalysisPage({ primaryDocument, onSubmit }) {
  const navigate = useNavigate();
  const [editableText, setEditableText] = useState("");
  // --- ADDED: State management for API call ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTextSelection = useCallback((text) => {
    console.log(`Text from PDF received and set in textarea: "${text}"`);
    setEditableText(text);
  }, []);

  // --- MODIFIED: handleSubmit now performs the search API call ---
  const handleSubmit = async () => {
    if (!editableText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    console.log("Submitting query:", editableText);

    try {
      const response = await fetch("/search/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: editableText, top_k: 3 }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Search request failed.");
      }
      const data = await response.json();
      onSubmit(editableText, data.results); // Pass query and results to App.js to navigate
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!primaryDocument) {
    return (
      <div className="text-center animate-fade-in-up max-w-lg mx-auto mt-10">
        <h2 className="text-2xl font-bold text-black mb-2">
          No Document To Analyze
        </h2>
        <p className="text-gray-600 mb-6">
          Please start from the beginning to select a document.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-red-600 text-white font-semibold px-6 py-3 rounded-lg"
        >
          Go to Upload Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* PDF Viewer */}
      <div className="w-full">
        <PDFViewer
          primaryDocument={primaryDocument}
          onTextSelect={handleTextSelection}
        />
      </div>

      {/* --- THIS IS THE RESTORED EDITABLE TEXT BOX SECTION --- */}
      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
        <label
          htmlFor="query-box"
          className="text-xl font-bold text-black mb-3 block"
        >
          Your Query
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Select text from the PDF above and single tap in the box to drop it
          automatically, or type your own query here to analyze.
        </p>
        <textarea
          id="query-box"
          // 3. The 'value' is linked to our state. When state changes, the box updates.
          value={editableText}
          // 4. The 'onChange' allows the user to manually edit the text, updating the state.
          onChange={(e) => setEditableText(e.target.value)}
          className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 text-black transition-colors duration-200 ease-in-out focus:border-red-500 focus:outline-none focus:ring-0"
          rows={4}
          placeholder="Selected text will appear here..."
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={!editableText.trim()}
            className="text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform disabled:bg-gray-400 disabled:cursor-not-allowed enabled:bg-red-600 enabled:hover:bg-red-700 enabled:hover:-translate-y-1 enabled:shadow-lg"
          >
            Find Related Sections
          </button>
        </div>
      </div>
    </div>
  );
}
