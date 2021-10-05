import * as THREE from "three";
import * as CANNON from "cannon-es";
import {createLowPolyMaterial} from "./createLowPolyMaterial";

export const createLowPolySphere = (
	size: number,
	detail: number,
	color: number,
	mass: number,
	light: boolean,
	position?: [x: number, y: number, z: number] | "random"
): {mesh: THREE.Mesh; body: CANNON.Body} => {
	const lowPolySphereGeometry = new THREE.IcosahedronGeometry(size, detail);

	const newSphereMesh = new THREE.Mesh(lowPolySphereGeometry, createLowPolyMaterial(color));
	const pointLight = new THREE.PointLight(color, 0.2);

	const fiftyChance = Math.round(Math.random());
	const positionY = fiftyChance ? -10 : 10;

	let computedPosition = Array.isArray(position)
		? position
		: position === "random"
		? [THREE.MathUtils.randFloatSpread(40), positionY, THREE.MathUtils.randFloatSpread(40)]
		: undefined;

	const sphereBody = new CANNON.Body({
		mass: mass, // kg
		shape: new CANNON.Sphere(size),
		linearDamping: 0.9,
		angularDamping: 0.9,
		position: computedPosition ? new CANNON.Vec3(...computedPosition) : new CANNON.Vec3(0, 0, 0),
	});

	if (light) {
		newSphereMesh.add(pointLight);
	}

	return {mesh: newSphereMesh, body: sphereBody};
};
