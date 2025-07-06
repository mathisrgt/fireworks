import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const uuid = crypto.randomUUID().replace(/-/g, '')

    // TODO: Store the ID field in your database so you can verify the payment later
    // For now, we'll just return the ID
    // In production, you should store this in a database with additional metadata

    return NextResponse.json({ 
      id: uuid,
      success: true 
    })
  } catch (error) {
    console.error('Error initiating payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
} 