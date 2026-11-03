import fs from 'fs';
const html = fs.readFileSync('analytics_dom.html', 'utf8');
const tableIdx = html.indexOf('<table');
console.log(html.substring(tableIdx, tableIdx + 2000));