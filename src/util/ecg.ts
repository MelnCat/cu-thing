import { SCALE } from "./constants";
import { evaluateAnimationCurve, heartCurveArrythmia, heartCurveNormal } from "./curves";
import { lerp } from "./math";

const WIDTH = 122;
const HEIGHT = 41;

export interface EcgOptions {
	heartProg: number;
	heartRate: number;
	fibrillationProgress: number;
	defibShockedFrames: number;
	randomFibrillationVariation: number;
}

export class EcgController {
	timeToUpdate = 0;
	writeX = 0;
	writeHeight = 0;
	lastY = HEIGHT / 2;
	ecgCanvas = new OffscreenCanvas(WIDTH, HEIGHT);
	calculateEcgHeight(offset: number, state: EcgOptions) {
		offset *= state.heartRate / 60;
		let height =
			lerp(
				evaluateAnimationCurve(heartCurveNormal, state.heartProg - offset),
				evaluateAnimationCurve(heartCurveArrythmia, state.heartProg - offset),
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
	}
	draw(delta: number, state: EcgOptions): OffscreenCanvas {
		this.timeToUpdate += delta;
		if (this.timeToUpdate > 0.1) {
			this.timeToUpdate = 0.1;
		}

		while (this.timeToUpdate > 0.028) {
			this.writeX++;
			this.writeX %= WIDTH;
			this.writeHeight = this.calculateEcgHeight(this.timeToUpdate - 0.028, state);

			const b = Math.round((this.writeHeight + 1) * 0.5 * (HEIGHT - 1));
			const num = Math.min(this.lastY, b);
			const num2 = Math.max(this.lastY, b);
			const ecgCtx = this.ecgCanvas.getContext("2d")!;

			const section = ecgCtx.getImageData(0, 0, WIDTH, HEIGHT);
			// (HEIGHT - 1 - y) because unity is upside down
			const setColor = (x: number, y: number, r: number, g: number, b: number, a: number) => {
				const index = (x + (HEIGHT - 1 - y) * WIDTH) * 4;
				section.data[index] = r;
				section.data[index + 1] = g;
				section.data[index + 2] = b;
				section.data[index + 3] = a;
			};
			const getColor = (x: number, y: number) => {
				const index = (x + (HEIGHT - 1 - y) * WIDTH) * 4;
				return [...section.data.slice(index, index + 4)] as [number, number, number, number];
			};

			for (let i = num; i <= num2; i++) {
				setColor(this.writeX, i, 255, 255, 255, 255);
				if (i + 1 < HEIGHT) {
					setColor(this.writeX, i + 1, 255, 255, 255, Math.max(50, getColor(this.writeX, i + 1)[3]));
				}
				if (i - 1 >= 0) {
					setColor(this.writeX, i - 1, 255, 255, 255, Math.max(50, getColor(this.writeX, i - 1)[3]));
				}
				if (this.writeX + 1 < WIDTH) {
					setColor(this.writeX + 1, i, 255, 255, 255, Math.max(50, getColor(this.writeX + 1, i)[3]));
				}
				if (this.writeX - 1 >= 0) {
					setColor(this.writeX - 1, i, 255, 255, 255, Math.max(50, getColor(this.writeX - 1, i)[3]));
				}
			}
			for (let j = 0; j < WIDTH; j++) {
				for (let k = 0; k < HEIGHT; k++) {
					const color = getColor(j, k);
					color[3] *= 0.985;
					color[3] = Math.floor(color[3]);
					setColor(j, k, ...color);
				}
			}
			this.lastY = b;
			this.timeToUpdate -= 0.028;
			if (this.timeToUpdate <= 0.028) {
				ecgCtx.putImageData(section, 0, 0);
			}
			ecgCtx.globalCompositeOperation = "source-in";
			ecgCtx.fillStyle = "#45ADFF";
			ecgCtx.fillRect(0, 0, WIDTH, HEIGHT);
			ecgCtx.globalCompositeOperation = "source-over";
		}
		return this.ecgCanvas;
	}
}

export class VisualEcgController {
	private ecg = new EcgController();
	private heartProg = 0;
	private randomFibrillationVariation = 0;
	private lastT = Date.now();
	canvas = this.ecg.ecgCanvas;

	constructor(
		public heartRate: number,
		public fibrillationProgress: number,
	) {
		setInterval(() => {
			const delta = (Date.now() - this.lastT) / 1000;
			this.tick(delta);
			this.lastT = Date.now();
		}, 1000 / 60);
	}

	private tick(delta: number) {
		this.heartProg += (delta * this.heartRate) / 60;
		if (this.heartProg > 1) {
			if (this.heartProg > 1.2) {
				this.heartProg = 1.2;
			}
			this.heartProg -= 1;
			if (this.fibrillationProgress > 40) {
				let num16 = (this.fibrillationProgress - 40) / 150;
				this.randomFibrillationVariation = 1 + Math.random() * num16 - num16;
			} else {
				this.randomFibrillationVariation = 1;
			}
		}

		this.canvas = this.ecg.draw(delta, {
			defibShockedFrames: 0,
			fibrillationProgress: this.fibrillationProgress,
			heartProg: this.heartProg,
			heartRate: this.heartRate,
			randomFibrillationVariation: this.randomFibrillationVariation,
		});
	}

	repaint() {
		this.ecg.ecgCanvas.getContext("2d")!.clearRect(0, 0, this.canvas.width, this.canvas.height);
		const num = this.ecg.writeX;
		this.ecg.writeX = 0;
		this.ecg.writeHeight = 0;
		this.ecg.lastY = this.canvas.height / 2;
		this.heartProg = 0;
		this.ecg.timeToUpdate = 0;
		while (this.ecg.writeX < num) {
			this.tick(1 / 60);
		}
	}
}
