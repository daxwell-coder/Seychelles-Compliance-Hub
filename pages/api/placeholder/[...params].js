export default function handler(req, res) {
  // Redirect to a reliable Seychelles/Victoria image
  const victoriaImageUrl = 'data:image/svg+xml;base64,' + Buffer.from(`
    <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4682B4;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#228B22;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#006400;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Sky -->
      <rect width="1920" height="600" fill="url(#skyGradient)"/>
      
      <!-- Mountains in background -->
      <polygon points="0,400 400,200 800,300 1200,150 1600,250 1920,200 1920,600 0,600" fill="url(#mountainGradient)" opacity="0.7"/>
      
      <!-- Buildings (representing Victoria architecture) -->
      <rect x="800" y="450" width="80" height="150" fill="#F5F5DC" stroke="#D3D3D3" stroke-width="2"/>
      <rect x="900" y="400" width="60" height="200" fill="#FFFAF0" stroke="#D3D3D3" stroke-width="2"/>
      <rect x="980" y="420" width="70" height="180" fill="#F0F8FF" stroke="#D3D3D3" stroke-width="2"/>
      
      <!-- Clock Tower (iconic Victoria landmark) -->
      <rect x="925" y="200" width="20" height="200" fill="#DCDCDC" stroke="#A9A9A9" stroke-width="2"/>
      <rect x="920" y="180" width="30" height="30" fill="#F5F5F5" stroke="#A9A9A9" stroke-width="2"/>
      <circle cx="935" cy="195" r="12" fill="#4169E1" stroke="#000080" stroke-width="1"/>
      
      <!-- Palm trees -->
      <circle cx="700" cy="520" r="25" fill="#228B22"/>
      <rect x="697" y="520" width="6" height="80" fill="#8B4513"/>
      <circle cx="1100" cy="530" r="20" fill="#32CD32"/>
      <rect x="1098" y="530" width="4" height="70" fill="#A0522D"/>
      
      <!-- Ground/street -->
      <rect x="0" y="600" width="1920" height="480" fill="#696969"/>
      
      <!-- Text overlay -->
      <text x="960" y="900" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#FFFFFF" opacity="0.8">Victoria, Seychelles</text>
    </svg>
  `).toString('base64');

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  
  // Decode and send the SVG
  const svgBuffer = Buffer.from(victoriaImageUrl.split(',')[1], 'base64');
  res.send(svgBuffer);
}
