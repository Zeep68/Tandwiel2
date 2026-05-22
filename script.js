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

let isRotating = false;
const rotations = {};
const drivingGearId = 1;
let speedFactor = 1;
let globalDirection = 1;
let lastTime = 0;
let animationFrame;
let canvas, ctx;

// ─── CANVAS OVERLAY ───────────────────────────────────────────────
function initCanvas() {
    const container = document.getElementById('gear-container');
    canvas = document.createElement('canvas');
    canvas.id = 'gear-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // klikken gaat door naar tandwielen
    canvas.style.zIndex = '100';
    container.appendChild(canvas);
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = document.getElementById('gear-container');
    canvas.width  = container.offsetWidth  || 1200;
    canvas.height = container.offsetHeight || 900;
}

// ─── CENTRUM VAN EEN TANDWIEL (pixels, incl. straal-offset) ───────
function gearCenter(gear) {
    const img = document.getElementById(`gear-${gear.id}`);
    const radius = (gear.teeth * 5) / 2;
    const x = parseInt(img ? img.style.left : gear.x) + radius;
    const y = parseInt(img ? img.style.top  : gear.y) + radius;
    return { x, y };
}

// ─── TEKEN ALLE LIJNEN ─────────────────────────────────────────────
const ALIGN_TOLERANCE_DEG = 5; // hoeveel graden afwijking = nog "rood"

function drawLines() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gears.forEach(gear => {
        if (!gear.syncWith) return; // tandwiel 1 heeft geen partner

        const partner = gears.find(g => g.id === gear.syncWith);
        if (!partner) return;

        const cA = gearCenter(gear);
        const cB = gearCenter(partner);

        // Hoek van A naar B (de "gewenste" richting)
        const angleToPartner = Math.atan2(cB.y - cA.y, cB.x - cA.x) * (180 / Math.PI);

        // Huidige rotatiehoek van dit tandwiel
        const currentAngle = (rotations[gear.id]?.angle || 0) % 360;

        // De lijn in het tandwiel staat op currentAngle graden
        // (0° = rechts, draait met klok mee in canvas-coördinaten)
        // Normaliseer verschil
        let diff = ((currentAngle - angleToPartner) % 360 + 360) % 360;
        if (diff > 180) diff = 360 - diff;

        const aligned = diff < ALIGN_TOLERANCE_DEG;

        // Bereken eindpunt van lijn: van centrum A tot centrum B
        const dx = cB.x - cA.x;
        const dy = cB.y - cA.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Draai de lijn mee met de rotatiehoek van dit tandwiel
        const rad = currentAngle * (Math.PI / 180);
        const endX = cA.x + Math.cos(rad) * dist;
        const endY = cA.y + Math.sin(rad) * dist;

        // Kleur
        ctx.strokeStyle = aligned ? '#ff0000' : '#1a73e8';
        ctx.lineWidth   = aligned ? 4 : 2;
        ctx.globalAlpha = 0.85;

        ctx.beginPath();
        ctx.moveTo(cA.x, cA.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Stipje op het eindpunt
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fillStyle = aligned ? '#ff0000' : '#1a73e8';
        ctx.fill();

        // Stipje in het centrum van partner (het "hart")
        ctx.beginPath();
        ctx.arc(cB.x, cB.y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    ctx.globalAlpha = 1;
}

// ─── RENDER ────────────────────────────────────────────────────────
function renderGears() {
    const container = document.getElementById('gear-container');
    // Verwijder alles behalve canvas
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
        label.dataset.id   = gear.id;
        label.textContent  = `ID: ${gear.id}`;
        label.style.position = 'absolute';
        label.style.left     = `${gear.x}px`;
        label.style.top      = `${gear.y - 20}px`;

        container.appendChild(img);
        container.appendChild(label);
        rotations[gear.id] = { angle: 0 };
    });

    // Canvas altijd bovenaan
    if (canvas) container.appendChild(canvas);
    resizeCanvas();
    drawLines();
}

// ─── POSITIES OPSLAAN / LADEN ──────────────────────────────────────
function savePositions() {
    const positions = {};
    gears.forEach(gear => {
        const img = document.getElementById(`gear-${gear.id}`);
        if (img) {
            positions[gear.id] = {
                x: parseInt(img.style.left, 10),
                y: parseInt(img.style.top,  10),
            };
        }
    });
    localStorage.setItem('gearPositions', JSON.stringify(positions));
}

function loadPositions() {
    const saved = JSON.parse(localStorage.getItem('gearPositions'));
    if (saved) {
        gears.forEach(gear => {
            if (saved[gear.id]) {
                gear.x = saved[gear.id].x;
                gear.y = saved[gear.id].y;
            }
        });
    }
}

// ─── ROTATIE-BEREKENINGEN ─────────────────────────────────────────
function getParentGear(gear) {
    if (gear.syncWith) return gears.find(g => g.id === gear.syncWith);
    return gears.find(g => g.id === drivingGearId);
}

function calculateRotations() {
    const drivingGear  = gears.find(g => g.id === drivingGearId);
    const drivingOmega = 2 * Math.PI * 0.04;

    rotations[drivingGear.id] = {
        ...rotations[drivingGear.id],
        omega:     drivingOmega,
        direction: drivingGear.direction * globalDirection,
    };

    gears.forEach(gear => {
        if (gear.id === drivingGearId) return;
        const parent    = getParentGear(gear);
        const parentRot = rotations[parent.id];
        const omega     = parentRot ? parentRot.omega * (parent.teeth / gear.teeth)
                                    : drivingOmega * (drivingGear.teeth / gear.teeth);
        const direction = parentRot ? parentRot.direction * -1
                                    : gear.direction * globalDirection;
        rotations[gear.id] = { ...rotations[gear.id], omega, direction };
    });
}

// ─── ANIMATIE ─────────────────────────────────────────────────────
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
            rot.angle = (rot.angle || 0) +
                (rot.omega * delta * rot.direction * speedFactor) * (180 / Math.PI);
            const img = document.getElementById(`gear-${gear.id}`);
            if (img) img.style.transform = `rotate(${rot.angle % 360}deg)`;
        }
    });

    drawLines(); // herteken lijnen elke frame

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
                if (label) { label.style.left = `${x}px`; label.style.top = `${y - 20}px`; }
                drawLines(); // herteken tijdens slepen
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
    if (isRotating) { stopRotation(); startRotation(); }
    else calculateRotations();
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
