import { resolve } from "path";
/** @type {import('vite').UserConfig} */
export default {
	build: {
		minify: false,
		rolldownOptions: {
			input: {
				main: resolve(import.meta.dirname, "index.html"),
				ecg: resolve(import.meta.dirname, "ecg.html"),
			},
		}
	},
};
