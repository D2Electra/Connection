const lico = document.getElementById('lico');
const svg = document.getElementById('lineCanvas');
const clones = [];
const isTouch = window.matchMedia('(pointer: coarse)').matches;
const cloneSound = new Audio('music/1.wav');

// === Инструкция ===
let instructionRevealed = false;
const instructionBox = document.createElement('div');
instructionBox.textContent = 'ВСЁ НАЧИНАЕТСЯ С «Я»';
Object.assign(instructionBox.style, {
  position: 'fixed', top: '0', left: '0', width: '100%',
  textAlign: 'center', fontSize: '20px',
  fontFamily: 'monospace', fontWeight: 'bold',
  background: 'white', zIndex: '1000', padding: '12px 0',
  textTransform: 'uppercase'
});
document.body.appendChild(instructionBox);

function revealFullInstruction() {
  if (instructionRevealed) return;
  instructionRevealed = true;
  instructionBox.innerHTML = `
    ЭТО НЕ СИМУЛЯТОР ОБЩЕНИЯ<br>
    ЭТО СИМУЛЯТОР ЕГО ПОТЕРИ<br><br>
    ТЫ ПОЯВИЛСЯ<br>
    ТЕБЯ МОЖНО ОТПУСТИТЬ<br>
    ТЕБЯ МОЖНО УДЕРЖАТЬ<br>
    МОЖНО И ЗАБЫТЬ<br>
    ТЫ ТОЖЕ МОЖЕШЬ НАЧАТЬ
  `;
  setTimeout(() => instructionBox.remove(), 25000);
}

// === Событие на lico ===
lico.addEventListener('mousedown', handleCreateClone);
lico.addEventListener('touchstart', handleCreateClone, { passive: false });

function handleCreateClone(e) {
  e.preventDefault();
  if (!instructionRevealed) revealFullInstruction();
  createClone(lico);
}

// === Создание клона ===
function createClone(originElement) {
  try { cloneSound.currentTime = 0; cloneSound.play(); } catch {}

  const originCenter = getCenter(originElement);

  const clone = document.createElement('img');
  clone.src = 'images/lico.png';
  Object.assign(clone.style, {
    position: 'absolute',
    width: isTouch ? '28vw' : '200px',
    left: `${originCenter.x}px`,
    top: `${originCenter.y}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: '1001',
    cursor: 'pointer'
  });
  document.body.appendChild(clone);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('stroke', 'black');
  line.setAttribute('stroke-width', '5');
  svg.appendChild(line);

  const timerLabel = document.createElement('div');
  timerLabel.textContent = '...';
  Object.assign(timerLabel.style, {
    position: 'absolute',
    fontSize: '16px',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    background: 'white',
    padding: '2px 6px',
    border: '1px solid black',
    borderRadius: '4px',
    zIndex: '1002'
  });
  document.body.appendChild(timerLabel);

  const label = document.createElement('div');
  label.textContent = 'ТЫ';
  Object.assign(label.style, {
    position: 'absolute',
    fontSize: '14px',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    zIndex: '1002'
  });
  document.body.appendChild(label);

  const data = {
    clone,
    line,
    origin: originElement,
    label,
    timerLabel,
    isDragging: false,
    draggingOffset: { x: 0, y: 0 },
    targetX: originCenter.x,
    targetY: originCenter.y,
    lastUpdate: Date.now(),
    timer: 30000
  };

  clones.push(data);
  attachEvents(data);
  updateLine(line, originElement, clone);
}

// === Движение и касание ===
function attachEvents(data) {
  const { clone } = data;
  let moved = false;

  clone.addEventListener('mousedown', start);
  clone.addEventListener('touchstart', start, { passive: false });

  function start(e) {
    e.preventDefault();
    moved = false;
    const isTouch = e.type === 'touchstart';
    const x = isTouch ? e.touches[0].clientX : e.clientX;
    const y = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = clone.getBoundingClientRect();
    data.draggingOffset.x = x - rect.left;
    data.draggingOffset.y = y - rect.top;
    data.isDragging = true;

    const move = ev => {
      const mx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const my = ev.touches ? ev.touches[0].clientY : ev.clientY;
      data.targetX = mx - data.draggingOffset.x + clone.offsetWidth / 2;
      data.targetY = my - data.draggingOffset.y + clone.offsetHeight / 2;
      moved = true;
    };

    const stop = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stop);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', stop);
      data.isDragging = false;
      if (!moved) createClone(clone);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchmove', move);
    document.addEventListener('touchend', stop);
  }
}

// === Анимация ===
function getCenter(elem) {
  const rect = elem.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function updateLine(line, from, to) {
  const p1 = getCenter(from);
  const p2 = getCenter(to);
  line.setAttribute('x1', p1.x);
  line.setAttribute('y1', p1.y);
  line.setAttribute('x2', p2.x);
  line.setAttribute('y2', p2.y);
}

function animate() {
  const now = Date.now();
  for (const data of clones) {
    const { clone, line, origin, label, timerLabel } = data;
    const currentX = parseFloat(clone.style.left);
    const currentY = parseFloat(clone.style.top);
    const vx = (data.targetX - currentX) * 0.1;
    const vy = (data.targetY - currentY) * 0.1;
    const newX = currentX + vx;
    const newY = currentY + vy;
    clone.style.left = `${newX}px`;
    clone.style.top = `${newY}px`;

    updateLine(line, origin, clone);

    label.style.left = `${newX}px`;
    label.style.top = `${newY + 25}px`;
    timerLabel.style.left = `${newX}px`;
    timerLabel.style.top = `${newY - 40}px`;

    const elapsed = now - data.lastUpdate;
    const dist = Math.hypot(newX - getCenter(origin).x, newY - getCenter(origin).y);
    const decayRate = 1 + dist / 200;
    data.timer -= elapsed * decayRate;
    data.lastUpdate = now;

    if (data.isDragging) {
      data.timer = 30000;
    }

    const remaining = Math.max(0, data.timer);
    timerLabel.textContent = (remaining / 1000).toFixed(1);
  }

  requestAnimationFrame(animate);
}

animate();
