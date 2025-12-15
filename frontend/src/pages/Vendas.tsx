import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendaService } from '../services/api';
import { Venda } from '../types';
import axios from 'axios';
import CupomNaoFiscal from '../components/CupomNaoFiscal';
import { getApiBaseUrl } from '../utils/apiConfig';

export default function Vendas() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [filtro, setFiltro] = useState('');
  const [empresa, setEmpresa] = useState<any>(null);
  const [mostrarCupom, setMostrarCupom] = useState(false);

  useEffect(() => {
    carregarVendas();
    carregarEmpresa();
  }, []);

  const carregarVendas = async () => {
    try {
      const res = await vendaService.listar();
      setVendas(res.data.sort((a, b) => (b.id || 0) - (a.id || 0)));
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  };

  const carregarEmpresa = async () => {
    try {
      const res = await axios.get(`${getApiBaseUrl()}/configuracao`);
      setEmpresa(res.data);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const vendasFiltradas = vendas.filter(v => {
    const termo = filtro.toLowerCase();
    return (
      v.numeroDocumento?.toString().includes(termo) ||
      v.cliente?.nome.toLowerCase().includes(termo) ||
      v.usuario.nome.toLowerCase().includes(termo)
    );
  });

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    return data.toLocaleString('pt-BR');
  };

  const reimprimir = () => {
    if (vendaSelecionada) {
      setMostrarCupom(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Consulta de Vendas</h1>
        <button
          onClick={() => navigate('/pdv')}
          className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100"
        >
          Voltar ao PDV
        </button>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Lista de Vendas */}
        <div className="w-1/2 bg-white rounded shadow flex flex-col">
          <div className="p-4 border-b">
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por documento, cliente ou operador..."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Doc</th>
                  <th className="p-2 text-left">Data/Hora</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {vendasFiltradas.map(v => (
                  <tr
                    key={v.id}
                    onClick={() => setVendaSelecionada(v)}
                    className={`border-t cursor-pointer hover:bg-blue-50 ${
                      vendaSelecionada?.id === v.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <td className="p-2">{v.numeroDocumento}</td>
                    <td className="p-2 text-sm">{v.dataHora ? formatarData(v.dataHora) : ''}</td>
                    <td className="p-2">{v.cliente?.nome || 'Consumidor'}</td>
                    <td className="p-2 text-right font-bold text-primary">
                      R$ {v.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-bold">Total de Vendas:</span>
              <span className="text-lg font-bold text-primary">
                {vendasFiltradas.length}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold">Valor Total:</span>
              <span className="text-lg font-bold text-primary">
                R$ {vendasFiltradas.reduce((acc, v) => acc + v.total, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Detalhes da Venda */}
        <div className="flex-1 bg-white rounded shadow overflow-y-auto">
          {vendaSelecionada ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-primary">
                  Venda #{vendaSelecionada.numeroDocumento}
                </h2>
                <button
                  onClick={reimprimir}
                  className="bg-primary text-white px-6 py-2 rounded hover:bg-green-600 font-bold flex items-center gap-2"
                >
                  🖨️ Reimprimir Cupom
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-bold text-gray-600">Data/Hora:</label>
                  <p>{vendaSelecionada.dataHora ? formatarData(vendaSelecionada.dataHora) : ''}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600">Operador:</label>
                  <p>{vendaSelecionada.usuario.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600">Cliente:</label>
                  <p>{vendaSelecionada.cliente?.nome || 'Consumidor'}</p>
                </div>
              </div>

              {/* Formas de Pagamento */}
              {vendaSelecionada.pagamentos && vendaSelecionada.pagamentos.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded">
                  <h3 className="font-bold text-sm text-gray-600 mb-2">Formas de Pagamento:</h3>
                  <table className="w-full">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2 text-left">Forma</th>
                        <th className="p-2 text-right">Valor</th>
                        <th className="p-2 text-right">Troco</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendaSelecionada.pagamentos.map((pag, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{pag.formaPagamento?.descricao || '-'}</td>
                          <td className="p-2 text-right font-bold">R$ {pag.valor?.toFixed(2) || '0.00'}</td>
                          <td className="p-2 text-right text-blue-600">
                            {pag.troco && pag.troco > 0 ? `R$ ${pag.troco.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between mt-2 pt-2 border-t font-bold">
                    <span>Total Pago:</span>
                    <span>R$ {(vendaSelecionada.valorPago || vendaSelecionada.total).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-bold text-lg mb-3">Itens da Venda</h3>
                <table className="w-full">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-2 text-left">Produto</th>
                      <th className="p-2 text-center">Qtd</th>
                      <th className="p-2 text-right">Preço Unit.</th>
                      <th className="p-2 text-right">Desc.</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendaSelecionada.itens?.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.produto.descricao}</td>
                        <td className="p-2 text-center">{item.quantidade.toFixed(3)}</td>
                        <td className="p-2 text-right">R$ {item.precoUnitario.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          {item.descontoPercentual ? `${item.descontoPercentual}%` : ''}
                          {item.descontoValor ? `R$ ${item.descontoValor.toFixed(2)}` : ''}
                        </td>
                        <td className="p-2 text-right font-bold">R$ {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t mt-6 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">R$ {vendaSelecionada.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {vendaSelecionada.descontoPercentual && vendaSelecionada.descontoPercentual > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto ({vendaSelecionada.descontoPercentual}%):</span>
                    <span>- R$ {((vendaSelecionada.subtotal * vendaSelecionada.descontoPercentual) / 100).toFixed(2)}</span>
                  </div>
                )}
                {vendaSelecionada.descontoValor && vendaSelecionada.descontoValor > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto:</span>
                    <span>- R$ {vendaSelecionada.descontoValor.toFixed(2)}</span>
                  </div>
                )}
                {vendaSelecionada.acrescimoPercentual && vendaSelecionada.acrescimoPercentual > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Acréscimo ({vendaSelecionada.acrescimoPercentual}%):</span>
                    <span>+ R$ {((vendaSelecionada.subtotal * vendaSelecionada.acrescimoPercentual) / 100).toFixed(2)}</span>
                  </div>
                )}
                {vendaSelecionada.acrescimoValor && vendaSelecionada.acrescimoValor > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Acréscimo:</span>
                    <span>+ R$ {vendaSelecionada.acrescimoValor.toFixed(2)}</span>
                  </div>
                )}
                {vendaSelecionada.frete && vendaSelecionada.frete > 0 && (
                  <div className="flex justify-between">
                    <span>Frete:</span>
                    <span>R$ {vendaSelecionada.frete.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-primary border-t pt-2">
                  <span>TOTAL:</span>
                  <span>R$ {vendaSelecionada.total.toFixed(2)}</span>
                </div>
                {vendaSelecionada.troco && vendaSelecionada.troco > 0 && (
                  <div className="flex justify-between text-lg font-bold text-blue-600">
                    <span>Troco:</span>
                    <span>R$ {vendaSelecionada.troco.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {vendaSelecionada.observacoes && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <label className="text-sm font-bold text-gray-600">Observações:</label>
                  <p className="mt-1">{vendaSelecionada.observacoes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Selecione uma venda para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {mostrarCupom && vendaSelecionada && empresa && (
        <CupomNaoFiscal
          venda={vendaSelecionada}
          empresa={empresa}
          onClose={() => setMostrarCupom(false)}
        />
      )}
    </div>
  );
}
