package com.vendeja.pdv.controller;

import com.vendeja.pdv.model.Cliente;
import com.vendeja.pdv.model.Configuracao;
import com.vendeja.pdv.repository.ClienteRepository;
import com.vendeja.pdv.repository.ConfiguracaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/configuracao")
@RequiredArgsConstructor
public class ConfiguracaoController {

    private final ConfiguracaoRepository configuracaoRepository;
    private final ClienteRepository clienteRepository;

    private static final String UPLOAD_DIR = "uploads/logos/";

    @GetMapping
    public ResponseEntity<?> buscar() {
        Configuracao config = configuracaoRepository.findAll().stream()
                .findFirst()
                .orElse(new Configuracao());

        // Monta resposta incluindo clientePadraoId
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", config.getId());
        resp.put("nomeFantasia", config.getNomeFantasia());
        resp.put("razaoSocial", config.getRazaoSocial());
        resp.put("cnpj", config.getCnpj());
        resp.put("inscricaoEstadual", config.getInscricaoEstadual());
        resp.put("endereco", config.getEndereco());
        resp.put("bairro", config.getBairro());
        resp.put("cidade", config.getCidade());
        resp.put("uf", config.getUf());
        resp.put("cep", config.getCep());
        resp.put("telefone", config.getTelefone());
        resp.put("email", config.getEmail());
        resp.put("logoPath", config.getLogoPath());
        resp.put("mensagemCupom", config.getMensagemCupom());
        resp.put("controlarCaixa", config.getControlarCaixa());
        resp.put("tamanhoImpressao", config.getTamanhoImpressao());

        if (config.getClientePadrao() != null) {
            resp.put("clientePadraoId", config.getClientePadrao().getId());
            resp.put("clientePadrao", config.getClientePadrao());
        }

        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<?> salvar(@RequestBody Map<String, Object> dados) {

        Configuracao config = configuracaoRepository.findAll().stream()
                .findFirst()
                .orElse(new Configuracao());

        config.setId(1L);
        config.setNomeFantasia((String) dados.get("nomeFantasia"));
        config.setRazaoSocial((String) dados.get("razaoSocial"));
        config.setCnpj((String) dados.get("cnpj"));
        config.setInscricaoEstadual((String) dados.get("inscricaoEstadual"));
        config.setEndereco((String) dados.get("endereco"));
        config.setBairro((String) dados.get("bairro"));
        config.setCidade((String) dados.get("cidade"));
        config.setUf((String) dados.get("uf"));
        config.setCep((String) dados.get("cep"));
        config.setTelefone((String) dados.get("telefone"));
        config.setEmail((String) dados.get("email"));
        config.setMensagemCupom((String) dados.get("mensagemCupom"));
        config.setControlarCaixa((Boolean) dados.getOrDefault("controlarCaixa", false));
        config.setTamanhoImpressao((String) dados.getOrDefault("tamanhoImpressao", "80mm"));

        // 🔥 CLIENTE PADRÃO
        Object clienteIdObj = dados.get("clientePadraoId");
        if (clienteIdObj != null) {
            Long clienteId = Long.valueOf(clienteIdObj.toString());
            Cliente cliente = clienteRepository.findById(clienteId).orElse(null);
            config.setClientePadrao(cliente);
        } else {
            config.setClientePadrao(null);
        }

        configuracaoRepository.save(config);
        return ResponseEntity.ok(config);
    }

    @PostMapping("/logo")
    public ResponseEntity<Map<String, String>> uploadLogo(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Arquivo vazio"));
            }

            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = "logo_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            Configuracao config = configuracaoRepository.findAll().stream()
                    .findFirst()
                    .orElse(new Configuracao());

            config.setId(1L);
            config.setLogoPath(fileName);
            configuracaoRepository.save(config);

            return ResponseEntity.ok(Map.of("logoPath", fileName));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("erro", "Erro ao fazer upload: " + e.getMessage()));
        }
    }
}
