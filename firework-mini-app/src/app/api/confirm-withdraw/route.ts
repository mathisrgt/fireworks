import { NextRequest, NextResponse } from 'next/server'
import { MiniAppSendTransactionSuccessPayload } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: MiniAppSendTransactionSuccessPayload
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload

    // IMPORTANT: Here we should fetch the withdrawal request from your database to ensure the transaction we are verifying is the same one we initiated
    // const withdrawalRequest = getWithdrawalRequestFromDB(payload.transaction_id)
    
    // For now, we'll skip the verification since we don't have a database
    // In production, you should implement this check

    // 1. Check that the transaction we received from the mini app is the same one we sent
    // if (withdrawalRequest.transaction_id !== payload.transaction_id) {
    //   return NextResponse.json(
    //     { error: 'Transaction ID mismatch' },
    //     { status: 400 }
    //   )
    // }

    // 2. Verify the transaction on-chain
    // In production, you should verify the transaction hash on the blockchain
    // For now, we'll assume success if we receive the payload

    // 3. Update the withdrawal status in your database
    // updateWithdrawalStatus(payload.transaction_id, 'completed')

    return NextResponse.json({ 
      success: true,
      transaction_id: payload.transaction_id,
      message: 'Withdrawal completed successfully'
    })
  } catch (error) {
    console.error('Error confirming withdrawal:', error)
    return NextResponse.json(
      { error: 'Failed to confirm withdrawal' },
      { status: 500 }
    )
  }
} 