package com.caixafacil.pdv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.caixafacil.pdv.model.Cliente;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByCodigo(String codigo);
    List<Cliente> findByNomeContainingIgnoreCase(String nome);
    List<Cliente> findByAtivoTrue();
    
    // Busca por nome, código, CPF/CNPJ ou telefone
    @Query("SELECT c FROM Cliente c WHERE " +
           "LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "c.codigo LIKE CONCAT('%', :termo, '%') OR " +
           "REPLACE(REPLACE(REPLACE(c.cpfCnpj, '.', ''), '-', ''), '/', '') LIKE CONCAT('%', :termo, '%') OR " +
           "REPLACE(REPLACE(REPLACE(c.telefone, '(', ''), ')', ''), '-', '') LIKE CONCAT('%', :termo, '%')")
    List<Cliente> buscarPorTermo(@Param("termo") String termo);
}
