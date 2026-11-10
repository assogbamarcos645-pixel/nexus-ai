/**
 * src/app/index.ts
 *
 * Point d'entrée de la couche "app" — initialisation globale,
 * providers futurs (Router, AuthProvider, QueryClientProvider, etc.)
 *
 * Roadmap :
 *  - Ajouter React Router ici quand la navigation multi-pages sera nécessaire
 *  - Envelopper dans <AuthProvider> quand l'auth sera activée
 *  - Ajouter un <QueryClientProvider> si React Query est adopté
 */

export { default as App } from '../App';
