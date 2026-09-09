/**
 * Typed loader for content/de.json – the single source of truth for all copy,
 * links and image paths. Types are derived from the JSON itself, so accessing
 * a wrong key is a TypeScript error.
 */
import de from '../../content/de.json';

export type SiteContent = typeof de;
export type NavItem = SiteContent['nav']['items'][number];
export type Company = SiteContent['portfolio']['companies'][number];
export type WarumCard = SiteContent['warumKplus']['cards'][number];
export type Schwerpunkt = SiteContent['schwerpunkte']['items'][number];

export const content = de as SiteContent;

/**
 * Splits a text at "\n" into lines (used for hero.text and cta.text).
 * Render each line and add a <br> between them – never via set:html.
 */
export function nl2br(text: string): string[] {
  return text.split('\n');
}
