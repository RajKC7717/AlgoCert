import { HumanScore } from './keystrokeAnalyzer';

export interface ProofOfSkillMetadata {
    name: string;
    description: string;
    image: string;
    external_url: string;
    properties: {
        standard: 'arc3';
        bounty_id: string;
        bounty_title: string;
        timestamp: number;
        human_score: number;
        stats: {
            wpm: number;
            backspace_ratio: number;
            paste_count: number;
            variance: number;
        };
        flags: {
            bot_typing_speed: boolean;
            large_paste: boolean;
            zero_backspace: boolean;
            perfect_cadence: boolean;
        };
        session_duration_seconds: number;
        code_hash: string; // SHA-256 of the submitted code
    };
}

export const generateMetadata = (
    bountyId: string,
    bountyTitle: string,
    codeHash: string,
    sessionDuration: number,
    scoreData: HumanScore,
    screenshotIpfsUrl: string // URL of the code screenshot
): ProofOfSkillMetadata => {
    return {
        name: `Dev-Duel Proof: ${bountyTitle}`,
        description: `Configurable Proof-of-Skill for completing bounty #${bountyId}. Verified human effort with score ${scoreData.score}/100.`,
        image: screenshotIpfsUrl,
        external_url: 'https://skillchain.arena', // Placeholder
        properties: {
            standard: 'arc3',
            bounty_id: bountyId,
            bounty_title: bountyTitle,
            timestamp: Math.floor(Date.now() / 1000),
            human_score: scoreData.score,
            stats: {
                wpm: scoreData.stats.wpm,
                backspace_ratio: parseFloat(scoreData.stats.backspaceRatio.toFixed(4)),
                paste_count: scoreData.stats.pasteCount,
                variance: scoreData.stats.variance
            },
            flags: {
                bot_typing_speed: scoreData.flags.botTypingSpeed,
                large_paste: scoreData.flags.largePaste,
                zero_backspace: scoreData.flags.zeroBackspace,
                perfect_cadence: scoreData.flags.perfectCadence
            },
            session_duration_seconds: Math.round(sessionDuration),
            code_hash: codeHash
        }
    };
};
