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
      return response;
    } catch (error) {
      console.error(`❌ Fetch failed for ${url}. Is your backend running?`);
      throw error;
    }
  };