import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Filter for auth-related cookies
  const authCookies = allCookies.filter(cookie => 
    cookie.name.includes('auth') || 
    cookie.name.includes('supabase') || 
    cookie.name.includes('sb-')
  );
  
  return NextResponse.json({
    allCookies: allCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'empty' })),
    authCookies: authCookies.map(c => ({ name: c.name, value: c.value ? 'present' : 'empty' })),
    totalCookies: allCookies.length,
    authCookieCount: authCookies.length
  });
}
