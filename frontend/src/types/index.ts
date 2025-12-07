export interface Usuario {
  id?: number;
  login: string;
  senha: string;
  nome: string;
  admin: boolean;
  ativo: boolean;
  dataCadastro?: string;
}

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

export interface Categoria {
  id?: number;
  descricao: string;
  ativo: boolean;
}

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
  dataCadastro?: string;
  codigosAlternativos?: ProdutoCodigo[];
}

export interface ProdutoCodigo {
  id?: number;
  codigo: string;
  descricao?: string;
}

export interface FormaPagamento {
  id?: number;
  descricao: string;
  tipoPagamento: string;
  permiteParcelamento: boolean;
  ativo: boolean;
}

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
  troco: number;
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
  formaPagamento?: FormaPagamento; 
  pagamentos?: VendaPagamento[];
  observacoes?: string;
  cancelada: boolean;
  itens: VendaItem[];
}
