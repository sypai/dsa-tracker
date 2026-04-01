package com.dsalog.api.job;

import com.dsalog.api.model.User;
import com.dsalog.api.repository.UserRepository;
import com.dsalog.api.service.EloService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class EloDecayJob {

    private static final Logger logger = LoggerFactory.getLogger(EloDecayJob.class);

    private final UserRepository userRepository;
    private final EloService eloService;

    public EloDecayJob(UserRepository userRepository, EloService eloService) {
        this.userRepository = userRepository;
        this.eloService = eloService;
    }

    // Fires at exactly midnight Indian Standard Time
    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")
    public void processEloDecay() {
        logger.info("The Reaper has awakened. Starting midnight ELO decay reconciliation...");

        List<User> users = userRepository.findAll();
        int processedCount = 0;

        for (User user : users) {
            try {
                // Pass the user to the bulletproof reconciliation engine
                eloService.reconcileDecay(user);
                processedCount++;
            } catch (Exception e) {
                logger.error("Failed to process decay for user ID: " + user.getId(), e);
            }
        }

        logger.info("Decay job complete. The Reaper processed {} users and returned to sleep.", processedCount);
    }
}