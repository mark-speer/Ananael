import { RouteObject } from 'react-router-dom';
import App from './App';
import SharePage from './components/SharePage';

/**
 * Route configuration for React Router v6.4+
 * 
 * Routes:
 * - "/" - Home: Sidebar + active module (state-based navigation)
 * - "/s/:type/:id" - Share page: Load specific resource by type and ID for sharing
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/s/:type/:id',
    element: <SharePage />,
  },
];
