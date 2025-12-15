import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';
import RelatorioFechamentoCaixa from '../components/RelatorioFechamentoCaixa';
import { getApiBaseUrl } from '../utils/apiConfig';

interface Usuario {
  id: number;
  nome: string;
}

interface FormaPagamento {
  id: number;
  descricao: string;
}

interface Caixa {
  id: number;
  usuario: Usuario;
  dataHoraAbertura: string;
  dataHoraFechamento: string;
  valorAbertura: number;
  valorFechamento: number;
  valorVendas: number;
  valorSuprimentos: number;
  valorSangrias: number;
  status: string;
  observacoes: string;
  observacoesFechamento: string;
}

interface Movimentacao {
  id: number;
  tipo: string;
  valor: number;
  descricao: string;
  dataHora: string;
  formaPagamento?: FormaPagamento;
}

export default function CaixaPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [aba, setAba] = useState<'atual' | 'historico'>('atual');
  
  // Estados caixa atual
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  
  // Estados histórico
  const [historico, setHistorico] = useState<Caixa[]>([]);
  
  // Estados modais
  const [modalAbertura, setModalAbertura] = useState(false);
  const [modalFechamento, setModalFechamento] = useState(false);
  const [modalSuprimento, setModalSuprimento] = useState(false);
  const [modalSangria, setModalSangria] = useState(false);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<any>(null);
  
  // Formas de pagamento
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  
  // Formulários
  const [formAbertura, setFormAbertura] = useState({
    valorAbertura: '',
    formaPagamentoId: '',
    observacoes: ''
  });
  
  const [formFechamento, setFormFechamento] = useState({
    observacoes: ''
  });
  
  const [formSuprimento, setFormSuprimento] = useState({
    valor: '',
    formaPagamentoId: '',
    descricao: ''
  });
  
  const [formSangria, setFormSangria] = useState({
    valor: '',
    formaPagamentoId: '',
    descricao: ''
  });

  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
      navigate('/');
      return;
    }
    setUsuario(JSON.parse(usuarioStr));
    carregarFormasPagamento();
    verificarStatusCaixa();
    carregarHistorico();
  }, [navigate]);

  const carregarFormasPagamento = async () => {
    try {
      const res = await axios.get(`${getApiBaseUrl()}/formas-pagamento/categoria/DINHEIRO`);
      setFormasPagamento(res.data);
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
    }
  };

  const verificarStatusCaixa = async () => {
    try {
      const res = await axios.get(`${getApiBaseUrl()}/caixa/status`);
      setCaixaAberto(res.data.caixaAberto);
      if (res.data.caixaAberto) {
        setCaixa(res.data.caixa);
        carregarMovimentacoes();
      }
    } catch (error) {
      console.error('Erro ao verificar status do caixa:', error);
    }
  };

  const carregarMovimentacoes = async () => {
    try {
      const res = await axios.get(`${getApiBaseUrl()}/caixa/movimentacoes`);
      setMovimentacoes(res.data);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    }
  };

  const carregarHistorico = async () => {
    try {
      const res = await axios.get(`${getApiBaseUrl()}/caixa/historico`);
      setHistorico(res.data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const abrirCaixa = async () => {
    if (!formAbertura.valorAbertura || parseFloat(formAbertura.valorAbertura) < 0) {
      showError('Informe um valor válido');
      return;
    }

    if (!formAbertura.formaPagamentoId) {
      showError('Selecione a forma de pagamento');
      return;
    }

    try {
      await axios.post(`${getApiBaseUrl()}/caixa/abrir`, {
        usuarioId: usuario!.id,
        valorAbertura: parseFloat(formAbertura.valorAbertura),
        formaPagamentoId: parseInt(formAbertura.formaPagamentoId),
        observacoes: formAbertura.observacoes
      });

      showSuccess('Caixa aberto com sucesso!');
      setModalAbertura(false);
      setFormAbertura({ valorAbertura: '', formaPagamentoId: '', observacoes: '' });
      verificarStatusCaixa();
    } catch (error: any) {
      showError(error.response?.data || 'Erro ao abrir caixa');
    }
  };

  const fecharCaixa = async () => {
    try {
      await axios.post(`${getApiBaseUrl()}/caixa/fechar`, {
        observacoes: formFechamento.observacoes
      });

      showSuccess('Caixa fechado com sucesso!');
      setModalFechamento(false);
      setFormFechamento({ observacoes: '' });
      verificarStatusCaixa();
      carregarHistorico();
      
      // Abrir relatório automaticamente
      if (caixa) {
        visualizarRelatorio(caixa.id);
      }
    } catch (error: any) {
      showError(error.response?.data || 'Erro ao fechar caixa');
    }
  };

  const registrarSuprimento = async () => {
    if (!formSuprimento.valor || parseFloat(formSuprimento.valor) <= 0) {
      showError('Informe um valor válido');
      return;
    }

    if (!formSuprimento.formaPagamentoId) {
      showError('Selecione a forma de pagamento');
      return;
    }

    if (!formSuprimento.descricao.trim()) {
      showError('Informe a descrição');
      return;
    }

    try {
      await axios.post(`${getApiBaseUrl()}/caixa/suprimento`, {
        valor: parseFloat(formSuprimento.valor),
        formaPagamentoId: parseInt(formSuprimento.formaPagamentoId),
        descricao: formSuprimento.descricao
      });

      showSuccess('Suprimento registrado!');
      setModalSuprimento(false);
      setFormSuprimento({ valor: '', formaPagamentoId: '', descricao: '' });
      verificarStatusCaixa();
      carregarMovimentacoes();
    } catch (error: any) {
      showError(error.response?.data || 'Erro ao registrar suprimento');
    }
  };

  const registrarSangria = async () => {
    if (!formSangria.valor || parseFloat(formSangria.valor) <= 0) {
      showError('Informe um valor válido');
      return;
    }

    if (!formSangria.formaPagamentoId) {
      showError('Selecione a forma de pagamento');
      return;
    }

    if (!formSangria.descricao.trim()) {
      showError('Informe a descrição');
      return;
    }

    try {
      await axios.post(`${getApiBaseUrl()}/caixa/sangria`, {
        valor: parseFloat(formSangria.valor),
        formaPagamentoId: parseInt(formSangria.formaPagamentoId),
        descricao: formSangria.descricao
      });

      showSuccess('Sangria registrada!');
      setModalSangria(false);
      setFormSangria({ valor: '', formaPagamentoId: '', descricao: '' });
      verificarStatusCaixa();
      carregarMovimentacoes();
    } catch (error: any) {
      showError(error.response?.data || 'Erro ao registrar sangria');
    }
  };

  const visualizarRelatorio = async (caixaId: number) => {
    try {
      const res = await axios.get(`${getApiBaseUrl()}/caixa/${caixaId}/relatorio`);
      setRelatorioSelecionado(res.data);
      setMostrarRelatorio(true);
    } catch (error) {
      showError('Erro ao carregar relatório');
    }
  };

  const calcularSaldoEsperado = () => {
    if (!caixa) return 0;
    return caixa.valorAbertura + caixa.valorVendas + caixa.valorSuprimentos - caixa.valorSangrias;
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'ABERTURA':
        return 'bg-blue-500';
      case 'VENDA':
        return 'bg-green-500';
      case 'SUPRIMENTO':
        return 'bg-blue-400';
      case 'SANGRIA':
        return 'bg-orange-500';
      case 'FECHAMENTO':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">💰 Controle de Caixa</h1>
          {caixaAberto && (
            <span className="bg-green-500 px-3 py-1 rounded font-bold">CAIXA ABERTO</span>
          )}
        </div>
        <button
          onClick={() => navigate('/pdv')}
          className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100"
        >
          Voltar ao PDV
        </button>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Abas */}
        <div className="bg-white rounded-t shadow flex">
          <button
            onClick={() => setAba('atual')}
            className={`flex-1 px-6 py-3 font-bold ${
              aba === 'atual' ? 'bg-primary text-white' : 'hover:bg-gray-100'
            }`}
          >
            Caixa Atual
          </button>
          <button
            onClick={() => setAba('historico')}
            className={`flex-1 px-6 py-3 font-bold ${
              aba === 'historico' ? 'bg-primary text-white' : 'hover:bg-gray-100'
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Conteúdo das abas */}
        <div className="bg-white rounded-b shadow p-6">
          {/* ABA CAIXA ATUAL */}
          {aba === 'atual' && (
            <>
              {!caixaAberto ? (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold mb-2">Caixa Fechado</h2>
                    <p className="text-gray-600 mb-6">Abra o caixa para iniciar as operações</p>
                  </div>
                  <button
                    onClick={() => setModalAbertura(true)}
                    className="bg-primary text-white px-8 py-3 rounded hover:bg-green-600 font-bold text-lg"
                  >
                    🔓 Abrir Caixa
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {/* Coluna 1: Status do Caixa */}
                  <div className="col-span-1 space-y-4">
                    <div className="bg-green-50 border-2 border-green-500 rounded p-4">
                      <h3 className="font-bold text-lg mb-4 text-green-700">✓ CAIXA ABERTO</h3>
                      
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600">Operador</p>
                          <p className="font-bold">{caixa?.usuario.nome}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Abertura</p>
                          <p className="font-bold">
                            {caixa && new Date(caixa.dataHoraAbertura).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Valor Abertura:</span>
                          <span className="font-bold">R$ {caixa?.valorAbertura.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Vendas:</span>
                          <span className="font-bold">+ R$ {caixa?.valorVendas.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-blue-600">
                          <span>Suprimentos:</span>
                          <span className="font-bold">+ R$ {caixa?.valorSuprimentos.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-orange-600">
                          <span>Sangrias:</span>
                          <span className="font-bold">- R$ {caixa?.valorSangrias.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t-2 pt-2 mt-2">
                          <span>Saldo Esperado:</span>
                          <span className="text-primary">R$ {calcularSaldoEsperado().toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => setModalSuprimento(true)}
                          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-bold"
                        >
                          💰 Suprimento
                        </button>
                        <button
                          onClick={() => setModalSangria(true)}
                          className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 font-bold"
                        >
                          💸 Sangria
                        </button>
                        <button
                          onClick={() => setModalFechamento(true)}
                          className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-bold"
                        >
                          🔒 Fechar Caixa
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2 e 3: Movimentações */}
                  <div className="col-span-2">
                    <h3 className="font-bold text-lg mb-4">Movimentações do Dia</h3>
                    <div className="max-h-[600px] overflow-y-auto border rounded">
                      <table className="w-full">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="text-left p-3 text-sm">Hora</th>
                            <th className="text-left p-3 text-sm">Tipo</th>
                            <th className="text-left p-3 text-sm">Descrição</th>
                            <th className="text-left p-3 text-sm">Forma</th>
                            <th className="text-right p-3 text-sm">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimentacoes.map((mov) => (
                            <tr key={mov.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 text-sm">
                                {new Date(mov.dataHora).toLocaleTimeString('pt-BR')}
                              </td>
                              <td className="p-3">
                                <span className={`${getTipoBadge(mov.tipo)} text-white px-2 py-1 rounded text-xs font-bold`}>
                                  {mov.tipo}
                                </span>
                              </td>
                              <td className="p-3 text-sm">{mov.descricao}</td>
                              <td className="p-3 text-sm">{mov.formaPagamento?.descricao || '-'}</td>
                              <td className={`p-3 text-sm text-right font-bold ${
                                mov.tipo === 'SANGRIA' ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {mov.tipo === 'SANGRIA' ? '-' : '+'} R$ {mov.valor.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ABA HISTÓRICO */}
          {aba === 'historico' && (
            <div>
              <h3 className="font-bold text-lg mb-4">Histórico de Caixas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 text-sm">Operador</th>
                      <th className="text-left p-3 text-sm">Abertura</th>
                      <th className="text-left p-3 text-sm">Fechamento</th>
                      <th className="text-right p-3 text-sm">Vl. Abertura</th>
                      <th className="text-right p-3 text-sm">Vendas</th>
                      <th className="text-right p-3 text-sm">Suprimentos</th>
                      <th className="text-right p-3 text-sm">Sangrias</th>
                      <th className="text-right p-3 text-sm">Saldo Final</th>
                      <th className="text-center p-3 text-sm">Status</th>
                      <th className="text-center p-3 text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((cx) => {
                      const saldoFinal = cx.valorAbertura + cx.valorVendas + cx.valorSuprimentos - cx.valorSangrias;
                      return (
                        <tr key={cx.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-sm">{cx.usuario.nome}</td>
                          <td className="p-3 text-sm">
                            {new Date(cx.dataHoraAbertura).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-3 text-sm">
                            {cx.dataHoraFechamento ? new Date(cx.dataHoraFechamento).toLocaleString('pt-BR') : '-'}
                          </td>
                          <td className="p-3 text-sm text-right">R$ {cx.valorAbertura.toFixed(2)}</td>
                          <td className="p-3 text-sm text-right text-green-600 font-bold">
                            R$ {cx.valorVendas.toFixed(2)}
                          </td>
                          <td className="p-3 text-sm text-right text-blue-600 font-bold">
                            R$ {cx.valorSuprimentos.toFixed(2)}
                          </td>
                          <td className="p-3 text-sm text-right text-red-600 font-bold">
                            R$ {cx.valorSangrias.toFixed(2)}
                          </td>
                          <td className="p-3 text-sm text-right font-bold text-primary">
                            R$ {saldoFinal.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              cx.status === 'ABERTO' ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                            }`}>
                              {cx.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {cx.status === 'FECHADO' && (
                              <button
                                onClick={() => visualizarRelatorio(cx.id)}
                                className="bg-primary text-white px-3 py-1 rounded hover:bg-green-600 text-xs"
                              >
                                📄 Relatório
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ABERTURA */}
      {modalAbertura && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">🔓 Abrir Caixa</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Valor de Abertura*</label>
                <input
                  type="number"
                  value={formAbertura.valorAbertura}
                  onChange={(e) => setFormAbertura({ ...formAbertura, valorAbertura: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Forma de Pagamento*</label>
                <select
                  value={formAbertura.formaPagamentoId}
                  onChange={(e) => setFormAbertura({ ...formAbertura, formaPagamentoId: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Selecione...</option>
                  {formasPagamento.map(fp => (
                    <option key={fp.id} value={fp.id}>{fp.descricao}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Observações</label>
                <textarea
                  value={formAbertura.observacoes}
                  onChange={(e) => setFormAbertura({ ...formAbertura, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Observações sobre a abertura (opcional)"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={abrirCaixa}
                className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-green-600 font-bold"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setModalAbertura(false);
                  setFormAbertura({ valorAbertura: '', formaPagamentoId: '', observacoes: '' });
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FECHAMENTO */}
      {modalFechamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">🔒 Fechar Caixa</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Atenção:</strong> Ao fechar o caixa, será gerado um relatório completo com todos os totalizadores.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Valor Abertura:</span>
                  <span className="font-bold">R$ {caixa?.valorAbertura.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>+ Vendas:</span>
                  <span className="font-bold">R$ {caixa?.valorVendas.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>+ Suprimentos:</span>
                  <span className="font-bold">R$ {caixa?.valorSuprimentos.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>- Sangrias:</span>
                  <span className="font-bold">R$ {caixa?.valorSangrias.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t-2 pt-2 mt-2 text-lg">
                  <span className="font-bold">Saldo Final:</span>
                  <span className="font-bold text-primary">R$ {calcularSaldoEsperado().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Observações do Fechamento</label>
                <textarea
                  value={formFechamento.observacoes}
                  onChange={(e) => setFormFechamento({ ...formFechamento, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Observações sobre o fechamento (opcional)"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={fecharCaixa}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 font-bold"
              >
                Confirmar Fechamento
              </button>
              <button
                onClick={() => {
                  setModalFechamento(false);
                  setFormFechamento({ observacoes: '' });
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUPRIMENTO */}
      {modalSuprimento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">💰 Registrar Suprimento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Valor*</label>
                <input
                  type="number"
                  value={formSuprimento.valor}
                  onChange={(e) => setFormSuprimento({ ...formSuprimento, valor: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Forma de Pagamento*</label>
                <select
                  value={formSuprimento.formaPagamentoId}
                  onChange={(e) => setFormSuprimento({ ...formSuprimento, formaPagamentoId: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Selecione...</option>
                  {formasPagamento.map(fp => (
                    <option key={fp.id} value={fp.id}>{fp.descricao}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Descrição*</label>
                <input
                  type="text"
                  value={formSuprimento.descricao}
                  onChange={(e) => setFormSuprimento({ ...formSuprimento, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Ex: Troco do banco"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={registrarSuprimento}
                className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-green-600 font-bold"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setModalSuprimento(false);
                  setFormSuprimento({ valor: '', formaPagamentoId: '', descricao: '' });
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SANGRIA */}
      {modalSangria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">💸 Registrar Sangria</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Valor*</label>
                <input
                  type="number"
                  value={formSangria.valor}
                  onChange={(e) => setFormSangria({ ...formSangria, valor: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Forma de Pagamento*</label>
                <select
                  value={formSangria.formaPagamentoId}
                  onChange={(e) => setFormSangria({ ...formSangria, formaPagamentoId: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Selecione...</option>
                  {formasPagamento.map(fp => (
                    <option key={fp.id} value={fp.id}>{fp.descricao}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Descrição*</label>
                <input
                  type="text"
                  value={formSangria.descricao}
                  onChange={(e) => setFormSangria({ ...formSangria, descricao: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Ex: Depósito bancário"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={registrarSangria}
                className="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-green-600 font-bold"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setModalSangria(false);
                  setFormSangria({ valor: '', formaPagamentoId: '', descricao: '' });
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RELATÓRIO */}
      {mostrarRelatorio && relatorioSelecionado && (
        <RelatorioFechamentoCaixa
          caixa={relatorioSelecionado.caixa}
          relatorio={relatorioSelecionado}
          onClose={() => setMostrarRelatorio(false)}
        />
      )}
    </div>
  );
}
