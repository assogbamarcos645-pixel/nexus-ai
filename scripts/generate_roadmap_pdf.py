#!/usr/bin/env python3
"""
scripts/generate_roadmap_pdf.py

Générateur de la Feuille de Route Stratégique NEXUS AI en format PDF Haute Définition.
- Crée un document HTML de présentation exécutif ultra-soigné
- Intègre l'emblème « The Quantum X » en haute résolution
- Utilise Google Chrome en mode headless pour imprimer le PDF vectoriel natif A4
- Sauvegarde directement sur C:\\Users\\PC\\Desktop\\FEUILLE_DE_ROUTE_NEXUS_AI.pdf
"""

import os
import subprocess

DESKTOP_DIR = os.path.expanduser(r"C:\Users\PC\Desktop")
HTML_PATH = os.path.join(DESKTOP_DIR, "FEUILLE_DE_ROUTE_NEXUS_AI.html")
PDF_PATH = os.path.join(DESKTOP_DIR, "FEUILLE_DE_ROUTE_NEXUS_AI.pdf")

SVG_MARK_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "monogram_preview.svg")
with open(SVG_MARK_PATH, "r", encoding="utf-8") as f:
    svg_mark = f.read()

HTML_CONTENT = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Feuille de Route Stratégique — NEXUS AI</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

    @page {{
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }}

    .container {{
      max-width: 100%;
      margin: 0 auto;
    }}

    /* HEADER */
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 18px;
    }}

    .brand-group {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}

    .brand-logo {{
      width: 52px;
      height: 52px;
      flex-shrink: 0;
    }}

    .brand-logo svg {{
      width: 100%;
      height: 100%;
    }}

    .brand-title {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1.1;
    }}

    .brand-title span {{
      color: #2563eb;
    }}

    .brand-subtitle {{
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }}

    .meta-box {{
      text-align: right;
    }}

    .badge-pill {{
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }}

    .meta-date {{
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      margin-top: 5px;
    }}

    /* HERO VISION */
    .hero-banner {{
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 50%, #f8fafc 100%);
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 18px;
    }}

    .hero-banner h2 {{
      margin: 0 0 6px 0;
      font-size: 15px;
      font-weight: 800;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .hero-banner p {{
      margin: 0;
      font-size: 12.5px;
      color: #334155;
      line-height: 1.45;
    }}

    /* MISSIONS GRID */
    .section-title {{
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin: 16px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      border-left: 4px solid #2563eb;
      padding-left: 8px;
    }}

    .mission-card {{
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 10px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
      page-break-inside: avoid;
    }}

    .mission-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }}

    .mission-title {{
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 7px;
    }}

    .tag {{
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }}

    .tag-p1 {{
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }}

    .tag-p2 {{
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }}

    .tag-p3 {{
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #e9d5ff;
    }}

    .mission-objective {{
      font-size: 12px;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 6px;
    }}

    .mission-items {{
      margin: 0;
      padding-left: 18px;
      font-size: 12px;
      color: #334155;
    }}

    .mission-items li {{
      margin-bottom: 3px;
    }}

    .mission-items strong {{
      color: #0f172a;
    }}

    /* PLANNING TABLE */
    table.schedule-table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 14px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      page-break-inside: avoid;
    }}

    table.schedule-table th {{
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid #e2e8f0;
    }}

    table.schedule-table td {{
      padding: 8px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }}

    table.schedule-table tr:last-child td {{
      border-bottom: none;
    }}

    .time-slot {{
      font-weight: 700;
      color: #2563eb;
      white-space: nowrap;
    }}

    .phase-badge {{
      display: inline-block;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
    }}

    /* FOOTER */
    .footer {{
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #94a3b8;
    }}

    .footer-brand {{
      font-weight: 700;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class="container">
    
    <!-- HEADER -->
    <div class="header">
      <div class="brand-group">
        <div class="brand-logo">
          {svg_mark}
        </div>
        <div>
          <div class="brand-title">NEXUS <span>AI</span></div>
          <div class="brand-subtitle">Feuille de Route Stratégique & Priorités d'Ingénierie</div>
        </div>
      </div>
      <div class="meta-box">
        <div class="badge-pill">Session de Demain</div>
        <div class="meta-date">Date : 8 Novembre 2026 &bull; Version 0.3.0 &rarr; 0.4.0</div>
      </div>
    </div>

    <!-- HERO VISION -->
    <div class="hero-banner">
      <h2>🎯 Vision & Objectif de la Journée</h2>
      <p>
        Transformer <strong>NEXUS AI</strong> en la plateforme tout-en-un de référence pour les développeurs, alliant le meilleur de 
        <strong>Cursor / Windsurf</strong> (intelligence inline, complétion continue), <strong>v0 / Bolt.new</strong> (génération instantanée d'interfaces à partir de maquettes multimodales) et <strong>un studio d'agents autonomes collaboratifs</strong>.
      </p>
    </div>

    <!-- SECTION : LES 5 MISSIONS CLES -->
    <div class="section-title">Les 5 Piliers Stratégiques d'Exécution</div>

    <!-- MISSION 1 -->
    <div class="mission-card">
      <div class="mission-header">
        <div class="mission-title">
          <span>⚡</span> 1. Terminal WebContainers & Runtime Full-Stack dans NEXUS LAB
        </div>
        <span class="tag tag-p1">Priorité 1 &bull; Coup de Cœur</span>
      </div>
      <div class="mission-objective">Objectif : Transformer le LAB en véritable environnement Node.js/Vite in-browser.</div>
      <ul class="mission-items">
        <li><strong>Terminal interactif intégré</strong> : Panneau escamotable en bas de l'éditeur Monaco (onglets <em>Terminal</em>, <em>Console logs</em>, <em>Lint</em>).</li>
        <li><strong>Exécution de projets modernes</strong> : Support des dépendances npm réelles, rendu React (JSX/TSX) et compilation Tailwind CSS.</li>
        <li><strong>Hot Reload instantané</strong> : Synchronisation sub-seconde entre Monaco et la fenêtre de prévisualisation responsive.</li>
      </ul>
    </div>

    <!-- MISSION 2 -->
    <div class="mission-card">
      <div class="mission-header">
        <div class="mission-title">
          <span>👁️</span> 2. Itération Visuelle en Direct (« Inspect & Tweak »)
        </div>
        <span class="tag tag-p2">Forte Valeur Ajoutée</span>
      </div>
      <div class="mission-objective">Objectif : Retoucher interactivement les maquettes générées par Gemini 2.5 d'un simple clic.</div>
      <ul class="mission-items">
        <li><strong>Mode clic-to-edit</strong> : Sélection d'un bouton ou composant sur l'aperçu pour demander une retouche ciblée à l'agent IA.</li>
        <li><strong>Curseur Comparatif Avant / Après</strong> : Superposition interactive entre la capture d'écran d'origine et le code généré.</li>
      </ul>
    </div>

    <!-- MISSION 3 -->
    <div class="mission-card">
      <div class="mission-header">
        <div class="mission-title">
          <span>🧠</span> 3. Monaco Copilot : Auto-complétion « Ghost Text »
        </div>
        <span class="tag tag-p2">Productivité IDE</span>
      </div>
      <div class="mission-objective">Objectif : Suggestions invisibles et continues de code en direct pendant la frappe.</div>
      <ul class="mission-items">
        <li><strong>Texte grisé contextuel</strong> : Complétion prédictive acceptée par la touche <code>Tab</code> ou rejetée par <code>Échap</code>.</li>
        <li><strong>Moteur ultra-rapide (&lt; 200 ms)</strong> : Connexion optimisée sur modèles légers pour une frappe fluide sans saccade.</li>
      </ul>
    </div>

    <!-- MISSION 4 -->
    <div class="mission-card">
      <div class="mission-header">
        <div class="mission-title">
          <span>👥</span> 4. Multi-Agents « Swarm » : Équipe Autonome de Développement
        </div>
        <span class="tag tag-p3">Intelligence Collective</span>
      </div>
      <div class="mission-objective">Objectif : Collaboration simultanée de spécialistes sur une même tâche complexe.</div>
      <ul class="mission-items">
        <li><strong>Trio de spécialistes</strong> : L'Architecte (structure & API) + Le Frontend UI (React & Tailwind) + L'Auditeur QA (tests & accessibilité).</li>
        <li><strong>Fil d'échanges visible</strong> : Suivi en direct du dialogue et de la convergence des agents vers la solution idéale.</li>
      </ul>
    </div>

    <!-- MISSION 5 -->
    <div class="mission-card">
      <div class="mission-header">
        <div class="mission-title">
          <span>🚀</span> 5. Export Professionnel Git & Déploiement Cloud en 1 Clic
        </div>
        <span class="tag tag-p3">Fin de Cycle</span>
      </div>
      <div class="mission-objective">Objectif : Passer de l'archive ZIP manuelle au déploiement de production continu.</div>
      <ul class="mission-items">
        <li><strong>Publication GitHub</strong> : Création automatique d'un dépôt public/privé avec commit initial structuré.</li>
        <li><strong>Déploiement en 1 clic</strong> : Mise en ligne immédiate sur Vercel, Netlify ou Cloudflare Pages avec URL active.</li>
      </ul>
    </div>

    <!-- SECTION : PLANNING DE LA JOURNEE -->
    <div class="section-title">Planning Prévisionnel de la Journée</div>
    <table class="schedule-table">
      <thead>
        <tr>
          <th>Créneau</th>
          <th>Phase</th>
          <th>Chantier Technique</th>
          <th>Livrable Opérationnel</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="time-slot">09h00 &ndash; 12h00</td>
          <td><span class="phase-badge">Phase 1</span></td>
          <td>Terminal WebContainers & Runtime</td>
          <td>Console interactive en bas de NEXUS LAB avec logs en direct</td>
        </tr>
        <tr>
          <td class="time-slot">13h30 &ndash; 15h30</td>
          <td><span class="phase-badge">Phase 2</span></td>
          <td>Monaco Copilot « Ghost Text »</td>
          <td>Auto-complétion prédictive continue avec la touche Tab</td>
        </tr>
        <tr>
          <td class="time-slot">15h30 &ndash; 18h00</td>
          <td><span class="phase-badge">Phase 3</span></td>
          <td>Mode « Inspect & Tweak » Visuel</td>
          <td>Retouche au clic sur l'aperçu responsive et comparateur</td>
        </tr>
        <tr>
          <td class="time-slot">18h30 &ndash; 20h30</td>
          <td><span class="phase-badge">Phase 4</span></td>
          <td>Intégration Git & Déploiement Cloud</td>
          <td>Export en 1 clic sur GitHub et mise en ligne Vercel</td>
        </tr>
      </tbody>
    </table>

    <!-- FOOTER -->
    <div class="footer">
      <div class="footer-brand">NEXUS AI &bull; Autonomous Multimodal Development Studio</div>
      <div>Document officiel généré pour l'équipe technique &bull; Confidentiel / Interne</div>
    </div>

  </div>
</body>
</html>
"""

def main():
    # 1. Écrire le fichier HTML
    with open(HTML_PATH, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    print(f"[OK] Fichier HTML source généré : {HTML_PATH}")

    # 2. Chercher Google Chrome ou Microsoft Edge
    chrome_candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]
    
    browser_exe = None
    for cand in chrome_candidates:
        if os.path.exists(cand):
            browser_exe = cand
            break

    if not browser_exe:
        print("[ERREUR] Aucun navigateur Chromium trouvé pour générer le PDF.")
        return

    # 3. Lancer l'impression en PDF headless
    cmd = [
        browser_exe,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={PDF_PATH}",
        HTML_PATH
    ]

    print(f"Lancement de la conversion PDF via : {os.path.basename(browser_exe)}...")
    res = subprocess.run(cmd, capture_output=True, text=True)

    if os.path.exists(PDF_PATH) and os.path.getsize(PDF_PATH) > 0:
        print(f"[SUCCÈS] Le fichier PDF a été généré avec succès ({os.path.getsize(PDF_PATH)} octets) !")
        print(f"Emplacement : {PDF_PATH}")
    else:
        print(f"[ERREUR] Échec de la génération du PDF. stderr: {res.stderr}")

if __name__ == "__main__":
    main()
