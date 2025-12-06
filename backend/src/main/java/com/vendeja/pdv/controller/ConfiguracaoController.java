package com.vendeja.pdv.controller;

import com.vendeja.pdv.model.Configuracao;
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
    private static final String UPLOAD_DIR = "uploads/logos/";
    
    @GetMapping
    public ResponseEntity<Configuracao> buscar() {
        return configuracaoRepository.findAll().stream()
            .findFirst()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.ok(new Configuracao()));
    }
    
    @PostMapping
    public ResponseEntity<Configuracao> salvar(@RequestBody Configuracao configuracao) {
        // Sempre usa ID 1 (configuração única)
        configuracao.setId(1L);
        return ResponseEntity.ok(configuracaoRepository.save(configuracao));
    }
    
    @PostMapping("/logo")
    public ResponseEntity<Map<String, String>> uploadLogo(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Arquivo vazio"));
            }
            
            // Criar diretório se não existir
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Salvar arquivo
            String fileName = "logo_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);
            
            // Atualizar configuração
            Configuracao config = configuracaoRepository.findAll().stream()
                .findFirst()
                .orElse(new Configuracao());
            config.setId(1L);
            config.setLogoPath(fileName);
            configuracaoRepository.save(config);
            
            Map<String, String> response = new HashMap<>();
            response.put("logoPath", fileName);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("erro", "Erro ao fazer upload: " + e.getMessage()));
        }
    }
}
