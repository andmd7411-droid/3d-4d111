'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AgentMessage } from '@/lib/agents/core/types'
import { globalOrchestrator } from '@/lib/agents/core/Orchestrator'
import { QAAgent } from '@/lib/agents/implementations/QAAgent'
import { ArchitectAgent } from '@/lib/agents/implementations/ArchitectAgent'

export default function AgentsDashboard() {
    const [messages, setMessages] = useState<AgentMessage[]>([])
    const [status, setStatus] = useState('Idle')
    const hasInitialized = useRef(false)

    useEffect(() => {
        if (hasInitialized.current) return
        hasInitialized.current = true

        // Initialize Agents
        const qaAgent = new QAAgent()
        const architectAgent = new ArchitectAgent()

        globalOrchestrator.registerAgent(qaAgent)
        globalOrchestrator.registerAgent(architectAgent)

        // Subscribe to logs
        const unsubscribe = globalOrchestrator.subscribe((msg) => {
            setMessages(prev => [msg, ...prev])
            if (msg.type === 'QA_progress') {
                setStatus(`Testing: ${msg.payload.step} (${msg.payload.progress}%)`)
            } else if (msg.type === 'QA_complete') {
                setStatus(`Complete: ${msg.payload.status}`)
            }
        })

        // Start them up
        globalOrchestrator.startAll()

        return () => {
            unsubscribe()
            globalOrchestrator.stopAll()
        }
    }, [])

    const startQA = () => {
        // Send a command to the orchestrator (or directly to an agent via orchestrator in a real complex setup)
        // For now, we simulate a user command agent or just direct dispatch
        // Ideally, we'd have a 'UserAgent' or 'ControlPanelAgent', but we can just mock the source
        const cmd: AgentMessage = {
            id: crypto.randomUUID(),
            from: 'USER_DASHBOARD',
            to: 'qa-agent-01',
            type: 'START_QA_SESSION',
            payload: {},
            timestamp: Date.now()
        }

        // We need a public method to dispatch external messages or just use the agent's receive directly if we had reference
        // But for the Orchestrator, we should probably add a 'dispatch' method. 
        // For this MVP, let's just find the agent and call onMessage (simulating the bus)
        // A better way is to expose a 'dispatch' on the Orchestrator.
        // Let's hack it on the client for now, or better: Update Orchestrator to have a public dispatch.
        // Re-reading Orchestrator: it doesn't have a public dispatch. 
        // We will add it or just cheat for now by using the agent instance if we stored it.
        // Actually, let's just use the Orchestrator's internal mechanism if possible? No.
        // Let's just fix Orchestrator to allow external dispatch.
        // Since I can't edit Orchestrator in this same turn, I'll assume I can just use a hacky way 
        // OR I'll update Orchestrator next.
        // Allow me to update Orchestrator first? No, I'll do it in parallel or after.
        // Wait, I can just use `globalOrchestrator['handleMessage'](cmd)` if I cast it to any, 
        // but that's dirty.
        // Let's just update Orchestrator to expose `dispatch` in a subsequent step. 
        // For the UI code, I will assume `dispatch` exists or use a work-around.
        // I'll stick to a cleaner approach: The UI *is* an agent? 
        // No, let's just update Orchestrator.ts to have `dispatch(msg)`.
    }

    // Since I realized I need to update Orchestrator, I will write this file expecting `dispatch` 
    // and then immediately update Orchestrator.

    return (
        <div className="min-h-screen gradient-section2 p-8 text-white">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <Link href="/" className="text-white/70 hover:text-white mb-2 inline-block">← Back</Link>
                    <h1 className="text-4xl font-bold">🕵️ Agent Command Center</h1>
                    <p className="opacity-80">Observe and control autonomous agents</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                    System Status: <span className="font-bold text-green-400">{status}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Control Panel */}
                <div className="card space-y-6">
                    <h2 className="text-xl font-bold border-b border-white/10 pb-2">Controls</h2>

                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                globalOrchestrator.dispatch({
                                    id: crypto.randomUUID(),
                                    from: 'USER_DASHBOARD',
                                    to: 'qa-agent-01',
                                    type: 'START_QA_SESSION',
                                    payload: {},
                                    timestamp: Date.now()
                                })
                            }}
                            className="w-full btn-primary bg-blue-500 hover:bg-blue-600"
                        >
                            ▶ Run Full QA Test
                        </button>

                        <button
                            onClick={() => {
                                globalOrchestrator.dispatch({
                                    id: crypto.randomUUID(),
                                    from: 'USER_DASHBOARD',
                                    to: 'architect-agent-01',
                                    type: 'SCAFFOLD_PROPOSAL',
                                    payload: { featureName: 'Audio Converter', slug: 'audio-converter' },
                                    timestamp: Date.now()
                                })
                            }}
                            className="w-full btn-primary bg-purple-500 hover:bg-purple-600"
                        >
                            🏗️ Scaffold New Feature (Demo)
                        </button>
                    </div>

                    <div className="bg-black/30 p-4 rounded-lg">
                        <h3 className="font-bold mb-2 text-sm text-gray-400">Active Agents</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                QA Inspector (IDLE)
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Console / Logs */}
                <div className="lg:col-span-2 card flex flex-col h-[600px]">
                    <h2 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">
                        Live Agent Logs
                        <span className="ml-2 text-xs font-normal opacity-60">({messages.length} events)</span>
                    </h2>

                    <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2 pr-2 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-white/30 text-center mt-20">Waiting for agent activity...</div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className="p-2 rounded hover:bg-white/5 border-l-2 border-transparent hover:border-white/20 transition-all">
                                <div className="flex justify-between text-xs opacity-50 mb-1">
                                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                    <span>{msg.from} → {msg.to}</span>
                                </div>
                                <div className="font-bold text-blue-300 mb-1">{msg.type}</div>
                                <div className="text-white/80 whitespace-pre-wrap break-words">
                                    {JSON.stringify(msg.payload, null, 2)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Testing Sandbox (Iframe) */}
            <div className="card mt-6 p-4">
                <h2 className="text-xl font-bold border-b border-white/10 pb-2 mb-4">🖥️ Test Environment</h2>
                <div className="bg-white rounded-lg overflow-hidden h-[500px] border-4 border-gray-800">
                    <iframe
                        id="qa-target"
                        className="w-full h-full bg-white"
                        title="QA Testing Sandbox"
                    />
                </div>
            </div>
        </div>
    )
}
