#!/usr/bin/env node
// Contrôle des fonctions d'un bundle Vision :
//  - appelée sans définition  -> plantage différé au premier clic
//  - définie sans appel       -> code mort (dangereux s'il encode un ancien modèle)
// L'outil se teste lui-même avant de parler : il injecte deux cas connus et
// vérifie qu'il les détecte. S'il échoue, il refuse de donner un résultat.
const fs = require('fs');

const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function extraitScript(html) {
  const blocs = [...html.matchAll(/<script[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!blocs.length) throw new Error('aucun script module trouvé');
  return blocs.reduce((a, b) => (b.length > a.length ? b : a));
}

function analyse(src, surveilles = []) {
  const defs = [...src.matchAll(/^\s*(?:async )?function ([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]);
  const uniques = [...new Set(defs)];
  const appels = new Set();
  for (const m of src.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) appels.add(m[1]);
  for (const m of src.matchAll(/h\.jsxs?\(([A-Za-z_$][\w$]*)[,)]/g)) appels.add(m[1]);
  for (const m of src.matchAll(/createElement\(([A-Za-z_$][\w$]*)\)/g)) appels.add(m[1]);

  // Direction « appelé sans définition » : NON fiable en balayage générique sur
  // un bundle minifié (mots-clés, méthodes, variables déstructurées remontent).
  // On ne la fait donc que sur des noms explicitement surveillés, passés en
  // argument — c'est là qu'elle attrape un vrai plantage différé.
  const sansDefinition = surveilles.filter(n =>
    appels.has(n) &&
    !uniques.includes(n) &&
    !new RegExp('(?:const|let|var)\\s+' + esc(n) + '\\b').test(src) &&
    !new RegExp('\\b' + esc(n) + '\\s*[:=]\\s*(?:async\\s*)?(?:function|\\()').test(src)
  );

  const sansAppel = uniques.filter(n => {
    const e = esc(n);
    const ref = new RegExp(
      '(?:(?<![\\w$.])' + e + '\\s*\\()|(?:h\\.jsxs?\\(' + e + '[,)])|(?:createElement\\(' + e + '\\))|(?:[:,{]\\s*' + e + '\\s*[,}])|(?:=\\s*' + e + '(?![\\w$]))', 'g');
    const decl = new RegExp('function\\s+' + e + '\\s*\\(', 'g');
    return (src.match(ref) || []).length - (src.match(decl) || []).length <= 0;
  });

  return { total: uniques.length, sansDefinition, sansAppel };
}

// --- auto-vérification : l'outil doit trouver ce qu'on y cache exprès ---
function autoTest() {
  const temoin = `
function vivante(){ return 1 }
function morteExpres(){ return 2 }
const r = vivante();
appelFantome();
`;
  const a = analyse(temoin, ['appelFantome', 'vivante']);
  const ok1 = a.sansAppel.includes('morteExpres');
  const ok2 = !a.sansAppel.includes('vivante');
  const ok3 = a.sansDefinition.includes('appelFantome');
  if (!ok1 || !ok2 || !ok3) {
    console.error('AUTO-TEST ÉCHOUÉ — l\'outil ne détecte pas ses propres cas témoins.');
    console.error('  morte détectée :', ok1, '| vivante épargnée :', ok2, '| appel fantôme détecté :', ok3);
    process.exit(2);
  }
  return true;
}

const fichier = process.argv[2] || 'index.html';
const surveilles = process.argv.slice(3);
autoTest();
const src = extraitScript(fs.readFileSync(fichier, 'utf8'));
const r = analyse(src, surveilles);
console.log('auto-test              : ok');
console.log('fonctions déclarées    :', r.total);
console.log('noms surveillés          :', surveilles.length || '(aucun — passe-les en arguments)');
console.log('appelés sans définition  :', r.sansDefinition.length ? r.sansDefinition.join(', ') : 'aucun');
console.log('définies sans appel      :', r.sansAppel.length ? r.sansAppel.join(', ') : 'aucune');
process.exit(r.sansDefinition.length ? 1 : 0);
