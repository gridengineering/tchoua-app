import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

function normalizeColor(value?: string | null): string {
  const color = String(value ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#165E39";
}

function initials(name: string): string {
  const parenthetical = name.match(/\(([A-Z0-9]{2,8})\)/i)?.[1];
  if (parenthetical) return parenthetical.toUpperCase();
  const words = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Za-zÀ-ÿ0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return (words.slice(0, 3).map((w) => w[0]).join("") || "T").toUpperCase();
}

function hash(value: string): number {
  let n = 0;
  for (const ch of value) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return n;
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c] ?? c));
}

export function associationLogoSvg(name: string, colorInput?: string | null): string {
  const color = normalizeColor(colorInput);
  const accent = ["#f0c56a", "#7dd3fc", "#f9a8d4", "#a7f3d0", "#fca5a5"][hash(name) % 5];
  const letters = initials(name);
  const id = `g${hash(name)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="${esc(name)}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#071f16"/></linearGradient>
    <clipPath id="c"><rect width="512" height="512" rx="112"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="512" height="512" fill="url(#${id})"/>
    <circle cx="430" cy="82" r="150" fill="${accent}" opacity=".16"/>
    <circle cx="76" cy="448" r="180" fill="#ffffff" opacity=".07"/>
    <path d="M0 360 C130 280 250 420 512 300 L512 512 L0 512 Z" fill="#000" opacity=".18"/>
    <path d="M-40 90 C100 20 190 150 330 62" fill="none" stroke="${accent}" stroke-width="10" opacity=".55"/>
  </g>
  <rect x="1" y="1" width="510" height="510" rx="111" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="2"/>
  <text x="256" y="276" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="${letters.length > 3 ? 116 : 154}" font-weight="800" fill="#ffffff">${esc(letters)}</text>
  <text x="256" y="344" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" letter-spacing="8" fill="${accent}">TCHOUA</text>
</svg>`;
}

export async function ensureAssociationLogo(params: {
  id: string;
  name: string;
  color?: string | null;
  logo?: string | null;
  force?: boolean;
}): Promise<string | null> {
  if (params.logo && !params.force) return params.logo;
  const dir = join(process.cwd(), "public", "uploads", "associations", params.id);
  await mkdir(dir, { recursive: true });
  const relative = `/uploads/associations/${params.id}/logo-default.svg`;
  await writeFile(join(dir, "logo-default.svg"), associationLogoSvg(params.name, params.color), "utf8");
  await prisma.association.update({ where: { id: params.id }, data: { logo: relative } });
  return relative;
}
