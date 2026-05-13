
import { useState } from 'react';
import './styles/globals.css';
import HomePage from './pages/HomePage';
import CanchaPage from './pages/CanchaPage';

type Pagina = 'home' | 'cancha';

export default function App() {
  
  const [pagina, setPagina] = useState<Pagina>('home');

  
  (window as Record<string, unknown>).__navegar = setPagina;

  return (
    <>
      {pagina === 'home'   && <HomePage />}
      {pagina === 'cancha' && <CanchaPage />}
    </>
  );
}
