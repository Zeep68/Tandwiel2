const gears = [
    { id: 1,  src: 'images/gear25.png',        teeth: 25, x: 450, y: 150, direction:  1, alignWith: 2 },
    { id: 2,  src: 'images/gear57org.png',      teeth: 57, x: 750, y: 300, direction: -1, syncWith: 1 },
    { id: 3,  src: 'images/gear9.png',          teeth:  9, x: 850, y: 300, direction:  1, syncWith: 2,  visible: false },
    { id: 4,  src: 'images/gear12.png',         teeth: 12, x: 650, y: 450, direction: -1, syncWith: 3,  visible: false },
    { id: 5,  src: 'images/gear24-12org.png',   teeth: 24, x: 600, y: 300, direction:  1, syncWith: 4,  alignWith: 6 },
    { id: 6,  src: 'images/gear16org.png',      teeth: 16, x: 300, y: 300, direction: -1, syncWith: 5,  alignWith: 5 },
    { id: 7,  src: 'images/gear25bovenorg.png', teeth: 25, x: 450, y: 450, direction:  1, syncWith: 6,  alignWith: 8 },
    { id: 8,  src: 'images/gear189org.png',     teeth: 18, x: 600, y: 600, direction: -1, syncWith: 7 },
    { id: 9,  src: 'images/gear199org.png',     teeth: 19, x: 450, y: 300, direction:  1, syncWith: 8,  alignWith: 10 },
    { id: 10, src: 'images/gear369org.png',     teeth: 36, x: 300, y: 600, direction: -1, syncWith: 9 },
    { id: 11, src: 'images/gear9a.png',         teeth:  9, x: 850, y: 300, direction:  1, syncWith: 10, visible: false },
    { id: 12, src: 'images/gear13.png',         teeth: 13, x: 150, y: 300, direction:  1, syncWith: 11, visible: false },
    { id: 13, src: 'images/gear2113.png',       teeth: 21, x: 150, y: 300, direction:  1, syncWith: 12, alignWith: 14 },
    { id: 14, src: 'images/gear34org.png',      teeth: 34, x: 600, y: 150, direction: -1, syncWith: 13 },
    { id: 15, src: 'images/gear25linksorg.png', teeth: 25, x: 600, y: 450, direction:  1, syncWith: 14 },
];

const startAngles = {
    1:  -18.7,
    2: -124.8,
    5: -106.9,
    6:  141.0,
    7:  -68.6,
    8:  130.8,
    9:  133.4,
    10: -74.5,
    13: -55.1,
    14:  39.5,
    15: -44.8,
};

const defaultPositions = {};
gears.forEach(g => { defaultPositions[g.id] = { x: g.x, y: g.y }; });

let isRotating = false;
const rotations = {};
const drivingGearId = 1;
let speedFactor = 1;
let globalDirection = 1;
let lastTime = 0;
let animationFrame;
let canvas, ctx;

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

function gearCenter(gear) {
    const img = document.getElementById(`gear-${gear.id}`);
    const radius = (gear.teeth * 5) / 2;
    const x = parseInt(img ? img.style.left : gear.x) + radius;
    const y = parseInt(img ? img.style.top  : gear.y) + radius;
    return { x, y, radius };
}

const ALIGN_TOL = 8;

function drawLines() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gears.forEach(gear => {
        if (!gear.syncWith && !gear.alignWith) return;
        if (gear.visible === false) return;

        const alignId = gear.alignWith || gear.syncWith;
        const partner = gears.find(g => g.id === alignId);
        if (!partner) return;

        const cA = gearCenter(gear);
        const cB = gearCenter(partner);

        const currentAngle = rotations[gear.id]?.angle || 0;
        const startAngle   = startAngles[gear.id] || 0;
        const totalAngle   = currentAngle + startAngle;

        const angleToPartner = Math.atan2(cB.y - cA.y, cB.x - cA.x) * (180 / Math.PI);

        let diff = ((totalAngle - angleToPartner) % 360 + 360) % 360;
        if (diff > 180) diff = 360 - diff;
        const aligned = diff < ALIGN_TOL;

        const dist = Math.sqrt((cB.x - cA.x) ** 2 + (cB.y - cA.y) ** 2);
        const rad  = totalAngle * Math.PI / 180;
        const endX = cA.x + Math.cos(rad) * dist;
        const endY = cA.y + Math.sin(rad) * dist;

        const color = aligned ? '#ff0000' : '#1a73e8';
        ctx.strokeStyle = color;
        ctx.lineWidth   = aligned ? 4 : 2;
        ctx.globalAlpha = 0.9;

        ctx.beginPath();
        ctx.moveTo(cA.x, cA.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cB.x, cB.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    ctx.globalAlpha = 1;
}

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
        const size = gear.id === 2 ? 245 : gear.teeth * 5;
        img.style.width    = `${size}px`;
        img.style.height   = `${size}px`;
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

        if (gear.visible === false) {
            img.style.display   = 'none';
            label.style.display = 'none';
        }

        container.appendChild(img);
        container.appendChild(label);
        rotations[gear.id] = { angle: 0 };
    });

    if (canvas) container.appendChild(canvas);
    resizeCanvas();
    drawLines();
}

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

function resetPositions() {
    stopRotation();
    localStorage.removeItem('gearPositions');
    gears.forEach(gear => {
        gear.x = defaultPositions[gear.id].x;
        gear.y = defaultPositions[gear.id].y;
        rotations[gear.id] = { angle: 0 };
        const img = document.getElementById(`gear-${gear.id}`);
        if (img) {
            img.style.left      = `${gear.x}px`;
            img.style.top       = `${gear.y}px`;
            img.style.transform = 'rotate(0deg)';
        }
        const lbl = document.querySelector(`.gear-label[data-id="${gear.id}"]`);
        if (lbl) { lbl.style.left = `${gear.x}px`; lbl.style.top = `${gear.y - 20}px`; }
    });
    drawLines();
}

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
                const id  = parseInt(gearEl.id.split('-')[1], 10);
                const lbl = document.querySelector(`.gear-label[data-id="${id}"]`);
                if (lbl) { lbl.style.left = `${x}px`; lbl.style.top = `${y - 20}px`; }
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

document.getElementById('increaseSpeedButton').addEventListener('click', () => { speedFactor *= 1.2; });
document.getElementById('decreaseSpeedButton').addEventListener('click', () => { speedFactor /= 1.2; });
document.getElementById('reverseButton').addEventListener('click', () => {
    globalDirection *= -1;
    if (isRotating) { stopRotation(); startRotation(); } else calculateRotations();
});

document.addEventListener('DOMContentLoaded', () => {
    loadPositions();
    initCanvas();
    ctx = canvas.getContext('2d');
    renderGears();
    makeDraggable();
    document.getElementById('startButton').addEventListener('click', startRotation);
    document.getElementById('stopButton').addEventListener('click', stopRotation);
    document.getElementById('resetButton').addEventListener('click', resetPositions);
});
