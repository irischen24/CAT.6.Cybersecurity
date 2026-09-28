/* Regenerates the static import templates in templates/ (same content as the Import Center downloads).
 * node tools/gen-templates.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
globalThis.window = globalThis;
['js/core/namespace.js', 'js/config.js', 'js/core/format.js', 'js/core/provenance.js', 'js/core/dom.js', 'data/frameworks.js', 'data/catalog/iso27001.js', 'data/catalog/csf2.js',
 'data/catalog/cis-controls.js', 'data/defaults/meta.js', 'data/defaults/fair-defaults.js', 'js/calculations/rng.js', 'js/calculations/distributions.js', 'js/calculations/fairMonteCarloEngine.js',
 'js/services/xlsx.js', 'js/services/exportService.js', 'js/services/csvImportService.js', 'js/services/importCenter.js']
  .forEach(f => vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }));
const C = globalThis.CAT6, IC = C.services.importCenter, out = path.join(ROOT, 'templates');
fs.mkdirSync(path.join(out, 'csv'), { recursive: true });
IC.templates().forEach(name => fs.writeFileSync(path.join(out, name + '.xlsx'), Buffer.from(C.services.xlsx.write(IC.templateSheets(name)))));
Object.keys(IC.DATASETS).forEach(k => fs.writeFileSync(path.join(out, 'csv', 'CAT6_' + k + '.csv'), IC.templateCSV(IC.DATASETS[k])));
console.log(fs.readdirSync(out).join('\n'));
