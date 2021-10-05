import * as THREE from "three";

export const createStars = (starsCount: number) => {
	const starsGeometry = new THREE.BufferGeometry();
	const starsPlaceholderPosition = new Float32Array(starsCount * 32);

	const starsPosition = starsPlaceholderPosition.map((_star, index) => {
		const {height, top, width} = document.body.getBoundingClientRect();

		//Second position is Y axy
		if (index % 2 === 0) {
			//Spreed stars across all page
			return THREE.MathUtils.randFloatSpread(height + top + document.body.clientHeight);
		}
		return THREE.MathUtils.randFloatSpread(width);
	});
	starsGeometry.computeBoundingSphere(); //This avoid a warning in the console, but the code works without it
	starsGeometry.setAttribute("position", new THREE.BufferAttribute(starsPosition, 3));

	const starsMaterial = new THREE.PointsMaterial({
		size: 0.1,
	});

	const starsPoints = new THREE.Points(starsGeometry, starsMaterial);

	return starsPoints;
};
