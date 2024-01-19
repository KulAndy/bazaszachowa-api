const gm = require("gm").subClass({ imageMagick: true });
const domino = require("domino");

const document = domino.createDocument();

const DRAWER = {
  eloJPEG: async (data, player) => {
    const header = 10;
    const margin = 50;
    let width = 750;
    let height = 750;
    const img = gm(width + margin * 2, height + margin * 2, "white");
    height += header;
    let initialRating = null;
    let minElo = 4000,
      maxElo = 0;

    for (let i = 0; i < data.length; i++) {
      if (i == 0) {
        initialRating = data[i];
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
    let k1 = monthNumber == 1 ? width : width / (monthNumber - 1);
    let k2 = (height - margin * 2) / eloRange;

    let maxGraphElo = 0;
    while (maxGraphElo < maxElo) {
      maxGraphElo += 50;
    }

    let minGraphElo = 4000;
    while (minGraphElo > minElo) {
      minGraphElo -= 50;
    }

    img
      .font("Helvetica-Bold")
      .fill("#000000")
      .fontSize(24)
      .drawText(0, 2, player, "North")
      .font("Helvetica")
      .fontSize(12)
      .drawText(0, 36, "Wykres elo", "North");
    img.stroke("black", 2).drawLine(margin, margin + header, margin, height);

    let maxPoint = header + margin;
    let minPoint = header + margin;

    let startDate = new Date(`${initialRating.Year}-${initialRating.Month}`);
    let currentDate = new Date();
    currentDate.setDate(1);
    let i = 0;
    let period = Math.ceil(yearsDiff(startDate, currentDate) / 22);

    while (startDate <= currentDate) {
      if (startDate.getMonth() == 0) {
        if (yearsDiff(startDate, currentDate) % period == 0) {
          img
            .stroke("transparent", 0)
            .drawText(margin + k1 * i, height + 20, startDate.getFullYear());
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
        startDate.getMonth() == initialRating.Month &&
        startDate.getFullYear() == initialRating.Year
      ) {
        if (initialRating.Month < 5) {
          img
            .stroke("transparent", 0)
            .drawText(
              margin + k1 * i,
              height + 50,
              `${startDate.getFullYear()}-${startDate.getMonth()}`
            );
        } else {
          if (period == 1)
            img
              .stroke("transparent", 0)
              .drawText(margin + k1 * i, height + 20, startDate.getFullYear());
        }
      }
      startDate.setMonth(startDate.getMonth() + 1);
      if (
        startDate.getMonth() == currentDate.getMonth() &&
        startDate.getFullYear() == currentDate.getFullYear()
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
            .drawText(5, margin + header + k2 * j, maxGraphElo - j * 50);
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
    if (startDate.getMonth() == 0) {
      img
        .stroke("transparent", 0)
        .drawText(margin + k1 * --i, height + 20, startDate.getFullYear());
    }

    startDate = new Date(`${initialRating.Year}-${initialRating.Month}`);
    let currentBreak = data[0];

    let currentPointX = margin;
    let currentPercent =
      1 - (initialRating.Elo - minGraphElo) / (maxGraphElo - minGraphElo);
    let currentPointY = currentPercent * (minPoint - maxPoint) + maxPoint;
    img.stroke("blue", 3);

    for (let i = 1; i < data.length; i++) {
      let newBreak = data[i];
      let monthDiff =
        (newBreak.Year - currentBreak.Year) * 12 +
        (newBreak.Month - currentBreak.Month);
      let newCurrentPointX = currentPointX + k1 * monthDiff;
      let newCurrentPercent =
        1 - (data[i].Elo - minGraphElo) / (maxGraphElo - minGraphElo);

      let newCurrentPointY =
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

  eloSVG: async (data, player) => {
    const header = 10;
    const margin = 50;
    let width = 750;
    let height = 750;
    const svg = document.createElement("svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", width + 2 * margin);
    svg.setAttribute("height", height + 2 * margin);
    svg.setAttribute("style", "background-color: white;");
    svg.setAttribute(
      "viewBox",
      `0 0 {width + 2 * margin} {heigth + 2 * margin}`
    );
    const background = document.createElement("rect");
    background.setAttribute("style", "fill:#fff");
    background.setAttribute("width", width + 2 * margin);
    background.setAttribute("height", height + 2 * margin);

    svg.appendChild(background);

    height += header;
    let initialRating = null;
    let minElo = 4000,
      maxElo = 0;

    for (let i = 0; i < data.length; i++) {
      if (i == 0) {
        initialRating = data[i];
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
    let k1 = monthNumber == 1 ? width : width / (monthNumber - 1);
    let k2 = (height - margin * 2) / eloRange;

    let maxGraphElo = 0;
    while (maxGraphElo < maxElo) {
      maxGraphElo += 50;
    }

    let minGraphElo = 4000;
    while (minGraphElo > minElo) {
      minGraphElo -= 50;
    }

    const title = document.createElement("text");
    title.appendChild(document.createTextNode(player));
    title.setAttribute("x", (width - 5 * player.length) / 2);
    title.setAttribute("y", 30);
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("font-size", 24);
    title.setAttribute("font-weight", "bold");

    const subtitle = document.createElement("text");
    subtitle.appendChild(document.createTextNode("Wykres Elo"));
    subtitle.setAttribute("x", (width - 5 * subtitle.textContent.length) / 2);
    subtitle.setAttribute("y", 50);
    subtitle.setAttribute("text-anchor", "middle");
    subtitle.setAttribute("font-size", 16);
    svg.appendChild(title);
    svg.appendChild(subtitle);

    let maxPoint = header + margin;
    let minPoint = header + margin;

    let startDate = new Date(`${initialRating.Year}-${initialRating.Month}`);
    let currentDate = new Date();
    currentDate.setDate(1);
    let i = 0;
    let period = Math.ceil(yearsDiff(startDate, currentDate) / 22);
    let line = document.createElement("line");
    line.setAttribute("x1", margin);
    line.setAttribute("y1", margin + header);
    line.setAttribute("x2", margin);
    line.setAttribute("y2", height);
    line.setAttribute("style", "stroke:#000;stroke-width:2");
    svg.appendChild(line);

    while (startDate <= currentDate) {
      if (startDate.getMonth() == 0) {
        if (yearsDiff(startDate, currentDate) % period == 0) {
          let year = document.createElement("text");
          year.setAttribute("x", margin + k1 * i);
          year.setAttribute("y", height + 20);
          year.appendChild(document.createTextNode(startDate.getFullYear()));
          svg.appendChild(year);
          if (period > 1) {
            let line = document.createElement("line");
            line.setAttribute("x1", margin + k1 * i);
            line.setAttribute("y1", margin + header);
            line.setAttribute("x2", margin + k1 * i);
            line.setAttribute("y2", height);
            line.setAttribute("style", "stroke:#f00;stroke-width:2");
            svg.appendChild(line);
          } else {
            let line = document.createElement("line");
            line.setAttribute("x1", margin + k1 * i);
            line.setAttribute("y1", margin + header);
            line.setAttribute("x2", margin + k1 * i);
            line.setAttribute("y2", height);
            line.setAttribute("style", "stroke:#000;stroke-width:2");
            svg.appendChild(line);
          }
        } else {
          let line = document.createElement("line");
          line.setAttribute("x1", margin + k1 * i);
          line.setAttribute("y1", margin + header);
          line.setAttribute("x2", margin + k1 * i);
          line.setAttribute("y2", height);
          line.setAttribute("style", "stroke:#000;stroke-width:2");
          svg.appendChild(line);
        }
      } else if (
        startDate.getMonth() == initialRating.Month &&
        startDate.getFullYear() == initialRating.Year
      ) {
        if (initialRating.Month < 5) {
          let yearMonth = document.createElement("text");
          yearMonth.setAttribute("x", margin + k1 * i);
          yearMonth.setAttribute("y", height + 20);
          yearMonth.appendChild(
            document.createTextNode(
              `${startDate.getFullYear()}-${startDate.getMonth()}`
            )
          );
          svg.appendChild(yearMonth);
        } else {
          if (period == 1) {
            let year = document.createElement("text");
            year.setAttribute("x", margin + k1 * i);
            year.setAttribute("y", height + 20);
            year.appendChild(document.createTextNode(startDate.getFullYear()));
            svg.appendChild(year);
          }
        }
      }
      startDate.setMonth(startDate.getMonth() + 1);
      if (
        startDate.getMonth() == currentDate.getMonth() &&
        startDate.getFullYear() == currentDate.getFullYear()
      ) {
        let line = document.createElement("line");
        line.setAttribute("x1", margin + k1 * i);
        line.setAttribute("y1", margin + header);
        line.setAttribute("x2", margin + k1 * i);
        line.setAttribute("y2", height);
        line.setAttribute("style", "stroke:#000;stroke-width:2");
        svg.appendChild(line);

        for (let j = 0; j <= eloRange; j++) {
          let elo = document.createElement("text");
          elo.setAttribute("x", 5);
          elo.setAttribute("y", margin + header + k2 * j);
          elo.appendChild(document.createTextNode(maxGraphElo - j * 50));
          svg.appendChild(elo);

          let line = document.createElement("line");
          line.setAttribute("x1", margin);
          line.setAttribute("y1", margin + header + k2 * j);
          line.setAttribute("x2", margin + k1 * (i + 1));
          line.setAttribute("y2", margin + header + k2 * j);
          line.setAttribute("style", "stroke:#000;stroke-width:2");
          svg.appendChild(line);

          minPoint = margin + header + k2 * j;
          let line2 = document.createElement("line");
          line2.setAttribute("x1", margin);
          line2.setAttribute("y1", height);
          line2.setAttribute("x2", margin + k1 * (i + 1));
          line2.setAttribute("y2", height);
          line2.setAttribute("style", "stroke:#000;stroke-width:2");
          svg.appendChild(line2);
        }
      }
      i++;
    }
    if (startDate.getMonth() == 0) {
      let year = document.createElement("text");
      year.setAttribute("x", margin + k1 * --i);
      year.setAttribute("y", height + 20);
      year.appendChild(document.createTextNode(startDate.getFullYear()));
      svg.appendChild(year);
    }

    let currentBreak = data[0];

    let currentPointX = margin;
    let currentPercent =
      1 - (initialRating.Elo - minGraphElo) / (maxGraphElo - minGraphElo);
    let currentPointY = currentPercent * (minPoint - maxPoint) + maxPoint;

    for (let i = 1; i < data.length; i++) {
      let newBreak = data[i];
      let monthDiff =
        (newBreak.Year - currentBreak.Year) * 12 +
        (newBreak.Month - currentBreak.Month);
      let newCurrentPointX = currentPointX + k1 * monthDiff;
      let newCurrentPercent =
        1 - (data[i].Elo - minGraphElo) / (maxGraphElo - minGraphElo);

      let newCurrentPointY =
        newCurrentPercent * (minPoint - maxPoint) + maxPoint;
      let line = document.createElement("line");
      line.setAttribute("x1", currentPointX);
      line.setAttribute("y1", currentPointY);
      line.setAttribute("x2", currentPointX + k1 * (monthDiff - 1));
      line.setAttribute("y2", currentPointY);
      line.setAttribute("style", "stroke:#00f;stroke-width:4");
      svg.appendChild(line);

      let line2 = document.createElement("line");
      line2.setAttribute("x1", currentPointX + k1 * (monthDiff - 1));
      line2.setAttribute("y1", currentPointY);
      line2.setAttribute("x2", newCurrentPointX);
      line2.setAttribute("y2", newCurrentPointY);
      line2.setAttribute("style", "stroke:#00f;stroke-width:4");
      svg.appendChild(line2);

      currentPointX = newCurrentPointX;
      currentPointY = newCurrentPointY;
      currentBreak = newBreak;
    }

    return svg.outerHTML;
  },
};

module.exports = DRAWER;

function yearsDiff(date1, date2) {
  if (date1 == date2) {
    return 0;
  }
  let diff = -1;
  let gDate =
    date1 > date2 ? new Date(date1.getTime()) : new Date(date2.getTime());
  let lDate =
    date1 < date2 ? new Date(date1.getTime()) : new Date(date2.getTime());

  while (lDate < gDate) {
    diff++;
    lDate.setYear(lDate.getFullYear() + 1);
  }
  return diff;
}
