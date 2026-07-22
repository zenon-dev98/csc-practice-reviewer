(function () {
  "use strict";

  const WIDTH = 1632;
  const HEIGHT = 2112;
  const MARKERS = [
    { x: 56, y: 56 },
    { x: WIDTH - 56, y: 56 },
    { x: WIDTH - 56, y: HEIGHT - 56 },
    { x: 56, y: HEIGHT - 56 }
  ];
  const PAGES = [
    { number: 1, start: 1, end: 85 },
    { number: 2, start: 86, end: 170 }
  ];
  const LETTERS = ["A", "B", "C", "D"];

  function templateItems(pageIndex) {
    const page = PAGES[pageIndex];
    if (!page) return [];
    const columns = [0, 1, 2];
    const columnLeft = [88, 598, 1108];
    const rowStart = 460;
    const rowPitch = 52;
    const bubbleStart = 178;
    const bubblePitch = 76;
    const items = [];
    let item = page.start;
    for (const column of columns) {
      const remaining = page.end - item + 1;
      const rows = Math.min(column === 0 ? 29 : 28, remaining);
      for (let row = 0; row < rows; row += 1) {
        const y = rowStart + row * rowPitch;
        items.push({
          number: item,
          choices: LETTERS.map((letter, index) => ({
            letter,
            x: columnLeft[column] + bubbleStart + index * bubblePitch,
            y
          }))
        });
        item += 1;
      }
    }
    return items;
  }

  function drawMarker(context, marker, index) {
    context.save();
    context.translate(marker.x, marker.y);
    context.fillStyle = "#000";
    context.fillRect(-22, -22, 44, 44);
    context.fillStyle = "#fff";
    if (index === 0) context.fillRect(-8, -8, 16, 16);
    if (index === 1) context.fillRect(-12, -5, 24, 10);
    if (index === 2) {
      context.fillRect(-13, -13, 10, 26);
      context.fillRect(4, -13, 10, 26);
    }
    if (index === 3) {
      context.beginPath();
      context.arc(0, 0, 9, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  function drawSheet(canvas, pageIndex, versionLabel) {
    const page = PAGES[pageIndex];
    if (!page) throw new Error("Unknown paper answer-sheet page.");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#fff";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.strokeStyle = "#111";
    context.lineWidth = 4;
    context.strokeRect(42, 42, WIDTH - 84, HEIGHT - 84);
    MARKERS.forEach((marker, index) => drawMarker(context, marker, index));
    context.fillStyle = "#000";
    context.fillRect(WIDTH / 2 - 110, 52, 220, 16);

    context.fillStyle = "#071a23";
    context.font = "800 54px Arial, sans-serif";
    context.textAlign = "center";
    context.fillText("CSC PRACTICE REVIEWER", WIDTH / 2, 112);
    context.font = "700 29px Arial, sans-serif";
    context.fillText("PAPER ANSWER SHEET", WIDTH / 2, 158);
    context.font = "24px Arial, sans-serif";
    context.fillText("Independent practice reviewer - not affiliated with the Civil Service Commission", WIDTH / 2, 198);

    context.textAlign = "left";
    context.font = "700 24px Arial, sans-serif";
    context.fillText(`MOCK VERSION: ${String(versionLabel || "--").toUpperCase()}`, 90, 270);
    context.fillText(`PAGE ${page.number} OF 2`, 650, 270);
    context.fillText(`ITEMS ${page.start}-${page.end}`, 900, 270);
    context.font = "22px Arial, sans-serif";
    context.fillText("NAME:", 90, 324);
    context.strokeStyle = "#333";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(175, 328);
    context.lineTo(850, 328);
    context.stroke();
    context.fillText("Use black ballpoint pen. Fill one bubble completely. Keep all four corner markers visible when scanning.", 90, 375);

    const columnLeft = [88, 598, 1108];
    context.font = "700 21px Arial, sans-serif";
    for (const left of columnLeft) {
      context.fillStyle = "#071a23";
      context.fillText("ITEM", left, 412);
      LETTERS.forEach((letter, index) => context.fillText(letter, left + 170 + index * 76, 412));
      context.strokeStyle = "#777";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(left, 420);
      context.lineTo(left + 430, 420);
      context.stroke();
    }

    for (const item of templateItems(pageIndex)) {
      const column = item.number <= page.start + 28 ? 0 : item.number <= page.start + 56 ? 1 : 2;
      const left = columnLeft[column];
      context.fillStyle = "#111";
      context.font = "700 22px Arial, sans-serif";
      context.textAlign = "right";
      context.fillText(String(item.number), left + 82, item.choices[0].y + 8);
      context.textAlign = "center";
      for (const choice of item.choices) {
        context.strokeStyle = "#111";
        context.lineWidth = 3;
        context.beginPath();
        context.arc(choice.x, choice.y, 17, 0, Math.PI * 2);
        context.stroke();
      }
    }

    context.textAlign = "center";
    context.fillStyle = "#111";
    context.font = "20px Arial, sans-serif";
    context.fillText(`Page ${page.number} - Items ${page.start}-${page.end} - Keep this sheet flat and fully visible`, WIDTH / 2, 2042);
    return { page, items: templateItems(pageIndex), markers: MARKERS.map((marker) => ({ ...marker })) };
  }

  function solveLinear(matrix, values) {
    const size = values.length;
    const rows = matrix.map((row, index) => [...row, values[index]]);
    for (let column = 0; column < size; column += 1) {
      let pivot = column;
      for (let row = column + 1; row < size; row += 1) {
        if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
      }
      if (Math.abs(rows[pivot][column]) < 1e-10) throw new Error("The selected page corners do not form a usable sheet.");
      [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
      const divisor = rows[column][column];
      for (let index = column; index <= size; index += 1) rows[column][index] /= divisor;
      for (let row = 0; row < size; row += 1) {
        if (row === column) continue;
        const factor = rows[row][column];
        for (let index = column; index <= size; index += 1) rows[row][index] -= factor * rows[column][index];
      }
    }
    return rows.map((row) => row[size]);
  }

  function homography(from, to) {
    const matrix = [];
    const values = [];
    for (let index = 0; index < 4; index += 1) {
      const u = from[index].x;
      const v = from[index].y;
      const x = to[index].x;
      const y = to[index].y;
      matrix.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
      values.push(x);
      matrix.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
      values.push(y);
    }
    const h = solveLinear(matrix, values);
    return (u, v) => {
      const denominator = h[6] * u + h[7] * v + 1;
      return {
        x: (h[0] * u + h[1] * v + h[2]) / denominator,
        y: (h[3] * u + h[4] * v + h[5]) / denominator
      };
    };
  }

  function pixelLuminance(data, width, height, x, y) {
    const px = Math.max(0, Math.min(width - 1, Math.round(x)));
    const py = Math.max(0, Math.min(height - 1, Math.round(y)));
    const offset = (py * width + px) * 4;
    return data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
  }

  function bubbleScore(imageData, map, center) {
    let inner = 0;
    let innerCount = 0;
    let outer = 0;
    let outerCount = 0;
    for (let dy = -29; dy <= 29; dy += 3) {
      for (let dx = -29; dx <= 29; dx += 3) {
        const radius = Math.hypot(dx, dy);
        if (radius > 29 || (radius > 10 && radius < 22)) continue;
        const point = map(center.x + dx, center.y + dy);
        const luminance = pixelLuminance(imageData.data, imageData.width, imageData.height, point.x, point.y);
        if (radius <= 10) {
          inner += luminance;
          innerCount += 1;
        } else if (radius >= 22) {
          outer += luminance;
          outerCount += 1;
        }
      }
    }
    const innerAverage = inner / Math.max(1, innerCount);
    const outerAverage = outer / Math.max(1, outerCount);
    return Math.max(0, outerAverage - innerAverage);
  }

  function classifyScores(scores) {
    const ranked = scores.map((score, index) => ({ score, index })).sort((left, right) => right.score - left.score);
    const top = ranked[0];
    const second = ranked[1];
    const marked = ranked.filter((entry) => entry.score >= 31);
    if (top.score < 23) return { choice: null, state: "blank", confidence: Math.max(0, 1 - top.score / 23), scores };
    if (marked.length > 1 && second.score >= Math.max(27, top.score * 0.72)) {
      return { choice: null, state: "multiple", confidence: 0, scores };
    }
    if (top.score < 34 || top.score - second.score < 11) {
      return { choice: LETTERS[top.index], state: "low", confidence: Math.min(0.69, top.score / 50), scores };
    }
    return { choice: LETTERS[top.index], state: "confident", confidence: Math.min(0.99, 0.7 + (top.score - second.score) / 90), scores };
  }

  function analyze(imageData, sourceMarkers, pageIndex) {
    if (!imageData || !sourceMarkers || sourceMarkers.length !== 4) throw new Error("A page image and four alignment points are required.");
    const map = homography(MARKERS, sourceMarkers);
    return templateItems(pageIndex).map((item) => {
      const scores = item.choices.map((choice) => bubbleScore(imageData, map, choice));
      return { number: item.number, ...classifyScores(scores), reviewed: false };
    });
  }

  function defaultMarkers(width, height) {
    const insetX = Math.max(12, width * 0.028);
    const insetY = Math.max(12, height * 0.028);
    return [
      { x: insetX, y: insetY },
      { x: width - insetX, y: insetY },
      { x: width - insetX, y: height - insetY },
      { x: insetX, y: height - insetY }
    ];
  }

  function detectMarkers(imageData) {
    const { width, height, data } = imageData;
    const regions = [
      [0, 0, 0.24, 0.18],
      [0.76, 0, 1, 0.18],
      [0.76, 0.82, 1, 1],
      [0, 0.82, 0.24, 1]
    ];
    const points = [];
    const radius = Math.max(2, Math.round(Math.min(width, height) * 0.012));
    const step = Math.max(2, Math.round(Math.min(width, height) / 180));
    for (const region of regions) {
      let best = null;
      for (let y = Math.round(height * region[1]) + radius; y < Math.round(height * region[3]) - radius; y += step) {
        for (let x = Math.round(width * region[0]) + radius; x < Math.round(width * region[2]) - radius; x += step) {
          let darkness = 0;
          let count = 0;
          for (let dy = -radius; dy <= radius; dy += step) {
            for (let dx = -radius; dx <= radius; dx += step) {
              darkness += 255 - pixelLuminance(data, width, height, x + dx, y + dy);
              count += 1;
            }
          }
          const score = darkness / Math.max(1, count);
          if (!best || score > best.score) best = { x, y, score };
        }
      }
      points.push(best);
    }
    const confidence = points.every((point) => point && point.score > 105)
      ? Math.min(1, points.reduce((sum, point) => sum + point.score, 0) / (points.length * 190))
      : 0;
    return { points: confidence >= 0.55 ? points.map(({ x, y }) => ({ x, y })) : defaultMarkers(width, height), confidence };
  }

  function orientationTurns(imageData) {
    const { width, height, data } = imageData;
    const regions = [
      [0.42, 0.018, 0.58, 0.042],
      [0.958, 0.42, 0.982, 0.58],
      [0.42, 0.958, 0.58, 0.982],
      [0.018, 0.42, 0.042, 0.58]
    ];
    const scores = regions.map(([left, top, right, bottom]) => {
      let darkness = 0;
      let count = 0;
      const step = Math.max(1, Math.round(Math.min(width, height) / 360));
      for (let y = Math.round(height * top); y < Math.round(height * bottom); y += step) {
        for (let x = Math.round(width * left); x < Math.round(width * right); x += step) {
          darkness += 255 - pixelLuminance(data, width, height, x, y);
          count += 1;
        }
      }
      return darkness / Math.max(1, count);
    });
    const ranked = scores.map((score, index) => ({ score, index })).sort((left, right) => right.score - left.score);
    const confidence = ranked[0].score < 25 ? 0 : Math.max(0, Math.min(1, (ranked[0].score - ranked[1].score) / ranked[0].score));
    const turnsByEdge = [0, 3, 2, 1];
    return { turns: confidence >= 0.2 ? turnsByEdge[ranked[0].index] : 0, confidence, scores };
  }

  window.CSC_PAPER_MODE = {
    WIDTH,
    HEIGHT,
    MARKERS: MARKERS.map((marker) => ({ ...marker })),
    PAGES: PAGES.map((page) => ({ ...page })),
    LETTERS: LETTERS.slice(),
    drawSheet,
    templateItems,
    homography,
    classifyScores,
    analyze,
    detectMarkers,
    defaultMarkers,
    orientationTurns
  };
})();
