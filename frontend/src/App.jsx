import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

// Import all pages and the layout header
import Header from "./components/Header";
import KnowledgeUploadPage from "./pages/KnowledgeUploadPage";
import PrimaryDocumentUploadPage from "./pages/PrimaryDocumentUploadPage";
// We are creating two new pages for the analysis flow
import InteractiveAnalysisPage from "./pages/InteractiveAnalysisPage";
import ResultsDisplayPage from "./pages/ResultsDisplayPage";

export default function App() {
  const navigate = useNavigate();

  // All of your state and handlers are moved inside this component
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState([]);
  const [primaryDocument, setPrimaryDocument] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [snippets, setSnippets] = useState([]);

  // Handler for the first page
  const handleKnowledgeSubmit = (files) => {
    setKnowledgeBaseFiles(files);
    navigate("/upload-primary");
  };

  // Handler for the second page
  const handlePrimaryDocumentSubmit = (file) => {
    setPrimaryDocument(file);
    navigate("/analysis");
  };

  // Handler for the third page (now correctly accepts two arguments)
  const handleAnalysisSubmit = (finalText, searchResults) => {
    setQueryText(finalText);
    // Ensure snippets is always an array to prevent crashes on the results page
    setSnippets(searchResults || []);
    navigate("/results");
  };

  // Resets the entire application flow
  const goToHome = () => {
    setKnowledgeBaseFiles([]);
    setPrimaryDocument(null);
    setQueryText("");
    setSnippets([]); // Also reset snippets
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogoClick={goToHome} />
      <main className="p-4 sm:p-6 md:p-8">
        <Routes>
          <Route
            path="/"
            element={<KnowledgeUploadPage onSubmit={handleKnowledgeSubmit} />}
          />
          <Route
            path="/upload-primary"
            element={
              <PrimaryDocumentUploadPage
                onSubmit={handlePrimaryDocumentSubmit}
              />
            }
          />
          <Route
            path="/analysis"
            element={
              <InteractiveAnalysisPage
                primaryDocument={primaryDocument}
                onSubmit={handleAnalysisSubmit}
              />
            }
          />
          <Route
            path="/results"
            element={
              <ResultsDisplayPage
                primaryDocument={primaryDocument}
                knowledgeBaseFiles={knowledgeBaseFiles}
                queryText={queryText}
                snippets={snippets}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
