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
				'https://gw.alipayobjects.com/os/bmw-prod/9ad65a42-9171-47ab-9218-54cf175f6201.json',
				'https://gw.alipayobjects.com/os/bmw-prod/58cde292-8675-4299-b400-d98029b48ac7.atlas',
			],
			type: 'lottie'
		}).then((lottieEntity) => {
			root.addChild(lottieEntity);
			const lottie:LottieAnimation = lottieEntity.getComponent(LottieAnimation);
			lottie.isLooping = true;
			lottie.play();

			const clone = lottieEntity.clone();
			root.addChild(clone);
			const lottie1:LottieAnimation = clone.getComponent(LottieAnimation);
			clone.transform.setPosition(0, -2, 0);
			lottie1.isLooping = true;
			lottie1.speed = 0.5;
			lottie1.play();
		});

		engine.resourceManager.load<Entity>({
			urls: [
				"https://gw.alipayobjects.com/os/bmw-prod/fe5aa92d-b573-439d-a14e-9212d45d480d.json",
				"https://gw.alipayobjects.com/os/bmw-prod/56bd6b71-bd34-485c-b727-6cad484d8896.atlas"
			],
			type: 'lottie'
		}).then((lottieEntity) => {
			root.addChild(lottieEntity);
			const lottie:LottieAnimation = lottieEntity.getComponent(LottieAnimation);
			lottie.isLooping = true;
			lottieEntity.transform.setPosition(0, 2, 0);
			lottieEntity.transform.setScale(0.5, 0.5, 0.5);
			lottie.play();
		});

		engine.run();
	}, []);

	return <canvas id="canvas"></canvas>;
}

export default App;
