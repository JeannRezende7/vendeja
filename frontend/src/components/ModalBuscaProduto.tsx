import { useState, useEffect, useRef } from 'react';
import { Produto } from '../types';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

interface ModalBuscaProdutoProps {
  onSelecionar: (produto: Produto) => void;
  onCancelar: () => void;
}

export default function ModalBuscaProduto({ onSelecionar, onCancelar }: ModalBuscaProdutoProps) {
  const [termoBusca, setTermoBusca] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<number>(-1);
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (termoBusca.length >= 2) {
      buscarProdutos();
    } else {
      setProdutos([]);
    }
  }, [termoBusca]);

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (produtos.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setProdutoSelecionado((prev) =>
          prev < produtos.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setProdutoSelecionado((prev) =>
          prev > 0 ? prev - 1 : produtos.length - 1
        );
      } else if (e.key === 'Enter' && produtoSelecionado >= 0) {
        e.preventDefault();
        onSelecionar(produtos[produtoSelecionado]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancelar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [produtos, produtoSelecionado, onSelecionar, onCancelar]);

  const buscarProdutos = async () => {
    try {
      setCarregando(true);
      const res = await axios.get(`${getApiBaseUrl()}/produtos/buscar`, {
        params: { q: termoBusca }
      });
      setProdutos(res.data);
      setProdutoSelecionado(res.data.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setProdutos([]);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* CABEÇALHO */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-xl font-bold">Buscar Produto (F2)</h2>
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
            placeholder="Digite código, nome ou descrição do produto..."
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <p className="text-sm text-gray-500 mt-2">
            Use ↑ ↓ para navegar • Enter para selecionar • Esc para cancelar
          </p>
        </div>

        {/* LISTA DE PRODUTOS */}
        <div className="flex-1 overflow-y-auto p-4">
          {carregando && (
            <div className="text-center py-8 text-gray-500">
              Buscando produtos...
            </div>
          )}

          {!carregando && termoBusca.length < 2 && (
            <div className="text-center py-8 text-gray-500">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}

          {!carregando && termoBusca.length >= 2 && produtos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum produto encontrado
            </div>
          )}

          {produtos.length > 0 && (
            <div className="space-y-2">
              {produtos.map((produto, index) => (
                <div
                  key={produto.id}
                  onClick={() => onSelecionar(produto)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    index === produtoSelecionado
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {produto.codigo}
                        </span>
                        <h3 className="font-semibold text-gray-900">
                          {produto.descricao}
                        </h3>
                      </div>
                      {produto.observacoes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {produto.observacoes}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          Estoque: <span className="font-semibold">{produto.estoque}</span>
                        </span>
                        {produto.categoria && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {produto.categoria.descricao}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        R$ {produto.precoVenda.toFixed(2)}
                      </div>
                      {produto.precoCusto > 0 && (
                        <div className="text-xs text-gray-500">
                          Custo: R$ {produto.precoCusto.toFixed(2)}
                        </div>
                      )}
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
            {produtos.length} produto(s) encontrado(s)
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
