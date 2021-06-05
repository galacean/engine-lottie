import React, { useEffect } from "react";
import { LottieLoader, LottieRenderer } from "../src";
import { Camera, Vector3, Vector4, WebGLEngine } from "oasis-engine";
import { OrbitControl } from "@oasis-engine/controls";
import "./App.css";

function App() {
	useEffect(() => {
		const engine = new WebGLEngine("canvas");

		engine.canvas.resizeByClientSize();

		const root = engine.sceneManager.activeScene.createRootEntity();
		const box = root.createChild("box");
		// st renderer = box.addComponent(o3.GeometryRenderer);
		// derer.geometry = new o3.CuboidGeometry(engine);
		// derer.material = new o3.PBRMaterial(engine);

		const cameraEntity = root.createChild("camera");
		const camera = cameraEntity.addComponent(Camera);
		camera.backgroundColor = new Vector4(0.3, 0.3, 0.3, 1);
		cameraEntity.transform.setPosition(0, 0, 1000);
		camera.farClipPlane = 10000;
		cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
		cameraEntity.addComponent(OrbitControl);

		engine.resourceManager.load({
			url: 'https://gw.alipayobjects.com/os/OasisHub/20759aba-867f-4256-8504-935743240c78/data.json',
			atlas: 'https://gw.alipayobjects.com/os/bmw-prod/083ff1ac-15d9-42cb-8d7a-5b7c39b81f5f.json',
			type: 'lottie'
		}).then((res) => {
			const lottie = root.createChild("lottie");
			const lottieRenderer = lottie.addComponent(LottieRenderer);
			lottieRenderer.res = res;
		});

		engine.run();
	}, []);

	return <canvas id="canvas"></canvas>;
}

export default App;
