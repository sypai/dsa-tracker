package com.dsalog.api.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data // Lombok magic: Generates all getters, setters, and constructors automatically
@Entity // Tells Spring Boot: "Make a database table out of this"
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String password;

    private Integer currentElo = 1200;

    @Column(name = "has_started_grinding")
    private boolean hasStartedGrinding = false;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}