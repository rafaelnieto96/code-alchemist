// Subtle Animated Background
let particles = [];
const NUM_PARTICLES = 35;
let colorOffset = 0;

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    colorMode(RGB, 255, 255, 255, 255);

    for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push({
            x: random(width),
            y: random(height),
            size: random(3, 6),
            speedX: random(-0.2, 0.2),
            speedY: random(-0.2, 0.2),
            opacity: random(35, 55)
        });
    }
}

function draw() {
    colorOffset += 0.01;
    drawSmoothGradient();
    updateParticles();
}

function drawSmoothGradient() {
    noStroke();

    let centerColor = color(
        20 + 5 * sin(colorOffset * 0.05),
        60 + 8 * sin(colorOffset * 0.03),
        120 + 15 * sin(colorOffset * 0.02)
    );

    let edgeColor = color(
        10 + 5 * sin(colorOffset * 0.04 + 1),
        30 + 8 * sin(colorOffset * 0.03 + 2),
        80 + 10 * sin(colorOffset * 0.02 + 3)
    );

    background(edgeColor);

    for (let r = 0; r < max(width, height); r += 20) {
        let inter = constrain(1 - r / max(width, height), 0, 1);
        let c = lerpColor(centerColor, edgeColor, inter);
        fill(c);

        let opacity = map(r, 0, max(width, height), 180, 0);
        fill(red(c), green(c), blue(c), opacity);
        ellipse(width / 2, height / 2, max(width, height) - r);
    }
}

function updateParticles() {
    for (let p of particles) {
        p.x += p.speedX + 0.08 * sin(frameCount * 0.02 + p.y * 0.01);
        p.y += p.speedY + 0.08 * sin(frameCount * 0.02 + p.x * 0.01);

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        noStroke();
        fill(220, 230, 255, p.opacity);
        ellipse(p.x, p.y, p.size);
    }
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);

    for (let p of particles) {
        p.x = random(width);
        p.y = random(height);
    }
}
