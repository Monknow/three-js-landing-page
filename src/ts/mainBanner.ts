import * as THREE from "three";
import * as CANNON from "cannon-es";
import fontTypeFace from "three/examples/fonts/helvetiker_bold.typeface.json";
import {resizeRenderer} from "./resizeRenderer";
import {createLowPolyMaterial} from "./createLowPolyMaterial";
import {createLowPolySphere} from "./createLowPolySphere";
import {createTerrain} from "./createTerrain";
import {transformVec3ToVector3, transformQuaternion, transformVector3ToVec3} from "./transformCANNONtoTHREE";
import {createTrackBallContols} from "./createTrackBallContols";
import {createStars} from "./createStars";
import "../styles/mainBanner.scss";

const main = () => {
	const canvas = document.querySelector<HTMLCanvasElement>(".main-banner");
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
		camera.position.set(0, 0, 40);

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

		/* Create a Local Space for the Central Sphere and the Small Spheres  */

		const centralSphereLocalSpace = new THREE.Object3D();
		scene.add(centralSphereLocalSpace);

		/* Background horizontal plane raytracing*/

		const backgroundPlaneGeometry = new THREE.PlaneGeometry(100, 100);
		const backgroundPlaneMaterial = new THREE.MeshBasicMaterial({transparent: true, opacity: 0});
		const backgroundPlaneMesh = new THREE.Mesh(backgroundPlaneGeometry, backgroundPlaneMaterial);
		backgroundPlaneMesh.position.z = -20;
		scene.add(backgroundPlaneMesh);

		let backgroundIntersect: THREE.Intersection;

		/* Big Central LowPolySphere */

		const bigSphere = createLowPolySphere(10, 4, 0x3278d8, 0, false);

		centralSphereLocalSpace.add(bigSphere.mesh);
		bigSphere.body.angularVelocity = new CANNON.Vec3(0.1, 0.1, 0.1);
		bigSphere.body.angularDamping = 0;

		world.addBody(bigSphere.body);

		/* Central LowPolySphere Terrain */
		const terrains = [
			createTerrain(8.9, -1, 1, 1),
			createTerrain(8.9, 1, -1, 1),
			createTerrain(8.9, 1, 1, -1),
			createTerrain(8.9, -1, -1, -1),
		];

		const terrainsGroup = new THREE.Group();
		terrains.forEach((terrains) => {
			terrainsGroup.add(terrains.mesh);
		});

		bigSphere.mesh.add(terrainsGroup);
		terrains.forEach((terrain) => {
			world.addBody(terrain.body);
		});

		/* Small Low Poly Spheres orbiting*/

		const smallSpheres = [
			createLowPolySphere(1, 1, 0xffffff, 1, true, [10, 5, 9]),
			createLowPolySphere(1.7, 1, 0xffffff, 1.7, true, [-8, -7, 10]),
			createLowPolySphere(1.4, 1, 0xffffff, 1.4, true, [-8, 7, 9]),
			createLowPolySphere(1.9, 1, 0xffffff, 3, true, [0, -8, -9]),
			createLowPolySphere(1.9, 1, 0xffffff, 3, true, [3, 11, -9]),
			createLowPolySphere(1.3, 1, 0xffffff, 3, true, [-5, -11, 2]),
			createLowPolySphere(0.7, 1, 0xffffff, 3, true, [5, -12, -7]),
		];

		const smallSpheresGroup = new THREE.Group();
		smallSpheres.forEach((smallSphere) => {
			smallSphere.body.angularVelocity = new CANNON.Vec3(0.5, 0, 0.5);
			smallSphere.body.angularDamping = 0;
			smallSpheresGroup.add(smallSphere.mesh);

			world.addBody(smallSphere.body);
			draggableObjects = [...draggableObjects, smallSphere];
		});

		centralSphereLocalSpace.add(smallSpheresGroup);

		/* 3D Title */

		const createIndividualLetters = (text: string, letterSize: number, xOffset: number, y: number, z: number) => {
			const lettersArray: string[] = Array.from(text);

			const font = new THREE.Font(fontTypeFace);

			const lettersMesh = lettersArray.map((lettter) => {
				const fontGeometry = new THREE.TextGeometry(lettter, {
					font: font,
					size: letterSize,

					height: 1.0,

					curveSegments: 1,
				});
				const fontMesh = new THREE.Mesh(fontGeometry, createLowPolyMaterial(0xffffff));

				return fontMesh;
			});

			//Get the size of the letters in the array
			const lettersSize = lettersMesh.map((letterMesh) => {
				const letterBox = new THREE.Box3().setFromObject(letterMesh);
				const {x, y, z} = letterBox.getSize(new THREE.Vector3());
				return {width: x, height: y, depth: z};
			});

			//Position and then add letters
			const letterWidth = lettersSize.map((letterSize) => letterSize.width);

			let letterBodies: CANNON.Body[] = [];
			let textWidth: number;

			letterWidth.reduce((accumulatedWidth, currentWidth, currentIndex) => {
				const {width, height, depth} = lettersSize[currentIndex]; //Current size

				const letterBody = new CANNON.Body({
					shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)),
					mass: 10,
					linearDamping: 0.8,
					angularDamping: 0.8,
					position: new CANNON.Vec3(accumulatedWidth + xOffset + currentIndex, y, z),
				});
				letterBodies = [...letterBodies, letterBody];
				world.addBody(letterBody);

				if (currentIndex + 1 === letterWidth.length) {
					textWidth = accumulatedWidth;
				}

				return accumulatedWidth + currentWidth;
			}, 0);

			letterBodies.forEach((letterBody) => {
				letterBody.position.x = letterBody.position.x - textWidth / 1.5;
			});

			// Merge CANNON body with THREE Mesh
			const lettersObject = lettersMesh.map((_current, index) => {
				return {mesh: lettersMesh[index], body: letterBodies[index]};
			});
			return lettersObject;
		};

		const lettersObject = createIndividualLetters("Lorem", 3.5, 0, 13, 0);

		const lettersGroup = new THREE.Group();
		lettersObject.forEach((letter) => {
			letter.body.velocity = new CANNON.Vec3(
				THREE.MathUtils.randFloatSpread(5),
				Math.random() * 5,
				THREE.MathUtils.randFloatSpread(5)
			);

			lettersGroup.add(letter.mesh);
		});

		draggableObjects = [...draggableObjects, ...lettersObject];
		centralSphereLocalSpace.add(lettersGroup);

		/* Join Letters */

		let joinLettersIntersection: THREE.Intersection[];
		let joinLetterWasClicked = false;

		const joinLetters = createIndividualLetters("Join", 4, -1.5, -18, 0);

		const lettersJoinGroup = new THREE.Group();
		joinLetters.forEach((letter) => {
			lettersJoinGroup.add(letter.mesh);
		});

		draggableObjects = [...draggableObjects, ...joinLetters];
		centralSphereLocalSpace.add(lettersJoinGroup);

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
			if (joinLettersIntersection.length !== 0) {
				joinLetterWasClicked = true;
			}

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
			if (joinLetterWasClicked) {
				window.parent.postMessage("join", window.location.origin);
				joinLetterWasClicked = false;
			}
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

				joinLettersIntersection = raycaster.intersectObjects(
					joinLetters.map((letter) => letter.mesh),
					false
				);

				if (joinLettersIntersection.length !== 0) {
					if (bodyDOM) {
						bodyDOM.style.cursor = "pointer";
					}
				}

				backgroundIntersect = raycaster.intersectObject(backgroundPlaneMesh)[0];

				bigSphere.mesh.position.copy(transformVec3ToVector3(bigSphere.body.position));
				bigSphere.mesh.quaternion.copy(transformQuaternion(bigSphere.body.quaternion).normalize());

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
