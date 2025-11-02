/* eslint-disable unicorn/prefer-dom-node-append */
import { createCanvas, loadImage } from "canvas";
import domino from "domino";

export interface EloData {
  Elo: number;
  Month: number;
  Year: number;
}
interface Drawer {
  eloJPEG: (data: EloData[], player: string) => Promise<Buffer>;
  eloSVG: (data: EloData[], player: string) => string;
}
const document = domino.createDocument();
function calculateMinMaxElo(data: EloData[]): {
  maxElo: number;
  minElo: number;
} {
  let minElo = data[0].Elo;
  let maxElo = data[0].Elo;
  for (const item of data) {
    minElo = Math.min(minElo, item.Elo);
    maxElo = Math.max(maxElo, item.Elo);
  }
  return { maxElo, minElo };
}
function yearsDiff(date1: Date, date2: Date): number {
  if (date1.getTime() === date2.getTime()) {
    return 0;
  }
  let diff = -1;
  const gDate = date1 > date2 ? new Date(date1) : new Date(date2);
  const lDate = date1 < date2 ? new Date(date1) : new Date(date2);
  // eslint-disable-next-line no-unmodified-loop-condition
  while (lDate < gDate) {
    diff++;
    lDate.setFullYear(lDate.getFullYear() + 1);
  }
  return diff;
}
const DRAWER: Drawer = {
  eloJPEG: async (data: EloData[], player: string): Promise<Buffer> => {
    const svg = DRAWER.eloSVG(data, player);
    const img = await loadImage(
      "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64"),
    );
    const canvas = createCanvas(750, 750);
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0, 750, 750);
    return canvas.toBuffer("image/jpeg");
  },

  eloSVG: (data: EloData[], player: string): string => {
    const header = 10;
    const margin = 50;
    const width = 750;
    let height = 750;
    const svg = document.createElement("svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", (width + 2 * margin).toString());
    svg.setAttribute("height", (height + 2 * margin).toString());
    svg.setAttribute("style", "background-color: white;");
    svg.setAttribute(
      "viewBox",
      `0 0 ${width + 2 * margin} ${height + 2 * margin}`,
    );
    const background = document.createElement("rect");
    background.setAttribute("style", "fill:#fff");
    background.setAttribute("width", (width + 2 * margin).toString());
    background.setAttribute("height", (height + 2 * margin).toString());
    svg.appendChild(background);
    height += header;
    const initialRating = data[0];
    const { maxElo, minElo } = calculateMinMaxElo(data);
    const monthNumber =
      12 -
      initialRating.Month +
      (new Date().getFullYear() - initialRating.Year - 1) * 12 +
      new Date().getMonth();
    const eloRange = Math.ceil((maxElo - minElo) / 50) + 1;
    const k1 = monthNumber === 1 ? width : width / (monthNumber - 1);
    const k2 = (height - margin * 2) / eloRange;
    const maxGraphElo = Math.ceil(maxElo / 50) * 50;
    const minGraphElo = Math.floor(minElo / 50) * 50;
    const title = document.createElement("text");
    title.appendChild(document.createTextNode(player));
    title.setAttribute("x", ((width - 5 * player.length) / 2).toString());
    title.setAttribute("y", "30");
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("font-size", "24");
    title.setAttribute("font-weight", "bold");
    svg.appendChild(title);
    const maxPoint = header + margin;
    let minPoint = header + margin;
    const startDate = new Date(`${initialRating.Year}-${initialRating.Month}`);
    const currentDate = new Date();
    currentDate.setDate(1);
    const period = Math.ceil(yearsDiff(startDate, currentDate) / 22);
    const leftBorder = document.createElement("line");
    leftBorder.setAttribute("x1", margin.toString());
    leftBorder.setAttribute("y1", (margin + header).toString());
    leftBorder.setAttribute("x2", margin.toString());
    leftBorder.setAttribute("y2", height.toString());
    leftBorder.setAttribute("style", "stroke:#000;stroke-width:2");
    svg.appendChild(leftBorder);
    let index = 0;
    // eslint-disable-next-line no-unmodified-loop-condition
    while (startDate <= currentDate) {
      if (startDate.getMonth() === 0) {
        if (yearsDiff(startDate, currentDate) % period === 0) {
          const year = document.createElement("text");
          year.setAttribute("x", (margin + k1 * index).toString());
          year.setAttribute("y", (height + 20).toString());
          year.appendChild(
            document.createTextNode(startDate.getFullYear().toString()),
          );
          svg.appendChild(year);
          const line = document.createElement("line");
          line.setAttribute("x1", (margin + k1 * index).toString());
          line.setAttribute("y1", (margin + header).toString());
          line.setAttribute("x2", (margin + k1 * index).toString());
          line.setAttribute("y2", height.toString());
          line.setAttribute(
            "style",
            period > 1
              ? "stroke:#f00;stroke-width:2"
              : "stroke:#000;stroke-width:2",
          );
          svg.appendChild(line);
        } else {
          const line = document.createElement("line");
          line.setAttribute("x1", (margin + k1 * index).toString());
          line.setAttribute("y1", (margin + header).toString());
          line.setAttribute("x2", (margin + k1 * index).toString());
          line.setAttribute("y2", height.toString());
          line.setAttribute("style", "stroke:#000;stroke-width:2");
          svg.appendChild(line);
        }
      }
      startDate.setMonth(startDate.getMonth() + 1);
      index++;
    }
    for (let index2 = 0; index2 <= eloRange; index2++) {
      const elo = document.createElement("text");
      elo.setAttribute("x", "5");
      elo.setAttribute("y", (margin + header + k2 * index2).toString());
      elo.appendChild(
        document.createTextNode((maxGraphElo - index2 * 50).toString()),
      );
      svg.appendChild(elo);
      const line = document.createElement("line");
      line.setAttribute("x1", margin.toString());
      line.setAttribute("y1", (margin + header + k2 * index2).toString());
      line.setAttribute("x2", (margin + k1 * (index - 1)).toString());
      line.setAttribute("y2", (margin + header + k2 * index2).toString());
      line.setAttribute("style", "stroke:#000;stroke-width:2");
      svg.appendChild(line);
      minPoint = margin + header + k2 * index2;
    }
    const bottomBorder = document.createElement("line");
    bottomBorder.setAttribute("x1", margin.toString());
    bottomBorder.setAttribute("y1", height.toString());
    bottomBorder.setAttribute("x2", (margin + k1 * (index - 1)).toString());
    bottomBorder.setAttribute("y2", height.toString());
    bottomBorder.setAttribute("style", "stroke:#000;stroke-width:2");
    svg.appendChild(bottomBorder);
    let currentBreak = data[0];
    let currentPointX = margin;
    const currentPercent =
      1 - (initialRating.Elo - minGraphElo) / (maxGraphElo - minGraphElo);
    let currentPointY = currentPercent * (minPoint - maxPoint) + maxPoint;
    for (let index2 = 1; index2 < data.length; index2++) {
      const newBreak = data[index2];
      const monthDiff =
        (newBreak.Year - currentBreak.Year) * 12 +
        (newBreak.Month - currentBreak.Month);
      const newCurrentPointX = currentPointX + k1 * monthDiff;
      const newCurrentPercent =
        1 - (newBreak.Elo - minGraphElo) / (maxGraphElo - minGraphElo);
      const newCurrentPointY =
        newCurrentPercent * (minPoint - maxPoint) + maxPoint;
      const line = document.createElement("line");
      line.setAttribute("x1", currentPointX.toString());
      line.setAttribute("y1", currentPointY.toString());
      line.setAttribute(
        "x2",
        (currentPointX + k1 * (monthDiff - 1)).toString(),
      );
      line.setAttribute("y2", currentPointY.toString());
      line.setAttribute("style", "stroke:#00f;stroke-width:4");
      svg.appendChild(line);
      const line2 = document.createElement("line");
      line2.setAttribute(
        "x1",
        (currentPointX + k1 * (monthDiff - 1)).toString(),
      );
      line2.setAttribute("y1", currentPointY.toString());
      line2.setAttribute("x2", newCurrentPointX.toString());
      line2.setAttribute("y2", newCurrentPointY.toString());
      line2.setAttribute("style", "stroke:#00f;stroke-width:4");
      svg.appendChild(line2);
      currentPointX = newCurrentPointX;
      currentPointY = newCurrentPointY;
      currentBreak = newBreak;
    }
    const rightBorder = document.createElement("line");
    rightBorder.setAttribute("x1", currentPointX.toString());
    rightBorder.setAttribute("y1", (margin + header).toString());
    rightBorder.setAttribute("x2", currentPointX.toString());
    rightBorder.setAttribute("y2", height.toString());
    rightBorder.setAttribute("style", "stroke:#000;stroke-width:2");
    svg.appendChild(rightBorder);
    return svg.outerHTML;
  },
};
export default DRAWER;
