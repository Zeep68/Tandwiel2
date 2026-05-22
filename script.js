const gears = [
    { id: 1,  src: 'images/gear25.png',        teeth: 25, x: 450, y: 150, direction:  1 },
    { id: 2,  src: 'images/gear57org.png',      teeth: 57, x: 750, y: 300, direction: -1, syncWith: 1 },
    { id: 3,  src: 'images/gear9.png',          teeth:  9, x: 850, y: 300, direction:  1, syncWith: 2 },
    { id: 4,  src: 'images/gear12.png',         teeth: 12, x: 650, y: 450, direction: -1, syncWith: 3 },
    { id: 5,  src: 'images/gear24-12org.png',   teeth: 24, x: 600, y: 300, direction:  1, syncWith: 4 },
    { id: 6,  src: 'images/gear16org.png',      teeth: 16, x: 300, y: 300, direction: -1, syncWith: 5 },
    { id: 7,  src: 'images/gear25bovenorg.png', teeth: 25, x: 450, y: 450, direction:  1, syncWith: 6 },
    { id: 8,  src: 'images/gear189org.png',     teeth: 18, x: 600, y: 600, direction: -1, syncWith: 7 },
    { id: 9,  src: 'images/gear199org.png',     teeth: 19, x: 450, y: 300, direction:  1, syncWith: 8 },
    { id: 10, src: 'images/gear369org.png',     teeth: 36, x: 300, y: 600, direction: -1, syncWith: 9 },
    { id: 11, src: 'images/gear9a.png',         teeth:  9, x: 850, y: 300, direction:  1, syncWith: 10 },
    { id: 12, src: 'images/gear13.png',         teeth: 13, x: 150, y: 300, direction:  1, syncWith: 11 },
    { id: 13, src: 'images/gear2113.png',       teeth: 21, x: 150, y: 300, direction:  1, syncWith: 12 },
    { id: 14, src: 'images/gear34org.png',      teeth: 34, x: 600, y: 150, direction: -1, syncWith: 13 },
    { id: 15, src: 'images/gear25linksorg.png', teeth: 25, x: 600, y: 450, direction:  1, syncWith: 14 },
];

// Starthoek van de pijl in elke afbeelding (0° = rechts, met klok mee)
// Automatisch berekend uit de afbeeldingen
const startAngles = {
    1:  63.9,   // gear251st
    2:  80.5,   // gear57l
    3:   0.0,   // gear9 (onbekend, default)
    4:   0.1,   // gear252de
    5: 140.7,   // gear24-12
    6:   0.0,   // gear16 (onbekend, default)
    7:  66.4,   // gear25boven
    8:  65.1,   // gear189org
    9:  81.6,   // gear199org
    10: 86.7,   // gear369org
    11:  0.0,   // gear9a (onbekend, default)
    12:  0.0,   // gear13 (onbekend, default)
    13: 109.9,  // gear2113
    14: 124.1,  // gear34org
    15:  0.0,   // gear25links (onbekend, default)
};

let isRotating = false;
const rotations = {};
const drivingGearId = 1;
let speedFactor = 1;
let globalDirection = 1;
let lastTime = 0;
let animationFrame;
let canvas, ctx;

// ─── CANVAS ───────────────────────────────────────────────────────
function initCanvas() {
    const container = document.getElementById('gear-container');
    canvas = document.createElement('canvas');
    canvas.id = 'gear-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100';
    container.appendChild(canvas);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.getElementById('gear-container');
    canvas.width  = container.offsetWidth  || 1400;
    canvas.height = container.offsetHeight || 1000;
}

// ─── CENTRUM ──────────────────────────────────────────────────────
function gearCenter(gear) {
    const img = document.getElementById(`gear-${gear.id}`);
    const radius = (gear.teeth * 5) / 2;
    const x = parseInt(img ? img.style.left : gear.x) + radius;
    const y = parseInt(img ? img.style.top  : gear.y) + radius;
    return { x, y, radius };
}

// ─── TEKEN LIJNEN ─────────────────────────────────────────────────
const ALIGN_TOL = 8; // graden tolerantie voor rood worden

function drawLines() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gears.forEach(gear => {
        if (!gear.syncWith) return;

        const partner = gears.find(g => g.id === gear.syncWith);
        if (!partner) return;

        const cA = gearCenter(gear);
        const cB = gearCenter(partner);

        // Huidige rotatiehoek + starthoek van pijl in afbeelding
        const currentAngle = (rotations[gear.id]?.angle || 0);
        const startAngle   = startAngles[gear.id] || 0;
        const totalAngle   = currentAngle + startAngle; // in graden

        // Richting van A naar B (de gewenste uitlijnhoek)
        const angleToPartner = Math.atan2(cB.y - cA.y, cB.x - cA.x) * (180 / Math.PI);

        // Verschil tussen huidige pijlhoek en de richting naar partner
        let diff = ((totalAngle - angleToPartner) % 360 + 360) % 360;
        if (diff > 180) diff = 360 - diff;
        const aligned = diff < ALIGN_TOL;

        // Lijn van centrum A → richting van pijl, lengte = afstand tot centrum B
        const dist = Math.sqrt((cB.x-cA.x)**2 + (cB.y-cA.y)**2);
        const rad  = totalAngle * Math.PI / 180;
        const endX = cA.x + Math.cos(rad) * dist;
        const endY = cA.y + Math.sin(rad) * dist;

        // Kleur
        const color = aligned ? '#ff0000' : '#1a73e8';
        ctx.strokeStyle = color;
        ctx.lineWidth   = aligned ? 4 : 2;
        ctx.globalAlpha = 0.9;

        // Lijn middelpunt A → eindpunt
        ctx.beginPath();
        ctx.moveTo(cA.x, cA.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Punt op eindpunt van lijn
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Oranje cirkel op centrum van partner (het "hart")
        ctx.beginPath();
        ctx.arc(cB.x, cB.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    ctx.globalAlpha = 1;
}

// ─── RENDER ───────────────────────────────────────────────────────
function renderGears() {
    const container = document.getElementById('gear-container');
    Array.from(container.children).forEach(c => {
        if (c.id !== 'gear-canvas') container.removeChild(c);
    });

    gears.forEach(gear => {
        const img = document.createElement('img');
        img.id = `gear-${gear.id}`;
        img.src = gear.src;
        img.classList.add('gear');
        img.style.width    = `${gear.teeth * 5}px`;
        img.style.height   = `${gear.teeth * 5}px`;
        img.style.left     = `${gear.x}px`;
        img.style.top      = `${gear.y}px`;
        img.style.position = 'absolute';

        const label = document.createElement('span');
        label.classList.add('gear-label');
        label.dataset.id  = gear.id;
        label.textContent = `ID: ${gear.id}`;
        label.style.position = 'absolute';
        label.style.left     = `${gear.x}px`;
        label.style.top      = `${gear.y - 20}px`;
        label.style.zIndex   = '50';

        container.appendChild(img);
        container.appendChild(label);
        rotations[gear.id] = { angle: 0 };
    });

    if (canvas) container.appendChild(canvas);
    resizeCanvas();
    drawLines();
}

// ─── POSITIES ─────────────────────────────────────────────────────
function savePositions() {
    const positions = {};
    gears.forEach(gear => {
        const img = document.getElementById(`gear-${gear.id}`);
        if (img) positions[gear.id] = {
            x: parseInt(img.style.left, 10),
            y: parseInt(img.style.top,  10),
        };
    });
    localStorage.setItem('gearPositions', JSON.stringify(positions));
}

function loadPositions() {
    const saved = JSON.parse(localStorage.getItem('gearPositions'));
    if (saved) gears.forEach(gear => {
        if (saved[gear.id]) { gear.x = saved[gear.id].x; gear.y = saved[gear.id].y; }
    });
}

// ─── ROTATIE ──────────────────────────────────────────────────────
function getParentGear(gear) {
    if (gear.syncWith) return gears.find(g => g.id === gear.syncWith);
    return gears.find(g => g.id === drivingGearId);
}

function calculateRotations() {
    const driving = gears.find(g => g.id === drivingGearId);
    const omega0  = 2 * Math.PI * 0.04;
    rotations[driving.id] = { ...rotations[driving.id], omega: omega0, direction: driving.direction * globalDirection };

    gears.forEach(gear => {
        if (gear.id === drivingGearId) return;
        const parent = getParentGear(gear);
        const pr     = rotations[parent.id];
        const omega  = pr ? pr.omega * (parent.teeth / gear.teeth) : omega0 * (driving.teeth / gear.teeth);
        const dir    = pr ? pr.direction * -1 : gear.direction * globalDirection;
        rotations[gear.id] = { ...rotations[gear.id], omega, direction: dir };
    });
}

function startRotation() {
    isRotating = true;
    calculateRotations();
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(animate);
    gears.forEach(gear => {
        const img = document.getElementById(`gear-${gear.id}`);
        if (img) img.style.transform = `rotate(${rotations[gear.id].angle || 0}deg)`;
    });
}

function stopRotation() {
    isRotating = false;
    cancelAnimationFrame(animationFrame);
}

function animate(time) {
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    gears.forEach(gear => {
        const rot = rotations[gear.id];
        if (rot) {
            rot.angle = (rot.angle || 0) + (rot.omega * delta * rot.direction * speedFactor) * (180 / Math.PI);
            const img = document.getElementById(`gear-${gear.id}`);
            if (img) img.style.transform = `rotate(${rot.angle % 360}deg)`;
        }
    });
    drawLines();
    if (isRotating) animationFrame = requestAnimationFrame(animate);
}

// ─── DRAGGABLE ────────────────────────────────────────────────────
function makeDraggable() {
    document.querySelectorAll('.gear').forEach(gearEl => {
        let offsetX, offsetY;
        gearEl.addEventListener('mousedown', e => {
            const rect = gearEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            const move = event => {
                const x = event.clientX - offsetX;
                const y = event.clientY - offsetY;
                gearEl.style.left = `${x}px`;
                gearEl.style.top  = `${y}px`;
                const id    = parseInt(gearEl.id.split('-')[1], 10);
                const label = document.querySelector(`.gear-label[data-id="${id}"]`);
                if (label) { label.style.left = `${x}px`; label.style.top = `${y-20}px`; }
                drawLines();
            };
            const stop = () => {
                savePositions();
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup',   stop);
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup',   stop);
        });
    });
}

// ─── KNOPPEN ──────────────────────────────────────────────────────
document.getElementById('increaseSpeedButton').addEventListener('click', () => { speedFactor *= 1.2; });
document.getElementById('decreaseSpeedButton').addEventListener('click', () => { speedFactor /= 1.2; });
document.getElementById('reverseButton').addEventListener('click', () => {
    globalDirection *= -1;
    if (isRotating) { stopRotation(); startRotation(); } else calculateRotations();
});

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadPositions();
    initCanvas();
    ctx = canvas.getContext('2d');
    renderGears();
    makeDraggable();
    document.getElementById('startButton').addEventListener('click', startRotation);
    document.getElementById('stopButton').addEventListener('click', stopRotation);
});
