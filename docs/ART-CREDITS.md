# Art credits

Third-party plates bundled in Ananael. The product itself remains private / unlicensed ([README](../README.md)); this file covers the images we did not generate.

## Goetia seals (Phase 41)

Live assets: `client/public/assets/Images/Goetia/{sealRef}.png` (gold-on-transparent).  
Originals: `client/public/assets/Images/Goetia/mathers-1904/`.  
Generated SVG fallback (Phase 21): `{sealRef}.svg` from `client/scripts/generate-goetia-seals.ts`.

**Source:** Wikimedia Commons [Category:Ars Goetia sigils](https://commons.wikimedia.org/wiki/Category:Ars_Goetia_sigils).  
**Book:** *The Book of the Goetia of Solomon the King*, trans. S.L. MacGregor Mathers, ed. Aleister Crowley (1904). US public domain (published before 1931).

Coverage: **72 / 72** spirits have a processed plate. Map: [`client/src/data/goetiaSealPlates.ts`](../client/src/data/goetiaSealPlates.ts). Report: [`client/scripts/goetia-plates-coverage.json`](../client/scripts/goetia-plates-coverage.json). Re-ingest: `python3 client/scripts/ingest-goetia-plates.py`.

| Kind | Count | Policy |
|------|-------|--------|
| Numbered `NN-Name seal.png` | 63 | Preferred series |
| Dual variants | 7 | `seal01` (Paimon, Beleth, Bathin, Bune, Vepar, Vual, Seere) |
| Alternates | 2 | **29 Astaroth** — [Astaroth Seal.svg](https://commons.wikimedia.org/wiki/File:Astaroth_Seal.svg) (PD release). **69 Decarabia** — [Decarabia seal.png](https://commons.wikimedia.org/wiki/File:Decarabia_seal.png) (1916 de Laurence reprint of the Goetia; PD). |

Processed plates are inverted and tinted toward `#e8c547` for the dark UI. Commons filenames sometimes differ from Ananael `sealRef` slugs (Leraie/Leraje, Halphus/Halphas, Orias/Oriax, Cimeies/Cimejes).

## Tarot (Phase 1)

Rider–Waite–Smith scans under `client/public/assets/Images/Tarot/Rider-Waite-20-30/`. Public-domain deck (published 1909).
