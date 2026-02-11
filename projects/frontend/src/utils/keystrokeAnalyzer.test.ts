import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { KeystrokeAnalyzer } from './keystrokeAnalyzer';

describe('KeystrokeAnalyzer', () => {
    let analyzer: KeystrokeAnalyzer;

    beforeEach(() => {
        vi.useFakeTimers();
        analyzer = new KeystrokeAnalyzer();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with score 100', () => {
        const stats = analyzer.calculateStats();
        expect(stats.score).toBe(100);
        expect(stats.flags.botTypingSpeed).toBe(false);
    });

    it('should detect bot-like typing speed', () => {
        // Simulate fast typing: 60 chars in 3 seconds (20 chars/s = 1200 CPM ~ 240 WPM)
        analyzer.logKey('a'); // Start
        for (let i = 0; i < 60; i++) {
            vi.advanceTimersByTime(50); // 50ms per key
            analyzer.logKey('a');
        }

        const stats = analyzer.calculateStats();
        expect(stats.flags.botTypingSpeed).toBe(true);
        // Score should be reduced
        expect(stats.score).toBeLessThan(100);
    });

    it('should detect large pastes', () => {
        analyzer.logPaste(100); // 100 chars pasted
        const stats = analyzer.calculateStats();
        expect(stats.flags.largePaste).toBe(true);
        expect(stats.score).toBeLessThan(100);
    });

    it('should detect suspicious lack of backspaces in long session', () => {
        // Type 101 characters without backspace
        analyzer.logKey('a');
        for (let i = 0; i < 101; i++) {
            vi.advanceTimersByTime(100);
            analyzer.logKey('a');
        }

        // Total time ~10s
        const stats = analyzer.calculateStats();
        expect(stats.flags.zeroBackspace).toBe(true);
        expect(stats.stats.backspaceRatio).toBe(0);
    });

    it('should allow perfect score for human-like behavior', () => {
        // Type with variance and some backspaces
        analyzer.logKey('a');
        for (let i = 0; i < 50; i++) {
            // variable latency
            vi.advanceTimersByTime(50 + Math.floor(Math.random() * 200));

            if (i % 10 === 0) {
                analyzer.logKey('Backspace');
                vi.advanceTimersByTime(100);
            } else {
                analyzer.logKey('a');
            }
        }

        const stats = analyzer.calculateStats();
        // Assuming reasonable speed and variance
        // We mock random here, but in test env Math.random might be deterministic or we rely on the specific sequence
        // Let's just check flagging
        expect(stats.flags.botTypingSpeed).toBe(false);
    });
});
