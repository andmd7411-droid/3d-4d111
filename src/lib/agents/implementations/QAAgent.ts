import { Agent } from '../core/Agent';
import { AgentConfig, AgentMessage } from '../core/types';

export class QAAgent extends Agent {
    constructor() {
        const config: AgentConfig = {
            id: 'qa-agent-01',
            name: 'QA Inspector',
            role: 'QA',
            capabilities: ['test-ui', 'report-error', 'verify-conversion']
        };
        super(config);
    }

    protected async onStart(): Promise<void> {
        console.log(`[${this.config.name}] Ready for testing assignments.`);
        this.sendMessage('BROADCAST', 'AGENT_READY', { status: 'Ready to test' });
    }

    protected async onStop(): Promise<void> {
        console.log(`[${this.config.name}] Going offline.`);
    }

    async onMessage(message: AgentMessage): Promise<void> {
        if (message.type === 'START_QA_SESSION') {
            await this.runFullTest();
        }
    }

    private async runFullTest() {
        this.sendMessage('BROADCAST', 'QA_progress', { step: 'Initializing Test Sequence', progress: 0 });

        try {
            // 1. Check Homepage
            await this.verifyElement('header h1', 'Files Converter');

            // 2. Navigate to 3D Converter (Simulation for now as we can't really navigate spa without reloading context)
            // But we can check if links exist
            await this.verifyElement('a[href="/"]', 'Back Link');

            // 3. Test Controls (if on Dashboard)
            await this.clickElement('button.btn-primary'); // Attempts to click the first primary button found

            this.sendMessage('BROADCAST', 'QA_complete', { status: 'PASSED', report: 'DOM Elements verified.' });
        } catch (error: any) {
            this.sendMessage('BROADCAST', 'QA_complete', { status: 'FAILED', report: error.message });
        }
    }

    private async verifyElement(selector: string, description: string) {
        this.sendMessage('BROADCAST', 'QA_progress', { step: `Verifying ${description}...`, progress: 10 });

        await new Promise(r => setTimeout(r, 500)); // Visual delay

        const element = document.querySelector(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }

        this.sendMessage('BROADCAST', 'QA_LOG', { message: `✅ Found ${description}` });
    }

    private async clickElement(selector: string) {
        this.sendMessage('BROADCAST', 'QA_progress', { step: `Clicking ${selector}...`, progress: 50 });

        await new Promise(r => setTimeout(r, 500));

        const element = document.querySelector(selector) as HTMLElement;
        if (!element) {
            throw new Error(`Click target not found: ${selector}`);
        }

        element.click();
        this.sendMessage('BROADCAST', 'QA_LOG', { message: `✅ Clicked ${selector}` });
    }
}
