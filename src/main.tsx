import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.tsx";

import { i18n } from "./modules/i18n";

import "./index.css";
import { isDevelopment, isProduction } from "./utils";
import { useUIStore } from "./store/uiStore";

// Subscribe to UI store updates to dynamically sync browser tab title and favicon
const syncBrowserTab = (name: string, logo: string | null) => {
  document.title = name || "Warehouse Portal";
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    link.href = logo || "/vite.svg";
  }
};

// Initial sync on app boot
const initialUIState = useUIStore.getState();
syncBrowserTab(initialUIState.systemName, initialUIState.systemLogo);

// Live listener
useUIStore.subscribe((state) => {
  syncBrowserTab(state.systemName, state.systemLogo);
});

// to use Cypress.env in e2e environment
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    Cypress?: { env: (key: string) => string };
  }
}

async function setupApp() {
  await i18n.configure();

  const enableMocker = import.meta.env.VITE_ENABLE_MOCK === "true";
  if (enableMocker && (isDevelopment || isProduction)) {
    const mocker = await import("./mocker/index.ts");

    await mocker.runServer();
  }

  return Promise.resolve();
}

const root = createRoot(document.getElementById("root")!);

setupApp()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("Something went wrong in setting up app", error);
  });
