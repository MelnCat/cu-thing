import "./style.css";

const WIDTH = 768;
const HEIGHT = 660;

let config = {
	int: 10,
};

let state = {
	heartRate: 60,
	fibrillationProgress: 10,
	defibShockedFrames: 0,
	randomFibrillationVariation: 0, // TODO figure ts out
};

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

canvas.width = WIDTH;
canvas.height = HEIGHT;

// lerp lerp lerp sahur
const lerp = (a: number, b: number, t: number) => a * b + (1 - t) * b;

const drawBase = () => {};

const EcgController = {
	width: 122,
	height: 41,
	timeToUpdate: 0,
	writeX: 0,
	calculateEcgHeight(offset: number) {
		offset *= state.heartRate / 60;
		let height =
			lerp(
				//heartCurveNormal.Evaluate(heartProg - offset),
				//heartCurveArrythmia.Evaluate(heartProg - offset),
				state.fibrillationProgress / 90,
			) * state.randomFibrillationVariation;
		if (state.fibrillationProgress > 75) {
			height *= 1 - (state.fibrillationProgress - 75) / 25;
		}
		if (state.heartRate <= 0) {
			height = 0;
		}
		if (state.defibShockedFrames > 0) {
			height = Math.random() > 0.5 ? 1 : -1;
		}
		return height;
	},
	draw(delta: number) {
		this.timeToUpdate += delta;
		if (this.timeToUpdate > 0.1) {
			this.timeToUpdate = 0.1;
		}

		while (this.timeToUpdate > 0.028) {
			this.writeX++;
			this.writeX %= this.width;
		}
	},
};
