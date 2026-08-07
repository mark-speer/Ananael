/**
 * Ritual Library corpus — study sketches for common ceremonial rites.
 */

import type { PlanetId } from '../lib/planetaryHours';

export interface LiturgyStep {
  title: string;
  body: string;
}

export interface LiturgyRite {
  id: string;
  title: string;
  tradition: string;
  tags: string[];
  tools: string[];
  steps: LiturgyStep[];
  suggestedPlanet?: PlanetId;
  ritualTemplate?: 'lbrp' | 'altar';
  sketch?: boolean;
}

export const LITURGY_RITES: LiturgyRite[] = [
  {
    id: 'lbrp',
    title: 'Lesser Banishing Ritual of the Pentagram',
    tradition: 'Golden Dawn',
    tags: ['banishing', 'pentagram', 'daily'],
    tools: ['dagger or wand', 'space to turn the quarters'],
    suggestedPlanet: 'Mercury',
    ritualTemplate: 'lbrp',
    steps: [
      {
        title: 'Qabalistic Cross',
        body: 'Touch forehead, breast, right then left shoulder with the formula Ateh / Malkuth / ve-Geburah / ve-Gedulah / le-Olam / Amen.',
      },
      {
        title: 'Pentagrams',
        body: 'In the East, South, West, and North, trace the banishing earth pentagram and vibrate the corresponding divine name.',
      },
      {
        title: 'Archangels',
        body: 'Stand in the form of a cross and invoke Before me Raphael, Behind me Gabriel, On my right hand Michael, On my left hand Auriel; about me flame the pentagrams, within me the six-rayed star.',
      },
      {
        title: 'Close',
        body: 'Repeat the Qabalistic Cross.',
      },
    ],
  },
  {
    id: 'middle-pillar',
    title: 'Middle Pillar Exercise',
    tradition: 'Golden Dawn',
    tags: ['qabalah', 'energy', 'balance'],
    tools: ['quiet stance', 'breath'],
    suggestedPlanet: 'Sun',
    steps: [
      {
        title: 'Kether',
        body: 'Visualize brilliant white light above the crown; vibrate Eheieh.',
      },
      {
        title: 'Daath',
        body: 'Bring light to the throat; vibrate YHVH Elohim.',
      },
      {
        title: 'Tiphareth',
        body: 'Heart center golden; vibrate YHVH Eloah ve-Daath.',
      },
      {
        title: 'Yesod',
        body: 'Genital/pelvic center violet; vibrate Shaddai El Chai.',
      },
      {
        title: 'Malkuth',
        body: 'Feet and earth contact; vibrate Adonai ha-Aretz. Circulate the light.',
      },
    ],
  },
  {
    id: 'lhrp',
    title: 'Lesser Ritual of the Hexagram (sketch)',
    tradition: 'Golden Dawn',
    tags: ['hexagram', 'planetary'],
    tools: ['wand', 'hexagram forms'],
    suggestedPlanet: 'Sun',
    sketch: true,
    steps: [
      {
        title: 'Analysis of the Keyword',
        body: 'Perform the Analysis of INRI / IAO as traditionally taught.',
      },
      {
        title: 'Hexagrams of the quarters',
        body: 'Trace the appropriate hexagram forms to the quarters with the planetary or elemental intent of the working.',
      },
      {
        title: 'Close',
        body: 'Repeat the Analysis of the Keyword.',
      },
    ],
  },
  {
    id: 'heptameron-orison',
    title: 'Heptameron-style Orison (study sketch)',
    tradition: 'Heptameron',
    tags: ['solomonic', 'orison'],
    tools: ['circle', 'incense of the day'],
    suggestedPlanet: 'Mercury',
    sketch: true,
    ritualTemplate: 'altar',
    steps: [
      {
        title: 'Preparation',
        body: 'Observe the planetary day and hour; prepare the circle and incense proper to the angel of the day.',
      },
      {
        title: 'Orison (sketch)',
        body: 'Address the Most High and the angelic hierarchy of the day in a short consecratory orison before any particular petition. This is a study placeholder—consult historical texts for full forms.',
      },
    ],
  },
  {
    id: 'goetia-constraint',
    title: 'Goetia Constraint Prayer (study sketch)',
    tradition: 'Goetia',
    tags: ['solomonic', 'goetia'],
    tools: ['circle', 'triangle of art', 'seal'],
    suggestedPlanet: 'Saturn',
    sketch: true,
    steps: [
      {
        title: 'Constraint (sketch)',
        body: 'A brief constraint addresses the spirit by name and seal, charging obedience by the authority of the divine names used in the Art. Study sketch only—use classical Goetia wording from public-domain editions for live work.',
      },
      {
        title: 'License to Depart',
        body: 'When the work is complete, grant license to depart in peace and close the circle.',
      },
    ],
  },
];

export function searchRites(query: string): LiturgyRite[] {
  const q = query.trim().toLowerCase();
  if (!q) return LITURGY_RITES;
  return LITURGY_RITES.filter((r) => {
    const hay = [
      r.title,
      r.tradition,
      ...r.tags,
      ...r.tools,
      ...r.steps.flatMap((step) => [step.title, step.body]),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function getRite(id: string): LiturgyRite | undefined {
  return LITURGY_RITES.find((r) => r.id === id);
}
