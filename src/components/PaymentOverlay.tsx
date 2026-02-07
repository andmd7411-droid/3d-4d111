'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'

export function PaymentOverlay({
    isOpen,
    onClose,
    onSuccess
}: {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}) {
    const { user, setPremiumStatus } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)

    if (!isOpen) return null

    const handlePayment = async () => {
        setIsProcessing(true)
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000))
        setPremiumStatus(true)
        setIsProcessing(false)
        onSuccess()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#1a1a2e] border border-blue-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-blue-500/20 transform animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 rounded-full bg-blue-500/10 mb-4">
                        <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Unlock Premium Export</h2>
                    <p className="text-gray-400">Unlock unlimited high-quality exports and advanced features with a one-time payment.</p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-300">Premium Access</span>
                        <span className="text-2xl font-bold text-white">$9.99</span>
                    </div>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Unlimited STL, DXF, SVG Exports
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            High-Resolution Processing
                        </li>
                        <li className="flex items-center">
                            <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Priority Support
                        </li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 ${isProcessing
                            ? 'bg-blue-600/50 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-blue-500/40'
                            }`}
                    >
                        {isProcessing ? 'Processing Payment...' : 'Pay with Card'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                    >
                        Cancel
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-gray-500">
                    Secure checkout powered by simulated payment gateway.
                </p>
            </div>
        </div>
    )
}
