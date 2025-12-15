import { useRef, useEffect, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

interface RelatorioProps {
  caixa: any;
  relatorio: any;
  onClose: () => void;
}

export default function RelatorioFechamentoCaixa({ caixa, relatorio, onClose }: RelatorioProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [tamanhoImpressao, setTamanhoImpressao] = useState<'80mm' | '58mm' | 'A4'>('80mm');

  useEffect(() => {
    // Carregar configuração de tamanho de impressão
    const carregarConfig = async () => {
      try {
        const res = await axios.get(`${getApiBaseUrl()}/configuracao`);
        if (res.data && res.data.tamanhoImpressao) {
          setTamanhoImpressao(res.data.tamanhoImpressao);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    };
    carregarConfig();
  }, []);

  // Listener para tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    onAfterPrint: () => {
      // Fechar automaticamente após imprimir
      onClose();
    },
  });

  const calcularSaldoFinal = () => {
    return caixa.valorAbertura + caixa.valorVendas + caixa.valorSuprimentos - caixa.valorSangrias;
  };

  // Classe CSS baseada no tamanho configurado
  const getPrintClass = () => {
    switch (tamanhoImpressao) {
      case '58mm':
        return 'print-58mm';
      case 'A4':
        return 'print-a4';
      default:
        return 'print-80mm';
    }
  };

  // Ajustar conteúdo para 58mm (mais compacto)
  const isCompact = tamanhoImpressao === '58mm';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center bg-primary text-white no-print">
          <h2 className="text-xl font-bold">Relatório de Fechamento de Caixa</h2>
          <button onClick={onClose} className="text-2xl hover:text-gray-300">&times;</button>
        </div>

        <div className="p-6">
          {/* Botões de ação */}
          <div className="flex gap-2 mb-4 no-print">
            <button
              onClick={handlePrint}
              className="bg-primary text-white px-6 py-2 rounded hover:bg-green-600 font-bold"
            >
              🖨️ Imprimir ({tamanhoImpressao})
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Fechar (Esc)
            </button>
          </div>

          {/* Conteúdo para impressão */}
          <div ref={componentRef} className={getPrintClass()}>
            <div className="text-center mb-4 border-b pb-3">
              <h1 className={`font-bold ${isCompact ? 'text-lg' : 'text-2xl'}`}>
                {isCompact ? 'FECHAMENTO CAIXA' : 'RELATÓRIO DE FECHAMENTO DE CAIXA'}
              </h1>
              <p className={`text-gray-600 ${isCompact ? 'text-xs' : 'text-sm'} mt-1`}>
                {new Date(caixa.dataHoraFechamento).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Informações do Caixa */}
            <div className={`mb-4 ${isCompact ? 'p-2' : 'bg-gray-50 p-4'} rounded no-break`}>
              <h3 className={`font-bold ${isCompact ? 'text-sm' : 'text-lg'} mb-2`}>
                {isCompact ? 'Info Caixa' : 'Informações do Caixa'}
              </h3>
              <div className={`grid ${isCompact ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-3'}`}>
                <div>
                  <p className="text-xs text-gray-600">Operador</p>
                  <p className={`font-bold ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    {caixa.usuario.nome}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Caixa Nº</p>
                  <p className={`font-bold ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    #{caixa.id}
                  </p>
                </div>
                {!isCompact && (
                  <>
                    <div>
                      <p className="text-xs text-gray-600">Abertura</p>
                      <p className="font-bold text-sm">
                        {new Date(caixa.dataHoraAbertura).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Fechamento</p>
                      <p className="font-bold text-sm">
                        {new Date(caixa.dataHoraFechamento).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Resumo Geral */}
            <div className="mb-4 no-break">
              <h3 className={`font-bold ${isCompact ? 'text-sm' : 'text-lg'} mb-2 border-b pb-1`}>
                Resumo Geral
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className={`py-1 ${isCompact ? 'text-xs' : ''}`}>Abertura</td>
                    <td className={`text-right font-bold ${isCompact ? 'text-xs' : ''}`}>
                      R$ {caixa.valorAbertura.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className={`py-1 ${isCompact ? 'text-xs' : ''}`}>+ Vendas</td>
                    <td className={`text-right font-bold ${isCompact ? 'text-xs' : ''}`}>
                      R$ {caixa.valorVendas.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className={`py-1 ${isCompact ? 'text-xs' : ''}`}>+ Suprimentos</td>
                    <td className={`text-right font-bold ${isCompact ? 'text-xs' : ''}`}>
                      R$ {caixa.valorSuprimentos.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className={`py-1 ${isCompact ? 'text-xs' : ''}`}>- Sangrias</td>
                    <td className={`text-right font-bold ${isCompact ? 'text-xs' : ''}`}>
                      R$ {caixa.valorSangrias.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-black">
                    <td className={`py-2 font-bold ${isCompact ? 'text-sm' : 'text-lg'}`}>
                      SALDO FINAL
                    </td>
                    <td className={`text-right font-bold ${isCompact ? 'text-sm' : 'text-lg'}`}>
                      R$ {calcularSaldoFinal().toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Vendas por Forma de Pagamento */}
            {relatorio.vendasPorForma && Object.keys(relatorio.vendasPorForma).length > 0 && (
              <div className="mb-4 no-break">
                <h3 className={`font-bold ${isCompact ? 'text-sm' : 'text-lg'} mb-2 border-b pb-1`}>
                  {isCompact ? 'Vendas' : 'Vendas por Forma'}
                </h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className={`text-left py-1 px-2 ${isCompact ? 'text-xs' : ''}`}>Forma</th>
                      <th className={`text-right py-1 px-2 ${isCompact ? 'text-xs' : ''}`}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(relatorio.vendasPorForma).map(([forma, valor]: [string, any]) => (
                      <tr key={forma} className="border-b">
                        <td className={`py-1 px-2 ${isCompact ? 'text-xs' : ''}`}>{forma}</td>
                        <td className={`text-right py-1 px-2 font-bold ${isCompact ? 'text-xs' : ''}`}>
                          R$ {valor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Suprimentos por Forma (apenas se houver e não for 58mm) */}
            {!isCompact && relatorio.suprimentosPorForma && Object.keys(relatorio.suprimentosPorForma).length > 0 && (
              <div className="mb-4 no-break">
                <h3 className="font-bold text-lg mb-2 border-b pb-1">Suprimentos</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-1 px-2">Forma</th>
                      <th className="text-right py-1 px-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(relatorio.suprimentosPorForma).map(([forma, valor]: [string, any]) => (
                      <tr key={forma} className="border-b">
                        <td className="py-1 px-2">{forma}</td>
                        <td className="text-right py-1 px-2 font-bold">R$ {valor.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sangrias por Forma (apenas se houver e não for 58mm) */}
            {!isCompact && relatorio.sangriasPorForma && Object.keys(relatorio.sangriasPorForma).length > 0 && (
              <div className="mb-4 no-break">
                <h3 className="font-bold text-lg mb-2 border-b pb-1">Sangrias</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-1 px-2">Forma</th>
                      <th className="text-right py-1 px-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(relatorio.sangriasPorForma).map(([forma, valor]: [string, any]) => (
                      <tr key={forma} className="border-b">
                        <td className="py-1 px-2">{forma}</td>
                        <td className="text-right py-1 px-2 font-bold">R$ {valor.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Observações (apenas se houver e não for 58mm) */}
            {!isCompact && caixa.observacoesFechamento && (
              <div className="mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
                <h3 className="font-bold text-sm mb-1">Observações</h3>
                <p className="text-xs text-gray-700">{caixa.observacoesFechamento}</p>
              </div>
            )}

            {/* Rodapé */}
            <div className="mt-4 pt-2 border-t text-center text-xs text-gray-600">
              <p>Caixa Fácil - {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
