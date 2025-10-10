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
 * Convert ID card element to high-quality image
 */
async function captureIDCardImage(
  element: HTMLElement,
  scale: number = 3,
): Promise<HTMLCanvasElement> {
  // Ensure element is visible and has dimensions
  if (!element || element.offsetWidth === 0 || element.offsetHeight === 0) {
    throw new Error('Element is not visible or has no dimensions');
  }

  console.log('Capturing element:', {
    width: element.offsetWidth,
    height: element.offsetHeight,
    tagName: element.tagName,
    className: element.className,
  });

  // Temporarily remove shadows and transitions for cleaner capture
  const originalBoxShadow = element.style.boxShadow;
  const originalTransition = element.style.transition;
  const originalTransform = element.style.transform;

  element.style.boxShadow = 'none';
  element.style.transition = 'none';
  element.style.transform = 'none';

  try {
    const canvas = await html2canvas(element, {
      scale: scale, // Higher scale for better quality
      useCORS: true, // Handle cross-origin images
      allowTaint: true, // Allow tainted canvas for cross-origin
      backgroundColor: '#ffffff',
      logging: true, // Enable logging for debugging
      imageTimeout: 15000, // Increase timeout for images
      removeContainer: false,
      foreignObjectRendering: false, // Disable for better compatibility
      width: element.offsetWidth,
      height: element.offsetHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      x: 0,
      y: 0,
    });

    console.log('Canvas created:', {
      width: canvas.width,
      height: canvas.height,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Generated canvas has no dimensions');
    }

    return canvas;
  } catch (error) {
    console.error('Error capturing element:', error);
    throw error;
  } finally {
    // Restore original styles
    element.style.boxShadow = originalBoxShadow;
    element.style.transition = originalTransition;
    element.style.transform = originalTransform;
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
  const loadingToast = toast.loading('Generating PDF...', {
    description: 'Please wait while we create your ID card PDF',
  });

  try {
    console.log('Starting PDF generation for:', cardHolderName);

    // Capture the ID card as high-quality image
    const canvas = await captureIDCardImage(cardElement, 4); // Increase to 4x for even better quality
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Verify we have valid image data
    if (!imgData || imgData === 'data:,') {
      throw new Error('Failed to capture ID card image');
    }

    // Get actual dimensions from canvas
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    console.log('Canvas dimensions:', { imgWidth, imgHeight });

    // Create PDF with exact ID card dimensions
    // Convert pixels to mm (assuming 96 DPI: 1 inch = 25.4mm, 96px = 25.4mm)
    const pxToMm = 25.4 / 96;
    const pdfWidth = (imgWidth / 4) * pxToMm; // Divide by scale factor
    const pdfHeight = (imgHeight / 4) * pxToMm;

    console.log('PDF dimensions (mm):', { pdfWidth, pdfHeight });

    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
      compress: true,
    });

    // Add image to PDF (exact fit, no margins)
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

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
    const safeName = cardHolderName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `ID_Card_${safeName}_${timestamp}.pdf`;

    console.log('Saving PDF as:', filename);

    // Save PDF
    pdf.save(filename);

    toast.dismiss(loadingToast);
    toast.success('PDF Downloaded Successfully! 🎉', {
      description: `Saved as ${filename}`,
      duration: 4000,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.dismiss(loadingToast);
    toast.error('Failed to Generate PDF', {
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
  const loadingToast = toast.loading('Preparing Print...', {
    description: 'Creating print preview',
  });

  try {
    console.log('Starting print preparation for:', cardHolderName);

    // Capture the ID card as high-quality image
    const canvas = await captureIDCardImage(cardElement, 4); // 4x scale for crisp print
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Verify we have valid image data
    if (!imgData || imgData === 'data:,') {
      throw new Error('Failed to capture ID card image');
    }

    // Calculate dimensions for print (maintain aspect ratio)
    const imgWidth = canvas.width / 4; // Actual pixel width after scaling
    const imgHeight = canvas.height / 4;
    const aspectRatio = imgWidth / imgHeight;

    console.log('Print dimensions:', { imgWidth, imgHeight, aspectRatio });

    // Standard ID card size in mm (CR80: 85.6 x 53.98mm)
    let printWidth = 85.6;
    let printHeight = 53.98;

    // Adjust if aspect ratio is different
    if (Math.abs(aspectRatio - 85.6 / 53.98) > 0.1) {
      if (aspectRatio > 1) {
        // Landscape
        printHeight = printWidth / aspectRatio;
      } else {
        // Portrait
        printWidth = printHeight * aspectRatio;
      }
    }

    // Create print window
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      throw new Error(
        'Failed to open print window. Please allow popups for this site.',
      );
    }

    // Create print document
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
              size: ${printWidth}mm ${printHeight}mm;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }

            .print-container {
              background: white;
              padding: 30px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              border-radius: 12px;
              max-width: 95%;
            }

            .id-card-wrapper {
              display: flex;
              justify-content: center;
              align-items: center;
              width: ${printWidth}mm;
              height: ${printHeight}mm;
              page-break-after: avoid;
              page-break-inside: avoid;
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }

            .id-card {
              width: 100%;
              height: 100%;
              display: block;
              object-fit: contain;
            }

            .no-print {
              margin-top: 25px;
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 8px;
              color: white;
            }

            .no-print h2 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: 700;
            }

            .no-print p {
              margin: 8px 0;
              font-size: 15px;
              opacity: 0.95;
            }

            .no-print .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin: 15px 0;
              padding: 15px;
              background: rgba(255,255,255,0.1);
              border-radius: 6px;
              backdrop-filter: blur(10px);
            }

            .no-print .info-item {
              text-align: left;
              padding: 8px;
              background: rgba(255,255,255,0.15);
              border-radius: 4px;
            }

            .no-print .info-label {
              font-size: 12px;
              opacity: 0.8;
              margin-bottom: 4px;
            }

            .no-print .info-value {
              font-size: 14px;
              font-weight: 600;
            }

            .button-group {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-top: 20px;
            }

            .no-print button {
              padding: 14px 28px;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              display: inline-flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }

            .print-button {
              background: white;
              color: #667eea;
            }

            .print-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }

            .cancel-button {
              background: rgba(255,255,255,0.2);
              color: white;
              border: 2px solid rgba(255,255,255,0.3);
            }

            .cancel-button:hover {
              background: rgba(255,255,255,0.3);
              transform: translateY(-2px);
            }

            @media print {
              body {
                background: white;
              }

              .print-container {
                padding: 0;
                box-shadow: none;
                border-radius: 0;
              }

              .no-print {
                display: none !important;
              }

              .id-card-wrapper {
                width: ${printWidth}mm;
                height: ${printHeight}mm;
                margin: 0;
                padding: 0;
                border: none;
                box-shadow: none;
                border-radius: 0;
              }
            }

            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }

            .print-container {
              animation: fadeIn 0.4s ease-out;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="id-card-wrapper">
              <img src="${imgData}" alt="ID Card - ${cardHolderName}" class="id-card" />
            </div>
            
            <div class="no-print">
              <h2>🎫 Ready to Print</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Card Holder</div>
                  <div class="info-value">${cardHolderName}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Card Size</div>
                  <div class="info-value">${printWidth.toFixed(1)} × ${printHeight.toFixed(1)} mm</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Format</div>
                  <div class="info-value">Standard ID Card</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Quality</div>
                  <div class="info-value">High Resolution</div>
                </div>
              </div>
              <p style="font-size: 13px; margin-top: 10px; opacity: 0.9;">
                💡 Tip: Use high-quality card stock for best results
              </p>
              <div class="button-group">
                <button class="print-button" onclick="window.print()">
                  🖨️ Print Now
                </button>
                <button class="cancel-button" onclick="window.close()">
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for images to load
    setTimeout(() => {
      toast.dismiss(loadingToast);
      toast.success('Print Preview Opened! 🖨️', {
        description: 'Configure your printer and click "Print Now"',
        duration: 4000,
      });
    }, 500);
  } catch (error) {
    console.error('Error preparing print:', error);
    toast.dismiss(loadingToast);
    toast.error('Failed to Prepare Print', {
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
