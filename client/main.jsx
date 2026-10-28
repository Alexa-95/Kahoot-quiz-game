import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '../public/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Nie znaleziono elementu strony.');

createRoot(root).render(<App />);
