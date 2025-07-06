import { NextRequest, NextResponse } from 'next/server'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload

    // IMPORTANT: Here we should fetch the reference you created in /initiate-payment to ensure the transaction we are verifying is the same one we initiated
    // const reference = getReferenceFromDB()
    
    // For now, we'll skip the reference check since we don't have a database
    // In production, you should implement this check

    // 1. Check that the transaction we received from the mini app is the same one we sent
    // if (payload.reference === reference) {
    
    // 2. Verify the transaction with World Developer Portal API
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to verify transaction: ${response.statusText}`)
    }

    const transaction = await response.json()

    // 3. Here we optimistically confirm the transaction.
    // In production, you might want to wait for more confirmations
    if (transaction.status === 'success' || transaction.status === 'pending') {
      // TODO: Update your database to mark the payment as confirmed
      // updatePaymentStatus(payload.reference, 'confirmed')
      
      return NextResponse.json({ 
        success: true, 
        transaction: transaction,
        message: 'Payment confirmed successfully'
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment verification failed',
          transaction: transaction
        },
        { status: 400 }
      )
    }
    // }

    // return NextResponse.json(
    //   { success: false, error: 'Reference mismatch' },
    //   { status: 400 }
    // )

  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
} 