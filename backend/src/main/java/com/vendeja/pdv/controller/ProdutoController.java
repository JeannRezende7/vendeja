package com.vendeja.pdv.controller;

import com.vendeja.pdv.model.Produto;
import com.vendeja.pdv.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {
    
    @Autowired
    private ProdutoRepository produtoRepository;

    @GetMapping
    public List<Produto> listar() {
        return produtoRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Produto> buscarPorId(@PathVariable Long id) {
        return produtoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Produto criar(@RequestBody Produto produto) {
        return produtoRepository.save(produto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizar(@PathVariable Long id, @RequestBody Produto produto) {
        return produtoRepository.findById(id)
                .map(p -> {
                    p.setCodigo(produto.getCodigo());
                    p.setDescricao(produto.getDescricao());
                    p.setUnidade(produto.getUnidade());
                    p.setCategoria(produto.getCategoria());
                    p.setPrecoVenda(produto.getPrecoVenda());
                    p.setPrecoCusto(produto.getPrecoCusto());
                    p.setEstoque(produto.getEstoque());
                    p.setEstoqueMinimo(produto.getEstoqueMinimo());
                    p.setControlarEstoque(produto.getControlarEstoque());
                    p.setAtivo(produto.getAtivo());
                    p.setObservacoes(produto.getObservacoes());
                    // Mantém fotoPath se não for enviada nova foto
                    return ResponseEntity.ok(produtoRepository.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        return produtoRepository.findById(id)
                .map(p -> {
                    produtoRepository.delete(p);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ============================================================
    // UPLOAD DE FOTO DO PRODUTO
    // ============================================================
    @PostMapping("/{id}/foto")
    public ResponseEntity<Map<String, String>> uploadFoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            // Buscar produto
            Optional<Produto> produtoOpt = produtoRepository.findById(id);
            if (produtoOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Produto produto = produtoOpt.get();

            // Criar diretório se não existir
            String uploadDir = "uploads/produtos/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Gerar nome único para o arquivo
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : "";
            String filename = "produto_" + id + "_" + System.currentTimeMillis() + extension;

            // Deletar foto antiga se existir
            if (produto.getFotoPath() != null && !produto.getFotoPath().isEmpty()) {
                try {
                    Path oldFile = uploadPath.resolve(produto.getFotoPath());
                    Files.deleteIfExists(oldFile);
                } catch (IOException e) {
                    // Ignorar erro ao deletar arquivo antigo
                }
            }

            // Salvar arquivo
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Atualizar produto
            produto.setFotoPath(filename);
            produtoRepository.save(produto);

            // Retornar caminho
            Map<String, String> response = new HashMap<>();
            response.put("fotoPath", filename);
            response.put("message", "Foto enviada com sucesso");

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erro ao salvar foto: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    // Deletar foto do produto
    @DeleteMapping("/{id}/foto")
    public ResponseEntity<?> deletarFoto(@PathVariable Long id) {
        try {
            Optional<Produto> produtoOpt = produtoRepository.findById(id);
            if (produtoOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Produto produto = produtoOpt.get();

            if (produto.getFotoPath() != null && !produto.getFotoPath().isEmpty()) {
                // Deletar arquivo físico
                String uploadDir = "uploads/produtos/";
                Path filePath = Paths.get(uploadDir).resolve(produto.getFotoPath());
                Files.deleteIfExists(filePath);

                // Limpar campo no banco
                produto.setFotoPath(null);
                produtoRepository.save(produto);
            }

            return ResponseEntity.ok().build();

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Erro ao deletar foto");
        }
    }
}
