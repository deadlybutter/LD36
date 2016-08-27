// http://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SKY_COLOR_LIGHT = new THREE.Color(0xbfd1e5);
const SKY_COLOR_DARK = 0x111111;
const GROUND_COLOR = 0xCBA862;
const CAMERA_PAN_RADIUS = 75;
// const CAMERA_PAN_SPEED = .01;
const CAMERA_PAN_SPEED = .1;
const SUN_PAN_RADIUS = 10;
const SUN_PAN_SPEED = 0.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const textureLoader = new THREE.TextureLoader();
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

const sun = new THREE.DirectionalLight(0xFFFFFF, 1);
sun.position.set(0, 1, 0);
scene.add(sun);

const SKIN_COLOR_LIGHT = 0xD7AF88;
const SKIN_COLOR_DARK = new THREE.Color(0x080403);
const BODY = new THREE.BoxGeometry(1, 2, 1);

class Worker {
  constructor(pos) {
    this.skinColor = new THREE.Color(SKIN_COLOR_LIGHT).lerp(SKIN_COLOR_DARK, Math.random());
    this.skinMaterial = new THREE.MeshLambertMaterial({color: this.skinColor});
    this.playerMesh = new THREE.Group();
    this.chestMesh = new THREE.Mesh(BODY, this.skinMaterial);

    this.playerMesh.add(this.chestMesh);

    this.playerMesh.position.set(pos);
    scene.add(this.chestMesh);

    // this.direction = new THREE.Vector3(0, 0, 0);
  }
}
new Worker(new THREE.Vector3(2, 2, 2));

// Temp pyramid
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshLambertMaterial({wireframe: false, color: 0xffffff});
function generatePyramidLayer(y, baseWidth) {
  const width = baseWidth - (y * 2);
  for (var x = 0; x < width; x++) {
    for (var z = 0; z < width; z++) {
      var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      const cubeX = (x + y) - (baseWidth / 2);
      const cubeZ = (z + y) - (baseWidth / 2);
      cube.position.set(cubeX, y + 1, cubeZ);
      scene.add(cube);
    }
  }

  if (x) {
    generatePyramidLayer(y + 1, baseWidth);
  }
}
//generatePyramidLayer(0, 49);

const terrainGeometry = new THREE.PlaneGeometry(1000, 1000, 25, 25);
terrainGeometry.rotateX(-Math.PI / 2);
terrainGeometry.vertices.forEach((vertice) => {
  vertice.y = getRandomArbitrary(-1, 1);
});

const sandSpec = textureLoader.load("img/sand_spec.png");
// const terrainTexture = new THREE.MeshLambertMaterial({color: GROUND_COLOR, emissive: 0x3e0000, side: THREE.DoubleSide, emissiveMap: sandSpec});
const terrainTexture = new THREE.MeshLambertMaterial({color: GROUND_COLOR});
const terrain = new THREE.Mesh(terrainGeometry, terrainTexture);
scene.add(terrain);

camera.position.z = 100;
camera.position.y = 25;

function render() {
  requestAnimationFrame(render);

  const elapsedTime = clock.getElapsedTime();

  camera.position.x = CAMERA_PAN_RADIUS * Math.cos(CAMERA_PAN_SPEED * elapsedTime);
  camera.position.z = CAMERA_PAN_RADIUS * Math.sin(CAMERA_PAN_SPEED * elapsedTime);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  sun.position.x = SUN_PAN_RADIUS * Math.cos(SUN_PAN_SPEED * elapsedTime);
  sun.position.y = SUN_PAN_RADIUS * Math.sin(SUN_PAN_SPEED * elapsedTime);

  const skyAlpha = Math.max(sun.position.y / SUN_PAN_RADIUS, 0);
  renderer.setClearColor(new THREE.Color(SKY_COLOR_DARK).lerp(SKY_COLOR_LIGHT, skyAlpha), 1);

  renderer.render(scene, camera);
  stats.update();
}
render();
