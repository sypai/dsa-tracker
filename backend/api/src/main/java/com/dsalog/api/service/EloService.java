package com.dsalog.api.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dsalog.api.model.User;
import com.dsalog.api.repository.QuestionRepository;
import com.dsalog.api.repository.UserRepository;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

@Service
public class EloService {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    public EloService(UserRepository userRepository, QuestionRepository questionRepository) {
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional
    public User reconcileDecay(User user) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate yesterday = today.minusDays(1);
        LocalDate lastDecay = user.getLastDecayDate();

        // Baseline for first-time execution
        if (lastDecay == null) {
            user.setLastDecayDate(today); // Start the clock today. No penalties yet.
            return userRepository.save(user);
        }

        // ONLY evaluate days that have fully finished
        long daysToEvaluate = ChronoUnit.DAYS.between(lastDecay, yesterday);

        if (daysToEvaluate > 0) {
            for (int i = 1; i <= daysToEvaluate; i++) {
                LocalDate dateToCheck = lastDecay.plusDays(i);

                boolean solvedThatDay = questionRepository.existsByUserIdAndDate(user.getId(), dateToCheck);

                if (!solvedThatDay) {
                    int currentElo = user.getCurrentElo() != null ? user.getCurrentElo() : 1200;
                    user.setCurrentElo(Math.max(0, currentElo - 2)); // The Bleed
                }
            }
            // Move the cursor to the last fully completed day
            user.setLastDecayDate(yesterday);
            return userRepository.save(user);
        }

        return user;
    }

    // Add this right below your reconcileDecay method inside EloService.java

    public int calculateGain(String difficulty) {
        if (difficulty == null) {
            return 3; // Default fallback
        }

        // Return points based on the difficulty of the question
        switch (difficulty.toLowerCase()) {
            case "easy":
                return 5;
            case "medium":
                return 15;
            case "hard":
                return 25;
            default:
                return 0;
        }
    }
}