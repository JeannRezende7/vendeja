import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { produtoService, clienteService, vendaService, cadastrosService } from '../services/api';
import { Produto, Cliente, VendaItem, FormaPagamento, Usuario } from '../types';
import ModalPagamento from '../components/ModalPagamento';
import { useNotification } from '../contexts/NotificationContext';
import axios from 'axios';
import CupomNaoFiscal from '../components/CupomNaoFiscal';

interface PagamentoItem {
  formaPagamento: FormaPagamento;
  valorDigitado: number;
  valorPago: number;
  troco: number;
}

export default function PDV() {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useNotification();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [codigoProduto, setCodigoProduto] = useState('');
  const [produtoAtual, setProdutoAtual] = useState<Produto | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);

  const [itens, setItens] = useState<VendaItem[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState<number>(-1);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);

  const [empresa, setEmpresa] = useState<any>(null);
  const [mostrarCupom, setMostrarCupom] = useState(false);
  const [vendaFinalizada, setVendaFinalizada] = useState<any>(null);

  // CONTROLE DE CAIXA
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [controlarCaixa, setControlarCaixa] = useState(false);

  // DESCONTOS / FRETE
  const [descontoGlobalPerc, setDescontoGlobalPerc] = useState('0');
  const [descontoGlobalValor, setDescontoGlobalValor] = useState('0');
  const [acrescimoGlobalPerc, setAcrescimoGlobalPerc] = useState('0');
  const [acrescimoGlobalValor, setAcrescimoGlobalValor] = useState('0');
  const [frete, setFrete] = useState('0');

  const inputProdutoRef = useRef<HTMLInputElement>(null);

  // CARREGA USUÁRIO E FORMAS DE PAGAMENTO
  useEffect(() => {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
      navigate('/');
      return;
    }

    setUsuario(JSON.parse(usuarioStr));

    cadastrosService.listarFormasPagamento().then((res) => {
      setFormasPagamento(res.data);
    });
  }, [navigate]);

  // CARREGA CONFIGURAÇÃO / EMPRESA / CLIENTE PADRÃO
  useEffect(() => {
    axios
      .get('http://localhost:8080/api/configuracao')
      .then((res) => {
        setEmpresa(res.data);
        setControlarCaixa(res.data.controlarCaixa || false);

        if (res.data.clientePadrao) {
          setCliente(res.data.clientePadrao);
        }
      })
      .catch((err) => console.error('Erro ao carregar configuração:', err));
  }, []);

  // VERIFICA STATUS DO CAIXA
  useEffect(() => {
    if (controlarCaixa) {
      verificarStatusCaixa();
    }
  }, [controlarCaixa]);

  const verificarStatusCaixa = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/caixa/status');
      setCaixaAberto(res.data.caixaAberto);
    } catch (error) {
      console.error('Erro ao verificar caixa:', error);
    }
  };

  // DELETE REMOVE ITEM
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && itemSelecionado >= 0) {
        removerItem(itemSelecionado);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemSelecionado, itens]);

  // BUSCA PRODUTO
  const buscarProduto = async (codigo: string) => {
    if (!codigo.trim()) return;

    try {
      const res = await axios.get(`http://localhost:8080/api/produtos/buscar-parcial/${codigo}`);

      if (Array.isArray(res.data) && res.data.length > 0) {
        const produto = res.data[0];
        setProdutoAtual(produto);
        adicionarItem(produto);
      } else {
        showError('Produto não encontrado');
      }

      setCodigoProduto('');
      inputProdutoRef.current?.focus();
    } catch (error) {
      showError('Produto não encontrado');
      setCodigoProduto('');
      setProdutoAtual(null);
    }
  };

  // ADICIONA ITEM
  const adicionarItem = (produto: Produto) => {
    const novoItem: VendaItem = {
      produto,
      quantidade: 1,
      precoUnitario: produto.precoVenda,
      descontoPercentual: 0,
      descontoValor: 0,
      acrescimoPercentual: 0,
      acrescimoValor: 0,
      total: produto.precoVenda,
    };

    setItens((prev) => [...prev, novoItem]);
  };

  // REMOVE ITEM
  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
    setItemSelecionado(-1);
  };

  // CÁLCULO DO ITEM
  const calcularTotalItem = (item: VendaItem): number => {
    let total = item.precoUnitario * item.quantidade;

    if (item.descontoPercentual && item.descontoPercentual > 0) {
      total -= (total * item.descontoPercentual) / 100;
    }
    if (item.descontoValor && item.descontoValor > 0) {
      total -= item.descontoValor;
    }
    if (item.acrescimoPercentual && item.acrescimoPercentual > 0) {
      total += (total * item.acrescimoPercentual) / 100;
    }
    if (item.acrescimoValor && item.acrescimoValor > 0) {
      total += item.acrescimoValor;
    }

    return Math.max(0, total);
  };

  const atualizarQuantidade = (index: number, quantidade: string) => {
    const qtd = Math.max(0, parseFloat(quantidade) || 0);
    const novosItens = [...itens];
    novosItens[index].quantidade = qtd;
    novosItens[index].total = calcularTotalItem(novosItens[index]);
    setItens(novosItens);
  };

  const atualizarDesconto = (index: number, tipo: 'perc' | 'valor', valor: string) => {
    const val = Math.max(0, parseFloat(valor) || 0);
    const novosItens = [...itens];
    const item = novosItens[index];

    if (tipo === 'perc') {
      item.descontoPercentual = val;
      const subtotal = item.precoUnitario * item.quantidade;
      item.descontoValor = (subtotal * val) / 100;
    } else {
      item.descontoValor = val;
      const subtotal = item.precoUnitario * item.quantidade;
      item.descontoPercentual = subtotal > 0 ? (val / subtotal) * 100 : 0;
    }

    item.total = calcularTotalItem(item);
    setItens(novosItens);
  };

  const atualizarAcrescimo = (index: number, tipo: 'perc' | 'valor', valor: string) => {
    const val = Math.max(0, parseFloat(valor) || 0);
    const novosItens = [...itens];
    const item = novosItens[index];

    if (tipo === 'perc') {
      item.acrescimoPercentual = val;
      const subtotal = item.precoUnitario * item.quantidade;
      item.acrescimoValor = (subtotal * val) / 100;
    } else {
      item.acrescimoValor = val;
      const subtotal = item.precoUnitario * item.quantidade;
      item.acrescimoPercentual = subtotal > 0 ? (val / subtotal) * 100 : 0;
    }

    item.total = calcularTotalItem(item);
    setItens(novosItens);
  };

  const calcularSubtotal = () => itens.reduce((acc, item) => acc + item.total, 0);

  const calcularTotal = () => {
    let total = calcularSubtotal();

    const descPerc = Math.max(0, parseFloat(descontoGlobalPerc) || 0);
    if (descPerc > 0) total -= (total * descPerc) / 100;

    const descValor = Math.max(0, parseFloat(descontoGlobalValor) || 0);
    total -= descValor;

    const acrPerc = Math.max(0, parseFloat(acrescimoGlobalPerc) || 0);
    if (acrPerc > 0) total += (total * acrPerc) / 100;

    const acrValor = Math.max(0, parseFloat(acrescimoGlobalValor) || 0);
    total += acrValor;

    const freteVal = Math.max(0, parseFloat(frete) || 0);
    total += freteVal;

    return Math.max(0, total);
  };

  const abrirModalPagamento = () => {
    if (itens.length === 0) {
      showWarning('Adicione itens à venda');
      return;
    }

    if (controlarCaixa && !caixaAberto) {
      showError('Não é possível finalizar venda sem caixa aberto!');
      return;
    }

    setMostrarModalPagamento(true);
  };

  const finalizarVenda = async (pagamentos: PagamentoItem[], valorPago: number, troco: number) => {
    const vendaDTO = {
      usuarioId: usuario!.id,
      clienteId: cliente?.id || null,
      subtotal: calcularSubtotal(),
      descontoPercentual: parseFloat(descontoGlobalPerc) || 0,
      descontoValor: parseFloat(descontoGlobalValor) || 0,
      acrescimoPercentual: parseFloat(acrescimoGlobalPerc) || 0,
      acrescimoValor: parseFloat(acrescimoGlobalValor) || 0,
      frete: parseFloat(frete) || 0,
      total: calcularTotal(),
      valorPago: valorPago,
      troco: troco,
      observacoes: null,
      itens: itens.map((item) => ({
        produtoId: item.produto.id,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        descontoPercentual: item.descontoPercentual || 0,
        descontoValor: item.descontoValor || 0,
        acrescimoPercentual: item.acrescimoPercentual || 0,
        acrescimoValor: item.acrescimoValor || 0,
        total: item.total,
      })),
      pagamentos: pagamentos.map((p) => ({
        formaPagamentoId: p.formaPagamento.id,
        valor: p.valorPago,
        troco: p.troco,
      })),
    };

    try {
      const res = await vendaService.criar(vendaDTO);
      setMostrarModalPagamento(false);

      if (troco > 0) {
        showSuccess(`Venda ${res.data.numeroDocumento} finalizada! Troco: R$ ${troco.toFixed(2)}`);
      } else {
        showSuccess(`Venda ${res.data.numeroDocumento} finalizada com sucesso!`);
      }

      const vendaCompleta = {
        ...res.data,
        itens: itens,
        cliente: cliente,
        usuario: usuario,
        pagamentos: pagamentos.map((p) => ({
          formaPagamento: p.formaPagamento,
          valor: p.valorPago,
        })),
      };

      setVendaFinalizada(vendaCompleta);
      setMostrarCupom(true);
      limparVenda();

      if (controlarCaixa) {
        verificarStatusCaixa();
      }
    } catch (error: any) {
      console.error('Erro:', error);
      let mensagem = 'Erro desconhecido';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          mensagem = error.response.data;
        } else if (error.response.data.erro) {
          mensagem = error.response.data.erro;
        } else {
          mensagem = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        mensagem = error.message;
      }
      showError('Erro ao finalizar venda: ' + mensagem);
    }
  };

  const limparVenda = () => {
    setItens([]);

    if (empresa?.clientePadrao) {
      setCliente(empresa.clientePadrao);
    } else {
      setCliente(null);
    }

    setCodigoProduto('');
    setDescontoGlobalPerc('0');
    setDescontoGlobalValor('0');
    setAcrescimoGlobalPerc('0');
    setAcrescimoGlobalValor('0');
    setFrete('0');
    setItemSelecionado(-1);
    inputProdutoRef.current?.focus();
  };

  const totalItens = itens.length;
  const nomeClienteExibicao = cliente?.nome || 'CONSUMIDOR FINAL';
  // ====== LAYOUT (TEMA CLARO IGUAL À IMAGEM) ======
  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa] text-gray-900 overflow-hidden">
      {/* TOPO */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-white">
            🧾
          </div>
          <span className="text-xl font-semibold">
            {empresa?.nomeFantasia || 'Caixa Fácil'}
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-700">
          <span>Usuário: {usuario?.nome || 'Administrador'}</span>

          <button
            onClick={() => navigate('/estoque/consulta')}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            Estoque
          </button>

          <button
            onClick={() => navigate('/vendas')}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            Vendas
          </button>

          <button
            onClick={() => navigate('/cadastros')}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            Cadastros
          </button>

          <button
            onClick={() => navigate('/configuracao')}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-1"
          >
            <span>Configuração</span>
            <span>▾</span>
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('usuario');
              navigate('/');
            }}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-1"
          >
            Sair
          </button>

        </div>
      </header>

      {/* MENU INFERIOR DO HEADER */}
      <div className="mx-6 mt-3 bg-white border border-gray-200 rounded-lg px-6 py-2 flex items-center justify-between text-sm shadow-sm">
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 flex items-center gap-2">
            <span className="font-semibold">F2</span>
            <span>Buscar Produto</span>
          </button>

          <button className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-100 flex items-center gap-2">
            <span className="font-semibold">F3</span>
            <span>Cliente</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Status:{' '}
            <span
              className={
                caixaAberto
                  ? 'text-emerald-600 font-semibold'
                  : 'text-red-500 font-semibold'
              }
            >
              {caixaAberto ? 'Aberto' : 'Fechado'}
            </span>
          </span>

          <button
            onClick={() => navigate('/caixa')}
            className="px-3 py-1.5 rounded-md border border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50 flex items-center gap-2"
          >
            <span className="font-semibold">F10</span>
            <span>{caixaAberto ? 'Fechar Caixa' : 'Abrir Caixa'}</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-2 gap-3 min-h-0">
        <div className="flex-1 flex gap-4 min-h-0">
          {/* COLUNA ESQUERDA */}
          <div className="flex-1 flex flex-col gap-3">
            {/* CARD DE CÓDIGO / CLIENTE */}
            <div className="flex gap-4">
              {/* Campo principal de código */}
              <div className="flex-1 bg-white border border-[#e4e7ec] rounded-lg shadow-sm p-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Código / Leitor de Barras (F1)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white flex-1">
                    <span className="mr-2 text-gray-500">▌▌▌</span>
                    <input
                      ref={inputProdutoRef}
                      type="text"
                      value={codigoProduto}
                      onChange={(e) => setCodigoProduto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') buscarProduto(codigoProduto);
                      }}
                      placeholder="Digite o código ou use o leitor"
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Código leitor + cliente */}
              <div className="w-72 bg-white border border-[#e4e7ec] rounded-lg shadow-sm p-4 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Código Leitor de Barras (F1)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value="000001"
                      readOnly
                      className="flex-1 px-3 py-2 rounded-md border border-emerald-500 bg-emerald-50 text-emerald-600 font-semibold text-sm"
                    />
                    <button className="w-10 h-10 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                      🔍
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-gray-600">Cliente: </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {nomeClienteExibicao.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* TABELA DE ITENS */}
            <div className="flex-1 bg-white border border-[#e4e7ec] rounded-lg shadow-sm flex flex-col min-h-0 overflow-hidden">
              {/* CABEÇALHO */}
              <div className="grid grid-cols-9 gap-2 px-4 py-2 border-b border-gray-200 bg-[#f5f7fa] text-xs font-semibold text-gray-600">
                <div>Seq</div>
                <div className="col-span-2">Descrição</div>
                <div className="text-right">Qtd</div>
                <div className="text-right">Preço Unit.</div>
                <div className="text-right">Total</div>
                <div className="text-right">Desc %</div>
                <div className="text-right">Desc R$</div>
                <div className="text-right">Acrés R$</div>
              </div>

              {/* LINHAS */}
              <div className="flex-1 text-xs overflow-y-auto min-h-0">
                {itens.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No aguardo de produtos...
                  </div>
                )}

                {itens.map((item, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-9 gap-2 px-4 py-2 border-b border-gray-100 cursor-pointer ${itemSelecionado === index ? 'bg-emerald-50' : 'bg-white'
                      }`}
                    onClick={() => setItemSelecionado(index)}
                  >
                    <div className="flex items-center">{index + 1}</div>
                    <div className="col-span-2 flex items-center text-gray-800 truncate">
                      {item.produto.descricao}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => atualizarQuantidade(index, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                        min="0"
                        step="0.001"
                      />
                    </div>

                    <div className="flex items-center justify-end text-gray-800">
                      {item.precoUnitario.toFixed(2)}
                    </div>

                    <div className="flex items-center justify-end text-gray-800">
                      {item.total.toFixed(2)}
                    </div>

                    <div className="flex items-center">
                      <input
                        type="number"
                        value={item.descontoPercentual || 0}
                        onChange={(e) => atualizarDesconto(index, 'perc', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="number"
                        value={(item.descontoValor || 0).toFixed(2)}
                        onChange={(e) => atualizarDesconto(index, 'valor', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="number"
                        value={(item.acrescimoValor || 0).toFixed(2)}
                        onChange={(e) => atualizarAcrescimo(index, 'valor', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA – RESUMO */}
          <div className="w-80 flex flex-col gap-3">
            <div className="bg-white border border-[#e4e7ec] rounded-lg shadow-sm p-4 text-sm space-y-3">
              <div className="flex items-center justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">R$ {calcularSubtotal().toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block mb-1 text-gray-600">Desc. Global %</label>
                  <input
                    type="number"
                    value={descontoGlobalPerc}
                    onChange={(e) => setDescontoGlobalPerc(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-600">Desc. R$</label>
                  <input
                    type="number"
                    value={descontoGlobalValor}
                    onChange={(e) => setDescontoGlobalValor(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block mb-1 text-gray-600">Acrés. Global %</label>
                  <input
                    type="number"
                    value={acrescimoGlobalPerc}
                    onChange={(e) => setAcrescimoGlobalPerc(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-600">Acrés. R$</label>
                  <input
                    type="number"
                    value={acrescimoGlobalValor}
                    onChange={(e) => setAcrescimoGlobalValor(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                    min="0"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block mb-1 text-gray-600">Frete</label>
                <input
                  type="number"
                  value={frete}
                  onChange={(e) => setFrete(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-right"
                  min="0"
                />
              </div>

              <div className="border-t border-gray-200 pt-3 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    R$ {calcularTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={abrirModalPagamento}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg text-lg shadow-sm"
            >
              F6 – Finalizar Venda
            </button>

            <button
              onClick={limparVenda}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-lg border border-red-200 text-sm"
            >
              Cancelar Venda
            </button>
          </div>
        </div>
      </div>

      {/* RODAPÉ FIXO DO TOTAL */}
      <div className="w-full bg-white border-t border-gray-300 shadow-md px-6 py-3 flex items-center justify-between text-lg font-semibold">
        <span className="text-gray-700">Total da Venda:</span>
        <span className="text-emerald-600 font-bold">
          R$ {calcularTotal().toFixed(2)}
        </span>
      </div>

      {mostrarModalPagamento && (
        <ModalPagamento
          valorTotal={calcularTotal()}
          formasPagamento={formasPagamento}
          onConfirmar={finalizarVenda}
          onCancelar={() => setMostrarModalPagamento(false)}
        />
      )}

      {mostrarCupom && vendaFinalizada && empresa && (
        <CupomNaoFiscal
          venda={vendaFinalizada}
          empresa={empresa}
          onClose={() => setMostrarCupom(false)}
        />
      )}
    </div>
  );
}
