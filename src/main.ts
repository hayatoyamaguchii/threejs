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

function getIntersects(event: MouseEvent, object: THREE.Object3D) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(object.children, true);
}

window.addEventListener('mousedown', (event) => {
    const intersects = getIntersects(event, rubiksCube);
    if (intersects.length > 0) {
        controls.enabled = false;
        isDragging = true;
        startMouse.set(event.clientX, event.clientY);
        intersect = intersects[0];
    }
});

window.addEventListener('mouseup', (event) => {
    if (isDragging && intersect) {
        const endMouse = new THREE.Vector2(event.clientX, event.clientY);
        const delta = endMouse.sub(startMouse);

        if (delta.length() > 10) { // Minimum drag distance
            const normal = intersect.face!.normal.clone();
            // Transform normal to world space (since cubies are rotated)
            normal.transformDirection(intersect.object.matrixWorld).round();

            // Determine drag direction
            const absDeltaX = Math.abs(delta.x);
            const absDeltaY = Math.abs(delta.y);

            // Simplified logic: map 2D drag to 3D rotation based on face normal
            // This is a heuristic and might need refinement for perfect feel

            let axis: 'x' | 'y' | 'z' = 'x';
            let direction = 1;

            // Logic to determine axis and direction based on normal and drag
            // This part can be tricky. Let's try a basic mapping.
            // If normal is X (Right/Left), drag Y -> rotate Z, drag X -> rotate Y (screen space approx)
            // If normal is Y (Top/Bottom), drag X -> rotate Z, drag Y -> rotate X
            // If normal is Z (Front/Back), drag X -> rotate Y, drag Y -> rotate X

            // We need to know which cubie was clicked to identify the layer index
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
