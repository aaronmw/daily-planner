import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './app/App';
import { RouteErrorBoundary } from './app/RouteErrorBoundary';
import './styles/index.css';

const router = createBrowserRouter([
    { element: <App />, errorElement: <RouteErrorBoundary />, path: '/' },
    {
        element: <App />,
        errorElement: <RouteErrorBoundary />,
        path: '/share/:listId',
    },
]);

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Daily Planner could not find its root element.');
}

createRoot(rootElement).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);
