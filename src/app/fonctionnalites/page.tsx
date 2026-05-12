"use client";

import { useRef } from 'react'
import { PublicLayout } from '@/components/layout/public-layout'
import { motion, useInView } from 'framer-motion'
import {
  CheckCircle,
  CreditCard,
  CalendarDays,
  ShoppingCart,
  Landmark,
  PiggyBank,
  Heart,
  BarChart3,
  Music,
  Wheat,
  ShieldCheck,
  Smartphone,
  MapPin,
  UserCheck,
  Users,
  QrCode,
  Package,
  Star,
  ArrowRightLeft,
  Baby,
  Flower2,
  MessageCircle,
  Megaphone,
  Mic,
  FileText,
  PieChart,
  Download,
  Sparkles,
  Target,
  BookOpen,
  Calculator,
  TrendingUp,
  Store,
  Receipt,
  Bell,
  Vote,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] },
  },
}

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] },
  },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
}

/* ------------------------------------------------------------------ */
/*  Module data                                                        */
/* ------------------------------------------------------------------ */
const modules = [
  {
    id: 'module-01',
    number: '01',
    badgeBg: 'bg-forest',
    title: 'Adhésion & Gestion des Profils',
    description:
      "L'entrée dans la confiance. Vérifiez, profilez, et organisez vos membres avec des rôles adaptés à chaque tradition communautaire.",
    features: [
      'Inscription multi-étapes avec sauvegarde automatique',
      'Vérification d\'identité : photo CNI + selfie de validation',
      'Géolocalisation du domicile pour regroupements locaux',
      'Rôles hiérarchiques : Membre, Trésorier, Président, Secrétaire, Conseil des Sages',
      'Parrainage obligatoire avec période probatoire et bonus de scoring',
    ],
    cta: 'En Savoir Plus',
    ctaStyle: 'ghost' as const,
    visualType: 'phone-mockup',
  },
  {
    id: 'module-02',
    number: '02',
    badgeBg: 'bg-terracotta',
    title: 'Cotisations & Paiements Multi-Supports',
    description:
      'Cash, nature, services — chaque contribution a sa place. Un système de conversion dynamique qui respecte la réalité du terrain.',
    features: [
      'Configuration flexible : fréquence, montant fixe/variable/capacité',
      'Mobile Money natif : MTN MoMo, Orange Money, Wave, Express Union',
      'Catalogue nature avec photos, unités, saisons, prix de référence',
      'Portefeuille de crédits-temps : 1 heure = 1 crédit échangeable',
      'Gestion des retards avec alertes progressives et fonds de solidarité',
    ],
    cta: 'Découvrir les Paiements',
    ctaStyle: 'secondary' as const,
    visualType: 'payment-tabs',
  },
  {
    id: 'module-03',
    number: '03',
    badgeBg: 'bg-teal',
    title: 'Sessions, Rotation & Bénéficiaires',
    description:
      'La transparence du tirage au sort. Un algorithme vérifiable, un calendrier partagé, et la garantie que chacun recevra son tour.',
    features: [
      'Configuration des cycles : membres, montants, fréquence, mode de désignation',
      'Tirage au sort cryptographique : hash SHA-256 + seed collectif, vérifiable publiquement',
      'Options avancées : céder son tour, échanger, reporter à un cycle suivant',
      'Calendrier interactif avec synchronisation téléphone et rappels hors ligne',
      'Désignation sécurisée avec validation 2FA (SMS + code appli)',
    ],
    highlight: {
      icon: ShieldCheck,
      text: "Le tirage est vérifiable par tous les membres. Personne — pas même l'administrateur — ne peut le manipuler.",
    },
    visualType: 'calendar',
  },
  {
    id: 'module-04',
    number: '04',
    badgeBg: 'bg-terracotta',
    title: 'Ventes, Achats Groupés & Commerce',
    description:
      'Transformez la force collective en pouvoir de négociation. Achetez ensemble pour moins cher, vendez ensemble pour plus.',
    features: [
      'Catalogue collaboratif avec notation des vendeurs et filtres géographiques',
      'Commandes collectives : panier groupé, négociation automatique par volume',
      'Répartition transparente des coûts : calcul automatique + frais de livraison',
      'Vente de production collective : mise en commun pour meilleur pouvoir de négociation',
      'Portefeuille commercial : suivi des transactions, marges, alertes opportunités',
    ],
    visualType: 'product-grid',
  },
  {
    id: 'module-05',
    number: '05',
    badgeBg: 'bg-forest',
    title: 'Prêts, Crédit & Microfinance Interne',
    description:
      'Votre groupe comme banque communautaire. Des prêts accessibles, un scoring transparent, et des garanties qui se basent sur la confiance — pas sur les biens.',
    features: [
      'Demande simplifiée : montant, durée, motif, mode de remboursement',
      'Score de crédit communautaire : historique, contributions, parrainages, évaluations',
      'Plafonds progressifs : plus le score est élevé, plus le prêt est accessible',
      'Garanties flexibles : caution solidaire, gage en nature, engagement moral',
      'Fonds de garantie solidaire : contribution volontaire couvrant les défauts',
    ],
    progressBars: [
      { label: 'Novice — Prêt max: 50,000 FCFA', fill: 30, color: 'bg-terracotta-light' },
      { label: 'Engagé — Prêt max: 200,000 FCFA', fill: 60, color: 'bg-gold' },
      { label: 'Légende — Prêt illimité', fill: 100, color: 'bg-gradient-to-r from-gold to-teal-light' },
    ],
    visualType: 'loan-flow',
  },
  {
    id: 'module-06',
    number: '06',
    badgeBg: 'bg-gold',
    badgeText: 'text-charcoal',
    title: 'Investissement & Épargne Collective',
    description:
      'Faites fructifier la force de votre groupe. Des comptes d\'épargne programmée aux projets d\'investissement collectif — chaque FCFA compte.',
    features: [
      'Épargne programmée : prélèvement automatique après chaque cotisation',
      'Objectifs personnalisés avec thermomètre de progression et projections',
      'Projets d\'investissement collectif : proposition, vote démocratique, suivi d\'exécution',
      'Portefeuille diversifié : terrain, bétail, équipement, coopératives locales',
      'Éducation financière intégrée : modules, simulateurs, conseils IA adaptés',
    ],
    visualType: 'savings-dashboard',
  },
  {
    id: 'module-07',
    number: '07',
    badgeBg: 'bg-teal',
    title: 'Solidarité, Aide Sociale & Assistance',
    description:
      "Parce que la tontine n'est pas que de l'argent. Naissances, mariages, décès, maladies — votre groupe est votre filet de sécurité.",
    features: [
      'Déclaration guidée d\'événements de vie avec validation par les pairs',
      'Barèmes d\'aide paramétrables : cash + nature + service selon l\'événement',
      'Aide anonyme disponible : discrétion garantie pour les situations sensibles',
      'Fonds d\'urgence permanent : contribution automatique symbolique, accès rapide',
      'Suivi d\'impact : témoignages, photos, indicateurs de l\'aide reçue',
    ],
    eventCards: [
      { icon: Baby, label: 'Naissance', value: '25,000 FCFA + layette', bg: 'bg-pink-100 text-pink-700' },
      { icon: Heart, label: 'Mariage', value: '50,000 FCFA + tissus', bg: 'bg-gold-light text-amber-800' },
      { icon: Flower2, label: 'Décès', value: '75,000 FCFA + 2 sacs riz', bg: 'bg-stone text-stone-700' },
    ],
    visualType: 'solidarity-hub',
  },
  {
    id: 'module-08',
    number: '08',
    badgeBg: 'bg-indigo',
    title: 'Budget, Comptabilité & Reporting',
    description:
      'Transparence radicale. Chaque membre voit, comprend, et vérifie. Une comptabilité automatique qui élimine les disputes et renforce la confiance.',
    features: [
      'Tableau de bord personnalisé : solde cash, valeur nature, crédits-temps',
      'Grand livre partagé : toutes transactions horodatées et validées',
      'États financiers standards : bilan, compte de résultat, flux de trésorerie',
      'Rapports mensuels automatiques et assemblées générales virtuelles',
      'Audit facilité : journal complet, traçabilité des modifications',
    ],
    visualType: 'accounting-dashboard',
  },
  {
    id: 'module-09',
    number: '09',
    badgeBg: 'bg-terracotta',
    title: 'Dons, Culture & Engagement Communautaire',
    description:
      'Votre tontine comme moteur de la vie communautaire. Cagnottes thématiques, fêtes traditionnelles, projets collectifs — et la reconnaissance de chaque engagement.',
    features: [
      'Campagnes de collecte thématiques avec objectifs visuels et transparence totale',
      'Organisation d\'événements culturels : agenda partagé, gestion logistique, budget',
      'Mur des remerciements et certifications numériques vérifiables',
      'Annuaire des compétences et carte des ressources communautaires',
      'Messagerie de groupe sécurisée et intégration avec services externes',
    ],
    cta: 'Voir les Fonctionnalités Culturelles',
    ctaStyle: 'ghost' as const,
    visualType: 'culture-gallery',
  },
  {
    id: 'module-10',
    number: '10',
    badgeBg: 'bg-forest',
    title: 'Gestion des Tontines en Nature',
    description:
      'Pour les tontines agricoles et rurales. Du catalogue de produits à la cartographie des parcelles — une logistique complète pour la terre et ceux qui la travaillent.',
    features: [
      'Catalogue local : produits par région, photos, unités, saisons, prix de référence',
      'Échelle de qualité standardisée : Grade A/B/C avec critères objectifs',
      'Logistique optimisée : géolocalisation des dépôts, planning de tournées, covoiturage',
      'Contrôle qualité : checklist, notation réciproque, médiation par pairs',
      'Gestion agricole avancée : cartographie GPS, planification culturale, météo intégrée',
    ],
    highlight: {
      icon: Wheat,
      text: 'Spécialement conçu pour les zones rurales avec faible connectivité. Mode hors ligne complet.',
    },
    visualType: 'agri-map',
  },
  {
    id: 'module-11',
    number: '11',
    badgeBg: 'bg-teal',
    title: 'Chat de Groupe',
    description:
      'Communiquez en temps réel au sein de chaque tontine. Messagerie sécurisée, annonces et partage de médias pour garder votre communauté connectée.',
    features: [
      'Messagerie instantanée dédiée par tontine avec chiffrement de bout en bout',
      'Messages vocaux pour les membres avec faible littératie ou préférence orale',
      'Annonces épinglées et notifications prioritaires pour les décisions importantes',
      'Partage de fichiers et médias : photos, documents, reçus dans la conversation',
      'Mentions et réponses threadées pour structurer les discussions collectives',
    ],
    cta: 'Découvrir le Chat',
    ctaStyle: 'ghost' as const,
    visualType: 'chat-mockup',
  },
  {
    id: 'module-12',
    number: '12',
    badgeBg: 'bg-indigo',
    title: 'Rapports Croisés & Analytics',
    description:
      'Transformez vos données en décisions. Rapports individuels, analyses multi-tontines et prévisions intelligentes pour piloter votre parcours financier communautaire.',
    features: [
      'Rapports personnalisés par membre avec historique complet et indicateurs clés',
      'Analyses croisées : visualisez vos contributions sur plusieurs tontines simultanément',
      'Tableaux de bord comparatifs avec filtres par période, type et groupe',
      'Export PDF, Excel et CSV pour partage externe et archives personnelles',
      'Prévisions intelligentes : tendances, projections et alertes basées sur vos habitudes',
    ],
    visualType: 'analytics-dashboard',
  },
  {
    id: 'module-13',
    number: '13',
    badgeBg: 'bg-gold',
    badgeText: 'text-charcoal',
    title: 'Conseiller Financier IA',
    description:
      'Un coach financier personnel propulsé par intelligence artificielle. Conseils adaptés, simulations et éducation pour maximiser l\'impact de chaque FCFA.',
    features: [
      'Conseils financiers personnalisés basés sur votre profil, objectifs et historique',
      'Suivi d\'objectifs d\'épargne avec visualisation de progression et rappels motivants',
      'Astuces contextualisées selon votre région, saison et type de tontine',
      'Simulateur de budget : testez différents scénarios avant de vous engager',
      'Contenu éducatif en langues locales : audio, vidéo et articles interactifs',
    ],
    visualType: 'ai-advisor',
  },
  {
    id: 'module-14',
    number: '14',
    badgeBg: 'bg-gold',
    badgeText: 'text-charcoal',
    title: 'Épargne & Investissement',
    description:
      'Fixez des objectifs d\'épargne, investissez collectivement, et apprenez la finance. Transformez vos cotisations en capital productif.',
    features: [
      'Objectifs d\'épargne personnalisés avec thermomètre et projections',
      'Investissement collectif : terrain, bétail, équipement, coopératives',
      'Éducation financière intégrée : modules, simulateurs, conseils IA',
      'Épargne programmée : prélèvement automatique après chaque cotisation',
      'Portefeuille diversifié avec suivi des rendements',
    ],
    visualType: 'savings-goals',
  },
  {
    id: 'module-15',
    number: '15',
    badgeBg: 'bg-terracotta',
    title: 'Marketplace & Commerce',
    description:
      'Catalogue collaboratif, commandes groupées, et vente collective. Achetez ensemble pour moins cher, vendez ensemble pour plus.',
    features: [
      'Catalogue collaboratif avec notation des vendeurs et filtres géographiques',
      'Commandes collectives : panier groupé, négociation automatique par volume',
      'Vente de production collective : mise en commun pour meilleur pouvoir de négociation',
      'Portefeuille commercial : suivi des transactions, marges, alertes opportunités',
      'Répartition transparente des coûts : calcul automatique + frais de livraison',
    ],
    visualType: 'marketplace-hub',
  },
  {
    id: 'module-16',
    number: '16',
    badgeBg: 'bg-forest',
    title: 'Comptabilité & Assemblée',
    description:
      'Grand livre partagé, rapports OHADA, et assemblée générale virtuelle. La transparence radicale au service de la confiance.',
    features: [
      'Grand livre partagé : toutes transactions horodatées et validées',
      'États financiers standards : bilan, compte de résultat, flux de trésorerie',
      'Rapports mensuels automatiques et assemblées générales virtuelles',
      'Audit facilité : journal complet, traçabilité des modifications',
      'Vote démocratique sur les décisions d\'investissement et de prêt',
    ],
    visualType: 'accounting-ledger',
  },
  {
    id: 'module-17',
    number: '17',
    badgeBg: 'bg-teal',
    title: 'Notifications Intelligentes',
    description:
      'Push, SMS, email — configurez vos alertes par tontine. Mode Ne Pas Déranger, fréquences personnalisées, et résumés intelligents.',
    features: [
      'Multi-canal : notifications push, SMS, email selon votre préférence',
      'Configuration par tontine : alertes cotisations, sessions, prêts, solidarité',
      'Mode Ne Pas Déranger avec plages horaires personnalisables',
      'Résumés intelligents : hebdomadaire, mensuel, ou en temps réel',
      'Alertes croisées : conflits de calendrier, budgets, et anomalies',
    ],
    visualType: 'notifications-hub',
  },
  {
    id: 'module-18',
    number: '18',
    badgeBg: 'bg-indigo',
    title: 'Calendrier Fusionné',
    description:
      'Un seul calendrier pour toutes vos tontines. Synchronisation iCal, gestion des événements, et rappels personnalisés.',
    features: [
      'Vue fusionnée de tous les tours, cotisations et événements de vos tontines',
      'Synchronisation iCal et Google Calendar en un clic',
      'Gestion des événements : création, modification, invitation des membres',
      'Rappels personnalisés : 1 jour, 1 semaine, ou selon votre choix',
      'Détection automatique des conflits de calendrier entre tontines',
    ],
    visualType: 'merged-calendar',
  },
]

const moduleNavItems = [
  { num: '1', label: 'Adhésion' },
  { num: '2', label: 'Cotisations' },
  { num: '3', label: 'Rotation' },
  { num: '4', label: 'Commerce' },
  { num: '5', label: 'Prêts' },
  { num: '6', label: 'Épargne' },
  { num: '7', label: 'Solidarité' },
  { num: '8', label: 'Comptabilité' },
  { num: '9', label: 'Culture' },
  { num: '10', label: 'Nature' },
  { num: '11', label: 'Chat' },
  { num: '12', label: 'Analytics' },
  { num: '13', label: 'IA Conseil' },
  { num: '14', label: 'Épargne+' },
  { num: '15', label: 'Marketplace' },
  { num: '16', label: 'Assemblée' },
  { num: '17', label: 'Alertes' },
  { num: '18', label: 'Calendrier' },
]

/* ------------------------------------------------------------------ */
/*  Visual mockup components                                           */
/* ------------------------------------------------------------------ */

function MockupPhone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      <div className="rounded-[2rem] bg-charcoal p-2 shadow-2xl">
        <div className="rounded-[1.5rem] bg-warm-white overflow-hidden">
          <div className="h-6 bg-charcoal/5 flex items-center justify-center gap-1">
            <div className="w-16 h-4 bg-charcoal/10 rounded-full" />
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Module01Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <MockupPhone>
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ash">Étape 2/4</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`w-6 h-1 rounded-full ${s <= 2 ? 'bg-forest' : 'bg-stone'}`} />
              ))}
            </div>
          </div>
          <div className="border-2 border-dashed border-stone rounded-lg p-4 flex flex-col items-center gap-2">
            <Smartphone className="w-6 h-6 text-ash" />
            <span className="text-xs text-graphite">Photo CNI</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-cream rounded-lg">
            <MapPin className="w-4 h-4 text-forest" />
            <span className="text-xs text-graphite">Yaoundé, Cameroun</span>
          </div>
          <div className="flex gap-1">
            {['FR', 'EN', 'Gh'].map((l) => (
              <span key={l} className={`text-[10px] px-2 py-1 rounded ${l === 'FR' ? 'bg-forest text-white' : 'bg-stone text-graphite'}`}>{l}</span>
            ))}
          </div>
        </div>
      </MockupPhone>
      <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 border border-stone">
        <UserCheck className="w-4 h-4 text-success" />
        <span className="text-xs font-medium text-charcoal">Profil vérifié</span>
      </div>
    </div>
    
  )
}

function Module02Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="bg-warm-white rounded-2xl shadow-xl border border-stone p-5 w-full max-w-sm">
        <div className="flex gap-2 mb-4">
          {['Cash', 'Nature', 'Services'].map((t, i) => (
            <span key={t} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${i === 0 ? 'bg-forest text-white' : 'bg-stone text-graphite'}`}>{t}</span>
          ))}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
            <CreditCard className="w-5 h-5 text-forest" />
            <div>
              <p className="text-sm font-medium text-charcoal">25,000 FCFA</p>
              <p className="text-xs text-ash">MTN MoMo — Validé</p>
            </div>
            <CheckCircle className="w-5 h-5 text-success ml-auto" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-graphite bg-gold-light/30 p-2 rounded-lg">
          <QrCode className="w-4 h-4" />
          <span>Conversion : 1 sac maïs = 12,500 FCFA</span>
        </div>
      </div>
      <div className="absolute -bottom-2 -left-2 bg-warm-white rounded-xl shadow-lg px-3 py-2 border border-stone">
        <p className="text-xs font-medium text-charcoal">Reçu #2847</p>
        <p className="text-[10px] text-success">Validé</p>
      </div>
    </div>
    
  )
}

function Module03Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="bg-warm-white rounded-2xl shadow-xl border border-stone p-5 w-full max-w-sm">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => (
            <span key={d} className="text-[10px] text-center text-ash font-medium">{d}</span>
          ))}
          {Array.from({ length: 31 }, (_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-md flex items-center justify-center text-[10px] ${
                i === 14 ? 'bg-gold text-white font-bold' : i === 6 || i === 20 ? 'bg-forest/10' : i === 12 ? 'bg-terracotta/10' : i === 26 ? 'bg-teal/10' : 'hover:bg-stone'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="bg-cream rounded-xl p-3 border-l-4 border-gold">
          <p className="text-xs font-medium text-charcoal">Tour #12 — Bénéficiaire: Mariette B.</p>
          <p className="text-xs text-forest font-semibold">150,000 FCFA</p>
        </div>
        <p className="mt-3 text-[10px] text-ash font-mono">Seed: 0x7a3f...9e2d — Vérifiable</p>
      </div>
    </div>
    
  )
}

function Module04Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-3">
        <div className="bg-warm-white rounded-xl shadow-md border border-stone p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-forest/10 rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-forest" /></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">Maïs — 25 kg</p>
            <p className="text-xs text-ash">12,500 FCFA — Grade A</p>
          </div>
          <Star className="w-4 h-4 text-gold" />
        </div>
        <div className="bg-warm-white rounded-xl shadow-md border border-stone p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-terracotta/10 rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-terracotta" /></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">Riz — 50 kg</p>
            <p className="text-xs text-ash">28,000 FCFA — Disponible</p>
          </div>
          <Star className="w-4 h-4 text-gold" />
        </div>
        <div className="bg-warm-white rounded-xl shadow-md border border-stone p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center"><Package className="w-6 h-6 text-teal" /></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">Huile de palme — 20L</p>
            <p className="text-xs text-ash">15,000 FCFA — Négociable</p>
          </div>
          <Star className="w-4 h-4 text-gold" />
        </div>
        <div className="bg-forest text-white rounded-xl px-4 py-2 text-xs font-medium text-center">
          Commande collective : 3 membres — Prix groupé: -15%
        </div>
      </div>
    </div>
    
  )
}

function Module05Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-warm-white rounded-xl shadow-lg border border-stone p-4">
          <p className="text-sm font-medium text-charcoal">Demande de prêt</p>
          <p className="text-2xl font-bold text-forest">100,000 FCFA</p>
          <p className="text-xs text-ash">6 mois — Motif: Équipement</p>
        </div>
        <div className="flex justify-center"><ArrowRightLeft className="w-5 h-5 text-ash rotate-90" /></div>
        <div className="bg-cream rounded-xl border border-stone p-4">
          <p className="text-sm font-medium text-charcoal">Vote du groupe</p>
          <p className="text-lg font-bold text-forest">12/15 approuvent</p>
        </div>
        <div className="flex justify-center"><ArrowRightLeft className="w-5 h-5 text-ash rotate-90" /></div>
        <div className="bg-warm-white rounded-xl shadow-lg border-l-4 border-success p-4">
          <p className="text-sm font-medium text-charcoal flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success" /> Prêt accordé</p>
          <p className="text-xs text-graphite mt-1">Remboursement: 18,500 FCFA/mois</p>
        </div>
        <div className="bg-dark-surface rounded-xl p-3">
          <p className="text-xs text-cream/70 mb-1">Progression remboursement</p>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-forest rounded-full" style={{ width: '67%' }} />
          </div>
          <p className="text-xs text-cream font-bold mt-1">67%</p>
        </div>
      </div>
    </div>
    
  )
}

function Module06Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-warm-white rounded-2xl shadow-xl border border-stone p-5">
          <p className="text-sm font-medium text-charcoal">Objectif: École des enfants</p>
          <p className="text-2xl font-bold text-forest">150,000 FCFA</p>
          <div className="mt-3 h-4 bg-stone rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-forest to-teal rounded-full" style={{ width: '68%' }} />
          </div>
          <p className="text-xs text-ash mt-2">68% atteint — Objectif dans 10 mois</p>
        </div>
        <div className="bg-warm-white rounded-xl shadow-md border border-stone p-4">
          <p className="text-xs text-ash mb-2">Répartition épargne</p>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-conic from-forest from-0% via-teal via-40% to-gold to-75%" style={{ background: 'conic-gradient(#1B4D3E 0% 40%, #0D7377 40% 75%, #D4A843 75% 100%)' }} />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-forest" /> 40% Liquid</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal" /> 35% Projets</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gold" /> 25% Solidaire</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  )
}

function Module07Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm">
        <div className="bg-warm-white rounded-2xl shadow-xl border border-stone p-5 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-forest/5 rounded-full flex items-center justify-center z-10">
            <Users className="w-8 h-8 text-forest" />
          </div>
          <p className="text-center text-sm font-semibold text-charcoal mb-6">Tontine &quot;Famille Unie&quot;</p>
          <div className="space-y-4">
            {[
              { icon: Baby, label: 'Aide Naissance', date: 'Déc 2024', color: 'text-pink-600', bg: 'bg-pink-50' },
              { icon: Heart, label: 'Aide Maladie', date: 'Jan 2025', color: 'text-red-500', bg: 'bg-red-50' },
              { icon: Flower2, label: 'Aide Décès', date: 'Fév 2025', color: 'text-stone-600', bg: 'bg-stone-100' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-charcoal">{item.label}</p>
                  <p className="text-[10px] text-ash">{item.date}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((c) => (
                    <CheckCircle key={c} className="w-3 h-3 text-success" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
  )
}

function Module08Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm bg-dark-surface rounded-2xl shadow-xl border border-white/10 p-5">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Solde', value: '1.2M FCFA' },
            { label: 'Cotisations', value: '92%' },
            { label: 'Prêts actifs', value: '8' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-xs text-cream/60">{kpi.label}</p>
              <p className="text-sm font-bold text-cream">{kpi.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-cream/60 mb-2">Flux mensuels</p>
        <div className="flex items-end gap-1 h-20">
          {[40, 55, 35, 70, 45, 60, 50, 80, 65, 55, 75, 60].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i % 2 === 0 ? '#2D7A62' : '#C4782C' }} />
          ))}
        </div>
        <div className="mt-4 bg-white/5 rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs text-cream">Rapport mensuel — Prêt à télécharger</span>
          <span className="text-[10px] text-cream/60">PDF / Excel / CSV</span>
        </div>
      </div>
    </div>
    
  )
}

function Module09Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {['/feature-solidarite.jpg', '/feature-nature.jpg', '/feature-adhesion.jpg', '/feature-cotisations.jpg'].map((src, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-md group">
              <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            </div>
          ))}
        </div>
        <div className="bg-warm-white rounded-xl shadow-md border border-stone p-4">
          <p className="text-xs font-semibold text-charcoal mb-2">Mur des remerciements</p>
          <div className="space-y-2">
            {[
              { name: 'Jean K.', msg: 'Merci à tous pour l\'aide naissance !' },
              { name: 'Mariette B.', msg: 'La cérémonie était magnifique, merci.' },
            ].map((t) => (
              <div key={t.name} className="flex items-start gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-forest/10 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-forest">{t.name[0]}</span></div>
                <div>
                  <p className="font-medium text-charcoal">{t.name}</p>
                  <p className="text-ash">{t.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
  )
}

function Module10Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-warm-white rounded-2xl shadow-xl border border-stone p-5">
          <p className="text-sm font-semibold text-charcoal mb-3">Carte des parcelles</p>
          <div className="bg-cream rounded-xl p-4 h-32 relative overflow-hidden">
            <div className="absolute top-2 left-2 w-8 h-8 bg-forest/20 rounded flex items-center justify-center">
              <Wheat className="w-4 h-4 text-forest" />
            </div>
            <p className="absolute bottom-2 left-2 text-[10px] bg-white/80 px-2 py-1 rounded">Parcelle A — Macabo — 15 sacs</p>
            <div className="absolute top-8 right-4 w-8 h-8 bg-gold/20 rounded flex items-center justify-center">
              <Wheat className="w-4 h-4 text-gold" />
            </div>
            <p className="absolute bottom-2 right-2 text-[10px] bg-white/80 px-2 py-1 rounded">Parcelle B — Maïs</p>
          </div>
          <div className="mt-3 bg-teal/10 rounded-lg p-2 flex items-center gap-2 text-xs text-teal">
            <span>Pluie attendue Jeudi</span>
          </div>
          <div className="mt-2 flex gap-2">
            {['Grade A', 'Grade B', 'Grade C'].map((g) => (
              <span key={g} className="text-[10px] px-2 py-1 bg-forest/10 text-forest rounded-full">{g}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
    
  )
}

function Module11Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm bg-dark-surface rounded-2xl shadow-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-teal" />
            <span className="text-xs font-semibold text-cream">Tontine Famille Unie</span>
          </div>
          <span className="text-[10px] text-cream/50">12 membres</span>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Marie T.', msg: 'La cotisation de cette semaine est confirmée !', time: '10:42', me: false },
            { name: 'Vous', msg: 'Merci pour le rappel, je viens de cotiser.', time: '10:45', me: true },
            { name: 'Jean K.', msg: '', time: '10:50', me: false, voice: true },
          ].map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.me ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.me ? 'bg-teal' : 'bg-forest'}`}>
                <span className="text-[10px] font-bold text-white">{m.name[0]}</span>
              </div>
              <div className={`max-w-[75%] rounded-xl px-3 py-2 ${m.me ? 'bg-teal/20' : 'bg-white/10'}`}>
                {m.voice ? (
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-gold" />
                    <div className="flex gap-0.5 items-end h-3">
                      {[3, 6, 4, 8, 5, 7, 4].map((h, j) => (
                        <div key={j} className="w-0.5 bg-gold rounded-full" style={{ height: `${h * 3}px` }} />
                      ))}
                    </div>
                    <span className="text-[10px] text-cream/60">0:24</span>
                  </div>
                ) : (
                  <p className="text-xs text-cream">{m.msg}</p>
                )}
                <p className="text-[10px] text-cream/40 mt-1">{m.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-gold/20 rounded-lg p-2 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-gold" />
          <p className="text-xs text-gold">Annonce épinglée : Assemblée générale le 15 mars</p>
        </div>
      </div>
    </div>
    
  )
}

function Module12Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm bg-warm-white rounded-2xl shadow-xl border border-stone p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-charcoal">Rapports Croisés</p>
          <div className="flex gap-1">
            <Download className="w-4 h-4 text-ash" />
            <FileText className="w-4 h-4 text-ash" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Tontines', value: '4' },
            { label: 'Cotisations', value: '1.8M' },
            { label: 'Taux', value: '96%' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-cream rounded-lg p-2 text-center">
              <p className="text-[10px] text-ash">{kpi.label}</p>
              <p className="text-sm font-bold text-charcoal">{kpi.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-1 h-20 mb-3">
          {[30, 45, 25, 60, 40, 55, 35, 70, 50, 65, 45, 75].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i % 3 === 0 ? '#1B4D3E' : i % 3 === 1 ? '#0D7377' : '#C4782C' }} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-graphite mb-2">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-forest" /> Tontine A</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal" /> Tontine B</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-terracotta" /> Tontine C</div>
        </div>
        <div className="bg-indigo/10 rounded-lg p-2 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-indigo" />
          <span className="text-xs text-indigo">Prédiction : +12% de participation Q2</span>
        </div>
      </div>
    </div>
    
  )
}

function Module13Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-warm-white rounded-2xl shadow-xl border border-stone p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal">Conseiller IA</p>
              <p className="text-[10px] text-ash">Basé sur votre profil</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: Target, label: 'Objectif scolaire', value: '68%', color: 'text-forest', bg: 'bg-forest/10' },
              { icon: Calculator, label: 'Budget mensuel', value: '125K FCFA', color: 'text-teal', bg: 'bg-teal/10' },
              { icon: BookOpen, label: 'Cours suivis', value: '4 modules', color: 'text-terracotta', bg: 'bg-terracotta/10' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-2 bg-cream rounded-lg">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-ash">{item.label}</p>
                  <p className="text-sm font-bold text-charcoal">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-dark-surface rounded-xl border border-white/10 p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-cream">Conseil du jour</p>
              <p className="text-xs text-cream/70 mt-1">Vous pourriez augmenter votre cotisation de 5% pour atteindre votre objectif 2 semaines plus tôt.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  )
}

function Module14Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-warm-white rounded-2xl shadow-xl border border-stone p-5">
          <p className="text-sm font-semibold text-charcoal mb-3">Objectif: École des enfants</p>
          <p className="text-2xl font-bold text-forest">150,000 FCFA</p>
          <div className="mt-3 h-4 bg-stone rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-forest to-teal rounded-full" style={{ width: '68%' }} />
          </div>
          <p className="text-xs text-ash mt-2">68% atteint — Objectif dans 10 mois</p>
        </div>
        <div className="bg-warm-white rounded-xl shadow-md border border-stone p-4">
          <p className="text-xs font-semibold text-charcoal mb-2">Investissement collectif</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-xs text-ash">Projet terrain Douala</p>
              <p className="text-sm font-bold text-charcoal">12 membres — 2.4M FCFA</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  )
}

function Module15Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-3">
        <div className="bg-warm-white rounded-xl shadow-md border border-stone p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-forest/10 rounded-lg flex items-center justify-center"><Store className="w-6 h-6 text-forest" /></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">Maïs — 25 kg</p>
            <p className="text-xs text-ash">12,500 FCFA — Grade A</p>
          </div>
          <span className="text-[10px] px-2 py-1 bg-forest text-white rounded-full">Acheter</span>
        </div>
        <div className="bg-warm-white rounded-xl shadow-md border border-stone p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-terracotta/10 rounded-lg flex items-center justify-center"><Store className="w-6 h-6 text-terracotta" /></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-charcoal">Riz — 50 kg</p>
            <p className="text-xs text-ash">28,000 FCFA — Disponible</p>
          </div>
          <span className="text-[10px] px-2 py-1 bg-forest text-white rounded-full">Acheter</span>
        </div>
        <div className="bg-forest text-white rounded-xl px-4 py-2 text-xs font-medium text-center">
          Commande collective : 5 membres — Prix groupé: -20%
        </div>
      </div>
    </div>
    
  )
}

function Module16Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm bg-dark-surface rounded-2xl shadow-xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-cream">Grand livre</p>
          <span className="text-[10px] text-cream/60">OHADA</span>
        </div>
        <div className="space-y-2">
          {[
            { date: '12/01', label: 'Cotisation M.', montant: '50,000', type: '+' },
            { date: '15/01', label: 'Fonds urgence', montant: '5,000', type: '+' },
            { date: '20/01', label: 'Prêt accordé', montant: '100,000', type: '-' },
            { date: '25/01', label: 'Remboursement', montant: '18,500', type: '+' },
          ].map((l, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Receipt className="w-3 h-3 text-cream/40" />
                <span className="text-xs text-cream/80">{l.label}</span>
              </div>
              <span className={`text-xs font-bold ${l.type === '+' ? 'text-success' : 'text-error'}`}>{l.type}{l.montant}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-gold/20 rounded-lg p-2 flex items-center gap-2">
          <Vote className="w-4 h-4 text-gold" />
          <span className="text-xs text-gold">Assemblée : Vote investissement terrain — 8/10</span>
        </div>
      </div>
    </div>
    
  )
}

function Module17Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm space-y-3">
        <div className="bg-warm-white rounded-2xl shadow-xl border border-stone p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-forest" />
            <p className="text-sm font-semibold text-charcoal">Centrale d'alertes</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Cotisations', active: true, channel: 'Push' },
              { label: 'Sessions & Tirages', active: true, channel: 'SMS' },
              { label: 'Prêts', active: true, channel: 'Email' },
              { label: 'Solidarité', active: false, channel: '—' },
              { label: 'Messages', active: true, channel: 'Push' },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-cream rounded-lg">
                <span className="text-xs text-charcoal">{n.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${n.active ? 'bg-forest text-white' : 'bg-stone text-ash'}`}>{n.channel}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-terracotta/10 border border-terracotta/20 rounded-xl p-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-terracotta" />
          <span className="text-xs text-terracotta">Mode Ne Pas Déranger : 22h — 07h</span>
        </div>
      </div>
    </div>
    
  )
}

function Module18Visual() {
  return (
    <div className="relative flex items-center justify-center min-h-[400px]">
      <div className="w-full max-w-sm bg-warm-white rounded-2xl shadow-xl border border-stone p-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-5 h-5 text-forest" />
          <p className="text-sm font-semibold text-charcoal">Calendrier fusionné</p>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['L','M','M','J','V','S','D'].map(d => <span key={d} className="text-[10px] text-center text-ash font-medium">{d}</span>)}
          {Array.from({ length: 31 }, (_, i) => (
            <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-[10px] ${
              i === 4 ? 'bg-forest text-white' : i === 10 ? 'bg-gold/30' : i === 18 ? 'bg-terracotta/20' : i === 24 ? 'bg-teal/20' : 'hover:bg-stone'
            }`}>
              {i + 1}
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 p-1.5 bg-cream rounded-lg">
            <div className="w-2 h-2 rounded-full bg-forest" />
            <span className="text-xs text-charcoal">Tour ROSCA Famille Nkoudou — 5 mars</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-cream rounded-lg">
            <div className="w-2 h-2 rounded-full bg-gold" />
            <span className="text-xs text-charcoal">Cotisation ASCA Mamans — 12 mars</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 bg-cream rounded-lg">
            <div className="w-2 h-2 rounded-full bg-terracotta" />
            <span className="text-xs text-charcoal">Assemblée générale — 20 mars</span>
          </div>
        </div>
        <div className="mt-2 bg-terracotta/10 border border-terracotta/20 rounded-lg p-2 flex items-center gap-2">
          <Bell className="w-4 h-4 text-terracotta" />
          <span className="text-xs text-terracotta">Conflit : 2 tours le même jour dans 2 tontines</span>
        </div>
      </div>
    </div>
    
  )
}

const visualComponents: Record<string, React.FC> = {
  'phone-mockup': Module01Visual,
  'payment-tabs': Module02Visual,
  calendar: Module03Visual,
  'product-grid': Module04Visual,
  'loan-flow': Module05Visual,
  'savings-dashboard': Module06Visual,
  'solidarity-hub': Module07Visual,
  'accounting-dashboard': Module08Visual,
  'culture-gallery': Module09Visual,
  'agri-map': Module10Visual,
  'chat-mockup': Module11Visual,
  'analytics-dashboard': Module12Visual,
  'ai-advisor': Module13Visual,
  'savings-goals': Module14Visual,
  'marketplace-hub': Module15Visual,
  'accounting-ledger': Module16Visual,
  'notifications-hub': Module17Visual,
  'merged-calendar': Module18Visual,
}

/* ------------------------------------------------------------------ */
/*  Module section component                                           */
/* ------------------------------------------------------------------ */
function ModuleSection({
  module,
  index,
}: {
  module: (typeof modules)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })
  const isReversed = index % 2 === 1

  const Visual = visualComponents[module.visualType]

  const textContent = (
    <div className="space-y-5">
      <span className={`inline-block text-[0.6875rem] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full text-white ${module.badgeBg}`}>
        Module {module.number}
      </span>
      <h2 className="text-display-md text-charcoal">{module.title}</h2>
      <p className="text-body-lg text-graphite">{module.description}</p>
      <ul className="space-y-3">
        {module.features.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
            <span className="text-body text-graphite">{f}</span>
          </li>
        ))}
      </ul>

      {module.progressBars && (
        <div className="space-y-3 mt-4">
          {module.progressBars.map((bar, i) => (
            <div key={i}>
              <p className="text-caption text-ash mb-1">{bar.label}</p>
              <div className="h-2 bg-stone rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${bar.color}`}
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${bar.fill}%` } : { width: 0 }}
                  transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] as [number, number, number, number], delay: 0.3 + i * 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {module.eventCards && (
        <div className="flex flex-wrap gap-2 mt-4">
          {module.eventCards.map((card, i) => (
            <div key={i} className={`${card.bg} rounded-xl px-4 py-3 flex items-center gap-2`}>
              <card.icon className="w-4 h-4" />
              <div>
                <p className="text-xs font-medium">{card.label}</p>
                <p className="text-[10px] opacity-80">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {module.highlight && (
        <motion.div
          className="bg-gold-light rounded-2xl p-5 flex items-start gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number] }}
        >
          <ShieldCheck className="w-6 h-6 text-forest flex-shrink-0 mt-0.5" />
          <p className="text-body text-charcoal">{module.highlight.text}</p>
        </motion.div>
      )}

      {module.cta && (
        <button
          className={
            module.ctaStyle === 'ghost'
              ? 'rounded-xl px-6 py-3 font-body text-sm font-semibold text-forest hover:bg-forest/5 transition-all duration-200'
              : 'rounded-xl px-6 py-3 font-body text-sm font-semibold border-2 border-forest text-forest hover:bg-forest hover:text-white transition-all duration-200'
          }
        >
          {module.cta}
        </button>
      )}
    </div>
  )

  const visualContent = (
    <motion.div
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={scaleIn}
    >
      {Visual ? <Visual /> : null}
    </motion.div>
  )

  return (
    <section
      ref={ref}
      id={module.id}
      className={`py-24 lg:py-32 ${index % 2 === 0 ? 'bg-cream' : 'bg-warm-white'}`}
    >
      <div className="mx-auto max-w-[1280px] px-[clamp(1rem,5vw,3rem)]">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
          <motion.div
            className={isReversed ? 'lg:order-2' : 'lg:order-1'}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={isReversed ? slideRight : slideLeft}
          >
            {textContent}
          </motion.div>
          <div className={isReversed ? 'lg:order-1' : 'lg:order-2'}>{visualContent}</div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Features page                                                 */
/* ------------------------------------------------------------------ */
export default function Features() {
  const scrollToModule = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <PublicLayout>
    <div className="bg-cream">
      {/* Hero */}
      <section className="relative min-h-[70dvh] flex flex-col items-center justify-center px-4 pt-[4.5rem] pb-16 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 text-center max-w-[800px] mx-auto">
          <motion.span
            className="inline-block text-[0.6875rem] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full bg-gold text-charcoal mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          >
            Modules Fonctionnels
          </motion.span>

          <motion.h1
            className="text-display-xl text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          >
            <span className="text-gold">18</span> Modules.
            <br />
            Un Écosystème Complet.
          </motion.h1>

          <motion.p
            className="text-body-lg text-cream/80 max-w-[640px] mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          >
            De l&apos;adhésion à la comptabilité, chaque aspect de votre tontine trouve sa solution. Conçu pour les tontines cash, nature, services et solidarité.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-2"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {moduleNavItems.map((item, i) => (
              <motion.button
                key={item.num}
                className="text-caption border border-white/20 rounded-full px-4 py-2 text-white/80 hover:bg-white/10 hover:border-white/40 transition-all duration-200"
                variants={staggerItem}
                custom={i}
                onClick={() => scrollToModule(`module-0${item.num}`)}
              >
                {item.num}. {item.label}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Module sections */}
      {modules.map((mod, i) => (
        <ModuleSection key={mod.id} module={mod} index={i} />
      ))}

      {/* Summary CTA */}
      <section className="py-24 lg:py-32 bg-forest">
        <div className="mx-auto max-w-[800px] px-[clamp(1rem,5vw,3rem)] text-center">
          <motion.h2
            className="text-display-lg text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-25% 0px' }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          >
            18 Modules.
            <br />
            Une Vision.
          </motion.h2>
          <motion.p
            className="text-body-lg text-cream/85 mb-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-25% 0px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          >
            Tchoua ne remplace pas la tontine traditionnelle — il lui donne des ailes numériques. Plus de portée, plus de sécurité, plus d&apos;impact. Tout en préservant son cœur humain.
          </motion.p>
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-25% 0px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] }}
          >
            <button className="rounded-xl px-8 py-4 font-body text-base font-semibold bg-white text-forest hover:bg-cream transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              Essayer Gratuitement
            </button>
            <button className="rounded-xl px-8 py-4 font-body text-base font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-all duration-200">
              Voir la Démo
            </button>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-25% 0px' }}
            variants={staggerContainer}
          >
            {[
              Users, CreditCard, CalendarDays, ShoppingCart, Landmark, PiggyBank, Heart, BarChart3, Music, Wheat, MessageCircle, BarChart3, Sparkles,
              TrendingUp, Store, Receipt, Bell, Vote,
            ].map((Icon, i) => (
              <motion.div
                key={i}
                className="group relative"
                variants={staggerItem}
              >
                <div className="w-10 h-10 rounded-full bg-forest-light border border-white/20 flex items-center justify-center hover:bg-forest-light/80 transition-colors cursor-pointer">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] bg-charcoal text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {moduleNavItems[i]?.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
    </PublicLayout>
  )
}
