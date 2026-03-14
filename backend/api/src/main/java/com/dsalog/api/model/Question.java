package com.dsalog.api.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String diff; // easy, medium, hard

    @Column(nullable = false)
    private String topic;

    private String source;

    // This creates a secondary table 'question_links' to safely store your array of URLs!
    @ElementCollection
    @CollectionTable(name = "question_links", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "link")
    private List<String> links;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDate date; // YYYY-MM-DD

    // The Foreign Key: Every question belongs to one User
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}