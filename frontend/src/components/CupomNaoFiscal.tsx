import React from 'react';

interface CupomProps {
  venda: any;
  empresa: any;
  onClose: () => void;
}

export default function CupomNaoFiscal({ venda, empresa, onClose }: CupomProps) {
  
  const imprimir = () => {
    window.print();
  };

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
            width: 80mm;
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
          
          <div className="flex gap-2">
            <button
              onClick={imprimir}
              className="flex-1 bg-primary text-white px-6 py-3 rounded hover:bg-green-600 font-bold"
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white px-6 py-3 rounded hover:bg-gray-600 font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Cupom para impressão */}
      <div id="cupom-print" className="hidden print:block">
        <div style={{ 
          width: '80mm', 
          fontFamily: 'monospace', 
          fontSize: '10px', 
          padding: '5mm',
          backgroundColor: '#FFFFCC'
        }}>
          
          {/* Logo */}
          {empresa.logoPath && (
            <div style={{ textAlign: 'center', marginBottom: '5mm' }}>
              <img 
                src={`http://localhost:8080/uploads/logos/${empresa.logoPath}`} 
                alt="Logo" 
                style={{ maxWidth: '60mm', maxHeight: '20mm', margin: '0 auto' }}
              />
            </div>
          )}

          {/* Cabeçalho Empresa */}
          <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {empresa.nomeFantasia?.toUpperCase() || 'NOME DA EMPRESA'}
            </div>
            <div style={{ fontSize: '9px' }}>
              {empresa.razaoSocial || 'RAZÃO SOCIAL'}
            </div>
            <div style={{ fontSize: '9px' }}>
              {empresa.endereco}, {empresa.bairro}
            </div>
            <div style={{ fontSize: '9px' }}>
              {empresa.cidade} - {empresa.uf} - {empresa.cep}
            </div>
            <div style={{ fontSize: '9px' }}>
              {empresa.telefone}
            </div>
            <div style={{ fontSize: '8px', marginTop: '2mm' }}>
              CNPJ: {empresa.cnpj || '00.000.000/0000-00'}
              {empresa.inscricaoEstadual && ` IE: ${empresa.inscricaoEstadual}`}
            </div>
          </div>

          {/* Cliente */}
          <div style={{ fontSize: '9px', marginTop: '3mm', marginBottom: '2mm' }}>
            CLIENTE: {venda.cliente?.nome || 'CONSUMIDOR FINAL'}
          </div>

          {/* Data e Documento */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '9px',
            marginBottom: '3mm',
            borderTop: '1px dashed #000',
            borderBottom: '1px dashed #000',
            paddingTop: '2mm',
            paddingBottom: '2mm'
          }}>
            <div>{new Date(venda.dataHora).toLocaleString('pt-BR')}</div>
            <div style={{ fontWeight: 'bold' }}>Nº {String(venda.numeroDocumento).padStart(6, '0')}</div>
          </div>

          {/* Produtos */}
          <table style={{ width: '100%', fontSize: '8px', marginBottom: '3mm' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', paddingBottom: '1mm' }}>CÓDIGO</th>
                <th style={{ textAlign: 'left', paddingBottom: '1mm' }}>DESCRIÇÃO</th>
                <th style={{ textAlign: 'right', paddingBottom: '1mm' }}>VALOR</th>
              </tr>
            </thead>
            <tbody>
              {venda.itens?.map((item: any, index: number) => (
                <React.Fragment key={index}>
                  <tr>
                    <td style={{ paddingTop: '1mm' }}>{item.produto.codigo}</td>
                    <td>{item.produto.descricao.substring(0, 25)}</td>
                    <td style={{ textAlign: 'right' }}>{item.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ fontSize: '7px', paddingLeft: '5mm' }}>
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
            fontSize: '10px',
            marginBottom: '3mm'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '12px',
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
            fontSize: '9px',
            marginBottom: '3mm',
            borderTop: '1px dashed #000',
            paddingTop: '2mm'
          }}>
            <div>FORMA DE PGTO.: {venda.pagamentos?.[0]?.formaPagamento?.descricao || 'À VISTA'}</div>
            <table style={{ width: '100%', marginTop: '1mm', fontSize: '8px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>DATA PGTO</th>
                  <th style={{ textAlign: 'right' }}>R$ VALOR</th>
                  <th style={{ textAlign: 'right' }}>TIPO PGTO</th>
                </tr>
              </thead>
              <tbody>
                {venda.pagamentos?.map((pag: any, index: number) => (
                  <tr key={index}>
                    <td>{new Date(venda.dataHora).toLocaleDateString('pt-BR')}</td>
                    <td style={{ textAlign: 'right' }}>{pag.valor.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{pag.formaPagamento.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vendedor */}
          <div style={{ fontSize: '8px', marginBottom: '3mm' }}>
            VENDEDOR(A): {venda.usuario?.nome?.toUpperCase() || 'VENDEDOR 1'}
          </div>

          {/* Números de Série */}
          <div style={{ fontSize: '7px', marginBottom: '3mm' }}>
            Números de Série:<br/>
            {`6Y080L00${String(venda.numeroDocumento).padStart(5, '0')}, 508XHVDBDB1808`}
          </div>

          {/* Mensagem Rodapé */}
          <div style={{ 
            fontSize: '8px', 
            textAlign: 'center',
            marginBottom: '3mm',
            borderTop: '1px dashed #000',
            paddingTop: '2mm'
          }}>
            Recebi a(s) mercadoria(s) acima descrita(s), concordando<br/>
            plenamente com os prazos e condições de garantia.
          </div>

          {/* Linha de Assinatura */}
          <div style={{ 
            borderTop: '1px dashed #000',
            marginTop: '5mm',
            paddingTop: '2mm',
            textAlign: 'center',
            fontSize: '8px'
          }}>
            ASSINATURA DO CLIENTE
          </div>

          {/* Mensagem Final */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: '10px',
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
