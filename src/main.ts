import {
	BoxGeometry,
	DirectionalLight,
	Mesh,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	MeshPhongMaterial,
	TextureLoader,
} from "three";
import {resizeRenderer} from "./resizeRenderer";
import "./styles/style.scss";
import elena1 from "./images/elena1.png";
import elena2 from "./images/elena2.png";
import elena3 from "./images/elena3.png";

const main = () => {
	const canvas = document.querySelector<HTMLCanvasElement>("#canvas");

	const renderer = canvas ? new WebGLRenderer({canvas}) : null;

	const fov: number = 75;
	const aspect: number = 2;
	const near: number = 0.1;
	const far: number = 5;

	const camera = new PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 2;

	const scene = new Scene();

	const addCube = (x: number, image: string) => {
		const boxSize = Math.random() * (1 - 0.4) + 0.4;

		const geometry = new BoxGeometry(boxSize, boxSize, boxSize);

		const loader = new TextureLoader();

		const material = new MeshPhongMaterial({
			map: loader.load(image),
		});

		const cube = new Mesh(geometry, material);

		cube.position.x = x;
		scene.add(cube);

		return cube;
	};

	const cubes: Mesh[] = [addCube(0, elena1), addCube(-2, elena2), addCube(2, elena3)];

	const color = 0xffffff;
	const intensity = 1;
	const light = new DirectionalLight(color, intensity);

	light.position.set(0, 2, 4);
	scene.add(light);

	const light2 = new DirectionalLight(color, intensity);
	light2.position.set(2, -2, -4);
	scene.add(light2);

	const renderFrames = (time: number) => {
		time *= 0.001;

		cubes.forEach((cube, index) => {
			const speed = 1 + index * 0.1;
			const rotation = time * speed;

			cube.rotation.x = rotation;
			cube.rotation.y = rotation;
		});

		if (renderer) {
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
