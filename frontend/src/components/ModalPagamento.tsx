import { useState, useEffect } from 'react';
import { FormaPagamento } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface PagamentoItem {
  formaPagamento: FormaPagamento;
  valorDigitado: number;
  valorPago: number;
  troco: number;
}

interface ModalPagamentoProps {
  valorTotal: number;
  formasPagamento: FormaPagamento[];
  onConfirmar: (pagamentos: PagamentoItem[], valorPago: number, troco: number) => void;
  onCancelar: () => void;
}

export default function ModalPagamento({ valorTotal, formasPagamento, onConfirmar, onCancelar }: ModalPagamentoProps) {
  const { showWarning, showError } = useNotification();
  const [pagamentos, setPagamentos] = useState<PagamentoItem[]>([]);
  const [formaSelecionada, setFormaSelecionada] = useState<number>(formasPagamento[0]?.id || 0);
  const [valorPagamento, setValorPagamento] = useState('');

  const calcularValorPago = () => {
    return pagamentos.reduce((acc, p) => acc + p.valorPago, 0);
  };

  const calcularSaldo = () => {
    return valorTotal - calcularValorPago();
  };

  const calcularTrocoTotal = () => {
    return pagamentos.reduce((acc, p) => acc + p.troco, 0);
  };

  const adicionarPagamento = () => {
    const valor = parseFloat(valorPagamento);
    if (!valor || valor <= 0) {
      showWarning('Informe um valor válido');
      return;
    }

    const saldo = calcularSaldo();
    const forma = formasPagamento.find(f => f.id === formaSelecionada);
    if (!forma) return;

    // Validação: Cartão não pode ser maior que o saldo
    if (['03', '04'].includes(forma.tipoPagamento) && valor > saldo) {
      showError('Valor do cartão não pode ser maior que o saldo da venda');
      return;
    }

    let troco = 0;
    let valorEfetivo = valor;

    // Se for dinheiro e valor maior que saldo, calcular troco
    if (forma.tipoPagamento === '01' && valor > saldo) {
      troco = valor - saldo;
      valorEfetivo = saldo;
    }

    const novoPagamento: PagamentoItem = {
      formaPagamento: forma,
      valorDigitado: valor,
      valorPago: valorEfetivo,
      troco: troco,
    };

    setPagamentos([...pagamentos, novoPagamento]);
    setValorPagamento('');
  };

  const removerPagamento = (index: number) => {
    setPagamentos(pagamentos.filter((_, i) => i !== index));
  };

  const confirmar = () => {
    const saldo = calcularSaldo();
    if (saldo > 0.01) {
      showWarning(`Ainda falta pagar R$ ${saldo.toFixed(2)}`);
      return;
    }

    const valorPago = calcularValorPago();
    const troco = calcularTrocoTotal();
    onConfirmar(pagamentos, valorPago, troco);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        confirmar();
      } else if (e.key === 'Escape') {
        onCancelar();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        adicionarPagamento();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pagamentos, valorPagamento, formaSelecionada]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[90vh] overflow-hidden">
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">PAGAMENTO DA VENDA</h2>
          <button onClick={onCancelar} className="text-white hover:text-gray-300 text-2xl">✕</button>
        </div>

        <div className="p-6">
          {/* Totalizadores */}
          <div className="bg-gray-100 p-4 rounded mb-4 space-y-2">
            <div className="flex justify-between text-lg">
              <span className="font-bold">Valor Total:</span>
              <span className="text-primary font-bold">R$ {valorTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Valor Pago:</span>
              <span className="text-green-600 font-semibold">R$ {calcularValorPago().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl">
              <span className="font-bold">Saldo:</span>
              <span className={`font-bold ${calcularSaldo() < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {calcularSaldo().toFixed(2)}
              </span>
            </div>
            {calcularTrocoTotal() > 0 && (
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-bold">Troco:</span>
                <span className="text-blue-600 font-bold">R$ {calcularTrocoTotal().toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Adicionar Pagamento */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-1">
              <label className="block text-sm font-bold mb-1">Forma de Pagamento:</label>
              <select
                value={formaSelecionada}
                onChange={(e) => setFormaSelecionada(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {formasPagamento.map(fp => (
                  <option key={fp.id} value={fp.id}>
                    {fp.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-bold mb-1">Valor:</label>
              <input
                type="number"
                value={valorPagamento}
                onChange={(e) => setValorPagamento(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0,00"
                step="0.01"
                min="0"
                autoFocus
              />
            </div>
            <div className="col-span-1 flex items-end">
              <button
                onClick={adicionarPagamento}
                className="w-full bg-primary text-white py-2 rounded hover:bg-green-600 font-bold"
              >
                Adicionar (Enter)
              </button>
            </div>
          </div>

          {/* Grid de Pagamentos */}
          <div className="border rounded mb-4">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Forma de Pagamento</th>
                  <th className="p-2 text-right">Taxa %</th>
                  <th className="p-2 text-right">Valor</th>
                  <th className="p-2 text-right">Troco</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      Nenhum pagamento adicionado
                    </td>
                  </tr>
                ) : (
                  pagamentos.map((pag, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2">{pag.formaPagamento.descricao}</td>
                      <td className="p-2 text-right">0,00</td>
                      <td className="p-2 text-right font-semibold">R$ {pag.valorDigitado.toFixed(2)}</td>
                      <td className="p-2 text-right text-blue-600 font-semibold">
                        {pag.troco > 0 ? `R$ ${pag.troco.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removerPagamento(index)}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          Remover Item
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-center gap-4">
            <button
              onClick={confirmar}
              disabled={calcularSaldo() > 0.01}
              className={`px-8 py-3 rounded font-bold text-white ${
                calcularSaldo() > 0.01
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Confirmar (F10)
            </button>
            <button
              onClick={onCancelar}
              className="px-8 py-3 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
            >
              Cancelar (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
