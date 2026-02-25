import React from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from "buffer/";
import process from "process";
import App from "./App.jsx";
import "./index.css";
import "./i18n"; // Import i18n configuration

window.Buffer = Buffer;
window.process = process;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
