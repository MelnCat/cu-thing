import defibBackgroundUrl from "./assets/image/defibBackground.png";
import manualDefibChargeUrl from "./assets/image/manualDefibCharge.png";
import manualDefibChargingUrl from "./assets/image/manualDefibCharging.png";
import manualDefibDialUrl from "./assets/image/manualDefibDial.png";
import manualDefibShockUrl from "./assets/image/manualDefibShock.png";

import manualDefibSoundUrl from "./assets/audio/manualdefib.ogg";

import { evaluateAnimationCurve, heartCurveArrythmia, heartCurveNormal } from "./curves";
import "./style.css";

const SCALE = 4;
const WIDTH = 256;
const HEIGHT = 220;

let config = {
	int: 10,
};

const fibrillationrate = 1;

let state = {
	heartRate: 70,
	fibrillationProgress: 0,
	defibShockedFrames: 0,
	randomFibrillationVariation: 0, // TODO figure ts out
	heartProg: 0,
	itemCharge: 1,
	bloodPressure: 89,
	respiratoryRate: 100,
	bloodViscosity: 0,

	charge: 0,
	desiredCharge: 100,
	shockCount: 0,
	rangeOffset: Math.random() * 2 - 1,
	bloodOxygen: 100,
	dialAngle: 0,
	charging: false,
	get inCardiacArrest() {
		return this.heartRate < 20;
	},
	get fibrillationRising() {
		return this.heartRate > 200 || this.fibrillationForced || this.bloodPressure < 88 || this.bloodViscosity > 80;
	},
	fibrillationForced: false,
	heartRatePressureOffset: 0,
	bloodVesselSize: 1,
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
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const moveTowards = (current: number, target: number, maxDelta: number) => {
	if (Math.abs(target - current) <= maxDelta) {
		return target;
	}
	return current + Math.sign(target - current) * maxDelta;
};

const startFibrillation = (forced: boolean = false) => {
	if (state.fibrillationProgress <= 0) {
		state.fibrillationProgress = 0.1;
	}

	if (forced) {
		state.fibrillationForced = true;
	}
};

const defibBackground = await loadImage(defibBackgroundUrl);
const dialImage = await loadImage(manualDefibDialUrl);
const chargeButtonImage = await loadImage(manualDefibChargeUrl);
const chargingImage = await loadImage(manualDefibChargingUrl);
const shockButtonImage = await loadImage(manualDefibShockUrl);

interface ClickableComponent {
	x: number;
	y: number;
	width: number;
	height: number;
	isIn(x: number, y: number): boolean;
	image: HTMLImageElement;
	onClick(): void;
}

const manualDefibSound = new Audio(manualDefibSoundUrl);

const components: ClickableComponent[] = [
	{
		x: 112,
		y: 160,
		width: chargeButtonImage.width,
		height: chargeButtonImage.height,
		image: chargeButtonImage,
		onClick() {
			state.charging = !state.charging;
		},
		isIn(x, y) {
			return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
		},
	},
	{
		x: 188,
		y: 160,
		width: shockButtonImage.width,
		height: shockButtonImage.height,
		image: shockButtonImage,
		onClick() {
			if (state.charge < 10) return;
			state.shockCount++;
			const chance = 1 - Math.abs(state.fibrillationProgress - state.charge * 0.5) / 40;
			if (Math.random() < chance || state.inCardiacArrest) {
				state.fibrillationProgress = 0;
				if (state.inCardiacArrest && Math.random() < 0.2) {
					state.heartRate = 200;
				}
			}
			state.defibShockedFrames = 20;
			state.heartProg = -1;
			state.bloodPressure = 40;
			//state.itemCharge -= state.charge / 4000 / (1 * 0.01);
			state.charge = 0;
			state.charging = false;
			manualDefibSound.play();
		},
		isIn(x, y) {
			return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
		},
	},
];

const drawBase = () => {
	ctx.drawImage(defibBackground, 0, 0, defibBackground.width * SCALE, defibBackground.height * SCALE);
	if (state.charging) {
		ctx.drawImage(chargingImage, 162 * SCALE, 49 * SCALE, chargingImage.width * SCALE, chargingImage.height * SCALE);
	}
	for (const component of components) {
		ctx.drawImage(component.image, component.x * SCALE, component.y * SCALE, component.width * SCALE, component.height * SCALE);
	}

	ctx.fillStyle = "#ffffff";
	ctx.font = '42px "Retro Gaming"';
	ctx.fillText(state.shockCount.toString(), 50 * SCALE, 53 * SCALE);
	ctx.textAlign = "right";
	ctx.fillText(Math.round(state.charge).toString(), 110 * SCALE, 53 * SCALE);
	ctx.textAlign = "left";
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
	state.bloodOxygen += delta * (state.respiratoryRate * 0.01 - 0.5);
	let num = 100 - Math.abs(moveTowards(state.bloodViscosity, 0, 40)) * 0.4;
	if (state.bloodOxygen > num) {
		state.bloodOxygen = moveTowards(state.bloodOxygen, num, delta * 0.75);
	}
	if (state.bloodOxygen > 100 * 0.3) {
		state.bloodOxygen = moveTowards(state.bloodOxygen, 100 * 0.3, delta * 0.8);
	}
	state.bloodOxygen = clamp(state.bloodOxygen, 0, 100);
	state.bloodViscosity = moveTowards(state.bloodViscosity, 0, delta * 0.05);
	state.bloodViscosity = clamp(state.bloodViscosity, -100, 100);
	const num2 = Math.max(0, state.bloodViscosity);

	let num3 = 100;
	if (state.bloodPressure > 145) {
		num3 -= state.bloodPressure - 145;
	}
	if (state.bloodPressure < 20) {
		num3 = 0;
	}
	num3 -= state.fibrillationProgress * 0.35;
	state.respiratoryRate = moveTowards(state.respiratoryRate, num3, delta * (state.respiratoryRate > 10 ? 8 : 1));
	state.respiratoryRate = clamp(state.respiratoryRate, 0, 100);
	if (state.fibrillationProgress > 0) {
		if (state.fibrillationRising) {
			state.fibrillationProgress += delta * fibrillationrate;
			if (state.heartRate > 280) {
				state.fibrillationProgress += delta * 3 * fibrillationrate;
			}
		} else {
			state.fibrillationProgress -= delta * 0.75;
			if (state.fibrillationProgress < 0) {
				state.fibrillationProgress = 0;
			}
		}
	} else {
		state.fibrillationForced = false;
	}
	if (state.bloodOxygen < 50 || state.bloodPressure < 78 || state.heartRate > 200 || num2 > 95) {
		startFibrillation();
	}
	if (state.fibrillationProgress >= 100) {
		state.fibrillationForced = false;
		state.heartRate = 0;
	}
	state.fibrillationProgress = clamp(state.fibrillationProgress, 0, 100);
	let num4 = 120;
	if (!state.inCardiacArrest) {
		let targetHeartRate = 70;
		targetHeartRate -= num2 * 0.3;
		if (state.bloodPressure < num4 - 5) {
			state.heartRatePressureOffset += delta * 1.5;
		}
		if (state.bloodPressure > num4 + 5) {
			state.heartRatePressureOffset -= delta * 1.5;
		}
		state.heartRatePressureOffset = clamp(state.heartRatePressureOffset, -30, 80);
		targetHeartRate += state.heartRatePressureOffset;
		targetHeartRate += state.fibrillationProgress;
		if (state.fibrillationProgress > 75) {
			targetHeartRate += (state.fibrillationProgress - 75) * 4;
		}
		if (state.fibrillationProgress > 95) {
			targetHeartRate += (state.fibrillationProgress - 95) * 30;
		}
		state.heartRate = lerp(state.heartRate, targetHeartRate, delta * 0.15);
	} else {
		state.heartRate = 0;
	}
	if (state.bloodPressure > num4 + 10) {
		state.bloodVesselSize += delta * 0.0036;
	} else if (state.bloodPressure < num4 - 10) {
		state.bloodVesselSize -= delta * 0.0036;
	} else {
		state.bloodVesselSize = moveTowards(state.bloodVesselSize, 1, delta * 0.0036);
	}
	state.bloodVesselSize = clamp(state.bloodVesselSize, 0.85, 1.15);
	let num6 = clamp(state.heartRate, 0, 215) - 70;
	num6 = !(num6 > 0) ? num6 / 70 : num6 / 200;
	let num8 = 1 - state.fibrillationProgress / 260;
	let num9 = 1 + state.bloodViscosity / 200;
	let num14 = (120 * (1 + num6) * num8 * num9) / state.bloodVesselSize;
	state.bloodPressure = lerp(state.bloodPressure, num14, delta * 0.25);
	state.bloodPressure = clamp(state.bloodPressure, 0, 250);
	state.heartProg += (delta * state.heartRate) / 60;
	if (state.heartProg > 1) {
		if (state.heartProg > 1.2) {
			state.heartProg = 1.2;
		}
		state.heartProg -= 1;
		if (state.fibrillationProgress > 40) {
			let num16 = (state.fibrillationProgress - 40) / 150;
			state.randomFibrillationVariation = 1 + Math.random() * num16 - num16;
		} else {
			state.randomFibrillationVariation = 1;
		}
	}
	state.defibShockedFrames--;
	if (state.defibShockedFrames < 0) {
		state.defibShockedFrames = 0;
	}
};

const tickCharge = (delta: number) => {
	if (state.charging && state.charge < state.desiredCharge) {
		state.charge = moveTowards(state.charge, state.desiredCharge, delta * 40);
	}
	if (state.charging && state.charge >= state.desiredCharge) {
		state.charging = false;
	}
};

let mouseX = 0;
let mouseY = 0;
let mouseDown = false;
let draggingDial = false;
let justClicked = false;
const mouseDownCb = () => {
	mouseDown = true;
	justClicked = true;
};
const mouseMoveCb = (e: MouseEvent) => {
	mouseX = e.clientX;
	mouseY = e.clientY;
};
const mouseUpCb = () => {
	mouseDown = false;
};
document.body.addEventListener("mousedown", mouseDownCb);
document.body.addEventListener("mousemove", mouseMoveCb);
document.body.addEventListener("mouseup", mouseUpCb);
document.body.addEventListener("pointerdown", mouseDownCb);
document.body.addEventListener("pointermove", mouseMoveCb);

const tickControls = () => {
	checkDial();
	checkComponents();
	justClicked = false;
};
const checkDial = () => {
	if (!mouseDown) {
		draggingDial = false;
	}
	const dialCenterX = 28 + dialImage.width / 2;
	const dialCenterY = 154 + dialImage.height / 2;
	const canvasBounds = canvas.getBoundingClientRect();
	const radius = (canvasBounds.width * dialImage.width) / WIDTH / 2;
	const centerX = canvasBounds.left + canvasBounds.width * (dialCenterX / WIDTH);
	const centerY = canvasBounds.top + canvasBounds.height * (dialCenterY / HEIGHT);
	if (justClicked && !draggingDial && mouseDown && (centerX - mouseX) ** 2 + (centerY - mouseY) ** 2 < radius ** 2) {
		draggingDial = true;
	}

	if (!draggingDial) return;
	const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
	let displayAngle = angle + Math.PI / 2;
	if (displayAngle > Math.PI) {
		displayAngle -= 2 * Math.PI;
	}
	displayAngle = Math.min((170 * Math.PI) / 180, Math.max((-170 * Math.PI) / 180, displayAngle));
	state.dialAngle = displayAngle;
	state.desiredCharge = lerp(10, 200, (displayAngle + (170 * Math.PI) / 180) / ((2 * 170 * Math.PI) / 180));
};

const checkComponents = () => {
	if (!justClicked) return;
	const canvasBounds = canvas.getBoundingClientRect();
	const relativeX = ((mouseX - canvasBounds.left) * WIDTH) / canvasBounds.width;
	const relativeY = ((mouseY - canvasBounds.top) * HEIGHT) / canvasBounds.height;
	for (const component of components) {
		if (component.isIn(relativeX, relativeY)) {
			component.onClick();
		}
	}
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

const writeStats = () => {
	if (showHidden) {
		hidden.innerHTML = `<dl>
		<div>
			<dt>Fibrillation</dt>
			<dd>${state.fibrillationProgress.toFixed(1)}</dd>
			<dt>Fibrillation Progressing</dt>
			<dd>${state.fibrillationRising}</dd>
			<dt>Success Chance With Target</dt>
			<dd>${Math.max(0, (1 - Math.abs(state.fibrillationProgress - state.desiredCharge * 0.5) / 40) * 100).toFixed(2)}%</dd>
			<dt>Best Charge for Success</dt>
			<dd>${Math.round(state.fibrillationProgress * 2)}</dd>
		</div>
	</dl>`;
	} else {
		hidden.innerHTML = "";
	}
};

let showHidden = false;
let lastT = 0;
setInterval(() => {
	if (!lastT) {
		lastT = Date.now();
		return;
	}
	const delta = (Date.now() - lastT) / 1000;
	tickCirculation(delta);
	tickCharge(delta);
	tickControls();
	drawAll(delta);
	writeStats();
	lastT = Date.now();
}, 1000 / 60);
drawBase();

(window as any).state = state;

const hidden = document.getElementById("hidden-stats")!;

document.getElementById("fibrillate-button")!.addEventListener("click", () => {
	startFibrillation(true);
});
document.getElementById("random-fibrillate-button")!.addEventListener("click", () => {
	startFibrillation(true);
    state.fibrillationProgress = Math.random() * 100;
});

document.getElementById("bpm-add-10")!.addEventListener("click", () => {
	state.heartRate += 10;
});

document.getElementById("bpm-sub-10")!.addEventListener("click", () => {
	state.heartRate -= 10;
});

document.getElementById("toggle-hidden-button")!.addEventListener("click", () => {
	showHidden = !showHidden;
});