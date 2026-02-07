import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const { files } = await req.json();

        if (!Array.isArray(files)) {
            return NextResponse.json({ error: 'Invalid payload: files must be an array' }, { status: 400 });
        }

        const stats = [];

        for (const file of files) {
            // Safety check: Ensure we only write to src
            if (!file.path.startsWith('src/')) {
                return NextResponse.json({ error: `Security validation failed: Cannot write to ${file.path}` }, { status: 403 });
            }

            const fullPath = path.join(process.cwd(), file.path);
            const dir = path.dirname(fullPath);

            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, file.content);
            stats.push(file.path);
        }

        return NextResponse.json({ success: true, created: stats });
    } catch (error) {
        console.error('Scaffolding error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
