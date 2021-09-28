import {MeshPhongMaterial, BoxGeometry, Mesh} from "three";

export const createCube = (geometry: BoxGeometry, color: number, x: number) => {
	const material = new MeshPhongMaterial({color});

	const cube = new Mesh(geometry, material);

	cube.position.x = x;

	return cube;
};
