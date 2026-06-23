// ok wtf is happening with these curves bro

enum WeightedMode {
	None,
	In,
	Out,
	Both,
}
enum WrapMode {
	Default = 0,
	Clamp = 1,
	Once = 1,
	Loop = 2,
	PingPong = 4,
	ClampForever = 8,
}

interface Keyframe {
	time: number;
	value: number;
	inSlope: number;
	outSlope: number;
	// tangentMode is deprecated so it should never be used right guys right
	weightedMode: WeightedMode;
	inWeight: number;
	outWeight: number;
}

interface AnimationCurve {
	m_Curve: Keyframe[];

	m_PreInfinity: WrapMode;
	m_PostInfinity: WrapMode;
	m_RotationOrder: number;
}
export const evaluateAnimationCurve = (curve: AnimationCurve, t: number) => {
	const keyframes = curve.m_Curve;

	const startTime = keyframes[0].time;
	const endTime = keyframes[keyframes.length - 1].time;
	const totalTime = endTime - startTime;

	let evalT = t;

	// all the curves are loop so this should be fine
	if (evalT < startTime || evalT > endTime) {
		evalT = ((((evalT - startTime) % totalTime) + totalTime) % totalTime) + startTime;
	}

	let left = 0;
	let right = keyframes.length;

	while (left < right) {
		const mid = Math.floor(left + (right - left) / 2);
		if (keyframes[mid].time > evalT) {
			right = mid;
		} else {
			left = mid + 1;
		}
	}

	if (left >= keyframes.length) return keyframes.at(-1)!.value;
	if (left === 0) return keyframes[0].value;

	const leftPoint = keyframes[left - 1];
	const rightPoint = keyframes[left];

	const dt = rightPoint.time - leftPoint.time;
	if (dt === 0) return leftPoint.value;

	const localT = (evalT - leftPoint.time) / dt;

	const m0 = leftPoint.outSlope * dt;
	const m1 = rightPoint.inSlope * dt;

	const t2 = localT * localT;
	const t3 = t2 * localT;

	const a = 2 * t3 - 3 * t2 + 1;
	const b = t3 - 2 * t2 + localT;
	const c = t3 - t2;
	const d = -2 * t3 + 3 * t2;

	return a * leftPoint.value + b * m0 + c * m1 + d * rightPoint.value;
};

export const heartCurveNormal = {
	m_Curve: [
		{
			time: -0.099999994,
			value: 0,
			inSlope: 0,
			outSlope: 1.2353697,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0,
			outWeight: 0.33333334,
		},
		{
			time: -0.00590552,
			value: 0.116241455,
			inSlope: -0.015826894,
			outSlope: -0.37817734,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.9854773,
			outWeight: 1,
		},
		{
			time: 0.16402555,
			value: -0.23161381,
			inSlope: -0.057394084,
			outSlope: 28.833397,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.7828803,
			outWeight: 0.05674533,
		},
		{
			time: 0.28535962,
			value: 0.9987809,
			inSlope: -0.3684868,
			outSlope: -0.14406662,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.6909047,
			outWeight: 1,
		},
		{
			time: 0.37202507,
			value: -0.6998956,
			inSlope: 0.31912845,
			outSlope: -0.26579845,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 1,
			outWeight: 1,
		},
		{
			time: 0.44125795,
			value: -0.29149407,
			inSlope: 7.325673,
			outSlope: 2.528934,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0.77175635,
		},
		{
			time: 0.5196843,
			value: -0.23183355,
			inSlope: 0.71500987,
			outSlope: 1.103651,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 1,
		},
		{
			time: 0.56271875,
			value: 0.088244066,
			inSlope: 13.443675,
			outSlope: 7.385239,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0.56509835,
		},
		{
			time: 0.6198916,
			value: 0.26990145,
			inSlope: 0.98519367,
			outSlope: 0.35433367,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 1,
			outWeight: 0.73463696,
		},
		{
			time: 0.7045727,
			value: 0.14889035,
			inSlope: -2.3697157,
			outSlope: -1.8848083,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.6926749,
			outWeight: 0.7784983,
		},
		{
			time: 0.8602069,
			value: -0.040676918,
			inSlope: -0.19007038,
			outSlope: -1.5553087e-5,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 1,
			outWeight: 0.33333334,
		},
		{
			time: 1,
			value: 0,
			inSlope: 0.29097944,
			outSlope: 0,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0,
		},
	],
	m_PreInfinity: 2,
	m_PostInfinity: 2,
	m_RotationOrder: 4,
};
export const heartCurveArrythmia = {
	m_Curve: [
		{
			time: 0,
			value: 0,
			inSlope: 2.8452964,
			outSlope: 2.8452964,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0,
			outWeight: 0.33333334,
		},
		{
			time: 0.11798023,
			value: 0.3356887,
			inSlope: 4.5824018,
			outSlope: 4.5824018,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0.37463024,
		},
		{
			time: 0.24952266,
			value: 0.6348413,
			inSlope: -0.48986912,
			outSlope: -0.48986912,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0.33333334,
		},
		{
			time: 0.3875494,
			value: 0.18571204,
			inSlope: -11.07063,
			outSlope: -11.07063,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0.13640523,
		},
		{
			time: 0.49040538,
			value: -0.54883254,
			inSlope: -1.067827,
			outSlope: -1.067827,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0.3412433,
		},
		{
			time: 0.70505655,
			value: -0.6214908,
			inSlope: 0.59786034,
			outSlope: 0.59786034,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0.37059698,
		},
		{
			time: 1,
			value: 0,
			inSlope: 2.1071522,
			outSlope: 2.1071522,
			tangentMode: 0,
			weightedMode: 0,
			inWeight: 0.33333334,
			outWeight: 0,
		},
	],
	m_PreInfinity: 2,
	m_PostInfinity: 2,
	m_RotationOrder: 4,
};
