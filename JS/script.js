const gears = [
    { id: 1, src: 'images/gear25.png', teeth: 25, x: 450, y: 150, direction: 1 }, // Drive gear
    { id: 2, src: 'images/gear57org.png', teeth: 57, x: 750, y: 300, direction: -1 },
    { id: 3, src: 'images/gear9.png', teeth: 9, x: 850, y: 300, direction: 1, syncWith: 2 }, // Nu met syncWith voor consistentie
    { id: 4, src: 'images/gear12.png', teeth: 12, x: 650, y: 450, direction: -1, syncWith: 3 },
    { id: 5, src: 'images/gear24-12org.png', teeth: 24, x: 600, y: 300, direction: 1, syncWith: 4 },
    { id: 6, src: 'images/gear16org.png', teeth: 16, x: 300, y: 300, direction: -1, syncWith: 5 },
    { id: 7, src: 'images/gear25bovenorg.png', teeth: 25, x: 450, y: 450, direction: 1, syncWith: 6 },
    { id: 8, src: 'images/gear189org.png', teeth: 18, x: 600, y: 600, direction: -1, syncWith: 7 },
    { id: 9, src: 'images/gear199org.png', teeth: 19, x: 450, y: 300, direction: 1, syncWith: 8 },
    { id: 10, src: 'images/gear369org.png', teeth: 36, x: 300, y: 600, direction: -1, syncWith: 9 },
    { id: 11, src: 'images/gear9a.png', teeth: 9, x: 850, y: 300, direction: 1, syncWith: 10 },
    { id: 12, src: 'images/gear13.png', teeth: 13, x: 150, y: 300, direction: 1, syncWith: 11 },
    { id: 13, src: 'images/gear2113.png', teeth: 21, x: 150, y: 300, direction: 1, syncWith: 12 },
    { id: 14, src: 'images/gear34org.png', teeth: 34, x: 600, y: 150, direction: -1, syncWith: 13 },
    { id: 15, src: 'images/gear25linksorg.png', teeth: 25, x: 600, y: 450, direction: 1, syncWith: 14 },
];

let isRotating = false;
const rotations = {};
const drivingGearId = 1;
let speedFactor = 1; // Factor voor rotatiesnelheid
let globalDirection = 1; // 1 voor normaal, -1 voor omgekeerd
let lastTime = 0;
let animationFrame;

function renderGears() {
    const container = document.getElementById('gear-container');
    container.innerHTML = ''; // Reset container

    gears.forEach(gear => {
        const img = document.createElement('img');
        img.id = `gear-${gear.id}`;
        img.src = gear.src;
        img.classList.add('gear');
        img.style.width = `${gear.teeth * 5}px`;
        img.style.height = `${gear.teeth * 5}px`;
        img.style.left = `${gear.x}px`;
        img.style.top = `${gear.y}px`;
        img.style.position = 'absolute';

        const label = document.createElement('span');
        label.classList.add('gear-label');
        label.dataset.id = gear.id;
        label.textContent = `ID: ${gear.id}`;
        label.style.position = 'absolute';
        label.style.left = `${gear.x}px`;
        label.style.top = `${gear.y - 20}px`;

        container.appendChild(img);
        container.appendChild(label);

        rotations[gear.id] = { angle: 0 }; // Initialiseer rotatiehoek (in graden)
    });

    console.log('Alle tandwielen zijn gerenderd');
}

function savePositions() {
    const positions = {};
    gears.forEach(gear => {
        const img = document.getElementById(`gear-${gear.id}`);
        if (img) {
            positions[gear.id] = {
                x: parseInt(img.style.left, 10),
                y: parseInt(img.style.top, 10),
            };
        }
    });
    localStorage.setItem('gearPositions', JSON.stringify(positions));
    console.log('Posities opgeslagen:', positions);
}

function loadPositions() {
    const savedPositions = JSON.parse(localStorage.getItem('gearPositions'));
    if (savedPositions) {
        gears.forEach(gear => {
            if (savedPositions[gear.id]) {
                gear.x = savedPositions[gear.id].x;
                gear.y = savedPositions[gear.id].y;
            }
        });
        console.log('Posities geladen:', savedPositions);
    } else {
        console.log('Geen opgeslagen posities gevonden.');
    }
}

function getParentGear(gear) {
    if (gear.syncWith) {
        return gears.find(g => g.id === gear.syncWith);
    }
    // Val terug op driving gear als geen syncWith
    return gears.find(g => g.id === drivingGearId);
}

function calculateRotations() {
    console.log('Rotatieberekeningen starten...');
    const drivingGear = gears.find(gear => gear.id === drivingGearId);
    const drivingTeeth = drivingGear.teeth;
    const drivingOmega = 2 * Math.PI * 0.04; // Hoeksnelheid van aandrijftandwiel (rad/s)

    // Eerst driving gear instellen met globale richting
    rotations[drivingGear.id] = {
        ...rotations[drivingGear.id],
        omega: drivingOmega,
        direction: drivingGear.direction * globalDirection,
    };

    gears.forEach(gear => {
        if (gear.id === drivingGearId) return; // Driving al gedaan

        const img = document.getElementById(`gear-${gear.id}`);
        if (!img) {
            console.log(`Tandwiel ID: ${gear.id} heeft geen bijbehorende afbeelding`);
            return;
        }

        let omega, direction;

        // Algemene berekening op basis van parent (syncWith of vorige in keten)
        const parentGear = getParentGear(gear);
        const parentRot = rotations[parentGear.id];

        if (parentRot) {
            omega = parentRot.omega * (parentGear.teeth / gear.teeth);
            direction = parentRot.direction * -1; // Altijd tegenovergesteld aan parent voor logische keten
        } else {
            // Fallback voor losse tandwielen
            omega = drivingOmega * (drivingTeeth / gear.teeth);
            direction = gear.direction * globalDirection;
        }

        const radius = (gear.teeth * 5) / 2; // Straal in pixels
        const circumferenceSpeed = omega * radius; // Omtreksnelheid (pixels/s)

        // Bewaar rotatiegegevens
        rotations[gear.id] = { ...rotations[gear.id], omega, direction, circumferenceSpeed };

        // Log informatie in de console
        console.log(`Tandwiel ${gear.id}:`);
        console.log(`  Rotatiesnelheid: ${omega.toFixed(2)} rad/s`);
        console.log(`  Omtreksnelheid: ${circumferenceSpeed.toFixed(2)} pixels/s`);
        console.log(`  Richting: ${direction > 0 ? 'Met de klok mee' : 'Tegen de klok in'}`);
    });
}

function startRotation() {
    isRotating = true;
    calculateRotations(); // Bereken omega en direction (inclusief globalDirection)

    // Start de JS-animatie
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(animate);

    // Stel initiële transforms in (van opgeslagen hoeken)
    gears.forEach(gear => {
        const img = document.getElementById(`gear-${gear.id}`);
        const angle = rotations[gear.id].angle || 0;
        img.style.transform = `rotate(${angle}deg)`;
    });
}

function stopRotation() {
    isRotating = false;
    cancelAnimationFrame(animationFrame);
    // Hoeken zijn al up-to-date in rotations[id].angle, geen extra actie nodig
}

function animate(time) {
    const delta = (time - lastTime) / 1000; // Delta tijd in seconden
    lastTime = time;

    gears.forEach(gear => {
        const rot = rotations[gear.id];
        if (rot) {
            // Update hoek incrementeel (in graden)
            rot.angle = (rot.angle || 0) + (rot.omega * delta * rot.direction * speedFactor) * (180 / Math.PI);
            const img = document.getElementById(`gear-${gear.id}`);
            img.style.transform = `rotate(${rot.angle % 360}deg)`;
        }
    });

    if (isRotating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

document.getElementById('increaseSpeedButton').addEventListener('click', () => {
    speedFactor *= 1.2; // Verhoog snelheid met 20%
    // Geen update nodig, want animate gebruikt speedFactor dynamisch
});

document.getElementById('decreaseSpeedButton').addEventListener('click', () => {
    speedFactor /= 1.2; // Verlaag snelheid met 20%
    // Geen update nodig, want animate gebruikt speedFactor dynamisch
});

document.getElementById('reverseButton').addEventListener('click', () => {
    globalDirection *= -1; // Flip richting
    if (isRotating) {
        stopRotation();
        startRotation(); // Herstart om nieuwe richting toe te passen
    } else {
        calculateRotations(); // Update directions zelfs als gestopt, voor consistente staat
    }
});

function makeDraggable() {
    const gears = document.querySelectorAll('.gear');
    gears.forEach(gear => {
        let offsetX, offsetY;

        gear.addEventListener('mousedown', (e) => {
            const rect = gear.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            const moveGear = (event) => {
                const x = event.clientX - offsetX;
                const y = event.clientY - offsetY;

                gear.style.left = `${x}px`;
                gear.style.top = `${y}px`;

                const gearId = parseInt(gear.id.split('-')[1], 10);
                const label = document.querySelector(`.gear-label[data-id="${gearId}"]`);
                if (label) {
                    label.style.left = `${x}px`;
                    label.style.top = `${y - 20}px`;
                }
            };

            const stopMove = () => {
                savePositions();
                document.removeEventListener('mousemove', moveGear);
                document.removeEventListener('mouseup', stopMove);
            };

            document.addEventListener('mousemove', moveGear);
            document.addEventListener('mouseup', stopMove);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadPositions();
    renderGears();
    makeDraggable();

    document.getElementById('startButton').addEventListener('click', startRotation);
    document.getElementById('stopButton').addEventListener('click', stopRotation);
});const gears = [
    { id: 1, src: 'images/gear25.png', teeth: 25, x: 450, y: 150, direction: 1 }, // Drive gear
    { id: 2, src: 'images/gear57org.png', teeth: 57, x: 750, y: 300, direction: -1 },
    { id: 3, src: 'images/gear9.png', teeth: 9, x: 850, y: 300, direction: 1, syncWith: 2 }, // Nu met syncWith voor consistentie
    { id: 4, src: 'images/gear12.png', teeth: 12, x: 650, y: 450, direction: -1, syncWith: 3 },
    { id: 5, src: 'images/gear24-12org.png', teeth: 24, x: 600, y: 300, direction: 1, syncWith: 4 },
    { id: 6, src: 'images/gear16org.png', teeth: 16, x: 300, y: 300, direction: -1, syncWith: 5 },
    { id: 7, src: 'images/gear25bovenorg.png', teeth: 25, x: 450, y: 450, direction: 1, syncWith: 6 },
    { id: 8, src: 'images/gear189org.png', teeth: 18, x: 600, y: 600, direction: -1, syncWith: 7 },
    { id: 9, src: 'images/gear199org.png', teeth: 19, x: 450, y: 300, direction: 1, syncWith: 8 },
    { id: 10, src: 'images/gear369org.png', teeth: 36, x: 300, y: 600, direction: -1, syncWith: 9 },
    { id: 11, src: 'images/gear9a.png', teeth: 9, x: 850, y: 300, direction: 1, syncWith: 10 },
    { id: 12, src: 'images/gear13.png', teeth: 13, x: 150, y: 300, direction: 1, syncWith: 11 },
    { id: 13, src: 'images/gear2113.png', teeth: 21, x: 150, y: 300, direction: 1, syncWith: 12 },
    { id: 14, src: 'images/gear34org.png', teeth: 34, x: 600, y: 150, direction: -1, syncWith: 13 },
    { id: 15, src: 'images/gear25linksorg.png', teeth: 25, x: 600, y: 450, direction: 1, syncWith: 14 },
];

let isRotating = false;
const rotations = {};
const drivingGearId = 1;
let speedFactor = 1; // Factor voor rotatiesnelheid
let globalDirection = 1; // 1 voor normaal, -1 voor omgekeerd
let lastTime = 0;
let animationFrame;

function renderGears() {
    const container = document.getElementById('gear-container');
    container.innerHTML = ''; // Reset container

    gears.forEach(gear => {
        const img = document.createElement('img');
        img.id = `gear-${gear.id}`;
        img.src = gear.src;
        img.classList.add('gear');
        img.style.width = `${gear.teeth * 5}px`;
        img.style.height = `${gear.teeth * 5}px`;
        img.style.left = `${gear.x}px`;
        img.style.top = `${gear.y}px`;
        img.style.position = 'absolute';

        const label = document.createElement('span');
        label.classList.add('gear-label');
        label.dataset.id = gear.id;
        label.textContent = `ID: ${gear.id}`;
        label.style.position = 'absolute';
        label.style.left = `${gear.x}px`;
        label.style.top = `${gear.y - 20}px`;

        container.appendChild(img);
        container.appendChild(label);

        rotations[gear.id] = { angle: 0 }; // Initialiseer rotatiehoek (in graden)
    });

    console.log('Alle tandwielen zijn gerenderd');
}

function savePositions() {
    const positions = {};
    gears.forEach(gear => {
        const img = document.getElementById(`gear-${gear.id}`);
        if (img) {
            positions[gear.id] = {
                x: parseInt(img.style.left, 10),
                y: parseInt(img.style.top, 10),
            };
        }
    });
    localStorage.setItem('gearPositions', JSON.stringify(positions));
    console.log('Posities opgeslagen:', positions);
}

function loadPositions() {
    const savedPositions = JSON.parse(localStorage.getItem('gearPositions'));
    if (savedPositions) {
        gears.forEach(gear => {
            if (savedPositions[gear.id]) {
                gear.x = savedPositions[gear.id].x;
                gear.y = savedPositions[gear.id].y;
            }
        });
        console.log('Posities geladen:', savedPositions);
    } else {
        console.log('Geen opgeslagen posities gevonden.');
    }
}

function getParentGear(gear) {
    if (gear.syncWith) {
        return gears.find(g => g.id === gear.syncWith);
    }
    // Val terug op driving gear als geen syncWith
    return gears.find(g => g.id === drivingGearId);
}

function calculateRotations() {
    console.log('Rotatieberekeningen starten...');
    const drivingGear = gears.find(gear => gear.id === drivingGearId);
    const drivingTeeth = drivingGear.teeth;
    const drivingOmega = 2 * Math.PI * 0.04; // Hoeksnelheid van aandrijftandwiel (rad/s)

    // Eerst driving gear instellen met globale richting
    rotations[drivingGear.id] = {
        ...rotations[drivingGear.id],
        omega: drivingOmega,
        direction: drivingGear.direction * globalDirection,
    };

    gears.forEach(gear => {
        if (gear.id === drivingGearId) return; // Driving al gedaan

        const img = document.getElementById(`gear-${gear.id}`);
        if (!img) {
            console.log(`Tandwiel ID: ${gear.id} heeft geen bijbehorende afbeelding`);
            return;
        }

        let omega, direction;

        // Algemene berekening op basis van parent (syncWith of vorige in keten)
        const parentGear = getParentGear(gear);
        const parentRot = rotations[parentGear.id];

        if (parentRot) {
            omega = parentRot.omega * (parentGear.teeth / gear.teeth);
            direction = parentRot.direction * -1; // Altijd tegenovergesteld aan parent voor logische keten
        } else {
            // Fallback voor losse tandwielen
            omega = drivingOmega * (drivingTeeth / gear.teeth);
            direction = gear.direction * globalDirection;
        }

        const radius = (gear.teeth * 5) / 2; // Straal in pixels
        const circumferenceSpeed = omega * radius; // Omtreksnelheid (pixels/s)

        // Bewaar rotatiegegevens
        rotations[gear.id] = { ...rotations[gear.id], omega, direction, circumferenceSpeed };

        // Log informatie in de console
        console.log(`Tandwiel ${gear.id}:`);
        console.log(`  Rotatiesnelheid: ${omega.toFixed(2)} rad/s`);
        console.log(`  Omtreksnelheid: ${circumferenceSpeed.toFixed(2)} pixels/s`);
        console.log(`  Richting: ${direction > 0 ? 'Met de klok mee' : 'Tegen de klok in'}`);
    });
}

function startRotation() {
    isRotating = true;
    calculateRotations(); // Bereken omega en direction (inclusief globalDirection)

    // Start de JS-animatie
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(animate);

    // Stel initiële transforms in (van opgeslagen hoeken)
    gears.forEach(gear => {
        const img = document.getElementById(`gear-${gear.id}`);
        const angle = rotations[gear.id].angle || 0;
        img.style.transform = `rotate(${angle}deg)`;
    });
}

function stopRotation() {
    isRotating = false;
    cancelAnimationFrame(animationFrame);
    // Hoeken zijn al up-to-date in rotations[id].angle, geen extra actie nodig
}

function animate(time) {
    const delta = (time - lastTime) / 1000; // Delta tijd in seconden
    lastTime = time;

    gears.forEach(gear => {
        const rot = rotations[gear.id];
        if (rot) {
            // Update hoek incrementeel (in graden)
            rot.angle = (rot.angle || 0) + (rot.omega * delta * rot.direction * speedFactor) * (180 / Math.PI);
            const img = document.getElementById(`gear-${gear.id}`);
            img.style.transform = `rotate(${rot.angle % 360}deg)`;
        }
    });

    if (isRotating) {
        animationFrame = requestAnimationFrame(animate);
    }
}

document.getElementById('increaseSpeedButton').addEventListener('click', () => {
    speedFactor *= 1.2; // Verhoog snelheid met 20%
    // Geen update nodig, want animate gebruikt speedFactor dynamisch
});

document.getElementById('decreaseSpeedButton').addEventListener('click', () => {
    speedFactor /= 1.2; // Verlaag snelheid met 20%
    // Geen update nodig, want animate gebruikt speedFactor dynamisch
});

document.getElementById('reverseButton').addEventListener('click', () => {
    globalDirection *= -1; // Flip richting
    if (isRotating) {
        stopRotation();
        startRotation(); // Herstart om nieuwe richting toe te passen
    } else {
        calculateRotations(); // Update directions zelfs als gestopt, voor consistente staat
    }
});

function makeDraggable() {
    const gears = document.querySelectorAll('.gear');
    gears.forEach(gear => {
        let offsetX, offsetY;

        gear.addEventListener('mousedown', (e) => {
            const rect = gear.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            const moveGear = (event) => {
                const x = event.clientX - offsetX;
                const y = event.clientY - offsetY;

                gear.style.left = `${x}px`;
                gear.style.top = `${y}px`;

                const gearId = parseInt(gear.id.split('-')[1], 10);
                const label = document.querySelector(`.gear-label[data-id="${gearId}"]`);
                if (label) {
                    label.style.left = `${x}px`;
                    label.style.top = `${y - 20}px`;
                }
            };

            const stopMove = () => {
                savePositions();
                document.removeEventListener('mousemove', moveGear);
                document.removeEventListener('mouseup', stopMove);
            };

            document.addEventListener('mousemove', moveGear);
            document.addEventListener('mouseup', stopMove);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadPositions();
    renderGears();
    makeDraggable();

    document.getElementById('startButton').addEventListener('click', startRotation);
    document.getElementById('stopButton').addEventListener('click', stopRotation);
});