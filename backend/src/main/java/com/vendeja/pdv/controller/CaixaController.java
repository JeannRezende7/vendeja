package com.vendeja.pdv.controller;

import com.vendeja.pdv.model.Caixa;
import com.vendeja.pdv.model.FormaPagamento;
import com.vendeja.pdv.model.MovimentacaoCaixa;
import com.vendeja.pdv.model.Usuario;
import com.vendeja.pdv.repository.CaixaRepository;
import com.vendeja.pdv.repository.FormaPagamentoRepository;
import com.vendeja.pdv.repository.MovimentacaoCaixaRepository;
import com.vendeja.pdv.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/caixa")
public class CaixaController {

    @Autowired
    private CaixaRepository caixaRepository;

    @Autowired
    private MovimentacaoCaixaRepository movimentacaoCaixaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private FormaPagamentoRepository formaPagamentoRepository;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> verificarStatus() {
        Optional<Caixa> caixaOpt = caixaRepository.findCaixaAberto();
        Map<String, Object> response = new HashMap<>();
        
        if (caixaOpt.isPresent()) {
            Caixa caixa = caixaOpt.get();
            
            // Criar DTO simples sem relacionamentos circulares
            Map<String, Object> caixaDto = new HashMap<>();
            caixaDto.put("id", caixa.getId());
            caixaDto.put("dataHoraAbertura", caixa.getDataHoraAbertura());
            caixaDto.put("dataHoraFechamento", caixa.getDataHoraFechamento());
            caixaDto.put("valorAbertura", caixa.getValorAbertura());
            caixaDto.put("valorFechamento", caixa.getValorFechamento());
            caixaDto.put("valorVendas", caixa.getValorVendas());
            caixaDto.put("valorSuprimentos", caixa.getValorSuprimentos());
            caixaDto.put("valorSangrias", caixa.getValorSangrias());
            caixaDto.put("status", caixa.getStatus());
            caixaDto.put("observacoes", caixa.getObservacoes());
            caixaDto.put("observacoesFechamento", caixa.getObservacoesFechamento());
            
            // Usuario simples
            Map<String, Object> usuarioDto = new HashMap<>();
            usuarioDto.put("id", caixa.getUsuario().getId());
            usuarioDto.put("nome", caixa.getUsuario().getNome());
            caixaDto.put("usuario", usuarioDto);
            
            response.put("caixaAberto", true);
            response.put("caixa", caixaDto);
        } else {
            response.put("caixaAberto", false);
            response.put("caixa", null);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/abrir")
    public ResponseEntity<?> abrirCaixa(@RequestBody Map<String, Object> request) {
        try {
            Optional<Caixa> caixaAbertoOpt = caixaRepository.findCaixaAberto();
            if (caixaAbertoOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Já existe um caixa aberto");
            }

            Long usuarioId = Long.valueOf(request.get("usuarioId").toString());
            Double valorAbertura = Double.valueOf(request.get("valorAbertura").toString());
            String observacoes = request.get("observacoes") != null ? request.get("observacoes").toString() : "";
            Long formaPagamentoId = request.get("formaPagamentoId") != null ? 
                Long.valueOf(request.get("formaPagamentoId").toString()) : null;

            Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
            
            FormaPagamento formaPagamento = null;
            if (formaPagamentoId != null) {
                formaPagamento = formaPagamentoRepository.findById(formaPagamentoId)
                    .orElseThrow(() -> new RuntimeException("Forma de pagamento não encontrada"));
            }

            Caixa caixa = new Caixa();
            caixa.setUsuario(usuario);
            caixa.setDataHoraAbertura(LocalDateTime.now());
            caixa.setValorAbertura(valorAbertura);
            caixa.setValorFechamento(0.0);
            caixa.setValorVendas(0.0);
            caixa.setValorSuprimentos(0.0);
            caixa.setValorSangrias(0.0);
            caixa.setStatus("ABERTO");
            caixa.setObservacoes(observacoes);
            caixa = caixaRepository.save(caixa);

            MovimentacaoCaixa mov = new MovimentacaoCaixa();
            mov.setCaixa(caixa);
            mov.setTipo("ABERTURA");
            mov.setValor(valorAbertura);
            mov.setDescricao("Abertura de caixa" + (observacoes.isEmpty() ? "" : " - " + observacoes));
            mov.setDataHora(LocalDateTime.now());
            mov.setFormaPagamento(formaPagamento);
            movimentacaoCaixaRepository.save(mov);

            return ResponseEntity.ok("Caixa aberto com sucesso");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao abrir caixa: " + e.getMessage());
        }
    }

    @PostMapping("/fechar")
    public ResponseEntity<?> fecharCaixa(@RequestBody Map<String, Object> request) {
        try {
            Optional<Caixa> caixaOpt = caixaRepository.findCaixaAberto();
            if (!caixaOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Não há caixa aberto");
            }

            String observacoes = request.get("observacoes") != null ? request.get("observacoes").toString() : "";

            Caixa caixa = caixaOpt.get();
            caixa.setStatus("FECHADO");
            caixa.setDataHoraFechamento(LocalDateTime.now());
            caixa.setObservacoesFechamento(observacoes);
            
            // Valor de fechamento é calculado automaticamente
            caixa.setValorFechamento(
                caixa.getValorAbertura() + 
                caixa.getValorVendas() + 
                caixa.getValorSuprimentos() - 
                caixa.getValorSangrias()
            );
            
            caixaRepository.save(caixa);

            MovimentacaoCaixa mov = new MovimentacaoCaixa();
            mov.setCaixa(caixa);
            mov.setTipo("FECHAMENTO");
            mov.setValor(caixa.getValorFechamento());
            mov.setDescricao("Fechamento de caixa" + (observacoes.isEmpty() ? "" : " - " + observacoes));
            mov.setDataHora(LocalDateTime.now());
            movimentacaoCaixaRepository.save(mov);

            return ResponseEntity.ok("Caixa fechado com sucesso");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao fechar caixa: " + e.getMessage());
        }
    }

    @PostMapping("/suprimento")
    public ResponseEntity<?> registrarSuprimento(@RequestBody Map<String, Object> request) {
        try {
            Optional<Caixa> caixaOpt = caixaRepository.findCaixaAberto();
            if (!caixaOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Não há caixa aberto");
            }

            Double valor = Double.valueOf(request.get("valor").toString());
            String descricao = request.get("descricao").toString();
            Long formaPagamentoId = request.get("formaPagamentoId") != null ? 
                Long.valueOf(request.get("formaPagamentoId").toString()) : null;
            
            FormaPagamento formaPagamento = null;
            if (formaPagamentoId != null) {
                formaPagamento = formaPagamentoRepository.findById(formaPagamentoId)
                    .orElseThrow(() -> new RuntimeException("Forma de pagamento não encontrada"));
            }

            Caixa caixa = caixaOpt.get();
            caixa.setValorSuprimentos(caixa.getValorSuprimentos() + valor);
            caixaRepository.save(caixa);

            MovimentacaoCaixa mov = new MovimentacaoCaixa();
            mov.setCaixa(caixa);
            mov.setTipo("SUPRIMENTO");
            mov.setValor(valor);
            mov.setDescricao(descricao);
            mov.setDataHora(LocalDateTime.now());
            mov.setFormaPagamento(formaPagamento);
            movimentacaoCaixaRepository.save(mov);

            return ResponseEntity.ok("Suprimento registrado");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao registrar suprimento: " + e.getMessage());
        }
    }

    @PostMapping("/sangria")
    public ResponseEntity<?> registrarSangria(@RequestBody Map<String, Object> request) {
        try {
            Optional<Caixa> caixaOpt = caixaRepository.findCaixaAberto();
            if (!caixaOpt.isPresent()) {
                return ResponseEntity.badRequest().body("Não há caixa aberto");
            }

            Double valor = Double.valueOf(request.get("valor").toString());
            String descricao = request.get("descricao").toString();
            Long formaPagamentoId = request.get("formaPagamentoId") != null ? 
                Long.valueOf(request.get("formaPagamentoId").toString()) : null;
            
            FormaPagamento formaPagamento = null;
            if (formaPagamentoId != null) {
                formaPagamento = formaPagamentoRepository.findById(formaPagamentoId)
                    .orElseThrow(() -> new RuntimeException("Forma de pagamento não encontrada"));
            }

            Caixa caixa = caixaOpt.get();
            caixa.setValorSangrias(caixa.getValorSangrias() + valor);
            caixaRepository.save(caixa);

            MovimentacaoCaixa mov = new MovimentacaoCaixa();
            mov.setCaixa(caixa);
            mov.setTipo("SANGRIA");
            mov.setValor(valor);
            mov.setDescricao(descricao);
            mov.setDataHora(LocalDateTime.now());
            mov.setFormaPagamento(formaPagamento);
            movimentacaoCaixaRepository.save(mov);

            return ResponseEntity.ok("Sangria registrada");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao registrar sangria: " + e.getMessage());
        }
    }

    @GetMapping("/movimentacoes")
    public ResponseEntity<List<Map<String, Object>>> listarMovimentacoes() {
        Optional<Caixa> caixaOpt = caixaRepository.findCaixaAberto();
        if (!caixaOpt.isPresent()) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        
        List<MovimentacaoCaixa> movimentacoes = movimentacaoCaixaRepository
            .findByCaixaOrderByDataHoraDesc(caixaOpt.get());
        
        // Converter para DTO
        List<Map<String, Object>> movimentacoesDto = movimentacoes.stream().map(m -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", m.getId());
            dto.put("tipo", m.getTipo());
            dto.put("valor", m.getValor());
            dto.put("descricao", m.getDescricao());
            dto.put("dataHora", m.getDataHora());
            
            if (m.getFormaPagamento() != null) {
                Map<String, Object> fpDto = new HashMap<>();
                fpDto.put("id", m.getFormaPagamento().getId());
                fpDto.put("descricao", m.getFormaPagamento().getDescricao());
                dto.put("formaPagamento", fpDto);
            }
            
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(movimentacoesDto);
    }

    @GetMapping("/historico")
    public ResponseEntity<List<Map<String, Object>>> listarHistorico() {
        List<Caixa> historico = caixaRepository.findAllByOrderByDataHoraAberturaDesc();
        
        // Converter para DTO
        List<Map<String, Object>> historicoDto = historico.stream().map(c -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", c.getId());
            dto.put("dataHoraAbertura", c.getDataHoraAbertura());
            dto.put("dataHoraFechamento", c.getDataHoraFechamento());
            dto.put("valorAbertura", c.getValorAbertura());
            dto.put("valorFechamento", c.getValorFechamento());
            dto.put("valorVendas", c.getValorVendas());
            dto.put("valorSuprimentos", c.getValorSuprimentos());
            dto.put("valorSangrias", c.getValorSangrias());
            dto.put("status", c.getStatus());
            dto.put("observacoes", c.getObservacoes());
            dto.put("observacoesFechamento", c.getObservacoesFechamento());
            
            Map<String, Object> usuarioDto = new HashMap<>();
            usuarioDto.put("id", c.getUsuario().getId());
            usuarioDto.put("nome", c.getUsuario().getNome());
            dto.put("usuario", usuarioDto);
            
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(historicoDto);
    }

    @GetMapping("/{id}/movimentacoes")
    public ResponseEntity<List<Map<String, Object>>> listarMovimentacoesPorCaixa(@PathVariable Long id) {
        Optional<Caixa> caixaOpt = caixaRepository.findById(id);
        if (!caixaOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        List<MovimentacaoCaixa> movimentacoes = movimentacaoCaixaRepository
            .findByCaixaOrderByDataHoraDesc(caixaOpt.get());
        
        // Converter para DTO
        List<Map<String, Object>> movimentacoesDto = movimentacoes.stream().map(m -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", m.getId());
            dto.put("tipo", m.getTipo());
            dto.put("valor", m.getValor());
            dto.put("descricao", m.getDescricao());
            dto.put("dataHora", m.getDataHora());
            
            if (m.getFormaPagamento() != null) {
                Map<String, Object> fpDto = new HashMap<>();
                fpDto.put("id", m.getFormaPagamento().getId());
                fpDto.put("descricao", m.getFormaPagamento().getDescricao());
                dto.put("formaPagamento", fpDto);
            }
            
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(movimentacoesDto);
    }
    
    @GetMapping("/{id}/relatorio")
    public ResponseEntity<Map<String, Object>> gerarRelatorio(@PathVariable Long id) {
        try {
            Optional<Caixa> caixaOpt = caixaRepository.findById(id);
            if (!caixaOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Caixa caixa = caixaOpt.get();
            List<MovimentacaoCaixa> movimentacoes = movimentacaoCaixaRepository
                .findByCaixaOrderByDataHoraDesc(caixa);
            
            // Agrupar vendas por forma de pagamento
            Map<String, Double> vendasPorForma = movimentacoes.stream()
                .filter(m -> "VENDA".equals(m.getTipo()) && m.getFormaPagamento() != null)
                .collect(Collectors.groupingBy(
                    m -> m.getFormaPagamento().getDescricao(),
                    Collectors.summingDouble(MovimentacaoCaixa::getValor)
                ));
            
            // Agrupar suprimentos por forma de pagamento
            Map<String, Double> suprimentosPorForma = movimentacoes.stream()
                .filter(m -> "SUPRIMENTO".equals(m.getTipo()) && m.getFormaPagamento() != null)
                .collect(Collectors.groupingBy(
                    m -> m.getFormaPagamento().getDescricao(),
                    Collectors.summingDouble(MovimentacaoCaixa::getValor)
                ));
            
            // Agrupar sangrias por forma de pagamento
            Map<String, Double> sangriasPorForma = movimentacoes.stream()
                .filter(m -> "SANGRIA".equals(m.getTipo()) && m.getFormaPagamento() != null)
                .collect(Collectors.groupingBy(
                    m -> m.getFormaPagamento().getDescricao(),
                    Collectors.summingDouble(MovimentacaoCaixa::getValor)
                ));
            
            // DTO do caixa
            Map<String, Object> caixaDto = new HashMap<>();
            caixaDto.put("id", caixa.getId());
            caixaDto.put("dataHoraAbertura", caixa.getDataHoraAbertura());
            caixaDto.put("dataHoraFechamento", caixa.getDataHoraFechamento());
            caixaDto.put("valorAbertura", caixa.getValorAbertura());
            caixaDto.put("valorFechamento", caixa.getValorFechamento());
            caixaDto.put("valorVendas", caixa.getValorVendas());
            caixaDto.put("valorSuprimentos", caixa.getValorSuprimentos());
            caixaDto.put("valorSangrias", caixa.getValorSangrias());
            caixaDto.put("status", caixa.getStatus());
            caixaDto.put("observacoes", caixa.getObservacoes());
            caixaDto.put("observacoesFechamento", caixa.getObservacoesFechamento());
            
            Map<String, Object> usuarioDto = new HashMap<>();
            usuarioDto.put("id", caixa.getUsuario().getId());
            usuarioDto.put("nome", caixa.getUsuario().getNome());
            caixaDto.put("usuario", usuarioDto);
            
            // DTO das movimentações
            List<Map<String, Object>> movimentacoesDto = movimentacoes.stream().map(m -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", m.getId());
                dto.put("tipo", m.getTipo());
                dto.put("valor", m.getValor());
                dto.put("descricao", m.getDescricao());
                dto.put("dataHora", m.getDataHora());
                
                if (m.getFormaPagamento() != null) {
                    Map<String, Object> fpDto = new HashMap<>();
                    fpDto.put("id", m.getFormaPagamento().getId());
                    fpDto.put("descricao", m.getFormaPagamento().getDescricao());
                    dto.put("formaPagamento", fpDto);
                }
                
                return dto;
            }).collect(Collectors.toList());
            
            Map<String, Object> relatorio = new HashMap<>();
            relatorio.put("caixa", caixaDto);
            relatorio.put("movimentacoes", movimentacoesDto);
            relatorio.put("vendasPorForma", vendasPorForma);
            relatorio.put("suprimentosPorForma", suprimentosPorForma);
            relatorio.put("sangriasPorForma", sangriasPorForma);
            
            return ResponseEntity.ok(relatorio);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}