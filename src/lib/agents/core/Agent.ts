import { IAgent, AgentConfig, AgentStatus, AgentMessage } from './types';

export abstract class Agent implements IAgent {
    public id: string;
    public config: AgentConfig;
    public status: AgentStatus = 'IDLE';
    private messageCallback: ((message: AgentMessage) => void) | null = null;

    constructor(config: AgentConfig) {
        this.id = config.id;
        this.config = config;
    }

    // To be implemented by the Orchestrator to inject the message bus
    public setMessageCallback(callback: (message: AgentMessage) => void) {
        this.messageCallback = callback;
    }

    public sendMessage(to: string, type: string, payload: any): void {
        if (this.messageCallback) {
            const message: AgentMessage = {
                id: crypto.randomUUID(),
                from: this.id,
                to,
                type,
                payload,
                timestamp: Date.now()
            };
            this.messageCallback(message);
        } else {
            console.warn(`Agent ${this.id} tried to send message but has no callback`);
        }
    }

    async start(): Promise<void> {
        console.log(`[Agent ${this.config.name}] Starting...`);
        this.status = 'IDLE';
        await this.onStart();
    }

    async stop(): Promise<void> {
        console.log(`[Agent ${this.config.name}] Stopping...`);
        this.status = 'PAUSED';
        await this.onStop();
    }

    // Hooks for concrete implementations
    protected abstract onStart(): Promise<void>;
    protected abstract onStop(): Promise<void>;

    // Main message handler
    abstract onMessage(message: AgentMessage): Promise<void>;
}
