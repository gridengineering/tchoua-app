"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, BookOpen, CheckCircle2, Code2, ExternalLink, Globe2, KeyRound, Layers, ShieldCheck, Terminal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublicLayout } from "@/components/layout/public-layout";

type Lang = "fr" | "en" | "es" | "de";
type Section = { title: string; body: string; bullets?: string[]; code?: string };

const LANGS: Array<{ id: Lang; label: string }> = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "de", label: "Deutsch" },
];

const REPO_BASE = "https://github.com/DESTINBOAZ";

const DOCS: Record<Lang, { eyebrow: string; title: string; intro: string; sections: Section[]; checklist: string[] }> = {
  fr: {
    eyebrow: "Guide développeur · Tchoua Apps",
    title: "Construire une app de bout en bout",
    intro: "Les apps Tchoua sont des applications web indépendantes, embarquées dans un iframe sécurisé et reliées à la plateforme par un manifest, un jeton de lancement et le SDK de contexte. Ce guide couvre les trois espaces : administration, membre et association.",
    sections: [
      { title: "1. Choisir le bon périmètre", body: "Chaque app déclare un scope unique. Le scope détermine qui peut voir, installer et ouvrir l'app.", bullets: ["ADMIN : réservé aux utilisateurs avec un rôle système d'administration.", "MEMBER : disponible à tout membre connecté ; installation personnelle.", "ASSOCIATION : réservé au fondateur et au bureau ; installation au niveau de l'association."] },
      { title: "2. Créer le manifest", body: "Le manifest est le contrat entre votre app et Tchoua. Il est stocké dans la registry et contrôlé avant publication.", code: `{
  "schemaVersion": "1.0",
  "slug": "member-meeting-copilot",
  "name": "Meeting Copilot",
  "scope": "MEMBER",
  "version": "1.0.0",
  "entryUrl": "https://votre-domaine.example/app/",
  "permissions": ["context:read", "notifications:write"],
  "settings": [
    { "key": "language", "label": "Langue", "type": "select", "required": false }
  ]
}` },
      { title: "3. Authentifier le lancement", body: "Après installation, la plateforme appelle GET /api/apps/{slug}/launch. Elle vérifie l'installation puis renvoie une URL avec un jeton signé valable 30 minutes. Ne demandez jamais le mot de passe de l'utilisateur.", bullets: ["Le jeton est signé côté serveur (HMAC SHA-256).", "Il contient appId, userId, associationId, scope et installationId.", "Pour une app d'association, transmettez associationId à l'installation et au lancement."], code: `const res = await fetch("/api/apps/member-meeting-copilot/launch");
const { launchUrl, token, expiresAt } = await res.json();
// launchUrl contient déjà ?tchoua_token=…` },
      { title: "4. Lire le contexte avec le SDK", body: "Votre backend peut valider le jeton et récupérer le contexte utilisateur, association et app via l'endpoint SDK. Le CORS est ouvert pour les apps externes.", code: `const res = await fetch("https://www.tchoua.com/api/apps/sdk/context", {
  headers: { Authorization: \`Bearer \${token}\` }
});
const { context } = await res.json();
// context.user, context.association, context.app, context.scope` },
      { title: "5. Installer, mettre à jour, désinstaller", body: "L'installation est idempotente : un nouvel appel met à jour la version de l'app sans perdre le réglage. L'utilisateur peut désinstaller à tout moment ; l'app ne doit pas conserver de données au-delà de ce que la politique de confidentialité autorise.", bullets: ["POST /api/apps/{slug}/install", "DELETE /api/apps/{slug}/install", "Une app d'association exige { associationId }.", "Une app ADMIN ne peut être installée que par un administrateur."] },
      { title: "6. Templates et composants", body: "Chaque exemple ci-dessous est un dépôt autonome prêt à cloner : HTML/CSS/JS sans build obligatoire, manifest, README et appel au SDK. Le template de base inclut la barre d'état, la gestion du contexte, les états chargement/erreur et les composants de formulaire.", bullets: ["Template de base : tchoua-app-template", "Exemple admin : audit-pulse", "Exemple membre : savings-coach", "Exemple association : event-planner"] },
      { title: "7. Publier et maintenir", body: "Soumettez votre app via POST /api/apps/submit avec un manifest complet et un dépôt public. Elle reste en brouillon jusqu'à validation par l'administration. Une nouvelle version se publie en mettant à jour le champ version et le manifest.", bullets: ["Documentez les permissions réellement utilisées.", "Testez les trois scopes avec des comptes de test.", "Prévoyez une page de support et une politique de confidentialité.", "Ne loguez jamais les jetons ni les données personnelles."] },
    ],
    checklist: ["Manifest valide et entryUrl HTTPS", "Jeton vérifié côté serveur", "Aucune clé secrète dans le navigateur", "Gestion des erreurs et état vide", "Test installation/désinstallation", "Dépôt public avec README et licence", "Politique de confidentialité publiée"],
  },
  en: {
    eyebrow: "Developer guide · Tchoua Apps",
    title: "Build an app end to end",
    intro: "Tchoua apps are independent web applications embedded in a secure iframe and connected to the platform through a manifest, a launch token and the context SDK. This guide covers all three spaces: admin, member and association.",
    sections: [
      { title: "1. Pick the right scope", body: "Every app declares one scope. The scope determines who can discover, install and open it.", bullets: ["ADMIN: system administrators only.", "MEMBER: any signed-in member; personal installation.", "ASSOCIATION: founder and board only; installation at association level."] },
      { title: "2. Write the manifest", body: "The manifest is the contract between your app and Tchoua. It is stored in the registry and validated before publication.", code: `{
  "schemaVersion": "1.0",
  "slug": "member-meeting-copilot",
  "name": "Meeting Copilot",
  "scope": "MEMBER",
  "version": "1.0.0",
  "entryUrl": "https://your-domain.example/app/",
  "permissions": ["context:read", "notifications:write"]
}` },
      { title: "3. Authenticate the launch", body: "After installation, the platform calls GET /api/apps/{slug}/launch. It verifies the installation and returns an entry URL with a signed 30-minute token. Never ask for the user's password.", bullets: ["Server-side HMAC SHA-256 signature.", "Contains appId, userId, associationId, scope and installationId.", "For association apps, pass associationId to install and launch."], code: `const res = await fetch("/api/apps/member-meeting-copilot/launch");
const { launchUrl, token, expiresAt } = await res.json();` },
      { title: "4. Read context with the SDK", body: "Your backend can validate the token and retrieve user, association and app context through the SDK endpoint. CORS is enabled for external apps.", code: `const res = await fetch("https://www.tchoua.com/api/apps/sdk/context", {
  headers: { Authorization: \`Bearer \${token}\` }
});
const { context } = await res.json();` },
      { title: "5. Install, update, uninstall", body: "Installation is idempotent: calling it again updates the app version without losing settings. Users may uninstall at any time; do not retain data beyond your published privacy policy.", bullets: ["POST /api/apps/{slug}/install", "DELETE /api/apps/{slug}/install", "Association apps require { associationId }.", "ADMIN apps can only be installed by administrators."] },
      { title: "6. Templates and components", body: "Each sample below is a standalone repository ready to clone: HTML/CSS/JS with no mandatory build step, manifest, README and SDK call. The starter includes a status bar, context handling, loading/error states and form components.", bullets: ["Starter: tchoua-app-template", "Admin : audit-pulse", "Member : savings-coach", "Association : event-planner"] },
      { title: "7. Publish and maintain", body: "Submit through POST /api/apps/submit with a complete manifest and public repository. Your app stays in draft until an administrator approves it. Publish a new version by updating the version field and manifest.", bullets: ["Document only the permissions you actually use.", "Test all three scopes with test accounts.", "Provide a support page and privacy policy.", "Never log tokens or personal data."] },
    ],
    checklist: ["Valid manifest and HTTPS entryUrl", "Token verified server-side", "No secret key in the browser", "Error handling and empty state", "Install/uninstall tested", "Public repository with README and licence", "Published privacy policy"],
  },
  es: {
    eyebrow: "Guía para desarrolladores · Tchoua Apps",
    title: "Crear una app de principio a fin",
    intro: "Las apps Tchoua son aplicaciones web independientes, integradas en un iframe seguro y conectadas a la plataforma mediante un manifest, un token de lanzamiento y el SDK de contexto. Esta guía cubre los tres espacios: administración, miembro y asociación.",
    sections: [
      { title: "1. Elegir el ámbito correcto", body: "Cada app declara un único ámbito. El ámbito determina quién puede descubrirla, instalarla y abrirla.", bullets: ["ADMIN: solo administradores del sistema.", "MEMBER: cualquier miembro conectado; instalación personal.", "ASSOCIATION: solo fundador y junta; instalación a nivel de asociación."] },
      { title: "2. Crear el manifest", body: "El manifest es el contrato entre tu app y Tchoua. Se almacena en el registro y se valida antes de publicar.", code: `{
  "schemaVersion": "1.0",
  "slug": "member-meeting-copilot",
  "name": "Meeting Copilot",
  "scope": "MEMBER",
  "version": "1.0.0",
  "entryUrl": "https://tu-dominio.example/app/"
}` },
      { title: "3. Autenticar el lanzamiento", body: "Tras la instalación, la plataforma llama a GET /api/apps/{slug}/launch. Verifica la instalación y devuelve una URL con un token firmado válido 30 minutos. Nunca pidas la contraseña del usuario.", bullets: ["Firma HMAC SHA-256 en el servidor.", "Incluye appId, userId, associationId, scope e installationId.", "Para apps de asociación, pasa associationId."] },
      { title: "4. Leer el contexto con el SDK", body: "Tu backend puede validar el token y obtener el contexto de usuario, asociación y app mediante el endpoint SDK. CORS está habilitado.", code: `const res = await fetch("https://www.tchoua.com/api/apps/sdk/context", {
  headers: { Authorization: \`Bearer \${token}\` }
});` },
      { title: "5. Instalar, actualizar, desinstalar", body: "La instalación es idempotente: volver a llamarla actualiza la versión sin perder ajustes. El usuario puede desinstalar en cualquier momento; no conserves datos más allá de tu política de privacidad.", bullets: ["POST /api/apps/{slug}/install", "DELETE /api/apps/{slug}/install", "Las apps de asociación requieren associationId.", "Las apps ADMIN solo las instalan administradores."] },
      { title: "6. Plantillas y componentes", body: "Cada ejemplo es un repositorio autónomo listo para clonar: HTML/CSS/JS sin build obligatorio, manifest, README y llamada al SDK. La plantilla incluye barra de estado, contexto, estados de carga/error y componentes de formulario.", bullets: ["Plantilla: tchoua-app-template", "Admin: audit-pulse", "Miembro: savings-coach", "Asociación: event-planner"] },
      { title: "7. Publicar y mantener", body: "Envía la app con POST /api/apps/submit, un manifest completo y un repositorio público. Queda en borrador hasta la aprobación del administrador. Publica una nueva versión actualizando version y manifest.", bullets: ["Documenta solo los permisos usados.", "Prueba los tres ámbitos con cuentas de prueba.", "Incluye soporte y política de privacidad.", "Nunca registres tokens ni datos personales."] },
    ],
    checklist: ["Manifest válido y entryUrl HTTPS", "Token verificado en el servidor", "Sin claves secretas en el navegador", "Manejo de errores y estado vacío", "Instalación/desinstalación probada", "Repositorio público con README y licencia", "Política de privacidad publicada"],
  },
  de: {
    eyebrow: "Entwicklerhandbuch · Tchoua Apps",
    title: "Eine App von Anfang bis Ende bauen",
    intro: "Tchoua Apps sind unabhängige Webanwendungen, die in einem sicheren iframe eingebettet und über Manifest, Launch-Token und Context-SDK mit der Plattform verbunden sind. Dieses Handbuch behandelt alle drei Bereiche: Administration, Mitglied und Verein.",
    sections: [
      { title: "1. Den richtigen Bereich wählen", body: "Jede App deklariert genau einen Scope. Dieser bestimmt, wer die App finden, installieren und öffnen darf.", bullets: ["ADMIN: nur Systemadministratoren.", "MEMBER: jedes angemeldete Mitglied; persönliche Installation.", "ASSOCIATION: nur Gründer und Vorstand; Installation auf Vereinsebene."] },
      { title: "2. Das Manifest erstellen", body: "Das Manifest ist der Vertrag zwischen App und Tchoua. Es wird in der Registry gespeichert und vor der Veröffentlichung geprüft.", code: `{
  "schemaVersion": "1.0",
  "slug": "member-meeting-copilot",
  "name": "Meeting Copilot",
  "scope": "MEMBER",
  "version": "1.0.0",
  "entryUrl": "https://deine-domain.example/app/"
}` },
      { title: "3. Den Launch authentifizieren", body: "Nach der Installation ruft die Plattform GET /api/apps/{slug}/launch auf. Sie prüft die Installation und liefert eine URL mit einem signierten Token (30 Minuten). Frage niemals nach dem Passwort.", bullets: ["HMAC-SHA-256-Signatur auf dem Server.", "Enthält appId, userId, associationId, scope und installationId.", "Bei Vereins-Apps associationId übergeben."] },
      { title: "4. Kontext über das SDK lesen", body: "Dein Backend kann das Token prüfen und Benutzer-, Vereins- und App-Kontext über den SDK-Endpunkt abrufen. CORS ist aktiviert.", code: `const res = await fetch("https://www.tchoua.com/api/apps/sdk/context", {
  headers: { Authorization: \`Bearer \${token}\` }
});` },
      { title: "5. Installieren, aktualisieren, deinstallieren", body: "Die Installation ist idempotent: Ein erneuter Aufruf aktualisiert die Version ohne Einstellungen zu verlieren. Nutzer können jederzeit deinstallieren; speichere keine Daten über deine Datenschutzerklärung hinaus.", bullets: ["POST /api/apps/{slug}/install", "DELETE /api/apps/{slug}/install", "Vereins-Apps benötigen associationId.", "ADMIN-Apps nur durch Administratoren."] },
      { title: "6. Vorlagen und Komponenten", body: "Jedes Beispiel ist ein eigenständiges Repository zum Klonen: HTML/CSS/JS ohne Pflicht-Build, Manifest, README und SDK-Aufruf. Die Vorlage enthält Statusleiste, Kontext, Lade-/Fehlerzustände und Formularkomponenten.", bullets: ["Vorlage: tchoua-app-template", "Admin: audit-pulse", "Mitglied: savings-coach", "Verein: event-planner"] },
      { title: "7. Veröffentlichen und pflegen", body: "Reiche die App über POST /api/apps/submit mit vollständigem Manifest und öffentlichem Repository ein. Sie bleibt Entwurf, bis ein Administrator sie freigibt. Eine neue Version veröffentlichst du über version und manifest.", bullets: ["Nur tatsächlich verwendete Berechtigungen dokumentieren.", "Alle drei Bereiche mit Testkonten prüfen.", "Supportseite und Datenschutzerklärung bereitstellen.", "Niemals Tokens oder personenbezogene Daten loggen."] },
    ],
    checklist: ["Gültiges Manifest und HTTPS-entryUrl", "Token serverseitig geprüft", "Keine geheimen Schlüssel im Browser", "Fehlerbehandlung und Leerzustand", "Installation/Deinstallation getestet", "Öffentliches Repository mit README und Lizenz", "Datenschutzerklärung veröffentlicht"],
  },
};

const KEY_DOCS: Record<Lang, Section> = {
  fr: {
    title: "8. Clé API développeur externe",
    body: "Créez une clé depuis votre session Tchoua pour soumettre et maintenir vos apps sans passer par le navigateur. La clé n'est affichée qu'une seule fois ; conservez-la dans un gestionnaire de secrets.",
    bullets: ["POST /api/developer/keys avec { name } crée une clé.", "Header : Authorization: Bearer tchoua_dev_…", "La clé donne accès à POST /api/apps/submit.", "DELETE /api/developer/keys?id=… révoque la clé."],
    code: `const keyRes = await fetch("https://www.tchoua.com/api/developer/keys", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Mon app" })
});
const { secret } = await keyRes.json();

await fetch("https://www.tchoua.com/api/apps/submit", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + secret,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ name: "Mon app", slug: "mon-app", scope: "MEMBER", manifest })
});`,
  },
  en: {
    title: "8. External developer API key",
    body: "Create a key from your Tchoua session to submit and maintain apps without the browser. The key is shown only once; store it in a secrets manager.",
    bullets: ["POST /api/developer/keys with { name } creates a key.", "Header: Authorization: Bearer tchoua_dev_…", "The key grants access to POST /api/apps/submit.", "DELETE /api/developer/keys?id=… revokes it."],
    code: `const keyRes = await fetch("https://www.tchoua.com/api/developer/keys", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "My app" })
});
const { secret } = await keyRes.json();`,
  },
  es: {
    title: "8. Clave API para desarrolladores externos",
    body: "Crea una clave desde tu sesión Tchoua para enviar y mantener apps sin el navegador. La clave se muestra una sola vez; guárdala en un gestor de secretos.",
    bullets: ["POST /api/developer/keys con { name } crea una clave.", "Header: Authorization: Bearer tchoua_dev_…", "La clave da acceso a POST /api/apps/submit.", "DELETE /api/developer/keys?id=… la revoca."],
    code: `const keyRes = await fetch("https://www.tchoua.com/api/developer/keys", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Mi app" })
});
const { secret } = await keyRes.json();`,
  },
  de: {
    title: "8. API-Schlüssel für externe Entwickler",
    body: "Erstelle einen Schlüssel aus deiner Tchoua-Sitzung, um Apps ohne Browser einzureichen und zu pflegen. Der Schlüssel wird nur einmal angezeigt; speichere ihn in einem Secret Manager.",
    bullets: ["POST /api/developer/keys mit { name } erstellt einen Schlüssel.", "Header: Authorization: Bearer tchoua_dev_…", "Der Schlüssel erlaubt POST /api/apps/submit.", "DELETE /api/developer/keys?id=… widerruft ihn."],
    code: `const keyRes = await fetch("https://www.tchoua.com/api/developer/keys", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Meine App" })
});
const { secret } = await keyRes.json();`,
  },
};

const REPOS = [
  { scope: "ADMIN", slug: "admin-audit-pulse", label: "Audit Pulse" },
  { scope: "MEMBER", slug: "member-savings-coach", label: "Savings Coach" },
  { scope: "ASSOCIATION", slug: "association-event-planner", label: "Event Planner" },
];

export default function AppsDeveloperGuidePage() {
  const { data: session } = useSession();
  const [lang, setLang] = useState<Lang>("fr");
  const doc = { ...DOCS[lang], sections: [...DOCS[lang].sections, KEY_DOCS[lang]] };
  const Shell = session ? DashboardLayout : PublicLayout;
  return (
    <Shell title="Guide développeur Apps">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/apps" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d3d28] hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Retour à Apps marketplace</Link>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <Globe2 className="ml-2 h-3.5 w-3.5 text-slate-400" />
            {LANGS.map((item) => <button key={item.id} onClick={() => setLang(item.id)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${lang === item.id ? "bg-[#0d3d28] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{item.label}</button>)}
          </div>
        </div>

        <div className="rounded-3xl border border-[#dbe7dd] bg-gradient-to-br from-[#f6fbf7] to-[#fbf8ef] p-6 sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0d3d28]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0d3d28]"><BookOpen className="h-4 w-4" /> {doc.eyebrow}</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">{doc.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{doc.intro}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500"><span className="rounded-lg bg-white px-2.5 py-1.5">Manifest 1.0</span><span className="rounded-lg bg-white px-2.5 py-1.5">Launch token 30 min</span><span className="rounded-lg bg-white px-2.5 py-1.5">3 scopes</span><span className="rounded-lg bg-white px-2.5 py-1.5">SDK context</span></div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {doc.sections.map((section) => (
              <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-base font-black text-slate-900">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
                {section.bullets ? <ul className="mt-3 space-y-1.5">{section.bullets.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0d3d28]" />{item}</li>)}</ul> : null}
                {section.code ? <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-emerald-200"><code>{section.code}</code></pre> : null}
              </section>
            ))}
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#0d3d28]" /><h2 className="text-sm font-black text-slate-900">Checklist</h2></div>
              <ul className="mt-3 space-y-2">{doc.checklist.map((item) => <li key={item} className="flex gap-2 text-[11px] leading-4 text-slate-500"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />{item}</li>)}</ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-[#0d3d28]" /><h2 className="text-sm font-black text-slate-900">Templates</h2></div>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">Repositories publics prêts à cloner, un par exemple.</p>
              <div className="mt-3 space-y-1.5">{REPOS.map((repo) => <a key={repo.slug} href={`${REPO_BASE}/tchoua-app-${repo.slug}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-slate-100 px-2.5 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"><span>{repo.label}<span className="ml-1 text-[9px] font-bold uppercase text-slate-400">{repo.scope}</span></span><ExternalLink className="h-3 w-3" /></a>)}</div>
              <a href={`${REPO_BASE}/tchoua-app-template`} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-between rounded-lg bg-[#0d3d28] px-2.5 py-2 text-[11px] font-bold text-white">Starter template <ExternalLink className="h-3 w-3" /></a>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-amber-700" /><h2 className="text-sm font-black text-amber-900">Sécurité</h2></div><p className="mt-2 text-[11px] leading-4 text-amber-800">Ne stockez jamais le jeton en clair côté serveur. Vérifiez-le à chaque requête et utilisez HTTPS partout.</p></div>
          </aside>
        </div>

        <div className="rounded-2xl bg-[#0d3d28] p-5 sm:flex sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 text-white"><Terminal className="h-4 w-4" /><p className="text-sm font-bold">Soumettre votre app</p></div><p className="mt-1 text-xs text-white/70">POST /api/apps/submit · statut brouillon jusqu'à validation.</p></div><Link href="/apps" className="mt-3 inline-flex rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0d3d28] sm:mt-0">Voir la marketplace</Link></div>
      </div>
    </Shell>
  );
}
