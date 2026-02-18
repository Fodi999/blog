'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PrintButton() {
  const t = useTranslations('blog');

  const downloadPdf = async () => {
    const element = document.getElementById('recipe-pdf');
    if (!element) return;

    // Add loading state or feedback if needed
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      ignoreElements: (el) => {
        return el.classList?.contains('no-pdf');
      },
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const canvasHeightInMm = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, canvasHeightInMm);
    pdf.save('tech-card.pdf');
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
            <p className="text-sm text-muted-foreground">
              {t('downloadPdfDesc') || 'A4 Format • Professional Layout'}
            </p>
          </div>
        </div>
        <Button 
          onClick={downloadPdf} 
          size="lg"
          className="group relative flex items-center gap-2 rounded-xl bg-foreground px-6 py-6 text-sm font-bold text-background transition-all hover:bg-foreground/90 hover:shadow-xl active:scale-95"
        >
          <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          <span>{t('downloadBtn') || 'Download PDF'}</span>
        </Button>
      </div>
    </Card>
  );
}
