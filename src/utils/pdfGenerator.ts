export async function exportReportPdf(filename: string): Promise<void> {
  const pages = Array.from(document.querySelectorAll<HTMLElement>('.a4-page'))
  if (pages.length === 0) {
    throw new Error('Nothing to export. Open the report preview and try again.')
  }
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
  document.body.classList.add('pdf-capture')
  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index]
      if (!page) continue
      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        width: page.offsetWidth,
        height: page.offsetHeight,
        onclone: (cloned) => {
          cloned.querySelectorAll('.letterhead-guide').forEach((node) => {
            if (node instanceof HTMLElement) node.style.display = 'none'
          })
        },
      })
      const image = canvas.toDataURL('image/png')
      if (index > 0) pdf.addPage()
      pdf.addImage(image, 'PNG', 0, 0, 210, 297)
    }
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
  } finally {
    document.body.classList.remove('pdf-capture')
  }
}

export function printReport(): void {
  window.print()
}
