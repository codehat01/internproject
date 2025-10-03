declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf'

  interface AutoTableOptions {
    startY?: number
    head?: any[][]
    body?: any[][]
    theme?: 'striped' | 'grid' | 'plain'
    headStyles?: any
    styles?: any
    margin?: any
  }

  export default function autoTable(doc: jsPDF, options: AutoTableOptions): void
}
