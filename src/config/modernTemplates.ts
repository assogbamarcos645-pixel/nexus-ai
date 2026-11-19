/**
 * src/config/modernTemplates.ts
 *
 * Catalogue des 6 modèles modernes enrichis pour NEXUS LAB (#3 Hub de Templates).
 * Tous les modèles sont pré-configurés avec React 19, Tailwind CSS JIT et Lucide Icons.
 */

import type { ProjectTemplate } from '@/types/lab';

export const MODERN_TEMPLATES: ProjectTemplate[] = [
  // ─── 1. Dashboard SaaS B2B & Analytics ──────────────────────────────────────
  {
    id: 'saas-dashboard',
    name: 'Dashboard SaaS B2B & Analytics',
    description: 'Tableau de bord SaaS complet avec KPIs de revenus (MRR +18%), graphiques de croissance, table de clients/abonnements filtrable et mode sombre/cosmique.',
    category: 'frontend',
    icon: 'LayoutDashboard',
    badge: 'Populaire',
    executionType: 'browser-iframe',
    defaultFiles: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PulseMetrics SaaS — NEXUS LAB</title>
</head>
<body class="bg-[#090914] text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="module" src="./src/App.tsx"></script>
</body>
</html>`,
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, ArrowUpRight, 
  Search, Bell, Sparkles, Filter, ChevronRight, ShieldCheck 
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: any;
}

const metrics: MetricCard[] = [
  { title: 'Revenus Mensuels (MRR)', value: '48 250 €', change: '+18.4%', isPositive: true, icon: DollarSign },
  { title: 'Utilisateurs Actifs', value: '12 840', change: '+12.1%', isPositive: true, icon: Users },
  { title: 'Taux de Rétention', value: '98.2%', change: '+2.3%', isPositive: true, icon: Activity },
  { title: 'Valeur Vie Client (LTV)', value: '1 420 €', change: '+5.7%', isPositive: true, icon: TrendingUp },
];

const transactions = [
  { id: 'TX-901', customer: 'Acme Robotics Corp', plan: 'Enterprise Pro', amount: '2 400 €', status: 'Payé', date: 'Aujourd\\'hui' },
  { id: 'TX-902', customer: 'Nova Quantum Labs', plan: 'Team Scale', amount: '850 €', status: 'Payé', date: 'Aujourd\\'hui' },
  { id: 'TX-903', customer: 'Studio Helios Digital', plan: 'Starter Growth', amount: '290 €', status: 'En attente', date: 'Hier' },
  { id: 'TX-904', customer: 'CyberNexus AI', plan: 'Enterprise Pro', amount: '2 400 €', status: 'Payé', date: 'Il y a 2 jours' },
];

export function App() {
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const filtered = transactions.filter(t => 
    t.customer.toLowerCase().includes(filter.toLowerCase()) || 
    t.plan.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-[#070712] text-slate-100 font-sans">
      {/* Sidebar de navigation */}
      <aside className="w-64 border-r border-white/10 p-5 flex flex-col justify-between hidden md:flex bg-slate-950/40 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/30">
              P
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">PulseMetrics</h1>
              <span className="text-[10px] text-cyan-400 font-mono">SaaS Cloud v2.4</span>
            </div>
          </div>

          <nav className="space-y-1 text-xs">
            {['Vue d\\'ensemble', 'Analytiques', 'Abonnements', 'Factures', 'Paramètres'].map((item, idx) => (
              <button 
                key={item}
                onClick={() => setActiveTab(idx === 0 ? 'overview' : 'other')}
                className={\`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all flex items-center justify-between \${
                  idx === 0 ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }\`}
              >
                <span>{item}</span>
                {idx === 0 && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/20 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
            <ShieldCheck size={14} />
            <span>Serveur Supabase Lié</span>
          </div>
          <p className="text-[11px] text-slate-400">RLS actif et 100% sécurisé.</p>
        </div>
      </aside>

      {/* Zone Principale */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
        {/* En-tête */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Performance des Revenus</h2>
            <p className="text-xs text-slate-400 mt-1">Données de facturation synchronisées en temps réel.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-all">
              <Filter size={14} />
              <span>Derniers 30 jours</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all">
              <Sparkles size={14} />
              <span>Exporter Rapport</span>
            </button>
          </div>
        </header>

        {/* Grille de KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-cyan-500/30 transition-all shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
                  <span>{m.title}</span>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-cyan-400">
                    <Icon size={14} />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white tracking-tight">{m.value}</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center">
                    {m.change}
                    <ArrowUpRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tableau des Transactions Récentes */}
        <div className="rounded-2xl bg-slate-900/50 border border-white/10 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Souscriptions Récentes</h3>
              <p className="text-xs text-slate-400">Liste des derniers abonnements activés.</p>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Identifiant</th>
                  <th className="py-2.5 px-3">Entreprise</th>
                  <th className="py-2.5 px-3">Formule</th>
                  <th className="py-2.5 px-3">Montant</th>
                  <th className="py-2.5 px-3">Statut</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-cyan-400 font-bold">{t.id}</td>
                    <td className="py-3 px-3 text-white font-sans font-medium">{t.customer}</td>
                    <td className="py-3 px-3 text-slate-300">{t.plan}</td>
                    <td className="py-3 px-3 text-white font-bold">{t.amount}</td>
                    <td className="py-3 px-3">
                      <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${
                        t.status === 'Payé' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }\`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
export default App;`,
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: JSON.stringify({
          name: 'nexus-saas-dashboard',
          version: '1.0.0',
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^0.475.0',
          },
        }, null, 2),
      },
    ],
  },

  // ─── 2. Boutique E-Commerce & Panier Interactif ──────────────────────────────
  {
    id: 'ecommerce-store',
    name: 'Boutique E-Commerce & Panier Interactif',
    description: 'Boutique en ligne moderne avec catalogue de produits, filtres par catégorie, panier glissant animé, calcul dynamique des taxes/totaux et checkout simulé.',
    category: 'frontend',
    icon: 'ShoppingBag',
    badge: 'Tendance',
    executionType: 'browser-iframe',
    defaultFiles: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aura Store — NEXUS LAB</title>
</head>
<body class="bg-[#080811] text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="module" src="./src/App.tsx"></script>
</body>
</html>`,
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { ShoppingBag, Star, X, Plus, Minus, ArrowRight, CheckCircle2, Sparkles, Filter } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  tag: string;
}

const products: Product[] = [
  { id: 'p1', name: 'Casque Audio Spatial Quantique', category: 'Audio', price: 289, rating: 4.9, image: '🎧', tag: 'Bestseller' },
  { id: 'p2', name: 'Clavier Mécanique Photon RGB', category: 'Périphérique', price: 179, rating: 4.8, image: '⌨️', tag: 'Nouveau' },
  { id: 'p3', name: 'Souris Optique Sans Fil 8000Hz', category: 'Périphérique', price: 119, rating: 4.7, image: '🖱️', tag: 'Populaire' },
  { id: 'p4', name: 'Microphone Studio Haute Définition', category: 'Audio', price: 219, rating: 4.9, image: '🎙️', tag: 'Pro' },
  { id: 'p5', name: 'Écran Incurvé OLED 240Hz', category: 'Écrans', price: 749, rating: 5.0, image: '🖥️', tag: 'Élite' },
  { id: 'p6', name: 'Lampe de Bureau Ambiance Cosmique', category: 'Accessoires', price: 69, rating: 4.6, image: '💡', tag: 'Promo' },
];

export function App() {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === id) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const filteredProducts =
    selectedCategory === 'Tous'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#070712] text-slate-100 font-sans flex flex-col">
      {/* Navbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
            A
          </div>
          <span className="font-bold text-base tracking-wide text-white">Aura Gear</span>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer"
        >
          <ShoppingBag size={15} className="text-cyan-400" />
          <span>Panier</span>
          {totalCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[11px] flex items-center justify-center">
              {totalCount}
            </span>
          )}
        </button>
      </header>

      {/* Catalogue */}
      <main className="flex-1 max-w-6xl mx-auto p-6 md:p-8 space-y-8 w-full">
        {/* Bannière Hero */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-cyan-900/40 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl space-y-3 relative z-10">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Collection Cyberpunk 2026
            </span>
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              L'excellence du matériel conçu pour les créateurs.
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Composants haute précision, acoustique spatiale et connectivité sans compromis.
            </p>
          </div>
        </div>

        {/* Filtres par Catégorie */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['Tous', 'Audio', 'Périphérique', 'Écrans', 'Accessoires'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={\`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap \${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille de Produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="h-44 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform mb-4">
                  {p.image}
                </div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-cyan-400 font-medium">{p.category}</span>
                  <span className="text-amber-400 flex items-center gap-1 font-bold">
                    <Star size={12} fill="currentColor" /> {p.rating}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">{p.name}</h3>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-lg font-extrabold text-white">{p.price} €</span>
                <button
                  onClick={() => addToCart(p)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-slate-950 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Ajouter au panier
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Panier Latéral Tiroir (Slide-over) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-cyan-400" />
                <h2 className="font-bold text-sm text-white">Votre Panier ({totalCount})</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Votre panier est vide pour le moment.
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div key={product.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.image}</span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{product.name}</h4>
                        <span className="text-[11px] text-cyan-400 font-mono">{product.price} €</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(product.id, -1)} className="text-slate-400 hover:text-white">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold font-mono">{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} className="text-slate-400 hover:text-white">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total TTC</span>
                <span className="text-xl font-bold text-white font-mono">{subtotal} €</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => alert('Commande simulée avec succès dans NEXUS LAB !')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Passer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;`,
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: JSON.stringify({
          name: 'nexus-ecommerce-store',
          version: '1.0.0',
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^0.475.0',
          },
        }, null, 2),
      },
    ],
  },

  // ─── 3. Studio IA Génératif & Chat Multimodal ───────────────────────────────
  {
    id: 'ai-studio',
    name: 'Studio IA Génératif & Chat Multimodal',
    description: 'Interface de travail IA avec streaming de messages, sélection de modèles LLM, zones de code avec copie en 1 clic et prompts prédéfinis pour développeurs.',
    category: 'frontend',
    icon: 'Sparkles',
    badge: 'IA Avancée',
    executionType: 'browser-iframe',
    defaultFiles: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Synapse AI Studio — NEXUS LAB</title>
</head>
<body class="bg-[#06060f] text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="module" src="./src/App.tsx"></script>
</body>
</html>`,
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Code, Copy, Check, Terminal, Cpu } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  codeSnippet?: string;
}

export function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Bonjour ! Je suis Synapse AI. Comment puis-je vous assister dans votre architecture logicielle aujourd\\'hui ?',
      codeSnippet: \`// Exemple de fonction asynchrone sécurisée
export async function fetchUserData(userId: string) {
  const res = await fetch(\\\`/api/users/\\\${userId}\\\`);
  if (!res.ok) throw new Error('Utilisateur introuvable');
  return res.json();
}\`,
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('nexus-codex-v2');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: 'usr-' + Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const prompt = input;
    setInput('');

    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'assistant',
        text: \`Excellente question sur "\${prompt}". Voici l'implémentation recommandée selon les meilleures pratiques :\`,
        codeSnippet: \`// Solution optimisée par \${selectedModel}
const result = await performOptimizedTask({
  query: "\${prompt.slice(0, 30)}...",
  timestamp: new Date().toISOString()
});\`,
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#070712] text-slate-100 font-sans flex flex-col max-w-4xl mx-auto p-4 md:p-6 justify-between">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <Sparkles size={16} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">Synapse AI Studio</h1>
            <p className="text-[10px] text-cyan-400 font-mono">Assistance & Génération de Code</p>
          </div>
        </div>

        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-cyan-300 focus:outline-none"
        >
          <option value="nexus-codex-v2">NEXUS CodeX v2 (Ultra-rapide)</option>
          <option value="nexus-reasoner-70b">NEXUS Reasoner 70B (Profond)</option>
        </select>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={\`flex gap-3 \${m.sender === 'user' ? 'justify-end' : 'justify-start'}\`}>
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Bot size={15} />
              </div>
            )}
            <div className={\`max-w-xl p-4 rounded-2xl text-xs space-y-2 \${
              m.sender === 'user'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none shadow-lg'
                : 'bg-slate-900/80 border border-white/10 text-slate-200 rounded-bl-none shadow-xl'
            }\`}>
              <p className="leading-relaxed">{m.text}</p>
              {m.codeSnippet && (
                <div className="mt-2 rounded-xl bg-slate-950 p-3 border border-white/10 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                  <pre>{m.codeSnippet}</pre>
                </div>
              )}
            </div>
            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <User size={15} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Formulaire de saisie */}
      <form onSubmit={handleSend} className="pt-3 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez une question technique ou demandez un composant..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          <Send size={13} />
          <span>Envoyer</span>
        </button>
      </form>
    </div>
  );
}
export default App;`,
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: JSON.stringify({
          name: 'nexus-ai-studio',
          version: '1.0.0',
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^0.475.0',
          },
        }, null, 2),
      },
    ],
  },

  // ─── 4. Portfolio Développeur & Créatif 3D ──────────────────────────────────
  {
    id: 'portfolio-cosmic',
    name: 'Portfolio Développeur & Créatif 3D',
    description: 'Site portfolio percutant pour ingénieurs logiciels et designers : effets néon cyberpunk, vitrine de projets avec aperçus interactifs, timeline et formulaire de contact.',
    category: 'frontend',
    icon: 'User',
    badge: 'Créatif',
    executionType: 'browser-iframe',
    defaultFiles: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alexandre V. — Ingénieur Full-Stack & IA</title>
</head>
<body class="bg-[#05050d] text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="module" src="./src/App.tsx"></script>
</body>
</html>`,
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { Terminal, Github, Linkedin, ExternalLink, Mail, Code2, Sparkles, Send } from 'lucide-react';

export function App() {
  const projects = [
    { title: 'Nexus Engine', desc: 'Moteur de transpilation in-browser avec WebContainers et IA.', tags: ['React', 'TypeScript', 'WebAssembly'], stars: '1.4k' },
    { title: 'CyberCloud V3', desc: 'Orchestrateur multi-fournisseur avec bascule haute disponibilité.', tags: ['Node.js', 'PostgreSQL', 'Docker'], stars: '890' },
    { title: 'Quantix Visualizer', desc: 'Simulateur quantique en temps réel accéléré par WebGL.', tags: ['Three.js', 'GLSL', 'Math'], stars: '640' },
  ];

  return (
    <div className="min-h-screen bg-[#070712] text-slate-100 font-sans max-w-4xl mx-auto p-6 md:p-10 space-y-12">
      {/* Hero Section */}
      <header className="space-y-4 pt-8">
        <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          Disponible pour missions innovantes
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Alexandre Vance <br />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Architecte Logiciel & Ingénieur IA
          </span>
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Je conçois des applications web ultra-rapides, résilientes et dotées d'intelligence artificielle contextuelle.
        </p>
      </header>

      {/* Projets Principaux */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Code2 size={18} className="text-cyan-400" />
          <span>Projets Sélectionnés</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div key={p.title} className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 transition-all space-y-3 group shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">{p.title}</h3>
                <span className="text-xs font-mono text-slate-400">★ {p.stars}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              <div className="flex items-center gap-2 flex-wrap pt-2">
                {p.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <footer className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Un projet ambitieux à réaliser ?</h3>
          <p className="text-xs text-slate-400">Échangeons sur votre vision.</p>
        </div>
        <button
          onClick={() => alert('Message simulé envoyé avec succès !')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          <Mail size={13} />
          <span>Me contacter</span>
        </button>
      </footer>
    </div>
  );
}
export default App;`,
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: JSON.stringify({
          name: 'nexus-portfolio-cosmic',
          version: '1.0.0',
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^0.475.0',
          },
        }, null, 2),
      },
    ],
  },

  // ─── 5. Landing Page SaaS Haute Conversion ──────────────────────────────────
  {
    id: 'landing-page',
    name: 'Landing Page SaaS Haute Conversion',
    description: 'Page d’atterrissage produit à fort impact avec hero captivant, logos de réassurance, grille de fonctionnalités, grille tarifaire mensuelle/annuelle (-20%) et FAQ accordéon.',
    category: 'frontend',
    icon: 'Rocket',
    badge: 'Conversion',
    executionType: 'browser-iframe',
    defaultFiles: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vortex SaaS — NEXUS LAB</title>
</head>
<body class="bg-[#060611] text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="module" src="./src/App.tsx"></script>
</body>
</html>`,
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { Rocket, Shield, Zap, Check, ArrowRight, Star } from 'lucide-react';

export function App() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-[#070712] text-slate-100 font-sans">
      {/* Navbar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center font-bold text-slate-950">
            V
          </div>
          <span className="font-bold text-base text-white">Vortex Cloud</span>
        </div>
        <button className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md shadow-cyan-500/20">
          Commencer Gratuitement
        </button>
      </header>

      {/* Hero */}
      <section className="text-center py-16 px-6 max-w-3xl mx-auto space-y-5">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          🚀 Nouvelle Version 3.0 Disponible
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Accélérez votre ingénierie produit de <span className="text-cyan-400">10x</span>.
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          La plateforme tout-en-un pour prototyper, tester et déployer vos applications sans frictions.
        </p>
      </section>

      {/* Tarifs */}
      <section className="max-w-4xl mx-auto px-6 pb-20 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Tarifs Clairs et Transparents</h2>
          <div className="flex items-center justify-center gap-3 text-xs pt-2">
            <span className={!isAnnual ? 'text-white font-bold' : 'text-slate-400'}>Mensuel</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 flex items-center transition-colors"
            >
              <div className={\`w-4 h-4 rounded-full bg-cyan-400 transition-transform \${isAnnual ? 'translate-x-6' : ''}\`} />
            </button>
            <span className={isAnnual ? 'text-cyan-300 font-bold' : 'text-slate-400'}>Annuel (-20%)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
            <h3 className="font-bold text-base text-white">Starter</h3>
            <p className="text-xs text-slate-400">Idéal pour développeurs indépendants.</p>
            <div className="text-3xl font-extrabold text-white font-mono">
              {isAnnual ? '19 €' : '24 €'}<span className="text-xs text-slate-400 font-sans"> / mois</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Projets illimités</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Déploiement Vercel 1-Clic</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-indigo-950/40 border border-cyan-500/40 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-white">Pro Scale</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold">RECOMMANDÉ</span>
            </div>
            <p className="text-xs text-slate-400">Pour les équipes et produits en forte croissance.</p>
            <div className="text-3xl font-extrabold text-white font-mono">
              {isAnnual ? '49 €' : '59 €'}<span className="text-xs text-slate-400 font-sans"> / mois</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Tout le forfait Starter</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Débogueur Auto-Heal en temps réel</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Support prioritaire 24/7</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
export default App;`,
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: JSON.stringify({
          name: 'nexus-landing-page',
          version: '1.0.0',
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^0.475.0',
          },
        }, null, 2),
      },
    ],
  },

  // ─── 6. Documentation & Blog Technique ──────────────────────────────────────
  {
    id: 'markdown-blog',
    name: 'Documentation & Blog Technique',
    description: 'Hub de documentation et blog d’ingénierie moderne avec navigation latérale arborescente, recherche instantanée d’articles, badges de tags et temps de lecture.',
    category: 'frontend',
    icon: 'BookOpen',
    badge: 'Docs & Blog',
    executionType: 'browser-iframe',
    defaultFiles: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS Engineering Docs & Blog</title>
</head>
<body class="bg-[#080812] text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="module" src="./src/App.tsx"></script>
</body>
</html>`,
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import { BookOpen, Search, Clock, Tag, ChevronRight, FileText } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  readTime: string;
  tag: string;
  date: string;
}

const articles: Article[] = [
  { id: '1', title: 'Architecture des Systèmes Multi-Agents en TypeScript', excerpt: 'Comment orchestrer des agents spécialisés avec mémoire partagée et CRDT.', readTime: '5 min', tag: 'Architecture', date: '18 Nov 2026' },
  { id: '2', title: 'Transpilation In-Browser et Sécurité des Iframe Sandboxes', excerpt: 'Isolement matériel des prévisualisations et élimination des attaques XSS.', readTime: '8 min', tag: 'Sécurité', date: '15 Nov 2026' },
  { id: '3', title: 'Guide Complet de Row Level Security (RLS) avec Supabase', excerpt: 'Modélisation des politiques d\\'accès strictes pour architectures multi-tenants.', readTime: '6 min', tag: 'Base de données', date: '10 Nov 2026' },
];

export function App() {
  const [selectedArticle, setSelectedArticle] = useState<Article>(articles[0]);
  const [search, setSearch] = useState('');

  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.tag.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070712] text-slate-100 font-sans flex">
      {/* Sidebar Navigation */}
      <aside className="w-80 border-r border-white/10 p-5 hidden md:flex flex-col justify-between bg-slate-950/40">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <BookOpen size={18} className="text-cyan-400" />
            <span>NEXUS Engineering</span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1 pt-2">
            {filtered.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className={\`w-full text-left p-3 rounded-xl text-xs transition-all flex flex-col gap-1 \${
                  selectedArticle.id === a.id
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-white font-semibold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }\`}
              >
                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-mono">
                  <span>{a.tag}</span>
                  <span>{a.readTime}</span>
                </div>
                <span className="line-clamp-1">{a.title}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Contenu Article */}
      <main className="flex-1 p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
          <span>{selectedArticle.tag}</span>
          <span>•</span>
          <span>{selectedArticle.date}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {selectedArticle.readTime}</span>
        </div>

        <h1 className="text-3xl font-extrabold text-white leading-tight">
          {selectedArticle.title}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed italic border-l-2 border-cyan-500 pl-4 py-1">
          {selectedArticle.excerpt}
        </p>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed pt-4 border-t border-white/10">
          <p>
            Dans cet article approfondi, nous explorons les fondations conceptuelles et les compromis
            de performance inhérents aux architectures modernes.
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-white/10 font-mono text-[11px] text-cyan-300">
            // Exemple d'extrait technique interactif<br />
            const engine = new NexusEngine({ mode: 'autonomous' });<br />
            await engine.initialize();
          </div>
        </div>
      </main>
    </div>
  );
}
export default App;`,
      },
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: JSON.stringify({
          name: 'nexus-markdown-blog',
          version: '1.0.0',
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^0.475.0',
          },
        }, null, 2),
      },
    ],
  },
];
