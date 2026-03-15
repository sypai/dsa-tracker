package com.dsalog.api.controller;

import com.dsalog.api.model.Question;
import com.dsalog.api.model.User;
import com.dsalog.api.repository.QuestionRepository;
import com.dsalog.api.repository.UserRepository; // Add this
import com.dsalog.api.service.EloService; // Add this
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allows your Next.js frontend to talk to this API
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final EloService eloService;

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

    // POST: Save a new question AND update user ELO
    @PostMapping
    public ResponseEntity<?> createQuestion(@RequestBody Question question) {
        // 1. Find the exact user logging this question
        Optional<User> userOpt = userRepository.findById(question.getUser().getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = userOpt.get();

        // 2. Run the math! Get the ELO gain based on difficulty
        int eloGain = eloService.calculateGain(question.getDiff());

        // 3. Update the user's total ELO and save it
        user.setCurrentElo(user.getCurrentElo() + eloGain);
        userRepository.save(user);

        // 4. Finally, save the question itself
        Question savedQuestion = questionRepository.save(question);
        return ResponseEntity.ok(savedQuestion);
    }

    // DELETE: Permanently remove a question AND reverse the ELO
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        Optional<Question> qOpt = questionRepository.findById(id);
        if (qOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Question question = qOpt.get();
        User user = question.getUser();

        // 1. Calculate the points they originally gained from this
        int eloLoss = eloService.calculateGain(question.getDiff());

        // Just subtract the points. The absolute floor is 0.
        int newElo = Math.max(0, user.getCurrentElo() - eloLoss);
        user.setCurrentElo(newElo);

        userRepository.save(user);

        // 3. Vaporize the question
        questionRepository.deleteById(id);

        return ResponseEntity.ok().build();
    }
}