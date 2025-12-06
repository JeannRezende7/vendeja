package com.vendeja.pdv.config;

import com.vendeja.pdv.model.*;
import com.vendeja.pdv.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final UsuarioRepository usuarioRepository;
    private final FormaPagamentoRepository formaPagamentoRepository;
    private final CategoriaRepository categoriaRepository;
    private final ConfiguracaoRepository configuracaoRepository;
    
    @Override
    public void run(String... args) {
        // Criar usuário admin padrão
        if (usuarioRepository.findByLogin("admin").isEmpty()) {
            Usuario admin = new Usuario();
            admin.setLogin("admin");
            admin.setSenha("admin");
            admin.setNome("Administrador");
            admin.setAdmin(true);
            usuarioRepository.save(admin);
        }
        
        // Criar formas de pagamento padrão
        if (formaPagamentoRepository.count() == 0) {
            FormaPagamento dinheiro = new FormaPagamento();
            dinheiro.setDescricao("Dinheiro");
            dinheiro.setTipoPagamento("01");
            formaPagamentoRepository.save(dinheiro);
            
            FormaPagamento debito = new FormaPagamento();
            debito.setDescricao("Cartão Débito");
            debito.setTipoPagamento("04");
            formaPagamentoRepository.save(debito);
            
            FormaPagamento credito = new FormaPagamento();
            credito.setDescricao("Cartão Crédito");
            credito.setTipoPagamento("03");
            credito.setPermiteParcelamento(true);
            formaPagamentoRepository.save(credito);
            
            FormaPagamento pix = new FormaPagamento();
            pix.setDescricao("PIX");
            pix.setTipoPagamento("17");
            formaPagamentoRepository.save(pix);
        }
        
        // Criar categorias padrão
        if (categoriaRepository.count() == 0) {
            Categoria geral = new Categoria();
            geral.setDescricao("Geral");
            categoriaRepository.save(geral);
        }
        
        // Criar configuração padrão
        if (configuracaoRepository.count() == 0) {
            Configuracao config = new Configuracao();
            config.setNomeFantasia("MINHA EMPRESA");
            config.setRazaoSocial("MINHA EMPRESA LTDA");
            config.setCnpj("00.000.000/0000-00");
            config.setInscricaoEstadual("00.000.000");
            config.setEndereco("Rua Principal, 123");
            config.setBairro("Centro");
            config.setCidade("Cidade");
            config.setUf("RJ");
            config.setCep("00000-000");
            config.setTelefone("(00) 0000-0000");
            config.setEmail("contato@empresa.com.br");
            config.setMensagemCupom("* OBRIGADO E VOLTE SEMPRE *");
            configuracaoRepository.save(config);
        }
    }
}
