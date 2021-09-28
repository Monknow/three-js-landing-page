import {
	Mesh,
	MeshPhongMaterial,
	Scene,
	SphereGeometry,
	Object3D,
	WebGLRenderer,
	PerspectiveCamera,
	PointLight,
} from "three";
import {resizeRenderer} from "./resizeRenderer";
import "./styles/style.scss";

const main = () => {
	const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
	const renderer = new WebGLRenderer({canvas});

	const fov: number = 40;
	const aspect: number = 2;
	const near: number = 0.1;
	const far: number = 1000;

	const camera = new PerspectiveCamera(fov, aspect, near, far);
	camera.position.set(0, 50, 0);
	camera.up.set(0, 0, 1);
	camera.lookAt(0, 0, 0);

	const scene = new Scene();

	{
		const color = 0xffffff;
		const intensity = 3;
		const light = new PointLight(color, intensity);
		scene.add(light);
	}

	let objects = [];

	const radius = 1;
	const widthSegments = 6;
	const heightSegments = 6;
	const sphereGeometry = new SphereGeometry(radius, widthSegments, heightSegments);

	const solarSystem = new Object3D();
	scene.add(solarSystem);
	objects = [...objects, solarSystem];

	const sunMaterial = new MeshPhongMaterial({emissive: 0xffff00});
	const sunMesh = new Mesh(sphereGeometry, sunMaterial);
	sunMesh.scale.set(5, 5, 5);

	solarSystem.add(sunMesh);
	objects = [...objects, sunMesh];

	const earthOrbit = new Object3D();
	earthOrbit.position.x = 10;
	solarSystem.add(earthOrbit);
	objects = [...objects, earthOrbit];

	const earthMaterial = new MeshPhongMaterial({color: 0x2233ff, emissive: 0x112244});
	const earthMesh = new Mesh(sphereGeometry, earthMaterial);

	earthOrbit.add(earthMesh);
	objects = [...objects, earthMesh];

	const moonOrbit = new Object3D();
	moonOrbit.position.x = 2;
	earthOrbit.add(moonOrbit);

	const moonMaterial = new MeshPhongMaterial({color: 0x888888});
	const moonMesh = new Mesh(sphereGeometry, moonMaterial);
	moonMesh.scale.set(0.5, 0.5, 0.5);
	moonOrbit.add(moonMesh);
	objects = [...objects, moonMesh];

	const renderFrames = (time: number) => {
		time *= 0.001;

		if (objects.length !== 0) {
			objects.forEach((object) => {
				object.rotation.y = time;
			});
		}

		if (renderer) {
			//Makes the canvas responsive without object distortion, and keeping good quality
			if (resizeRenderer(renderer)) {
				const canvas = renderer.domElement;
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			renderer.render(scene, camera);
		}

		requestAnimationFrame(renderFrames);
	};
	requestAnimationFrame(renderFrames);
};

main();
