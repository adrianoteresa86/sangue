import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type Periodo = 'diario' | 'semanal' | 'mensal' | 'personalizado';

function fmt(d: Date) {
  return d.toLocaleDateString('pt-PT');
}

export function intervaloPeriodo(
  periodo: Periodo,
  customInicio?: string,
  customFim?: string,
): { inicio: Date; fim: Date; label: string } {
  const fim    = new Date();
  const inicio = new Date();

  if (periodo === 'diario') {
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    return { inicio, fim, label: `Hoje — ${fmt(inicio)}` };
  }
  if (periodo === 'semanal') {
    inicio.setDate(inicio.getDate() - 6);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, fim, label: `${fmt(inicio)} a ${fmt(fim)}` };
  }
  if (periodo === 'mensal') {
    inicio.setDate(inicio.getDate() - 30);
    inicio.setHours(0, 0, 0, 0);
    return { inicio, fim, label: `Últimos 30 dias (${fmt(inicio)} a ${fmt(fim)})` };
  }
  // personalizado
  const ini = customInicio ? new Date(customInicio + 'T00:00:00') : new Date(0);
  const fi  = customFim    ? new Date(customFim + 'T23:59:59')    : new Date();
  return { inicio: ini, fim: fi, label: `${fmt(ini)} a ${fmt(fi)}` };
}

interface OpcoesRelatorio {
  titulo:     string;
  subtitulo:  string;
  periodo:    string;
  cabecalhos: string[];
  linhas:     (string | number)[][];
  rodape?:    string;
}

export function gerarRelatorioPDF(opcoes: OpcoesRelatorio) {
  const doc     = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const largura = doc.internal.pageSize.getWidth();
  const altura  = doc.internal.pageSize.getHeight();

  // Cabeçalho vermelho
  doc.setFillColor(153, 27, 27);
  doc.rect(0, 0, largura, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(opcoes.titulo, 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(opcoes.subtitulo, 14, 19);
  doc.text(`Período: ${opcoes.periodo}`, largura - 14, 19, { align: 'right' });

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(7);
  doc.text(`Emitido em ${new Date().toLocaleString('pt-PT')}`, largura - 14, 12, { align: 'right' });

  autoTable(doc, {
    startY: 34,
    head:   [opcoes.cabecalhos],
    body:   opcoes.linhas,
    theme:  'grid',
    styles:             { fontSize: 8, cellPadding: 3, valign: 'middle', overflow: 'linebreak' },
    headStyles:         { fillColor: [153, 27, 27], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [250, 245, 245] },
    margin: { top: 34, bottom: 14 },
    didDrawPage: () => {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('DoarFazBem · Sistema de Gestão de Sangue de Angola', largura / 2, altura - 6, { align: 'center' });
    },
  });

  if (opcoes.rodape) {
    const tbl = (doc as any).lastAutoTable;
    const y   = tbl ? tbl.finalY + 6 : altura - 20;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(opcoes.rodape, 14, y);
  }

  const nome = `${opcoes.titulo.replace(/\s+/g, '_')}_${opcoes.periodo.replace(/[\s—/]/g, '_')}.pdf`;
  doc.save(nome);
}
