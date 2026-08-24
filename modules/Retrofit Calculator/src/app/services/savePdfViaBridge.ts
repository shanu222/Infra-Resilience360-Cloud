/**
 * Retrofit Calculator PDF saver — prefers the shared Capacitor/iframe bridge.
 */
import type { jsPDF } from 'jspdf'
import { saveJsPdfDocument } from '@resilience/save-pdf-document'

export async function saveRetrofitPdf(pdf: jsPDF, filename: string): Promise<void> {
  await saveJsPdfDocument(pdf, filename)
}
