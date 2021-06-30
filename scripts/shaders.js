const D = require('Diagnostics');
const R = require('Reactive');
const S = require('Shaders');

const CENTER = R.pack2(0.5, 0.5);

export function sdfFrame(
	color, 
	thickness = 0.1, 
	ratio = 1,
	gap = 0.15,
) {
	return R.mix(
		R.pack4(0,0,0,0),
		color,
		R.step(
			S.sdfUnion(
				S.sdfRectangle(CENTER, R.pack2(
					R.sub(0.5, thickness),
					R.sub(0.5, R.mul(thickness, ratio)),
				)),
				S.sdfUnion(
					S.sdfRectangle(CENTER, R.pack2(
						0.5,
						gap
					)),
					S.sdfRectangle(CENTER, R.pack2(
						R.mul(gap, ratio),
						0.5
					)),
				)
			)
		, 0)
	);
}