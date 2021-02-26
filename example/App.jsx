import React, { useEffect } from "react";
import { LottieRenderer } from "../src";
import * as o3 from "oasis-engine";
import "./App.css";

function App() {
	useEffect(() => {
		const engine = new o3.WebGLEngine("canvas");

		engine.canvas.resizeByClientSize();

		const root = engine.sceneManager.activeScene.createRootEntity();
		const box = root.createChild("box");
		const renderer = box.addComponent(o3.GeometryRenderer);
		renderer.geometry = new o3.CuboidGeometry(engine);
		renderer.material = new o3.PBRMaterial(engine);

		const cameraEntity = root.createChild("camera");
		const camera = cameraEntity.addComponent(o3.Camera);
		camera.backgroundColor = new o3.Vector4(0.3, 0.3, 0.3, 1);
		cameraEntity.transform.setPosition(10, 10, 10);
		cameraEntity.transform.lookAt(new o3.Vector3(0, 0, 0));


		root.addComponent(LottieRenderer);

		engine.run();
	}, []);

	return <canvas id="canvas"></canvas>;
}

export default App;
