package com.dsalog.api.repository;

import com.dsalog.api.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    // Equivalent to: SELECT * FROM questions WHERE user_id = ? ORDER BY date DESC
    List<Question> findByUserIdOrderByDateDesc(Long userId);

    // 1. Has this user ever solved a question? (We don't want to bleed brand new
    // users!)
    long countByUserId(Long userId);

    // 2. Did they solve a question on a specific date?
    boolean existsByUserIdAndDate(Long userId, LocalDate date);

    boolean existsByUserIdAndDate(Long userId, String date);
}