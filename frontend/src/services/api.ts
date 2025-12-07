import axios from 'axios';
import { Usuario, Cliente, Produto, Venda, FormaPagamento, Categoria } from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const authService = {
  login: (login: string, senha: string) =>
    api.post<Usuario>('/auth/login', { login, senha }),
};

export const clienteService = {
  listar: () => api.get<Cliente[]>('/clientes'),
  buscarPorId: (id: number) => api.get<Cliente>(`/clientes/${id}`),
  buscarPorCodigo: (codigo: string) => api.get<Cliente>(`/clientes/codigo/${codigo}`),
  buscar: (q: string) => api.get<Cliente[]>(`/clientes/buscar?q=${q}`),
  criar: (cliente: Cliente) => api.post<Cliente>('/clientes', cliente),
  atualizar: (id: number, cliente: Cliente) => api.put<Cliente>(`/clientes/${id}`, cliente),
  deletar: (id: number) => api.delete(`/clientes/${id}`),
};

export const produtoService = {
  listar: () => api.get<Produto[]>('/produtos'),
  buscarPorId: (id: number) => api.get<Produto>(`/produtos/${id}`),
  buscarPorCodigo: (codigo: string) => api.get<Produto>(`/produtos/codigo/${codigo}`),
  buscar: (q: string) => api.get<Produto[]>(`/produtos/buscar?q=${q}`),
  criar: (produto: Produto) => api.post<Produto>('/produtos', produto),
  atualizar: (id: number, produto: Produto) => api.put<Produto>(`/produtos/${id}`, produto),
  deletar: (id: number) => api.delete(`/produtos/${id}`),

  // --- Upload & delete de foto (agora 100% integrado) ---
  uploadFoto: (id: number, formData: FormData) =>
    api.post(`/produtos/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deletarFoto: (id: number) =>
    api.delete(`/produtos/${id}/foto`),
};

export const vendaService = {
  listar: () => api.get<Venda[]>('/vendas'),
  buscarPorId: (id: number) => api.get<Venda>(`/vendas/${id}`),
  criar: (vendaDTO: any) => api.post<Venda>('/vendas', vendaDTO),
};

export const cadastrosService = {
  listarCategorias: () => api.get<Categoria[]>('/categorias'),
  criarCategoria: (categoria: Categoria) => api.post<Categoria>('/categorias', categoria),

  listarFormasPagamento: () => api.get<FormaPagamento[]>('/formas-pagamento'),
  criarFormaPagamento: (forma: FormaPagamento) => api.post<FormaPagamento>('/formas-pagamento', forma),

  listarUsuarios: () => api.get<Usuario[]>('/usuarios'),
  criarUsuario: (usuario: Usuario) => api.post<Usuario>('/usuarios', usuario),
  atualizarUsuario: (id: number, usuario: Usuario) => api.put<Usuario>(`/usuarios/${id}`, usuario),
};
