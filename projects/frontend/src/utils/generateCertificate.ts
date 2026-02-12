// This utility creates the "ARC-3" Metadata for the NFT
// It follows the Algorand Standard for Digital Assets

export const generateCertificate = (address: string, score: number, strikes: number) => {
    const date = new Date().toLocaleDateString();
    
    // 1. Determine Rank based on integrity & score
    let rank = "Bronze";
    let color = "#cd7f32"; // Bronze

    if (score === 100 && strikes === 0) {
        rank = "Platinum";
        color = "#00bcd4"; // Cyan
    } else if (score >= 90 && strikes < 2) {
        rank = "Gold";
        color = "#ffd700"; // Gold
    } else if (score >= 80) {
        rank = "Silver";
        color = "#c0c0c0"; // Silver
    }

    // 2. Shorten Address for display (e.g., BHND...KKLQ)
    const shortAddress = address 
        ? `${address.slice(0, 6)}...${address.slice(-6)}` 
        : "UNKNOWN";

    // 3. Generate the Visual (SVG)
    // This code draws the image dynamically!
    const svgImage = `
      <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg" style="background:#1a1a1a; font-family: monospace;">
        <rect x="10" y="10" width="480" height="280" rx="15" ry="15" stroke="${color}" stroke-width="5" fill="none"/>
        
        <text x="50%" y="50" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24" font-weight="bold" letter-spacing="2">SMART-LAB CERTIFIED</text>
        
        <text x="50%" y="110" dominant-baseline="middle" text-anchor="middle" fill="${color}" font-size="48" font-weight="bold" filter="drop-shadow(0px 0px 10px ${color})">${rank.toUpperCase()}</text>
        
        <line x1="100" y1="140" x2="400" y2="140" stroke="#333" stroke-width="2" />

        <text x="50%" y="170" dominant-baseline="middle" text-anchor="middle" fill="#cccccc" font-size="14">Holder: ${shortAddress}</text>
        
        <text x="50%" y="200" dominant-baseline="middle" text-anchor="middle" fill="#cccccc" font-size="14">
            Score: ${score}/100  |  Integrity Strikes: ${strikes}
        </text>
        
        <text x="50%" y="260" dominant-baseline="middle" text-anchor="middle" fill="#555" font-size="10">
            MINTED: ${date} | BLOCKCHAIN VERIFIED
        </text>
      </svg>
    `;

    // 4. Convert SVG to Base64 (so we can show it as an image tag)
    const imageBase64 = "data:image/svg+xml;base64," + btoa(svgImage);

    // 5. Create the JSON Metadata (The "Real" Asset for ARC-3)
    const metadata = {
        name: `Smart-Lab ${rank} Certificate`,
        description: `Certified Python Developer. Score: ${score}. Strikes: ${strikes}.`,
        image: imageBase64,
        properties: {
            rank: rank,
            score: score,
            integrity_strikes: strikes,
            exam_topic: "Python Algorithms",
            institution: "Smart-Lab Decentralized Academy",
            date_minted: date
        }
    };

    return { metadata, imageBase64, rank };
};