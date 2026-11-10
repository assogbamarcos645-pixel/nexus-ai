# NEXUS AI

> Plateforme d'intelligence artificielle multi-agents et espace de développement intégré — moderne, évolutive et professionnelle.

![NEXUS AI](https://img.shields.io/badge/NEXUS_AI-v0.3.0-7c0df4?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20&%20RLS-3ECF8E?style=flat&logo=supabase)

---

## Technologies Utilisées

| Couche | Technologies & Outils | Rôle dans NEXUS AI |
| --- | --- | --- |
| **Frontend Framework** | **React 19**, **TypeScript 5** | Interface réactive déclarative, typage strict de bout en bout et rendu optimisé. |
| **Build & Bundler** | **Vite 8** (Rollup + esbuild) | Démarrage instantané en développement, HMR ultrarapide et découpage en modules (code splitting). |
| **Styles & Design** | **Tailwind CSS v4**, Lucide React | Thème *Cosmic Intelligence* (fond sombre `#070712`, violet `#7c0df4`, cyan `#06b6d4`), responsive design et composants accessibles. |
| **Édition de code & IDE** | **Monaco Editor** (`@monaco-editor/react`), **JSZip** | Coloration syntaxique VS Code, manipulation de projets multi-fichiers, export d'archives zip sans dépendance serveur. |
| **Base de Données & Auth** | **Supabase** (PostgreSQL 15+, Auth JWT, Row Level Security) | Synchronisation chiffrée, gestion des utilisateurs, conformité RGPD et isolation cryptographique stricte (`auth.uid() = user_id`). |
| **Backend & Inférence IA** | **Supabase Edge Functions** (Deno/TypeScript) & Plugin Vite local | Relais sécurisé vers les fournisseurs LLM sans aucune exposition de clé côté navigateur. |
| **Qualité & Tests** | **Oxlint**, Node.js Test Runner natif (`node --test`) | Analyse statique ultrarapide, zéro dépendance de test lourde, vérification de 100% des cas critiques. |

---

## État des Fonctionnalités : Réelles vs Simulées

| Composant / Fonctionnalité | Statut | Fonctionnement Réel | Dépendances & Éléments Simulés |
| --- | --- | --- | --- |
| **Thème & Responsive Mobile** | **100% Réel** | Adapté pour mobile, tablette et desktop. Tiroir latéral escamotable sur smartphone, navigation tactile, élimination des débordements horizontaux. | Aucun. Entièrement opérationnel. |
| **Authentification Utilisateur** | **100% Réel** | Inscription, connexion, déconnexion, réinitialisation de mot de passe, sessions JWT gérées par Supabase Auth. Droit à l'oubli RGPD complet. | En l'absence de Supabase configuré, un mode local automatique prend le relais sans bloquer l'usage. |
| **Synchronisation Cloud & RLS** | **100% Réel** | Données isolées par PostgreSQL Row Level Security. Détection de conflits par horodatage `updatedAt`. | Si hors-ligne ou non configuré, persistance automatique dans le stockage local du navigateur. |
| **Centre de Contrôle IA** | **100% Réel** | Catalogue de 7 fournisseurs avec capacités et tarifications officielles réelles. Calcul précis des coûts en USD au token près. Plafonnement strict des paramètres. | L'état du moteur est calculé rigoureusement. Aucun faux chiffre ni statistique inventée n'est affiché. |
| **Test de Connectivité Serveur** | **100% Réel** | Teste la santé réelle du proxy `/api/ai/test` ou de l'Edge Function Supabase et mesure la latence réseau en millisecondes. | Nécessite que le serveur proxy ou l'Edge Function soit accessible pour renvoyer `200 OK`. |
| **Inférence & Réponses LLM** | **Hybride (Réel / Démo)** | Si `VITE_API_BASE_URL` et les clés d'API (Gemini, OpenAI, Groq...) sont configurées côté serveur : inférence cloud réelle. | Si non configuré ou en mode « Démonstration », bascule sur le simulateur local heuristique de réponses. |
| **Multi-Agents « Swarm »** | **100% Opérationnel** | Orchestration collective d'un trio autonome (Architecte, Frontend UI React 19, Auditeur QA WCAG AA/Vitest) avec délibération en direct, convergence unanime, calcul de Diff et création de fichiers. | Connecté à l'inférence réelle si disponible, avec réplique heuristique déterministe en mode démo. |
| **NEXUS LAB (IDE & Projets)** | **100% Réel** | Arborescence de fichiers, coloration syntaxique Monaco, création/suppression de fichiers, export `.zip` téléchargeable. | L'exécution dans le navigateur est 100% réelle pour les projets HTML/CSS/JS (sandbox iframe). Les projets Node.js, PHP et Python fournissent des fiches de démarrage local guidées (car les interpréteurs serveurs ne tournent pas dans le navigateur). |

---

## Fonctionnalités actuelles

### 1. Authentification & Profils Utilisateur

- **Authentification sécurisée avec Supabase** : création de compte avec adresse e-mail et mot de passe, connexion, déconnexion, confirmation par e-mail et réinitialisation de mot de passe avec lien de récupération sécurisé.
- **Hachage & Sécurité robuste** : aucun mot de passe n'est stocké artisanalement ; tout est sécurisé par Supabase Auth (Argon2 / bcrypt, tokens JWT avec rafraîchissement automatique, protection contre le brute-force).
- **Gestion du profil** : modification du nom d'affichage, consultation de l'adresse e-mail et des statistiques cloud.
- **Protection des routes et sections privées (`AuthGate`)** : protection des fonctionnalités cloud et de la mémoire IA invitant à la connexion avec explications claires des garanties de sécurité.
- **Droit à l'oubli (RGPD)** : fonction RPC `delete_user_account()` avec confirmation textuelle (« SUPPRIMER ») pour effacer définitivement le compte et toutes ses données associées (profil, conversations, messages, projets, souvenirs).
- **Mode local / Démonstration transparent** : si le service cloud n'est pas configuré, l'application fonctionne à 100% en mode local sécurisé dans le navigateur. L'interface indique clairement le mode local et ne présente jamais de faux écran simulant une connexion factice.

### 2. Synchronisation Cloud Sécurisée (PostgreSQL + RLS)

- **Isolation stricte par Row Level Security (RLS)** : chaque table PostgreSQL (`profiles`, `conversations`, `messages`, `memories`, `projects`, `project_files`, `user_preferences`) applique la règle stricte `auth.uid() = user_id`. Aucun utilisateur ne peut lire ou modifier les données d'un autre utilisateur.
- **Identifiants UUID v4 (RFC 4122)** : génération cryptographique native (`src/utils/uuid.ts`) garantissant la conformité stricte avec les clés primaires PostgreSQL `UUID`.
- **Mémoire IA et Souvenirs partagés (`memories`)** : interface dédiée pour consulter, ajouter, filtrer (faits, préférences, contexte, projets) et supprimer des souvenirs conservés entre les sessions.
- **États de synchronisation explicites** :
  - `Non configuré` : variables d'environnement absentes (mode local actif)
  - `Local` : non connecté (données persistées dans le `localStorage`)
  - `Synchronisation en cours` : transfert actif avec animation
  - `Synchronisé` : données cloud à jour avec horodatage
  - `Hors ligne` : perte de connexion réseau détectée automatiquement
  - `Erreur` : message explicite et possibilité de réessayer
- **Bannière d'importation contrôlée (`LocalDataImportBanner`)** : si des conversations ou projets ont été créés localement avant la connexion, l'application demande une confirmation explicite avant tout transfert vers le cloud sans jamais envoyer de données à l'insu de l'utilisateur.
- **Prévention des conflits** : comparaison des horodatages `updatedAt` pour éviter les écrasements silencieux lors de modifications récentes.

### 3. NEXUS CHAT — Hub Conversationnel Multi-Agents

- **Interface Cosmic Intelligence** : thème sombre profond (`#070712`), lueurs violettes électriques (`#7c0df4`) et touches cyan (`#06b6d4`) avec effets glassmorphism.
- **Gestion multi-conversations** : persistance locale et synchronisation cloud, titre automatique basé sur le premier message.
- **5 agents IA spécialisés** :
  - **NEXUS** (Assistant généraliste)
  - **CodeX / NEXUS DEV** (Génie logiciel et révision de code)
  - **Scribe** (Rédaction et stylistique)
  - **Analyst** (Données et insights statistiques)
  - **Scholar** (Recherche et synthèse rigoureuse)

### 4. NEXUS LAB — Espace de Travail & IDE Intégré

- **Explorateur de fichiers (gauche)** : arborescence dynamique avec icônes colorées par langage, badges « Démo », comptage de fichiers, ajout/suppression sécurisés et indicateurs de modifications non enregistrées.
- **Éditeur de code (centre)** : Monaco Editor avec coloration syntaxique, thème sombre Cosmic, raccourci `Ctrl+S`, et mode de repli tactile pour téléphones.
- **Panneau de prévisualisation (droite)** :
  - **HTML/CSS/JS** : rendu temps réel dans un `iframe` isolé (`sandbox="allow-scripts"` sans `allow-same-origin`) avec console de logs intégrée.
  - **Projets serveurs (Node.js, PHP, Python, React Vite)** : fiches techniques détaillant le runtime requis, les dépendances, le port d'écoute et les commandes de lancement locales avec copie en 1 clic.
- **5 Modèles de projets officiels** :
  1. *Site HTML/CSS/JavaScript*
  2. *Application React avec Vite*
  3. *API Node.js REST*
  4. *Projet PHP*
  5. *Projet Python (FastAPI)*
- **Assistance par NEXUS DEV** : analyse de code, détection de bugs, proposition de code avec modale de comparaison Diff et confirmation explicite avant remplacement.
- **Exportation ZIP** : génération instantanée d'archive `.zip` grâce à `JSZip`.

### 5. MULTI-AGENTS « SWARM » — Équipe Autonome & Intelligence Collective

Accessible directement depuis la barre d'activité ou la barre d'outils de **NEXUS LAB**, le module **Swarm** orchestre une équipe autonome de 3 agents spécialisés collaborant simultanément sur une tâche de développement complexe :

- **Trio de Spécialistes Autonomes** :
  1. 🏗️ **L'Architecte (Structure & Contrats d'API)** : Analyse le besoin, modélise la machine à états (`idle`, `loading`, `success`, `error`), découpe les responsabilités et génère les contrats d'interface TypeScript stricts (`.types.ts`).
  2. 🎨 **Le Frontend UI (React 19 & Tailwind CSS v4)** : Réceptionne les contrats d'architecture et implémente le composant complet sans code tronqué, stylé avec des classes utilitaires responsive et intégrant les interactions clavier (fermeture Échap).
  3. 🛡️ **L'Auditeur QA (Tests Vitest & Accessibilité WCAG AA)** : Audite la robustesse, valide la conformité WCAG 2.1 niveau AA (rôles `dialog`, `alert`, `aria-modal`), et rédige une suite complète de tests automatisés Vitest / RTL (`.test.tsx`).
- **Fil d'échanges visible & Convergence en direct** :
  - Dialogue transparent visualisable en temps réel à mesure que chaque agent intervient.
  - Indicateur visuel d'état avec spécialiste actif (« En délibération... »).
  - Jauge de convergence unanime graduée de 10% à 100%.
  - Checkpoints techniques validés à chaque étape.
- **Intégration transparente dans le projet** :
  - **Revue par Diff** : application contrôlée de la proposition de composant directement dans le fichier actif avec prévisualisation des différences.
  - **Création en 1 clic** : ajout automatique des artefacts annexes (`.types.ts`, `.test.tsx`) dans l'arborescence du projet NEXUS LAB.
  - **Inférence Hybride** : connectée aux fournisseurs réels via `aiService` lorsqu'une clé est disponible, avec repli heuristique haute-fidélité en mode démo.

### 6. CENTRE DE CONTRÔLE IA — Gouvernance, Fournisseurs & Métriques

Accessible directement depuis la barre de navigation principale (`CENTRE DE CONTRÔLE`), cet espace offre un pilotage centralisé, extensible et sécurisé du moteur d'IA de NEXUS AI :

- **Tableau de bord en temps réel** :
  - **État du moteur IA** : diagnostic instantané (`Opérationnel`, `Non configuré`, `Indisponible` ou `Vérification...`) avec description détaillée.
  - **Fournisseur et modèle actifs** : affichage du fournisseur configuré, du modèle certifié et de sa fenêtre de contexte.
  - **Volume de requêtes réelles** : comptabilisation exacte des requêtes réussies, échouées et calcul de la latence moyenne. Aucune fausse statistique n'est affichée ; un état vide explicite s'affiche tant qu'aucun échange n'a été réalisé.
  - **Journal d'erreurs assaini** : historique des anomalies sans aucune fuite de données sensibles ou d'empreintes confidentielles.
  - **Surveillance des services associés** : monitoring du Moteur d'IA, de la base PostgreSQL & RLS (Supabase), de Supabase Auth et de la persistance locale du navigateur.
- **Catalogue de 7 Fournisseurs d'IA certifiés** :
  1. **Google Gemini** : *Gemini 2.0 Flash*, *Gemini 1.5 Pro*, *Gemini 1.5 Flash* (contexte jusqu'à 2M tokens, multimodal).
  2. **OpenAI** : *GPT-4o*, *GPT-4o Mini*, *o1*, *o1-mini* (standard industriel omnimodal et modèles de réflexion mathématique).
  3. **Anthropic Claude** : *Claude 3.7 Sonnet*, *Claude 3.5 Sonnet*, *Claude 3.5 Haiku* (raisonnement hybride, code de haute précision).
  4. **Mistral AI** : *Mistral Large*, *Codestral*, *Mistral Small* (excellence européenne, modèles spécialisés en programmation).
  5. **Groq (LPUs)** : *Llama 3.3 70B*, *Llama 3.1 8B*, *Mixtral 8x7B* (inférence ultra-basse latence sur puces LPU).
  6. **Ollama (Local & Souverain)** : *Llama 3.2*, *Qwen 2.5 Coder*, *DeepSeek R1*, *Mistral 7B* (100% hors-ligne, aucune clé requise).
  7. **Mode Démonstration** : *Simulateur NEXUS* (local, sans clé, sans appel réseau, zéro coût).
- **Test de connexion serveur** :
  - Vérification réelle effectuée côté serveur (via `/api/ai/test` ou proxy backend).
  - Mesure précise de la latence réseau en millisecondes.
  - Détection claire des variables d'environnement manquantes ou des erreurs de révocation de clé (HTTP 401/429).
  - Un fournisseur n'est **jamais déclaré opérationnel** sans vérification effective de sa disponibilité.
- **Gestion sécurisée des clés API** :
  - **Zéro clé dans le frontend** : aucune clé d'API LLM n'est stockée dans `localStorage`, `sessionStorage` ou le code client.
  - Les clés résident uniquement sur le serveur proxy ou dans le gestionnaire de secrets cloud (ex: Supabase Secrets).
  - Les clés sensibles sont systématiquement masquées (`sk-...4a2b`) et jamais renvoyées complètes au navigateur.
  - Le mode démonstration ne sollicite aucune clé API.
- **Suivi d'utilisation & Métriques réelles** :
  - Comptabilisation rigoureuse des requêtes réussies et échouées.
  - Consommation de jetons : tokens d'entrée (prompt), tokens de sortie (complétion) et total.
  - **Calcul de coûts estimé (USD)** : calculé strictement selon les grilles tarifaires officielles publiées par les éditeurs pour les modèles payants, 0,00 $ pour les modèles locaux et le simulateur.
  - Répartition dynamique des volumes par fournisseur et par modèle.
  - Journal d'activité avec filtres et option de réinitialisation sécurisée avec modale de confirmation.
- **Paramètres avancés du moteur** :
  - Longueur maximale des réponses (`maxTokens` : réglable de 128 à 8 192 tokens avec bornage strict).
  - Température créative (`temperature` : curseur de 0.0 à 2.0).
  - Délais d'attente réseau (`timeoutSeconds` : de 5 à 120 secondes).
  - Fonctionnalités expérimentales : streaming direct de tokens, réflexion délibérée (thinking models), traitement multimodal/vision et appel d'outils (function calling).
  - Commutateur instantané Mode Démonstration / Moteur Réel.
  - Validation et plafonnement des paramètres côté serveur pour empêcher tout contournement client.
- **Protection administrative en production (`AuthGate`)** :
  - Lorsque Supabase Auth est configuré en production, l'accès au Centre de Contrôle est protégé par authentification pour empêcher tout visiteur anonyme de modifier les réglages du moteur d'IA ou d'accéder aux tests de clés serveurs.
  - En mode démonstration / développement local hors-cloud, un bandeau informatif avertit l'administrateur que l'instance fonctionne en local autonome.

---

## Installation et démarrage

### Prérequis

- **Node.js** ≥ 18 (testé et validé sur Node.js v22)
- **npm** ≥ 9

### Installation

```bash
# 1. Cloner ou ouvrir le dossier du projet
cd "NEXUS AI"

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
```

---

## Variables d'Environnement

Créez un fichier `.env` à la racine du projet (basé sur `.env.example`) :

```env
# ==============================================================================
# NEXUS AI — Configuration Frontend
# Ne JAMAIS placer de clé secrète (service_role, clé API LLM brute) ici.
# ==============================================================================

# 1. Configuration Supabase (Requis pour l'authentification et la synchronisation cloud)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_publique_anon_ici

# 2. Proxy API LLM (Optionnel, pour brancher un backend d'inférence réel)
VITE_API_BASE_URL=
```

### Détail des variables

| Variable | Obligatoire ? | Description | Visibilité |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | **Recommandé** (Cloud) | URL de l'instance Supabase (`https://<project-ref>.supabase.co`). | Publique (navigateur) |
| `VITE_SUPABASE_ANON_KEY` | **Recommandé** (Cloud) | Clé API publique anonyme (`anon`). Utilisée pour initialiser le client Supabase et protégée par les politiques Row Level Security (RLS). | Publique (navigateur) |
| `VITE_API_BASE_URL` | *Optionnel* | URL d'un serveur backend proxy (Express / FastAPI / Supabase Edge Functions) pour relayer les requêtes de chat vers un fournisseur LLM réel (Groq, OpenAI, Anthropic, Gemini). Si vide, le système utilise les réponses simulées des agents. | Publique (navigateur) |

> [!WARNING]
> **Règle de sécurité critique** : Ne placez **JAMAIS** de clé `service_role` Supabase ou de clé d'API LLM payante directement dans les variables frontend `VITE_*`. Toute variable préfixée par `VITE_` est embarquée dans le code JavaScript distribué au navigateur.

---

## Scripts disponibles

| Commande | Action | Description |
| --- | --- | --- |
| `npm run dev` | Serveur de développement | Démarre Vite en local sur `http://localhost:5173` avec rechargement à chaud (HMR). |
| `npm test` | Tests automatisés | Exécute la suite complète de 24 tests unitaires avec le runner natif Node.js (`tests/**/*.test.ts`). |
| `npm run lint` | Linter rapide | Analyse statique du code TypeScript et JSX avec `oxlint`. |
| `npm run build` | Compilation de production | Vérification stricte des types (`tsc -b`) puis création du bundle optimisé dans `dist/`. |
| `npm run preview` | Prévisualisation | Sert localement le build de production `dist/` pour validation avant déploiement. |

---

## Configuration de Supabase (Procédure étape par étape)

L'application intègre un mode local autonome : si Supabase n'est pas configuré, NEXUS AI fonctionne en local dans le navigateur sans message d'erreur bloquant. Pour activer le mode Cloud multi-appareils :

### Étape 1 : Création du projet Supabase

1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un compte ou connectez-vous.
2. Cliquez sur **New Project**.
3. Renseignez un nom de projet (ex: `nexus-ai`) et définissez un mot de passe fort pour la base de données PostgreSQL.
4. Sélectionnez la région la plus proche (ex: `Central EU (Frankfurt)` ou `West EU (London)`).
5. Laissez le plan sur **Free** et validez la création.

### Étape 2 : Récupération des clés API

1. Dans le menu latéral de votre projet Supabase, accédez à **Project Settings** (icône d'engrenage) > **API**.
2. Sous la section **Project API keys** :
   - Copiez l'**URL du projet** (`Project URL`).
   - Copiez la clé publique **anon** (`anon public`).
3. Ouvrez votre fichier `.env` et collez ces valeurs :

   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Étape 3 : Déploiement du schéma SQL et des politiques RLS

1. Dans votre tableau de bord Supabase, cliquez sur **SQL Editor** dans le menu de gauche.
2. Cliquez sur **New query**.
3. Ouvrez le fichier local [`supabase/migrations/20261016_initial_schema.sql`](supabase/migrations/20261016_initial_schema.sql) et copiez l'intégralité de son contenu.
4. Collez le code dans l'éditeur SQL de Supabase et cliquez sur le bouton vert **Run** (ou `Ctrl+Enter`).
5. **Résultat créé automatiquement** :
   - **7 tables privées** : `profiles`, `user_preferences`, `conversations`, `messages`, `memories`, `projects`, `project_files`.
   - **Row Level Security (RLS)** activé sur chaque table avec politiques strictes `auth.uid() = user_id`.
   - **Trigger `on_auth_user_created`** créant automatiquement le profil et les préférences utilisateur lors de l'inscription.
   - **Fonction RPC `delete_user_account()`** assurant la suppression totale des données conformément au RGPD.
   - **Index de performance** sur les clés étrangères et horodatages.

### Étape 4 : Configuration des URLs de redirection d'authentification

1. Dans Supabase, allez dans **Authentication** > **URL Configuration**.
2. Dans le champ **Site URL**, indiquez : `http://localhost:5173` (ou l'URL de votre nom de domaine en production).
3. Dans **Redirect URLs**, ajoutez :
   - `http://localhost:5173/**`
   - `https://votre-domaine.com/**` (en production)
4. Cliquez sur **Save**.

---

## Fournisseur Cloud, Coûts et Limites du Niveau Gratuit

### Justification du choix de Supabase

- **Base relationnelle PostgreSQL standard** : intégrité forte des relations entre conversations, messages et fichiers de projet.
- **Sécurité RLS native** : chaque utilisateur est cryptographiquement isolé à la source (`auth.uid()`), rendant impossible l'accès non autorisé même en cas d'appel direct aux APIs REST/GraphQL.
- **Auth tout-en-un** : gestion complète des sessions, rafraîchissement des tokens JWT, confirmation d'e-mail et réinitialisation de mot de passe sans infrastructure serveur supplémentaire.
- **Transparence et absence de verrouillage** : standard SQL et client open source `@supabase/supabase-js`.

### Quotas du Plan Gratuit (Supabase Free Tier)

| Ressource | Quota Gratuit Mensuel | Capacité pour NEXUS AI |
| --- | --- | --- |
| **Utilisateurs Actifs Mensuels (MAU)** | **50 000 MAU** | Très largement suffisant pour une utilisation personnelle, d'équipe ou une mise en production initiale. |
| **Stockage Base de Données (PostgreSQL)** | **500 Mo** | Permet de stocker plus de 100 000 messages texte et plusieurs centaines de projets de code. |
| **Bande Passante (Egress)** | **5 Go / mois** | Suffisant pour synchroniser des millions de charges utiles JSON légères. |
| **Stockage Fichiers (Storage Buckets)** | **1 Go** | Disponible pour les avatars et les exports compressés. |
| **Edge Functions** | **500 000 invocations / mois** | Amplement suffisant si vous implémentez un proxy d'inférence IA sans serveur. |
| **Coût d'entrée** | **0,00 €** | Aucune carte bancaire requise lors de l'inscription. |

### Limites et points d'attention du Free Tier

1. **Mise en veille après inactivité (Supabase)** : Supabase met en pause les projets du plan gratuit après **7 jours d'inactivité continue** (aucune requête API reçue). La réactivation s'effectue en 1 clic depuis le tableau de bord Supabase en 1 à 2 minutes.
2. **Quota d'e-mails d'authentification par défaut** : le serveur SMTP partagé par défaut de Supabase est limité à **30 e-mails par heure**. Pour un déploiement public à grande échelle, connectez un service SMTP gratuit personnalisé (ex: Resend avec 3 000 emails/mois gratuits, Brevo avec 300 emails/jour gratuits) dans *Project Settings > Authentication > SMTP Settings*.
3. **Limites d'hébergement Frontend (Vercel / Netlify / Cloudflare Pages)** :
   - Bande passante gratuite : jusqu'à 100 Go/mois (très supérieur aux besoins de NEXUS AI).
   - Durée d'exécution serverless : 10 à 15 secondes max sur les offres gratuites. Si vous utilisez des modèles à forte réflexion (o1, Claude 3.7 Thinking), assurez-vous d'activer le streaming de tokens pour éviter le timeout.
4. **Quotas des fournisseurs LLM gratuits** :
   - **Google AI Studio (Gemini)** : gratuit jusqu'à 15 requêtes/minute et 1 million de tokens/minute.
   - **Groq Cloud** : inférence gratuite ultra-rapide sur LPU avec plafond de 30 requêtes/minute.
   - **Ollama** : 100% gratuit et souverain, sans limite de quota, exécuté sur votre machine locale ou votre propre VPS.

---

## Guide de Déploiement en Production

NEXUS AI est conçu avec une architecture modulaire et découplée :
- Un **Frontend Single Page Application (SPA)** ultra-léger et compilé en fichiers statiques (`dist/`).
- Une base de données cloud **Supabase** sécurisée par Row Level Security (RLS).
- Un **Proxy d'inférence optionnel** (Supabase Edge Function ou serveur Node.js) pour masquer les clés d'API LLM payantes.

### 1. Déploiement du Frontend SPA (Offres Gratuites Recommandées)

#### Option A : Déploiement sur Vercel (Recommandé)

1. Poussez votre code sur votre dépôt Git (GitHub, GitLab ou Bitbucket).
2. Connectez-vous sur [vercel.com](https://vercel.com) et cliquez sur **Add New... > Project**.
3. Importez votre dépôt `NEXUS AI`.
4. Vercel détecte automatiquement le projet **Vite** :
   - **Framework Preset** : `Vite`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
5. Dépliez la section **Environment Variables** et saisissez vos variables d'environnement publiques :
   - `VITE_SUPABASE_URL` = `https://votre-projet.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `votre_cle_anon_publique`
   - `VITE_API_BASE_URL` = `https://votre-projet.supabase.co/functions/v1/nexus-ai-proxy` *(si Edge Function activée)*
6. Cliquez sur **Deploy**.
7. Le fichier [`vercel.json`](vercel.json) inclus à la racine configure automatiquement le routage SPA (`/* -> /index.html`) et applique les en-têtes de sécurité HTTP stricts.

#### Option B : Déploiement sur Netlify

1. Connectez votre dépôt Git sur [netlify.com](https://netlify.com).
2. Le fichier [`netlify.toml`](netlify.toml) présent à la racine configure automatiquement :
   - La commande de build : `npm run build`
   - Le dossier de publication : `dist`
   - Les redirections SPA et les en-têtes HTTP de sécurité.
3. Dans **Site configuration > Environment variables**, ajoutez `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` et `VITE_API_BASE_URL`.
4. Déclenchez le déploiement de production.

#### Option C : Déploiement sur Cloudflare Pages

1. Dans le tableau de bord Cloudflare, allez dans **Workers & Pages** > **Create application** > **Pages**.
2. Connectez votre dépôt Git.
3. Paramètres de compilation :
   - **Framework preset** : `Vite` (ou `None`)
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
4. Définissez les variables d'environnement dans les paramètres du projet.
5. Cloudflare Pages prend automatiquement en compte les règles [`public/_headers`](public/_headers) et [`public/_redirects`](public/_redirects) copiées dans le dossier `dist/`.

---

### 2. Déploiement du Backend Proxy IA (Supabase Edge Function)

Pour interroger des fournisseurs d'IA réels (OpenAI, Gemini, Claude, Groq, Mistral) sans jamais risquer de divulguer vos clés API dans le navigateur :

1. Installez le CLI Supabase si ce n'est pas déjà fait :
   ```bash
   npm install -g supabase
   ```
2. Connectez le CLI à votre compte :
   ```bash
   supabase login
   supabase link --project-ref <votre-identifiant-de-projet-supabase>
   ```
3. Déployez la fonction Edge fournie dans le projet :
   ```bash
   supabase functions deploy nexus-ai-proxy
   ```
4. Définissez les clés secrètes des fournisseurs d'IA sur le serveur Supabase (jamais dans le code client !) :
   ```bash
   supabase secrets set GEMINI_API_KEY="AIzaSy..."
   supabase secrets set OPENAI_API_KEY="sk-proj-..."
   supabase secrets set GROQ_API_KEY="gsk_..."
   supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."
   supabase secrets set MISTRAL_API_KEY="votre_cle_mistral"
   ```
5. Récupérez l'URL de votre fonction (`https://<project-ref>.supabase.co/functions/v1/nexus-ai-proxy`) et renseignez-la dans la variable `VITE_API_BASE_URL` de votre hébergeur frontend.

---

## Architecture du projet

```text
src/
├── components/
│   ├── agents/          # Sélecteur d'agents (AgentSelector)
│   ├── auth/            # AuthModal, UserProfileModal, SyncStatusIndicator, AuthGate, LocalDataImportBanner
│   ├── chat/            # ChatWindow, MessageBubble, ChatInput, WelcomeScreen
│   ├── control-center/  # Centre de Contrôle IA (DashboardOverview, ProviderCatalog, UsageTracker, AdvancedSettings, ConfirmActionModal)
│   ├── lab/             # Composants NEXUS LAB (Explorer, Editor, Preview, Toolbar...)
│   ├── layout/          # Sidebar des conversations avec distinction Cloud / Local
│   ├── memories/        # MemoriesModal (banque de souvenirs et mémoire contextuelle IA)
│   ├── navigation/      # AppHeader (navigation, statut sync, mémoire IA, profil, Centre de Contrôle)
│   └── ui/              # Button, Spinner, AgentIcon
├── config/
│   ├── agents.ts        # Définition des agents IA
│   ├── aiProviders.ts   # Catalogue officiel des fournisseurs d'IA, modèles et tarifications
│   ├── app.ts           # Constantes et feature flags
│   └── labTemplates.ts  # Modèles de projets NEXUS LAB
├── context/
│   ├── AuthContext.tsx  # Fournisseur d'état d'authentification
│   ├── authContextDef.ts# Définition du contexte d'authentification
│   ├── SyncContext.tsx  # Fournisseur de synchronisation cloud
│   └── syncContextDef.ts# Définition du contexte de synchronisation
├── hooks/
│   ├── useAgent.ts      # Gestion de l'agent actif
│   ├── useAuth.ts       # Hook d'accès à l'authentification
│   ├── useChatEngine.ts # Moteur d'envoi et réception de messages connecté à aiService
│   ├── useConversations.ts # Gestion et persistance locale/cloud des conversations
│   ├── useNexusLab.ts   # Gestion d'état de l'IDE (projets, drafts, fichiers, sync)
│   ├── useSync.ts       # Hook d'accès à la synchronisation cloud
│   └── useTranslation.ts# Hook d'accès aux traductions et utilitaires régionaux
├── i18n/
│   ├── locales/
│   │   ├── fr.ts        # Traductions françaises (langue par défaut)
│   │   └── en.ts        # Traductions anglaises complètes
│   ├── I18nContext.tsx  # Fournisseur de contexte i18n avec persistance et formatage Intl
│   ├── i18nContextDef.ts# Définition du contexte i18n
│   └── types.ts         # Types stricts, schéma de traduction et liste des langues supportées
├── lib/
│   ├── constants.ts     # Constantes globales et détection de configuration cloud
│   └── utils.ts         # Helpers généraux
├── services/
│   ├── ai/
│   │   ├── aiService.ts          # Couche d'abstraction IA unifiée (simulation & requêtes réelles)
│   │   ├── aiConfigService.ts    # Configuration du moteur, validation et tests de connectivité
│   │   └── aiTelemetryService.ts # Télémétrie sécurisée, calcul de tokens et coûts réels
│   ├── auth/
│   │   ├── supabaseClient.ts # Client Supabase sécurisé (anon key)
│   │   └── authService.ts    # Inscription, connexion, profil, suppression
│   ├── lab/
│   │   ├── projectService.ts # CRUD projets, sécurité des chemins, export ZIP
│   │   └── devService.ts     # Moteur d'analyse NEXUS DEV et propositions
│   └── sync/
│   │   └── syncService.ts    # Synchronisation des conversations, souvenirs et projets
├── types/
│   ├── ai.ts            # Types des fournisseurs, modèles, télémétrie et paramètres avancés
│   ├── auth.ts          # Types profil et authentification
│   ├── index.ts         # Types généraux
│   ├── lab.ts           # Types spécifiques NEXUS LAB
│   └── sync.ts          # Types d'états de synchronisation
├── utils/
│   ├── cn.ts            # Utilitaire clsx + tailwind-merge
│   └── uuid.ts          # Génération et validation UUID v4 (RFC 4122)
├── App.tsx              # Composant racine avec navigation Chat / Lab / Centre de Contrôle
├── main.tsx             # Point d'entrée React 19
└── index.css            # Styles Tailwind CSS v4 + tokens Cosmic
server/
└── devProxyPlugin.ts    # Plugin Vite de proxy local sécurisé pour /api/ai/* et /api/chat
supabase/
├── functions/
│   └── nexus-ai-proxy/  # Edge Function Supabase prête au déploiement pour inférence sans serveur
└── migrations/
    └── 20261016_initial_schema.sql # Schéma PostgreSQL & politiques RLS complètes
tests/
├── ai-control-center.test.ts # Tests unitaires du Centre de Contrôle (catalogue, secrets, télémétrie, état)
├── auth.test.ts              # Tests de sécurité de l'authentification
├── chat-engine.test.ts       # Tests du moteur de chat et de streaming
├── dev-proxy.test.ts         # Tests de sécurité du proxy local
├── dev-service.test.ts       # Tests d'analyse et génération de code
├── i18n.test.ts              # Tests du système d'internationalisation (clés, interpolation, Intl)
├── lab-project.test.ts       # Tests de la sandbox et sécurité des projets
├── nexus-core.test.ts        # Tests des utilitaires d'identifiants UUID
├── offline-sync.test.ts      # Tests de synchronisation locale et hors-ligne
├── theme.test.ts             # Tests du Dark Mode & Light Mode (persistance et bascule)
└── xss-security.test.ts      # Tests de protection anti-XSS et assainissement DOMPurify
```

---

## Gestion des Thèmes (Dark Mode & Light Mode)

NEXUS AI intègre un commutateur de thème interactif et réactif (`src/context/ThemeContext.tsx`) :
- **Dark Mode (par défaut)** : Thème signature *Cosmic Intelligence* (`#070712`, violet `#7c0df4`, cyan `#06b6d4`, surfaces sombres).
- **Light Mode** : Thème clair élégant, préservant l'ADN visuel tout en garantissant un contraste et un confort de lecture optimaux.
- **Persistance** : Mémorisation automatique dans `localStorage` (`nexus_theme_preference_v1`) et synchronisation de la classe `dark` / `light` sur la balise `<html>`.
- **Contrôle accessible** : Bouton animé (`Sun` / `Moon`) dans la barre de navigation avec labels traduits et conformité ARIA.

---

## Système d'Internationalisation (i18n)

NEXUS AI intègre un système d'internationalisation natif, léger et strictement typé en TypeScript (`src/i18n/`) :
- **Langues disponibles** : Français (`fr`, langue par défaut) et Anglais (`en`).
- **Détection & Persistance** : Détection automatique via `navigator.language` et mémorisation du choix utilisateur dans `localStorage` (`nexus_language_preference_v1`).
- **Formatage Régional** : Utilisation native des API `Intl.DateTimeFormat` et `Intl.NumberFormat` pour adapter dates et nombres sans dépendance tierce. La devise des calculs de coûts IA reste en USD.
- **Interpolation dynamique** : Support de variables dynamiques `{param}` (ex: `{count} jetons`).

### Procédure pour ajouter une nouvelle langue (ex: Espagnol `es`)

1. **Déclarer la langue** dans [`src/i18n/types.ts`](file:///c:/Users/PC/Desktop/Mes%20projets/NEXUS%20AI/src/i18n/types.ts) :
   ```typescript
   export type SupportedLanguage = 'fr' | 'en' | 'es';
   
   export const SUPPORTED_LANGUAGES: LanguageOption[] = [
     { code: 'fr', label: 'Français', shortLabel: 'FR' },
     { code: 'en', label: 'English', shortLabel: 'EN' },
     { code: 'es', label: 'Español', shortLabel: 'ES' },
   ];
   ```
2. **Créer le fichier de traduction** `src/i18n/locales/es.ts` en implémentant l'interface `TranslationSchema` :
   ```typescript
   import type { TranslationSchema } from '../types';
   
   export const es: TranslationSchema = {
     common: { ... },
     nav: { ... },
     chat: { ... },
     agents: { ... },
     auth: { ... },
     memories: { ... },
     lab: { ... },
     controlCenter: { ... },
   };
   ```
3. **Enregistrer la langue** dans [`src/i18n/I18nContext.tsx`](file:///c:/Users/PC/Desktop/Mes%20projets/NEXUS%20AI/src/i18n/I18nContext.tsx) :
   ```typescript
   import { es } from './locales/es';
   
   const TRANSLATIONS: Record<SupportedLanguage, TranslationSchema> = { fr, en, es };
   ```
4. **Valider la conformité** en lançant `npm test` : la suite `tests/i18n.test.ts` validera automatiquement la parité exacte de toutes les clés.

---

## Déploiement en Production sur Vercel (Guide DevOps)

NEXUS AI est préconfiguré pour un déploiement continu à haute performance sur **Vercel** avec durcissement de sécurité A+.

### 1. Architecture Déployée
- **Frontend SPA (Vercel)** : Servi via le CDN mondial edge de Vercel depuis le répertoire `dist/` compilé par Vite 8.
- **Backend & Inférence Sécurisée (Supabase Edge Function)** : Les requêtes d'inférence (`/api/ai/*`) transitent par l'Edge Function `nexus-ai-proxy` déployée sur Supabase Edge Network.
- **Routage SPA & En-têtes** : Configuré dans [`vercel.json`](file:///c:/Users/PC/Desktop/Mes%20projets/NEXUS%20AI/vercel.json) avec réécriture `/(.*) -> /index.html` et en-têtes HTTP HSTS, CSP, X-Content-Type-Options et X-Frame-Options.

### 2. Variables d'Environnement sur Vercel
Dans les paramètres de votre projet Vercel (*Settings > Environment Variables*), configurez :

| Variable | Description | Exemple | Obligatoire |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL de votre instance Supabase | `https://xyz.supabase.co` | Oui (Cloud) |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase | `eyJhbGciOi...` | Oui (Cloud) |
| `VITE_API_BASE_URL` | URL de votre proxy d'IA (Supabase Edge Function) | `https://xyz.supabase.co/functions/v1/nexus-ai-proxy` | Recommandé |
| `VITE_APP_ENV` | Environnement d'exécution | `production` | Optionnel |

> [!WARNING]
> **Ne jamais configurer de clés privées d'IA** (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.) dans Vercel ! Celles-ci doivent être configurées en tant que Secrets sur Supabase (`supabase secrets set`).

### 3. Étapes de Déploiement
1. **Pousser sur GitHub** :
   ```bash
   git add .
   git commit -m "feat: internationalisation et configuration Vercel"
   git push origin main
   ```
2. **Importer dans Vercel** :
   - Rendez-vous sur [vercel.com](https://vercel.com) > *Add New Project* > *Import Git Repository*.
   - Framework Preset : **Vite**.
   - Build Command : `npm run build` (ou laissez vide, configuré par `vercel.json`).
   - Output Directory : `dist`.
   - Renseignez les variables d'environnement listées ci-dessus.
3. **Déployer l'Edge Function Supabase** :
   ```bash
   supabase functions deploy nexus-ai-proxy
   supabase secrets set OPENAI_API_KEY=... ANTHROPIC_API_KEY=... GEMINI_API_KEY=... MISTRAL_API_KEY=... GROQ_API_KEY=...
   ```

### 4. Limitations en Production Déployée
- **Ollama Local** : Les modèles Ollama s'exécutent sur la machine locale de l'utilisateur (`http://localhost:11434`). Depuis une application servie en HTTPS sur Vercel, les navigateurs modernes bloquent les requêtes vers `http://localhost` pour cause de *Mixed Content*. Pour utiliser Ollama depuis Vercel, un tunnel HTTPS sécurisé (ex: ngrok, Cloudflare Tunnel) ou une passerelle distante est requis.
- **Sandbox d'Exécution HTML/JS du Lab** : L'environnement de prévisualisation NEXUS LAB s'exécute côté client dans une iframe sandboxée (`allow-scripts`, sans `allow-same-origin`) assurant une isolation totale sans risque pour le domaine hôte.

---

## Sécurité et Bonnes Pratiques

- **Aucune clé secrète dans le frontend** : les clés des fournisseurs d'IA (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`) et la clé Supabase `service_role` ne doivent **jamais** figurer dans le bundle frontend ou dans le stockage client (`localStorage`, `sessionStorage`).
- **Exécution et validation côté serveur** : le serveur proxy (ou Supabase Edge Function) valide les paramètres de requêtes (bornes `maxTokens`, `temperature`, `timeout`), lit les clés d'API depuis l'environnement serveur sécurisé et renvoie des messages sanitisés sans jamais divulguer les secrets.
- **Row Level Security (RLS) obligatoire** : même si un utilisateur inspecte le code client ou appelle directement l'API PostgREST, la base de données PostgreSQL vérifie cryptographiquement le jeton JWT (`auth.uid() = user_id`) sur chaque table.
- **Fichiers protégés** : `.env` et `.env.*` sont strictement ignorés par Git (seul `.env.example` est versionné).

---

## Licence

MIT
