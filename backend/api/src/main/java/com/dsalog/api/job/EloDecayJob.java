package com.dsalog.api.job;

import com.dsalog.api.model.User;
import com.dsalog.api.repository.QuestionRepository;
import com.dsalog.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component // Tells Spring Boot to load this into memory on startup
@RequiredArgsConstructor
public class EloDecayJob {

    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;

    // Cron syntax: Seconds, Minutes, Hours, Day of month, Month, Day of week
    // "0 0 0 * * ?" = Run exactly at 00:00:00 (Midnight) every single day
    @Scheduled(cron = "0 0 0 * * ?")
    public void executeMidnightDecay() {
        System.out.println("The Reaper has awoken. Checking for broken streaks...");

        // We want to check if they solved anything YESTERDAY,
        // since this runs at the exact millisecond today begins.
        String yesterday = LocalDate.now().minusDays(1).toString();

        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            // 1. Check if they have even started grinding yet
            long totalSolved = questionRepository.countByUserId(user.getId());

            if (totalSolved > 0) {
                // 2. Check if they solved anything yesterday
                boolean solvedYesterday = questionRepository.existsByUserIdAndDate(user.getId(), yesterday);

                if (!solvedYesterday) {
                    // 3. Streak broken! Bleed 2 points.
                    int currentElo = user.getCurrentElo();
                    int newElo = Math.max(0, currentElo - 2); // Floor at 0

                    user.setCurrentElo(newElo);
                    userRepository.save(user);

                    System.out.println("User " + user.getEmail() + " bled 2 points. New ELO: " + newElo);
                }
            }
        }

        System.out.println("Midnight decay complete.");
    }
}