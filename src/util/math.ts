// lerp lerp lerp sahur
export const lerp = (a: number, b: number, t: number) => a * (1 - t) + t * b;
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const moveTowards = (current: number, target: number, maxDelta: number) => {
	if (Math.abs(target - current) <= maxDelta) {
		return target;
	}
	return current + Math.sign(target - current) * maxDelta;
};
