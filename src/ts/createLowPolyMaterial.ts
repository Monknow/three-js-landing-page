import * as THREE from "three";

export const createLowPolyMaterial = (color: number) => {
	return new THREE.MeshPhongMaterial({
		color: color,
		flatShading: true,
	});
};
