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
    
    @Column(length = 200)
    private String nomeFantasia;
    
    @Column(length = 200)
    private String razaoSocial;
    
    @Column(length = 18)
    private String cnpj;
    
    @Column(length = 20)
    private String inscricaoEstadual;
    
    @Column(length = 200)
    private String endereco;
    
    @Column(length = 100)
    private String bairro;
    
    @Column(length = 100)
    private String cidade;
    
    @Column(length = 2)
    private String uf;
    
    @Column(length = 10)
    private String cep;
    
    @Column(length = 50)
    private String telefone;
    
    @Column(length = 100)
    private String email;
    
    @Column(length = 500)
    private String mensagemCupom;
    
    @Column(length = 500)
    private String logoPath;
    
    // Configurações de Venda
    private Long clientePadraoId;
}
