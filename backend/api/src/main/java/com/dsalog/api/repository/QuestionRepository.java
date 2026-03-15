package com.dsalog.api.repository;

import com.dsalog.api.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    // Equivalent to: SELECT * FROM questions WHERE user_id = ? ORDER BY date DESC
    List<Question> findByUserIdOrderByDateDesc(Long userId);
}