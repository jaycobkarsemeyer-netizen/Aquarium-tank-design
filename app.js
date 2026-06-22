const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

let tool = "select";
let shapes = [];
let selected = null;
let lineStart = null;

function setTool(t) {
  tool = t;
  lineStart = null;
}

function snap(v) {
  const s = parseFloat(document.getElementById("snap").value);
  return Math.round(v / s) * s;
}

function getStroke() {
  return parseFloat(document.getElementById("stroke").value);
}

// -------------------- INPUT --------------------
canvas.addEventListener("mousedown", (e) => {
  const r = canvas.getBoundingClientRect();
  let x = snap(e.clientX - r.left);
  let y = snap(e.clientY - r.top);

  if (tool === "rect") {
    shapes.push({ type:"rect", x, y, w:120, h:80, stroke:getStroke() });
  }

  if (tool === "circle") {
    shapes.push({ type:"circle", x, y, r:40, stroke:getStroke() });
  }

  if (tool === "line") {
    if (!lineStart) {
      lineStart = { x, y };
    } else {
      shapes.push({
        type:"line",
        x1: lineStart.x,
        y1: lineStart.y,
        x2: x,
        y2: y,
        stroke:getStroke()
      });
      lineStart = null;
    }
  }

  if (tool === "select") {
    selected = shapes.find(s => hit(s, x, y));
    loadPanel();
  }

  draw();
});

// -------------------- HIT TEST --------------------
function hit(s, x, y) {
  if (s.type === "rect") {
    return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
  }
  if (s.type === "circle") {
    return Math.hypot(x - s.x, y - s.y) < s.r;
  }
  if (s.type === "line") {
    return Math.abs(
      distancePointToLine(x,y,s.x1,s.y1,s.x2,s.y2)
    ) < 6;
  }
}

function distancePointToLine(px,py,x1,y1,x2,y2){
  const A = px-x1, B = py-y1;
  const C = x2-x1, D = y2-y1;
  const dot = A*C + B*D;
  const len = C*C + D*D;
  const t = Math.max(0, Math.min(1, dot/len));
  const xx = x1 + t*C;
  const yy = y1 + t*D;
  return Math.hypot(px-xx, py-yy);
}

// -------------------- DRAW --------------------
function drawGrid() {
  ctx.strokeStyle = "#333";
  for (let x=0;x<canvas.width;x+=20){
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,canvas.height);
    ctx.stroke();
  }
  for (let y=0;y<canvas.height;y+=20){
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
    ctx.lineWidth = s.stroke || 2;

    if (s.type === "rect") {
      ctx.strokeStyle = s === selected ? "yellow" : "white";
      ctx.strokeRect(s.x,s.y,s.w,s.h);
    }

    if (s.type === "circle") {
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.strokeStyle = s === selected ? "yellow" : "orange";
      ctx.stroke();
    }

    if (s.type === "line") {
      ctx.beginPath();
      ctx.moveTo(s.x1,s.y1);
      ctx.lineTo(s.x2,s.y2);
      ctx.strokeStyle = s === selected ? "yellow" : "cyan";
      ctx.stroke();
    }
  });

  if (tool === "line" && lineStart) {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(lineStart.x,lineStart.y,4,0,Math.PI*2);
    ctx.fill();
  }
}

// -------------------- DELETE / DUP --------------------
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

// -------------------- ALIGN --------------------
function centerX() {
  if (!selected) return;
  selected.x = canvas.width/2;
  draw();
}

function centerY() {
  if (!selected) return;
  selected.y = canvas.height/2;
  draw();
}

function alignCenter() {
  centerX(); centerY();
}

function alignLeft() {
  if (!selected) return;
  selected.x = 0;
  draw();
}

function alignRight() {
  if (!selected) return;
  selected.x = canvas.width - (selected.w || selected.r*2);
  draw();
}

function alignTop() {
  if (!selected) return;
  selected.y = 0;
  draw();
}

function alignBottom() {
  if (!selected) return;
  selected.y = canvas.height - (selected.h || selected.r*2);
  draw();
}

// -------------------- PANEL --------------------
function loadPanel() {
  if (!selected) return;
  x.value = selected.x || 0;
  y.value = selected.y || 0;
  w.value = selected.w || 0;
  h.value = selected.h || 0;
  r.value = selected.r || 0;
}

["x","y","w","h","r"].forEach(id=>{
  document.getElementById(id).addEventListener("input",()=>{
    if(!selected) return;

    selected.x = +x.value;
    selected.y = +y.value;

    if(selected.type==="rect"){
      selected.w = +w.value;
      selected.h = +h.value;
    }

    if(selected.type==="circle"){
      selected.r = +r.value;
    }

    draw();
  });
});

// -------------------- EXPORT --------------------
function exportSVG() {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600">`;

  shapes.forEach(s=>{
    if(s.type==="rect"){
      svg += `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"
      stroke="black" fill="none" stroke-width="${s.stroke}"/>`;
    }

    if(s.type==="circle"){
      svg += `<circle cx="${s.x}" cy="${s.y}" r="${s.r}"
      stroke="black" fill="none" stroke-width="${s.stroke}"/>`;
    }

    if(s.type==="line"){
      svg += `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}"
      stroke="black" stroke-width="${s.stroke}"/>`;
    }
  });

  svg += `</svg>`;

  const blob = new Blob([svg],{type:"image/svg+xml"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="aquarium.svg";
  a.click();
}

draw();
