import { VisualEcgController } from "./assets/ecg";
import "./ecgStyles.css";
// const bpmList = [70, 100, 150, 200];
// const fibList = [0, 10, 25, 50, 75, 90];
// const ecgs = fibList.flatMap(fib => bpmList.map(bpm => new VisualEcgController(bpm, fib)));

// const app = document.getElementById("app")!;

// app.style.gridTemplateColumns = `repeat(${bpmList.length}, auto)`

// const ecgCanvasMap = new Map<VisualEcgController, CanvasRenderingContext2D>();

// for (const ecg of ecgs) {
// 	const container = document.createElement("div");
// 	container.classList.add("entry");
// 	const canvas = document.createElement("canvas");
// 	canvas.width = ecg.canvas.width;
// 	canvas.height = ecg.canvas.height;
// 	const label = document.createElement("h1");
// 	label.innerText = `BPM: ${ecg.heartRate}, Fibrillation: ${ecg.fibrillationProgress}`;
// 	container.append(label);
// 	container.append(canvas);
// 	const ctx = canvas.getContext("2d")!;
// 	ctx.fillStyle = "black";
// 	ecgCanvasMap.set(ecg, ctx);
//     app.append(container)
// }

// setInterval(() => {
// 	for (const [ecg, ctx] of ecgCanvasMap) {
// 		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
// 		ctx.drawImage(ecg.canvas, 0, 0);
// 	}
// }, 1000 / 60);
const app = document.getElementById("app")!;
const ecg = new VisualEcgController(70, 0);

const container = document.createElement("div");
container.classList.add("entry");
const canvas = document.createElement("canvas");
canvas.width = ecg.canvas.width;
canvas.height = ecg.canvas.height;
const label = document.createElement("h1");
container.append(label);
container.append(canvas);
const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "black";
app.append(container);

const change = () => {
	label.innerText = `BPM: ${ecg.heartRate}, Fibrillation: ${ecg.fibrillationProgress}`;
};

const bpm = document.getElementById("bpm") as HTMLInputElement;
bpm.addEventListener("input", e => {
	ecg.heartRate = +bpm.value;
	change();
	ecg.repaint();
});
const fib = document.getElementById("fib") as HTMLInputElement;
fib.addEventListener("input", e => {
	ecg.fibrillationProgress = +fib.value;
	change();
	ecg.repaint();
});
change();

setInterval(() => {
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.drawImage(ecg.canvas, 0, 0);
}, 1000 / 60);

bpm.value = "70";
fib.value = "0";
