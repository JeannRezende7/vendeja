import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import PDV from './pages/PDV';
import Cadastros from './pages/Cadastros';
import Vendas from './pages/Vendas';
import ConfiguracaoEmpresa from './pages/ConfiguracaoEmpresa';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/pdv" element={<PDV />} />
          <Route path="/cadastros" element={<Cadastros />} />
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/configuracao" element={<ConfiguracaoEmpresa />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
