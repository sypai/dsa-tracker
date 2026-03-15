package com.dsalog.api.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class ApiKeyFilter implements Filter {

    // In production, we'll pull this from Render environment variables
    private static final String API_KEY_HEADER = "X-API-KEY";
    private String apiSecret = System.getenv("API_SECRET_KEY");

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Skip security for 'OPTIONS' (CORS pre-flight) and Health Checks
        if ("OPTIONS".equalsIgnoreCase(req.getMethod()) || req.getRequestURI().contains("/health")) {
            chain.doFilter(request, response);
            return;
        }

        String requestKey = req.getHeader(API_KEY_HEADER);

        if (apiSecret != null && apiSecret.equals(requestKey)) {
            chain.doFilter(request, response);
        } else {
            res.setHeader("Access-Control-Allow-Origin", req.getHeader("Origin"));
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-KEY, Authorization");
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.getWriter().write("Invalid or Missing API Key");
        }
    }
}