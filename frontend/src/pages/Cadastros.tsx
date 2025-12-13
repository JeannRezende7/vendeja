import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { produtoService, clienteService, cadastrosService } from '../services/api';
import { Produto, Cliente, Categoria, Usuario, FormaPagamento } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export default function Cadastros() {
  const { showSuccess, showError, showWarning } = useNotification();
  const navigate = useNavigate();
  const [aba, setAba] = useState<'produtos' | 'clientes' | 'usuarios' | 'categorias' | 'formasPagamento'>('produtos');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);

  const [produtoForm, setProdutoForm] = useState<Partial<Produto>>({
    codigo: '',
    descricao: '',
    unidade: 'UN',
    precoVenda: undefined,
    precoCusto: undefined,
    estoque: undefined,
    estoqueMinimo: undefined,
    controlarEstoque: true,
    ativo: true,
    codigosAlternativos: [],
    fotoPath: undefined,
  });

  const [fotoPreview, setFotoPreview] = useState<string>('');

  const [novoCodigo, setNovoCodigo] = useState('');
  const [novoCodigoDesc, setNovoCodigoDesc] = useState('');

  const [clienteForm, setClienteForm] = useState<Partial<Cliente>>({
    nome: '',
    ativo: true,
  });

  const [usuarioForm, setUsuarioForm] = useState<Partial<Usuario>>({
    login: '',
    senha: '',
    nome: '',
    admin: false,
    ativo: true,
  });

  const [categoriaForm, setCategoriaForm] = useState<Partial<Categoria>>({
    descricao: '',
    ativo: true,
  });

  const [formaPagamentoForm, setFormaPagamentoForm] = useState<Partial<FormaPagamento>>({
    descricao: '',
    categoria: 'DINHEIRO',
    tipoPagamento: '01',
    permiteParcelamento: false,
    ativo: true,
  });

  useEffect(() => {
    carregarDados();
  }, [aba]);

  const carregarDados = async () => {
    try {
      if (aba === 'produtos') {
        const [prods, cats] = await Promise.all([
          produtoService.listar(),
          cadastrosService.listarCategorias(),
        ]);
        setProdutos(prods.data);
        setCategorias(cats.data);
      } else if (aba === 'clientes') {
        const res = await clienteService.listar();
        setClientes(res.data);
      } else if (aba === 'usuarios') {
        const res = await cadastrosService.listarUsuarios();
        setUsuarios(res.data);
      } else if (aba === 'categorias') {
        const res = await cadastrosService.listarCategorias();
        setCategorias(res.data);
      } else if (aba === 'formasPagamento') {
        const res = await cadastrosService.listarFormasPagamento();
        setFormasPagamento(res.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const adicionarCodigo = () => {
    if (!novoCodigo.trim()) {
      showWarning('Digite um código');
      return;
    }

    const codigos = produtoForm.codigosAlternativos || [];
    codigos.push({
      codigo: novoCodigo,
      descricao: novoCodigoDesc || undefined,
    });

    setProdutoForm({ ...produtoForm, codigosAlternativos: codigos });
    setNovoCodigo('');
    setNovoCodigoDesc('');
  };

  const removerCodigo = (index: number) => {
    const codigos = [...(produtoForm.codigosAlternativos || [])];
    codigos.splice(index, 1);
    setProdutoForm({ ...produtoForm, codigosAlternativos: codigos });
  };

  const uploadFotoProduto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!produtoForm.id) {
      showWarning('Salve o produto antes de enviar a foto');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await produtoService.uploadFoto(produtoForm.id, formData);
      setProdutoForm({ ...produtoForm, fotoPath: res.data.fotoPath });
      setFotoPreview(URL.createObjectURL(file));
      showSuccess('Foto enviada com sucesso!');
    } catch (error) {
      showError('Erro ao enviar foto');
    }
  };

  const deletarFotoProduto = async () => {
    if (!produtoForm.id) return;

    try {
      await produtoService.deletarFoto(produtoForm.id);
      setProdutoForm({ ...produtoForm, fotoPath: undefined });
      setFotoPreview('');
      showSuccess('Foto removida com sucesso!');
    } catch (error) {
      showError('Erro ao remover foto');
    }
  };

  const salvarProduto = async () => {
    if (!produtoForm.codigo || !produtoForm.descricao) {
      showWarning('Preencha código e descrição');
      return;
    }

    try {
      // Preparar dados para envio
      const produtoDTO = {
        ...produtoForm,
        precoVenda: produtoForm.precoVenda || 0,
        precoCusto: produtoForm.precoCusto || 0,
        estoque: produtoForm.estoque || 0,
        estoqueMinimo: produtoForm.estoqueMinimo || 0,
        categoria: produtoForm.categoria?.id ? { id: produtoForm.categoria.id } : null,
      };

      if (produtoForm.id) {
        await produtoService.atualizar(produtoForm.id, produtoDTO as Produto);
      } else {
        await produtoService.criar(produtoDTO as Produto);
      }
      showSuccess('Produto salvo com sucesso!');
      limparProdutoForm();
      carregarDados();
    } catch (error) {
      showError('Erro ao salvar produto');
    }
  };

  const limparProdutoForm = () => {
    setProdutoForm({
      codigo: '',
      descricao: '',
      unidade: 'UN',
      precoVenda: undefined,
      precoCusto: undefined,
      estoque: undefined,
      estoqueMinimo: undefined,
      controlarEstoque: true,
      ativo: true,
      codigosAlternativos: [],
      categoria: undefined,
      fotoPath: undefined,
    });
    setFotoPreview('');
  };

  const editarProduto = (produto: Produto) => {
    setProdutoForm({
      ...produto,
      codigosAlternativos: produto.codigosAlternativos || [],
    });

    // Carregar preview da foto se existir
    if (produto.fotoPath) {
      setFotoPreview(`http://localhost:8080/uploads/produtos/${produto.fotoPath}`);
    } else {
      setFotoPreview('');
    }
  };

  const salvarCliente = async () => {
    if (!clienteForm.nome) {
      showWarning('Preencha o nome');
      return;
    }

    try {
      if (clienteForm.id) {
        await clienteService.atualizar(clienteForm.id, clienteForm as Cliente);
      } else {
        await clienteService.criar(clienteForm as Cliente);
      }
      showSuccess('Cliente salvo com sucesso!');
      setClienteForm({ nome: '', ativo: true });
      carregarDados();
    } catch (error) {
      showError('Erro ao salvar cliente');
    }
  };

  const salvarUsuario = async () => {
    if (!usuarioForm.login || !usuarioForm.senha || !usuarioForm.nome) {
      showWarning('Preencha login, senha e nome');
      return;
    }

    try {
      if (usuarioForm.id) {
        await cadastrosService.atualizarUsuario(usuarioForm.id, usuarioForm as Usuario);
      } else {
        await cadastrosService.criarUsuario(usuarioForm as Usuario);
      }
      showSuccess('Usuário salvo com sucesso!');
      setUsuarioForm({ login: '', senha: '', nome: '', admin: false, ativo: true });
      carregarDados();
    } catch (error) {
      showError('Erro ao salvar usuário');
    }
  };

  const salvarCategoria = async () => {
    if (!categoriaForm.descricao) {
      showWarning('Preencha a descrição');
      return;
    }

    try {
      await cadastrosService.criarCategoria(categoriaForm as Categoria);
      showSuccess('Categoria salva com sucesso!');
      setCategoriaForm({ descricao: '', ativo: true });
      carregarDados();
    } catch (error) {
      showError('Erro ao salvar categoria');
    }
  };

  const salvarFormaPagamento = async () => {
    if (!formaPagamentoForm.descricao) {
      showWarning('Preencha a descrição');
      return;
    }

    try {
      await cadastrosService.criarFormaPagamento(formaPagamentoForm as FormaPagamento);
      showSuccess('Forma de pagamento salva com sucesso!');
      setFormaPagamentoForm({ descricao: '', tipoPagamento: '99', permiteParcelamento: false, ativo: true });
      carregarDados();
    } catch (error) {
      showError('Erro ao salvar forma de pagamento');
    }
  };

  // Tipos de Pagamento PDV (interno)
  const tiposPDV = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'PIX', label: 'PIX' },
    { value: 'CARTAO', label: 'Cartão' },
    { value: 'PARCELADO', label: 'Parcelado' },
    { value: 'TICKET', label: 'Ticket' },
    { value: 'VALE', label: 'Vale' },
  ];

  // Meios de Pagamento NFC-e (códigos oficiais)
  const meiosPagamentoNFCe = [
    { codigo: '01', nome: 'Dinheiro' },
    { codigo: '02', nome: 'Cheque' },
    { codigo: '03', nome: 'Cartão de Crédito' },
    { codigo: '04', nome: 'Cartão de Débito' },
    { codigo: '05', nome: 'Crédito Loja' },
    { codigo: '10', nome: 'Vale Alimentação' },
    { codigo: '11', nome: 'Vale Refeição' },
    { codigo: '12', nome: 'Vale Presente' },
    { codigo: '13', nome: 'Vale Combustível' },
    { codigo: '15', nome: 'Boleto Bancário' },
    { codigo: '16', nome: 'Depósito Bancário' },
    { codigo: '17', nome: 'PIX' },
    { codigo: '18', nome: 'Transferência Bancária' },
    { codigo: '19', nome: 'Programa de Fidelidade' },
    { codigo: '90', nome: 'Sem pagamento' },
    { codigo: '99', nome: 'Outros' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cadastros</h1>
        <button
          onClick={() => navigate('/pdv')}
          className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100"
        >
          Voltar ao PDV
        </button>
      </div>

      <div className="p-4">
        <div className="bg-white rounded shadow">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setAba('produtos')}
              className={`px-6 py-3 font-bold whitespace-nowrap ${aba === 'produtos' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
            >
              Produtos
            </button>
            <button
              onClick={() => setAba('clientes')}
              className={`px-6 py-3 font-bold whitespace-nowrap ${aba === 'clientes' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
            >
              Clientes
            </button>
            <button
              onClick={() => setAba('usuarios')}
              className={`px-6 py-3 font-bold whitespace-nowrap ${aba === 'usuarios' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
            >
              Usuários
            </button>
            <button
              onClick={() => setAba('categorias')}
              className={`px-6 py-3 font-bold whitespace-nowrap ${aba === 'categorias' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
            >
              Categorias
            </button>
            <button
              onClick={() => setAba('formasPagamento')}
              className={`px-6 py-3 font-bold whitespace-nowrap ${aba === 'formasPagamento' ? 'bg-primary text-white' : 'hover:bg-gray-100'
                }`}
            >
              Formas Pagamento
            </button>
          </div>

          <div className="p-4">
            {aba === 'produtos' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Cadastro de Produto</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Código*</label>
                    <input
                      type="text"
                      value={produtoForm.codigo}
                      onChange={(e) =>
                        setProdutoForm({
                          ...produtoForm,
                          codigo: e.target.value.padStart(6, "0"), // <<< ZERO-FILL AUTOMÁTICO
                        })
                      }
                      maxLength={6}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold mb-1">Descrição*</label>
                    <input
                      type="text"
                      value={produtoForm.descricao}
                      onChange={(e) => setProdutoForm({ ...produtoForm, descricao: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Categoria</label>
                    <select
                      value={produtoForm.categoria?.id || ''}
                      onChange={(e) => {
                        const catId = Number(e.target.value);
                        const cat = categorias.find(c => c.id === catId);
                        setProdutoForm({ ...produtoForm, categoria: cat });
                      }}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Selecione...</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.descricao}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Unidade</label>
                    <input
                      type="text"
                      value={produtoForm.unidade}
                      onChange={(e) => setProdutoForm({ ...produtoForm, unidade: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  {/* Foto do Produto */}
                  <div>
                    <label className="block text-sm font-bold mb-1">Foto do Produto</label>
                    <div className="flex gap-2 items-center">
                      {fotoPreview && (
                        <div className="relative">
                          <img
                            src={fotoPreview}
                            alt="Preview"
                            className="h-20 w-20 object-cover border rounded"
                          />
                          <button
                            type="button"
                            onClick={deletarFotoProduto}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadFotoProduto}
                        disabled={!produtoForm.id}
                        className="flex-1 px-3 py-2 border rounded disabled:bg-gray-100"
                      />
                    </div>
                    {!produtoForm.id && (
                      <p className="text-xs text-gray-600 mt-1">
                        Salve o produto primeiro para enviar a foto
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Preço Venda</label>
                    <input
                      type="number"
                      value={produtoForm.precoVenda ?? ''}
                      onChange={(e) => setProdutoForm({ ...produtoForm, precoVenda: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border rounded"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Preço Custo</label>
                    <input
                      type="number"
                      value={produtoForm.precoCusto ?? ''}
                      onChange={(e) => setProdutoForm({ ...produtoForm, precoCusto: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border rounded"
                      step="0.01"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Estoque</label>
                    <input
                      type="number"
                      value={produtoForm.estoque ?? ''}
                      onChange={(e) => setProdutoForm({ ...produtoForm, estoque: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border rounded"
                      step="0.001"
                      placeholder="0,000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Estoque Mínimo</label>
                    <input
                      type="number"
                      value={produtoForm.estoqueMinimo ?? ''}
                      onChange={(e) => setProdutoForm({ ...produtoForm, estoqueMinimo: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border rounded"
                      step="0.001"
                      placeholder="0,000"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={produtoForm.controlarEstoque}
                        onChange={(e) => setProdutoForm({ ...produtoForm, controlarEstoque: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-bold">Controlar Estoque</span>
                    </label>
                  </div>
                </div>

                {/* Códigos Alternativos/EAN */}
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-bold mb-2">Códigos Alternativos / EAN</h4>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <input
                        type="text"
                        value={novoCodigo}
                        onChange={(e) => setNovoCodigo(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && adicionarCodigo()}
                        placeholder="Código/EAN"
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={novoCodigoDesc}
                        onChange={(e) => setNovoCodigoDesc(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && adicionarCodigo()}
                        placeholder="Descrição (opcional)"
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>
                    <div>
                      <button
                        onClick={adicionarCodigo}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>

                  {produtoForm.codigosAlternativos && produtoForm.codigosAlternativos.length > 0 && (
                    <table className="w-full border rounded">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="p-2 text-left">Código</th>
                          <th className="p-2 text-left">Descrição</th>
                          <th className="p-2 text-center w-24">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtoForm.codigosAlternativos.map((cod, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{cod.codigo}</td>
                            <td className="p-2">{cod.descricao || '-'}</td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => removerCodigo(idx)}
                                className="text-red-600 hover:text-red-800 font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={salvarProduto}
                    className="bg-primary text-white px-6 py-2 rounded hover:bg-green-600 font-bold"
                  >
                    {produtoForm.id ? 'Atualizar' : 'Salvar'}
                  </button>
                  <button
                    onClick={limparProdutoForm}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    {produtoForm.id ? 'Cancelar' : 'Limpar'}
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="font-bold mb-2">Produtos Cadastrados</h4>
                  <div className="border rounded max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-200 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Código</th>
                          <th className="p-2 text-left">Descrição</th>
                          <th className="p-2 text-left">Categoria</th>
                          <th className="p-2 text-right">Preço</th>
                          <th className="p-2 text-right">Estoque</th>
                          <th className="p-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {produtos.map(p => (
                          <tr key={p.id} className="border-t hover:bg-gray-50">
                            <td className="p-2">{p.codigo}</td>
                            <td className="p-2">{p.descricao}</td>
                            <td className="p-2">{p.categoria?.descricao || '-'}</td>
                            <td className="p-2 text-right">R$ {p.precoVenda.toFixed(2)}</td>
                            <td className="p-2 text-right">{p.estoque.toFixed(3)}</td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => editarProduto(p)}
                                className="text-blue-600 hover:text-blue-800 font-bold"
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* RESTANTE DAS ABAS (Clientes, Usuários, etc) - Mantém o mesmo código */}
            {aba === 'clientes' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Cadastro de Cliente</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Código</label>
                    <input
                      type="text"
                      value={clienteForm.codigo || ''}
                      onChange={(e) => setClienteForm({ ...clienteForm, codigo: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold mb-1">Nome*</label>
                    <input
                      type="text"
                      value={clienteForm.nome}
                      onChange={(e) => setClienteForm({ ...clienteForm, nome: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">CPF/CNPJ</label>
                    <input
                      type="text"
                      value={clienteForm.cpfCnpj || ''}
                      onChange={(e) => setClienteForm({ ...clienteForm, cpfCnpj: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Telefone</label>
                    <input
                      type="text"
                      value={clienteForm.telefone || ''}
                      onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">E-mail</label>
                    <input
                      type="email"
                      value={clienteForm.email || ''}
                      onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={salvarCliente}
                    className="bg-primary text-white px-6 py-2 rounded hover:bg-green-600 font-bold"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setClienteForm({ nome: '', ativo: true })}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Limpar
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="font-bold mb-2">Clientes Cadastrados</h4>
                  <div className="border rounded max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-200 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Código</th>
                          <th className="p-2 text-left">Nome</th>
                          <th className="p-2 text-left">CPF/CNPJ</th>
                          <th className="p-2 text-left">Telefone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientes.map(c => (
                          <tr key={c.id} className="border-t hover:bg-gray-50">
                            <td className="p-2">{c.codigo}</td>
                            <td className="p-2">{c.nome}</td>
                            <td className="p-2">{c.cpfCnpj}</td>
                            <td className="p-2">{c.telefone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {aba === 'usuarios' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Cadastro de Usuário</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Login*</label>
                    <input
                      type="text"
                      value={usuarioForm.login}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, login: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Senha*</label>
                    <input
                      type="password"
                      value={usuarioForm.senha}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, senha: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Nome*</label>
                    <input
                      type="text"
                      value={usuarioForm.nome}
                      onChange={(e) => setUsuarioForm({ ...usuarioForm, nome: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={usuarioForm.admin}
                        onChange={(e) => setUsuarioForm({ ...usuarioForm, admin: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-bold">Administrador</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={salvarUsuario}
                    className="bg-primary text-white px-6 py-2 rounded hover:bg-green-600 font-bold"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setUsuarioForm({ login: '', senha: '', nome: '', admin: false, ativo: true })}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Limpar
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="font-bold mb-2">Usuários Cadastrados</h4>
                  <div className="border rounded max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-200 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Login</th>
                          <th className="p-2 text-left">Nome</th>
                          <th className="p-2 text-center">Admin</th>
                          <th className="p-2 text-center">Ativo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map(u => (
                          <tr key={u.id} className="border-t hover:bg-gray-50">
                            <td className="p-2">{u.login}</td>
                            <td className="p-2">{u.nome}</td>
                            <td className="p-2 text-center">{u.admin ? 'Sim' : 'Não'}</td>
                            <td className="p-2 text-center">{u.ativo ? 'Sim' : 'Não'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {aba === 'categorias' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Cadastro de Categoria</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Descrição*</label>
                    <input
                      type="text"
                      value={categoriaForm.descricao}
                      onChange={(e) => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={salvarCategoria}
                    className="bg-primary text-white px-6 py-2 rounded hover:bg-green-600 font-bold"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setCategoriaForm({ descricao: '', ativo: true })}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Limpar
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="font-bold mb-2">Categorias Cadastradas</h4>
                  <div className="border rounded max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-200 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Descrição</th>
                          <th className="p-2 text-center">Ativa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categorias.map(c => (
                          <tr key={c.id} className="border-t hover:bg-gray-50">
                            <td className="p-2">{c.descricao}</td>
                            <td className="p-2 text-center">{c.ativo ? 'Sim' : 'Não'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {aba === 'formasPagamento' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Cadastro de Forma de Pagamento</h3>

                {/* Descrição */}
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-1">Descrição*</label>
                  <input
                    type="text"
                    value={formaPagamentoForm.descricao}
                    onChange={(e) => setFormaPagamentoForm({ ...formaPagamentoForm, descricao: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {/* Tipo PDV e Meio NFC-e */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Tipo de Pagamento (PDV)*</label>
                    <select
                      value={formaPagamentoForm.categoria || 'DINHEIRO'}
                      onChange={(e) => setFormaPagamentoForm({ ...formaPagamentoForm, categoria: e.target.value })}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      {tiposPDV.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Meio de Pagamento (NFC-e)*</label>
                    <select
                      value={formaPagamentoForm.tipoPagamento}
                      onChange={(e) => setFormaPagamentoForm({ ...formaPagamentoForm, tipoPagamento: e.target.value })}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      {meiosPagamentoNFCe.map(meio => (
                        <option key={meio.codigo} value={meio.codigo}>
                          {meio.codigo} - {meio.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Permite Parcelamento */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formaPagamentoForm.permiteParcelamento}
                      onChange={(e) => setFormaPagamentoForm({ ...formaPagamentoForm, permiteParcelamento: e.target.checked })}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm font-bold">Permite Parcelamento</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={salvarFormaPagamento}
                    className="bg-primary text-white px-6 py-2 rounded hover:bg-green-600 font-bold"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setFormaPagamentoForm({ descricao: '', categoria: 'DINHEIRO', tipoPagamento: '01', permiteParcelamento: false, ativo: true })}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Limpar
                  </button>
                </div>

                <div className="mt-6">
                  <h4 className="font-bold mb-2">Formas de Pagamento Cadastradas</h4>
                  <div className="border rounded max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-200 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Descrição</th>
                          <th className="p-2 text-left">Tipo PDV</th>
                          <th className="p-2 text-left">Meio NFC-e</th>
                          <th className="p-2 text-center">Parcelamento</th>
                          <th className="p-2 text-center">Ativa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formasPagamento.map(fp => (
                          <tr key={fp.id} className="border-t hover:bg-gray-50">
                            <td className="p-2">{fp.descricao}</td>
                            <td className="p-2">{fp.categoria || '-'}</td>
                            <td className="p-2">{fp.tipoPagamento}</td>
                            <td className="p-2 text-center">{fp.permiteParcelamento ? 'Sim' : 'Não'}</td>
                            <td className="p-2 text-center">{fp.ativo ? 'Sim' : 'Não'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}