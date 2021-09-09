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

		// lion
		engine.resourceManager.load<Entity>({
			urls: [
				'https://gw.alipayobjects.com/os/bmw-prod/9ad65a42-9171-47ab-9218-54cf175f6201.json',
				'https://gw.alipayobjects.com/os/bmw-prod/90779ce2-50f1-4780-ae74-725083eba852.atlas',
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
			clone.transform.setPosition(2, 0, 0);
			lottie1.isLooping = true;
			lottie1.speed = 0.5;
			lottie1.play();
		});

		// 3d
		engine.resourceManager.load<Entity>({
			urls: [
				"https://gw.alipayobjects.com/os/bmw-prod/70bed2d5-7284-44bf-9df6-638f66945ffd.json",
				"https://gw.alipayobjects.com/os/bmw-prod/a2853204-2d4a-48e5-9cb7-b89de8dcc7bf.atlas"
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

		// multi keyframe property
		engine.resourceManager.load<Entity>({
			urls: [
				"https://gw.alipayobjects.com/os/bmw-prod/32420b26-7305-46ef-bfa1-48c5d6b2a45e.json",
				"https://gw.alipayobjects.com/os/bmw-prod/3c054399-2b10-4d68-96f7-0973e3d9ace6.atlas"
			],
			type: 'lottie'
		}).then((lottieEntity) => {
			root.addChild(lottieEntity);
			const lottie:LottieAnimation = lottieEntity.getComponent(LottieAnimation);
			lottie.isLooping = true;
			lottieEntity.transform.setPosition(3, 2, 0);
			lottieEntity.transform.setScale(0.5, 0.5, 0.5);
			lottie.play();
		});

		engine.run();
	}, []);

	return <canvas id="canvas"></canvas>;
}

export default App;
