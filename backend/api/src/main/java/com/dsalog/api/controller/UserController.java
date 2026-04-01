package com.dsalog.api.controller;

import com.dsalog.api.model.User;
import com.dsalog.api.repository.UserRepository;
import com.dsalog.api.service.EloService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // FIX 1: Tell Spring to inject EloService here so the red line goes away
    private final EloService eloService;

    // POST: Register a new user
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        Optional<User> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already taken.");
        }

        user.setCurrentElo(1200);
        // TODO: Hash the password later!

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    // POST: Login an existing user
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginRequest) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found.");
        }

        User user = userOpt.get();

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid password.");
        }

        // BONUS FIX: Reconcile decay immediately upon login so the math is always
        // perfect
        User reconciledUser = eloService.reconcileDecay(user);

        return ResponseEntity.ok(reconciledUser);
    }

    // GET: Fetch the latest user data (FIX 2: The duplicate is removed, only the
    // correct one remains)
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            // Force state reconciliation before returning the user!
            User reconciledUser = eloService.reconcileDecay(user);
            return ResponseEntity.ok(reconciledUser);
        }).orElse(ResponseEntity.notFound().build());
    }

    // PUT: Update custom topics
    @PutMapping("/{id}/topics")
    public ResponseEntity<User> updateTopics(@PathVariable Long id, @RequestBody List<String> topics) {
        return userRepository.findById(id).map(user -> {
            user.setCustomTopics(topics);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }
}