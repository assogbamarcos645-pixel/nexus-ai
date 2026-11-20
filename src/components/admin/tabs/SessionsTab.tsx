/**
 * src/components/admin/tabs/SessionsTab.tsx
 *
 * Onglet Sessions Actives, Anti-Abus & Outils RGPD :
 * - Surveillance des sessions actives en direct et revocation
 * - Liste noire des adresses IP et regles anti-bruteforce
 * - Outils de conformite RGPD (Export complet & Droit a l oubli)
 */

import React, { useState } from 'react';
import {
  Globe,
  Smartphone,
  Laptop,
  LogOut,
  Ban,
  Download,
  CheckCircle2,
  Plus,
  Lock,
} from 'lucide-react';
import {
  getActiveSessions,
  revokeSession,
  revokeAllSessionsExceptCurrent,
  getAntiAbusConfig,
  blockIpAddress,
  unblockIpAddress,
  exportFullRgpdArchive,
} from '../../../services/admin/adminSessionsService.ts';
import type { ActiveSession, AntiAbusConfig } from '../../../types/admin.ts';

export const SessionsTab: React.FC = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>(getActiveSessions);
  const [antiAbus, setAntiAbus] = useState<AntiAbusConfig>(getAntiAbusConfig);
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleRevokeSingle = (sessionId: string) => {
    revokeSession(sessionId);
    setSessions(getActiveSessions());
    setFeedbackMsg('Session révoquée avec succès.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRevokeAll = () => {
    if (window.confirm('Voulez-vous vraiment forcer la déconnexion de toutes les sessions distantes ?')) {
      const count = revokeAllSessionsExceptCurrent();
      setSessions(getActiveSessions());
      setFeedbackMsg(`${count} session(s) révoquée(s). Vous restez connecté.`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleBlockIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpToBlock.trim()) return;

    blockIpAddress(newIpToBlock.trim(), blockReason.trim() || 'Bloqué manuellement par le Super Administrateur');
    setAntiAbus(getAntiAbusConfig());
    setNewIpToBlock('');
    setBlockReason('');
    setFeedbackMsg(`L'adresse IP ${newIpToBlock.trim()} a été ajoutée à la liste noire.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleUnblock = (ip: string) => {
    unblockIpAddress(ip);
    setAntiAbus(getAntiAbusConfig());
    setFeedbackMsg(`L'adresse IP ${ip} a été débloquée.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleExportRgpd = () => {
    const jsonStr = exportFullRgpdArchive();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_rgpd_archive_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedbackMsg('Archive RGPD exportée avec succès !');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-linear-to-r from-red-900/20 via-orange-900/10 to-transparent border border-red-500/20">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="text-red-400" size={18} />
            Sécurité Avancée, Sessions & Conformité RGPD
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Supervisez les connexions actives, révoquez des accès suspects et gérez les requêtes légales RGPD.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {feedbackMsg && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 size={14} /> {feedbackMsg}
            </span>
          )}
          <button
            type="button"
            onClick={handleRevokeAll}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} /> Déconnecter Tout le Monde
          </button>
        </div>
      </div>

      {/* Sessions Actives en direct */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe size={14} className="text-blue-400" />
            Sessions Actuellement Ouvertes ({sessions.length})
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">
            ● Écoute temps réel active
          </span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                <th className="py-2 px-3">Utilisateur</th>
                <th className="py-2 px-3">Appareil & Navigateur</th>
                <th className="py-2 px-3">IP & Emplacement</th>
                <th className="py-2 px-3">Connexion</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {sess.userName}
                      {sess.isCurrent && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500/20 text-blue-400 font-mono">
                          VOUS
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{sess.userEmail}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      {sess.device.includes('iPhone') || sess.device.includes('Mobile') ? (
                        <Smartphone size={13} className="text-slate-400" />
                      ) : (
                        <Laptop size={13} className="text-slate-400" />
                      )}
                      <span>{sess.device}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{sess.browser}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-mono text-slate-800 dark:text-slate-200">{sess.ip}</div>
                    <div className="text-[10px] text-slate-400">{sess.location}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(sess.startedAt).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {!sess.isCurrent ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeSingle(sess.id)}
                        className="px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Révoquer
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Session actuelle</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liste Noire des Adresses IP (Anti-Abus) */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Ban size={14} className="text-red-400" />
            Liste Noire des Adresses IP & Système Anti-Bruteforce
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Toute adresse IP listée ci-dessous est immédiatement refoulée par le pare-feu applicatif.
          </p>
        </div>

        <form onSubmit={handleBlockIp} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Adresse IPv4 ou IPv6 (ex: 185.220.101.5)..."
            value={newIpToBlock}
            onChange={(e) => setNewIpToBlock(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono"
          />
          <input
            type="text"
            placeholder="Motif du blocage..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-white/10 hover:bg-red-600 hover:text-white text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={13} /> Bloquer l'IP
          </button>
        </form>

        <div className="space-y-2">
          {antiAbus.blockedIps.map((b) => (
            <div
              key={b.ip}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-xs"
            >
              <div>
                <div className="font-mono font-bold text-red-400">{b.ip}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {b.reason} • Bloqué par {b.blockedBy} ({b.hitCount} tentatives bloquées)
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUnblock(b.ip)}
                className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-white/10 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Débloquer
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Outils RGPD */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Download size={14} className="text-emerald-400" />
            Conformité RGPD & Export de Données
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Téléchargez l'intégralité des logs système et des informations de sessions au format JSON certifié.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportRgpd}
          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
        >
          <Download size={14} /> Exporter Archive RGPD (JSON)
        </button>
      </div>
    </div>
  );
};
