type InviteParams = {
  inviterName: string;
  webUrl: string;
  mobileUrl: string;
  mode?: "DISCOVERY" | "MEMBER";
  associationName?: string | null;
  memberName?: string | null;
  confirmUrl?: string | null;
};

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}

export function buildInviteLandingHtml(params: InviteParams): string {
  const memberMode = params.mode === "MEMBER";
  const association = params.associationName ? esc(params.associationName) : null;
  const inviter = esc(params.inviterName);
  const target = memberMode && association ? `rejoindre <strong>${association}</strong>` : "rejoindre <strong>Tchoua</strong>";
  const ctaUrl = memberMode ? params.confirmUrl || params.webUrl : params.webUrl;
  const ctaLabel = memberMode ? "Confirmer mon accès à l'association" : "Créer mon compte gratuitement";
  const greeting = params.memberName ? `Bonjour ${esc(params.memberName)},` : "";
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>Votre invitation Tchoua</title></head>
<body style="margin:0;padding:0;background:#f3efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#17211c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${inviter} vous invite à découvrir une nouvelle façon de gérer vos tontines et associations.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #e1d9c8;box-shadow:0 12px 35px rgba(20,40,30,.10);">
  <tr><td style="background:#0d3d28;padding:20px 28px;">
    <table role="presentation" width="100%"><tr>
      <td style="font-size:26px;font-weight:900;letter-spacing:-.8px;color:#fff;">Tchoua<span style="color:#f0c56a;">.</span></td>
      <td align="right" style="font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#b9d7c4;">La solidarité digitalisée</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:34px 30px 10px;">
    <div style="display:inline-block;border-radius:999px;background:#edf7f0;color:#0d6b45;padding:7px 11px;font-size:10px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;">Invitation personnelle</div>
    <h1 style="margin:16px 0 10px;font-size:31px;line-height:1.12;letter-spacing:-1px;color:#0d3d28;">${memberMode ? `${inviter} vous invite à ${target}` : `${inviter} vous ouvre la porte de Tchoua`}</h1>
    ${greeting ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#39473f;">${greeting}</p>` : ""}
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5b52;">${memberMode ? `Votre place vous attend dans <strong>${association}</strong>. Retrouvez vos cotisations, vos activités, les décisions du bureau et les échanges de votre association dans un seul espace clair, sécurisé et accessible sur mobile comme sur le web.` : "Et si la solidarité de votre entourage avait enfin un espace à la hauteur de ses ambitions ? Tchoua réunit vos tontines, vos cotisations, vos prêts et vos décisions dans une plateforme unique, transparente et pensée pour durer."}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 20px;"><tr>
      <td align="center"><a href="${esc(ctaUrl)}" style="display:inline-block;background:#0d3d28;color:#fff;text-decoration:none;font-size:15px;font-weight:900;padding:15px 26px;border-radius:12px;">${ctaLabel} →</a></td>
    </tr></table>
    <p style="margin:0 0 8px;text-align:center;font-size:11px;color:#8a958e;">Gratuit · Sans engagement · Vos données restent sous votre contrôle</p>
  </td></tr>

  <tr><td style="padding:8px 30px 2px;">
    <h2 style="margin:12px 0 4px;font-size:19px;color:#0d3d28;">Tout ce qui rend une association plus simple</h2>
    <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#65736b;">Une seule plateforme pour faire vivre votre communauté, du premier versement au dernier compte rendu.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td width="50%" valign="top" style="padding:7px;"><div style="background:#f7faf7;border:1px solid #e1ebe3;border-radius:14px;padding:14px;"><div style="font-size:20px;">🔄</div><div style="margin-top:7px;font-size:14px;font-weight:900;color:#0d3d28;">Tontines & activités</div><div style="margin-top:4px;font-size:12px;line-height:1.5;color:#5d6b63;">Parts, tirages, rotations, épargne, prêts et aides : chaque mouvement est suivi.</div></div></td>
      <td width="50%" valign="top" style="padding:7px;"><div style="background:#f7faf7;border:1px solid #e1ebe3;border-radius:14px;padding:14px;"><div style="font-size:20px;">💳</div><div style="margin-top:7px;font-size:14px;font-weight:900;color:#0d3d28;">Paiements & wallet</div><div style="margin-top:4px;font-size:12px;line-height:1.5;color:#5d6b63;">Versements par wallet, banque ou espèces, avec preuves et reçus consultables.</div></div></td></tr>
      <tr><td width="50%" valign="top" style="padding:7px;"><div style="background:#f7faf7;border:1px solid #e1ebe3;border-radius:14px;padding:14px;"><div style="font-size:20px;">🗓️</div><div style="margin-top:7px;font-size:14px;font-weight:900;color:#0d3d28;">Réunions & décisions</div><div style="margin-top:4px;font-size:12px;line-height:1.5;color:#5d6b63;">Convocations, présences, ordre du jour, compte rendu PDF et diffusion au groupe.</div></div></td>
      <td width="50%" valign="top" style="padding:7px;"><div style="background:#f7faf7;border:1px solid #e1ebe3;border-radius:14px;padding:14px;"><div style="font-size:20px;">🔐</div><div style="margin-top:7px;font-size:14px;font-weight:900;color:#0d3d28;">Confiance & sécurité</div><div style="margin-top:4px;font-size:12px;line-height:1.5;color:#5d6b63;">KYC, rôles, journal d'audit et relevés téléchargeables pour chaque membre.</div></div></td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:14px 30px 4px;">
    <div style="background:#0d3d28;border-radius:16px;padding:20px 20px 16px;color:#fff;">
      <div style="font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#f0c56a;">Pourquoi vous allez aimer</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
        <tr><td style="padding:4px 0;font-size:13px;line-height:1.6;color:#e5f0e8;">✓ <strong>Vos comptes sont clairs</strong> — chaque versement, dette et remboursement est historisé.</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;line-height:1.6;color:#e5f0e8;">✓ <strong>Vous décidez ensemble</strong> — le bureau gouverne, les membres suivent les décisions.</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;line-height:1.6;color:#e5f0e8;">✓ <strong>Votre association vous suit</strong> — web et mobile, où que vous soyez.</td></tr>
      </table>
    </div>
  </td></tr>

  <tr><td style="padding:20px 30px 4px;">
    <h2 style="margin:0 0 10px;font-size:18px;color:#0d3d28;">Comment ça marche ?</h2>
    <table role="presentation" width="100%"><tr>
      <td width="33%" valign="top" style="padding-right:8px;"><div style="font-size:25px;font-weight:900;color:#d4a62a;">01</div><div style="font-size:12px;font-weight:900;color:#26352d;">Créez votre profil</div><div style="font-size:11px;line-height:1.45;color:#6b786f;margin-top:3px;">Inscription rapide, e-mail ou téléphone.</div></td>
      <td width="33%" valign="top" style="padding:0 8px;"><div style="font-size:25px;font-weight:900;color:#d4a62a;">02</div><div style="font-size:12px;font-weight:900;color:#26352d;">Rejoignez votre espace</div><div style="font-size:11px;line-height:1.45;color:#6b786f;margin-top:3px;">Votre association, vos activités, votre rôle.</div></td>
      <td width="33%" valign="top" style="padding-left:8px;"><div style="font-size:25px;font-weight:900;color:#d4a62a;">03</div><div style="font-size:12px;font-weight:900;color:#26352d;">Suivez tout en direct</div><div style="font-size:11px;line-height:1.45;color:#6b786f;margin-top:3px;">Versements, décisions et comptes rendus.</div></td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:22px 30px 30px;"><table role="presentation" width="100%"><tr>
    <td align="center"><a href="${esc(ctaUrl)}" style="display:inline-block;background:#d48a16;color:#fff;text-decoration:none;font-size:14px;font-weight:900;padding:14px 24px;border-radius:11px;">${memberMode ? "Activer mon accès" : "Rejoindre Tchoua maintenant"}</a></td>
  </tr></table>
  <p style="margin:14px 0 0;text-align:center;font-size:11px;line-height:1.5;color:#87938b;">Application mobile disponible sur <a href="${esc(params.mobileUrl)}" style="color:#0d3d28;font-weight:700;">www.tchoua.com/mobile</a> · Une question ? <a href="mailto:support@tchoua.com" style="color:#0d3d28;font-weight:700;">support@tchoua.com</a></p>
  </td></tr>
  <tr><td style="background:#f7f3eb;border-top:1px solid #e1d9c8;padding:15px 30px;font-size:10px;line-height:1.55;color:#77847b;">Vous recevez ce message car ${inviter} vous invite personnellement à découvrir Tchoua. Si vous ne souhaitez pas rejoindre, vous pouvez ignorer cet e-mail.<br/><strong style="color:#0d3d28;">Tchoua</strong> — La solidarité digitalisée · www.tchoua.com</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
