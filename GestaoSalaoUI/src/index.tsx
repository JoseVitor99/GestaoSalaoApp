import React from "react";
import ReactDOM from "react-dom/client";
import { PrimeReactProvider } from "primereact/api";

import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./index.css";

import App from "./App";
import { AutenticacaoProvider } from "./services/autenticacao";
import { configurarLocalePtBr } from "./utilities/locale";
import { aplicarTema, temaInicial } from "./utilities/tema";

configurarLocalePtBr();

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

aplicarTema(temaInicial()).finally(() =>
  root.render(
    <React.StrictMode>
      <PrimeReactProvider value={{ locale: "pt" }}>
        <AutenticacaoProvider>
          <App />
        </AutenticacaoProvider>
      </PrimeReactProvider>
    </React.StrictMode>
  )
);
