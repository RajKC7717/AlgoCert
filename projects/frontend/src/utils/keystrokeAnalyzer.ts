export interface KeystrokeLog {
    timestamp: number;
    key: string;
    type: 'keydown' | 'paste' | 'backspace' | 'correction';
}

export interface HumanScore {
    score: number; // 0-100
    flags: {
        botTypingSpeed: boolean; // > 150 WPM sustained
        largePaste: boolean; // > 50 chars inserted instantly
        zeroBackspace: boolean; // No corrections in 100+ chars
        perfectCadence: boolean; // Suspiciously uniform typing rhythm (variance < 10)
    };
    stats: {
        wpm: number;
        backspaceRatio: number; // backspaces / total keystrokes
        pasteCount: number;
        variance: number; // variance in inter-key latency
    };
}

export class KeystrokeAnalyzer {
    private logs: KeystrokeLog[] = [];
    private startTime: number = 0;
    private lastKeyTime: number = 0;
    private charCount: number = 0;
    private backspaceCount: number = 0;
    private pasteCount: number = 0;
    private latencies: number[] = [];

    constructor() {
        this.reset();
    }

    reset() {
        this.logs = [];
        this.startTime = Date.now();
        this.lastKeyTime = this.startTime;
        this.charCount = 0;
        this.backspaceCount = 0;
        this.pasteCount = 0;
        this.latencies = [];
    }

    logKey(key: string) {
        const now = Date.now();

        // Track latency between keys (for variance check)
        if (this.charCount > 0) {
            const latency = now - this.lastKeyTime;
            // Filter out pauses > 2s (thinking time) to avoid skewing variance
            if (latency < 2000) {
                this.latencies.push(latency);
            }
        }

        const type = key === 'Backspace' ? 'backspace' : 'keydown';

        this.logs.push({
            timestamp: now,
            key,
            type
        });

        if (key === 'Backspace') {
            this.backspaceCount++;
        } else {
            this.charCount++;
        }

        this.lastKeyTime = now;
    }

    logPaste(length: number) {
        const now = Date.now();
        this.logs.push({
            timestamp: now,
            key: 'PASTE',
            type: 'paste'
        });
        this.pasteCount++;
        this.charCount += length;
    }

    calculateStats(): HumanScore {
        const now = Date.now();
        const durationMinutes = (now - this.startTime) / 60000;

        // 1. Calculate WPM (assuming avg word length = 5 chars)
        // Avoid division by zero
        const wpm = durationMinutes > 0 ? (this.charCount / 5) / durationMinutes : 0;

        // 2. Backspace Ratio
        const totalKeystrokes = this.charCount + this.backspaceCount;
        // Prevent division by zero
        const backspaceRatio = totalKeystrokes > 0 ? this.backspaceCount / totalKeystrokes : 0;

        // 3. Variance in Latency (Standard Deviation) to check for robotic uniformity
        let variance = 0;
        if (this.latencies.length > 1) {
            const mean = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
            const squaredDiffs = this.latencies.map(x => Math.pow(x - mean, 2));
            const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / this.latencies.length;
            variance = Math.sqrt(avgSquaredDiff); // Standard Deviation
        }

        // Flags
        const flags = {
            botTypingSpeed: wpm > 150 && this.charCount > 50, // Sustained high speed
            largePaste: this.pasteCount > 0 && (this.charCount / (this.pasteCount || 1)) > 50, // Avg paste size large
            zeroBackspace: this.charCount > 100 && this.backspaceCount === 0,
            perfectCadence: this.charCount > 50 && variance < 10 // extremely low variance (robotic)
        };

        // Score Calculation
        // Start at 100
        // -30 for bot speed
        // -20 for large pastes
        // -15 for zero backspaces (could be a genius, but suspicious)
        // -35 for perfect cadence

        let score = 100;
        if (flags.botTypingSpeed) score -= 30;
        if (flags.largePaste) score -= 20;
        if (flags.zeroBackspace) score -= 15;
        if (flags.perfectCadence) score -= 35;

        return {
            score: Math.max(0, score),
            flags,
            stats: {
                wpm: Math.round(wpm),
                backspaceRatio,
                pasteCount: this.pasteCount,
                variance: Math.round(variance)
            }
        };
    }

    getLogs() {
        return this.logs;
    }
}
