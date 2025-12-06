import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';

interface Configuracao {
  id?: number;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  mensagemCupom: string;
  logoPath?: string;
  clientePadraoId?: number;
}

interface Cliente {
  id: number;
  codigo?: string;
  nome: string;
}

export default function ConfiguracaoEmpresa() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [aba, setAba] = useState<'empresa' | 'vendas'>('empresa');
  const [config, setConfig] = useState<Configuracao>({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    inscricaoEstadual: '',
    endereco: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    telefone: '',
    email: '',
    mensagemCupom: '* OBRIGADO E VOLTE SEMPRE *',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    carregarConfiguracao();
    carregarClientes();
  }, []);

  const carregarConfiguracao = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/configuracao');
      if (res.data.id) {
        setConfig(res.data);
        if (res.data.logoPath) {
          setLogoPreview(`http://localhost:8080/uploads/logos/${res.data.logoPath}`);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const carregarClientes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const salvar = async () => {
    try {
      await axios.post('http://localhost:8080/api/configuracao', config);
      showSuccess('Configuração salva com sucesso!');
    } catch (error) {
      showError('Erro ao salvar configuração');
    }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:8080/api/configuracao/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setConfig({ ...config, logoPath: res.data.logoPath });
      setLogoPreview(URL.createObjectURL(file));
      showSuccess('Logo enviada com sucesso!');
    } catch (error) {
      showError('Erro ao enviar logo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        <button
          onClick={() => navigate('/pdv')}
          className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100"
        >
          Voltar ao PDV
        </button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded shadow">
          {/* Abas */}
          <div className="flex border-b">
            <button
              onClick={() => setAba('empresa')}
              className={`px-6 py-3 font-bold ${
                aba === 'empresa' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              }`}
            >
              Dados da Empresa
            </button>
            <button
              onClick={() => setAba('vendas')}
              className={`px-6 py-3 font-bold ${
                aba === 'vendas' ? 'bg-primary text-white' : 'hover:bg-gray-100'
              }`}
            >
              Configurações de Vendas
            </button>
          </div>

          <div className="p-6">
            {/* ABA EMPRESA */}
            {aba === 'empresa' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Dados da Empresa</h2>

                {/* Logo */}
                <div className="mb-6">
                  <label className="block text-sm font-bold mb-2">Logo da Empresa</label>
                  <div className="flex gap-4 items-center">
                    {logoPreview && (
                      <img src={logoPreview} alt="Logo" className="h-24 w-auto border rounded" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadLogo}
                      className="flex-1 px-3 py-2 border rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">Nome Fantasia*</label>
                    <input
                      type="text"
                      value={config.nomeFantasia}
                      onChange={(e) => setConfig({ ...config, nomeFantasia: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Razão Social*</label>
                    <input
                      type="text"
                      value={config.razaoSocial}
                      onChange={(e) => setConfig({ ...config, razaoSocial: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">CNPJ</label>
                    <input
                      type="text"
                      value={config.cnpj}
                      onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Inscrição Estadual</label>
                    <input
                      type="text"
                      value={config.inscricaoEstadual}
                      onChange={(e) => setConfig({ ...config, inscricaoEstadual: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold mb-1">Endereço</label>
                    <input
                      type="text"
                      value={config.endereco}
                      onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Bairro</label>
                    <input
                      type="text"
                      value={config.bairro}
                      onChange={(e) => setConfig({ ...config, bairro: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Cidade</label>
                    <input
                      type="text"
                      value={config.cidade}
                      onChange={(e) => setConfig({ ...config, cidade: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">UF</label>
                    <input
                      type="text"
                      value={config.uf}
                      onChange={(e) => setConfig({ ...config, uf: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">CEP</label>
                    <input
                      type="text"
                      value={config.cep}
                      onChange={(e) => setConfig({ ...config, cep: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="00000-000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Telefone</label>
                    <input
                      type="text"
                      value={config.telefone}
                      onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="(00) 0000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">E-mail</label>
                    <input
                      type="email"
                      value={config.email}
                      onChange={(e) => setConfig({ ...config, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-bold mb-1">Mensagem do Cupom</label>
                    <textarea
                      value={config.mensagemCupom}
                      onChange={(e) => setConfig({ ...config, mensagemCupom: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA VENDAS */}
            {aba === 'vendas' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Configurações de Vendas</h2>

                <div className="max-w-2xl">
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Cliente Padrão:</strong> Este cliente será automaticamente selecionado 
                      ao abrir o PDV ou ao limpar uma venda. Útil para vendas sem identificação do cliente.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Cliente Padrão para Vendas</label>
                    <select
                      value={config.clientePadraoId || ''}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        clientePadraoId: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Nenhum (deixar em branco)</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.codigo ? `${cliente.codigo} - ` : ''}{cliente.nome}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      Se nenhum cliente for selecionado, o campo ficará vazio no PDV
                    </p>
                  </div>

                  {config.clientePadraoId && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        ✓ Cliente padrão selecionado: <strong>
                          {clientes.find(c => c.id === config.clientePadraoId)?.nome}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 mt-6 pt-6 border-t">
              <button
                onClick={salvar}
                className="bg-primary text-white px-6 py-2 rounded hover:bg-green-600 font-bold"
              >
                Salvar Configuração
              </button>
              <button
                onClick={() => navigate('/pdv')}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
