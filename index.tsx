import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initFirebase } from './services/firebase';

// Initialize Firebase once at the root level
initFirebase();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);