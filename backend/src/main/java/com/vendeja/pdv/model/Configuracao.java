package com.vendeja.pdv.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "configuracao")
@Data
public class Configuracao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String razaoSocial;
    private String nomeFantasia;
    private String cnpj;
    private String inscricaoEstadual;
    private String endereco;
    private String bairro;
    private String cidade;
    private String uf;
    private String cep;
    private String telefone;
    private String email;
    private String logoPath;
    private String mensagemCupom;
    private Boolean controlarCaixa = false;
    
    @ManyToOne
    @JoinColumn(name = "cliente_padrao_id")
    private Cliente clientePadrao;
    
    // Tamanho de impressão: 80mm, 58mm, A4
    @Column(name = "tamanho_impressao")
    private String tamanhoImpressao = "80mm";
}
