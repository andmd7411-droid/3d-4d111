import { Agent } from './Agent';
import { AgentMessage } from './types';

export class AgentOrchestrator {
    private agents: Map<string, Agent> = new Map();
    private messageLog: AgentMessage[] = [];
    private listeners: ((message: AgentMessage) => void)[] = [];

    registerAgent(agent: Agent) {
        if (this.agents.has(agent.id)) {
            console.warn(`Agent ${agent.id} is already registered.`);
            return;
        }

        this.agents.set(agent.id, agent);

        // Inject message bus callback
        agent.setMessageCallback(this.handleMessage.bind(this));

        console.log(`[Orchestrator] Registered agent: ${agent.config.name} (${agent.config.role})`);
    }

    async startAll() {
        console.log('[Orchestrator] Starting all agents...');
        const promises = Array.from(this.agents.values()).map(agent => agent.start());
        await Promise.all(promises);
    }

    async stopAll() {
        console.log('[Orchestrator] Stopping all agents...');
        const promises = Array.from(this.agents.values()).map(agent => agent.stop());
        await Promise.all(promises);
    }

    private handleMessage(message: AgentMessage) {
        this.logMessage(message);

        // Broadcast to UI listeners
        this.notifyListeners(message);

        if (message.to === 'BROADCAST') {
            this.agents.forEach(agent => {
                if (agent.id !== message.from) {
                    agent.onMessage(message);
                }
            });
        } else {
            const targetAgent = this.agents.get(message.to);
            if (targetAgent) {
                targetAgent.onMessage(message);
            } else {
                console.warn(`[Orchestrator] Message sent to unknown agent: ${message.to}`);
            }
        }
    }

    public dispatch(message: AgentMessage) {
        this.handleMessage(message);
    }

    private logMessage(message: AgentMessage) {
        this.messageLog.push(message);
        // Keep log size manageable
        if (this.messageLog.length > 1000) {
            this.messageLog.shift();
        }
    }

    public subscribe(listener: (message: AgentMessage) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners(message: AgentMessage) {
        this.listeners.forEach(listener => listener(message));
    }

    public getAgents() {
        return Array.from(this.agents.values()).map(a => a.config);
    }
}

// Singleton instance for the app
export const globalOrchestrator = new AgentOrchestrator();
