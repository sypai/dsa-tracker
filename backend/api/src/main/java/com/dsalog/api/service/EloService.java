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
        LocalDate lastDecay = user.getLastDecayDate();

        // Baseline for first-time execution
        if (lastDecay == null) {
            user.setLastDecayDate(today);
            return userRepository.save(user);
        }

        long daysMissed = ChronoUnit.DAYS.between(lastDecay, today);

        if (daysMissed > 0) {
            for (int i = 1; i <= daysMissed; i++) {
                LocalDate dateToCheck = lastDecay.plusDays(i);
                String dateStr = dateToCheck.toString(); // e.g., "2026-04-01"

                // Did the user solve a question on this specific missed day?
                boolean solvedThatDay = questionRepository.existsByUserIdAndDate(user.getId(), dateStr);

                if (!solvedThatDay) {
                    int currentElo = user.getCurrentElo() != null ? user.getCurrentElo() : 1200;
                    user.setCurrentElo(Math.max(0, currentElo - 2)); // The Bleed
                }
            }
            // Fast-forward the decay tracker to today
            user.setLastDecayDate(today);
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
                return 3;
            case "medium":
                return 7;
            case "hard":
                return 15;
            default:
                return 3;
        }
    }
}