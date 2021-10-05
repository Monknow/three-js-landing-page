import * as THREE from "three";
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import {isTouchDevice} from "./isTouchDevice";

export const createTrackBallContols = (camera: THREE.Camera, renderer: THREE.Renderer) => {
	const trackBallContols = new TrackballControls(camera, renderer.domElement);

	trackBallContols.zoomSpeed = 1.2;
	trackBallContols.zoomCamera();
	trackBallContols.maxDistance = 90;
	trackBallContols.minDistance = 35;
	trackBallContols.noPan = true;

	trackBallContols.keys = ["KeyA", "KeyS"];

	trackBallContols.enabled = isTouchDevice() ? false : true;

	return trackBallContols;
};
