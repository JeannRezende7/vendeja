import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { estoqueService } from "../services/estoqueService";
import { useNotification } from "../contexts/NotificationContext";
import { Produto } from "../types";

interface MovimentacaoEstoque {
  id: number;
  tipo: string;
  quantidade: number;
  estoqueAnterior: number;
  estoqueAtual: number;
  motivo?: string;
  observacao?: string;
  dataHora: string;
}

export default function EstoqueConsulta() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  const [codigoProduto, setCodigoProduto] = useState("");
  const [produto, setProduto] = useState<Produto | null>(null);

  const [mostrarEntrada, setMostrarEntrada] = useState(false);
  const [mostrarSaida, setMostrarSaida] = useState(false);

  const [qtdEntrada, setQtdEntrada] = useState("");
  const [obsEntrada, setObsEntrada] = useState("");

  const [qtdSaida, setQtdSaida] = useState("");
  const [motivoSaida, setMotivoSaida] = useState("");

  const [estoqueBaixo, setEstoqueBaixo] = useState<Produto[]>([]);
  const [estoqueAlerta, setEstoqueAlerta] = useState<Produto[]>([]);

  const [historico, setHistorico] = useState<MovimentacaoEstoque[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // ===========================================================
  // CARREGAR ALERTAS
  // ===========================================================
  const carregarAlertas = async () => {
    try {
      const baixo = await axios.get("http://localhost:8080/api/produtos/estoque-baixo");
      const alerta = await axios.get("http://localhost:8080/api/produtos/estoque-alerta");

      setEstoqueBaixo(baixo.data);
      setEstoqueAlerta(alerta.data);
    } catch (e) {
      console.error(e);
    }
  };

  // ===========================================================
  // CONSULTAR PRODUTO
  // ===========================================================
  const consultar = async () => {
    if (!codigoProduto.trim()) return;

    try {
      const res = await axios.get(
        `http://localhost:8080/api/produtos/buscar-parcial/${codigoProduto}`
      );

      if (!Array.isArray(res.data) || res.data.length === 0) {
        showError("Produto não encontrado");
        setProduto(null);
        return;
      }

      const p = res.data[0];
      setProduto(p);

      setMostrarEntrada(false);
      setMostrarSaida(false);

      carregarAlertas();
    } catch (e) {
      showError("Erro ao consultar estoque");
    }
  };

  // ===========================================================
  // ENTRADA
  // ===========================================================
  const aplicarEntrada = async () => {
    if (!produto) return;

    const qtd = parseFloat(qtdEntrada.replace(",", ".") || "0");
    if (qtd <= 0) return showError("Informe uma quantidade válida");

    try {
      await estoqueService.entrada(produto.id!, qtd, obsEntrada);
      showSuccess("Entrada lançada!");

      setQtdEntrada("");
      setObsEntrada("");

      await consultar();
    } catch {
      showError("Erro ao registrar entrada");
    }
  };

  // ===========================================================
  // SAÍDA → usa ajuste negativo
  // ===========================================================
  const aplicarSaida = async () => {
    if (!produto) return;

    const qtd = parseFloat(qtdSaida.replace(",", ".") || "0");
    if (qtd <= 0) return showError("Informe uma quantidade válida");

    if (!motivoSaida.trim()) return showError("Motivo obrigatório");

    try {
      await estoqueService.ajuste(produto.id!, -qtd, motivoSaida);
      showSuccess("Saída lançada!");

      setQtdSaida("");
      setMotivoSaida("");

      await consultar();
    } catch (e: any) {
      const msg = e?.response?.data || "Erro ao registrar saída";
      showError(msg);
    }
  };

  // ===========================================================
  // HISTÓRICO
  // ===========================================================
  const carregarHistorico = async () => {
    if (!produto?.id) return;

    try {
      setCarregandoHistorico(true);
      const res = await axios.get(
        "http://localhost:8080/api/estoque/historico",
        { params: { produtoId: produto.id } }
      );
      setHistorico(res.data);
      setMostrarHistorico(true);
    } catch {
      showError("Erro ao carregar histórico");
    } finally {
      setCarregandoHistorico(false);
    }
  };

  useEffect(() => {
    carregarAlertas();
  }, []);

  // ===========================================================
  // RENDER
  // ===========================================================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER PADRÃO */}
      <div className="bg-primary text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Consulta e Movimentação de Estoque</h1>

        <button
          onClick={() => navigate("/pdv")}
          className="bg-white text-primary px-4 py-2 rounded hover:bg-gray-100"
        >
          Voltar ao PDV
        </button>
      </div>

      {/* CONTEÚDO CENTRAL IGUAL AS OUTRAS PÁGINAS */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-white rounded shadow p-6">
          {/* ================= BUSCA ================= */}
          <h2 className="text-xl font-bold mb-4">Buscar Produto</h2>

          <div className="flex gap-3 mb-6">
            <input
              value={codigoProduto}
              onChange={(e) => setCodigoProduto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && consultar()}
              placeholder="Código ou descrição"
              className="px-3 py-2 border rounded w-72"
            />
            <button
              onClick={consultar}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-green-700"
            >
              🔍 Buscar
            </button>
          </div>

          {/* ================= PRODUTO ================= */}
          {produto && (
            <div className="mb-6 p-4 bg-gray-50 border rounded">
              <p className="text-lg font-bold">{produto.codigo} — {produto.descricao}</p>
              <p className="text-sm text-gray-700">
                Estoque atual:{" "}
                <span className="font-bold text-primary">{produto.estoque}</span>
                {" · "}
                Mínimo: {produto.estoqueMinimo}
              </p>
            </div>
          )}

          {/* ================= MOVIMENTAÇÕES ================= */}
          <h2 className="text-xl font-bold mb-4">Movimentações</h2>

          {produto ? (
            <div className="grid grid-cols-3 gap-6">

              {/* ENTRADA */}
              <div className="border p-4 rounded bg-gray-50">
                <h3 className="font-bold text-green-700 mb-3">➕ Lançar Entrada</h3>

                <label className="text-sm font-semibold">Quantidade</label>
                <input
                  type="number"
                  value={qtdEntrada}
                  onChange={(e) => setQtdEntrada(e.target.value)}
                  className="w-full px-3 py-2 border rounded mt-1"
                />

                <label className="text-sm font-semibold mt-3 block">Observação</label>
                <input
                  value={obsEntrada}
                  onChange={(e) => setObsEntrada(e.target.value)}
                  className="w-full px-3 py-2 border rounded mt-1"
                />

                <button
                  onClick={aplicarEntrada}
                  className="mt-4 w-full bg-green-600 text-white rounded py-2 font-bold hover:bg-green-700"
                >
                  Confirmar Entrada
                </button>
              </div>

              {/* SAÍDA */}
              <div className="border p-4 rounded bg-gray-50">
                <h3 className="font-bold text-red-700 mb-3">➖ Lançar Saída</h3>

                <label className="text-sm font-semibold">Quantidade</label>
                <input
                  type="number"
                  value={qtdSaida}
                  onChange={(e) => setQtdSaida(e.target.value)}
                  className="w-full px-3 py-2 border rounded mt-1"
                />

                <label className="text-sm font-semibold mt-3 block">Motivo</label>
                <input
                  value={motivoSaida}
                  onChange={(e) => setMotivoSaida(e.target.value)}
                  className="w-full px-3 py-2 border rounded mt-1"
                  placeholder="Ex: perda, quebra..."
                />

                <button
                  onClick={aplicarSaida}
                  className="mt-4 w-full bg-red-600 text-white rounded py-2 font-bold hover:bg-red-700"
                >
                  Confirmar Saída
                </button>
              </div>

              {/* HISTÓRICO */}
              <div className="border p-4 rounded bg-gray-50 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-blue-700 mb-2">📜 Histórico</h3>
                  <p className="text-xs text-gray-600">
                    Veja todas as movimentações desse produto.
                  </p>
                </div>

                <button
                  onClick={carregarHistorico}
                  className="mt-4 w-full bg-blue-600 text-white rounded py-2 font-bold hover:bg-blue-700"
                >
                  Ver Histórico
                </button>
              </div>

            </div>
          ) : (
            <p className="text-gray-500 mb-6">
              Busque um produto para realizar movimentações.
            </p>
          )}

          {/* ================= ALERTAS ================= */}
          <h2 className="text-xl font-bold mt-10 mb-4">Estoque — Alertas</h2>

          <div className="grid grid-cols-2 gap-6">

            {/* CRÍTICO */}
            <div className="p-4 border rounded bg-red-50">
              <h3 className="font-bold text-red-700">🔴 Estoque Crítico</h3>
              <p className="text-xs text-gray-600 mb-2">Abaixo do mínimo cadastrado</p>

              {estoqueBaixo.length === 0 && (
                <p className="text-xs text-gray-500">Nenhum produto crítico.</p>
              )}

              {estoqueBaixo.map((p) => (
                <div key={p.id} className="p-2 border rounded bg-white mb-2">
                  <span className="font-bold">{p.codigo} — {p.descricao}</span>
                  <div className="text-sm">Estoque: {p.estoque} / {p.estoqueMinimo}</div>
                </div>
              ))}
            </div>

            {/* ALERTA */}
            <div className="p-4 border rounded bg-yellow-50">
              <h3 className="font-bold text-yellow-700">🟠 Produtos em Alerta</h3>
              <p className="text-xs text-gray-600 mb-2">Próximos do mínimo</p>

              {estoqueAlerta.length === 0 && (
                <p className="text-xs text-gray-500">Nenhum produto em alerta.</p>
              )}

              {estoqueAlerta.map((p) => (
                <div key={p.id} className="p-2 border rounded bg-white mb-2">
                  <span className="font-bold">{p.codigo} — {p.descricao}</span>
                  <div className="text-sm">
                    Estoque: {p.estoque} / {Math.round(p.estoqueMinimo * 1.2)}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ================= MODAL HISTÓRICO ================= */}
      {mostrarHistorico && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between px-4 py-3 border-b">
              <h2 className="font-bold text-lg">
                Histórico — {produto?.descricao}
              </h2>
              <button
                onClick={() => setMostrarHistorico(false)}
                className="text-gray-500 hover:text-black text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              {carregandoHistorico ? (
                <p>Carregando...</p>
              ) : historico.length === 0 ? (
                <p>Nenhuma movimentação encontrada.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Tipo</th>
                      <th className="p-2 text-right">Qtd</th>
                      <th className="p-2 text-right">Antes → Depois</th>
                      <th className="p-2 text-left">Motivo/Obs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((mov) => (
                      <tr key={mov.id} className="border-b">
                        <td className="p-2">
                          {new Date(mov.dataHora).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              mov.tipo === "ENTRADA"
                                ? "bg-green-100 text-green-700"
                                : mov.tipo === "SAIDA"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {mov.tipo}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          {mov.quantidade > 0 ? "+" : "-"} {Math.abs(mov.quantidade)}
                        </td>
                        <td className="p-2 text-right">
                          {mov.estoqueAnterior} →{" "}
                          <span className="font-bold">{mov.estoqueAtual}</span>
                        </td>
                        <td className="p-2">
                          {mov.motivo || mov.observacao || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end p-3 border-t">
              <button
                onClick={() => setMostrarHistorico(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
