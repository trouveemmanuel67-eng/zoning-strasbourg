const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = html.indexOf('/*ALGO-START*/');
const b = html.indexOf('/*ALGO-END*/');
const api = {};
new Function('isEv', 'exports', html.slice(a, b) + '\nexports.generate=generate;exports.SLOTS=SLOTS;exports.fmt=fmt;')(
  v => v === 'EVENT' || v === 'DELIV' || v === 'BMUL' || v === 'DMUL', api);
const {generate, SLOTS, fmt} = api;
const BASE = [['Manale', 'CES'], ['David', 'CES'], ['Hairdine', 'SA'], ['Francky', 'SA'], ['Manu', 'SA'], ['Tanguy', 'SA']];
const SAS = BASE.filter(p => p[1] === 'SA').map(p => p[0]);
const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
function teamOf(off) {
  return BASE.map(([n, r], k) => ({
    id: 'p' + k, name: n, role: r,
    days: Array.from({length: 7}, (_, d) => ({absent: !!(off[n] && off[n].includes(d))}))
  }));
}
let fails = 0;
function bad(m) { fails++; console.error('KO', m); }
const weeks = [{label: 'base', off: {Manale: [0], David: [2], Hairdine: [2], Francky: [3], Manu: [1], Tanguy: [4]}}];
for (let mask = 0; mask < 16; mask++) {
  const off = {Manale: [0], David: [2]};
  SAS.forEach((n, k) => { if (mask & (1 << k)) off[n] = [5]; });
  weeks.push({label: 'off-' + mask, off});
}
SAS.forEach(n => weeks.push({label: 'retour-' + n, off: {Manale: [0], David: [2], [n]: [4]}}));
let cases = 0;
for (const w of weeks) {
  for (const pipeSat of [true, false]) {
    const team = teamOf(w.off);
    const Z = generate(team, 6, 2, null, [true, true, true, true, true, pipeSat, true]);
    const label = w.label + (pipeSat ? '' : ' sans-PIPE');
    const sas = team.filter(p => p.role === 'SA' && !p.days[5].absent);
    for (let d = 0; d < 6; d++) SLOTS.forEach((m, i) => {
      const pipes = team.filter(p => p.role !== 'CES' && Z[p.id][d][i] === 'PIPE');
      const backs = team.filter(p => p.role !== 'CES' && Z[p.id][d][i] === 'BACKUP');
      if (d === 5 && pipes.length > 1) bad(label + ' double PIPE ' + fmt(m) + ' ' + pipes.map(p => p.name).join('+'));
      if (backs.length > 1) bad(label + ' ' + days[d] + ' double BACKUP ' + fmt(m));
      if (d === 5 && m >= 1050) {
        const floors = sas.filter(p => Z[p.id][5][i] === 'FLOOR');
        if (floors.length > 2) bad(label + ' FLOOR>2 ' + fmt(m) + ' ' + floors.map(p => p.name).join('+'));
      }
    });
    sas.forEach(p => {
      let pipe = 0, backup = 0;
      Z[p.id][5].forEach(v => { if (v === 'PIPE') pipe++; if (v === 'BACKUP') backup++; });
      if (pipe > 2) bad(label + ' ' + p.name + ' PIPE ' + pipe / 2 + 'h');
      if (backup > 2) bad(label + ' ' + p.name + ' BACKUP ' + backup / 2 + 'h');
    });
    const free = sas.filter(p => [17, 18].every(i => !['PAUSE', 'EVENT', 'DELIV', 'BMUL', 'DMUL', 'CLEAN', 'CLEAN15'].includes(Z[p.id][5][i])));
    if (free.length === 4) {
      for (const i of [17, 18]) {
        const f = free.filter(p => Z[p.id][5][i] === 'FLOOR').length;
        const b = free.filter(p => Z[p.id][5][i] === 'BACKUP').length;
        const p = free.filter(p => Z[p.id][5][i] === 'PIPE').length;
        if (f !== 2 || b !== 1 || p !== 1) bad(label + ' ' + fmt(SLOTS[i]) + ' F' + f + ' B' + b + ' P' + p);
      }
    }
    cases++;
  }
}
if (fails) { console.error(fails + ' échec(s) / ' + cases); process.exit(1); }
console.log('OK', cases, 'semaines');
