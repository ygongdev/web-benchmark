"use strict";

import { blur, glBlur } from './webgl/blur.js'; 
import { grayscale, glGrayscale } from './webgl/grayscale.js';

(function () {
	const globalGL = document.createElement('canvas').getContext('webgl');
	const isWebGLSupported = !!globalGL;
	const img1 = document.getElementById("img-1");
	const img2 = document.getElementById("img-2");
	const calculateButton = document.getElementById('compare-btn');
	const filterSelect = document.getElementById('filter');
	const performance1 = document.getElementById('performance-1');
	const performance2 = document.getElementById('performance-2');
	const renderer1 = document.getElementById('renderer-1');
	const renderer2 = document.getElementById('renderer-2');
	const resetBtn = document.getElementById('reset-btn');
	const compareResult = document.getElementById('compare-result');

	let rendererOption1 = renderer1.value;
	let rendererOption2 = renderer2.value;

	let filterType = filterSelect.value;

	resetBtn.addEventListener('click', function (evt) {
		reset();
	});

	renderer1.addEventListener('change', function (evt) {
		rendererOption1 = evt.target.value;
	});

	renderer2.addEventListener('change', function (evt) {
		rendererOption2 = evt.target.value;
	});

	filterSelect.addEventListener('change', function (evt) {
		filterType = evt.target.value;
	});

	calculateButton.addEventListener('click', async function () {
		await reset();

		write(performance1, `Running...`);
		const startTime1 = performance.now();
		const newCanvas1 = filterOperation(filterType, rendererOption1)(img1);
		const endTime1 = performance.now();
		const delta1 = endTime1 - startTime1;
		write(performance1, `${delta1} ms`);
		await replaceImage(img1, newCanvas1);

		write(performance2, `Running...`);
		const startTime2 = performance.now();
		const newCanvas2 = filterOperation(filterType, rendererOption2)(img2);
		const endTime2 = performance.now();
		const delta2 = endTime2 - startTime2;
		write(performance2, `${delta2} ms`);

		await replaceImage(img2, newCanvas2);

		let result = "";
		const rendererText1 = renderer1.options[renderer1.selectedIndex].text;
		const rendererText2 = renderer2.options[renderer2.selectedIndex].text;
		if (delta2 > delta1) {
			result = `
				<b>${rendererText1}</b> was <b style="color: green">${((delta2 / delta1 - 1) * 100).toFixed(2)}%</b> faster than <b>${rendererText2}</b>
			`
		} else if (delta2 < delta1) {
			result = `
				<b>${rendererText1}</b> was <b style="color: red">${((delta1 / delta2 - 1) * 100).toFixed(2)}%</b> slower than <b>${rendererText2}</b>
			`
		} else {
			result = `
				${rendererText1} was same as ${rendererText2}
			`
		}
		write(compareResult, result);
	});

	function initInfo() {
		const cpu = document.getElementById("cpu-info");
		cpu.textContent = navigator.hardwareConcurrency;

		const gpu = document.getElementById('gpu-info');
		if (isWebGLSupported) {
			const debugInfo = globalGL.getExtension('WEBGL_debug_renderer_info');
			if (debugInfo) {
				gpu.textContent = globalGL.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
			} else {
				gpu.textContent = "Can not extract GPU info";
			}
		}
	}

	async function reset() {
		const img1Promise = new Promise(function(resolve, reject) {
			img1.src = "lenna.png";
			img1.onload = function() {
				resolve();
			}
		});

		const img2Promise = new Promise(function(resolve, reject) {
			img2.src = "lenna.png";
			img2.onload = function() {
				resolve();
			}
		});
		write(performance1, "");
		write(performance2, "");
		write(compareResult, "");

		return Promise.all([img1Promise, img2Promise]);
	}

	function write(element, text) {
		element.innerHTML = text;
	}

	function noop() {
		return;
	}


	function filterOperation(type, renderer) {
		switch (type) {
			case "blur":
				return renderer === "0" ? blur : glBlur;
			case "grayscale":
				return renderer === "0" ? grayscale : glGrayscale;
			default:
				return noop;
		}
	}

	function replaceImage(image, canvas) {
		return new Promise(function(resolve, reject) {
			canvas.toBlob(function (blob) {
				image.src = URL.createObjectURL(blob);
				image.onload = function() {
					resolve();
				}
			});
		})
	}

	initInfo();
})();