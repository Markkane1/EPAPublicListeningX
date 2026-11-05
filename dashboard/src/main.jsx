import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { ArgonControllerProvider } from './context';

import './assets/css/nucleo-icons.css';
import './assets/css/nucleo-svg.css';
import './reduced-motion.css';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ArgonControllerProvider>
        <App />
      </ArgonControllerProvider>
    </BrowserRouter>
  </React.StrictMode>
);