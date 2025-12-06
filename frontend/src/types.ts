// src/types.ts
export type StatusNfe =
  | 'NAO_EMITIDA'
  | 'PENDENTE'
  | 'AUTORIZADA'
  | 'CANCELADA'
  | 'DENEGADA'
  | 'INUTILIZADA';

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
  precoVenda: number;
  precoCusto: number;
  estoque: number;
  estoqueMinimo: number;
  controlarEstoque: boolean;
  ativo: boolean;
  ncm?: string;
  cest?: string;
  cfopVenda?: string;
  origem?: string;
  cst?: string;
  csosn?: string;
  aliquotaICMS?: number;
  aliquotaPIS?: number;
  aliquotaCOFINS?: number;
  gtin?: string;
  descricaoNFe?: string;
}

export interface Cliente {
  id?: number;
  codigo?: string;
  nome: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  tipoPessoa?: 'F' | 'J';
  inscricaoEstadual?: string;
  indicadorIE?: '1' | '2' | '9';
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
}

export interface Usuario {
  id?: number;
  login: string;
  senha?: string;
  nome: string;
  admin: boolean;
  ativo: boolean;
}

export interface FormaPagamento {
  id: number;
  descricao: string;
  tipoPagamento: string;
  permiteParcelamento: boolean;
  ativo: boolean;
  integraTef?: boolean;
  geraFinanceiro?: boolean;
}

export interface VendaItem {
  id?: number;
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  descontoPercentual?: number;
  descontoValor?: number;
  total: number;
  ncm?: string;
  cfop?: string;
  cst?: string;
  csosn?: string;
  aliquotaICMS?: number;
  aliquotaPIS?: number;
  aliquotaCOFINS?: number;
}

export interface Venda {
  id?: number;
  numeroDocumento?: number;
  dataHora?: string;
  cliente?: Cliente | null;
  usuario: Usuario;
  formaPagamento?: FormaPagamento | null;
  subtotal: number;
  descontoPercentual?: number;
  descontoValor?: number;
  acrescimoPercentual?: number;
  acrescimoValor?: number;
  frete?: number;
  total: number;
  observacoes?: string;
  itens?: VendaItem[];
  statusNfe?: StatusNfe;
  chaveNfe?: string;
  numeroNfe?: number;
  serieNfe?: number;
  protocoloNfe?: string;
  dataAutorizacaoNfe?: string;
}
