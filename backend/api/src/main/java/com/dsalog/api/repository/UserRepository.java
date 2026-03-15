package com.dsalog.api.repository;

import com.dsalog.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Boot magically writes the SQL for this just by reading the method
    // name!
    // Equivalent to: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);
}