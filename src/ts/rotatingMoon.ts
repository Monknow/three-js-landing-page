import * as THREE from "three";
import * as CANNON from "cannon-es";
import {resizeRenderer} from "./resizeRenderer";
import {createLowPolySphere} from "./createLowPolySphere";
import {transformVec3ToVector3, transformQuaternion} from "./transformCANNONtoTHREE";
import {createTrackBallContols} from "./createTrackBallContols";
import {createStars} from "./createStars";

import "../styles/rotatingMoon.scss";

const main = () => {
	const canvas = document.querySelector<HTMLCanvasElement>(".rotating-moon");
	if (canvas) {
		/* Basic */
		const renderer = new THREE.WebGLRenderer({canvas});
		const scene = new THREE.Scene();

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

		/* Big Central LowPolySphere */

		const bigSphere = createLowPolySphere(15, 3, 0xffffff, 15, true);

		bigSphere.body.angularVelocity = new CANNON.Vec3(0.3, 0.3, 0.3);
		bigSphere.body.angularDamping = 0;

		scene.add(bigSphere.mesh);
		world.addBody(bigSphere.body);

		/* Background Stars */

		scene.add(createStars(100));

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

				renderer.render(scene, camera);
			}

			trackBallContols.update();

			bigSphere.mesh.position.copy(transformVec3ToVector3(bigSphere.body.position));
			bigSphere.mesh.quaternion.copy(transformQuaternion(bigSphere.body.quaternion).normalize());

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
