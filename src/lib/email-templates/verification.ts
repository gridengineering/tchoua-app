export function buildVerificationCodeHtml(params: { code: string; name?: string | null; purpose?: string; expiryMinutes?: number }): string {
  const name = params.name ? `Bonjour ${params.name},` : "Bonjour,";
  const purpose = params.purpose ?? "Vérification de votre compte Tchoua";
  const minutes = params.expiryMinutes ?? 10;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${purpose} — Tchoua</title></head>
<body style="margin:0;padding:0;background:#f3efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#17211c;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe6;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e1d9c8;box-shadow:0 12px 35px rgba(20,40,30,.10);">
<tr><td style="background:#0d3d28;padding:20px 28px;color:#fff;"><span style="font-size:25px;font-weight:900;letter-spacing:-.8px;">Tchoua<span style="color:#f0c56a;">.</span></span><span style="float:right;font-size:10px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;color:#b9d7c4;padding-top:7px;">La solidarité digitalisée</span></td></tr>
<tr><td style="padding:32px 30px 10px;"><div style="display:inline-block;border-radius:999px;background:#edf7f0;color:#0d6b45;padding:7px 11px;font-size:10px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;">Sécurité du compte</div>
<h1 style="margin:16px 0 10px;font-size:26px;line-height:1.2;color:#0d3d28;">Votre code de vérification</h1>
<p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:#39473f;">${name}</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5b52;">Utilisez le code ci-dessous pour finaliser <strong>${purpose.toLowerCase()}</strong>. Il confirme que cette adresse e-mail vous appartient et protège votre accès à Tchoua.</p>
<div style="background:#f7f3eb;border:1px solid #e5dccb;border-radius:16px;padding:20px;text-align:center;margin:0 0 20px;"><div style="font-size:10px;font-weight:900;letter-spacing:1.8px;text-transform:uppercase;color:#8a6a25;">Code à usage unique</div><div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:38px;font-weight:900;letter-spacing:9px;color:#0d3d28;margin:10px 0 4px;">${params.code}</div><div style="font-size:11px;color:#77847b;">Expire dans ${minutes} minutes</div></div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr><td align="center"><a href="https://www.tchoua.com" style="display:inline-block;background:#0d3d28;color:#fff;text-decoration:none;font-size:14px;font-weight:900;padding:13px 24px;border-radius:11px;">Ouvrir Tchoua</a></td></tr></table>
<div style="background:#fff8e8;border:1px solid #f0dfb8;border-radius:12px;padding:13px 15px;font-size:12px;line-height:1.6;color:#6e5b2e;"><strong>Important :</strong> ne partagez jamais ce code. Un membre de Tchoua ne vous le demandera jamais par téléphone, e-mail ou WhatsApp.</div>
<p style="margin:16px 0 0;font-size:11px;line-height:1.6;color:#87938b;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre compte reste protégé et aucune action ne sera effectuée sans ce code.</p></td></tr>
<tr><td style="background:#f7f3eb;border-top:1px solid #e1d9c8;padding:15px 30px;font-size:10px;line-height:1.55;color:#77847b;"><strong style="color:#0d3d28;">Tchoua</strong> — La solidarité digitalisée · www.tchoua.com · support@tchoua.com</td></tr>
</table></td></tr></table></body></html>`;
}
