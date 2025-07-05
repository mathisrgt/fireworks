import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js'

interface IRequestPayload {
	payload: MiniAppWalletAuthSuccessPayload
	nonce: string
}

export const POST = async (req: NextRequest) => {
	const { payload, nonce } = (await req.json()) as IRequestPayload
	
	// Check if nonce matches the one we created earlier
	if (nonce != cookies().get('siwe')?.value) {
		return NextResponse.json({
			success: false,
			error: 'Invalid nonce',
		})
	}
	
	try {
		// Verify the SIWE message
		const validMessage = await verifySiweMessage(payload, nonce)
		
		if (!validMessage.isValid) {
			return NextResponse.json({
				success: false,
				error: 'Invalid signature',
			})
		}

		// Authentication successful
		const response = NextResponse.json({
			success: true,
			address: payload.address,
			message: 'Authentication successful'
		})

		// Set authentication cookie
		response.cookies.set('auth_token', 'authenticated', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		})

		return response
	} catch (error: any) {
		// Handle errors in validation or processing
		console.error('SIWE verification error:', error)
		return NextResponse.json({
			success: false,
			error: error.message || 'Authentication verification failed',
		})
	}
} 