import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authToken = req.cookies.get('auth_token')
    
    if (authToken && authToken.value === 'authenticated') {
      // In a real app, you'd verify the token and get user info from database
      return NextResponse.json({ 
        authenticated: true,
        address: '0x1234...5678' // This would come from your database
      })
    }
    
    return NextResponse.json({ authenticated: false })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false })
  }
} 