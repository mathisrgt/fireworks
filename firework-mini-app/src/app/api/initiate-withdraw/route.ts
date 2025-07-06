import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { amount, token } = await req.json()
    const uuid = crypto.randomUUID().replace(/-/g, '')

    // TODO: Store the withdrawal request in your database with amount, token, and status
    // For now, we'll just return the ID
    // In production, you should store this in a database with additional metadata

    return NextResponse.json({ 
      id: uuid,
      amount,
      token,
      success: true 
    })
  } catch (error) {
    console.error('Error initiating withdrawal:', error)
    return NextResponse.json(
      { error: 'Failed to initiate withdrawal' },
      { status: 500 }
    )
  }
} 