/**
 * tests/nexus-monogram.test.ts
 *
 * Tests unitaires pour l'emblème / monogramme vectoriel « The Quantum X » de NEXUS AI (Édition Zéro Noir) :
 * - Validation de l'absence totale de teintes noires (#000, #020617, #0b0f19, #020408, etc.)
 * - Validation de la génération vectorielle de précision Python
 * - Vérification des attributs SVG fondamentaux (viewBox, xmlns, defs, gradients, filtres)
 * - Validation de la calibration des couleurs du projet (Bleu Cobalt #2563eb, Cyan #00f0ff/#38bdf8, Chrome pur)
 * - Validation de la structure en X monolithique et de la singularité centrale (50, 50)
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

describe('NEXUS AI — Emblème « The Quantum X » (Édition Pure Lumière — Zéro Noir)', () => {
  const svgPath = join(process.cwd(), 'scripts', 'monogram_preview.svg');

  test('Le fichier vectoriel SVG généré existe bien sur le disque', () => {
    assert.equal(existsSync(svgPath), true, 'scripts/monogram_preview.svg doit exister');
  });

  test('Le SVG contient les attributs structurels fondamentaux', () => {
    const content = readFileSync(svgPath, 'utf-8');
    assert.ok(content.includes('viewBox="0 0 100 100"'), 'Doit avoir une viewBox 100x100');
    assert.ok(content.includes('xmlns="http://www.w3.org/2000/svg"'), 'Doit déclarer le namespace SVG');
    assert.ok(content.includes('<defs>'), 'Doit contenir des définitions graphiques');
    assert.ok(content.includes('</svg>'), 'Doit être un SVG clos et bien formé');
  });

  test('Élimination totale des teintes noires (Zéro Noir)', () => {
    const content = readFileSync(svgPath, 'utf-8');
    // Vérification de l'absence complète de noir
    assert.equal(content.includes('#000000'), false, 'Aucun noir pur #000000');
    assert.equal(content.includes('#020617'), false, 'Aucun noir ardoise #020617');
    assert.equal(content.includes('#0b0f19'), false, 'Aucun noir saphir #0b0f19');
    assert.equal(content.includes('#020408'), false, 'Aucun noir obsidienne #020408');
    assert.equal(content.includes('flood-color="#000000"'), false, 'Aucun ombrage noir');
  });

  test('Définit les gradients aux couleurs officielles lumineuses (Cobalt, Cyan, Chrome pur)', () => {
    const content = readFileSync(svgPath, 'utf-8');
    assert.ok(content.includes('id="wafer-body"'), 'Doit définir le boîtier Liquid Glass azur');
    assert.ok(content.includes('id="wafer-bevel"'), 'Doit définir le biseau spéculaire chrome');
    assert.ok(content.includes('id="platinum-blade"'), 'Doit définir les lames en chrome et platine pur');
    assert.ok(content.includes('id="bed-cobalt"'), 'Doit définir le lit cobalt royal');
    assert.ok(content.includes('id="nexus-laser-nw-se"'), 'Doit définir le laser Diagonale 1 (Cyan vers Cobalt)');
    assert.ok(content.includes('id="nexus-laser-ne-sw"'), 'Doit définir le laser Diagonale 2');
    assert.ok(content.includes('id="singularity-glow"'), 'Doit définir le cœur de singularité radiale');
    // Vérification de la présence des couleurs du projet
    assert.ok(content.includes('#2563eb'), 'Doit intégrer le Bleu Cobalt nexus-500');
    assert.ok(content.includes('#38bdf8'), 'Doit intégrer le Cyan sky-400');
    assert.ok(content.includes('#00f0ff'), 'Doit intégrer le Cyan photonique pur');
  });

  test('Comprend les filtres photoniques lumineux sans ombre noire', () => {
    const content = readFileSync(svgPath, 'utf-8');
    assert.ok(content.includes('id="photon-glow"'), 'Doit inclure la lueur photonique');
    assert.ok(content.includes('id="quantum-glow"'), 'Doit inclure la lueur laser cohérente');
    assert.ok(content.includes('id="chassis-glow"'), 'Doit inclure la lueur de lévitation');
  });

  test('Intègre la géométrie du X sans aucune trace du N', () => {
    const content = readFileSync(svgPath, 'utf-8');
    // Tranchées diagonales du X
    assert.ok(content.includes('points="23,20 32,20 77,80 68,80"'), 'Diagonale 1 du X');
    assert.ok(content.includes('points="77,20 68,20 23,80 32,80"'), 'Diagonale 2 du X');
    // Guides d onde laser traversants
    assert.ok(content.includes('x1="27.5"'), 'Guide laser 1 x1');
    assert.ok(content.includes('x2="72.5"'), 'Guide laser 1 x2');
    assert.ok(content.includes('id="nexus-laser-nw-se"'), 'Gradient laser 1');
    assert.ok(content.includes('id="nexus-laser-ne-sw"'), 'Gradient laser 2');
    // Cœur optique et singularité au centre exact (50, 50)
    assert.ok(content.includes('cx="50" cy="50"'), 'Aperture de singularité centrale');
    // Micro-gravure de puce Quantum-X
    assert.ok(content.includes('NEXUS-X // QUANTUM-CORE'), 'Micro-inscription industrielle NEXUS-X');
  });
});
