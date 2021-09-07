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
			clone.transform.setPosition(2, 0, 0);
			lottie1.isLooping = true;
			lottie1.speed = 0.5;
			lottie1.play();
		});

		engine.resourceManager.load<Entity>({
			urls: [
				"https://gw.alipayobjects.com/os/bmw-prod/70bed2d5-7284-44bf-9df6-638f66945ffd.json",
				"https://gw.alipayobjects.com/os/bmw-prod/66b4c260-bbf1-4e7a-90a5-554edd43168c.atlas"
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

		engine.resourceManager.load<Entity>({
			urls: [
				"https://gw.alipayobjects.com/os/OasisHub/2c60c9b9-f82f-4c86-83f3-38a34bcf8b4a/870d1b337917bdb9bf024e191ba2a424-oasis-1630915668988-%25E5%258A%25A8%25E6%2595%2588%25E5%258C%25BA%25E5%259F%259F.json",
				"https://gw.alipayobjects.com/os/OasisHub/385e89f5-3862-43f5-9208-4b752481216e/05997b6d18c03eea5acbd3ed26cd59c3-oasis-1630915668988-%25E5%258A%25A8%25E6%2595%2588%25E5%258C%25BA%25E5%259F%259F.atlas"
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
