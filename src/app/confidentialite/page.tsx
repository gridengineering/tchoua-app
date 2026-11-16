import type { Metadata } from "next";
import { headers } from "next/headers";
import { PublicLayout } from "@/components/layout/public-layout";
import { PUBLIC_PAGES, publicPageMetadata, type SeoLanguage } from "@/lib/seo";

const seo = PUBLIC_PAGES.find((item) => item.path === "/confidentialite")!;

export async function generateMetadata(): Promise<Metadata> {
  const language = ((await headers()).get("x-tchoua-lang") || "fr") as SeoLanguage;
  return publicPageMetadata(seo, language);
}

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout title="Politique de confidentialité">
      <article className="mx-auto max-w-4xl px-6 py-12 text-[#374151]">
        <p className="mb-8 text-sm font-semibold text-[#0d3d28]">
          Dernière mise à jour : 15 novembre 2026
        </p>

        <div className="space-y-8 text-[15px] leading-7">
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">1. Responsable du traitement</h2>
            <p>
              La plateforme <strong>Tchoua</strong>, accessible à l’adresse{" "}
              <a className="font-semibold text-[#0d3d28] underline" href="https://www.tchoua.com">
                https://www.tchoua.com
              </a>
              , est éditée par <strong>DITROS</strong> (« nous », « notre »). Tchoua est une
              plateforme de gestion d’associations et de tontines, également proposée en
              auto-hébergement sous licence open source.
            </p>
            <p className="mt-3">
              Pour toute question relative à vos données personnelles :{" "}
              <a className="font-semibold text-[#0d3d28] underline" href="mailto:contact@tchoua.com">
                contact@tchoua.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">2. Données que nous collectons</h2>
            <p>Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme :</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong>Compte et identification :</strong> nom, adresse e-mail, numéro de téléphone, mot de passe chiffré, préférences de langue et de thème.</li>
              <li><strong>Connexion via un fournisseur externe :</strong> si vous choisissez Google ou Facebook, nous recevons les informations que le fournisseur partage avec nous, généralement votre nom, votre adresse e-mail, votre photo de profil et un identifiant de compte. Nous ne recevons jamais votre mot de passe Google ou Facebook.</li>
              <li><strong>Activité associative et financière :</strong> associations, adhésions, rôles, activités, cotisations, prêts, aides, réunions, documents et historiques que vous ou votre association enregistrez.</li>
              <li><strong>Vérification KYC/LBC-FT :</strong> lorsque vous demandez un niveau de vérification, les pièces et informations que vous fournissez (pièce d’identité, photo, justificatif de localisation, etc.).</li>
              <li><strong>Communications :</strong> messages échangés dans les canaux de l’association, notifications et correspondance avec le support.</li>
              <li><strong>Données techniques :</strong> adresse IP, navigateur, appareil, journaux de connexion et de sécurité, préférences de session.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">3. Pourquoi nous utilisons ces données</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>créer et sécuriser votre compte, authentifier votre identité et gérer vos accès ;</li>
              <li>fournir les services de gestion d’association et de tontine, y compris les calculs, les paiements et les rapports ;</li>
              <li>respecter nos obligations légales, notamment en matière de KYC, de lutte contre le blanchiment et de conservation des documents ;</li>
              <li>assurer la sécurité, prévenir la fraude et les abus, et diagnostiquer les incidents ;</li>
              <li>vous envoyer les notifications et communications nécessaires au service ;</li>
              <li>améliorer la plateforme à partir de données agrégées et anonymisées.</li>
            </ul>
            <p className="mt-3">
              Les bases légales sont, selon le cas : l’exécution du contrat, votre consentement,
              le respect d’une obligation légale et notre intérêt légitime à sécuriser et
              améliorer le service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">4. Connexion Google et données Google</h2>
            <p>
              L’authentification Google est facultative. Elle sert uniquement à vous connecter
              et à créer ou retrouver votre compte Tchoua. Nous n’utilisons pas les données
              Google pour de la publicité, nous ne les vendons pas et nous ne les utilisons pas
              pour entraîner des modèles d’intelligence artificielle.
            </p>
            <p className="mt-3">
              Notre usage des informations reçues des API Google respecte la{" "}
              <a
                className="font-semibold text-[#0d3d28] underline"
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , y compris les exigences de divulgation et de limitation d’usage. Vous pouvez
              révoquer l’accès de Tchoua à votre compte Google à tout moment depuis les
              paramètres de sécurité de votre compte Google.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">5. Partage et sous-traitants</h2>
            <p>
              Nous ne vendons pas vos données personnelles. Nous les partageons uniquement avec
              les prestataires nécessaires au service, dans le cadre de contrats de
              sous-traitance et avec des garanties de sécurité :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>hébergement et infrastructure (serveurs OVHcloud et infrastructure Proxmox) ;</li>
              <li>fournisseurs d’authentification que vous choisissez (Google, Facebook) ;</li>
              <li>prestataires d’e-mail et de notification ;</li>
              <li>prestataires de paiement mobile money, carte bancaire ou autres, lorsque vous initiez une opération ;</li>
              <li>autorités compétentes lorsque la loi l’exige.</li>
            </ul>
            <p className="mt-3">
              Les données peuvent être traitées dans un pays différent du vôtre. Nous encadrons
              ces transferts par des garanties appropriées et limitons les données au strict
              nécessaire.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">6. Durée de conservation</h2>
            <p>
              Les données de compte sont conservées pendant la durée de votre relation avec
              Tchoua, puis pendant les délais légaux de conservation. Les pièces KYC et les
              justificatifs financiers sont conservés selon les obligations applicables. Les
              journaux techniques sont conservés pour une durée limitée nécessaire à la sécurité
              et au diagnostic. Les données peuvent ensuite être supprimées ou anonymisées.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">7. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables :
              chiffrement des mots de passe, contrôle d’accès par rôle, journalisation des
              actions sensibles, sauvegardes, isolation des associations, vérification KYC et
              surveillance des accès. Aucun système n’étant infaillible, nous vous invitons à
              utiliser un mot de passe unique et à nous signaler toute activité suspecte.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">8. Vos droits</h2>
            <p>
              Selon votre juridiction, vous disposez de droits d’accès, de rectification,
              d’effacement, de limitation, d’opposition et de portabilité. Vous pouvez également
              retirer votre consentement lorsque le traitement repose sur celui-ci. Pour exercer
              ces droits, écrivez à{" "}
              <a className="font-semibold text-[#0d3d28] underline" href="mailto:contact@tchoua.com">
                contact@tchoua.com
              </a>
              . Nous pouvons demander une preuve d’identité pour protéger votre compte.
            </p>
            <p className="mt-3">
              Vous pouvez aussi introduire une réclamation auprès de l’autorité de protection des
              données compétente dans votre pays, notamment au Cameroun.
            </p>
          </section>

          <section id="cookies">
            <h2 className="mb-3 text-xl font-bold text-gray-900">9. Cookies et stockage local</h2>
            <p>
              Tchoua utilise des cookies et un stockage local strictement nécessaires au
              fonctionnement : session authentifiée, sécurité, préférences de langue et de thème,
              et continuité de l’expérience mobile. Les fournisseurs d’authentification peuvent
              déposer leurs propres cookies lors de la connexion. Nous n’utilisons pas de cookies
              publicitaires tiers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">10. Mineurs</h2>
            <p>
              Tchoua n’est pas destiné aux personnes mineures non autorisées par leur
              représentant légal. Si vous pensez qu’un mineur nous a fourni des données sans
              autorisation, contactez-nous afin que nous puissions les supprimer.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">11. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique pour refléter une évolution du service ou de
              la réglementation. La date de mise à jour est indiquée en haut de la page. Les
              modifications importantes vous seront communiquées par un moyen approprié.
            </p>
          </section>

          <section className="rounded-2xl border border-[#e8e2d8] bg-white p-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">12. Contact</h2>
            <p>
              Responsable de la protection des données : DITROS — Tchoua<br />
              E-mail :{" "}
              <a className="font-semibold text-[#0d3d28] underline" href="mailto:contact@tchoua.com">
                contact@tchoua.com
              </a>
              <br />
              Site : <a className="font-semibold text-[#0d3d28] underline" href="https://www.tchoua.com">www.tchoua.com</a>
            </p>
          </section>
        </div>
      </article>
    </PublicLayout>
  );
}
