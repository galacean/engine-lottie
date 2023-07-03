import React, { useEffect } from "react";
import { LottieAnimation } from "../src";
import { Camera, Entity, Vector3, WebGLEngine } from "@galacean/engine";
import { OrbitControl } from "@galacean/engine-toolkit-controls";
import * as dat from 'dat.gui';
import "./App.css";

async function init() {
	// gui
	const gui = new dat.GUI({ name: 'My GUI' });

	const demos = {
		'贝壳红包': [
			"https://gw.alipayobjects.com/os/bmw-prod/01e685be-4090-4e9c-bdef-f437038a4a78.json",
			"https://gw.alipayobjects.com/os/bmw-prod/07dcd051-b3d2-4f36-9459-725ae66d9cbf.atlas"
		],
		'3d': [
			"https://gw.alipayobjects.com/os/bmw-prod/70bed2d5-7284-44bf-9df6-638f66945ffd.json",
			"https://gw.alipayobjects.com/os/bmw-prod/a2853204-2d4a-48e5-9cb7-b89de8dcc7bf.atlas"
		],
		'芝麻工作证': [
			"https://gw.alipayobjects.com/os/bmw-prod/32420b26-7305-46ef-bfa1-48c5d6b2a45e.json",
			"https://gw.alipayobjects.com/os/bmw-prod/3c054399-2b10-4d68-96f7-0973e3d9ace6.atlas"
		],
		'花花卡': [
			"https://gw.alipayobjects.com/os/bmw-prod/b46be138-e48b-4957-8071-7229661aba53.json",
			"https://gw.alipayobjects.com/os/bmw-prod/6447fc36-db32-4834-9579-24fe33534f55.atlas"
		],
		'灯牌': [
			"https://gw.alipayobjects.com/os/bmw-prod/bbf83713-c23f-4981-8b8d-241d905fc3bf.json",
			"https://gw.alipayobjects.com/os/bmw-prod/d9b42223-b1ae-4f51-b489-75b2f36a2b2d.atlas"
		],
		'频道氛围1': [
			"https://gw.alipayobjects.com/os/OasisHub/bbbbd4a1-6356-46f8-8c5e-eab55b5a137a/lottie.json",
			"https://gw.alipayobjects.com/os/OasisHub/c0730585-4f56-4bf8-9dca-4d027b4826dd/lottie.atlas"
		],
		'频道氛围2': [
			"https://gw.alipayobjects.com/os/OasisHub/cb3c7c17-d0c0-4ba3-bbb6-bb009ccd6f96/lottie.json",
			"https://gw.alipayobjects.com/os/OasisHub/62c1e950-49c7-4428-a47d-d628696330ea/lottie.atlas"
		],
		'频道氛围3': [
			"https://gw.alipayobjects.com/os/OasisHub/58bce243-16e0-45f4-b1e7-3475e03b8f7a/lottie.json",
			"https://gw.alipayobjects.com/os/OasisHub/01469a2c-b8ed-4f13-9886-b235a2e326b0/lottie.atlas"
		],
		'小狮子': [
			'https://gw.alipayobjects.com/os/bmw-prod/9ad65a42-9171-47ab-9218-54cf175f6201.json',
			'https://gw.alipayobjects.com/os/bmw-prod/90779ce2-50f1-4780-ae74-725083eba852.atlas',
		],
		'宝箱': [
			"https://gw.alipayobjects.com/os/bmw-prod/84c13df1-567c-4a67-aa1e-c378ee698c55.json",
			"https://gw.alipayobjects.com/os/bmw-prod/965eb2ca-ee3c-4c54-a502-7fdc0673f1d7.atlas"
		],
		'大桔': [
			"https://gw.alipayobjects.com/os/bmw-prod/da290d57-5d7a-4169-bfa3-b61e3dbe34f9.json",
			"https://gw.alipayobjects.com/os/bmw-prod/7e1416d6-64d6-4649-8bc1-fefce8d45adc.atlas"
		],
		'年年有鱼': [
			'https://gw.alipayobjects.com/os/OasisHub/14a29798-ea24-42db-93be-462be45f2a85/lottie.json',
			'https://gw.alipayobjects.com/os/OasisHub/b60595c5-3d59-42a8-8bf9-f4323c704189/lottie.atlas'
		],
		'base64': [
			"https://gw.alipayobjects.com/os/bmw-prod/6521d990-6218-4308-aa98-bd7514b9e18f.json",
			// 'https://gw.alipayobjects.com/os/finxbff/lolita/97cecb8f-ff16-4fe1-8344-3b8f04ac3713/lottie.json'
			// 'https://gw.alipayobjects.com/os/OasisHub/d9d330ca-26fe-45c4-8127-d59a2620dc15/data.json'
			// 'https://gw.alipayobjects.com/os/OasisHub/62ee911f-04ac-414c-b100-a18bae585f35/data.json'
			// 'https://gw.alipayobjects.com/os/OasisHub/13a05f71-8e93-4569-847f-eb7fbd8dca2d/data.json'
		],
		'818': [
			'https://gw.alipayobjects.com/os/bmw-prod/3cb395d8-5196-4382-9459-e4379f9414f3.json',
			'https://gw.alipayobjects.com/os/bmw-prod/4bd3f75c-ce9f-4d67-bf28-adbc65fad8b2.atlas'
		],
		"碎片": [
			"https://mdn.alipayobjects.com/huamei_w1o8la/afts/file/A*GxWPRbeur0MAAAAAAAAAAAAADsB_AQ"
		]
	}

	let curLottie: LottieAnimation | null;

	gui.add({ name: 'base64' }, 'name', Object.keys(demos)).onChange((v) => {
		loadLottie(v);
	})
	gui.add({ alpha: 1 }, 'alpha', 0, 1).onChange((v) => {
		if (curLottie) {
			curLottie.alpha = v;
		}
	})
	// gui add button
	gui.add(
		{ 
			play: () => {
				if (curLottie) {
					if (curLottie.isPlaying) {
						curLottie.pause();
					}
					else {
						curLottie.play();
					}
				}
			},
		}, 'play').name('Play');

	let lastLottieEntity: Entity;

	const loadLottie = (v) => {
		engine.resourceManager.load<Entity>({
			urls: demos[v],
			type: 'lottie'
		}).then((lottieEntity) => {
			if (lastLottieEntity) {
				lastLottieEntity.destroy();
			}

			root.addChild(lottieEntity);
			lastLottieEntity = lottieEntity;
			const lottie: LottieAnimation = lottieEntity.getComponent(LottieAnimation);
			curLottie = lottie;
			lottie.isLooping = true;
			// lottie.speed = 0.5;
			// destroy resource if need not clone
			lottie.resource.destroy();
			// lottie.play();

			// lottieEntity.clone();

			// test destroy
			// setTimeout(() => {
			// 	console.log('destroy')
			// 	lottieEntity.destroy();
			// }, 2000);
		});
	}

	const engine = await WebGLEngine.create({ canvas: "canvas" })

	engine.canvas.resizeByClientSize();

	const root = engine.sceneManager.activeScene.createRootEntity();

	const cameraEntity = root.createChild("camera");
	const camera = cameraEntity.addComponent(Camera);
	cameraEntity.transform.setPosition(0, 0, 10);
	cameraEntity.transform.lookAt(new Vector3(0, 0, 0));
	cameraEntity.addComponent(OrbitControl);

	loadLottie('base64');

	engine.run();

}

function App() {
	useEffect(() => {
		init()
	}, []);

	return <canvas id="canvas"></canvas>;
}

export default App;
