export interface CertificateData {
  file: File;        // ready for IPFS upload
  previewUrl: string; // ready for <img src="..." />
}

export const generateCertificate = async (
  studentName: string,
  courseName: string,
  score: number
): Promise<CertificateData> => {
  // 1. Create Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // High resolution for crisp text
  canvas.width = 1200;
  canvas.height = 800;

  if (!ctx) throw new Error("Could not get canvas context");

  // 2. Background (Classic Parchment Style)
  const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
  gradient.addColorStop(0, '#fdfbf7'); // Off-white
  gradient.addColorStop(1, '#e2d1c3'); // Parchment tone
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 3. Ornate Border
  ctx.strokeStyle = '#1a202c'; // Dark Gray
  ctx.lineWidth = 20;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  
  ctx.lineWidth = 2;
  ctx.strokeRect(65, 65, canvas.width - 130, canvas.height - 130);

  // 4. Text Content
  ctx.textAlign = 'center';
  
  // Title
  ctx.fillStyle = '#2d3748';
  ctx.font = 'bold 70px serif';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', canvas.width / 2, 180);

  // Subtitle
  ctx.font = 'italic 30px sans-serif';
  ctx.fillStyle = '#4a5568';
  ctx.fillText('This is to certify that', canvas.width / 2, 260);

  // Student Name (Truncate if too long)
  const displayName = studentName.length > 20 ? studentName.slice(0, 20) + '...' : studentName;
  ctx.font = 'bold italic 80px serif';
  ctx.fillStyle = '#b7791f'; // Gold/Bronze
  ctx.fillText(displayName, canvas.width / 2, 380);
  
  // Underline
  ctx.beginPath();
  ctx.moveTo(300, 400);
  ctx.lineTo(900, 400);
  ctx.strokeStyle = '#b7791f';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Achievement Text
  ctx.font = '30px sans-serif';
  ctx.fillStyle = '#2d3748';
  ctx.fillText(`Has successfully completed the assessment for`, canvas.width / 2, 480);
  
  // Course Name
  ctx.font = 'bold 50px sans-serif';
  ctx.fillText(courseName, canvas.width / 2, 550);

  // Score Badge
  ctx.beginPath();
  ctx.arc(canvas.width / 2, 650, 60, 0, 2 * Math.PI);
  ctx.fillStyle = '#2d3748';
  ctx.fill();
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(`${score}%`, canvas.width / 2, 665);
  
  // Date
  ctx.fillStyle = '#718096';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Issued: ${new Date().toLocaleDateString()}`, canvas.width / 2, 750);

  // 5. Convert to Blob -> File
  return new Promise((resolve, reject) => {
    // A. Preview URL (Synchronous & Fast)
    const previewUrl = canvas.toDataURL('image/png');

    // B. File Object (Async)
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas conversion failed"));
        return;
      }
      const file = new File([blob], `Certificate-${studentName}.png`, { type: 'image/png' });
      resolve({ file, previewUrl });
    }, 'image/png');
  });
};