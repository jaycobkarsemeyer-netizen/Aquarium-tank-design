const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 650;

// 📍 origin is top-left (like VCarve sheet)
const origin = { x: 0, y: 0 };

let tool = "select";
let shapes = [];
let selected = null;
let dragging = false;
let offset = {x:0,y:0};
let lineStart = null;

function setTool(t){
  tool = t;
  selected = null;
  lineStart = null;
}

// ---------------- SNAP ----------------
function snap(v){
  const s = +document.getElementById("snap").value;
  return Math.round(v / s) * s;
}

// ---------------- MOUSE POSITION ----------------
function getMouse(e){
  const r = canvas.getBoundingClientRect();
  return {
    x: snap(e.clientX - r.left),
    y: snap(e.clientY - r.top)
  };
}

// ---------------- MOUSE DOWN ----------------
canvas.addEventListener("mousedown", (e)=>{
  const p = getMouse(e);

  // SELECT TOOL (drag move)
  if(tool === "select"){
    selected = shapes.find(s => hit(s,p.x,p.y));

    if(selected){
      dragging = true;
      offset.x = p.x - selected.x;
      offset.y = p.y - selected.y;
    }

    return;
  }

  // RECT
  if(tool === "rect"){
    shapes.push({
      type:"rect",
      x:p.x,
      y:p.y,
      w:120,
      h:80,
      stroke:getStroke()
    });
  }

  // CIRCLE
  if(tool === "circle"){
    shapes.push({
      type:"circle",
      x:p.x,
      y:p.y,
      r:40,
      stroke:getStroke()
    });
  }

  // LINE (2 click system)
  if(tool === "line"){
    if(!lineStart){
      lineStart = p;
    } else {
      shapes.push({
        type:"line",
        x1:lineStart.x,
        y1:lineStart.y,
        x2:p.x,
        y2:p.y,
        stroke:getStroke()
      });
      lineStart = null;
    }
  }

  draw();
});

// ---------------- MOUSE MOVE (DRAGGING) ----------------
canvas.addEventListener("mousemove",(e)=>{
  const p = getMouse(e);

  if(dragging && selected){
    selected.x = p.x - offset.x;
    selected.y = p.y - offset.y;
    draw();
  }
});

// ---------------- MOUSE UP ----------------
canvas.addEventListener("mouseup",()=>{
  dragging = false;
});

// ---------------- HIT TEST ----------------
function hit(s,x,y){
  if(s.type==="rect"){
    return x>=s.x && x<=s.x+s.w && y>=s.y && y<=s.y+s.h;
  }
  if(s.type==="circle"){
    return Math.hypot(x-s.x,y-s.y)<s.r;
  }
  if(s.type==="line"){
    return false;
  }
}

// ---------------- STROKE ----------------
function getStroke(){
  return +document.getElementById("stroke").value;
}

// ---------------- GRID (VCARVE STYLE SHEET) ----------------
function drawGrid(){
  ctx.strokeStyle = "#ddd";

  for(let x=0;x<canvas.width;x+=20){
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x,canvas.height);
    ctx.stroke();
  }

  for(let y=0;y<canvas.height;y+=20){
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(canvas.width,y);
    ctx.stroke();
  }

  // origin marker
  ctx.fillStyle="red";
  ctx.fillRect(0,0,6,6);
}

// ---------------- DRAW ----------------
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawGrid();

  shapes.forEach(s=>{
    ctx.lineWidth = s.stroke || 2;

    if(s.type==="rect"){
      ctx.strokeStyle = (s===selected)?"blue":"black";
      ctx.strokeRect(s.x,s.y,s.w,s.h);
    }

    if(s.type==="circle"){
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.strokeStyle = (s===selected)?"blue":"black";
      ctx.stroke();
    }

    if(s.type==="line"){
      ctx.beginPath();
      ctx.moveTo(s.x1,s.y1);
      ctx.lineTo(s.x2,s.y2);
      ctx.strokeStyle="black";
      ctx.stroke();
    }
  });
}

draw();
