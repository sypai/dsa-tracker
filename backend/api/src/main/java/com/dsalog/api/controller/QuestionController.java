package com.dsalog.api.controller;

import com.dsalog.api.model.Question;
import com.dsalog.api.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allows your Next.js frontend to talk to this API
public class QuestionController {

    private final QuestionRepository questionRepository;

    // GET: Fetch all questions
    @GetMapping
    public ResponseEntity<List<Question>> getAllQuestions() {
        // For now, we just fetch everything. Later we will filter by User!
        List<Question> questions = questionRepository.findAll();
        return ResponseEntity.ok(questions);
    }

    // GET: Fetch questions for a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Question>> getUserQuestions(@PathVariable Long userId) {
        // We use the custom Repository method we created earlier!
        List<Question> userQuestions = questionRepository.findByUserIdOrderByDateDesc(userId);
        return ResponseEntity.ok(userQuestions);
    }

    // POST: Log a new question
    @PostMapping
    public ResponseEntity<Question> logQuestion(@RequestBody Question question) {
        // Save the incoming JSON as a real row in the database
        Question savedQuestion = questionRepository.save(question);
        return ResponseEntity.ok(savedQuestion);
    }
}