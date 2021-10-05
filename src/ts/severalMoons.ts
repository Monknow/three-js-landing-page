import * as THREE from "three";
import * as CANNON from "cannon-es";
import {resizeRenderer} from "./resizeRenderer";
import {createLowPolySphere} from "./createLowPolySphere";
import {transformVec3ToVector3, transformQuaternion, transformVector3ToVec3} from "./transformCANNONtoTHREE";
import {createTrackBallContols} from "./createTrackBallContols";
import {createStars} from "./createStars";

import "../styles/severalMoons.scss";

const main = () => {
	const canvas = document.querySelector<HTMLCanvasElement>(".several-moons");
	if (canvas) {
		/* Basic */
		const renderer = new THREE.WebGLRenderer({canvas});
		const scene = new THREE.Scene();
		let draggableObjects: {mesh: THREE.Mesh; body: CANNON.Body}[] = [];
		let jointConstraint: CANNON.PointToPointConstraint | undefined;
		let intersects: THREE.Intersection[];
		let firstIntersect: THREE.Intersection | undefined;
		let isDragging = false;
		const bodyDOM = document.querySelector("body");

		/* Camera */
		const fov: number = 75;
		const aspect: number = 2;
		const near: number = 0.1;
		const far: number = 500;

		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(0, 0, 30);

		/* Add Physics */

		const world = new CANNON.World();

		/* Lights */
		const lightColor = 0xffffff;
		{
			const ambientLightIntensity = 0.2;
			const ambientLight = new THREE.AmbientLight(lightColor, ambientLightIntensity);

			scene.add(ambientLight);
		}

		{
			const directionalLightIntensity = 0.8;
			const directionalLight = new THREE.DirectionalLight(lightColor, directionalLightIntensity);
			directionalLight.position.set(-30, 60, 30);
			scene.add(directionalLight);
		}

		/* Orbit Controls */

		const trackBallContols = createTrackBallContols(camera, renderer);

		/* Background */
		{
			const spaceColor = new THREE.Color(0x000000);
			scene.background = spaceColor;
		}

		/* Background horizontal plane raytracing*/

		const backgroundPlaneGeometry = new THREE.PlaneGeometry(100, 100);
		const backgroundPlaneMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0});
		const backgroundPlaneMesh = new THREE.Mesh(backgroundPlaneGeometry, backgroundPlaneMaterial);
		backgroundPlaneMesh.position.z = -20;
		scene.add(backgroundPlaneMesh);

		let backgroundIntersect: THREE.Intersection;

		/* Small Low Poly Spheres orbiting*/

		const smallSpheres = [
			createLowPolySphere(1, 1, 0xffffff, 1, true, "random"),
			createLowPolySphere(1.7, 1, 0xffffff, 1.7, true, "random"),
			createLowPolySphere(1.4, 1, 0xffffff, 1.4, true, "random"),
			createLowPolySphere(1.9, 1, 0xffffff, 3, true, "random"),
			createLowPolySphere(1.9, 1, 0xffffff, 3, true, "random"),
			createLowPolySphere(1.3, 1, 0xffffff, 3, true, "random"),
			createLowPolySphere(0.7, 1, 0xffffff, 3, true, "random"),
		];

		const smallSpheresGroup = new THREE.Group();
		smallSpheres.forEach((smallSphere) => {
			if (!Array.isArray(smallSphere.mesh.material)) {
				smallSphere.mesh.material.transparent = true;
				smallSphere.mesh.material.opacity = 0.4;
			}

			smallSphere.body.angularVelocity = new CANNON.Vec3(0.5, 0, 0.5);
			smallSphere.body.angularDamping = 0;
			smallSpheresGroup.add(smallSphere.mesh);

			world.addBody(smallSphere.body);
			draggableObjects = [...draggableObjects, smallSphere];
		});

		scene.add(smallSpheresGroup);

		/* Background Stars */
		scene.add(createStars(100));

		/*  Raycaster for mouse interaction */
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();

		// Joint body, to later constraint the cube
		const jointBody = new CANNON.Body({
			mass: 0, // kg
			shape: new CANNON.Sphere(0.1),
			collisionFilterGroup: 0,
			collisionFilterMask: 0,
		});

		world.addBody(jointBody);

		/* Attach body to mouse */

		//The parameters have type any so there isn't type incompability between CANNON and THREE vectors and quaternions
		const addJointConstraint = (intersection: THREE.Intersection, constrainedBody: CANNON.Body) => {
			// Vector that goes from the body to the clicked point
			const vector = new CANNON.Vec3()
				.copy(transformVector3ToVec3(intersection.object.position))
				.vsub(constrainedBody.position);

			// Apply anti-quaternion to vector to tranform it into the local body coordinate system
			const antiRotation = constrainedBody.quaternion.inverse();
			const pivot = antiRotation.vmult(vector); // pivot is not in local body coordinates

			// Move the cannon click marker body to the click position
			jointBody.position.copy(transformVector3ToVec3(intersection.object.position));

			// Create a new constraint
			// The pivot for the jointBody is zero
			jointConstraint = new CANNON.PointToPointConstraint(
				constrainedBody,
				pivot,
				jointBody,
				new CANNON.Vec3(0, 0, 0)
			);

			// Add the constraint to world
			world.addConstraint(jointConstraint);
		};

		const removeJointConstraint = () => {
			if (jointConstraint) {
				world.removeConstraint(jointConstraint);
			}
			jointConstraint = undefined;
		};

		const moveJoint = () => {
			jointBody.position = transformVector3ToVec3(backgroundIntersect.point);

			if (jointConstraint) {
				jointConstraint.update();
			}
		};

		const moveMovementPlane = (intersection: THREE.Intersection, camera: THREE.Camera) => {
			// Center at mouse position
			backgroundPlaneMesh.position.copy(intersection.point);

			// Make it face toward the camera
			backgroundPlaneMesh.quaternion.copy(camera.quaternion);
		};

		window.addEventListener("mousedown", () => {
			if (intersects.length === 0) {
				return;
			}

			firstIntersect = intersects[0];
			const intersectID = firstIntersect.object.uuid;

			const [intersectedObject] = draggableObjects.filter((draggableObject) => {
				return draggableObject.mesh.uuid === intersectID;
			});

			moveMovementPlane(firstIntersect, camera);
			addJointConstraint(firstIntersect, intersectedObject.body);

			isDragging = true;
		});

		window.addEventListener("mousemove", (event) => {
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

			if (!isDragging) {
				return;
			}
			if (bodyDOM) {
				bodyDOM.style.cursor = "move";
			}
			moveJoint();
		});

		window.addEventListener("mouseup", () => {
			isDragging = false;
			firstIntersect = undefined;

			// Remove the mouse constraint from the world
			removeJointConstraint();
		});

		/* Animation */
		let lastCallTime: number;
		const timeStep = 1 / 60; // seconds
		const renderFrames = () => {
			// Time in miliseconds
			const time = performance.now() / 1000;

			if (renderer) {
				/* Resize scene only when needed */
				if (resizeRenderer(renderer)) {
					const canvas = renderer.domElement;
					camera.aspect = canvas.clientWidth / canvas.clientHeight;
					camera.updateProjectionMatrix();
					trackBallContols.handleResize();
				}

				raycaster.setFromCamera(mouse, camera);

				// calculate objects intersecting the picking ray
				intersects = raycaster.intersectObjects(
					draggableObjects.map((draggableObject) => draggableObject.mesh),
					false
				);

				if (intersects.length !== 0) {
					if (bodyDOM) {
						bodyDOM.style.cursor = "move";
					}
					trackBallContols.enabled = false;
				} else {
					if (bodyDOM) {
						bodyDOM.style.cursor = "default";
					}
					trackBallContols.enabled = true;
				}

				backgroundIntersect = raycaster.intersectObject(backgroundPlaneMesh)[0];

				draggableObjects.forEach((draggableObject) => {
					draggableObject.mesh.position.copy(transformVec3ToVector3(draggableObject.body.position));
					draggableObject.mesh.quaternion.copy(transformQuaternion(draggableObject.body.quaternion));
				});

				trackBallContols.update();

				renderer.render(scene, camera);
			}

			if (!lastCallTime) {
				world.step(timeStep);
			} else {
				const dt = time - lastCallTime;
				world.step(timeStep, dt);
			}
			lastCallTime = time;

			requestAnimationFrame(renderFrames);
		};
		requestAnimationFrame(renderFrames);
	}
};

window.onload = main;
