/**
 * Ritual Library corpus — study outlines and public-domain Solomonic excerpts.
 * Not a substitute for traditional instruction or copyrighted modern editions.
 */

import type { PlanetId } from '../lib/planetaryHours';
import type { TemplateId } from './ritualTools';

export interface LiturgyStep {
  title: string;
  body: string;
  /** Optional hold duration in seconds (qigong standing, etc.) */
  durationSec?: number;
}

export interface LiturgyRite {
  id: string;
  title: string;
  tradition: string;
  tags: string[];
  tools: string[];
  steps: LiturgyStep[];
  purpose?: string;
  notes?: string;
  sources?: string[];
  suggestedPlanet?: PlanetId;
  ritualTemplate?: TemplateId;
  sketch?: boolean;
  relatedChakras?: string[];
  relatedMeridians?: string[];
  relatedWorlds?: string[];
  relatedAllies?: string[];
}

export const LITURGY_RITES: LiturgyRite[] = [
  {
    id: 'lbrp',
    title: 'Lesser Banishing Ritual of the Pentagram',
    tradition: 'Golden Dawn',
    tags: ['banishing', 'pentagram', 'daily', 'qabalah'],
    tools: ['dagger or wand', 'space to turn the quarters'],
    purpose:
      'Clear and seal the working space with elemental banishing pentagrams and the archangelic guardians of the quarters.',
    notes:
      'Study outline of the classical Golden Dawn form. Confirm divine-name pronunciations and pentagram stroke order with your lineage before live work.',
    sources: [
      'Golden Dawn Outer Order tradition (study outline; not a full Regardie transcription)',
    ],
    suggestedPlanet: 'Mercury',
    ritualTemplate: 'lbrp',
    steps: [
      {
        title: 'Qabalistic Cross',
        body: 'Face East. Touch forehead and vibrate Ateh (Unto Thee). Touch breast and vibrate Malkuth (the Kingdom). Touch right shoulder and vibrate ve-Geburah (and the Power). Touch left shoulder and vibrate ve-Gedulah (and the Glory). Clasp hands at the breast and vibrate le-Olam, Amen (unto the ages, Amen). Visualize a shaft of light from Kether through the Middle Pillar as you mark the cross.',
      },
      {
        title: 'Pentagram — East',
        body: 'Trace the banishing Earth pentagram in the East (start at lower left point, up to top, down to lower right, across to upper left, across to upper right, back to lower left). Point to the center and vibrate YHVH (Ye-ho-vah / the Tetragrammaton as taught). See the pentagram in flaming blue or white light.',
      },
      {
        title: 'Pentagram — South',
        body: 'Carry the line of light to the South. Trace the same banishing Earth pentagram; vibrate ADNI (Adonai). Keep the circle of light continuous between quarters.',
      },
      {
        title: 'Pentagram — West',
        body: 'Carry the line to the West. Trace the banishing Earth pentagram; vibrate AHIH (Eheieh).',
      },
      {
        title: 'Pentagram — North',
        body: 'Carry the line to the North. Trace the banishing Earth pentagram; vibrate AGLA (Agla — Atah Gibor Le-olam Adonai). Complete the circle of light back to the East.',
      },
      {
        title: 'Archangels',
        body: 'Stand in the form of a cross (arms outstretched). Say: Before me Raphael; Behind me Gabriel; On my right hand Michael; On my left hand Auriel (Uriel). For about me flames the pentagrams, and within me shines the six-rayed star. Visualize each archangel in their quarter with elemental colors.',
      },
      {
        title: 'Close',
        body: 'Repeat the Qabalistic Cross. The space is banished and sealed for subsequent work or daily practice.',
      },
    ],
  },
  {
    id: 'middle-pillar',
    title: 'Middle Pillar Exercise',
    tradition: 'Golden Dawn',
    tags: ['qabalah', 'energy', 'balance', 'daily'],
    tools: ['quiet stance', 'breath'],
    purpose:
      'Awaken and equilibrate the Middle Pillar of the Tree in the aura through vibration and circulation of light.',
    notes:
      'Work standing or seated with a straight spine. Vibrate each Name on the out-breath until the sphere feels established; do not force strain in the throat.',
    sources: ['Golden Dawn / Regardie Middle Pillar tradition (study outline)'],
    suggestedPlanet: 'Sun',
    steps: [
      {
        title: 'Prepare',
        body: 'Stand facing East (or as preferred). Breathe slowly until the mind is quiet. Optionally open with a brief Qabalistic Cross.',
      },
      {
        title: 'Kether',
        body: 'Visualize a sphere of brilliant white light just above the crown of the head. Inhale; on the exhale vibrate Eheieh several times until the sphere is vivid and cool-bright.',
      },
      {
        title: 'Daath',
        body: 'Draw a beam of light down to the throat. Form a lavender or soft grey-white sphere at the throat center; vibrate YHVH Elohim until stable.',
      },
      {
        title: 'Tiphareth',
        body: 'Continue the beam to the heart / solar plexus. Form a golden sphere; vibrate YHVH Eloah ve-Daath. Feel warmth and equilibrium.',
      },
      {
        title: 'Yesod',
        body: 'Bring light to the genital / pelvic center as a violet sphere; vibrate Shaddai El Chai. Sense generative and lunar vitality without agitation.',
      },
      {
        title: 'Malkuth',
        body: 'Ground the beam at the feet and earth contact as a sphere of citrine, olive, russet, and black (or stable earth tones); vibrate Adonai ha-Aretz.',
      },
      {
        title: 'Circulation of the Light',
        body: 'On the breath, circulate light from Malkuth up the right side of the body to Kether and down the left; then reverse; then circulate as a rising and descending spiral or fountain through the Middle Pillar until the aura feels even. Close with a silent Amen or Qabalistic Cross.',
      },
    ],
  },
  {
    id: 'lhrp',
    title: 'Lesser Ritual of the Hexagram',
    tradition: 'Golden Dawn',
    tags: ['hexagram', 'planetary', 'banishing', 'invoking'],
    tools: ['wand or dagger', 'space to turn the quarters'],
    purpose:
      'Banishing or invoking planetary / solar forces through the Analysis of the Keyword and hexagrams of the quarters.',
    notes:
      'Use banishing hexagram forms to clear planetary influence; invoking forms to draw them. Confirm hexagram stroke diagrams for your order before practice.',
    sources: ['Golden Dawn hexagram ritual tradition (study outline)'],
    suggestedPlanet: 'Sun',
    steps: [
      {
        title: 'Analysis of the Keyword',
        body: 'Face East. Trace or visualize the Cross and intone the Analysis of INRI: I.N.R.I. — Yod Nun Resh Yod — Virgo, Isis, Mighty Mother; Scorpio, Apophis, Destroyer; Sol, Osiris, Slain and Risen; then Isis, Apophis, Osiris — I.A.O. Draw the invoking or banishing hexagram of the work as taught, and vibrate IAO with the L.V.X. signs (or your lineage’s equivalent).',
      },
      {
        title: 'Hexagram — East',
        body: 'Trace the appropriate hexagram (commonly Fire hexagram toward the East in the Lesser form) with the planetary or elemental intent of the working. Vibrate ARARITA (or the Name used in your tradition) while pointing to the center.',
      },
      {
        title: 'Hexagram — South, West, North',
        body: 'Carry a continuous circle of light through South, West, and North, tracing the corresponding hexagrams of the quarters. Maintain the same banishing or invoking mode throughout.',
      },
      {
        title: 'Close',
        body: 'Return to the East and repeat the Analysis of the Keyword. Proceed to planetary or ceremonial work, or close the space as required.',
      },
    ],
  },
  {
    id: 'sirp',
    title: 'Supreme Invoking Ritual of the Pentagram',
    tradition: 'Golden Dawn',
    tags: ['invoking', 'pentagram', 'elemental', 'opening'],
    tools: ['wand or dagger', 'space to turn the quarters'],
    purpose:
      'Invoke the elemental forces of the quarters with the supreme pentagram forms and the corresponding divine and angelic names.',
    notes:
      'Often used to open elemental or Watchtower work. Pair with Elections for the element or planet of the operation. Stroke order and Name sets vary by lineage — treat this as a procedural outline.',
    sources: ['Golden Dawn pentagram grade tradition (study outline)'],
    suggestedPlanet: 'Mercury',
    ritualTemplate: 'lbrp',
    steps: [
      {
        title: 'Qabalistic Cross',
        body: 'Perform the Qabalistic Cross as in the LBRP (Ateh / Malkuth / ve-Geburah / ve-Gedulah / le-Olam, Amen).',
      },
      {
        title: 'East — Air',
        body: 'Trace the supreme invoking pentagram of Air in the East. Vibrate the divine Name (commonly YHVH), then the archangelic and elemental hierarchy as taught (e.g. Raphael, Chassan, and the Kerub of Air). See yellow / violet Air symbolism.',
      },
      {
        title: 'South — Fire',
        body: 'Carry the circle South. Trace the supreme invoking pentagram of Fire; vibrate Elohim (or the Fire Name of your curriculum), with Michael and the Fire hierarchy. See scarlet / green Fire symbolism.',
      },
      {
        title: 'West — Water',
        body: 'In the West, trace the supreme invoking pentagram of Water; vibrate El, with Gabriel and the Water hierarchy. See blue / orange Water symbolism.',
      },
      {
        title: 'North — Earth',
        body: 'In the North, trace the supreme invoking pentagram of Earth; vibrate Adonai, with Auriel and the Earth hierarchy. See citrine, olive, russet, black Earth symbolism.',
      },
      {
        title: 'Spirit and close',
        body: 'If using the full supreme form, establish Spirit Active / Passive pentagrams as taught before or after the quarters. Stand in the archangelic cross, declare the quarters filled with light, and close with the Qabalistic Cross.',
      },
    ],
  },
  {
    id: 'rose-cross',
    title: 'Ritual of the Rose Cross',
    tradition: 'Golden Dawn',
    tags: ['protection', 'hexagram', 'healing', 'invisibility'],
    tools: ['wand or incense', 'room to walk a circuit'],
    purpose:
      'Establish a rose-cross lattice of light for protection, healing atmosphere, or withdrawal of the aura from outer disturbance.',
    notes:
      'Traditionally quieter and more “veiling” than the LBRP. Useful after banishing when a gentler seal is wanted. Confirm the room-circuit pattern with your source diagrams.',
    sources: ['Golden Dawn Rose Cross ritual tradition (study outline)'],
    suggestedPlanet: 'Venus',
    steps: [
      {
        title: 'Preparation',
        body: 'Stand in the center facing East. Optionally open with a brief Cross or Middle Pillar. Hold wand or incense as the tracing tool.',
      },
      {
        title: 'Analysis of the Keyword',
        body: 'Perform the Analysis of INRI / IAO and the L.V.X. signs (or your order’s equivalent) to attune to the formula of the Rose Cross.',
      },
      {
        title: 'Circuit of rose-crosses',
        body: 'Walk or turn through the room’s corners and midpoints as traditionally mapped, tracing a cross and rose (or cross within a circle) at each station while vibrating YEHESHUAH / YEHOVASHAH (or the Names used in your lineage). See rosy gold light sealing each point.',
      },
      {
        title: 'Center and close',
        body: 'Return to the center. Visualize the completed lattice enclosing the space. Repeat the Analysis of the Keyword and stand in silence until the atmosphere feels even.',
      },
    ],
  },
  {
    id: 'watchtower',
    title: 'Opening by Watchtower',
    tradition: 'Golden Dawn',
    tags: ['enochian', 'elemental', 'opening', 'watchtower'],
    tools: ['elemental weapons or wand', 'Tablet / Watchtower symbols if used'],
    purpose:
      'Open the elemental Watchtowers and Spirit for ceremonial or Enochian-leaning work after preparatory banishing.',
    notes:
      'Condensed study outline only — not a full temple script. Names, Tablet placements, and Enochian Calls vary widely; cross-check with your Enochian module and traditional sources before live operations.',
    sources: [
      'Golden Dawn / post-GD Watchtower opening tradition (abbreviated study outline)',
    ],
    suggestedPlanet: 'Mercury',
    ritualTemplate: 'lbrp',
    steps: [
      {
        title: 'Preparation',
        body: 'Banish with LBRP (and often LHRP). Arrange elemental weapons or symbolic Tablets toward their quarters if used. Establish calm breath and intent.',
      },
      {
        title: 'Open the quarters',
        body: 'In turn (commonly Fire, Water, Air, Earth — confirm order with your source), salute the Watchtower, vibrate the appropriate divine and elemental Names, and declare the quarter open. Trace the relevant pentagram or use the elemental weapon as taught.',
      },
      {
        title: 'Spirit and Tablet of Union',
        body: 'Invoke Spirit Active and Spirit Passive (or the Tablet of Union) so the four elements are equilibrated under Spirit. Visualize the Tablets living with light.',
      },
      {
        title: 'Proceed and later close',
        body: 'State the purpose of the working. When finished, reverse the process: thank and close each Watchtower, then banish as required (LBRP / LHRP). Log the working afterward.',
      },
    ],
  },
  {
    id: 'heptameron-orison',
    title: 'Heptameron-style Orison',
    tradition: 'Heptameron',
    tags: ['solomonic', 'orison', 'consecration', 'angels'],
    tools: ['circle', 'incense of the day', 'white garment if used'],
    purpose:
      'Consecrate the operator and circle with a general orison to God and the angelic hierarchy of the day before particular petitions.',
    notes:
      'Observe planetary day and hour. Pair with Celestial Timing Elections and Solomonic Circles. Wording below is a public-domain–style study rendering, not a critical edition.',
    sources: [
      'Heptameron / Magical Elements tradition (public-domain English renderings)',
    ],
    suggestedPlanet: 'Mercury',
    ritualTemplate: 'altarCross',
    steps: [
      {
        title: 'Preparation',
        body: 'Choose the planetary day and hour proper to the angel of the day. Prepare the circle, perfume the air with incense congruent to that day, and compose the mind in humility before the Most High.',
      },
      {
        title: 'Orison',
        body: 'O God, strong and mighty, who art without beginning or end; who hast created all things by Thine ineffable Word; grant that I may understand and perform Thy holy will. Sanctify this place and these operations, that the holy angels — especially the angel set over this day — may assist me in truth and righteousness, and that no unclean spirit may deceive me. Through Thy holy Names, Amen.',
      },
      {
        title: 'Dedication',
        body: 'State briefly that the ensuing work is undertaken under divine authority and the angel of the day. Proceed to particular conjurations or petitions only after this general consecration.',
      },
    ],
  },
  {
    id: 'heptameron-angel',
    title: 'Heptameron — Angel of the Day',
    tradition: 'Heptameron',
    tags: ['solomonic', 'angels', 'planetary', 'invocation'],
    tools: ['circle', 'incense of the day', 'name of the day’s angel'],
    purpose:
      'Invoke the governing angel of the planetary day after general orison and circle consecration.',
    notes:
      'Traditional day-angels (Latin Heptameron tradition): Sunday Michael; Monday Gabriel; Tuesday Samael; Wednesday Raphael; Thursday Sachiel; Friday Anael; Saturday Cassiel. Confirm spelling and seals with your edition. Use the matching planetary hour when possible.',
    sources: [
      'Heptameron day-angel tables and conjurations (public-domain tradition)',
    ],
    suggestedPlanet: 'Sun',
    ritualTemplate: 'altarCross',
    steps: [
      {
        title: 'Elect the day and hour',
        body: 'Identify the weekday angel and open Celestial Timing Elections for a congruent planetary hour. Prepare incense and circle as for Heptameron work.',
      },
      {
        title: 'General consecration',
        body: 'Perform a Heptameron-style orison (see Heptameron-style Orison) and consecrate the circle before naming the particular angel.',
      },
      {
        title: 'Invocation of the angel',
        body: 'Facing the quarter or direction preferred in your source, call the angel of the day by name: “I invoke and call upon thee, N., holy angel of this day, appointed by the Most High over these hours and offices, to appear peaceably and to assist this work according to the divine will.” Add petitions proper to that angel’s offices (healing, knowledge, protection, etc.).',
      },
      {
        title: 'Thanksgiving and license',
        body: 'Give thanks for any assistance perceived. License the angel to depart in peace to their appointed place, and close the circle without abrupt dismissal of divine Names already used.',
      },
    ],
  },
  {
    id: 'circle-consecration',
    title: 'Consecration of the Circle',
    tradition: 'Heptameron',
    tags: ['solomonic', 'circle', 'consecration', 'protection'],
    tools: ['traced or marked circle', 'sword or wand', 'holy water / incense'],
    purpose:
      'Dedicate the magician’s circle as a hallowed boundary before Solomonic or angelic operations.',
    notes:
      'Works with Solomonic Circles module layouts. Keep the circumference unbroken in visualization even if the physical mark is approximate.',
    sources: [
      'Heptameron and broader Solomonic circle-consecration practice (study outline with PD phrasing)',
    ],
    suggestedPlanet: 'Saturn',
    ritualTemplate: 'altarCross',
    steps: [
      {
        title: 'Mark the boundary',
        body: 'Stand within the prepared circle. With sword, wand, or extended hand, slowly trace the circumference clockwise (or as your tradition requires), seeing a wall of light rise.',
      },
      {
        title: 'Asperge and perfume',
        body: 'If using holy water and incense, asperge and cense the circle while saying that this place is set apart from the world for the work of the Most High and His holy angels.',
      },
      {
        title: 'Consecratory words',
        body: 'In the name of God the Father, the Son, and the Holy Spirit — or the divine Names used in your Solomonic rite — I consecrate this circle as a fortress of truth. May no evil thing enter herein; may the holy angels keep watch upon its bounds. Amen.',
      },
      {
        title: 'Seal',
        body: 'Return to the center. Affirm that the circle is closed and consecrated. Proceed to orison, conjuration, or other work without casually stepping out until properly licensed and closed.',
      },
    ],
  },
  {
    id: 'goetia-conjuration',
    title: 'Goetia — First Conjuration',
    tradition: 'Goetia',
    tags: ['solomonic', 'goetia', 'conjuration', 'spirit'],
    tools: ['circle', 'triangle of art', 'spirit seal', 'sword or wand'],
    purpose:
      'Call a spirit of the Ars Goetia by name and seal into the Triangle of Art under divine authority.',
    notes:
      'Study material for public-domain Lemegeton wording. Always work from within a properly constructed circle; never invite the spirit into the circle. Replace N. with the spirit’s name and have the seal ready. Prefer constrained, ethical petitions.',
    sources: [
      'Lemegeton Clavicula Salomonis — Ars Goetia (public-domain Mathers/Crowley-era English tradition)',
    ],
    suggestedPlanet: 'Saturn',
    steps: [
      {
        title: 'Prepare the Art',
        body: 'Establish circle and Triangle of Art. Place the spirit’s seal in or before the triangle as your edition requires. Open with prayer and constraint of the space. Name the spirit N. clearly.',
      },
      {
        title: 'First Conjuration (excerpt)',
        body: 'I do invocate and conjure thee, O Spirit N.; and being armed with power from the Supreme Majesty, I do strongly command thee by Beralanensis, Baldachiensis, Paumachia, and Apologiae Sedes; by the most powerful princes, genii, Liachidæ, and ministers of the Tartarean abode; and by the Chief Prince of the seat of Apologia in the Ninth Legion; that thou dost forthwith appear and show thyself visibly unto me before this Circle, in fair and human shape, without deformity or guile…',
      },
      {
        title: 'Charge and pause',
        body: 'Continue with the charge to answer truly and perform the office of the spirit’s rank without harm to the operator, companions, or goods. Pause, repeat with firmness if needed, then escalate only through traditional second and subsequent conjurations if the spirit does not appear.',
      },
      {
        title: 'If appearance is granted',
        body: 'Give the spirit welcome in the triangle, show the seal, state the petition briefly, and bind the spirit to truthful answer. Do not leave the circle. When finished, proceed to License to Depart.',
      },
    ],
  },
  {
    id: 'goetia-constraint',
    title: 'Goetia — Constraint',
    tradition: 'Goetia',
    tags: ['solomonic', 'goetia', 'constraint', 'spirit'],
    tools: ['circle', 'triangle of art', 'seal', 'chain or symbolic binding if used'],
    purpose:
      'Strengthen the charge upon a reluctant spirit by divine Names and the authority of the Art.',
    notes:
      'Used when preliminary conjurations do not avail. Remain calm and exact; fear and anger disorder the work. Still dismiss properly afterward.',
    sources: [
      'Lemegeton Ars Goetia constraints and charges (public-domain English tradition)',
    ],
    suggestedPlanet: 'Saturn',
    steps: [
      {
        title: 'Address by name and seal',
        body: 'Holding or indicating the seal of N., declare that by the virtue of the holy Names of God and the office of King Solomon’s Art, the spirit is bound to obedience within the triangle and may not deceive.',
      },
      {
        title: 'Constraint (study wording)',
        body: 'I constrain thee, O Spirit N., by the most mighty and powerful name of God, EL, strong and wonderful; by ADONAI, by EHEIEH, and by the ineffable Tetragrammaton YHVH; and by all the holy Names whereby Solomon did compel the spirits; that thou appear immediately, peaceably, visibly, and without delay, to do my will in all things that are agreeable to thine office — or else that thou be bound in the depths until the judgment of the great day.',
      },
      {
        title: 'Renewed charge',
        body: 'Restate the petition. If the spirit complies, show courtesy within the rules of the Art. If not, consult full classical editions for further chains and curses rather than improvising.',
      },
      {
        title: 'Toward closing',
        body: 'Whether or not the petition is fulfilled, prepare to give License to Depart so that nothing remains unordered in the triangle.',
      },
    ],
  },
  {
    id: 'goetia-license',
    title: 'Goetia — License to Depart',
    tradition: 'Goetia',
    tags: ['solomonic', 'goetia', 'dismissal', 'closing'],
    tools: ['circle', 'triangle of art', 'seal'],
    purpose:
      'Dismiss the spirit peaceably and close the Goetic operation without leaving residual charge in the triangle.',
    notes:
      'Give license even if the spirit did not appear, when you have named and called it. Then banish and ground as your practice requires.',
    sources: [
      'Lemegeton Ars Goetia — License to Depart (public-domain English tradition)',
    ],
    suggestedPlanet: 'Saturn',
    steps: [
      {
        title: 'Thanksgiving',
        body: 'Address the spirit N. (if present or having been called): acknowledge any service rendered and affirm that the work is complete for this sitting.',
      },
      {
        title: 'License to Depart',
        body: 'O Spirit N., because thou hast diligently answered unto my demands and hast been ready to come at my call, I do hereby license thee to depart unto thy proper place, without noise, injury, or harm to man or beast. Depart, then, I say, and be thou ready to come peaceably when thou art called and duly conjured by the sacred rites of magick. Amen.',
      },
      {
        title: 'Close the Art',
        body: 'See the triangle empty and still. Cover or put away the seal. Close the circle, banish (e.g. LBRP), and record the working in the Magical Journal.',
      },
    ],
  },
  {
    id: 'solar-adorations',
    title: 'Solar Adorations (Liber Resh–style)',
    tradition: 'Thelemic',
    tags: ['solar', 'daily', 'adoration', 'liber-resh'],
    tools: ['open sky or window if possible', 'four stations of the day'],
    purpose:
      'Greet the Sun at the four stations of the day — dawn, noon, sunset, and midnight — as a solar rhythm of devotion and will.',
    notes:
      'Liber Resh–style study outline: structure and gesture cues only. Crowley’s full Liber Resh vel Helios text is not reproduced here; use an authorized edition if you work the complete Thelemic form. Times track local solar stations, not clock convenience alone.',
    sources: [
      'Liber Resh vel Helios structure (study outline; full Crowley text not included)',
    ],
    suggestedPlanet: 'Sun',
    steps: [
      {
        title: 'Dawn — East',
        body: 'At sunrise, face East. Give the sign or posture of the station as your tradition teaches. Adore the rising Sun as the renewing light of day; speak a short solar adoration in your own words or from your Resh text. Visualize golden light entering through the brow and heart.',
      },
      {
        title: 'Noon — South',
        body: 'At midday, face South. Adore the Sun in its strength. Affirm clarity, courage, and the height of the day’s will. Stand upright; breathe fully.',
      },
      {
        title: 'Sunset — West',
        body: 'At sunset, face West. Adore the Sun in its going-down. Offer gratitude for the day’s work and release what need not be carried into night.',
      },
      {
        title: 'Midnight — North',
        body: 'At midnight (or the depth of night), face North. Adore the hidden Sun in the underworld / night journey. Rest in silence after the adoration; optionally journal a single line of will for the next dawn.',
      },
    ],
  },
  {
    id: 'tool-consecration',
    title: 'Consecration of Implements',
    tradition: 'General',
    tags: ['consecration', 'tools', 'altar', 'preparation'],
    tools: ['implement to consecrate', 'incense', 'water and salt if used', 'cloth'],
    purpose:
      'Set apart a wand, dagger, cup, pantacle, or other altar tool as an instrument of the Art.',
    notes:
      'Keep petitions specific: what office the tool will serve. May follow LBRP and pair with Ritual Space altar-cross layout. Prefer planetary hours matching the tool’s symbolism when practical.',
    sources: ['General ceremonial consecration practice (study outline)'],
    suggestedPlanet: 'Mercury',
    ritualTemplate: 'altarCross',
    steps: [
      {
        title: 'Purify the space',
        body: 'Banish lightly (e.g. LBRP). Lay the tool on a clean cloth upon the altar. Have water, salt, and incense ready if you use them.',
      },
      {
        title: 'Elemental purification',
        body: 'Asperse with water and salt (Earth/Water), then perfume with incense (Air/Fire), saying that all impurity of prior common use is washed and burned away so far as this Art requires.',
      },
      {
        title: 'Dedication',
        body: 'Hold or touch the tool. Name it and its office aloud: “Be thou consecrated as my N. (wand / cup / etc.), instrument of (will / love / knowledge / keepership), under the Names of the Most High (or your chosen divine Names). Serve only truth in this Art.” Trace a pentagram or cross over it.',
      },
      {
        title: 'Seal and keep',
        body: 'Wrap or place the tool in its proper station. Record the consecration date, hour, and intent in the Magical Journal. Re-consecrate after major repair, transfer, or pollution as your practice dictates.',
      },
    ],
  },
  {
    id: 'alchemy-vessel',
    title: 'Consecration of the Vessel',
    tradition: 'Alchemy',
    tags: ['alchemy', 'consecration', 'vessel', 'athanor', 'oratory'],
    tools: ['clean vessel or working bowl', 'salt', 'water', 'incense', 'cloth'],
    purpose:
      'Set apart a vessel (cup, bowl, or symbolic athanor) as the container of the Great Work in the oratory.',
    notes:
      'Study outline for hermetic oratory practice. Not laboratory chemistry. Prefer a Saturn or Moon hour for binding the vessel, or the planet of your current stage.',
    sources: [
      'Hermetic oratory tradition (study outline; not a laboratory manual)',
    ],
    suggestedPlanet: 'Saturn',
    ritualTemplate: 'altarCross',
    steps: [
      {
        title: 'Purify the place',
        body: 'Banish lightly. Place the empty vessel on a clean cloth. Have salt, water, and incense ready.',
      },
      {
        title: 'Wash with Salt and Water',
        body: 'Asperse the vessel: “Be thou washed of common use. Salt of the earth, fix the form; Water, receive the work.” Trace a circle around the rim.',
      },
      {
        title: 'Perfume with Sulfur’s fire',
        body: 'Pass the vessel through incense smoke: “Be thou aired by the volatile spirit. Fire try what this vessel shall hold.”',
      },
      {
        title: 'Name the office',
        body: 'Touch the vessel and name its office aloud — athanor of intention, cup of solution, or womb of the stone — under the Names you use. Seal with a cross or hexagram over the mouth.',
      },
      {
        title: 'Close and record',
        body: 'Cover or store the vessel. Log stage, metal of the day, and intent in the Magical Journal.',
      },
    ],
  },
  {
    id: 'alchemy-tria-prima',
    title: 'Oratory of the Tria Prima',
    tradition: 'Alchemy',
    tags: ['alchemy', 'salt', 'sulfur', 'mercury', 'oratory', 'principles'],
    tools: [
      'salt (or stone)',
      'incense or candle (sulfur)',
      'cup of water or quicksilver symbol (mercury)',
      'altar space',
    ],
    purpose:
      'Invoke Salt, Sulfur, and Mercury as body, soul, and spirit of the work before a stage of the opus.',
    notes:
      'Symbolic oratory only. Arrange the three tokens in a triangle; speak each principle’s office, then their reunion.',
    sources: ['Paracelsian Tria Prima framing (study outline)'],
    suggestedPlanet: 'Mercury',
    steps: [
      {
        title: 'Open the triangle',
        body: 'Place Salt at the base (body), Sulfur at the right (soul), Mercury at the left (spirit). Stand at the apex facing your altar.',
      },
      {
        title: 'Salt — body',
        body: 'Touch the salt: “Salt, fixity and form, hold the ash of what endures. Be the body of this work.”',
      },
      {
        title: 'Sulfur — soul',
        body: 'Touch the flame or incense: “Sulfur, desire and character, burn cleanly. Be the soul of this work.”',
      },
      {
        title: 'Mercury — spirit',
        body: 'Touch the cup: “Mercury, living binder, mediate fixed and volatile. Be the spirit of this work.”',
      },
      {
        title: 'Reunion',
        body: 'Bring the three tokens together at center: “One Thing by adaptation — body, soul, and spirit united for the stage I now enter.” Close with silence, then record.',
      },
    ],
  },
  {
    id: 'alchemy-solve-coagula',
    title: 'Solve et Coagula Working',
    tradition: 'Alchemy',
    tags: ['alchemy', 'solve', 'coagula', 'spagyria', 'working'],
    tools: ['journal', 'vessel', 'two candles or markers (solve / coagula)'],
    purpose:
      'Frame a personal or magical working as separation, purification, and recombination — the spagyric rhythm without laboratory procedure.',
    notes:
      'Use for dream work, shadow integration, or materia metaphor (herb, metal, habit). Pair with elections matching the stage (dissolve under Moon; coagulate under Sun).',
    sources: ['Hermetic axiom solve et coagula (study outline)'],
    suggestedPlanet: 'Moon',
    steps: [
      {
        title: 'Name the crude matter',
        body: 'Write in one sentence what must be separated: a habit, grief, intention, or symbolic materia. Place the note in or before the vessel.',
      },
      {
        title: 'Solve — separate',
        body: 'Speak what you release from what you keep. Visualize or list the parts. Light the Solve marker. Sit until the separation feels clear, not frantic.',
      },
      {
        title: 'Purify',
        body: 'Wash the useful from the dross in word or water: discard what does not serve the One Thing of this working. Brief banishing if needed.',
      },
      {
        title: 'Coagula — reunite',
        body: 'Light the Coagula marker. Name the reunited form — new vow, clarified intent, or symbolic stone. Seal with a single breath into the vessel.',
      },
      {
        title: 'Fix and log',
        body: 'Extinguish Solve first, then Coagula. Journal stage (often Albedo→Rubedo), entities, and sky tags.',
      },
    ],
  },
  {
    id: 'alchemy-metal-day',
    title: 'Dedication of the Metal of the Day',
    tradition: 'Alchemy',
    tags: ['alchemy', 'metal', 'planetary', 'dedication', 'daily'],
    tools: ['metal token or color cloth of the day', 'incense', 'journal'],
    purpose:
      'Dedicate the classical metal of the planetary day as a focus for talismanic or opus work.',
    notes:
      'Sun–Gold, Moon–Silver, Mars–Iron, Mercury–Quicksilver, Jupiter–Tin, Venus–Copper, Saturn–Lead. Token may be literal metal, foil, or colored cloth.',
    sources: ['Agrippa planetary metals (study outline)'],
    suggestedPlanet: 'Sun',
    ritualTemplate: 'altarCross',
    steps: [
      {
        title: 'Name day and metal',
        body: 'At the day’s first convenient hour (or the planetary hour of the day ruler), place the metal token on the altar. Speak: “Day of N., metal of N. — I set thee as the body of today’s work.”',
      },
      {
        title: 'Perfume and charge',
        body: 'Incense the token. State a single virtue or operation (e.g. calcine, wash, coagulate) matching your opus stage.',
      },
      {
        title: 'Bind to the hour',
        body: 'If working a planetary hour, hold the token through that hour’s opening breath. Otherwise, keep it on the altar until sunset.',
      },
      {
        title: 'Close',
        body: 'Thank the day ruler. Store or wear the token. Log metal, stage, and counsel in the Magical Journal; optionally open Talismans in Atelier for the matching kamea.',
      },
    ],
  },
  {
    id: 'chakra-circulation',
    title: 'Seven-Center Breath & Light',
    tradition: 'Yoga',
    tags: ['chakra', 'energy', 'daily', 'pranayama'],
    relatedChakras: [
      'muladhara',
      'svadhisthana',
      'manipura',
      'anahata',
      'vishuddha',
      'ajna',
      'sahasrara',
    ],
    tools: ['quiet space', 'upright seat or standing posture', 'breath'],
    purpose:
      'Awaken and equilibrate the seven traditional centers through breath, visualization, and silent bija vibration.',
    notes:
      'Study outline of classical tantric and modern yoga-tantra chakra work. Confirm pronunciation of Sanskrit bija with your teacher; do not force breath retention or strain.',
    sources: [
      'Traditional tantric and hatha yoga chakra outlines (study summary; not a full lineage transmission)',
    ],
    suggestedPlanet: 'Sun',
    steps: [
      {
        title: 'Prepare',
        body: 'Sit or stand with a straight spine. Soften the jaw and shoulders. Breathe naturally until the mind steadies. Optionally set a brief intention for balance rather than force.',
      },
      {
        title: 'Muladhara — root',
        body: 'Bring attention to the base of the spine / perineum. On the inhale, sense a deep red warmth; on the exhale, silently intone LAM (as taught). Feel stability without heaviness.',
      },
      {
        title: 'Svadhisthana — sacral',
        body: 'Raise attention to the lower abdomen. Visualize orange light; exhale with VAM. Sense fluid creativity and calm vitality.',
      },
      {
        title: 'Manipura — solar plexus',
        body: 'At the navel center, golden light gathers; exhale with RAM. Feel warmth and will aligned with breath, not agitation.',
      },
      {
        title: 'Anahata — heart',
        body: 'At the heart center, green or rose light; exhale with YAM. Open the chest gently; balance giving and receiving.',
      },
      {
        title: 'Vishuddha — throat',
        body: 'At the throat, sky-blue light; exhale with HAM. Sense clear expression and inner listening.',
      },
      {
        title: 'Ajna — brow',
        body: 'Between the eyebrows, indigo light; exhale with OM or AUM as taught. Rest in single-pointed awareness without strain.',
      },
      {
        title: 'Sahasrara — crown',
        body: 'At or just above the crown, violet-white radiance; silence or subtle vibration. Feel spaciousness rather than pressure.',
      },
      {
        title: 'Circulation',
        body: 'On the breath, circulate light from root to crown and back, or fountain upward through the central channel until the field feels even. Close with hands at the heart and a silent Namaste or Amen.',
      },
    ],
  },
  {
    id: 'nadi-shodhana',
    title: 'Alternate Nostril Breathing',
    tradition: 'Yoga',
    tags: ['pranayama', 'balance', 'daily'],
    relatedChakras: ['ajna', 'anahata'],
    relatedMeridians: ['lung', 'triple-burner'],
    tools: ['upright seat', 'right hand for nostril closure (Vishnu mudra as taught)'],
    purpose:
      'Equilibrate the lunar and solar breath currents (ida and pingala) through alternating nostril pranayama.',
    notes:
      'Do not practice with acute congestion, high blood pressure, or pregnancy unless cleared by a qualified teacher. Keep the breath smooth; avoid forced retention early on.',
    sources: ['Classical hatha pranayama tradition (study outline)'],
    suggestedPlanet: 'Mercury',
    steps: [
      {
        title: 'Prepare',
        body: 'Sit comfortably with spine erect. Form Vishnu mudra with the right hand (or use thumb and ring finger as taught). Exhale fully once through both nostrils.',
      },
      {
        title: 'Close right — inhale left',
        body: 'Close the right nostril with the thumb. Inhale slowly and silently through the left nostril to a comfortable fullness.',
      },
      {
        title: 'Close both — optional retention',
        body: 'Close both nostrils briefly only if retention is part of your training; otherwise proceed immediately. Never strain.',
      },
      {
        title: 'Exhale right',
        body: 'Release the right nostril; exhale smoothly through the right.',
      },
      {
        title: 'Inhale right',
        body: 'Inhale through the right nostril with the left still closed.',
      },
      {
        title: 'Exhale left',
        body: 'Close the right nostril; exhale through the left. This completes one round.',
      },
      {
        title: 'Rounds',
        body: 'Continue for 5–9 rounds or as prescribed by your teacher. End on an exhale through the left if finishing with a lunar emphasis, or as tradition directs.',
      },
      {
        title: 'Close',
        body: 'Release the hand. Breathe naturally. Observe mental clarity and bodily ease before rising.',
      },
    ],
  },
  {
    id: 'ba-duan-jin',
    title: 'Eight Brocades (study outline)',
    tradition: 'Taoist',
    tags: ['qigong', 'movement', 'daily'],
    relatedMeridians: ['triple-burner', 'kidney', 'liver', 'stomach'],
    tools: ['standing room', 'loose clothing', 'natural breath'],
    purpose:
      'Gentle standing qigong sequence to mobilize qi through eight traditional movements of sinew and breath.',
    notes:
      'Study outline only. Learn full form, pacing, and contraindications from a qualified qigong instructor; versions differ by lineage.',
    sources: ['Traditional Baduanjin / Eight Brocades (public-domain movement names; study summary)'],
    suggestedPlanet: 'Sun',
    steps: [
      {
        title: 'Prepare',
        body: 'Stand with feet shoulder-width, knees soft, tongue on palate if taught. Breathe into the lower abdomen. Sink weight into the feet.',
      },
      {
        title: 'Two Hands Hold Up the Heavens',
        body: 'Interlace or press palms upward above the crown, stretching gently through the sides. Rise on breath; lower on exhale. Mobilize the triple warmer as taught.',
        durationSec: 90,
      },
      {
        title: 'Drawing the Bow',
        body: 'Horse stance or stable bow stance. One hand draws the bow, the other extends; gaze along the arrow. Alternate left and right with even breath.',
        durationSec: 90,
      },
      {
        title: 'Separate Heaven and Earth',
        body: 'One palm presses upward, one downward at the sides of the torso. Stretch the flanks; exchange hands with the breath.',
        durationSec: 90,
      },
      {
        title: 'Wise Owl Gazes Back',
        body: 'Turn the head and gaze over the shoulder; keep hips forward. Loosen the neck and spine. Alternate sides slowly.',
        durationSec: 60,
      },
      {
        title: 'Sway the Head and Shake the Tail',
        body: 'Soft lateral sway or rotation of the torso as taught in your lineage. Keep the crown suspended; do not force the lower back.',
        durationSec: 60,
      },
      {
        title: 'Two Hands Hold the Feet',
        body: 'Forward bend with soft knees if needed; reach toward the feet to stretch the kidneys and hamstrings. Rise slowly on exhale.',
        durationSec: 90,
      },
      {
        title: 'Clench the Fists and Glare Fiercely',
        body: 'Horse stance; punch or extend with coordinated breath and focused gaze. Release tension on exhale.',
        durationSec: 90,
      },
      {
        title: 'Bouncing on the Toes',
        body: 'Rise onto the toes and let the heels drop lightly (Seven Disorders of the hundred meridians). Settle three breaths standing still.',
        durationSec: 60,
      },
      {
        title: 'Close',
        body: 'Place hands on the lower dantian. Store qi with natural breath. Bow or nod to close the session.',
      },
    ],
  },
  {
    id: 'zhan-zhuang',
    title: 'Standing Meditation',
    tradition: 'Taoist',
    tags: ['qigong', 'stillness', 'daily'],
    relatedMeridians: ['kidney', 'bladder'],
    tools: ['standing space', 'timer optional', 'loose clothing'],
    purpose:
      'Build root, song (relaxation), and internal stillness through standing postures (Zhan Zhuang).',
    notes:
      'Start with short holds; knee alignment and teacher correction prevent strain. This outline uses a basic embracing-the-tree posture.',
    sources: ['Zhan Zhuang standing meditation tradition (study outline)'],
    suggestedPlanet: 'Saturn',
    steps: [
      {
        title: 'Prepare',
        body: 'Stand with feet parallel, shoulder-width or slightly wider. Soften the chest; suspend the crown. Breathe into the lower belly.',
      },
      {
        title: 'Embrace the Tree',
        body: 'Raise arms as if hugging a large tree; elbows dropped, shoulders relaxed, fingers slightly apart. Eyes soft, gaze forward or slightly down.',
      },
      {
        title: 'Song — release tension',
        body: 'Scan from crown to soles; melt unnecessary tension while maintaining structure. Weight sinks; crown lifts. Knees never pass the toes.',
      },
      {
        title: 'Hold',
        body: 'Maintain the posture with natural breath for the duration taught (beginners: 3–5 minutes). If shaking arises, breathe through it without collapsing structure unless instructed.',
        durationSec: 180,
      },
      {
        title: 'Dissolve',
        body: 'Slowly lower the arms. Shift weight side to side if taught. Feel blood and qi redistribute.',
      },
      {
        title: 'Close',
        body: 'Hands on lower dantian. Three calm breaths. Walk briefly to ground the legs.',
      },
    ],
  },
  {
    id: 'microcosmic-orbit',
    title: 'Microcosmic Orbit (intro)',
    tradition: 'Taoist',
    tags: ['qigong', 'energy', 'neidan'],
    relatedMeridians: ['ren', 'du'],
    tools: ['seated or standing posture', 'tongue on palate if taught', 'breath'],
    purpose:
      'Circulate refined qi along the Ren and Du extraordinary vessels in the small heavenly cycle.',
    notes:
      'Introductory study outline only. Full neidan transmission requires a qualified teacher; do not force the breath or reverse flow without instruction.',
    sources: ['Taoist neidan / microcosmic orbit tradition (study outline)'],
    suggestedPlanet: 'Moon',
    steps: [
      {
        title: 'Prepare',
        body: 'Sit or stand with straight spine. Touch tongue to palate if part of your practice. Breathe into the lower dantian until the belly is calm.',
      },
      {
        title: 'Gather at dantian',
        body: 'Sense warmth and light at the lower abdomen (qihai / dantian). On exhale, condense attention there without muscular forcing.',
      },
      {
        title: 'Du mai — ascent',
        body: 'On inhale or subtle breath, lead attention from perineum (huiyin) up the spine, through the occiput, to the crown (baihui). Move slowly; skip any painful segment.',
      },
      {
        title: 'Ren mai — descent',
        body: 'From the palate or crown, descend along the midline of the face, throat, chest, and abdomen back to the dantian. Exhale smoothly.',
      },
      {
        title: 'Cycles',
        body: 'Repeat the orbit for 9 or 36 cycles as taught, or until stability. Keep the movement gentle and continuous.',
      },
      {
        title: 'Close',
        body: 'Seal qi at the lower dantian with hands overlaid. Rest in stillness before opening the eyes fully.',
      },
    ],
  },
  {
    id: 'inner-smile',
    title: 'Inner Smile (intro)',
    tradition: 'Taoist',
    tags: ['meditation', 'taoist', 'daily'],
    relatedMeridians: ['heart', 'lung', 'liver', 'kidney', 'spleen'],
    relatedChakras: ['anahata'],
    tools: ['comfortable seat', 'breath', 'gentle attention'],
    purpose:
      'Transform tension into vitality by smiling inward to organs and centers, harmonizing the emotional body.',
    notes:
      'Based on Mantak Chia–style introductory practice widely taught in qigong communities; confirm organ sequence with your lineage.',
    sources: ['Taoist Inner Smile meditation (study outline)'],
    suggestedPlanet: 'Venus',
    steps: [
      {
        title: 'Prepare',
        body: 'Smile gently with the eyes and mouth. Feel the corners of the lips lift without strain. Breathe into the lower belly.',
      },
      {
        title: 'Smile to the heart',
        body: 'Direct the inner smile to the heart center. Sense warmth, joy, or forgiveness spreading through the chest. Exhale any heaviness softly.',
        durationSec: 90,
      },
      {
        title: 'Smile to the organs',
        body: 'In sequence as taught—often lungs, liver, spleen/pancreas, kidneys—rest the smile on each organ. Use color associations from your tradition if helpful.',
        durationSec: 120,
      },
      {
        title: 'Smile to the brain',
        body: 'Smile to the pituitary and pineal or whole brain; cool clarity at the brow. Release forehead tension.',
        durationSec: 90,
      },
      {
        title: 'Collect at dantian',
        body: 'Gather the golden or warm feeling into the lower dantian. Hands may rest there. Rest in silence.',
        durationSec: 60,
      },
      {
        title: 'Close',
        body: 'Open the eyes when ready. Move slowly. Note mood in the Magical Journal if desired.',
      },
    ],
  },
  {
    id: 'anapanasati',
    title: 'Mindfulness of Breath (intro)',
    tradition: 'Buddhist',
    tags: ['meditation', 'buddhist', 'daily', 'breath'],
    relatedChakras: ['anahata', 'ajna'],
    tools: ['quiet seat', 'upright posture', 'natural breath'],
    purpose:
      'Develop calm and insight through sustained attention to the in-and-out breath (ānāpānasati).',
    notes:
      'Study outline of classical satipatthana breath meditation. Confirm longer sits and retreat protocol with a qualified teacher.',
    sources: ['Pāli Canon ānāpānasati tradition (study outline)'],
    suggestedPlanet: 'Moon',
    steps: [
      {
        title: 'Prepare',
        body: 'Sit with stable base and straight but relaxed spine. Soften the gaze or close the eyes. Take three settling breaths.',
      },
      {
        title: 'Know the long breath',
        body: 'When the breath is long, know it is long. When short, know it is short. Do not control; simply notice length and texture.',
        durationSec: 180,
      },
      {
        title: 'Whole body',
        body: 'Feel the whole body breathing — expansion and release. If tension appears, breathe with it without fixing.',
        durationSec: 180,
      },
      {
        title: 'Calming formations',
        body: 'Allow the breath to calm mental formations. When the mind wanders, return gently to the nostrils or belly without judgment.',
        durationSec: 180,
      },
      {
        title: 'Close',
        body: 'Rest in natural breath for a minute. Bow or nod. Note clarity and mood in the Magical Journal if desired.',
      },
    ],
  },
  {
    id: 'metta-bhavana',
    title: 'Loving-Kindness (intro)',
    tradition: 'Buddhist',
    tags: ['meditation', 'buddhist', 'daily', 'metta'],
    relatedChakras: ['anahata'],
    tools: ['comfortable seat', 'phrase or image as taught'],
    purpose:
      'Cultivate benevolence toward self and others through traditional mettā phrases and felt warmth.',
    notes:
      'Classic four-person sequence (self, benefactor, neutral person, difficult person). Adapt phrases to your lineage; do not force emotion.',
    sources: ['Buddhist mettā bhāvanā tradition (study outline)'],
    suggestedPlanet: 'Venus',
    steps: [
      {
        title: 'Prepare',
        body: 'Sit calmly. Place attention at the heart or center of the chest. Breathe softly.',
      },
      {
        title: 'Self',
        body: 'Offer phrases such as: May I be safe. May I be well. May I be peaceful. May I live with ease. Feel warmth if it arises; if not, repeat with patience.',
        durationSec: 120,
      },
      {
        title: 'Benefactor',
        body: 'Bring to mind someone who has helped you. Extend the same phrases to them. Sense goodwill radiating outward.',
        durationSec: 120,
      },
      {
        title: 'Neutral person',
        body: 'Choose someone you neither like nor dislike. Extend the phrases evenly, without preference.',
        durationSec: 120,
      },
      {
        title: 'Difficult person',
        body: 'If ready in your practice, include someone challenging — with care and teacher guidance. Shorten if agitation rises.',
        durationSec: 90,
      },
      {
        title: 'All beings',
        body: 'Expand mettā to all beings in all directions. Rest in silence.',
      },
      {
        title: 'Close',
        body: 'Release the phrases. Open the eyes slowly. Carry the tone into the day.',
      },
    ],
  },
  {
    id: 'kapalabhati-intro',
    title: 'Skull-Shining Breath (intro)',
    tradition: 'Yoga',
    tags: ['pranayama', 'energy', 'kapalabhati'],
    relatedChakras: ['manipura', 'ajna'],
    relatedMeridians: ['triple-burner', 'lung'],
    tools: ['upright seat', 'empty stomach preferred'],
    purpose:
      'Invigorate prana through rapid passive inhale and active exhale (kapālabhāti) — introductory rounds only.',
    notes:
      'Contraindicated in pregnancy, high blood pressure, hernia, recent abdominal surgery, or acute illness. Learn full technique from a qualified hatha teacher.',
    sources: ['Classical hatha kapalabhati tradition (introductory study outline)'],
    suggestedPlanet: 'Sun',
    steps: [
      {
        title: 'Prepare',
        body: 'Sit with spine erect on an empty or light stomach. Establish natural breath. Place one hand on the belly if helpful.',
      },
      {
        title: 'Passive inhale — active exhale',
        body: 'Snap the belly inward on exhale; allow passive inhale as the belly releases. Keep the face and shoulders soft. Begin with very short rounds.',
      },
      {
        title: 'Round 1',
        body: 'Perform 15–27 pumps as taught, then return to natural breath. Observe heat and clarity without strain.',
        durationSec: 45,
      },
      {
        title: 'Rest',
        body: 'Breathe normally until the heart rate steadies. Never continue if dizzy or pained.',
        durationSec: 60,
      },
      {
        title: 'Round 2 (optional)',
        body: 'If stable, one more short round only. Advanced practitioners use more rounds under supervision.',
        durationSec: 45,
      },
      {
        title: 'Close',
        body: 'Sit in silence. Follow with gentle nadi shodhana if your teacher recommends balancing.',
      },
    ],
  },
  {
    id: 'wu-qin-xi',
    title: 'Five Animal Frolics (outline)',
    tradition: 'Taoist',
    tags: ['qigong', 'movement', 'daily'],
    relatedMeridians: ['liver', 'kidney', 'heart', 'lung', 'spleen'],
    tools: ['standing room', 'loose clothing'],
    purpose:
      'Imitate the tiger, deer, bear, monkey, and bird to harmonize the five zang organs in traditional qigong.',
    notes:
      'Movement names and sequences vary by lineage (Hua Tuo tradition). Study outline only — learn full form from an instructor.',
    sources: ['Wu Qin Xi / Five Animal Frolics (public-domain movement names; study summary)'],
    suggestedPlanet: 'Jupiter',
    steps: [
      {
        title: 'Prepare',
        body: 'Stand naturally, breath into the lower belly. Soften the joints.',
      },
      {
        title: 'Tiger',
        body: 'Tiger pounces or stretches — claws forward, spine alive, gaze fierce but relaxed. Associated with liver/gall bladder in traditional maps.',
        durationSec: 90,
      },
      {
        title: 'Deer',
        body: 'Deer looks back or antler stretch — lengthen the spine and legs. Kidney/water themes in study maps.',
        durationSec: 90,
      },
      {
        title: 'Bear',
        body: 'Bear sways or digs — heavy stable root, turning at the waist. Spleen/earth themes.',
        durationSec: 90,
      },
      {
        title: 'Monkey',
        body: 'Monkey picks fruit — agile hands and light feet. Heart/small intestine themes.',
        durationSec: 90,
      },
      {
        title: 'Bird',
        body: 'Bird spreads wings — open chest, balance on one leg if stable. Lung/large intestine themes.',
        durationSec: 90,
      },
      {
        title: 'Close',
        body: 'Hands on lower dantian. Store qi. Bow to close.',
      },
    ],
  },
  {
    id: 'six-healing-sounds',
    title: 'Liu Zi Jue (study outline)',
    tradition: 'Taoist',
    tags: ['qigong', 'breath', 'sound', 'daily'],
    relatedMeridians: ['lung', 'heart', 'liver', 'spleen', 'kidney', 'triple-burner'],
    tools: ['standing or seated posture', 'sub-vocal or audible exhale'],
    purpose:
      'Release stagnant qi from the zang organs through six traditional healing sounds on the exhale.',
    notes:
      'Xu (spleen), He (heart), Hu (stomach/spleen variants), Si (lung), Chui (kidney), Xi (triple burner) — spellings vary. Confirm with your qigong source.',
    sources: ['Liu Zi Jue / Six Healing Sounds tradition (study outline)'],
    suggestedPlanet: 'Mercury',
    steps: [
      {
        title: 'Prepare',
        body: 'Stand or sit with tongue on palate if taught. Breathe into the lower dantian.',
      },
      {
        title: 'Xu — spleen / earth',
        body: 'Inhale; on exhale sub-vocalize XU, lips rounded, releasing worry from the middle burner as taught.',
        durationSec: 45,
      },
      {
        title: 'He — heart / fire',
        body: 'Inhale; exhale HE with mouth open, dispersing heat or agitation from the chest.',
        durationSec: 45,
      },
      {
        title: 'Hu — stomach / earth',
        body: 'Inhale; exhale HU, softening digestive tension.',
        durationSec: 45,
      },
      {
        title: 'Si — lung / metal',
        body: 'Inhale; exhale SI (ssss), releasing grief or constriction from the upper body.',
        durationSec: 45,
      },
      {
        title: 'Chui — kidney / water',
        body: 'Inhale; exhale CHUI (chway), lips pursed, settling fear or cold in the lower back.',
        durationSec: 45,
      },
      {
        title: 'Xi — triple burner',
        body: 'Inhale; exhale XI (shee), harmonizing upper, middle, and lower burners.',
        durationSec: 45,
      },
      {
        title: 'Close',
        body: 'Three natural breaths. Hands on dantian. Rest in silence.',
      },
    ],
  },
  {
    id: 'middle-pillar-east',
    title: 'Middle Pillar ↔ Chakra comparative run',
    tradition: 'General',
    tags: ['energy', 'qabalah', 'chakra', 'bridge', 'daily'],
    relatedChakras: [
      'muladhara',
      'svadhisthana',
      'manipura',
      'anahata',
      'vishuddha',
      'ajna',
      'sahasrara',
    ],
    tools: ['upright seat or standing', 'breath', 'visualization'],
    purpose:
      'Run the Golden Dawn Middle Pillar centers alongside comparative chakra awareness — a cross-tradition study session, not identity claim.',
    notes:
      'Explicit bridge rite for practitioners working both Western and Eastern subtle-body maps. Vibrate Hebrew god-names only as your lineage teaches; bija silently or as instructed.',
    sources: [
      'Golden Dawn Middle Pillar + comparative qabalah–tantra charts (study outline)',
    ],
    suggestedPlanet: 'Sun',
    ritualTemplate: 'blank',
    steps: [
      {
        title: 'Prepare',
        body: 'Stand or sit with spine erect. Breathe until the field steadies. Set intention for balanced study across traditions.',
      },
      {
        title: 'Malkuth / Muladhara',
        body: 'At the feet and base, sphere of Earth — deep red root center. Inhale light; exhale stability. AH-TAH or LAM as taught.',
      },
      {
        title: 'Yesod / Svadhisthana',
        body: 'At the genitals / lower abdomen — lunar violet or orange sacral light. VAM or YHVH ELOHIM as your practice directs.',
      },
      {
        title: 'Netzach / Manipura & Hod',
        body: 'At hips and solar plexus — green and orange-gold currents. Balance desire and intellect; RAM at the navel if using bija.',
      },
      {
        title: 'Tiphareth / Anahata',
        body: 'At the heart — golden rose radiance. YAM or YHVH ELOAH VA-DAATH. Open compassion without sentimentality.',
      },
      {
        title: 'Geburah–Chesed / Vishuddha',
        body: 'At the throat — sky-blue expression. HAM or names of severity and mercy as taught in your GD lineage.',
      },
      {
        title: 'Binah–Chokmah / Ajna',
        body: 'At the brow — indigo single point. OM or AUM; sense depth and wisdom, not pressure.',
      },
      {
        title: 'Kether / Sahasrara',
        body: 'Above the crown — violet-white brilliance. Silence or subtle vibration. Spaciousness.',
      },
      {
        title: 'Circulation',
        body: 'Fountain light up the central column and rain down the periphery, or circulate root to crown and back. Comparative map only — traditions disagree on exact correspondences.',
      },
      {
        title: 'Close',
        body: 'Hands at heart. Thank both lineages in silence. Log sensations and any entity tags in the Magical Journal.',
      },
    ],
  },
  {
    id: 'shamanic-quarters',
    title: 'Opening the quarters (study outline)',
    tradition: 'Shamanic',
    tags: ['quarters', 'directions', 'opening', 'daily'],
    relatedWorlds: ['middle'],
    tools: ['space to turn', 'rattle or drum optional'],
    purpose:
      'Greet the four quarters as a generic circular opening — elemental study default, not a closed medicine-wheel teaching.',
    notes:
      'Use your own names for the directions. This outline is a structural prompt, not a song or ceremony from a living people.',
    sources: ['Comparative four-quarter opening (study outline)'],
    suggestedPlanet: 'Moon',
    ritualTemplate: 'lbrp',
    steps: [
      {
        title: 'Center',
        body: 'Stand at the hearth of the space. Name your intention. Feel the axis through crown and sole.',
      },
      {
        title: 'East',
        body: 'Face East. Greet breath, dawn, and beginnings in your own words. Pause.',
        durationSec: 30,
      },
      {
        title: 'South',
        body: 'Face South. Greet warmth, growth, and vitality. Pause.',
        durationSec: 30,
      },
      {
        title: 'West',
        body: 'Face West. Greet dusk, waters, and release. Pause.',
        durationSec: 30,
      },
      {
        title: 'North',
        body: 'Face North. Greet earth, ancestors as a category, and endurance. Pause.',
        durationSec: 30,
      },
      {
        title: 'Close the circle',
        body: 'Return East. Thank the quarters. Remain in the center until the space feels ordinary again.',
      },
    ],
  },
  {
    id: 'shamanic-journey-protocol',
    title: 'Three-worlds journey protocol',
    tradition: 'Shamanic',
    tags: ['journey', 'drum', 'axis', 'study'],
    relatedWorlds: ['lower', 'middle', 'upper'],
    tools: ['drum or rattle', 'eye covering optional', 'journal'],
    purpose:
      'A generic departure–travel–return structure for drum journeying. Prefer the Shamanism module Journey pane for timed drum and journal persist.',
    notes:
      'Not soul-retrieval training. Stop if overwhelmed; ground with food, water, and the room.',
    sources: ['Comparative journey protocol (study outline)'],
    suggestedPlanet: 'Moon',
    ritualTemplate: 'blank',
    steps: [
      {
        title: 'Intention',
        body: 'Write one sentence. Choose Lower, Middle, or Upper World as a study map, not a destination claim.',
      },
      {
        title: 'Opening',
        body: 'Call any personal allies by name. Start the drum. Settle the breath.',
        durationSec: 60,
      },
      {
        title: 'Departure and travel',
        body: 'Find the axis. Travel without forcing a story. Encounter, ask, receive.',
        durationSec: 600,
      },
      {
        title: 'Return and ground',
        body: 'Retrace the path. Stop the drum. Feel the body. Write what you will keep. Eat or drink.',
      },
    ],
  },
  {
    id: 'shamanic-grounding',
    title: 'Grounding and return',
    tradition: 'Shamanic',
    tags: ['grounding', 'closing', 'daily'],
    relatedWorlds: ['middle'],
    tools: ['water or food', 'bare feet if practical'],
    purpose:
      'Close extra-ordinary work and re-enter the ordinary day — the missing half of many journey outlines.',
    notes: 'Use after any journey, lots, or quarter opening.',
    sources: ['Comparative grounding / return outline'],
    suggestedPlanet: 'Saturn',
    ritualTemplate: 'blank',
    steps: [
      {
        title: 'Body',
        body: 'Name five things you can see, four you can touch, three you can hear. Feel weight in the feet.',
        durationSec: 60,
      },
      {
        title: 'Nourish',
        body: 'Drink water or eat something simple. Thank the room.',
      },
      {
        title: 'Log',
        body: 'Write a few lines. Tag world / ally / direction if useful. Leave the rest.',
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
      r.purpose ?? '',
      r.notes ?? '',
      ...(r.sources ?? []),
      ...r.tags,
      ...r.tools,
      ...(r.relatedWorlds ?? []),
      ...(r.relatedAllies ?? []),
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

/** Tradition order for grouped Ritual Library lists. */
export const LITURGY_TRADITION_ORDER = [
  'Golden Dawn',
  'Heptameron',
  'Goetia',
  'Thelemic',
  'Alchemy',
  'Yoga',
  'Taoist',
  'Buddhist',
  'Shamanic',
  'General',
] as const;

export function groupRitesByTradition(
  rites: LiturgyRite[]
): { tradition: string; rites: LiturgyRite[] }[] {
  const map = new Map<string, LiturgyRite[]>();
  for (const rite of rites) {
    const list = map.get(rite.tradition) ?? [];
    list.push(rite);
    map.set(rite.tradition, list);
  }
  const ordered: { tradition: string; rites: LiturgyRite[] }[] = [];
  for (const tradition of LITURGY_TRADITION_ORDER) {
    const group = map.get(tradition);
    if (group?.length) ordered.push({ tradition, rites: group });
  }
  for (const [tradition, group] of map) {
    if (!(LITURGY_TRADITION_ORDER as readonly string[]).includes(tradition)) {
      ordered.push({ tradition, rites: group });
    }
  }
  return ordered;
}
