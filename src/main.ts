import * as THREE from "three";

import { RubiksCube } from "./RubiksCube";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(5, 5, 7);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const rubiksCube = new RubiksCube();
scene.add(rubiksCube);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(3, 3, 3);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Interaction variables
let isDragging = false;
let startMouse = new THREE.Vector2();
let intersect: THREE.Intersection | null = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Unified Input Handling
function handleInputStart(clientX: number, clientY: number) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(rubiksCube.children, true);

    if (intersects.length > 0) {
        controls.enabled = false;
        isDragging = true;
        startMouse.set(clientX, clientY);
        intersect = intersects[0];
    }
}

function handleInputMove(clientX: number, clientY: number) {
    // Optional: Add visual feedback or tracking here if needed
}

function handleInputEnd(clientX: number, clientY: number) {
    if (isDragging && intersect) {
        const endMouse = new THREE.Vector2(clientX, clientY);
        const delta = endMouse.sub(startMouse);

        if (delta.length() > 10) { // Minimum drag distance
            const normal = intersect.face!.normal.clone();
            normal.transformDirection(intersect.object.matrixWorld).round();

            const absDeltaX = Math.abs(delta.x);
            const absDeltaY = Math.abs(delta.y);

            let axis: 'x' | 'y' | 'z' = 'x';
            let direction = 1;

            const cubie = intersect.object;
            const position = cubie.position.clone().round();

            if (Math.abs(normal.x) > 0.5) { // Side faces
                if (absDeltaY > absDeltaX) {
                    axis = 'z';
                    direction = -Math.sign(delta.y) * Math.sign(normal.x);
                } else {
                    axis = 'y';
                    direction = Math.sign(delta.x) * Math.sign(normal.x);
                }
            } else if (Math.abs(normal.y) > 0.5) { // Top/Bottom faces
                if (absDeltaY > absDeltaX) {
                    axis = 'x';
                    direction = Math.sign(delta.y) * Math.sign(normal.y);
                } else {
                    axis = 'z';
                    direction = Math.sign(delta.x) * Math.sign(normal.y);
                }
            } else if (Math.abs(normal.z) > 0.5) { // Front/Back faces
                if (absDeltaY > absDeltaX) {
                    axis = 'x';
                    direction = Math.sign(delta.y) * Math.sign(normal.z);
                } else {
                    axis = 'y';
                    direction = Math.sign(delta.x) * Math.sign(normal.z);
                }
            }

            const index = Math.round(position[axis]);
            rubiksCube.rotateLayer(axis, index, direction * Math.PI / 2);
        }
    }
    isDragging = false;
    controls.enabled = true;
    intersect = null;
}

// Mouse Events
window.addEventListener('mousedown', (event) => {
    handleInputStart(event.clientX, event.clientY);
});

window.addEventListener('mousemove', (event) => {
    if (isDragging) {
        handleInputMove(event.clientX, event.clientY);
    }
});

window.addEventListener('mouseup', (event) => {
    handleInputEnd(event.clientX, event.clientY);
});

// Touch Events
window.addEventListener('touchstart', (event) => {
    if (event.touches.length > 0) {
        // Prevent default to stop scrolling/zooming while interacting with the cube
        // event.preventDefault(); 
        // Note: preventDefault might block other interactions, use carefully. 
        // For a full screen game, it's usually desired.
        handleInputStart(event.touches[0].clientX, event.touches[0].clientY);
    }
}, { passive: false });

window.addEventListener('touchmove', (event) => {
    if (isDragging && event.touches.length > 0) {
        event.preventDefault(); // Prevent scrolling while dragging the cube
        handleInputMove(event.touches[0].clientX, event.touches[0].clientY);
    }
}, { passive: false });

window.addEventListener('touchend', (event) => {
    // touchend doesn't have touches, use changedTouches
    if (event.changedTouches.length > 0) {
        handleInputEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    }
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
