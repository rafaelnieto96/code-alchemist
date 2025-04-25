let neurons = [];
let NUM_NEURONS = 40;
let ACTIVATION_DISTANCE = 150;
let MAX_CONNECTIONS = 5;

function calculateDensity() {
    const screenArea = window.innerWidth * window.innerHeight;
    const baseDensity = 0.00004;
    NUM_NEURONS = Math.max(10, Math.floor(screenArea * baseDensity));
    ACTIVATION_DISTANCE = Math.min(150, Math.max(80, window.innerWidth / 10));
    MAX_CONNECTIONS = window.innerWidth < 768 ? 3 : 5;
}

function setup() {
    // Ensure the canvas is created within the background container
    let canvas = createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent('background-container'); 
    noFill();
    angleMode(DEGREES);
    calculateDensity();
    for (let i = 0; i < NUM_NEURONS; i++) {
        neurons.push(new Neuron());
    }
}

function drawGradientBackground(c1, c2) {
    noFill();
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(0, y, width, y);
    }
    noStroke();
}

function draw() {
    // Cyberpunk color palette - dark blue/purple gradient
    let color1 = color(10, 10, 30); // --dark-bg analogous
    let color2 = color(26, 26, 62); // --medium-bg analogous
    drawGradientBackground(color1, color2);

    neurons.forEach(neuron => {
        neuron.update();
        neuron.show();
    });

    drawNeuralConnections();

    if (window.innerWidth > 768) {
        globalPulseEffect();
    }
}

class Neuron {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.connections = [];
        this.pulse = 0;
        const baseSize = window.innerWidth < 768 ? 5 : 7; // Slightly smaller nodes
        this.targetSize = random(baseSize, baseSize * 1.6);
        // Cyberpunk hues - cyan/magenta range
        this.hue = random(180, 300); 
        this.sat = random(180, 255);
    }

    update() {
        const moveSpeed = window.innerWidth < 768 ? 0.2 : 0.3;
        this.pos.add(createVector(random(-moveSpeed, moveSpeed), random(-moveSpeed, moveSpeed)));
        this.pos.x = constrain(this.pos.x, 0, width);
        this.pos.y = constrain(this.pos.y, 0, height);

        let mouseDist = dist(mouseX, mouseY, this.pos.x, this.pos.y);
        if (mouseDist < ACTIVATION_DISTANCE) {
            this.activate();
        }

        this.pulse = lerp(this.pulse, 0, 0.1);
    }

    activate() {
        this.pulse = 1;
        this.hue = (this.hue + 2) % 360; // Shift hue slightly on activation
    }

    show() {
        let glowSize = this.targetSize * (1 + this.pulse * 2.5); // More pronounced pulse
        let alpha = 180 + 75 * sin(frameCount * 0.05 + this.pos.x * 0.1); // Slower, position-based alpha
        colorMode(HSB); // Use HSB for easier color manipulation

        // Outer Glow
        fill(this.hue, this.sat, 100, alpha * 0.3 * (1 + this.pulse)); // Brighter glow on pulse
        noStroke();
        ellipse(this.pos.x, this.pos.y, glowSize);

        // Inner Glow / Core
        fill(this.hue, this.sat, 100, alpha * 0.6);
        ellipse(this.pos.x, this.pos.y, this.targetSize * 1.5);
        
        // Center Dot
        fill(this.hue, this.sat * 0.5, 100, 255); // Brighter center
        ellipse(this.pos.x, this.pos.y, this.targetSize * 0.8);
        colorMode(RGB); // Switch back to RGB
    }
}

function drawNeuralConnections() {
    neurons.forEach((a, i) => {
        let others = neurons.slice(i + 1)
            .map(b => ({ neuron: b, dist: dist(a.pos.x, a.pos.y, b.pos.x, b.pos.y) }))
            .sort((x, y) => x.dist - y.dist)
            .slice(0, MAX_CONNECTIONS);

        others.forEach(({ neuron: b, dist }) => {
            if (dist < ACTIVATION_DISTANCE * 1.5) { // Slightly reduced connection distance
                let alpha = map(dist, 0, ACTIVATION_DISTANCE * 1.5, 150, 0); // Less intense alpha
                let lineWidth = map(dist, 0, ACTIVATION_DISTANCE * 1.5,
                    window.innerWidth < 768 ? 1.5 : 2,
                    window.innerWidth < 768 ? 0.2 : 0.4);

                let pulseSpeed = window.innerWidth < 768 ? 0.04 : 0.06;
                let pulse = (sin(frameCount * pulseSpeed + dist * 0.02) + 1) * 0.5;
                let connectionAlpha = alpha * (0.5 + pulse * 0.5); // Modulated alpha

                // Use a mix of primary and secondary colors for connections
                let connectionHue = lerp(a.hue, b.hue, 0.5);
                colorMode(HSB);
                stroke(connectionHue, 200, 100, connectionAlpha);
                strokeWeight(lineWidth);
                line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
                colorMode(RGB);
            }
        });
    });
}

function globalPulseEffect() {
    noFill();
    // Cyan/Magenta pulse
    let pulseColor = lerpColor(color(0, 240, 255, 50), color(255, 0, 255, 50), (sin(frameCount * 0.5) + 1) / 2);
    stroke(pulseColor);
    strokeWeight(window.innerWidth < 768 ? 1.5 : 2);
    let pulseSize = (frameCount % 150) * (window.innerWidth < 768 ? 3 : 5); // Slower, larger pulse
    ellipse(mouseX, mouseY, pulseSize, pulseSize);
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
    calculateDensity();
    neurons = [];
    for (let i = 0; i < NUM_NEURONS; i++) {
        neurons.push(new Neuron());
    }
} 