import gm from "gm";
import domino from "domino";

export interface EloData {
  Elo: number;
  Month: number;
  Year: number;
}

interface Drawer {
  eloJPEG: (data: EloData[], player: string) => Promise<Buffer>;
  eloSVG: (data: EloData[], player: string) => Promise<string>;
}

const document = domino.createDocument();

const DRAWER: Drawer = {
  eloJPEG: async (data: EloData[], player: string): Promise<Buffer> => {
    const header = 10;
    const margin = 50;
    const width = 750;
    let height = 750;
    const img = gm(width + margin * 2, height + margin * 2, "white");
    height += header;
    const initialRating = data[0];
    let minElo = 4000,
      maxElo = 0;

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        minElo = data[i].Elo;
        maxElo = data[i].Elo;
      } else {
        minElo = Math.min(minElo, data[i].Elo);
        maxElo = Math.max(maxElo, data[i].Elo);
      }
    }

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

    img
      .font("Helvetica-Bold")
      .fill("#000000")
      .fontSize(24)
      .drawText(0, 2, player, "North")
      .font("Helvetica")
      .fontSize(12)
      .drawText(0, 36, "Wykres Elo", "North");

    img.stroke("black", 2).drawLine(margin, margin + header, margin, height);

    const maxPoint = header + margin;
    let minPoint = header + margin;
    let startDate = new Date(`${initialRating.Year}-${initialRating.Month}`);
    const currentDate = new Date();
    currentDate.setDate(1);
    let i = 0;
    const period = Math.ceil(yearsDiff(startDate, currentDate) / 22);

    // eslint-disable-next-line no-unmodified-loop-condition
    while (startDate <= currentDate) {
      if (startDate.getMonth() === 0) {
        if (yearsDiff(startDate, currentDate) % period === 0) {
          img
            .stroke("transparent", 0)
            .drawText(
              margin + k1 * i,
              height + 20,
              startDate.getFullYear().toString()
            );
          if (period > 1) {
            img
              .stroke("red", 2)
              .drawLine(
                margin + k1 * i,
                margin + header,
                margin + k1 * i,
                height
              );
          } else {
            img
              .stroke("black", 2)
              .drawLine(
                margin + k1 * i,
                margin + header,
                margin + k1 * i,
                height
              );
          }
        } else {
          img
            .stroke("black", 2)
            .drawLine(
              margin + k1 * i,
              margin + header,
              margin + k1 * i,
              height
            );
        }
      } else if (
        startDate.getMonth() === initialRating.Month &&
        startDate.getFullYear() === initialRating.Year
      ) {
        if (initialRating.Month < 5) {
          img
            .stroke("transparent", 0)
            .drawText(
              margin + k1 * i,
              height + 50,
              `${startDate.getFullYear()}-${startDate.getMonth()}`
            );
        } else if (period === 1) {
          img
            .stroke("transparent", 0)
            .drawText(
              margin + k1 * i,
              height + 20,
              startDate.getFullYear().toString()
            );
        }
      }
      startDate.setMonth(startDate.getMonth() + 1);
      if (
        startDate.getMonth() === currentDate.getMonth() &&
        startDate.getFullYear() === currentDate.getFullYear()
      ) {
        img
          .stroke("black", 2)
          .drawLine(
            margin + k1 * i,
            margin + header,
            margin + k1 * (i + 1),
            height
          );
        for (let j = 0; j <= eloRange; j++) {
          img
            .stroke("transparent", 0)
            .drawText(
              5,
              margin + header + k2 * j,
              (maxGraphElo - j * 50).toString()
            );
          img
            .stroke("black", 2)
            .drawLine(
              margin,
              margin + header + k2 * j,
              margin + k1 * (i + 1),
              margin + header + k2 * j
            );
          minPoint = margin + header + k2 * j;
          img.drawLine(margin, height, margin + k1 * i, height);
        }
      }
      i++;
    }

    if (startDate.getMonth() === 0) {
      img
        .stroke("transparent", 0)
        .drawText(
          margin + k1 * --i,
          height + 20,
          startDate.getFullYear().toString()
        );
    }

    startDate = new Date(`${initialRating.Year}-${initialRating.Month}`);
    let currentBreak = data[0];
    let currentPointX = margin;
    const currentPercent =
      1 - (initialRating.Elo - minGraphElo) / (maxGraphElo - minGraphElo);
    let currentPointY = currentPercent * (minPoint - maxPoint) + maxPoint;

    img.stroke("blue", 3);
    for (let i = 1; i < data.length; i++) {
      const newBreak = data[i];
      const monthDiff =
        (newBreak.Year - currentBreak.Year) * 12 +
        (newBreak.Month - currentBreak.Month);
      const newCurrentPointX = currentPointX + k1 * monthDiff;
      const newCurrentPercent =
        1 - (data[i].Elo - minGraphElo) / (maxGraphElo - minGraphElo);
      const newCurrentPointY =
        newCurrentPercent * (minPoint - maxPoint) + maxPoint;
      img.drawLine(
        currentPointX,
        currentPointY,
        currentPointX + k1 * (monthDiff - 1),
        currentPointY
      );
      img.drawLine(
        currentPointX + k1 * (monthDiff - 1),
        currentPointY,
        newCurrentPointX,
        newCurrentPointY
      );
      currentPointX = newCurrentPointX;
      currentPointY = newCurrentPointY;
      currentBreak = newBreak;
    }

    return new Promise((resolve, reject) => {
      img.toBuffer("jpeg", (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  },

  eloSVG: async (data: EloData[], player: string): Promise<string> => {
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
      `0 0 ${width + 2 * margin} ${height + 2 * margin}`
    );

    const background = document.createElement("rect");
    background.setAttribute("style", "fill:#fff");
    background.setAttribute("width", (width + 2 * margin).toString());
    background.setAttribute("height", (height + 2 * margin).toString());
    svg.appendChild(background);

    height += header;
    const initialRating = data[0];
    let minElo = 4000,
      maxElo = 0;

    if (!data || data.length < 2) {
      throw new Error("No data for elo curve");
    }

    data = data.filter((item) => item.Month !== undefined);

    if (data.length < 2) {
      throw new Error("No data for elo curve");
    }

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        minElo = data[i].Elo;
        maxElo = data[i].Elo;
      } else {
        minElo = Math.min(minElo, data[i].Elo);
        maxElo = Math.max(maxElo, data[i].Elo);
      }
    }

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

    const subtitle = document.createElement("text");
    subtitle.appendChild(document.createTextNode("Wykres Elo"));
    subtitle.setAttribute(
      "x",
      ((width - 5 * subtitle.textContent!.length) / 2).toString()
    );
    subtitle.setAttribute("y", "50");
    subtitle.setAttribute("text-anchor", "middle");
    subtitle.setAttribute("font-size", "16");

    svg.appendChild(title);
    svg.appendChild(subtitle);

    const maxPoint = header + margin;
    let minPoint = header + margin;
    const startDate = new Date(`${initialRating.Year}-${initialRating.Month}`);
    const currentDate = new Date();
    currentDate.setDate(1);
    let i = 0;
    const period = Math.ceil(yearsDiff(startDate, currentDate) / 22);

    const line = document.createElement("line");
    line.setAttribute("x1", margin.toString());
    line.setAttribute("y1", (margin + header).toString());
    line.setAttribute("x2", margin.toString());
    line.setAttribute("y2", height.toString());
    line.setAttribute("style", "stroke:#000;stroke-width:2");
    svg.appendChild(line);

    // eslint-disable-next-line no-unmodified-loop-condition
    while (startDate <= currentDate) {
      if (startDate.getMonth() === 0) {
        if (yearsDiff(startDate, currentDate) % period === 0) {
          const year = document.createElement("text");
          year.setAttribute("x", (margin + k1 * i).toString());
          year.setAttribute("y", (height + 20).toString());
          year.appendChild(
            document.createTextNode(startDate.getFullYear().toString())
          );
          svg.appendChild(year);

          if (period > 1) {
            const line = document.createElement("line");
            line.setAttribute("x1", (margin + k1 * i).toString());
            line.setAttribute("y1", (margin + header).toString());
            line.setAttribute("x2", (margin + k1 * i).toString());
            line.setAttribute("y2", height.toString());
            line.setAttribute("style", "stroke:#f00;stroke-width:2");
            svg.appendChild(line);
          } else {
            const line = document.createElement("line");
            line.setAttribute("x1", (margin + k1 * i).toString());
            line.setAttribute("y1", (margin + header).toString());
            line.setAttribute("x2", (margin + k1 * i).toString());
            line.setAttribute("y2", height.toString());
            line.setAttribute("style", "stroke:#000;stroke-width:2");
            svg.appendChild(line);
          }
        } else {
          const line = document.createElement("line");
          line.setAttribute("x1", (margin + k1 * i).toString());
          line.setAttribute("y1", (margin + header).toString());
          line.setAttribute("x2", (margin + k1 * i).toString());
          line.setAttribute("y2", height.toString());
          line.setAttribute("style", "stroke:#000;stroke-width:2");
          svg.appendChild(line);
        }
      } else if (
        startDate.getMonth() === initialRating.Month &&
        startDate.getFullYear() === initialRating.Year
      ) {
        if (initialRating.Month < 5) {
          const yearMonth = document.createElement("text");
          yearMonth.setAttribute("x", (margin + k1 * i).toString());
          yearMonth.setAttribute("y", (height + 20).toString());
          yearMonth.appendChild(
            document.createTextNode(
              `${startDate.getFullYear()}-${startDate.getMonth()}`
            )
          );
          svg.appendChild(yearMonth);
        } else if (period === 1) {
          const year = document.createElement("text");
          year.setAttribute("x", (margin + k1 * i).toString());
          year.setAttribute("y", (height + 20).toString());
          year.appendChild(
            document.createTextNode(startDate.getFullYear().toString())
          );
          svg.appendChild(year);
        }
      }
      startDate.setMonth(startDate.getMonth() + 1);
      if (
        startDate.getMonth() === currentDate.getMonth() &&
        startDate.getFullYear() === currentDate.getFullYear()
      ) {
        const line = document.createElement("line");
        line.setAttribute("x1", (margin + k1 * i).toString());
        line.setAttribute("y1", (margin + header).toString());
        line.setAttribute("x2", (margin + k1 * i).toString());
        line.setAttribute("y2", height.toString());
        line.setAttribute("style", "stroke:#000;stroke-width:2");
        svg.appendChild(line);

        for (let j = 0; j <= eloRange; j++) {
          const elo = document.createElement("text");
          elo.setAttribute("x", "5");
          elo.setAttribute("y", (margin + header + k2 * j).toString());
          elo.appendChild(
            document.createTextNode((maxGraphElo - j * 50).toString())
          );
          svg.appendChild(elo);

          const line = document.createElement("line");
          line.setAttribute("x1", margin.toString());
          line.setAttribute("y1", (margin + header + k2 * j).toString());
          line.setAttribute("x2", (margin + k1 * (i + 1)).toString());
          line.setAttribute("y2", (margin + header + k2 * j).toString());
          line.setAttribute("style", "stroke:#000;stroke-width:2");
          svg.appendChild(line);

          minPoint = margin + header + k2 * j;

          const line2 = document.createElement("line");
          line2.setAttribute("x1", margin.toString());
          line2.setAttribute("y1", height.toString());
          line2.setAttribute("x2", (margin + k1 * (i + 1)).toString());
          line2.setAttribute("y2", height.toString());
          line2.setAttribute("style", "stroke:#000;stroke-width:2");
          svg.appendChild(line2);
        }
      }
      i++;
    }

    if (startDate.getMonth() === 0) {
      const year = document.createElement("text");
      year.setAttribute("x", (margin + k1 * --i).toString());
      year.setAttribute("y", (height + 20).toString());
      year.appendChild(
        document.createTextNode(startDate.getFullYear().toString())
      );
      svg.appendChild(year);
    }

    let currentBreak = data[0];
    let currentPointX = margin;
    const currentPercent =
      1 - (initialRating.Elo - minGraphElo) / (maxGraphElo - minGraphElo);
    let currentPointY = currentPercent * (minPoint - maxPoint) + maxPoint;

    for (let i = 1; i < data.length; i++) {
      const newBreak = data[i];
      const monthDiff =
        (newBreak.Year - currentBreak.Year) * 12 +
        (newBreak.Month - currentBreak.Month);
      const newCurrentPointX = currentPointX + k1 * monthDiff;
      const newCurrentPercent =
        1 - (data[i].Elo - minGraphElo) / (maxGraphElo - minGraphElo);
      const newCurrentPointY =
        newCurrentPercent * (minPoint - maxPoint) + maxPoint;

      const line = document.createElement("line");
      line.setAttribute("x1", currentPointX.toString());
      line.setAttribute("y1", currentPointY.toString());
      line.setAttribute(
        "x2",
        (currentPointX + k1 * (monthDiff - 1)).toString()
      );
      line.setAttribute("y2", currentPointY.toString());
      line.setAttribute("style", "stroke:#00f;stroke-width:4");
      svg.appendChild(line);

      const line2 = document.createElement("line");
      line2.setAttribute(
        "x1",
        (currentPointX + k1 * (monthDiff - 1)).toString()
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

    return svg.outerHTML;
  },
};

function yearsDiff(date1: Date, date2: Date): number {
  if (date1.getTime() === date2.getTime()) {
    return 0;
  }
  let diff = -1;
  const gDate =
    date1 > date2 ? new Date(date1.getTime()) : new Date(date2.getTime());
  const lDate =
    date1 < date2 ? new Date(date1.getTime()) : new Date(date2.getTime());

  // eslint-disable-next-line no-unmodified-loop-condition
  while (lDate < gDate) {
    diff++;
    lDate.setFullYear(lDate.getFullYear() + 1);
  }
  return diff;
}

export default DRAWER;
