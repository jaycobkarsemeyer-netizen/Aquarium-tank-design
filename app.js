const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 900;
canvas.height = 600;

let tool = "select";
let shapes = [];
let selected = null;

function setTool(t) {
  tool = t;
  selected = null;
  draw();
}

function snap(v) {
  const s = parseInt(document.getElementById("snap").value);
  return Math.round(v / s) * s;
}

canvas.addEventListener("mousedown", (e) => {
  const r = canvas.getBoundingClientRect();
  let x = snap(e.clientX - r.left);
  let y = snap(e.clientY - r.top);

  if (tool === "box") {
    shapes.push({type:"box", x, y, w:100, h:60});
  }

  if (tool === "circle") {
    shapes.push({type:"circle", x, y, r:30});
  }

  if (tool === "select") {
    selected = shapes.find(s => hit(s, x, y));
    updatePanel();
  }

  draw();
});

function hit(s, x, y) {
  if (s.type === "box") {
    return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
  }
  if (s.type === "circle") {
    return Math.hypot(x - s.x, y - s.y) < s.r;
  }
}

canvas.addEventListener("mousemove", (e) => {
  if (!selected || tool !== "select") return;

  const r = canvas.getBoundingClientRect();
  selected.x = snap(e.clientX - r.left);
  selected.y = snap(e.clientY - r.top);

  updatePanel();
  draw();
});

function deleteSelected() {
  shapes = shapes.filter(s => s !== selected);
  selected = null;
  draw();
}

function duplicate() {
  if (!selected) return;

  const copy = JSON.parse(JSON.stringify(selected));
  copy.x += 20;
  copy.y += 20;
  shapes.push(copy);
  draw();
}

function updatePanel() {
  if (!selected) return;

  document.getElementById("x").value = selected.x || 0;
  document.getElementById("y").value = selected.y || 0;
  document.getElementById("w").value = selected.w || 0;
  document.getElementById("h").value = selected.h || 0;
  document.getElementById("r").value = selected.r || 0;
}

["x","y","w","h","r"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    if (!selected) return;

    selected.x = +document.getElementById("x").value;
    selected.y = +document.getElementById("y").value;

    if (selected.type === "box") {
      selected.w = +document.getElementById("w").value;
      selected.h = +document.getElementById("h").value;
    }

    if (selected.type === "circle") {
      selected.r = +document.getElementById("r").value;
    }

    draw();
  });
});

function drawGrid() {
  ctx.strokeStyle = "#333";
  for (let x=0; x<canvas.width; x+=20) {
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,canvas.height);
    ctx.stroke();
  }
  for (let y=0; y<canvas.height; y+=20) {
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawGrid();

  shapes.forEach(s => {
    if (s.type === "box") {
      ctx.strokeStyle = (s === selected) ? "yellow" : "white";
      ctx.strokeRect(s.x, s.y, s.w, s.h);
    }

    if (s.type === "circle") {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.strokeStyle = (s === selected) ? "yellow" : "orange";
      ctx.stroke();

      // offset preview (toolpath style)
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r + 5, 0, Math.PI*2);
      ctx.strokeStyle = "#00ffff33";
      ctx.stroke();
    }
  });
}

function exportSVG() {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">`;

  shapes.forEach(s => {
    if (s.type === "box") {
      svg += `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" stroke="black" fill="none"/>`;
    }
    if (s.type === "circle") {
      svg += `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" stroke="black" fill="none"/>`;
    }
  });

  svg += `</svg>`;

  const blob = new Blob([svg], {type:"image/svg+xml"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "aquarium-design.svg";
  a.click();
}

draw();
