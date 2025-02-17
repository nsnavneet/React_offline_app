import React from 'react';
import ReactDOM from 'react-dom/client';  // ✅ Use `createRoot()` from React 18
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));  // ✅ Correct way in React 18
root.render(<App />);
