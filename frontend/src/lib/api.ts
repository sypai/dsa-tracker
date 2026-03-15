// src/lib/api.ts

export const dsaFetch = async (endpoint: string, options: RequestInit = {}) => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    const API_KEY = process.env.NEXT_PUBLIC_API_SECRET;
  
    // 🚨 DIAGNOSTIC: If this logs "undefined", your .env file isn't being read!
    console.log("DEBUG: Calling URL ->", `${BASE_URL}${endpoint}`);
  
    if (!BASE_URL) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined. Check your .env file!");
    }
  
    const url = `${BASE_URL}${endpoint}`;
  
    const headers = {
      "X-API-KEY": API_KEY || "",
      "Content-Type": "application/json",
      ...options.headers,
    };
  
    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        // 1. Technical Log (visible to you in F12 for debugging)
        console.error(`[INTERNAL ERROR] Status: ${response.status} at ${endpoint}`);
        
        // 2. Friendly Error (What the user gets)
        if (response.status === 401 || response.status === 403) {
          throw new Error("Session issue. Please try signing in again.");
        }
        throw new Error("The engine is busy. Please try again in a moment.");
      }
  
      return response;
    
    } catch (error: any) {
        // Mask network failures (like Render sleeping) as a "Connection" issue
        throw new Error(error.message || "Connection timeout. Ensure the reaper is awake.");
      }
  };