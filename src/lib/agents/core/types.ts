export type AgentRole = 'QA' | 'ARCHITECT' | 'MANAGER' | 'WORKER';

export type AgentStatus = 'IDLE' | 'WORKING' | 'PAUSED' | 'ERROR';

export interface AgentMessage {
    id: string;
    from: string;
    to: string | 'BROADCAST';
    type: string;
    payload: any;
    timestamp: number;
}

export interface AgentConfig {
    id: string;
    name: string;
    role: AgentRole;
    capabilities: string[];
}

export interface IAgent {
    id: string;
    config: AgentConfig;
    status: AgentStatus;

    // Core lifecycle
    start(): Promise<void>;
    stop(): Promise<void>;

    // Message handling
    onMessage(message: AgentMessage): Promise<void>;
    sendMessage(to: string, type: string, payload: any): void;
}
