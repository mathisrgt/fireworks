import { NextResponse } from 'next/server'

export async function GET() {
  // Generate a random nonce for SIWE
  const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  const response = NextResponse.json({ nonce })
  
  // Set the nonce in a cookie for verification later
  response.cookies.set('siwe', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
  
  return response
} 