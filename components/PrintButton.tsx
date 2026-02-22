'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown, Download, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export function PrintButton() {
  const t = useTranslations('blog');
  const [isLoading, setIsLoading] = useState(false);

  const downloadPdf = async () => {
    const element = document.getElementById('recipe-pdf');
    if (!element) {
      toast.error(t('pdfContentNotFound') || 'Content not found');
      return;
    }

    // Save scroll position
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    try {
      setIsLoading(true);

      // Backup and fix potential oklch color issues for html2canvas
      const rootStyle = document.documentElement.style;
      const originalPrimary = rootStyle.getPropertyValue('--primary');
      const originalBackground = rootStyle.getPropertyValue('--background');
      const originalForeground = rootStyle.getPropertyValue('--foreground');
      const originalCard = rootStyle.getPropertyValue('--card');
      const originalBorder = rootStyle.getPropertyValue('--border');

      // Set explicit RGB values that html2canvas understands
      // Using standard sRGB equivalent for 239 68 68 (red-500)
      rootStyle.setProperty('--primary', '239, 68, 68');
      rootStyle.setProperty('--background', '255, 255, 255');
      rootStyle.setProperty('--foreground', '9, 9, 11');
      rootStyle.setProperty('--card', '255, 255, 255');
      rootStyle.setProperty('--border', '228, 228, 231');

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        ignoreElements: (el) => el.classList?.contains('no-pdf'),
      });

      // Restore original values
      rootStyle.setProperty('--primary', originalPrimary);
      rootStyle.setProperty('--background', originalBackground);
      rootStyle.setProperty('--foreground', originalForeground);
      rootStyle.setProperty('--card', originalCard);
      rootStyle.setProperty('--border', originalBorder);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const imgWidthMm = (imgWidth * 0.264583);
      const imgHeightMm = (imgHeight * 0.264583);

      const scale = Math.min(
        pageWidth / imgWidthMm,
        pageHeight / imgHeightMm
      );

      const finalWidth = imgWidthMm * scale;
      const finalHeight = imgHeightMm * scale;

      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      pdf.save('tech-card.pdf');
      toast.success(t('pdfSuccess') || 'PDF downloaded successfully');

    } catch (error) {
      console.error(error);
      toast.error(t('pdfError') || 'Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="my-8 overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 to-transparent p-6 dark:from-primary/10">
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <FileDown className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold tracking-tight text-foreground">
              {t('downloadPdfTitle') || 'Download Tech Card'}
            </h4>
            <p className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span>{t('downloadPdfDesc') || 'A4 Format • Professional Standard'}</span>
              <span className="hidden sm:inline text-muted-foreground/30">•</span>
              <span className="text-primary font-bold text-[10px] uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md w-fit">
                {t('desktopOnly') || 'Desktop Only'}
              </span>
            </p>
          </div>
        </div>
        <Button 
          onClick={downloadPdf} 
          disabled={isLoading}
          size="lg"
          title={t('desktopOnly') || 'Desktop Only'}
          className="group relative flex items-center gap-2 rounded-xl bg-foreground px-6 py-6 text-sm font-bold text-background transition-all hover:bg-foreground/90 hover:shadow-xl active:scale-95 disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          )}
          <span>
            {isLoading
              ? t('pdfGenerating') || 'Generating...'
              : t('downloadBtn') || 'Download PDF'}
          </span>
        </Button>
      </div>
    </Card>
  );
}
