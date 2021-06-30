const D = require('Diagnostics');
const Scene = require('Scene');
const R = require('Reactive');
const Mat = require('Materials');
const Patches = require('Patches');
const Touch = require('TouchGestures');

import { sdfFrame } from './shaders';
import { inWorldCM, toRadians } from './util';

//
// Constants
//
const FOCAL_DISTANCE = 0.5361266732215881;

//
// Setup paper frame
//
Mat.findFirst('matA4Paper').then(matA4Paper => {
	matA4Paper.setTextureSlot('diffuseTexture', sdfFrame(R.pack4(0, 0, 0, 1), 0.03, 1.41428571429));
});

Promise.all([
	Scene.root.findFirst('Camera'),
	Scene.root.findFirst('trackerPlane'),
	Scene.root.findFirst('nullPositioner'),
]).then(async ([camera, trackerPlane, nullPositioner]) => {
	const cameraTransform = camera.worldTransform;
	const floorTransform = trackerPlane.worldTransform;

	// Get camera data
	const cameraDistanceFromFloor = cameraTransform.z.distance(floorTransform.z);
	const cameraTiltX = cameraTransform.rotationX.sub(toRadians(R.val(90)));
	const cameraPositionRelativeToFloorZ = cameraTransform.y.distance(floorTransform.y);

	// Same as traditional way of estimating tree heights
	// height = (tan(θ) * distance from stem) + camera distance from ground
	// Read more:
	// https://bigtrees.forestry.ubc.ca/measuring-trees/height-measurements/
	const lookAtHeight = R.tan(cameraTiltX).mul(cameraPositionRelativeToFloorZ).add(cameraDistanceFromFloor);

	// Convert to CM
	const cameraDistanceFromFloorInCM = inWorldCM(cameraDistanceFromFloor); 
	const lookAtHeightInCM = inWorldCM(lookAtHeight);

	// Send to patch editor
	Patches.inputs.setScalar('cameraRelativeToFloorY', lookAtHeight.div(floorTransform.scaleX));
	Patches.inputs.setScalar('cameraDistanceFromFloor', cameraDistanceFromFloorInCM);
	Patches.inputs.setString('cameraDistanceFromFloorString', cameraDistanceFromFloorInCM.toString().concat(' cm'));
	Patches.inputs.setScalar('lookAtHeight', lookAtHeightInCM);
	Patches.inputs.setString('lookAtHeightString', lookAtHeightInCM.toString().concat(' cm'));

	// 
	// Reposition tracker if needed
	// 
	Touch.onTap().subscribe(evt => trackerPlane.trackPoint(evt.location));
	Touch.onRotate().subscribe(evt => {
		const last = nullPositioner.transform.rotationY.pinLastValue();
		trackerPlane.transform.rotationY = evt.rotation.mul(-1).add(last);
	});
	Touch.onPinch().subscribe(evt => {
		const lastScaleX = nullPositioner.transform.scaleX.pinLastValue();
		const lastScaleY = nullPositioner.transform.scaleY.pinLastValue();
		const lastScaleZ = nullPositioner.transform.scaleZ.pinLastValue();

		nullPositioner.transform.scaleX = evt.scale.mul(lastScaleX);
		nullPositioner.transform.scaleY = evt.scale.mul(lastScaleY);
		nullPositioner.transform.scaleZ = evt.scale.mul(lastScaleZ);
	});

	//
	// Hack for scaling objects inside tracker properly
	//
	nullPositioner.transform.scale = R.scale(1,1,1).div(floorTransform.scale);
});
