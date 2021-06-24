import React, { useEffect } from "react";
import { LottieAnimation } from "../src";
import {  Camera, Entity, Vector3, Vector4, WebGLEngine } from "oasis-engine";
import { OrbitControl } from "@oasis-engine/controls";
import "./App.css";

function App() {
	useEffect(() => {
		const engine = new WebGLEngine("canvas");

		engine.canvas.resizeByClientSize();

		const root = engine.sceneManager.activeScene.createRootEntity();

		const cameraEntity = root.createChild("camera");
		const camera = cameraEntity.addComponent(Camera);
		cameraEntity.transform.setPosition(0, 0, 10);
		cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
		cameraEntity.addComponent(OrbitControl);

		engine.resourceManager.load<Entity>({
			urls: [
				'https://gw.alipayobjects.com/os/OasisHub/20759aba-867f-4256-8504-935743240c78/data.json',
				'https://gw.alipayobjects.com/os/bmw-prod/083ff1ac-15d9-42cb-8d7a-5b7c39b81f5f.json',
				'https://gw.alipayobjects.com/mdn/rms_e54b79/afts/img/A*Ax4DSrekVhEAAAAAAAAAAAAAARQnAQ'
			],
			type: 'lottie'
		}).then((lottieEntity) => {
			root.addChild(lottieEntity);
			const lottie:LottieAnimation = lottieEntity.getComponent(LottieAnimation);
			lottieEntity.transform.setPosition(0, 2, 0);
			lottie.isLooping = true;
			lottie.speed = 1;
			lottie.play();
		});

		engine.resourceManager.load<Entity>({
			urls: [
				// 'https://gw.alipayobjects.com/os/bmw-prod/259dfeb0-4d78-4d1f-a73c-dcb3b681aaa8.json',
				'https://gw.alipayobjects.com/os/bmw-prod/b0019edb-1a08-4f22-8071-74b9d4eb22bf.json',
				'https://gw.alipayobjects.com/os/bmw-prod/39d48a7c-0a55-4e61-9f67-952f0bab02b4.json',
				'https://gw.alipayobjects.com/mdn/rms_d27172/afts/img/A*XfdwTLGz-psAAAAAAAAAAAAAARQnAQ'
			],
			type: 'lottie'
		}).then((lottieEntity) => {
			root.addChild(lottieEntity);
			const lottie:LottieAnimation = lottieEntity.getComponent(LottieAnimation);
			lottie.isLooping = true;
			lottie.speed = 1;
			lottieEntity.transform.setScale(0.5, 0.5, 1);
			lottie.play();
		});

		engine.run();
	}, []);

	return <canvas id="canvas"></canvas>;
}

export default App;
