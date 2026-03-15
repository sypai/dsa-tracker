// src/lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_SECRET;

export const dsaFetch = async (endpoint: string, options: RequestInit = {}) => {
  // 1. Construct the full URL
  const url = `${BASE_URL}${endpoint}`;

  // 2. Inject the "Secret Handshake" headers
  const headers = {
    "X-API-KEY": API_KEY || "",
    "Content-Type": "application/json",
    ...options.headers, // Allow individual calls to override headers if needed
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // 3. Handle unauthorized or server errors globally
    if (response.status === 401) {
        console.error("🚨 API Key Rejected. Check your environment variables!");
    }

    return response;
  } catch (error) {
    console.error(`❌ Network error hitting ${url}:`, error);
    throw error;
  }
};