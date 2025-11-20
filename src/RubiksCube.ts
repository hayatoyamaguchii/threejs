import * as THREE from "three";

export class RubiksCube extends THREE.Group {
    private cubies: THREE.Mesh[] = [];
    private isAnimating: boolean = false;

    constructor() {
        super();
        this.createCubies();
    }

    private createCubies() {
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const colors = [
            0xff0000, // Right (Red)
            0xff8800, // Left (Orange)
            0xffffff, // Top (White)
            0xffff00, // Bottom (Yellow)
            0x0000ff, // Front (Blue)
            0x00ff00, // Back (Green)
        ];

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const materials = colors.map(color => new THREE.MeshStandardMaterial({ color }));
                    const cubie = new THREE.Mesh(geometry, materials);
                    cubie.position.set(x, y, z);
                    cubie.userData = { initialPosition: new THREE.Vector3(x, y, z) };
                    this.add(cubie);
                    this.cubies.push(cubie);
                }
            }
        }
    }

    // Helper to get cubies in a specific layer
    // axis: 'x', 'y', or 'z'
    // index: -1, 0, or 1
    private getLayer(axis: 'x' | 'y' | 'z', index: number): THREE.Mesh[] {
        return this.cubies.filter(cubie => {
            // Use a small epsilon for float comparison if needed, but integer positions should be fine here
            return Math.abs(cubie.position[axis] - index) < 0.1;
        });
    }

    public rotateLayer(axis: 'x' | 'y' | 'z', index: number, angle: number, duration: number = 500) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const layer = this.getLayer(axis, index);
        const pivot = new THREE.Object3D();
        pivot.rotation.set(0, 0, 0);
        this.add(pivot);

        layer.forEach(cubie => {
            this.attach(cubie); // Ensure world transform is preserved
            pivot.attach(cubie);
        });

        const startRotation = pivot.rotation[axis];
        const targetRotation = startRotation + angle;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);

            pivot.rotation[axis] = startRotation + (targetRotation - startRotation) * ease;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                pivot.rotation[axis] = targetRotation;
                pivot.updateMatrixWorld();

                // Re-attach cubies to the main group with new transforms
                layer.forEach(cubie => {
                    this.attach(cubie);
                    // Round positions to avoid floating point drift
                    cubie.position.x = Math.round(cubie.position.x);
                    cubie.position.y = Math.round(cubie.position.y);
                    cubie.position.z = Math.round(cubie.position.z);
                    cubie.updateMatrix();
                });

                this.remove(pivot);
                this.isAnimating = false;
            }
        };

        animate();
    }
}
