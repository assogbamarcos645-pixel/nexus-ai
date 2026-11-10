# Rapport d'Audit de Sécurité — NEXUS AI

Ce document récapitule les mesures de sécurité, les assainissements effectués et l'état des protections appliquées sur le projet NEXUS AI en vue d'un déploiement public.

> **Avertissement de transparence** : Ce document constitue une revue interne des mécanismes de sécurité et de configuration du projet. Il ne constitue pas un audit de sécurité externe exhaustif certifié par un organisme tiers.

---

## 1. Synthèse des actions de sécurité réalisées

### Dépendances et prévention des failles XSS
- **Mise à niveau de Monaco Editor & DOMPurify** : Installation de `monaco-editor@latest` (v0.57.0) et `dompurify` (v3.4.17) afin de corriger les vulnérabilités de contournement XSS recensées sur les versions antérieures.
- **Assainissement du rendu HTML** : Toutes les prévisualisations de code utilisateur dans NEXUS LAB s'exécutent dans une balise `iframe` isolée avec l'attribut `sandbox="allow-scripts"` (sans `allow-same-origin`), empêchant tout script utilisateur d'accéder au stockage, aux cookies ou au contexte d'exécution de l'application hôte.

### En-têtes HTTP stricts & Politique de Sécurité du Contenu (CSP)
- Déploiement d'une **Content Security Policy (CSP)** rigoureuse et cohérente sur l'ensemble des cibles d'hébergement (`public/_headers`, `vercel.json` et `netlify.toml`) :
  - Interdiction stricte de l'exécution arbitraire avec `object-src 'none'`.
  - Absence de la directive permissive `unsafe-eval`.
  - Restriction des connexions aux canaux sécurisés (`connect-src 'self' https: wss:` pour Supabase).
  - Autorisation ciblée des polices (`https://fonts.googleapis.com` et `https://fonts.gstatic.com`) et des workers web Monaco Editor (`blob:`).
- Configuration des en-têtes HTTP de protection du navigateur :
  - `X-Content-Type-Options: nosniff` (protection contre l'interprétation abusive des types MIME).
  - `X-Frame-Options: SAMEORIGIN` (protection contre le clickjacking).
  - `X-XSS-Protection: 1; mode=block`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### Protection du Centre de Contrôle Administratif
- **Barrière d'authentification (`AuthGate`)** : Lorsque l'infrastructure cloud Supabase est configurée, l'accès à la gouvernance des modèles IA, à la configuration des fournisseurs et aux déclenchements de tests serveur est réservé aux administrateurs authentifiés.
- **Mode Local & Démonstration** : En l'absence de Supabase configuré, un bandeau informatif signale clairement que la plateforme fonctionne en mode local autonome et que les réglages sont limités au navigateur local.

### Protection contre les abus et limitation de débit (Rate Limiting)
- **Limiteur de requêtes** : Mise en place d'un mécanisme de contrôle de fréquence (120 requêtes/minute par adresse IP) sur les points d'entrée `/api/*`.
- **Protection anti-déni de service (DoS)** : Plafonnement de la taille des corps de requêtes JSON à 1 Mo maximum.

### Étanchéité et assainissement des clés secrètes
- **Zéro secret côté client** : Aucune clé d'API LLM (`OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`) ni clé Supabase `service_role` n'est présente dans le code client ou le bundle compilé.
- **Masquage systématique** : Remplacement automatique par regex des empreintes de clés (`sk-***[MASQUÉ]***`, `AIza***[MASQUÉ]***`, `gsk_***[MASQUÉ]***`, `Bearer ***`) dans tous les messages d'erreurs et journaux de télémétrie.
- **Plafonnement des paramètres côté serveur** : Les paramètres `maxTokens` (128 à 8 192), `temperature` (0.0 à 2.0) et `timeoutSeconds` (5 à 120) sont strictement validés et bornés par la fonction `sanitizeAdvancedSettings()`.

### Isolation des données utilisateur (Row Level Security)
- **PostgreSQL RLS** : Toutes les tables distantes (`profiles`, `conversations`, `messages`, `memories`, `projects`, `project_files`, `user_preferences`) appliquent la politique stricte `auth.uid() = user_id`.
- **Droit à l'oubli RGPD** : Procédure RPC `delete_user_account()` avec confirmation explicite permettant à l'utilisateur de purger l'intégralité de ses données personnelles.

---

## 2. État des vérifications et résultats des tests

| Élément vérifié | Résultat | Statut |
|---|---|---|
| **Compilation TypeScript (`tsc -b && vite build`)** | 0 erreur, bundle généré en ~1,3 s avec découpage de code | ✅ Conforme |
| **Analyse statique (`npm run lint` avec Oxlint)** | 0 erreur, 0 avertissement sur 72 fichiers | ✅ Conforme |
| **Suite de tests automatisés (`npm test`)** | 24 tests exécutés avec succès (0 échec, 0 ignoré) | ✅ Conforme |
| **Exclusion des variables d'environnement (.gitignore)** | `.env`, `.env.*` ignorés (seul `.env.example` sans clé est versionné) | ✅ Conforme |
| **Règles d'indexation (`public/robots.txt`)** | Protection des routes `/api/`, jetons d'accès et liens de récupération | ✅ Conforme |

---

## 3. Recommandations pour l'hébergement en production

1. **Variables d'environnement dans le tableau de bord de l'hébergeur** :
   - Renseigner uniquement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (variables publiques).
   - Ne jamais déclarer de clés API LLM avec le préfixe `VITE_`.
2. **Secrets côté serveur** :
   - Déclarer les clés d'IA réelles exclusivement dans Supabase Secrets (`supabase secrets set ...`) ou dans les variables d'environnement du serveur proxy dédié.
3. **Configuration du serveur SMTP** :
   - Pour un déploiement public avec un grand nombre d'inscriptions, raccorder un service SMTP personnalisé (ex: Resend, Brevo) dans la console Supabase afin de lever la limite par défaut de 30 e-mails/heure.
