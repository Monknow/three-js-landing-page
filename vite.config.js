// vite.config.js
const {resolve} = require("path");
const {defineConfig} = require("vite");

module.exports = defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				severalMoons: resolve(__dirname, "several-moons.html"),
				rotatingMoon: resolve(__dirname, "rotating-moon.html"),
				mainBanner: resolve(__dirname, "main-banner.html"),
			},
		},
	},
});
