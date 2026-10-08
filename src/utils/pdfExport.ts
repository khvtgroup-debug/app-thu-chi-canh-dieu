import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  margin?: number; // mm
  onProgress?: (status: string) => void;
}

/**
 * Xuất một phần tử DOM bất kỳ sang tệp PDF chất lượng cao (A4)
 */
export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const { filename = 'Bao_Cao.pdf', margin = 10, onProgress } = options;

  if (onProgress) onProgress('Đang chuẩn bị trang in...');

  // Scroll to top of element to ensure full render
  const originalScrollTop = element.scrollTop;
  element.scrollTop = 0;

  try {
    if (onProgress) onProgress('Đang kết xuất hình ảnh sắc nét...');

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (retina)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    if (onProgress) onProgress('Đang tạo tệp PDF...');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Standard A4 dimensions in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210; // mm
    const pageHeight = 297; // mm
    const contentWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    // Add additional pages if content exceeds A4 height
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    if (onProgress) onProgress('Đang tải tệp PDF về máy...');
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } finally {
    element.scrollTop = originalScrollTop;
    if (onProgress) onProgress('');
  }
}
