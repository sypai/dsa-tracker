package com.dsalog.api.service;

import org.springframework.stereotype.Service;

@Service // This tells Spring Boot to load this class into memory as a tool
public class EloService {

    // The single source of truth for your ELO math!
    public int calculateGain(String difficulty) {
        if (difficulty == null)
            return 0;

        return switch (difficulty.toLowerCase()) {
            case "easy" -> 5;
            case "medium" -> 15;
            case "hard" -> 25;
            default -> 0;
        };
    }
}