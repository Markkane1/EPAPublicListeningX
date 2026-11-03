
const XExporter = (() => {
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function sanitizeForCsv(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportToCsv(data, baseFilename = 'x_export') {
    if (!data || !data.length) return false;

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.map(sanitizeForCsv).join(','));

    for (const item of data) {
      const row = headers.map(h => sanitizeForCsv(item[h]));
      csvRows.push(row.join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${baseFilename}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadBlob(blob, filename);
    return true;
  }

  function exportToJson(data, baseFilename = 'x_export') {
    if (!data || !data.length) return false;

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const filename = `${baseFilename}_${new Date().toISOString().slice(0, 10)}.json`;
    downloadBlob(blob, filename);
    return true;
  }

  function exportToExcel(data, baseFilename = 'x_export') {
    if (!data || !data.length) return false;

    const headers = Object.keys(data[0]);
    let table = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    table += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Export</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>';
    table += '<table border="1"><thead><tr>';
    for (const h of headers) {
      table += `<th style="background-color:#1d9bf0;color:#ffffff;font-weight:bold;">${h}</th>`;
    }
    table += '</tr></thead><tbody>';

    for (const item of data) {
      table += '<tr>';
      for (const h of headers) {
        const val = item[h] !== null && item[h] !== undefined ? String(item[h]) : '';
        
        const safeVal = val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        table += `<td>${safeVal}</td>`;
      }
      table += '</tr>';
    }
    table += '</tbody></table></body></html>';

    const blob = new Blob([table], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const filename = `${baseFilename}_${new Date().toISOString().slice(0, 10)}.xls`;
    downloadBlob(blob, filename);
    return true;
  }

  return {
    exportToCsv,
    exportToJson,
    exportToExcel
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = XExporter;
}