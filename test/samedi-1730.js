const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const a = html.indexOf('/*ALGO-START*/');
const b = html.indexOf('/*ALGO-END*/');
if (a < 0 || b < 0) throw new Error('algo introuvable');
const api = {};
new Function('isEv', 'exports', html.slice(a, b) + '\nexports.generate=generate;exports.SLOTS=SLOTS;exports.fmt=fmt;')(
  v => v === 'EVENT' || v === 'DELIV' || v === 'BMUL' || v === 'DMUL', api);
const {generate, SLOTS, fmt} = api;
const BASE = [['Manale', 'CES'], ['David', 'CES'], ['Hairdine', 'SA'], ['Francky', 'SA'], ['Manu', 'SA'], ['Tanguy', 'SA']];
const SAS = BASE.filter(p => p[1] === 'SA').map(p => p[0]);

function teamOf(off) {
  return BASE.map(([n, r], k) => ({
    id: 'p' + k, name: n, role: r,
    days: Array.from({length: 7}, (_, d) => ({absent: !!(off[n] && off[n].includes(d))}))
  }));
}
function run(off, pipe) {
  return generate(teamOf(off), 6, 2, null, pipe || [true, true, true, true, true, true, true]);
}
let fails = 0;
function bad(msg) { fails++; console.error('KO', msg); }

function check(label, Z, team) {
  for (let d = 0; d < 6; d++) {
    SLOTS.forEach((m, i) => {
      const backs = team.filter(p => p.role !== 'CES' && Z[p.id][d][i] === 'BACKUP');
      if (backs.length > 1) bad(label + ' ' + ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d] + ' ' + fmt(m) + ' BACKUP ' + backs.map(p => p.name).join('+'));
      if (d === 5 && m >= 1050) {
        const floors = team.filter(p => p.role !== 'CES' && Z[p.id][d][i] === 'FLOOR');
        if (floors.length > 2) bad(label + ' samedi ' + fmt(m) + ' FLOOR ' + floors.length + ' ' + floors.map(p => p.name).join('+'));
      }
    });
  }
}

const weeks = [];
weeks.push({label: 'base', off: {Manale: [0], David: [2], Hairdine: [2], Francky: [3], Manu: [1], Tanguy: [4]}});
for (let mask = 0; mask < 16; mask++) {
  const off = {Manale: [0], David: [2]};
  SAS.forEach((n, k) => { if (mask & (1 << k)) off[n] = [5]; });
  weeks.push({label: 'sam-off-' + mask, off});
}
SAS.forEach(n => weeks.push({label: 'retour-' + n, off: {Manale: [0], David: [2], [n]: [4]}}));
for (let w = 0; w < 6; w++) {
  const off = {};
  BASE.forEach((p, k) => { off[p[0]] = [(k + w) % 6]; });
  weeks.push({label: 'rot-' + w, off});
}

let cases = 0;
for (const w of weeks) {
  for (const pipeSat of [true, false]) {
    const pipe = [true, true, true, true, true, pipeSat, true];
    const team = teamOf(w.off);
    check(w.label + (pipeSat ? '' : ' sans-PIPE'), run(w.off, pipe), team);
    cases++;
  }
}
if (fails) { console.error(fails + ' échec(s) sur ' + cases + ' semaines'); process.exit(1); }
console.log('OK', cases, 'semaines');
