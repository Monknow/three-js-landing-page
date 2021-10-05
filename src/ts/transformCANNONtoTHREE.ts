import * as THREE from "three";
import * as CANNON from "cannon-es";

export const transformVec3ToVector3 = (cannonVec3: CANNON.Vec3): THREE.Vector3 => {
	const threeVector3 = new THREE.Vector3(cannonVec3.x, cannonVec3.y, cannonVec3.z);

	return threeVector3;
};

export const transformVector3ToVec3 = (threeVector3: THREE.Vector3): CANNON.Vec3 => {
	const cannonVec3 = new CANNON.Vec3(threeVector3.x, threeVector3.y, threeVector3.z);

	return cannonVec3;
};

export const transformQuaternion = (cannonQuaternion: CANNON.Quaternion): THREE.Quaternion => {
	const threeQuaternion = new THREE.Quaternion(
		cannonQuaternion.x,
		cannonQuaternion.y,
		cannonQuaternion.z,
		cannonQuaternion.w
	);

	return threeQuaternion;
};
