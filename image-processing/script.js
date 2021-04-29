"use strict";

import "./twgl-full.min.js";
import webGLBlur from './webgl/blur.js'; 

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

	calculateButton.addEventListener('click', function () {
		reset();
		write(performance1, `Running...`);

		const startTime = performance.now();
		img1.onload = function () {
			this.onload = noop();
		}
		const newCanvas = filterOperation(filterType, rendererOption1)(img1);
		const endTime = performance.now();
		write(performance1, `${(endTime - startTime)} ms`);
		replaceImage(img1, newCanvas);

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

	function reset() {
		img1.src = "lenna.png";
		img1.onload = noop();
		img2.src = "lenna.png";
		img2.onload = noop();
		write(performance1, "");
		write(performance2, "");
	}

	function write(element, text) {
		element.textContent = text;
	}

	function noop() {
		return;
	}

	function grayscale(img) {
		const canvas = document.createElement('canvas');
		const { width, height } = img;

		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0, width, height);

		const imageData = ctx.getImageData(0, 0, width, height);
		const pixels = imageData.data;

		for (let i = 0; i < pixels.length; i+=4 ) {
			const lightness = (pixels[i]*0.299 + pixels[i+1]*0.587 + pixels[i+2]*0.114);

			pixels[i] = lightness;
			pixels[i+1] = lightness;
			pixels[i+2] = lightness;
		}

		ctx.putImageData(imageData, 0, 0);

		return canvas;
	}

	function blur(img) {
		const canvas = document.createElement('canvas');
		const { width, height } = img;

		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext('2d');
		ctx.filter = 'blur(4px)';

		ctx.drawImage(img, 0, 0, width, height);

		return canvas;
	}

	function filterOperation(type, renderer) {
		switch (type) {
			case "blur":
				return renderer === "0" ? blur : webGLBlur;
			case "grayscale":
				return grayscale;
			default:
				return noop;
		}
	}

	function replaceImage(image, canvas) {
		canvas.toBlob(function (blob) {
			image.src = URL.createObjectURL(blob);
		})
	}

	initInfo();
})();