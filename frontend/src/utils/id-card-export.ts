/**
 * =============================================================================
 * ID Card Export Utilities
 * =============================================================================
 * Professional print and PDF export utilities for ID cards
 * =============================================================================
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

/**
 * Wait for all images to load in an element
 */
async function waitForImagesToLoad(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      // Timeout after 5 seconds
      setTimeout(resolve, 5000);
    });
  });
  await Promise.all(imagePromises);
}

/**
 * Convert ID card element to high-quality image
 */
async function captureIDCardImage(
  element: HTMLElement,
  scale: number = 4,
): Promise<HTMLCanvasElement> {
  // Wait for all images to load
  await waitForImagesToLoad(element);

  // Small delay to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const canvas = await html2canvas(element, {
      scale: scale, // Higher scale for better quality
      useCORS: true, // Handle cross-origin images
      allowTaint: true, // Allow tainted canvas
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 15000, // 15 second timeout for images
      removeContainer: false,
      foreignObjectRendering: false, // Disable for better compatibility
      width: element.offsetWidth,
      height: element.offsetHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      x: 0,
      y: 0,
    });

    return canvas;
  } catch (error) {
    console.error('Error capturing ID card:', error);
    throw new Error('Failed to capture ID card. Please try again.');
  }
}

/**
 * Download ID card as PDF
 */
export async function downloadIDCardAsPDF(
  cardElement: HTMLElement,
  cardHolderName: string,
  templateName: string,
): Promise<void> {
  const loadingToast = toast.loading('Preparing ID card for PDF export...');

  try {
    // Capture the ID card as high-quality image
    toast.loading('Capturing ID card...', { id: loadingToast });
    const canvas = await captureIDCardImage(cardElement, 4);

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Failed to capture ID card - canvas is empty');
    }

    toast.loading('Generating PDF document...', { id: loadingToast });
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Get actual dimensions from canvas
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Create PDF with exact ID card dimensions
    // Convert pixels to mm (assuming 96 DPI: 1 inch = 25.4mm, 96px = 25.4mm)
    const pxToMm = 25.4 / 96;
    const pdfWidth = (imgWidth * pxToMm) / 4; // Divide by scale
    const pdfHeight = (imgHeight * pxToMm) / 4;

    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true,
    });

    // Add image to PDF (exact fit, no margins)
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

    // Add metadata
    pdf.setProperties({
      title: `ID Card - ${cardHolderName}`,
      subject: `${templateName} ID Card`,
      author: 'School Management System',
      keywords: 'id card, school, identification',
      creator: 'School Management System',
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ID_Card_${cardHolderName.replace(/\s+/g, '_')}_${timestamp}.pdf`;

    // Save PDF
    toast.loading('Saving PDF...', { id: loadingToast });
    pdf.save(filename);

    toast.success('PDF downloaded successfully!', {
      id: loadingToast,
      description: `Saved as ${filename}`,
      duration: 4000,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF', {
      id: loadingToast,
      description:
        error instanceof Error
          ? error.message
          : 'Please try again or contact support.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Print ID card with professional styling
 */
export async function printIDCard(
  cardElement: HTMLElement,
  cardHolderName: string,
): Promise<void> {
  const loadingToast = toast.loading('Preparing ID card for printing...');

  try {
    // Capture the ID card as high-quality image
    toast.loading('Capturing ID card...', { id: loadingToast });
    const canvas = await captureIDCardImage(cardElement, 4);

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Failed to capture ID card - canvas is empty');
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Calculate dimensions for print (maintain aspect ratio)
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Convert to mm for printing (standard CR80 card: 85.6 x 53.98mm)
    const pxToMm = 25.4 / 96;
    const printWidthMm = (imgWidth * pxToMm) / 4; // Divide by scale
    const printHeightMm = (imgHeight * pxToMm) / 4;

    toast.loading('Opening print preview...', { id: loadingToast });

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      throw new Error(
        'Failed to open print window. Please allow popups in your browser.',
      );
    }

    // Create print document with improved styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Print ID Card - ${cardHolderName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            @page {
              size: ${printWidthMm}mm ${printHeightMm}mm;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }

            .print-container {
              background: white;
              padding: 30px;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              max-width: 800px;
              width: 100%;
            }

            .id-card-wrapper {
              display: flex;
              justify-content: center;
              align-items: center;
              width: ${printWidthMm}mm;
              height: ${printHeightMm}mm;
              margin: 0 auto;
              page-break-after: avoid;
              page-break-inside: avoid;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }

            .id-card {
              width: 100%;
              height: 100%;
              display: block;
              object-fit: contain;
            }

            .info-section {
              margin-top: 30px;
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
              color: white;
            }

            .info-section h2 {
              font-size: 24px;
              margin-bottom: 12px;
              font-weight: 600;
            }

            .info-section p {
              margin: 8px 0;
              font-size: 16px;
              opacity: 0.95;
            }

            .info-section .dimensions {
              font-family: 'Courier New', monospace;
              background: rgba(255, 255, 255, 0.2);
              padding: 8px 16px;
              border-radius: 8px;
              display: inline-block;
              margin-top: 12px;
            }

            .button-container {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-top: 30px;
            }

            .button-container button {
              padding: 14px 28px;
              border: none;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              font-family: inherit;
            }

            .print-button {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }

            .print-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }

            .cancel-button {
              background: #e5e7eb;
              color: #374151;
            }

            .cancel-button:hover {
              background: #d1d5db;
              transform: translateY(-2px);
            }

            @media print {
              body {
                background: white;
                padding: 0;
              }

              .print-container {
                padding: 0;
                box-shadow: none;
                border-radius: 0;
                max-width: none;
              }

              .info-section,
              .button-container {
                display: none !important;
              }

              .id-card-wrapper {
                width: ${printWidthMm}mm;
                height: ${printHeightMm}mm;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border-radius: 0;
                page-break-inside: avoid;
              }

              @page {
                margin: 0;
              }
            }

            .loading {
              display: inline-block;
              width: 20px;
              height: 20px;
              border: 3px solid rgba(255,255,255,.3);
              border-radius: 50%;
              border-top-color: white;
              animation: spin 1s ease-in-out infinite;
            }

            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="id-card-wrapper">
              <img src="${imgData}" alt="ID Card - ${cardHolderName}" class="id-card" onload="document.getElementById('loading').style.display='none'" />
            </div>
            
            <div class="info-section">
              <h2>✓ Ready to Print</h2>
              <p><strong>Card Holder:</strong> ${cardHolderName}</p>
              <p class="dimensions">Card Size: ${printWidthMm.toFixed(1)}mm × ${printHeightMm.toFixed(1)}mm</p>
            </div>

            <div class="button-container">
              <button class="print-button" onclick="window.print()">
                🖨️ Print ID Card
              </button>
              <button class="cancel-button" onclick="window.close()">
                ✕ Cancel
              </button>
            </div>
          </div>

          <script>
            // Auto-focus print button
            document.querySelector('.print-button').focus();
            
            // Keyboard shortcut: Ctrl+P or Cmd+P
            document.addEventListener('keydown', function(e) {
              if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
              }
              // ESC to close
              if (e.key === 'Escape') {
                window.close();
              }
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();

    toast.success('Print preview ready!', {
      id: loadingToast,
      description: 'Configure your printer settings and print.',
      duration: 3000,
    });
  } catch (error) {
    console.error('Error printing ID card:', error);
    toast.error('Failed to prepare print', {
      id: loadingToast,
      description: error instanceof Error ? error.message : 'Please try again.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Print multiple ID cards (for bulk printing)
 */
export async function printMultipleIDCards(
  cardElements: HTMLElement[],
  cardNames: string[],
): Promise<void> {
  try {
    if (cardElements.length === 0) {
      toast.error('No cards to print');
      return;
    }

    toast.loading(`Preparing ${cardElements.length} cards for printing...`);

    // Capture all cards as images
    const imagePromises = cardElements.map(el => captureIDCardImage(el, 3));
    const canvases = await Promise.all(imagePromises);
    const imageDataArray = canvases.map(canvas =>
      canvas.toDataURL('image/png', 1.0),
    );

    // Create print window
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups.');
    }

    // Generate HTML for all cards
    const cardsHTML = imageDataArray
      .map(
        (imgData, index) => `
      <div class="id-card-wrapper">
        <img src="${imgData}" alt="ID Card - ${cardNames[index]}" class="id-card" />
      </div>
    `,
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Print Multiple ID Cards</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { margin: 0; padding: 20px; font-family: sans-serif; }
            .cards-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 15mm; 
              margin-bottom: 20px;
            }
            .id-card-wrapper { 
              page-break-inside: avoid; 
              display: flex; 
              justify-content: center; 
              align-items: center;
              border: 1px dashed #ccc;
              padding: 5mm;
            }
            .id-card { max-width: 100%; height: auto; display: block; }
            .no-print { text-align: center; margin: 20px 0; }
            @media print {
              .no-print { display: none !important; }
              .id-card-wrapper { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <h2>Print ${cardElements.length} ID Cards</h2>
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; margin: 10px;">🖨️ Print All</button>
            <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; margin: 10px;">✕ Cancel</button>
          </div>
          <div class="cards-grid">${cardsHTML}</div>
        </body>
      </html>
    `);

    printWindow.document.close();

    toast.dismiss();
    toast.success('Multiple cards ready to print!');
  } catch (error) {
    console.error('Error preparing bulk print:', error);
    toast.dismiss();
    toast.error('Failed to prepare bulk print');
  }
}
