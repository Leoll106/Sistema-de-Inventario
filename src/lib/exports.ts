import type { Product, Movement } from '@/types'
import { formatDateShort } from './utils'

// ─── PDF ────────────────────────────────────────────
export async function exportInventarioPDF(products: Product[]) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('StockFlow — Inventario', 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generado: ${new Date().toLocaleString('es-HN')}  |  Total: ${products.length} productos`, 14, 26)

  doc.setFontSize(8)
  const headers = ['Código', 'Producto', 'Categoría', 'Ubic.', 'Stock', 'Mín.', 'Estado']
  const widths  = [22, 58, 28, 16, 14, 14, 20]
  let y = 36, x = 14

  doc.setFillColor(240, 240, 240)
  doc.rect(12, y - 5, 186, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(60)
  headers.forEach((h, i) => { doc.text(h, x, y); x += widths[i] })
  y += 8
  doc.setFont('helvetica', 'normal')

  products.forEach((p) => {
    if (y > 275) { doc.addPage(); y = 20 }
    const status = p.stock === 0 ? 'CRÍTICO' : p.stock <= p.min_stock ? 'BAJO' : 'OK'
    const vals = [p.code, p.name.slice(0, 30), p.categories?.name ?? '—', p.location, String(p.stock), String(p.min_stock), status]
    x = 14
    if (p.stock <= p.min_stock) doc.setTextColor(200, 50, 50)
    else doc.setTextColor(30, 30, 30)
    vals.forEach((v, i) => { doc.text(v, x, y); x += widths[i] })
    y += 7
  })

  doc.save(`inventario_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export async function exportHistorialPDF(movements: Movement[]) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF('l', 'mm', 'a4')

  doc.setFontSize(16); doc.text('StockFlow — Historial de Movimientos', 14, 16)
  doc.setFontSize(9); doc.setTextColor(120)
  doc.text(`Generado: ${new Date().toLocaleString('es-HN')}  |  Total: ${movements.length} movimientos`, 14, 23)
  doc.setTextColor(0)

  const headers = ['Fecha', 'Tipo', 'Producto', 'Cant.', 'Referencia', 'Usuario', 'Saldo']
  const widths  = [40, 22, 75, 16, 35, 40, 20]
  let y = 33, x = 14

  doc.setFillColor(240, 240, 240)
  doc.rect(12, y - 5, 270, 7, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  headers.forEach((h, i) => { doc.text(h, x, y); x += widths[i] })
  y += 7; doc.setFont('helvetica', 'normal')

  movements.forEach((m) => {
    if (y > 190) { doc.addPage(); y = 20 }
    if (m.type === 'ENTRADA') doc.setTextColor(0, 140, 70)
    else if (m.type === 'SALIDA') doc.setTextColor(180, 40, 40)
    else doc.setTextColor(80, 80, 180)
    const vals = [
      formatDateShort(m.created_at), m.type,
      (m.products?.name ?? '—').slice(0, 35),
      String(m.quantity), m.reference ?? '—',
      m.user_name ?? '—', String(m.balance),
    ]
    x = 14; vals.forEach((v, i) => { doc.text(v, x, y); x += widths[i] })
    doc.setTextColor(0); y += 6
  })

  doc.save(`historial_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export async function exportAlertasPDF(products: Product[]) {
  const alerts = products.filter((p) => p.stock <= p.min_stock)
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  doc.setFontSize(16); doc.text('StockFlow — Alertas de Stock', 14, 16)
  doc.setFontSize(9); doc.setTextColor(200, 50, 50)
  doc.text(`⚠ ${alerts.length} productos requieren reposición · ${new Date().toLocaleString('es-HN')}`, 14, 24)
  doc.setTextColor(0)

  let y = 34
  alerts.forEach((p) => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text(`${p.code} — ${p.name}`, 14, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100)
    doc.text(`Stock: ${p.stock} / Mínimo: ${p.min_stock} / Déficit: ${p.min_stock - p.stock} ${p.unit} / ${p.location}`, 14, y + 5)
    doc.setTextColor(0); y += 14
  })
  doc.save(`alertas_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ─── EXCEL ──────────────────────────────────────────
export async function exportInventarioExcel(products: Product[]) {
  const XLSX = await import('xlsx')
  const data = [['Código', 'Nombre', 'Categoría', 'Unidad', 'Ubicación', 'Stock', 'Mínimo', 'Precio', 'Estado']]
  products.forEach((p) => {
    const s = p.stock === 0 ? 'CRÍTICO' : p.stock <= p.min_stock ? 'BAJO' : 'OK'
    data.push([p.code, p.name, p.categories?.name ?? '', p.unit, p.location, p.stock as unknown as string, p.min_stock as unknown as string, p.price as unknown as string, s])
  })
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario')
  XLSX.writeFile(wb, `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export async function exportHistorialExcel(movements: Movement[]) {
  const XLSX = await import('xlsx')
  const data = [['Fecha', 'Tipo', 'Producto', 'Código', 'Cantidad', 'Referencia', 'Usuario', 'Saldo', 'Notas']]
  movements.forEach((m) => {
    data.push([
      formatDateShort(m.created_at), m.type,
      m.products?.name ?? '—', m.products?.code ?? '—',
      m.quantity as unknown as string, m.reference ?? '',
      m.user_name ?? '', m.balance as unknown as string, m.notes ?? '',
    ])
  })
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Historial')
  XLSX.writeFile(wb, `historial_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
