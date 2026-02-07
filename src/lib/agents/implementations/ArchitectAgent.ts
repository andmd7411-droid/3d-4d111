import { Agent } from '../core/Agent';
import { AgentConfig, AgentMessage } from '../core/types';

export class ArchitectAgent extends Agent {
    constructor() {
        const config: AgentConfig = {
            id: 'architect-agent-01',
            name: 'System Architect',
            role: 'ARCHITECT',
            capabilities: ['analyze-structure', 'scaffold-feature']
        };
        super(config);
    }

    protected async onStart(): Promise<void> {
        console.log(`[${this.config.name}] Ready to build.`);
    }

    protected async onStop(): Promise<void> {
        console.log(`[${this.config.name}] Signing off.`);
    }

    async onMessage(message: AgentMessage): Promise<void> {
        if (message.type === 'SCAFFOLD_PROPOSAL') {
            await this.analyzeAndScaffold(message.payload);
        }
    }

    private async analyzeAndScaffold(requirements: any) {
        this.sendMessage('BROADCAST', 'ARCHITECT_LOG', {
            message: `Analyzing requirements for: ${requirements.featureName}...`
        });

        // Basic template generation logic
        const slug = requirements.slug;
        const pagePath = `src/app/${slug}/page.tsx`;
        const libPath = `src/lib/converters/${slug}.ts`;

        const pageContent = `'use client'
import Link from 'next/link'

export default function ${requirements.featureName.replace(/\s+/g, '')}Page() {
    return (
        <div className="min-h-screen gradient-section3 p-8">
            <header className="mb-8">
                <Link href="/" className="text-white hover:underline mb-4 inline-block">← Back to Home</Link>
                <h1 className="text-5xl font-bold text-white mb-2">${requirements.featureName}</h1>
                <p className="text-white/80">Automated Scaffold by Architect Agent</p>
            </header>
            <div className="card text-center py-20">
                <div className="text-6xl mb-4">🚧</div>
                <h2 className="text-2xl font-bold text-white">Under Construction</h2>
                <p className="text-white/60">This feature was scaffolded by an AI Agent.</p>
            </div>
        </div>
    )
}`;

        const libContent = `// Scaffolded by Architect Agent
export interface ${requirements.featureName.replace(/\s+/g, '')}Options {
    quality: number;
}

export function convert(input: any, options: ${requirements.featureName.replace(/\s+/g, '')}Options) {
    console.log('Conversion logic placeholder');
    return null;
}`;

        this.sendMessage('BROADCAST', 'ARCHITECT_LOG', {
            message: `Blueprint generated. Writing files to disk...`
        });

        try {
            // Call the internal API to write files
            const response = await fetch('/api/agents/scaffold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    files: [
                        { path: pagePath, content: pageContent },
                        { path: libPath, content: libContent }
                    ]
                })
            });

            const result = await response.json();

            if (result.success) {
                this.sendMessage('BROADCAST', 'ARCHITECT_COMPLETE', {
                    status: 'SUCCESS',
                    files: result.created
                });

                this.sendMessage('BROADCAST', 'ARCHITECT_LOG', {
                    message: `Successfully created ${result.created.length} files.`
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.sendMessage('BROADCAST', 'ARCHITECT_ERROR', {
                error: `Failed to write files: ${error}`
            });
        }
    }
}
