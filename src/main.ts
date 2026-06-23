import { evaluateAnimationCurve, heartCurveArrythmia, heartCurveNormal } from "./curves";
import "./style.css";

const SCALE = 4;
const WIDTH = 256;
const HEIGHT = 220;

let config = {
	int: 10,
};

let state = {
	heartRate: 70,
	fibrillationProgress: 0,
	defibShockedFrames: 0,
	randomFibrillationVariation: 0, // TODO figure ts out
	heartProg: 0,
	itemCharge: 1,
	bloodPressure: 89,

	charge: 0,
	desiredCharge: 100,
	shockCount: 0,
	rangeOffset: Math.random() * 2 - 1,
	bloodOxygen: 100,
	dialAngle: 0,
};

const canvas = document.getElementById("main-canvas")! as HTMLCanvasElement;

canvas.width = WIDTH * SCALE;
canvas.height = HEIGHT * SCALE;

const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

const loadImage = (src: string): Promise<HTMLImageElement> => {
	const image = new Image();
	image.src = src;
	return new Promise(res => {
		image.onload = () => res(image);
	});
};

// lerp lerp lerp sahur
const lerp = (a: number, b: number, t: number) => a * (1 - t) + t * b;

const defibBackground = await loadImage("./assets/defibBackground.png");
const dialImage = await loadImage("./assets/manualDefibDial.png");
const chargeButtonImage = await loadImage("./assets/manualDefibCharge.png");
const chargingImage = await loadImage("./assets/manualDefibCharging.png");
const shockButtonImage = await loadImage("./assets/manualDefibShock.png");

const drawBase = () => {
	ctx.drawImage(defibBackground, 0, 0, defibBackground.width * SCALE, defibBackground.height * SCALE);
	ctx.drawImage(chargeButtonImage, 112 * SCALE, 160 * SCALE, chargeButtonImage.width * SCALE, chargeButtonImage.height * SCALE);
	ctx.drawImage(shockButtonImage, 188 * SCALE, 160 * SCALE, chargeButtonImage.width * SCALE, chargeButtonImage.height * SCALE);

	ctx.fillStyle = "#ffffff";
	ctx.font = '42px "Retro Gaming"';
	ctx.fillText(state.shockCount.toString(), 50 * SCALE, 53 * SCALE);
	ctx.fillText(state.charge.toString(), 103 * SCALE, 53 * SCALE);
	ctx.fillStyle = "#707070";
	ctx.fillText(Math.round(state.desiredCharge).toString(), 123 * SCALE, 53 * SCALE);
	ctx.fillStyle = "#ffffff";

	const estimationRange = Math.max(5, 70 - (config.int - 10) * 5);
	let min = state.fibrillationProgress * 2 - estimationRange;
	let max = state.fibrillationProgress * 2 + estimationRange;
	min += state.rangeOffset * estimationRange;
	max += state.rangeOffset * estimationRange;
	if (min < 10) {
		min = 10;
	}
	if (max > 200) {
		max = 200;
	}
	if (max < 10) {
		max = 10;
	}
	if (min > 200) {
		min = 200;
	}

	ctx.fillText(`${Math.round(min)}-${Math.round(max)}`, 49 * SCALE, 118 * SCALE);

	ctx.fillText(Math.round(state.desiredCharge).toString(), 49 * SCALE, 138 * SCALE);

	ctx.fillStyle = "#63b4f4";
	ctx.fillText(`${Math.round(state.bloodPressure)}/${Math.round(state.bloodPressure * 0.66)}`, 141 * SCALE, 115 * SCALE);

	ctx.fillStyle = "#ffffff";
	ctx.fillText(`${Math.round(state.bloodOxygen)}%`, 141 * SCALE, 136 * SCALE);

	ctx.fillStyle = "#9ef953";
	ctx.font = '75px "Retro Gaming"';
	ctx.fillText(Math.round(state.heartRate).toString(), 173 * SCALE, 86 * SCALE);

	ctx.fillStyle = "#80ce52";
	ctx.fillRect(199 * SCALE, 45 * SCALE, 13 * SCALE * state.itemCharge, 9 * SCALE);

	ctx.save();

	const centerX = 28 + dialImage.width / 2;
	const centerY = 154 + dialImage.height / 2;
	ctx.translate(centerX * SCALE, centerY * SCALE);

	ctx.rotate(state.dialAngle);

	ctx.drawImage(
		dialImage,
		(-dialImage.width / 2) * SCALE,
		(-dialImage.height / 2) * SCALE,
		dialImage.width * SCALE,
		dialImage.height * SCALE,
	);

	ctx.restore();
};

const tickCirculation = (delta: number) => {
	// let targetHeartRate = 70;
	// targetHeartRate += state.fibrillationProgress;
	// if (state.fibrillationProgress > 75) {
	// 	targetHeartRate += (state.fibrillationProgress - 75) * 4;
	// }
	// if (state.fibrillationProgress > 95) {
	// 	targetHeartRate += (state.fibrillationProgress - 95) * 30;
	// }
	// state.heartRate = lerp(state.heartRate, targetHeartRate, delta * 0.15);

	state.heartProg += (delta * state.heartRate) / 60;
	if (state.heartProg > 1) {
		if (state.heartProg > 1.2) {
			state.heartProg = 1.2;
		}
		state.heartProg -= 1;
		if (state.fibrillationProgress > 40) {
			const num16 = (state.fibrillationProgress - 40) / 150;
			state.randomFibrillationVariation = 1 + Math.random() * (2 * num16) - num16;
		} else {
			state.randomFibrillationVariation = 1;
		}
	}
};

let mouseX = 0;
let mouseY = 0;
document.body.addEventListener("mousemove", e => {
	mouseX = e.clientX;
	mouseY = e.clientY;
});

const tickControls = () => {
	const dialCenterX = 28 + dialImage.width / 2;
	const dialCenterY = 154 + dialImage.height / 2;
	const canvasBounds = canvas.getBoundingClientRect();
	const centerX = canvasBounds.left + canvasBounds.width * (dialCenterX / WIDTH);
	const centerY = canvasBounds.top + canvasBounds.height * (dialCenterY / HEIGHT);

	const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
	let displayAngle = angle + Math.PI / 2;
	if (displayAngle > Math.PI) {
		displayAngle -= 2 * Math.PI;
	}
	displayAngle = Math.min((170 * Math.PI) / 180, Math.max((-170 * Math.PI) / 180, displayAngle));
	state.dialAngle = displayAngle;
	state.desiredCharge = lerp(10, 200, (displayAngle + (170 * Math.PI) / 180) / ((2 * 170 * Math.PI) / 180));
};

class EcgController {
	width = 122;
	height = 41;
	timeToUpdate = 0;
	writeX = 0;
	writeHeight = 0;
	lastY = this.height / 2;
	ecgCanvas = new OffscreenCanvas(this.width, this.height);
	calculateEcgHeight(offset: number) {
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
	draw(delta: number) {
		this.timeToUpdate += delta;
		if (this.timeToUpdate > 0.1) {
			this.timeToUpdate = 0.1;
		}

		while (this.timeToUpdate > 0.028) {
			this.writeX++;
			this.writeX %= this.width;
			this.writeHeight = this.calculateEcgHeight(this.timeToUpdate - 0.028);

			const b = Math.round((this.writeHeight + 1) * 0.5 * (this.height - 1));
			const num = Math.min(this.lastY, b);
			const num2 = Math.max(this.lastY, b);
			const ecgCtx = this.ecgCanvas.getContext("2d")!;

			const section = ecgCtx.getImageData(0, 0, this.width, this.height);
			// (this.height - 1 - y) because unity is upside down
			const setColor = (x: number, y: number, r: number, g: number, b: number, a: number) => {
				const index = (x + (this.height - 1 - y) * this.width) * 4;
				section.data[index] = r;
				section.data[index + 1] = g;
				section.data[index + 2] = b;
				section.data[index + 3] = a;
			};
			const getColor = (x: number, y: number) => {
				const index = (x + (this.height - 1 - y) * this.width) * 4;
				return [...section.data.slice(index, index + 4)] as [number, number, number, number];
			};

			for (let i = num; i <= num2; i++) {
				setColor(this.writeX, i, 255, 255, 255, 255);
				if (i + 1 < this.height) {
					setColor(this.writeX, i + 1, 255, 255, 255, Math.max(50, getColor(this.writeX, i + 1)[3]));
				}
				if (i - 1 >= 0) {
					setColor(this.writeX, i - 1, 255, 255, 255, Math.max(50, getColor(this.writeX, i - 1)[3]));
				}
				if (this.writeX + 1 < this.width) {
					setColor(this.writeX + 1, i, 255, 255, 255, Math.max(50, getColor(this.writeX + 1, i)[3]));
				}
				if (this.writeX - 1 >= 0) {
					setColor(this.writeX - 1, i, 255, 255, 255, Math.max(50, getColor(this.writeX - 1, i)[3]));
				}
			}
			for (let j = 0; j < this.width; j++) {
				for (let k = 0; k < this.height; k++) {
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
			ecgCtx.fillRect(0, 0, this.width, this.height);
			ecgCtx.globalCompositeOperation = "source-over";
		}
		ctx.drawImage(this.ecgCanvas, 0, 0, this.width, this.height, 39 * SCALE, 58 * SCALE, this.width * SCALE, this.height * SCALE);
	}
}

const ecg = new EcgController();

const drawAll = (delta: number) => {
	ctx.clearRect(0, 0, WIDTH * SCALE, HEIGHT * SCALE);
	drawBase();
	ecg.draw(delta);
};

let lastT = 0;
setInterval(() => {
	if (!lastT) {
		lastT = Date.now();
		return;
	}
	const delta = (Date.now() - lastT) / 1000;
	tickCirculation(delta);
	tickControls();
	drawAll(delta);
	lastT = Date.now();
}, 1000 / 60);
drawBase();
