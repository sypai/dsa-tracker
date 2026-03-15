package com.dsalog.api.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // Inside your User class, add this property:
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_custom_topics", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "topic")
    private List<String> customTopics = new ArrayList<>();

    // Add the getter and setter:
    public List<String> getCustomTopics() {
        return customTopics;
    }

    public void setCustomTopics(List<String> customTopics) {
        this.customTopics = customTopics;
    }
}
