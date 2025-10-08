import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import {
  PDFGenerationOptions,
  TemplateFieldData,
  PersonData,
} from './interfaces/pdf-generation.interface';

@Injectable()
export class PDFGenerationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate PDF for ID card using template and person data
   */
  async generateIDCardPDF(options: PDFGenerationOptions): Promise<string> {
    const { template, personData, qrCodeData, outputPath } = options;

    // Ensure output directory exists
    const outputDir = join(process.cwd(), 'uploads', 'id-cards');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const fullOutputPath = join(outputDir, outputPath);

    return new Promise((resolve, reject) => {
      try {
        // Parse template dimensions
        const [width, height] = this.parseDimensions(template.dimensions);

        // Create PDF document with template dimensions
        const doc = new PDFDocument({
          size: [width, height],
          margins: {
            top: template.printMargin || 5,
            bottom: template.printMargin || 5,
            left: template.printMargin || 5,
            right: template.printMargin || 5,
          },
        });

        // Pipe to file
        const stream = createWriteStream(fullOutputPath);
        doc.pipe(stream);

        // Set background color
        if (
          template.backgroundColor &&
          template.backgroundColor !== '#ffffff'
        ) {
          doc.rect(0, 0, width, height).fill(template.backgroundColor);
        }

        // Add background image if exists
        if (template.backgroundImage) {
          try {
            doc.image(template.backgroundImage, 0, 0, { width, height });
          } catch (err) {
            console.warn('Failed to load background image:', err);
          }
        }

        // Add border if specified
        if (template.borderWidth && template.borderWidth > 0) {
          doc
            .rect(0, 0, width, height)
            .lineWidth(template.borderWidth)
            .stroke(template.borderColor || '#000000');
        }

        // Process template fields
        this.processTemplateFields(
          doc,
          template.fields,
          personData,
          qrCodeData,
          width,
          height,
        );

        // Finalize PDF
        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', error => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process template fields and add them to PDF
   */
  private processTemplateFields(
    doc: PDFKit.PDFDocument,
    fields: TemplateFieldData[],
    personData: PersonData,
    qrCodeData: string,
    _pageWidth: number,
    _pageHeight: number,
  ) {
    // Sort fields by z-index to ensure proper layering
    const sortedFields = [...fields].sort(
      (a, b) => (a.zIndex || 1) - (b.zIndex || 1),
    );

    for (const field of sortedFields) {
      try {
        this.processField(
          doc,
          field,
          personData,
          qrCodeData,
          _pageWidth,
          _pageHeight,
        );
      } catch (error) {
        // Log error for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error processing field ${field.label}:`, error);
        }
      }
    }
  }

  /**
   * Process individual field
   */
  private async processField(
    doc: PDFKit.PDFDocument,
    field: TemplateFieldData,
    personData: PersonData,
    qrCodeData: string,
    _pageWidth: number,
    _pageHeight: number,
  ) {
    const x = field.x;
    const y = field.y;
    const width = field.width;
    const height = field.height;

    // Set field background if specified
    if (field.backgroundColor) {
      doc.rect(x, y, width, height).fill(field.backgroundColor);
    }

    // Set field border if specified
    if (field.borderWidth && field.borderWidth > 0) {
      doc
        .rect(x, y, width, height)
        .lineWidth(field.borderWidth)
        .stroke(field.borderColor || '#cccccc');
    }

    switch (field.fieldType) {
      case 'TEXT':
        this.addTextField(doc, field, personData);
        break;
      case 'IMAGE':
      case 'PHOTO':
      case 'LOGO':
        await this.addImageField(doc, field, personData);
        break;
      case 'QR_CODE':
        await this.addQRCodeField(doc, field, qrCodeData, personData);
        break;
      case 'BARCODE':
        await this.addBarcodeField(doc, field, personData);
        break;
      default:
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Unknown field type: ${field.fieldType}`);
        }
    }
  }

  /**
   * Add text field to PDF
   */
  private addTextField(
    doc: PDFKit.PDFDocument,
    field: TemplateFieldData,
    personData: PersonData,
  ) {
    let text = '';

    if (field.dataSource === 'static' && field.staticText) {
      text = field.staticText;
    } else if (field.dataSource === 'database' && field.databaseField) {
      text = this.getPersonDataValue(personData, field.databaseField) || '';
    }

    if (!text) return;

    // Set font properties
    const fontSize = field.fontSize || 12;
    // Map custom fonts to PDFKit built-in fonts
    const fontFamilyMap: Record<string, string> = {
      Inter: 'Helvetica',
      Arial: 'Helvetica',
      Roboto: 'Helvetica',
      'Times New Roman': 'Times-Roman',
      'Courier New': 'Courier',
      Georgia: 'Times-Roman',
    };

    const requestedFont = field.fontFamily || 'Helvetica';
    const fontFamily = fontFamilyMap[requestedFont] || 'Helvetica';
    const color = field.color || '#000000';

    doc.font(fontFamily).fontSize(fontSize).fillColor(color);

    // Calculate text alignment
    const textAlign = field.textAlign || 'LEFT';
    let textX = field.x;

    if (textAlign === 'CENTER') {
      const textWidth = doc.widthOfString(text);
      textX = field.x + (field.width - textWidth) / 2;
    } else if (textAlign === 'RIGHT') {
      const textWidth = doc.widthOfString(text);
      textX = field.x + field.width - textWidth;
    }

    // Add text with proper positioning
    const alignValue = textAlign.toLowerCase() as
      | 'left'
      | 'center'
      | 'right'
      | 'justify';
    doc.text(text, textX, field.y, {
      width: field.width,
      height: field.height,
      align: alignValue,
    });
  }

  /**
   * Add image field to PDF
   */
  private async addImageField(
    doc: PDFKit.PDFDocument,
    field: TemplateFieldData,
    personData: PersonData,
  ) {
    let imagePath = '';

    if (field.dataSource === 'static' && field.imageUrl) {
      imagePath = field.imageUrl;
    } else if (field.dataSource === 'database' && field.databaseField) {
      imagePath =
        this.getPersonDataValue(personData, field.databaseField) || '';
    }

    if (!imagePath) return;

    try {
      // Handle different image sources (URL, local path, etc.)
      if (imagePath.startsWith('http')) {
        // For URLs, you might want to download and cache the image first
        if (process.env.NODE_ENV === 'development') {
          console.warn('URL images not implemented yet:', imagePath);
        }
        return;
      }

      // For local files
      const fullImagePath = join(process.cwd(), 'uploads', imagePath);
      if (existsSync(fullImagePath)) {
        doc.image(fullImagePath, field.x, field.y, {
          width: field.width,
          height: field.height,
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding image:', error);
      }
    }
  }

  /**
   * Add QR code field to PDF
   */
  private async addQRCodeField(
    doc: PDFKit.PDFDocument,
    field: TemplateFieldData,
    qrCodeData: string,
    personData: PersonData,
  ) {
    try {
      let qrData = qrCodeData;

      // If field has specific QR data, use that instead
      if (field.qrData) {
        qrData = field.qrData;
      } else if (field.databaseField) {
        const fieldValue = this.getPersonDataValue(
          personData,
          field.databaseField,
        );
        if (fieldValue) {
          qrData = fieldValue;
        }
      }

      // Generate QR code as buffer
      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: Math.min(field.width, field.height),
        margin: 1,
      });

      // Add QR code to PDF
      doc.image(qrBuffer, field.x, field.y, {
        width: field.width,
        height: field.height,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error generating QR code:', error);
      }
    }
  }

  /**
   * Add barcode field to PDF (placeholder implementation)
   */
  private async addBarcodeField(
    doc: PDFKit.PDFDocument,
    field: TemplateFieldData,
    _personData: PersonData,
  ) {
    // Placeholder for barcode generation
    // You would implement actual barcode generation here
    if (process.env.NODE_ENV === 'development') {
      console.warn('Barcode generation not implemented yet');
    }

    // For now, just add a placeholder rectangle
    doc.rect(field.x, field.y, field.width, field.height).stroke('#cccccc');

    doc.fontSize(8).text('BARCODE', field.x, field.y + field.height / 2, {
      width: field.width,
      align: 'center',
    });
  }

  /**
   * Parse template dimensions string (e.g., "85.6x54mm" or "3.375x2.125in")
   */
  private parseDimensions(dimensionsStr: string): [number, number] {
    try {
      // Remove units and split
      const cleanDimensions = dimensionsStr.replace(/[a-zA-Z]/g, '');
      const [widthStr, heightStr] = cleanDimensions.split('x');

      let width = parseFloat(widthStr);
      let height = parseFloat(heightStr);

      // Convert to points (PDF unit)
      if (dimensionsStr.includes('mm')) {
        // Convert mm to points (1mm = 2.834645669 points)
        width *= 2.834645669;
        height *= 2.834645669;
      } else if (dimensionsStr.includes('in')) {
        // Convert inches to points (1in = 72 points)
        width *= 72;
        height *= 72;
      } else {
        // Assume points if no unit specified
        // Default to standard credit card size if parsing fails
        width = width || 243.78; // 85.6mm
        height = height || 153.07; // 54mm
      }

      return [width, height];
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error parsing dimensions:', error);
      }
      // Return standard credit card size as fallback
      return [243.78, 153.07]; // 85.6mm x 54mm in points
    }
  }

  /**
   * Get person data value by field path
   */
  private getPersonDataValue(
    personData: PersonData,
    fieldPath: string,
  ): string {
    try {
      const keys = fieldPath.split('.');
      let value = personData;

      for (const key of keys) {
        value = (value as any)?.[key];
      }

      if (value === null || value === undefined) {
        return '';
      }

      // Format dates
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }

      return String(value);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting person data value:', error);
      }
      return '';
    }
  }

  /**
   * Get PDF file URL for serving
   */
  getPDFUrl(filename: string): string {
    return `/api/id-cards/pdf/${filename}`;
  }
}
