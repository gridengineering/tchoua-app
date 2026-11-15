import { PublicLayout } from "@/components/layout/public-layout";

export const metadata = {
  title: "Conditions d’utilisation — Tchoua",
  description: "Conditions d’utilisation de la plateforme Tchoua : compte, services de tontine, obligations, responsabilité et droit applicable.",
};

export default function TermsPage() {
  return (
    <PublicLayout title="Conditions d’utilisation">
      <article className="mx-auto max-w-4xl px-6 py-12 text-[#374151]">
        <p className="mb-8 text-sm font-semibold text-[#0d3d28]">
          Dernière mise à jour : 15 novembre 2026
        </p>

        <div className="space-y-8 text-[15px] leading-7">
          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">1. Objet</h2>
            <p>
              Les présentes conditions régissent l’accès et l’utilisation de la plateforme{" "}
              <strong>Tchoua</strong>, accessible à l’adresse{" "}
              <a className="font-semibold text-[#0d3d28] underline" href="https://www.tchoua.com">
                https://www.tchoua.com
              </a>
              , éditée par <strong>DITROS</strong>. Tchoua fournit des outils numériques de
              gestion d’associations, de tontines, de cotisations, de prêts, d’aides et de
              gouvernance.
            </p>
            <p className="mt-3">
              En créant un compte ou en utilisant le service, vous acceptez les présentes
              conditions et notre{" "}
              <a className="font-semibold text-[#0d3d28] underline" href="/confidentialite">
                politique de confidentialité
              </a>
              . Si vous n’acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">2. Compte et éligibilité</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Vous devez fournir des informations exactes, complètes et à jour.</li>
              <li>Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.</li>
              <li>Vous devez nous informer sans délai de toute utilisation non autorisée ou compromission.</li>
              <li>La création d’un compte peut nécessiter une vérification d’identité (KYC) selon le niveau d’accès demandé et les obligations applicables.</li>
              <li>Les mineurs ne peuvent utiliser le service que dans les conditions autorisées par la loi et avec l’accord de leur représentant légal.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">3. Services de tontine et rôle de Tchoua</h2>
            <p>
              Tchoua est un outil de gestion et de traçabilité. Tchoua n’est pas une banque, un
              établissement de crédit, un assureur ni un intermédiaire financier. Les décisions
              d’adhésion, de cotisation, de prêt, d’aide, de sanction ou de répartition relèvent
              de l’association et de ses organes compétents.
            </p>
            <p className="mt-3">
              Les paiements peuvent être réalisés via des prestataires tiers (mobile money, carte
              bancaire ou autres). Leur disponibilité, leurs frais et leurs conditions relèvent
              de ces prestataires. Tchoua ne garantit pas qu’une opération externe sera acceptée
              ou exécutée dans un délai déterminé.
            </p>
            <p className="mt-3">
              Les calculs, soldes, intérêts, plafonds et rapports sont fournis à titre d’outil de
              gestion. Vous devez vérifier les informations avant toute décision financière et
              respecter les règles de votre association et la réglementation applicable.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">4. Utilisation acceptable</h2>
            <p>Vous vous engagez à ne pas :</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>utiliser la plateforme à des fins illicites, frauduleuses ou de blanchiment ;</li>
              <li>accéder sans autorisation aux données, comptes ou associations d’autrui ;</li>
              <li>contourner les contrôles d’accès, les plafonds, les procédures KYC ou les règles de gouvernance ;</li>
              <li>publier des contenus diffamatoires, haineux, trompeurs ou portant atteinte à la vie privée ;</li>
              <li>introduire des virus, lancer des attaques ou perturber le fonctionnement du service ;</li>
              <li>extraire massivement les données ou utiliser le service pour construire un produit concurrent sans autorisation écrite.</li>
            </ul>
            <p className="mt-3">
              Nous pouvons suspendre ou limiter un accès en cas de violation, de risque de fraude,
              d’obligation légale ou de menace pour la sécurité.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">5. Contenus et données de l’association</h2>
            <p>
              Vous conservez vos droits sur les contenus et données que vous enregistrez. Vous
              accordez à Tchoua une autorisation limitée de les héberger, traiter et afficher
              uniquement pour fournir le service, assurer la sécurité et respecter la loi. Vous
              êtes responsable de la licéité des données que vous importez et de l’information de
              vos membres.
            </p>
            <p className="mt-3">
              Les responsables d’association doivent s’assurer qu’ils disposent des autorisations
              nécessaires pour traiter les données de leurs membres et pour effectuer les
              vérifications requises.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">6. Services tiers et connexion externe</h2>
            <p>
              La connexion via Google ou un autre fournisseur est facultative et soumise aux
              conditions de ce fournisseur. Tchoua ne contrôle pas ces services et n’est pas
              responsable de leurs décisions, disponibilités ou modifications. Vous pouvez
              révoquer l’accès à tout moment depuis votre compte fournisseur.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">7. Propriété intellectuelle et open source</h2>
            <p>
              Le code source de Tchoua est distribué sous licence open source selon les termes
              indiqués dans le dépôt du projet. Les marques, logos, éléments graphiques et
              contenus éditoriaux restent la propriété de leurs titulaires. Vous ne pouvez pas
              utiliser la marque Tchoua d’une manière qui suggère un partenariat ou une
              approbation sans autorisation.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">8. Disponibilité et maintenance</h2>
            <p>
              Nous nous efforçons de maintenir le service disponible, mais il peut être suspendu
              pour maintenance, mise à jour, incident de sécurité ou cause extérieure. Nous ne
              garantissons pas une disponibilité ininterrompue ni l’absence d’erreurs. Les
              fonctionnalités peuvent évoluer ; les changements importants seront communiqués
              lorsque cela est raisonnablement possible.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">9. Limitation de responsabilité</h2>
            <p>
              Dans les limites permises par la loi, Tchoua et DITROS ne sont pas responsables des
              pertes indirectes, des pertes de bénéfices, des décisions prises par une association
              ou ses membres, des défaillances d’un prestataire de paiement, d’une connexion
              internet ou d’un équipement, ni des contenus fournis par les utilisateurs. Cette
              limitation ne s’applique pas en cas de faute lourde, de dol ou de dommage corporel
              lorsque la loi interdit une telle limitation.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">10. Suspension, résiliation et suppression</h2>
            <p>
              Vous pouvez cesser d’utiliser le service et demander la suppression de votre compte
              selon les modalités disponibles. Nous pouvons suspendre ou résilier un compte en cas
              de violation grave des présentes conditions, de risque de fraude, d’obligation
              légale ou de danger pour la plateforme ou ses utilisateurs. Les données peuvent être
              conservées pendant les délais légaux avant suppression ou anonymisation.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">11. Droit applicable et litiges</h2>
            <p>
              Les présentes conditions sont régies par le droit camerounais, sans préjudice des
              règles impératives applicables aux utilisateurs situés dans d’autres pays. En cas de
              litige, les parties chercheront d’abord une solution amiable. À défaut, le litige
              sera soumis aux juridictions compétentes du Cameroun, sauf disposition légale
              contraire.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-gray-900">12. Modifications et contact</h2>
            <p>
              Nous pouvons modifier ces conditions pour tenir compte d’une évolution du service ou
              de la loi. La version applicable est celle publiée à la date de votre utilisation.
              Pour toute question :{" "}
              <a className="font-semibold text-[#0d3d28] underline" href="mailto:contact@tchoua.com">
                contact@tchoua.com
              </a>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-[#e8e2d8] bg-white p-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">13. Coordonnées</h2>
            <p>
              DITROS — Tchoua<br />
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
