import { useState, useEffect, useRef } from 'react';
import { Cliente } from '../types';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

interface ModalBuscaClienteProps {
  onSelecionar: (cliente: Cliente) => void;
  onCancelar: () => void;
}

export default function ModalBuscaCliente({ onSelecionar, onCancelar }: ModalBuscaClienteProps) {
  const [termoBusca, setTermoBusca] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<number>(-1);
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (termoBusca.length >= 2) {
      buscarClientes();
    } else {
      setClientes([]);
    }
  }, [termoBusca]);

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (clientes.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setClienteSelecionado((prev) =>
          prev < clientes.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setClienteSelecionado((prev) =>
          prev > 0 ? prev - 1 : clientes.length - 1
        );
      } else if (e.key === 'Enter' && clienteSelecionado >= 0) {
        e.preventDefault();
        onSelecionar(clientes[clienteSelecionado]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancelar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clientes, clienteSelecionado, onSelecionar, onCancelar]);

  const buscarClientes = async () => {
    try {
      setCarregando(true);
      const res = await axios.get(`${getApiBaseUrl()}/clientes/buscar`, {
        params: { q: termoBusca }
      });
      setClientes(res.data);
      setClienteSelecionado(res.data.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      setClientes([]);
    } finally {
      setCarregando(false);
    }
  };

  const formatarCPFCNPJ = (doc: string) => {
    if (!doc) return '';
    const numeros = doc.replace(/\D/g, '');
    if (numeros.length === 11) {
      // CPF
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numeros.length === 14) {
      // CNPJ
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  const formatarTelefone = (tel: string) => {
    if (!tel) return '';
    const numeros = tel.replace(/\D/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return tel;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* CABEÇALHO */}
        <div className="bg-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-bold">Buscar Cliente (F3)</h2>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className="p-4 border-b">
          <input
            ref={inputRef}
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Digite código, nome, CPF ou telefone do cliente..."
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          />
          <p className="text-sm text-gray-500 mt-2">
            Use ↑ ↓ para navegar • Enter para selecionar • Esc para cancelar
          </p>
        </div>

        {/* LISTA DE CLIENTES */}
        <div className="flex-1 overflow-y-auto p-4">
          {carregando && (
            <div className="text-center py-8 text-gray-500">
              Buscando clientes...
            </div>
          )}

          {!carregando && termoBusca.length < 2 && (
            <div className="text-center py-8 text-gray-500">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}

          {!carregando && termoBusca.length >= 2 && clientes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum cliente encontrado
            </div>
          )}

          {clientes.length > 0 && (
            <div className="space-y-2">
              {clientes.map((cliente, index) => (
                <div
                  key={cliente.id}
                  onClick={() => onSelecionar(cliente)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    index === clienteSelecionado
                      ? 'bg-green-50 border-green-500 shadow-md'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          #{cliente.codigo}
                        </span>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {cliente.nome}
                        </h3>
                      </div>

                      <div className="mt-2 space-y-1">
                        {cliente.cpfCnpj && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span className="font-mono">{formatarCPFCNPJ(cliente.cpfCnpj)}</span>
                          </div>
                        )}

                        {cliente.telefone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{formatarTelefone(cliente.telefone)}</span>
                          </div>
                        )}

                        {cliente.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{cliente.email}</span>
                          </div>
                        )}

                        {(cliente.endereco || cliente.cidade) && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>
                              {[cliente.endereco, cliente.cidade, cliente.uf]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RODAPÉ */}
        <div className="p-4 bg-gray-50 border-t rounded-b-lg flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {clientes.length} cliente(s) encontrado(s)
          </span>
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
          >
            Cancelar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
