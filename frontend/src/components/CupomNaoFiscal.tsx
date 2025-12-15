import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl, getApiBaseUrl } from '../utils/apiConfig';

interface CupomProps {
  venda: any;
  empresa: any;
  onClose: () => void;
}

export default function CupomNaoFiscal({ venda, empresa, onClose }: CupomProps) {
  const [tamanhoImpressao, setTamanhoImpressao] = useState<'80mm' | '58mm' | 'A4'>('80mm');

  useEffect(() => {
    // Carregar configuração de tamanho de impressão
    const carregarConfig = async () => {
      try {
        const res = await axios.get(`${getApiBaseUrl()}/configuracao`);
        if (res.data && res.data.tamanhoImpressao) {
          setTamanhoImpressao(res.data.tamanhoImpressao);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    };
    carregarConfig();
  }, []);

  // Listener para tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  const imprimir = () => {
    window.print();
    // Fechar automaticamente após imprimir
    setTimeout(() => onClose(), 100);
  };

  // Definir largura baseada no tamanho configurado
  const getWidth = () => {
    switch (tamanhoImpressao) {
      case '58mm': return '58mm';
      case 'A4': return '210mm';
      default: return '80mm';
    }
  };

  // Definir tamanho de fonte baseado no formato
  const getFontSize = () => {
    switch (tamanhoImpressao) {
      case '58mm': return '8px';
      case 'A4': return '11px';
      default: return '10px';
    }
  };

  const getPadding = () => {
    switch (tamanhoImpressao) {
      case '58mm': return '3mm';
      case 'A4': return '15mm';
      default: return '5mm';
    }
  };

  // Ajustar conteúdo para formato compacto
  const isCompact = tamanhoImpressao === '58mm';
  const isA4 = tamanhoImpressao === 'A4';

  return (
    <>
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cupom-print, #cupom-print * {
            visibility: visible;
          }
          #cupom-print {
            position: absolute;
            left: 0;
            top: 0;
            width: ${getWidth()};
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold mb-4">Cupom Pronto para Impressão</h2>
          
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Formato:</strong> {tamanhoImpressao}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={imprimir}
              className="flex-1 bg-primary text-white px-6 py-3 rounded hover:bg-green-600 font-bold"
            >
              🖨️ Imprimir ({tamanhoImpressao})
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600 font-bold"
            >
              Fechar (Esc)
            </button>
          </div>
        </div>
      </div>

      {/* Cupom para impressão */}
      <div id="cupom-print" className="hidden print:block">
        <div style={{ 
          width: getWidth(), 
          fontFamily: 'monospace', 
          fontSize: getFontSize(), 
          padding: getPadding(),
          backgroundColor: '#FFFFCC'
        }}>
          
          {/* Logo */}
          {empresa.logoPath && !isCompact && (
            <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
              <img 
                src={`${getApiUrl()}/uploads/logos/${empresa.logoPath}`} 
                alt="Logo" 
                style={{ 
                  maxWidth: isA4 ? '100mm' : '60mm', 
                  maxHeight: isA4 ? '30mm' : '20mm', 
                  margin: '0 auto' 
                }}
              />
            </div>
          )}

          {/* Cabeçalho Empresa */}
          <div style={{ textAlign: 'center', marginBottom: isCompact ? '2mm' : '3mm' }}>
            <div style={{ 
              fontSize: isCompact ? '10px' : isA4 ? '14px' : '12px', 
              fontWeight: 'bold' 
            }}>
              {empresa.nomeFantasia?.toUpperCase() || 'NOME DA EMPRESA'}
            </div>
            
            {!isCompact && (
              <>
                <div style={{ fontSize: isA4 ? '10px' : '9px' }}>
                  {empresa.razaoSocial || 'RAZÃO SOCIAL'}
                </div>
                <div style={{ fontSize: isA4 ? '10px' : '9px' }}>
                  {empresa.endereco}, {empresa.bairro}
                </div>
                <div style={{ fontSize: isA4 ? '10px' : '9px' }}>
                  {empresa.cidade} - {empresa.uf} - {empresa.cep}
                </div>
                <div style={{ fontSize: isA4 ? '10px' : '9px' }}>
                  {empresa.telefone}
                </div>
              </>
            )}
            
            <div style={{ 
              fontSize: isCompact ? '7px' : isA4 ? '9px' : '8px', 
              marginTop: '2mm' 
            }}>
              CNPJ: {empresa.cnpj || '00.000.000/0000-00'}
              {!isCompact && empresa.inscricaoEstadual && ` IE: ${empresa.inscricaoEstadual}`}
            </div>
          </div>

          {/* Cliente */}
          <div style={{ 
            fontSize: isCompact ? '8px' : isA4 ? '10px' : '9px', 
            marginTop: isCompact ? '2mm' : '3mm', 
            marginBottom: '2mm' 
          }}>
            CLIENTE: {venda.cliente?.nome || 'CONSUMIDOR FINAL'}
          </div>

          {/* Data e Documento */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: isCompact ? '8px' : isA4 ? '10px' : '9px',
            marginBottom: isCompact ? '2mm' : '3mm',
            borderTop: '1px dashed #000',
            borderBottom: '1px dashed #000',
            paddingTop: '2mm',
            paddingBottom: '2mm'
          }}>
            <div>{new Date(venda.dataHora).toLocaleString('pt-BR')}</div>
            <div style={{ fontWeight: 'bold' }}>Nº {String(venda.numeroDocumento).padStart(6, '0')}</div>
          </div>

          {/* Produtos */}
          <table style={{ 
            width: '100%', 
            fontSize: isCompact ? '7px' : isA4 ? '10px' : '8px', 
            marginBottom: '3mm' 
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', paddingBottom: '1mm' }}>
                  {isCompact ? 'CÓD' : 'CÓDIGO'}
                </th>
                <th style={{ textAlign: 'left', paddingBottom: '1mm' }}>DESCRIÇÃO</th>
                <th style={{ textAlign: 'right', paddingBottom: '1mm' }}>VALOR</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens?.map((item: any, index: number) => (
                <React.Fragment key={index}>
                  <tr>
                    <td style={{ paddingTop: '1mm' }}>
                      {isCompact ? item.produto.codigo.substring(0, 6) : item.produto.codigo}
                    </td>
                    <td>
                      {isCompact 
                        ? item.produto.descricao.substring(0, 15)
                        : isA4 
                        ? item.produto.descricao 
                        : item.produto.descricao.substring(0, 25)
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>{item.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ 
                      fontSize: isCompact ? '6px' : isA4 ? '9px' : '7px', 
                      paddingLeft: '5mm' 
                    }}>
                      {item.quantidade.toFixed(3)} x {item.precoUnitario.toFixed(2)}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Totais */}
          <div style={{ 
            borderTop: '1px dashed #000', 
            paddingTop: '2mm',
            fontSize: isCompact ? '9px' : isA4 ? '12px' : '10px',
            marginBottom: '3mm'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: isCompact ? '11px' : isA4 ? '16px' : '12px',
              marginBottom: '2mm'
            }}>
              <span>Total da Nota R$</span>
              <span>{venda.total.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Valor Recebido R$</span>
              <span>{venda.valorPago?.toFixed(2) || venda.total.toFixed(2)}</span>
            </div>
            
            {venda.troco > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Troco R$</span>
                <span>{venda.troco.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Forma de Pagamento */}
          <div style={{ 
            fontSize: isCompact ? '8px' : isA4 ? '10px' : '9px',
            marginBottom: '3mm',
            borderTop: '1px dashed #000',
            paddingTop: '2mm'
          }}>
            <div>
              FORMA DE PGTO.: {venda.pagamentos?.[0]?.formaPagamento?.descricao || 'À VISTA'}
            </div>
            
            {!isCompact && venda.pagamentos && venda.pagamentos.length > 0 && (
              <table style={{ 
                width: '100%', 
                marginTop: '1mm', 
                fontSize: isCompact ? '7px' : isA4 ? '9px' : '8px' 
              }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>DATA PGTO</th>
                    <th style={{ textAlign: 'right' }}>R$ VALOR</th>
                    <th style={{ textAlign: 'right' }}>TIPO PGTO</th>
                  </tr>
                </thead>
                <tbody>
                  {venda.pagamentos.map((pag: any, index: number) => (
                    <tr key={index}>
                      <td>{new Date(venda.dataHora).toLocaleDateString('pt-BR')}</td>
                      <td style={{ textAlign: 'right' }}>{pag.valor.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>{pag.formaPagamento.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Vendedor */}
          <div style={{ 
            fontSize: isCompact ? '7px' : isA4 ? '9px' : '8px', 
            marginBottom: '3mm' 
          }}>
            VENDEDOR(A): {venda.usuario?.nome?.toUpperCase() || 'VENDEDOR 1'}
          </div>

          {/* Números de Série (apenas se não for compacto) */}
          {!isCompact && (
            <div style={{ 
              fontSize: isA4 ? '8px' : '7px', 
              marginBottom: '3mm' 
            }}>
              Números de Série:<br/>
              {`6Y080L00${String(venda.numeroDocumento).padStart(5, '0')}, 508XHVDBDB1808`}
            </div>
          )}

          {/* Mensagem Rodapé */}
          {!isCompact && (
            <div style={{ 
              fontSize: isA4 ? '9px' : '8px', 
              textAlign: 'center',
              marginBottom: '3mm',
              borderTop: '1px dashed #000',
              paddingTop: '2mm'
            }}>
              Recebi a(s) mercadoria(s) acima descrita(s), concordando<br/>
              plenamente com os prazos e condições de garantia.
            </div>
          )}

          {/* Linha de Assinatura (apenas A4) */}
          {isA4 && (
            <div style={{ 
              borderTop: '1px dashed #000',
              marginTop: '5mm',
              paddingTop: '2mm',
              textAlign: 'center',
              fontSize: '8px'
            }}>
              ASSINATURA DO CLIENTE
            </div>
          )}

          {/* Mensagem Final */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: isCompact ? '9px' : isA4 ? '12px' : '10px',
            fontWeight: 'bold',
            marginTop: '3mm'
          }}>
            {empresa.mensagemCupom || '* OBRIGADO E VOLTE SEMPRE *'}
          </div>
        </div>
      </div>
    </>
  );
}
