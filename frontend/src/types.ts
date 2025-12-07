// ======================
// USUÁRIOS
// ======================
export interface Usuario {
  id?: number;
  login: string;
  senha?: string; // opcional no retorno do backend
  nome: string;
  admin: boolean;
  ativo: boolean;
  dataCadastro?: string;
}

// ======================
// CLIENTES
// ======================
export interface Cliente {
  id?: number;
  codigo?: string;
  nome: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  ativo: boolean;
  dataCadastro?: string;
}

// ======================
// CATEGORIAS
// ======================
export interface Categoria {
  id?: number;
  descricao: string;
  ativo: boolean;
}

// ======================
// PRODUTOS
// ======================
export interface Produto {
  id?: number;
  codigo: string;
  descricao: string;
  unidade: string;
  categoria?: Categoria;
  precoVenda: number;
  precoCusto: number;
  estoque: number;
  estoqueMinimo: number;
  controlarEstoque: boolean;
  ativo: boolean;
  observacoes?: string;
  fotoPath?: string; // campo adicional do 1º arquivo
  dataCadastro?: string;
  codigosAlternativos?: ProdutoCodigo[];
}

export interface ProdutoCodigo {
  id?: number;
  codigo: string;
  descricao?: string;
}

// ======================
// FORMAS DE PAGAMENTO
// ======================
export interface FormaPagamento {
  id?: number;
  descricao: string;
  categoria?: string; // Dinheiro, PIX, Cartão — mantido do 1º arquivo
  tipoPagamento: string; // NFC-e: 01, 02, 03...
  permiteParcelamento: boolean;
  ativo: boolean;
}

// ======================
// VENDAS
// ======================
export interface VendaItem {
  id?: number;
  produto: Produto;
  sequencia?: number;
  quantidade: number;
  precoUnitario: number;
  descontoPercentual?: number;
  descontoValor?: number;
  acrescimoPercentual?: number;
  acrescimoValor?: number;
  total: number;
}

export interface VendaPagamento {
  id?: number;
  formaPagamento?: FormaPagamento;
  valor: number;
  troco?: number;
}

export interface Venda {
  id?: number;
  numeroDocumento?: number;
  cliente?: Cliente;
  usuario: Usuario;
  dataHora?: string;

  subtotal: number;
  descontoPercentual?: number;
  descontoValor?: number;
  acrescimoPercentual?: number;
  acrescimoValor?: number;
  frete?: number;

  total: number;
  valorPago?: number;
  troco?: number;

  formaPagamento?: FormaPagamento; // compatibilidade
  pagamentos?: VendaPagamento[];

  observacoes?: string;
  cancelada: boolean;

  itens: VendaItem[];
}
