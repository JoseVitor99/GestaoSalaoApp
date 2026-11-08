import React from "react";
import ReactDOM from "react-dom/client";
import { PrimeReactProvider } from "primereact/api";

import "primereact/resources/themes/lara-light-pink/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./index.css";

import App from "./App";
import { configurarLocalePtBr } from "./utilities/locale";

configurarLocalePtBr();

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <PrimeReactProvider value={{ locale: "pt" }}>
      <App />
    </PrimeReactProvider>
  </React.StrictMode>
);
