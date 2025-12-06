
import { createContext, useContext, useState } from 'react';

interface CaixaContextType {
  caixaAberto: boolean;
  abrirCaixa: () => void;
  fecharCaixa: () => void;
}

const CaixaContext = createContext<CaixaContextType>({
  caixaAberto: false,
  abrirCaixa: () => {},
  fecharCaixa: () => {},
});

export const CaixaProvider = ({ children }: any) => {
  const [caixaAberto, setCaixaAberto] = useState(false);

  const abrirCaixa = () => setCaixaAberto(true);
  const fecharCaixa = () => setCaixaAberto(false);

  return (
    <CaixaContext.Provider value={{ caixaAberto, abrirCaixa, fecharCaixa }}>
      {children}
    </CaixaContext.Provider>
  );
};

export const useCaixa = () => useContext(CaixaContext);
