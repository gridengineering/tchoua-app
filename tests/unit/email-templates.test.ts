import { buildInviteLandingHtml } from "@/lib/email-templates/invite";
import { buildVerificationCodeHtml } from "@/lib/email-templates/verification";

describe("e-mails transactionnels", () => {
  it("présente les bénéfices et un CTA vendeur dans l'invitation", () => {
    const html = buildInviteLandingHtml({ inviterName: "Serge", webUrl: "https://www.tchoua.com/register", mobileUrl: "https://www.tchoua.com/mobile" });
    expect(html).toContain("Tontines &amp; activités");
    expect(html).toContain("Paiements &amp; wallet");
    expect(html).toContain("Rejoindre Tchoua maintenant");
    expect(html).toContain("Serge");
  });

  it("formate le code de vérification en HTML professionnel", () => {
    const html = buildVerificationCodeHtml({ code: "123456", name: "Serge" });
    expect(html).toContain("123456");
    expect(html).toContain("Code à usage unique");
    expect(html).toContain("ne partagez jamais ce code");
  });
});
