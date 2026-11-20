/**
 * src/components/admin/tabs/BroadcastTab.tsx
 *
 * Onglet Annonces Globales (Broadcast) & Maintenance Programmee :
 * - Creation de messages d'annonce (Info, Avertissement, Alerte critique)
 * - Previsualisation en direct de la banniere
 * - Planificateur de maintenance avec compte a rebours
 */

import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Calendar,
  CheckCircle2,
  Eye,
  Radio,
  Mail,
  Send,
  Download,
  Copy,
  Check,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getBroadcastBanner,
  saveBroadcastBanner,
  getScheduledMaintenance,
  saveScheduledMaintenance,
} from '../../../services/admin/adminBroadcastService.ts';
import {
  getAllUserEmails,
  exportUsersCsv,
  generateReleaseNotificationHtml,
  sendBroadcastEmail,
} from '../../../services/admin/adminEmailNotificationService.ts';
import type { BroadcastBanner, ScheduledMaintenance } from '../../../types/admin.ts';

export const BroadcastTab: React.FC = () => {
  const [banner, setBanner] = useState<BroadcastBanner>(getBroadcastBanner);
  const [maintenance, setMaintenance] = useState<ScheduledMaintenance>(getScheduledMaintenance);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [emailSubject, setEmailSubject] = useState(
    'NEXUS AI v0.4.0 est en ligne : Swarm 2.0, WebContainers & Codebase Search'
  );
  const [provider, setProvider] = useState<'brevo' | 'resend'>('brevo');
  const [brevoApiKey, setBrevoApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_admin_brevo_api_key');
      if (saved) return saved;
    }
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BREVO_API_KEY) || '';
  });
  const [resendApiKey, setResendApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_admin_resend_api_key');
      if (saved) return saved;
    }
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RESEND_API_KEY) || '';
  });
  const [senderEmail, setSenderEmail] = useState('assogbamarcos645@gmail.com');
  const [senderName, setSenderName] = useState('NEXUS AI');
  const [recipientsInput, setRecipientsInput] = useState(() => getAllUserEmails().join('\n'));
  const [showRecipientsEditor, setShowRecipientsEditor] = useState(true);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  const parsedRecipients = useMemo(() => {
    return Array.from(
      new Set(
        recipientsInput
          .split(/[\r\n,;]+/)
          .map((e) => e.trim().replace(/^["']|["']$/g, ''))
          .filter((e) => e.includes('@'))
      )
    );
  }, [recipientsInput]);

  const handleCopyEmailHtml = () => {
    const html = generateReleaseNotificationHtml({
      version: '0.4.0',
    });
    navigator.clipboard.writeText(html);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2500);
  };

  const handleDownloadCsv = () => {
    const csv = exportUsersCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-users-email-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendEmailCampaign = async () => {
    if (parsedRecipients.length === 0) {
      setFeedbackMsg('Veuillez spécifier au moins une adresse e-mail destinataire.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await sendBroadcastEmail({
        subject: emailSubject,
        provider,
        brevoApiKey: brevoApiKey.trim() || undefined,
        resendApiKey: resendApiKey.trim() || undefined,
        senderEmail: senderEmail.trim() || undefined,
        senderName: senderName.trim() || undefined,
        recipients: parsedRecipients,
      });
      if (res.success) {
        setFeedbackMsg(
          res.simulated
            ? `Campagne simulée avec succès pour ${res.totalSent} utilisateur(s) !`
            : `Campagne ${provider.toUpperCase()} envoyée avec succès à ${res.totalSent} utilisateur(s) !`
        );
      } else {
        setFeedbackMsg(`Échec d'envoi : ${res.errors.join(', ')}`);
      }
    } catch (err: any) {
      setFeedbackMsg(`Erreur : ${err?.message || err}`);
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBroadcastBanner(banner);
    setFeedbackMsg('Annonce globale mise à jour et diffusée à tous les utilisateurs !');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveScheduledMaintenance(maintenance);
    setFeedbackMsg('Planification de maintenance enregistrée avec succès !');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-linear-to-r from-amber-900/20 via-orange-900/10 to-transparent border border-amber-500/20">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="text-amber-400" size={18} />
            Annonces Globales (Broadcast) & Maintenance Programmée
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Communiquez instantanément avec tous les utilisateurs connectés et planifiez vos fenêtres d'intervention technique.
          </p>
        </div>
        {feedbackMsg && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={14} /> {feedbackMsg}
          </span>
        )}
      </div>

      {/* Formulaire d'annonce globale */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Radio size={14} className="text-blue-400" />
            Bannière d'Annonce Flottante en Direct
          </h4>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={banner.enabled}
              onChange={(e) => setBanner({ ...banner, enabled: e.target.checked })}
              className="rounded-sm accent-amber-600"
            />
            <span className="text-slate-800 dark:text-slate-200">
              {banner.enabled ? 'Diffusion Active' : 'Diffusion Masquée'}
            </span>
          </label>
        </div>

        <form onSubmit={handleBannerSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Titre de l'annonce :
              </label>
              <input
                type="text"
                value={banner.title}
                onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
                placeholder="Ex: Mise à niveau NEXUS AI v3.2..."
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Niveau d'urgence :
              </label>
              <select
                value={banner.type}
                onChange={(e) =>
                  setBanner({ ...banner, type: e.target.value as BroadcastBanner['type'] })
                }
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
              >
                <option value="info">Information (Bleu/Violet)</option>
                <option value="warning">Avertissement (Orange)</option>
                <option value="urgent">Critique / Urgence (Rouge)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message détaillé diffusé :
            </label>
            <input
              type="text"
              value={banner.message}
              onChange={(e) => setBanner({ ...banner, message: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
              placeholder="Ex: Les nouveaux modèles Claude 3.5 Sonnet sont désormais disponibles."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={banner.allowDismiss}
                onChange={(e) => setBanner({ ...banner, allowDismiss: e.target.checked })}
                className="rounded-sm accent-amber-600"
              />
              Autoriser les utilisateurs à fermer la bannière
            </label>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Diffuser l'Annonce
            </button>
          </div>
        </form>

        {/* Previsualisation de la banniere */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-white/5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Eye size={12} /> Aperçu en temps réel tel qu'affiché pour vos utilisateurs :
          </span>

          <div
            className={`p-3 rounded-lg flex items-center justify-between gap-3 text-xs ${
              banner.type === 'urgent'
                ? 'bg-red-600/90 text-white'
                : banner.type === 'warning'
                ? 'bg-amber-500/90 text-slate-950'
                : 'bg-linear-to-r from-indigo-900/90 via-purple-900/90 to-blue-900/90 text-white'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {banner.type === 'urgent' ? (
                <AlertOctagon size={16} className="text-white shrink-0" />
              ) : banner.type === 'warning' ? (
                <AlertTriangle size={16} className="text-slate-950 shrink-0" />
              ) : (
                <Sparkles size={16} className="text-indigo-300 shrink-0" />
              )}
              <strong className="truncate">{banner.title || 'Titre de l annonce'} :</strong>
              <span className="truncate opacity-90">{banner.message || 'Votre message ici...'}</span>
            </div>
            {banner.allowDismiss && (
              <span className="text-[10px] opacity-75 font-mono">✕ [Fermer]</span>
            )}
          </div>
        </div>
      </div>

      {/* Planificateur de Maintenance Programmee */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-400" />
              Planificateur de Maintenance Technique
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Préparez une coupure technique à l'avance sans devoir être devant votre écran au moment de l'opération.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={maintenance.enabled}
              onChange={(e) => setMaintenance({ ...maintenance, enabled: e.target.checked })}
              className="rounded-sm accent-indigo-600"
            />
            <span className="text-slate-800 dark:text-slate-200">
              {maintenance.enabled ? 'Planification Active' : 'Désactivée'}
            </span>
          </label>
        </div>

        <form onSubmit={handleMaintenanceSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date et Heure de Début :
              </label>
              <input
                type="datetime-local"
                value={
                  maintenance.scheduledStart
                    ? new Date(maintenance.scheduledStart).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setMaintenance({
                    ...maintenance,
                    scheduledStart: new Date(e.target.value).toISOString(),
                  })
                }
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Durée Estimée (minutes) :
              </label>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={maintenance.estimatedDurationMinutes}
                onChange={(e) =>
                  setMaintenance({
                    ...maintenance,
                    estimatedDurationMinutes: parseInt(e.target.value, 10) || 30,
                  })
                }
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message d'avertissement affiché aux utilisateurs :
            </label>
            <input
              type="text"
              value={maintenance.warningNotice}
              onChange={(e) =>
                setMaintenance({ ...maintenance, warningNotice: e.target.value })
              }
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={maintenance.autoLockWhenReached}
                onChange={(e) =>
                  setMaintenance({ ...maintenance, autoLockWhenReached: e.target.checked })
                }
                className="rounded-sm accent-indigo-600"
              />
              Activer automatiquement le mode maintenance stricte à l'heure H
            </label>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Enregistrer la Planification
            </button>
          </div>
        </form>
      </div>

      {/* Module 3 : Notification Externe par E-mail & Campagnes de Release */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Mail size={14} className="text-purple-400" />
            Campagne de Notification Externe par E-mail (Release v0.4.0)
          </h4>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            <strong>{parsedRecipients.length}</strong> utilisateur(s) ciblé(s)
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Envoyez directement l'e-mail officiel avec les nouvelles fonctionnalités (Swarm 2.0, WebContainers & Codebase Search) dans les boîtes de réception de vos utilisateurs.
        </p>

        {/* Choix du fournisseur d'e-mail */}
        <div className="flex items-center gap-2 p-1 bg-slate-200/60 dark:bg-black/30 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setProvider('brevo')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              provider === 'brevo'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Brevo (Recommandé • Actif)
          </button>
          <button
            type="button"
            onClick={() => setProvider('resend')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              provider === 'resend'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Resend (Sandbox / Domaine vérifié)
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sujet de l'e-mail :
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom de l'expéditeur :
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail de l'expéditeur :
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {provider === 'brevo' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clé d'API Brevo v3 :
              </label>
              <input
                type="password"
                placeholder="xkeysib-..."
                value={brevoApiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setBrevoApiKey(val);
                  if (typeof window !== 'undefined') localStorage.setItem('nexus_admin_brevo_api_key', val);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clé d'API Resend :
              </label>
              <input
                type="password"
                placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                value={resendApiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setResendApiKey(val);
                  if (typeof window !== 'undefined') localStorage.setItem('nexus_admin_resend_api_key', val);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono"
              />
            </div>
          )}

          {/* Destinataires modulables */}
          <div className="border border-slate-200 dark:border-white/10 rounded-xl p-3 bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users size={13} className="text-purple-400" />
                Liste des destinataires ({parsedRecipients.length} e-mails valides)
              </span>
              <button
                type="button"
                onClick={() => setShowRecipientsEditor(!showRecipientsEditor)}
                className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showRecipientsEditor ? (
                  <>
                    <span>Réduire</span>
                    <ChevronUp size={12} />
                  </>
                ) : (
                  <>
                    <span>Afficher / Modifier la liste</span>
                    <ChevronDown size={12} />
                  </>
                )}
              </button>
            </div>

            {showRecipientsEditor && (
              <div className="mt-2.5 space-y-1.5">
                <textarea
                  rows={4}
                  value={recipientsInput}
                  onChange={(e) => setRecipientsInput(e.target.value)}
                  placeholder="Collez ici les adresses e-mail des utilisateurs, séparées par des virgules ou retours à la ligne..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-black/40 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Astuce : vous pouvez coller directement la liste des e-mails exportés de Supabase ou d'un fichier.
                </p>
              </div>
            )}
          </div>

          {/* Actions & Boutons d'export */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={handleSendEmailCampaign}
              disabled={isSendingEmail || !emailSubject.trim() || parsedRecipients.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send size={13} />
              <span>
                {isSendingEmail
                  ? 'Envoi en cours...'
                  : `Diffuser la Campagne E-mail (${provider === 'brevo' ? 'Brevo' : 'Resend'})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyEmailHtml}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Copier le code source HTML complet prêt pour Brevo, Mailchimp ou Resend"
            >
              {emailCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{emailCopied ? 'HTML copié !' : 'Copier le Template HTML'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Télécharger la liste des destinataires sous format CSV"
            >
              <Download size={13} />
              <span>Exporter la liste des e-mails (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHtmlPreview(!showHtmlPreview)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer ml-auto"
            >
              <Eye size={13} />
              <span>{showHtmlPreview ? 'Masquer Aperçu' : 'Prévisualiser'}</span>
            </button>
          </div>

          {/* Prévisualisation Iframe du Template */}
          {showHtmlPreview && (
            <div className="mt-3 rounded-xl border border-slate-300 dark:border-white/15 overflow-hidden bg-black/40">
              <div className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-300 border-b border-slate-300 dark:border-white/10 flex items-center justify-between">
                <span>Rendu responsive de l'e-mail</span>
                <span className="text-[10px] text-slate-400">Desktop & Mobile ready</span>
              </div>
              <iframe
                title="Email Preview"
                srcDoc={generateReleaseNotificationHtml({ version: '0.4.0' })}
                className="w-full h-96 border-none bg-[#070712]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
