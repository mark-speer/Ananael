import {
  GEOMANTIC_FIGURES_BY_ID,
  figureIdFromRows,
  type FigureId,
  type GeomanticRows,
} from '../data/geomancy';

export type FigureTuple = [FigureId, FigureId, FigureId, FigureId];
export type HouseFigures = [
  FigureId, FigureId, FigureId, FigureId, FigureId, FigureId,
  FigureId, FigureId, FigureId, FigureId, FigureId, FigureId,
];

export interface GeomanticChart {
  mothers: FigureTuple;
  daughters: FigureTuple;
  nephews: FigureTuple;
  witnesses: [FigureId, FigureId];
  judge: FigureId;
  reconciler: FigureId;
  houseFigures: HouseFigures;
}

function randomRows(): GeomanticRows {
  return [
    Math.random() < 0.5,
    Math.random() < 0.5,
    Math.random() < 0.5,
    Math.random() < 0.5,
  ];
}

export function randomMothers(): FigureTuple {
  return [
    figureIdFromRows(randomRows()),
    figureIdFromRows(randomRows()),
    figureIdFromRows(randomRows()),
    figureIdFromRows(randomRows()),
  ];
}

function addFigures(left: FigureId, right: FigureId): FigureId {
  const a = GEOMANTIC_FIGURES_BY_ID[left].rows;
  const b = GEOMANTIC_FIGURES_BY_ID[right].rows;
  return figureIdFromRows([
    a[0] !== b[0],
    a[1] !== b[1],
    a[2] !== b[2],
    a[3] !== b[3],
  ]);
}

export function deriveChart(mothers: FigureTuple): GeomanticChart {
  const rows = mothers.map((id) => GEOMANTIC_FIGURES_BY_ID[id].rows);
  const daughters = ([0, 1, 2, 3] as const).map((row) =>
    figureIdFromRows([
      rows[0][row],
      rows[1][row],
      rows[2][row],
      rows[3][row],
    ])
  ) as FigureTuple;
  const nephews: FigureTuple = [
    addFigures(mothers[0], mothers[1]),
    addFigures(mothers[2], mothers[3]),
    addFigures(daughters[0], daughters[1]),
    addFigures(daughters[2], daughters[3]),
  ];
  const witnesses: [FigureId, FigureId] = [
    addFigures(nephews[0], nephews[1]),
    addFigures(nephews[2], nephews[3]),
  ];
  const judge = addFigures(witnesses[0], witnesses[1]);

  return {
    mothers: [...mothers],
    daughters,
    nephews,
    witnesses,
    judge,
    reconciler: addFigures(judge, mothers[0]),
    houseFigures: houseChart([...mothers, ...daughters, ...nephews]),
  };
}

export function houseChart(figures: readonly FigureId[]): HouseFigures {
  if (figures.length < 12) {
    throw new Error('A house chart requires twelve figures');
  }
  return figures.slice(0, 12) as HouseFigures;
}
