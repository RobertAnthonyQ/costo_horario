import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Configurar interceptor global para fetch
import setupFetchInterceptor from "./utils/fetchInterceptor";
setupFetchInterceptor();

createRoot(document.getElementById("root")!).render(<App />);
