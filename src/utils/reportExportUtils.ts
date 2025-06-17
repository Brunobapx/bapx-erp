
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  filename?: string;
  title?: string;
  subtitle?: string;
}

export const exportToPDF = (data: any, reportType: string, options: ExportOptions = {}) => {
  const doc = new jsPDF();
  const { filename = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`, title = 'Relatório Financeiro', subtitle } = options;

  // Header
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  if (subtitle) {
    doc.setFontSize(12);
    doc.text(subtitle, 20, 30);
  }

  // Date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, subtitle ? 40 : 30);

  let startY = subtitle ? 50 : 40;

  switch (reportType) {
    case 'cash-flow':
      autoTable(doc, {
        startY,
        head: [['Data', 'Descrição', 'Tipo', 'Valor', 'Saldo']],
        body: data.map((item: any) => [
          new Date(item.date).toLocaleDateString('pt-BR'),
          item.description,
          item.type === 'entrada' ? 'Entrada' : 'Saída',
          `R$ ${item.amount.toLocaleString('pt-BR')}`,
          `R$ ${item.balance.toLocaleString('pt-BR')}`
        ]),
      });
      break;

    case 'dre':
      autoTable(doc, {
        startY,
        head: [['Item', 'Valor', 'Percentual']],
        body: [
          ['Receitas', `R$ ${data.receitas.toLocaleString('pt-BR')}`, '100%'],
          ['Custos', `R$ ${data.custos.toLocaleString('pt-BR')}`, `${((data.custos / data.receitas) * 100).toFixed(1)}%`],
          ['Despesas', `R$ ${data.despesas.toLocaleString('pt-BR')}`, `${((data.despesas / data.receitas) * 100).toFixed(1)}%`],
          ['Lucro Bruto', `R$ ${data.lucro_bruto.toLocaleString('pt-BR')}`, `${data.margem_bruta.toFixed(1)}%`],
          ['Lucro Líquido', `R$ ${data.lucro_liquido.toLocaleString('pt-BR')}`, `${data.margem_liquida.toFixed(1)}%`],
        ],
      });
      break;

    case 'accounts-aging':
      autoTable(doc, {
        startY,
        head: [['Tipo', 'Descrição', 'Cliente/Fornecedor', 'Valor', 'Vencimento', 'Dias Atraso', 'Status']],
        body: data.map((item: any) => [
          item.type === 'receivable' ? 'A Receber' : 'A Pagar',
          item.description,
          item.client_name,
          `R$ ${item.amount.toLocaleString('pt-BR')}`,
          new Date(item.due_date).toLocaleDateString('pt-BR'),
          item.days_overdue.toString(),
          item.status
        ]),
      });
      break;

    case 'profit-analysis':
      autoTable(doc, {
        startY,
        head: [['Cliente', 'Total Vendas', 'Total Custos', 'Lucro', 'Margem %', 'Pedidos']],
        body: data.map((item: any) => [
          item.client_name,
          `R$ ${item.total_sales.toLocaleString('pt-BR')}`,
          `R$ ${item.total_cost.toLocaleString('pt-BR')}`,
          `R$ ${item.profit.toLocaleString('pt-BR')}`,
          `${item.margin.toFixed(1)}%`,
          item.orders_count.toString()
        ]),
      });
      break;

    case 'tax-report':
      autoTable(doc, {
        startY,
        head: [['Período', 'Base de Cálculo', 'ICMS', 'IPI', 'PIS', 'COFINS', 'Total Impostos']],
        body: data.map((item: any) => [
          new Date(item.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          `R$ ${item.tax_base.toLocaleString('pt-BR')}`,
          `R$ ${item.icms.toLocaleString('pt-BR')}`,
          `R$ ${item.ipi.toLocaleString('pt-BR')}`,
          `R$ ${item.pis.toLocaleString('pt-BR')}`,
          `R$ ${item.cofins.toLocaleString('pt-BR')}`,
          `R$ ${item.total_taxes.toLocaleString('pt-BR')}`
        ]),
      });
      break;

    case 'budget-variance':
      autoTable(doc, {
        startY,
        head: [['Categoria', 'Orçado', 'Realizado', 'Variação', 'Variação %']],
        body: data.map((item: any) => [
          item.category,
          `R$ ${item.budgeted.toLocaleString('pt-BR')}`,
          `R$ ${item.actual.toLocaleString('pt-BR')}`,
          `R$ ${item.variance.toLocaleString('pt-BR')}`,
          `${item.variance_percent.toFixed(1)}%`
        ]),
      });
      break;

    default:
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        autoTable(doc, {
          startY,
          head: [headers],
          body: data.map((item: any) => headers.map(header => String(item[header] || ''))),
        });
      }
  }

  doc.save(filename);
};

export const exportToExcel = (data: any, reportType: string, options: ExportOptions = {}) => {
  const { filename = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`, title = 'Relatório Financeiro' } = options;

  let worksheetData: any[][] = [];

  switch (reportType) {
    case 'cash-flow':
      worksheetData = [
        [title],
        [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
        [],
        ['Data', 'Descrição', 'Tipo', 'Valor', 'Saldo'],
        ...data.map((item: any) => [
          new Date(item.date).toLocaleDateString('pt-BR'),
          item.description,
          item.type === 'entrada' ? 'Entrada' : 'Saída',
          item.amount,
          item.balance
        ])
      ];
      break;

    case 'dre':
      worksheetData = [
        [title],
        [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
        [],
        ['Item', 'Valor', 'Percentual'],
        ['Receitas', data.receitas, '100%'],
        ['Custos', data.custos, `${((data.custos / data.receitas) * 100).toFixed(1)}%`],
        ['Despesas', data.despesas, `${((data.despesas / data.receitas) * 100).toFixed(1)}%`],
        ['Lucro Bruto', data.lucro_bruto, `${data.margem_bruta.toFixed(1)}%`],
        ['Lucro Líquido', data.lucro_liquido, `${data.margem_liquida.toFixed(1)}%`]
      ];
      break;

    case 'accounts-aging':
      worksheetData = [
        [title],
        [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
        [],
        ['Tipo', 'Descrição', 'Cliente/Fornecedor', 'Valor', 'Vencimento', 'Dias Atraso', 'Status'],
        ...data.map((item: any) => [
          item.type === 'receivable' ? 'A Receber' : 'A Pagar',
          item.description,
          item.client_name,
          item.amount,
          new Date(item.due_date).toLocaleDateString('pt-BR'),
          item.days_overdue,
          item.status
        ])
      ];
      break;

    case 'profit-analysis':
      worksheetData = [
        [title],
        [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
        [],
        ['Cliente', 'Total Vendas', 'Total Custos', 'Lucro', 'Margem %', 'Pedidos'],
        ...data.map((item: any) => [
          item.client_name,
          item.total_sales,
          item.total_cost,
          item.profit,
          item.margin,
          item.orders_count
        ])
      ];
      break;

    case 'tax-report':
      worksheetData = [
        [title],
        [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
        [],
        ['Período', 'Base de Cálculo', 'ICMS', 'IPI', 'PIS', 'COFINS', 'Total Impostos'],
        ...data.map((item: any) => [
          new Date(item.period + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          item.tax_base,
          item.icms,
          item.ipi,
          item.pis,
          item.cofins,
          item.total_taxes
        ])
      ];
      break;

    case 'budget-variance':
      worksheetData = [
        [title],
        [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
        [],
        ['Categoria', 'Orçado', 'Realizado', 'Variação', 'Variação %'],
        ...data.map((item: any) => [
          item.category,
          item.budgeted,
          item.actual,
          item.variance,
          item.variance_percent
        ])
      ];
      break;

    default:
      if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]);
        worksheetData = [
          [title],
          [`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
          [],
          headers,
          ...data.map((item: any) => headers.map(header => item[header] || ''))
        ];
      }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
  XLSX.writeFile(workbook, filename);
};
