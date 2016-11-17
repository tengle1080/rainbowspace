Vue.component(
	'viewport',
	{
		data: function(){
			return {
				width: 0,
				height: 0,
				clickable: false
			};
		},
		mounted: function(){
			new Viewport(this.$el, this);
		},
		beforeMount: function () {
			document.addEventListener('resize', resizeWindowEventHandler);
			window.addEventListener('resize', resizeWindowEventHandler);
		},
		beforeDestroy: function () {
			document.removeEventListener('resize', resizeWindowEventHandler);
			window.removeEventListener('resize', resizeWindowEventHandler);
		},
		template: `<canvas class="viewport" :width="width" :height="height" :class="{clickable: clickable}" />`
	}
);

let viewportList = [];
let viewport;
let Viewport = function(canvas, vueComponentInstance){
	let p = this;
	p.width = 0;
	p.height = 0;
	p.scene = new THREE.Scene();
	p.cameraMap = {
		perspective: new THREE.PerspectiveCamera(45, 1, 0.1, 1000),
		orthographic: new THREE.OrthographicCamera(0, 0, 0, 0, 0, 1000),
	};
	p.camera = null;
	p.renderer = new THREE.WebGLRenderer({
		canvas: canvas,
		antialias: true,
		alpha: true
	});
	p.canvas = canvas;
	p.vue = vueComponentInstance;

	p.ambientLight = new THREE.AmbientLight(0xffffff);
	p.scene.add(p.ambientLight);

	p.cubeGeom = new THREE.BoxGeometry(1, 1, 1);
	p.cubeMaterial = new THREE.MeshNormalMaterial();
	p.cube = new THREE.Mesh(p.cubeGeom, p.cubeMaterial);
	p.cube.scale.setScalar(10);
	p.cube.material.wireframe = true;
	p.scene.add(p.cube);

	p.vertifier = new Vertifier({
		imageUrl: settings.image,
		callback: function(){
			//not quite sure why this doesn't work unless I add it after the image load
			p.cube.remove(p.vertifier.particleSystem);
			p.cube.add(p.vertifier.particleSystem);
		},
		dataCanvas: dataCanvas
	});

	p.grid = new THREE.GridHelper( 200, 20 );
	p.grid.position.y = -50;
	p.grid.material.opacity = 0.5;
	p.grid.material.transparent = true;
	p.grid.material.wireframeLinewidth = 20;
	p.scene.add( p.grid );

	p.sizeWindow();
	viewportList.push(p);
	viewport = p;
};

Viewport.prototype = {
	sizeWindow: function () {
		let p = this;
		let ratio = window.devicePixelRatio || 1;
		p.width = p.canvas.clientWidth * ratio;
		p.height = p.canvas.clientHeight * ratio;
		p.vue.width = p.width;
		p.vue.height = p.height;

		p.cameraMap.perspective.aspect = p.width / p.height;
		p.cameraMap.perspective.updateProjectionMatrix();

		p.orthographicMultiplier = 1 / 64;
		let oWidth = p.width * p.orthographicMultiplier;
		let oHeight = p.height * p.orthographicMultiplier;
		p.cameraMap.orthographic.right  =  oWidth;
		p.cameraMap.orthographic.left   = -oWidth;
		p.cameraMap.orthographic.top    =  oHeight;
		p.cameraMap.orthographic.bottom = -oHeight;
		p.cameraMap.orthographic.updateProjectionMatrix();

		//p.renderer.setPixelRatio(ratio);
		p.renderer.setViewport(0, 0, p.width, p.height);
	},
	render: function (time) {
		let p = this;
		p.cube.rotation.x += 0.005;
		p.cube.rotation.y += 0.01;

		p.camera = p.cameraMap[settings.cameraMode];
		p.camera.position.z = 25;
		if(p.vertifier.imageUrl !== settings.image){
			p.vertifier.loadImage(settings.image);
		}
		if(p.vertifier.mapMethodName !== settings.displayMethod){
			p.vertifier.mapColorsToVerts(settings.displayMethod);
		}
		p.renderer.render(p.scene, p.camera);
	}
};

let resizeWindowEventHandler = function () {
		viewportList.forEach(function (item) {
			item.sizeWindow();
		});
	},
	renderAllViews = function (time) {
		viewportList.forEach(function (item) {
			item.render(time);
		});
	};

let go = true,
	start = function(){
		go = true;
		requestAnimationFrame(render);
	},
	stop = function(){
		go = false;
	};

let render = function (time){
	if(go){
		requestAnimationFrame(render);
	}
	renderAllViews(time);
};

start();