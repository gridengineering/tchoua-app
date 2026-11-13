export type HelpField = { name: string; help: string };

export type ContextualHelpEntry = {
  id: string;
  title: string;
  subtitle: string;
  manualAnchor: string;
  manualTitle: string;
  manualExcerpt: string;
  studyAnchor?: string;
  studyTitle?: string;
  formName: string;
  fields: HelpField[];
  steps: string[];
  tips: string[];
};

const MANUAL = "/docs/manuel/index.html";
const STUDY = "/docs/etude-arp/index.html";

export function manualUrl(entry: ContextualHelpEntry) {
  return `${MANUAL}#${entry.manualAnchor}`;
}

export function studyUrl(entry: ContextualHelpEntry) {
  return entry.studyAnchor ? `${STUDY}#${entry.studyAnchor}` : STUDY;
}

const associationCreate: ContextualHelpEntry = {
  id: "association-create",
  title: "Créer une association",
  subtitle: "Formulaire par onglets · création",
  manualAnchor: "ch20",
  manualTitle: "Chapitre 20 · Créer ou modifier une association par onglets",
  manualExcerpt:
    "Le formulaire est organisé en huit onglets toujours accessibles : Identité, Contacts, Cadre ARP, Activités, Réunions & collation, Adhésion & finances, Règlement, Récapitulatif. On peut revenir en arrière, corriger un champ ou enregistrer à tout moment.",
  studyAnchor: "d01",
  studyTitle: "Domaine 01 · Identité et formes d’organisation",
  formName: "Nouvelle association",
  fields: [
    { name: "Identité", help: "Nom, type, pays, devise fonctionnelle et fuseau. La devise se verrouille après la première écriture." },
    { name: "Cadre ARP", help: "Dix dimensions définissent les modules autorisés. Les conditions C01–C06 signalent les paramètres à compléter." },
    { name: "Activités", help: "Cochez uniquement les modules réellement ouverts. Un module incompatible avec le cadre ARP est refusé." },
    { name: "Réunions & collation", help: "Fréquence, quorum, contribution et forfait hôte. Ces réglages sont distincts des cotisations d’activité." },
    { name: "Adhésion & finances", help: "Droit d’entrée, âge, parrains, plafonds d’aides, sanctions et compte bancaire." },
    { name: "Règlement", help: "Articles du règlement intérieur. Les membres devront approuver la version enregistrée." },
  ],
  steps: [
    "Renseignez l’identité et les contacts.",
    "Choisissez un profil ARP ou appliquez un profil type, puis ajustez les dimensions.",
    "Sélectionnez les activités autorisées par le cadre.",
    "Complétez les réunions, l’adhésion et le règlement.",
    "Vérifiez le récapitulatif : les contrôles bloquants doivent être résolus.",
    "Créez l’association, puis configurez chaque activité.",
  ],
  tips: [
    "Le bouton d’enregistrement reste disponible quel que soit l’onglet.",
    "Un module coché sans capacité ARP renvoie vers l’onglet Cadre ARP.",
    "La création génère un espace isolé : aucune cotisation implicite n’est créée.",
  ],
};

const associationOverview: ContextualHelpEntry = {
  id: "association-overview",
  title: "Vue d’ensemble de l’association",
  subtitle: "Membres, activités, caisse et raccourcis",
  manualAnchor: "ch04",
  manualTitle: "Chapitre 4 · Cycle de vie d’une association",
  manualExcerpt:
    "La fiche d’association rassemble l’identité, les membres, les activités, la caisse, les documents et le règlement. Les actions disponibles dépendent du rôle : un membre consulte, le bureau administre et configure.",
  studyAnchor: "d01",
  studyTitle: "Domaine 01 · Identité et formes d’organisation",
  formName: "Fiche de l’association",
  fields: [
    { name: "Identité", help: "Nom, type, parent, statut et devise fonctionnelle." },
    { name: "Membres", help: "Effectif, rôles et demandes d’adhésion en attente." },
    { name: "Activités", help: "Tontines, prêts, épargne, solidarité et sessions en cours." },
    { name: "Caisse", help: "Solde, mouvements et fonds affectés." },
  ],
  steps: [
    "Vérifiez l’identité et le cadre ARP.",
    "Consultez les membres et les activités.",
    "Ouvrez un module ou la configuration selon votre rôle.",
  ],
  tips: [
    "Le bouton Configurer est réservé au bureau habilité.",
    "Un membre simple ne voit que ses propres opérations financières.",
  ],
};

const associationEdit: ContextualHelpEntry = {
  ...associationCreate,
  id: "association-edit",
  title: "Modifier une association",
  subtitle: "Formulaire par onglets · modification",
  formName: "Modifier l’association",
  manualExcerpt:
    "En modification, le même formulaire recharge l’identité, le cadre ARP, les réunions, les plafonds, le règlement et les activités existantes. Le cadre ARP n’est enregistré en brouillon que s’il a réellement changé.",
  steps: [
    "Ouvrez l’onglet concerné : le formulaire est prérempli.",
    "Corrigez les champs ; les modifications de la fiche sont appliquées à l’enregistrement.",
    "Si le cadre ARP change, un brouillon est créé et la page ARP s’ouvre pour publication.",
    "Relisez le récapitulatif avant d’enregistrer.",
  ],
  tips: [
    "Le règlement est mis à jour atomiquement : les anciennes approbations sont remplacées.",
    "La modification de la fiche est réservée aux rôles habilités du bureau.",
  ],
};

const configuration: ContextualHelpEntry = {
  id: "configuration",
  title: "Configurer les activités",
  subtitle: "Paramètres individuels par activité",
  manualAnchor: "ch21",
  manualTitle: "Chapitre 21 · Configurer chaque activité et gérer les fonds",
  manualExcerpt:
    "La page Configuration regroupe les tontines, prêts, épargnes, cotisations, solidarités, activités nature, investissements, achats et collations. Chaque activité possède un formulaire adapté à sa famille ; les paramètres transversaux (cotisations, réunions) ont leurs propres onglets.",
  studyAnchor: "d09",
  studyTitle: "Domaine 09 · Moteur de règles et contrats d’activité",
  formName: "Configuration de l’association",
  fields: [
    { name: "Famille d’activité", help: "Tontines, prêts, épargne, cotisations, solidarité, nature, investissement, achats, réunions." },
    { name: "Statut / participation", help: "Active, en pause ou clôturée ; obligatoire, optionnelle ou conditionnelle." },
    { name: "Cotisation", help: "Montant par part, unité, fréquence et modes de paiement." },
    { name: "Cycle de tontine", help: "Mode, nombre de sessions, dates de début/fin et droits bénéficiaires." },
    { name: "Prêt", help: "Taux court/long, plafond, ratio fonds, validation et prêts actifs." },
    { name: "Cotisations & réunions", help: "Assiette, droit d’entrée, plafond familial, quorum et collation." },
  ],
  steps: [
    "Choisissez l’association dans le sélecteur.",
    "Ouvrez Configuration, puis la famille d’activité.",
    "Cliquez sur une activité pour ouvrir son formulaire.",
    "Enregistrez : les nouvelles échéances appliquent les paramètres aux prochaines sessions.",
    "Contrôlez le cadre ARP si un module est désactivé.",
  ],
  tips: [
    "Un changement de fréquence ne réécrit pas les sessions passées.",
    "Une activité déjà en cours conserve ses droits acquis.",
    "La modification est réservée aux membres du bureau habilités et à l’administrateur.",
  ],
};

const activity: ContextualHelpEntry = {
  id: "activity",
  title: "Créer une activité",
  subtitle: "Tontine, épargne, prêt, solidarité ou collecte",
  manualAnchor: "ch06",
  manualTitle: "Chapitre 6 · Activités et moteur de tontine",
  manualExcerpt:
    "Une activité est un contrat collectif : elle fixe la cotisation, les parts, la fréquence des sessions, les bénéficiaires et les règles de calcul. Le cycle peut être défini en nombre de sessions, par période ou jusqu’à épuisement des droits.",
  studyAnchor: "d13",
  studyTitle: "Domaine 13 · Souscriptions, parts et fractions de tontine",
  formName: "Nouvelle activité",
  fields: [
    { name: "Nom et type", help: "Le type détermine les champs disponibles et les contrôles ARP." },
    { name: "Montant par part", help: "Montant dû par part et par période ; il alimente les appels de cotisation." },
    { name: "Fraction minimale", help: "1, 1/2 ou 1/4 de part ; elle doit être autorisée par le contrat." },
    { name: "Cycle", help: "Nombre de sessions, date de fin ou épuisement des droits bénéficiaires." },
    { name: "Bénéficiaire", help: "Montant par droit entier, plafond par membre et par séance." },
    { name: "Fréquence", help: "Jour, semaine, mois ou règle personnalisée ; un aperçu des 12 prochaines séances est affiché." },
  ],
  steps: [
    "Choisissez le type d’activité et son statut.",
    "Renseignez la cotisation, les parts et la fréquence.",
    "Définissez le cycle et les droits bénéficiaires.",
    "Vérifiez l’aperçu des sessions.",
    "Enregistrez : l’activité apparaît dans la configuration de l’association.",
  ],
  tips: [
    "Le module doit être autorisé par le cadre ARP.",
    "Un cycle sans nombre de sessions planifiées donne une progression à zéro.",
    "Les sessions passées ne sont jamais réécrites par un changement de fréquence.",
  ],
};

const loans: ContextualHelpEntry = {
  id: "loans",
  title: "Prêts et remboursements",
  subtitle: "Demande, décision, décaissement et échéancier",
  manualAnchor: "ch08",
  manualTitle: "Chapitre 8 · Prêts, remboursements et intérêts",
  manualExcerpt:
    "La demande de prêt est distincte de la décision et du décaissement. Le plafond dépend du fonds, des garanties et du ratio autorisé ; chaque remboursement sépare le principal des intérêts.",
  studyAnchor: "d18",
  studyTitle: "Domaine 18 · Prêts : demandes, plafonds et décision",
  formName: "Prêts de l’association",
  fields: [
    { name: "Emprunteur", help: "Membre actif de l’association ; un membre simple ne voit que ses propres prêts." },
    { name: "Montant", help: "Contrôlé par le plafond membre, le ratio du fonds et la liquidité disponible." },
    { name: "Taux et durée", help: "Taux court/long et nombre d’échéances ; l’échéancier est calculé automatiquement." },
    { name: "Garantie", help: "Nantissement ou caution ; la réservation de garantie réduit le disponible." },
    { name: "Motif", help: "Justification conservée dans le dossier et l’historique." },
  ],
  steps: [
    "Vérifiez le disponible du fonds de prêt.",
    "Créez la demande et joignez le motif.",
    "Le bureau approuve ou refuse ; la décision est journalisée.",
    "Le décaissement crée la dette et l’échéancier.",
    "Chaque remboursement impute le principal et les intérêts séparément.",
  ],
  tips: [
    "Une avance à un bénéficiaire de tontine est un prêt distinct.",
    "Le ratio portefeuille/fonds inclut le capital encaissé et reste paramétrable.",
    "Les remboursements et liquidations ne sont pas bloqués par un module désactivé.",
  ],
};

const aid: ContextualHelpEntry = {
  id: "aid",
  title: "Aides sociales",
  subtitle: "Catalogue, demande, plafonds et décaissement",
  manualAnchor: "ch09",
  manualTitle: "Chapitre 9 · Solidarité et aides sociales",
  manualExcerpt:
    "Une aide est une prestation sociale, pas un remboursement de prêt. Le catalogue définit les événements, les plafonds, les justificatifs et le circuit de validation ; les aides approuvées non payées consomment le plafond.",
  studyAnchor: "d22",
  studyTitle: "Domaine 22 · Solidarité : catalogue et droits sociaux",
  formName: "Aides sociales",
  fields: [
    { name: "Bénéficiaire", help: "Membre ou ayant droit ; vérifier le lien familial et l’événement." },
    { name: "Type d’aide", help: "Maladie, décès, naissance, scolarité ou autre événement du catalogue." },
    { name: "Montant demandé", help: "Contrôlé par le plafond de l’événement, le plafond annuel et le reliquat du ménage." },
    { name: "Justificatif", help: "Pièce ou description conservée avec la demande." },
    { name: "Décision", help: "Approbation, refus ou demande de complément ; la décision est tracée." },
  ],
  steps: [
    "Sélectionnez le membre et l’événement.",
    "Vérifiez les droits et plafonds disponibles.",
    "Joignez le justificatif et soumettez la demande.",
    "Le bureau décide ; une aide approuvée réserve le montant.",
    "Le décaissement est enregistré dans le fonds de solidarité.",
  ],
  tips: [
    "Une aide définitive n’est pas remboursable ; un prêt social génère un échéancier.",
    "Ne jamais ponctionner une épargne remboursable pour payer une aide.",
    "Le cumul entre fonds local et national doit être explicitement autorisé.",
  ],
};

const meeting: ContextualHelpEntry = {
  id: "meeting",
  title: "Réunions, présence et collation",
  subtitle: "Convocation, quorum, PV et contribution",
  manualAnchor: "ch10",
  manualTitle: "Chapitre 10 · Réunions, discipline et collation",
  manualExcerpt:
    "Une réunion couvre plusieurs activités ; le quorum, les présences, les sanctions et la collation sont enregistrés séparément des cotisations d’activité. Le procès-verbal conserve les décisions et les absences.",
  studyAnchor: "d06",
  studyTitle: "Domaine 06 · Réunions, calendrier et présence",
  formName: "Nouvelle réunion",
  fields: [
    { name: "Date et heure", help: "Date locale de l’association ; la réunion peut être planifiée ou tenue." },
    { name: "Ordre du jour", help: "Points à traiter ; le PV reprend les décisions." },
    { name: "Quorum", help: "Pourcentage ou nombre minimal de présents pour délibérer." },
    { name: "Présences", help: "Présent, retard, absent, excusé ; les absences peuvent générer des amendes." },
    { name: "Collation", help: "Contribution par membre et forfait reversé à l’hôte." },
  ],
  steps: [
    "Créez la réunion et fixez la date.",
    "Enregistrez les présents et les absences.",
    "Saisissez les décisions et les sanctions éventuelles.",
    "Encaissez la collation et affectez le forfait hôte.",
    "Clôturez la réunion : le PV et l’historique sont générés.",
  ],
  tips: [
    "Le quorum se calcule sur la base admissible, pas sur l’effectif total.",
    "Les sanctions doivent suivre le barème paramétré.",
    "La collation ne se confond pas avec une cotisation de tontine.",
  ],
};

const members: ContextualHelpEntry = {
  id: "members",
  title: "Membres et adhésions",
  subtitle: "Invitation, rôles, statuts et départs",
  manualAnchor: "ch03",
  manualTitle: "Chapitre 3 · Comptes, rôles et permissions",
  manualExcerpt:
    "Une personne possède un compte utilisateur ; son adhésion à une association est datée et porte un rôle. Le bureau peut inviter, approuver, suspendre ou radier un membre, sans modifier son compte personnel.",
  studyAnchor: "d03",
  studyTitle: "Domaine 03 · Adhésions, membres et sorties",
  formName: "Membres de l’association",
  fields: [
    { name: "Nom et email", help: "L’email identifie le compte ; les doublons proches sont signalés." },
    { name: "Rôle", help: "Président, secrétaire, trésorier, membre, etc. ; le rôle détermine les permissions." },
    { name: "Statut", help: "En attente, actif, suspendu ou parti ; les dates d’entrée et de sortie sont conservées." },
    { name: "Parrain", help: "Membre qui recommande l’adhésion, selon les règles de l’association." },
    { name: "Code d’adhésion", help: "Code unique à transmettre pour rejoindre l’association." },
  ],
  steps: [
    "Invitez le membre ou partagez le code d’adhésion.",
    "Le membre crée son compte et sa demande.",
    "Le bureau approuve l’adhésion et attribue le rôle.",
    "Le membre apparaît dans la liste et peut cotiser.",
    "En cas de départ, enregistrez la date de sortie sans supprimer l’historique.",
  ],
  tips: [
    "Un membre ne voit que ses propres opérations financières.",
    "Le bureau voit les opérations de l’association.",
    "Ne jamais partager un compte : chaque personne doit avoir le sien.",
  ],
};

const reports: ContextualHelpEntry = {
  id: "reports",
  title: "Rapports et dividendes",
  subtitle: "Bilans, exports et répartition",
  manualAnchor: "ch11",
  manualTitle: "Chapitre 11 · Comptabilité, rapports et dividendes",
  manualExcerpt:
    "Les rapports consolident les cotisations, paiements, prêts, aides et fonds. Les dividendes sont calculés sur une base publiée, avec une quote-part par bénéficiaire et une gestion explicite des arrondis.",
  studyAnchor: "d25",
  studyTitle: "Domaine 25 · Investissements, capital et dividendes",
  formName: "Rapports de l’association",
  fields: [
    { name: "Période", help: "Exercice, trimestre ou période personnalisée ; les dates sont incluses." },
    { name: "Type de rapport", help: "Bilan de caisse, prêts, aides, cotisations, dividendes ou synthèse." },
    { name: "Export", help: "PDF pour signature, CSV pour contrôle ou tableau de bord." },
    { name: "Base de dividendes", help: "Base publiée et liquidité contrôlées séparément." },
  ],
  steps: [
    "Choisissez la période et le rapport.",
    "Vérifiez les totaux et les écarts.",
    "Exportez en PDF ou CSV.",
    "Pour un dividende, publiez la base puis lancez la répartition.",
  ],
  tips: [
    "La base de dividendes doit être justifiée par une décision.",
    "Le ratio portefeuille/fonds ne prouve pas la liquidité disponible.",
    "Afficher une quote-part arrondie ne conserve pas nécessairement la somme.",
  ],
};

const history: ContextualHelpEntry = {
  id: "history",
  title: "Historique des opérations",
  subtitle: "Association, membre, activité ou période",
  manualAnchor: "ch12",
  manualTitle: "Chapitre 12 · Historique et analyses",
  manualExcerpt:
    "L’historique est paginé et filtrable par périmètre, type, date, membre et activité. Les vues Liste, Kanban, Graphique et Grille permettent de contrôler les flux et de préparer un audit.",
  formName: "Historique",
  fields: [
    { name: "Périmètre", help: "Toute l’association, un membre ou une activité." },
    { name: "Type d’événement", help: "Cotisation, paiement, prêt, remboursement, aide, dividende." },
    { name: "Période", help: "Filtre de date inclusif ; la pagination est limitée à 100 lignes par page." },
    { name: "Membre / activité", help: "Filtres complémentaires selon le périmètre." },
  ],
  steps: [
    "Choisissez le périmètre et la période.",
    "Filtrez par type ou par membre.",
    "Basculez entre Liste, Kanban, Graphique et Grille.",
    "Exportez ou ouvrez le détail d’une opération.",
  ],
  tips: [
    "Un membre simple ne voit que ses propres opérations.",
    "Les remboursements séparent le principal des intérêts.",
    "Le filtre de fin inclut toute la journée.",
  ],
};

const arp: ContextualHelpEntry = {
  id: "arp",
  title: "Cadre ARP",
  subtitle: "Dimensions, conditions, fonds et versions",
  manualAnchor: "ch19",
  manualTitle: "Chapitre 19 · Cadre ARP : règles, combinaisons et versions",
  manualExcerpt:
    "Le cadre ARP décrit la forme de l’association, ses modules autorisés et ses conditions de compatibilité. Le profil actif est versionné ; un brouillon peut être préparé sans interrompre les opérations existantes.",
  studyAnchor: "d09",
  studyTitle: "Domaine 09 · Moteur de règles et contrats d’activité",
  formName: "Cadre ARP de l’association",
  fields: [
    { name: "Dimensions", help: "Organisation, adhésion, cotisation, tontine, crédit, aide, canal, devise, connexion, validation." },
    { name: "Conditions C01–C06", help: "Champs obligatoires avant publication ; elles ne bloquent pas la création mais la publication." },
    { name: "Fonds", help: "Enveloppes affectées ; le disponible = solde − réservations actives." },
    { name: "Réservations", help: "Engagement sur un montant, libérable ou consommable lors d’un décaissement." },
    { name: "Versions", help: "Chaque publication est immuable et porte une empreinte SHA-256." },
  ],
  steps: [
    "Vérifiez les dimensions et les modules.",
    "Renseignez les conditions signalées.",
    "Créez ou ajustez les fonds et réservations.",
    "Enregistrez le brouillon puis publiez la version.",
    "Consultez les versions pour revenir à une règle antérieure.",
  ],
  tips: [
    "Une sortie ne peut jamais dépasser le disponible après réservations.",
    "Une désactivation de module ferme les nouvelles souscriptions, pas les remboursements.",
    "Les profils BACKFILL doivent être revus puis publiés par le bureau.",
  ],
};

const cash: ContextualHelpEntry = {
  id: "cash",
  title: "Caisse et portefeuille",
  subtitle: "Encaissements, décaissements et soldes",
  manualAnchor: "ch11",
  manualTitle: "Chapitre 11 · Comptabilité, rapports et dividendes",
  manualExcerpt:
    "La caisse distingue les entrées confirmées, les sorties et les réservations. Le solde de caisse n’est pas le disponible d’un fonds : une réservation protège un montant sans le décaisser.",
  studyAnchor: "d12",
  studyTitle: "Domaine 12 · Caisses, budgets et écritures",
  formName: "Caisse de l’association",
  fields: [
    { name: "Type de mouvement", help: "Entrée, sortie, cotisation, remboursement, aide ou ajustement." },
    { name: "Montant et devise", help: "Montant en unité mineure ; la devise fonctionnelle est contrôlée." },
    { name: "Fonds", help: "Fonds affecté au mouvement ; un fonds réservé exige une autorisation." },
    { name: "Référence", help: "Pièce, reçu ou référence externe conservée pour l’audit." },
  ],
  steps: [
    "Choisissez le fonds et le type de mouvement.",
    "Saisissez le montant et la référence.",
    "Vérifiez le disponible avant une sortie.",
    "Enregistrez : le solde et l’historique sont mis à jour.",
  ],
  tips: [
    "Une écriture validée ne se supprime pas : utilisez une contrepassation.",
    "Ne jamais additionner des devises sans conversion.",
    "Une réservation n’est pas un paiement.",
  ],
};

const settings: ContextualHelpEntry = {
  id: "settings",
  title: "Paramètres et apparence",
  subtitle: "Compte, langue, thème et notifications",
  manualAnchor: "ch13",
  manualTitle: "Chapitre 13 · Espace membre, thèmes et mobile",
  manualExcerpt:
    "Chaque membre peut choisir son thème, sa langue et ses préférences de notification. Le thème est appliqué immédiatement et conservé sur le compte ; il ne modifie pas les données de l’association.",
  formName: "Paramètres du compte",
  fields: [
    { name: "Apparence", help: "Six thèmes : Forêt, Minuit, Aurore, Océan, Sable, Néon." },
    { name: "Langue", help: "Français, anglais, espagnol, allemand et langues locales disponibles." },
    { name: "Notifications", help: "Rappels de sessions, échéances de prêt et événements de l’association." },
  ],
  steps: [
    "Ouvrez Paramètres depuis le menu du compte.",
    "Choisissez un thème et une langue.",
    "Vérifiez l’aperçu immédiat.",
    "Les préférences sont enregistrées sur votre compte.",
  ],
  tips: [
    "Le thème ne change que votre affichage, pas celui des autres membres.",
    "La langue du site public et celle de l’espace membre sont mémorisées séparément.",
  ],
};

const dashboard: ContextualHelpEntry = {
  id: "dashboard",
  title: "Tableau de bord membre",
  subtitle: "Vue d’ensemble et raccourcis",
  manualAnchor: "ch13",
  manualTitle: "Chapitre 13 · Espace membre, thèmes et mobile",
  manualExcerpt:
    "Le tableau de bord rassemble les associations du membre, les soldes, les prochaines sessions, les échéances et les raccourcis vers les modules. Les données affichées dépendent du rôle et des associations sélectionnées.",
  formName: "Tableau de bord",
  fields: [
    { name: "Sélecteur d’association", help: "Change le contexte de navigation et les données affichées." },
    { name: "Soldes", help: "Cotisations, épargne, prêts et aides de vos adhésions." },
    { name: "Prochaines échéances", help: "Sessions, remboursements et événements à venir." },
  ],
  steps: [
    "Choisissez une association dans le sélecteur.",
    "Consultez les soldes et les prochaines échéances.",
    "Ouvrez un module via le launchpad ou le menu de gauche.",
  ],
  tips: [
    "Le bureau voit les opérations de l’association ; un membre simple voit les siennes.",
    "Le sélecteur ne modifie pas vos droits.",
  ],
};

const generic: ContextualHelpEntry = {
  id: "generic",
  title: "Aide de l’espace membre",
  subtitle: "Navigation et documents de référence",
  manualAnchor: "ch13",
  manualTitle: "Chapitre 13 · Espace membre, thèmes et mobile",
  manualExcerpt:
    "L’espace membre regroupe la navigation par association, les modules financiers, les rapports et les paramètres du compte. Le manuel décrit chaque écran ; l’étude ARP détaille les règles et les formulaires cibles.",
  formName: "Espace membre",
  fields: [
    { name: "Menu de gauche", help: "Navigation globale et section de l’association sélectionnée." },
    { name: "Aide contextuelle", help: "Ce volet affiche la section du manuel correspondant à l’écran courant." },
  ],
  steps: [
    "Sélectionnez une association.",
    "Ouvrez le module souhaité.",
    "Utilisez Aide pour afficher l’explication du formulaire.",
  ],
  tips: ["Le manuel complet et l’étude technique sont accessibles depuis Documentation."],
};

const ENTRIES: { test: RegExp; entry: ContextualHelpEntry }[] = [
  { test: /^\/dashboard\/associations\/create$/, entry: associationCreate },
  { test: /^\/associations\/new$/, entry: associationCreate },
  { test: /^\/associations$/, entry: associationOverview },
  { test: /^\/associations\/[^/]+$/, entry: associationOverview },
  { test: /^\/join\/[^/]+$/, entry: members },
  { test: /^\/associations\/[^/]+\/modifier$/, entry: associationEdit },
  { test: /^\/associations\/[^/]+\/configuration$/, entry: configuration },
  { test: /^\/associations\/[^/]+\/activities\/new$/, entry: activity },
  { test: /^\/associations\/[^/]+\/activities(?:\/.*)?$/, entry: activity },
  { test: /^\/associations\/[^/]+\/prets$/, entry: loans },
  { test: /^\/associations\/[^/]+\/aides$/, entry: aid },
  { test: /^\/associations\/[^/]+\/reunions(?:\/.*)?$/, entry: meeting },
  { test: /^\/associations\/[^/]+\/members$/, entry: members },
  { test: /^\/associations\/[^/]+\/rapports$/, entry: reports },
  { test: /^\/associations\/[^/]+\/historique$/, entry: history },
  { test: /^\/associations\/[^/]+\/arp$/, entry: arp },
  { test: /^\/associations\/[^/]+\/caisse$/, entry: cash },
  { test: /^\/associations\/[^/]+\/dividendes$/, entry: reports },
  { test: /^\/associations\/[^/]+\/interets$/, entry: reports },
  { test: /^\/associations\/[^/]+\/parametres$/, entry: settings },
  { test: /^\/associations\/[^/]+\/my-profile$/, entry: settings },
  { test: /^\/parametres$/, entry: settings },
  { test: /^\/profil$/, entry: settings },
  { test: /^\/prets\/?$/, entry: loans },
  { test: /^\/solidarite\/?$/, entry: aid },
  { test: /^\/cotisations\/?$/, entry: activity },
  { test: /^\/tontines(?:\/.*)?$/, entry: activity },
  { test: /^\/epargne\/?$/, entry: activity },
  { test: /^\/sessions\/?$/, entry: meeting },
  { test: /^\/rapports\/?$/, entry: reports },
  { test: /^\/membres\/?$/, entry: members },
  { test: /^\/dashboard\/wallet$/, entry: cash },
  { test: /^\/dashboard$/, entry: dashboard },
];

export function resolveContextualHelp(pathname: string): ContextualHelpEntry {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const { test, entry } of ENTRIES) {
    if (test.test(clean)) return entry;
  }
  return generic;
}
