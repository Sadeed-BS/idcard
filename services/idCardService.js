const nodeHtmlToImage = require('node-html-to-image');
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

function drawRoundedSquare(ctx, x, y, size, radius, fillStyle) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + size - radius, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
  ctx.lineTo(x + size, y + size - radius);
  ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
  ctx.lineTo(x + radius, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}


function drawCircularFinder(ctx, centerX, centerY, size, colors) {
  const outerR = size / 2;
  const middleR = size / 3;
  const innerR = size / 6;

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerR, 0, Math.PI * 2, false);
  ctx.fillStyle = colors.outer || '#000000';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, middleR, 0, Math.PI * 2, false);
  ctx.fillStyle = colors.gap || '#ffffff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerR, 0, Math.PI * 2, false);
  ctx.fillStyle = colors.center || '#000000';
  ctx.fill();
}


function drawRoundedCorner(ctx, canvasSize, margin, finderSize, color) {
  ctx.beginPath();
  ctx.moveTo(canvasSize - margin - finderSize, canvasSize);
  ctx.arcTo(
    canvasSize, canvasSize, 
    canvasSize, canvasSize - margin - finderSize, 
    finderSize
  );
  ctx.lineTo(canvasSize, canvasSize);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

const createCustomQRCode = async (data, logoBuffer, options = {}) => {
  const { finderColors = {}, background = '#70e0ffff', cornerColor = '#70e0ffff' } = options;

  const qrCodeData = QRCode.create(data, { errorCorrectionLevel: 'H' });
  const moduleCount = qrCodeData.modules.size;
  const moduleSize = 8;
  const margin = moduleSize * 2;
  const canvasSize = moduleCount * moduleSize + margin * 2;
  const canvas = createCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  const qrGradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
  qrGradient.addColorStop(0, '#16026eff');
  qrGradient.addColorStop(1, '#16026eff');

  const cornerRadius = moduleSize * 0.3;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qrCodeData.modules.get(row, col)) {
        const x = margin + col * moduleSize;
        const y = margin + row * moduleSize;

        const inTopLeft = row < 7 && col < 7;
        const inTopRight = row < 7 && col >= moduleCount - 7;
        const inBottomLeft = row >= moduleCount - 7 && col < 7;

        if (inTopLeft || inTopRight || inBottomLeft) continue;

        drawRoundedSquare(ctx, x, y, moduleSize, cornerRadius, qrGradient);
      }
    }
  }

  const finderSize = moduleSize * 7;
  const colors = {
    outer: finderColors.outer || '#16026eff',
    gap: finderColors.gap || '#70e0ffff',
    center: finderColors.center || '#7700ffff',
  };

  drawCircularFinder(ctx, margin + finderSize / 2, margin + finderSize / 2, finderSize, colors);
  drawCircularFinder(ctx, canvasSize - margin - finderSize / 2, margin + finderSize / 2, finderSize, colors);
  drawCircularFinder(ctx, margin + finderSize / 2, canvasSize - margin - finderSize / 2, finderSize, colors);
  drawRoundedCorner(ctx, canvasSize, margin, finderSize, cornerColor);

  if (logoBuffer) {
    const logo = await loadImage(logoBuffer);
    const logoSize = Math.round(canvasSize * 0.25);
    const logoX = Math.round((canvasSize - logoSize) / 2);
    const logoY = Math.round((canvasSize - logoSize) / 2);
    const padding = 12;
    ctx.beginPath();
    ctx.arc(
      logoX + logoSize / 2,
      logoY + logoSize / 2,
      logoSize / 2 + padding,
      0,
      Math.PI * 2,
      false
    );
    ctx.fillStyle = '#70e0ffff';
    ctx.fill();

    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  }

  return canvas.toDataURL('image/png');
};

const generateIdCard = async (student) => {
  if (!student || !student.name || !student.email || !student.uniqueId || !student.googleId) {
    throw new Error('Invalid student data for ID card generation.');
  }

  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    const logoImageBuffer = await fs.readFile(path.join(__dirname, 'logo_transparent.png'));
    const alternoxFont = await fs.readFile(path.join(__dirname, 'Alternox.otf'), 'base64');
    const logoDataUrlForHTML = `data:image/png;base64,${logoImageBuffer.toString('base64')}`;
    const alternoxFontDataUrl = `data:font/otf;base64,${alternoxFont}`;
    const qrCodeDataUrl = await createCustomQRCode(student.uniqueId, logoImageBuffer);

    const astronautImage = await fs.readFile(path.join(__dirname, 'astronaut.jpg'), 'base64');
    const astronautDataUrl = `data:image/jpeg;base64,${astronautImage}`;
    const htmlTemplate = `
      <html>
        <head>
          <title>SEDS CUSAT Digital ID</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
          <style>
            @font-face {
              font-family: 'Alternox';
              src: url(${alternoxFontDataUrl}) format('opentype');
            }

            body {
              font-family: 'Roboto Mono', monospace;
              width: 490px;
              height: 220px;
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: transparent;
            }

            .id-card-horizontal {
              width: 480px;
              height: 210px;
              border-radius: 16px;
              overflow: hidden;
              position: relative;
              border: 2px solid #00BFFF;
            }

            .background-image {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                object-fit: cover; z-index: 1; opacity: 0.9;
            }

            .id-card-horizontal::before {
                content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(135deg, rgba(16, 24, 61, 0.85), rgba(46, 31, 86, 0.8));
                z-index: 2;
            }
            
            .main-content {
              width: 100%; height: 100%;
              padding: 24px 24px 24px 24px;
              display: flex; align-items: center; justify-content: space-between;
              position: relative; z-index: 3; color: #EAEAEA; box-sizing: border-box;
            }
            
            .info-column, .qr-column { z-index: 4; }

            .info-column {
                display: flex; flex-direction: column; justify-content: space-between;
                height: 100%; flex: 1;
            }
            
            .qr-column {
                display: flex; flex-direction: column; align-items: center;
                justify-content: center; text-align: center; width: 150px;
            }
            
            .header-info .club-name {
                font-family: 'Alternox', sans-serif;
                font-size: 24px; letter-spacing: 2px; text-transform: uppercase; color: #FFFFFF;
            }
            
            .member-details { margin-top: auto; }
            .member-details .subtitle {
                font-size: 12px; font-weight: 700; text-transform: uppercase;
                color: #00BFFF; letter-spacing: 1px; margin-bottom: 8px;
            }

            .member-details h1 {
              font-family: 'Alternox', sans-serif;
              font-size: 20px; font-weight: 400; margin: 0; line-height: 1.1;
              word-break: break-word; color: #FFFFFF;
            }
            
            /* --- MODIFIED: Adjusted email font size --- */
            .member-details p {
              font-family: 'Roboto Mono', monospace;
              font-size: 13px; /* Slightly smaller for better hierarchy */
              margin: 12px 0 0; word-break: break-all;
              color: #EAEAEA; opacity: 0.8;
            }
            
            .qr-code {
                background: #00a6ffff; padding: 6px; border-radius: 8px;
                  width: 150px; height: 150px;
            }
          </style>
        </head>
        <body>
          <div class="id-card-horizontal">
            <img src="${astronautDataUrl}" class="background-image" alt="Astronaut in space">
            <div class="main-content">
              <div class="info-column">
                <div class="header-info">
                  <div class="club-name">SEDS CUSAT</div>
                </div>
                <div class="member-details">
                  <div class="subtitle">MEMBER</div>
                  <h1>${student.name}</h1>
                  <p>${student.email}</p>
                </div>
              </div>
              <div class="qr-column">
                  <img src="${qrCodeDataUrl}" width="500" height="500" alt="QR Code" class="qr-code">
                  <!-- Serial number text is now removed -->
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const imagePath = path.join(TEMP_DIR, `${student.googleId}-id-card.png`);
    await nodeHtmlToImage({ output: imagePath, html: htmlTemplate });

    console.log(`Successfully generated ID card for ${student.name} at: ${imagePath}`);
    return imagePath;

  } catch (error) {
    console.error(`Error generating ID card for ${student.name}:`, error);
    throw new Error('Failed to generate the ID card.');
  }
};

module.exports = { generateIdCard };