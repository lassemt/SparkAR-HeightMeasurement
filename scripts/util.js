const Units = require('Units');

export const CM_FACTOR = 1 / Units.cm(1);

export function inWorldCM(signal) {
	return signal.mul(CM_FACTOR).floor();
}

export function toDegree(signal) {
	return signal.mul(180).div(Math.PI);
}

export function toRadians(signal) {
	return signal.mul(Math.PI).div(180);
}
