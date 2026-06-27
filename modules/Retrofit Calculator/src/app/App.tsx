import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";
import { PortalLanguageProvider } from "../i18n/portalLanguage";

export default function App() {
  return (
    <AppProvider>
      <PortalLanguageProvider>
        <RouterProvider router={router} />
      </PortalLanguageProvider>
    </AppProvider>
  );
}