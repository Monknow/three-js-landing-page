import * as THREE from "three";
import * as CANNON from "cannon-es";
import {createLowPolyMaterial} from "./createLowPolyMaterial";

export const createTerrain = (size: number, x: number, y: number, z: number): {mesh: THREE.Mesh; body: CANNON.Body} => {
	const terrainGeometry = new THREE.OctahedronGeometry(size, 3);

	const terrainMesh = new THREE.Mesh(terrainGeometry, createLowPolyMaterial(0xad69e0));

	terrainMesh.position.set(x, y, z);

	const sphereBody = new CANNON.Body({
		mass: 0, // kg
		shape: new CANNON.Sphere(10),
	});

	return {mesh: terrainMesh, body: sphereBody};
};
