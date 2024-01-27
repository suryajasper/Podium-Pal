import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Interview from "./pages/interview";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Interview />} />
        <Route path="/interview" element={<Interview />} />
      </Routes>
    </Router>
  );
}

export default App;
