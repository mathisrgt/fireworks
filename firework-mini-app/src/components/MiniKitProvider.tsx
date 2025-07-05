'use client'

import { ReactNode, useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'

export default function MiniKitProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		// Initialize MiniKit without appId for now
		// The appId will be provided by the World App environment when running inside World App
		MiniKit.install()
	}, [])

	return <>{children}</>
} 