import { NextResponse } from 'next/server';

// Force dynamic so Vercel doesn't cache this response at build time
export const dynamic = 'force-dynamic'; 

export async function GET() {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/questions`; // Any valid endpoint
  
  try {
    // Ping the Render backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        "X-API-KEY": process.env.NEXT_PUBLIC_API_SECRET || "",
      },
    });

    if (response.ok) {
      return NextResponse.json({ status: "Success", message: "The Reaper is awake." });
    } else {
      return NextResponse.json({ status: "Pinged", message: `Engine returned ${response.status}` });
    }
  } catch (error: any) {
    // If Render is asleep, it might timeout or drop the connection. 
    // Just making the attempt is enough to trigger Render's boot sequence.
    return NextResponse.json({ status: "Booting", message: "Cold start initiated." });
  }
}