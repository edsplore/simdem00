import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { LicenseInfo } from '@mui/x-date-pickers-pro';

// Set MUI X license key
LicenseInfo.setLicenseKey('e61da1ec9cd1771a3e6865c8becc95dfTz0xMDcwOTksRT0xNzY5OTkwMzk5MDAwLFM9cHJlbWl1bSxMTT1wZXJwZXR1YWwsUFY9aW5pdGlhbCxLVj0y');

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
    <App />
);