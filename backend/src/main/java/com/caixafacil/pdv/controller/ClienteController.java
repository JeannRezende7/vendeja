package com.caixafacil.pdv.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.caixafacil.pdv.model.Cliente;
import com.caixafacil.pdv.repository.ClienteRepository;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteRepository clienteRepository;

    public ClienteController(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @GetMapping
    public List<Cliente> listar() {
        return clienteRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        return clienteRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/buscar/{codigo}")
    public ResponseEntity<Cliente> buscarPorCodigo(@PathVariable String codigo) {
        return clienteRepository.findByCodigo(codigo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Busca por query string (nome, código, CPF ou telefone)
    @GetMapping("/buscar")
    public List<Cliente> buscar(@RequestParam String q) {
        return clienteRepository.buscarPorTermo(q);
    }

    // NOVO: Busca parcial com LIKE
    @GetMapping("/buscar-parcial/{codigo}")
    public ResponseEntity<Cliente> buscarPorCodigoParcial(@PathVariable String codigo) {
        // Formata código com zeros à esquerda
        String codigoFormatado = String.format("%06d", Integer.parseInt(codigo));
        
        return clienteRepository.findByCodigo(codigoFormatado)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Cliente> criar(@RequestBody Cliente cliente) {
        // Formatar código com 6 dígitos
        if (cliente.getCodigo() != null && !cliente.getCodigo().isEmpty()) {
            try {
                int numero = Integer.parseInt(cliente.getCodigo());
                cliente.setCodigo(String.format("%06d", numero));
            } catch (NumberFormatException e) {
                // Mantém como está se não for número
            }
        }
        
        cliente.setDataCadastro(LocalDateTime.now());
        Cliente saved = clienteRepository.save(cliente);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> atualizar(@PathVariable Long id, @RequestBody Cliente cliente) {
        if (!clienteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Formatar código com 6 dígitos
        if (cliente.getCodigo() != null && !cliente.getCodigo().isEmpty()) {
            try {
                int numero = Integer.parseInt(cliente.getCodigo());
                cliente.setCodigo(String.format("%06d", numero));
            } catch (NumberFormatException e) {
                // Mantém como está se não for número
            }
        }
        
        cliente.setId(id);
        Cliente updated = clienteRepository.save(cliente);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!clienteRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        clienteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
