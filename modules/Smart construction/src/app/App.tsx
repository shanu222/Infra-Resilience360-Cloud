import { RouterProvider } from 'react-router';
import { PortalLanguageProvider } from '../i18n/portalLanguage';
import { router } from './routes';

export default function App() {
  return (
    <PortalLanguageProvider>
      <RouterProvider router={router} />
    </PortalLanguageProvider>
  );
}
