/**
 * Hash routing keeps all client navigations under the deployed path (e.g. /app/disaster-dashboard/index.html#/disaster/flood).
 * BrowserRouter without basename breaks when the bundle is served from a subfolder or inside an iframe — links like /disaster/x
 * escape to the site root and unload the portal.
 */
import { createHashRouter } from 'react-router';
import Dashboard from './pages/Dashboard';
import DisasterDetail from './pages/DisasterDetail';

export const router = createHashRouter([
  {
    path: '/',
    Component: Dashboard,
  },
  {
    path: '/disaster/:id',
    Component: DisasterDetail,
  },
  {
    path: '*',
    Component: Dashboard,
  },
]);
