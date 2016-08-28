// http://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// http://stackoverflow.com/questions/11060734/how-to-rotate-a-3d-object-on-axis-three-js
// rotateAroundObjectAxis(this.playerMesh, new THREE.Vector3(0, 1, 0), angle);
function rotateAroundObjectAxis(object, axis, radians) {
    const rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
    object.matrix.multiply(rotObjectMatrix);
    object.rotation.setFromRotationMatrix(object.matrix);
}

function degToRad(deg) {
  return deg * (Math.PI / 180);
}

function radToDeg(rad) {
  return rad * (180 / Math.PI);
}

function developerMode() {
  return localStorage.getItem('ld36-dev') === "true";
}

const SKY_COLOR_LIGHT = new THREE.Color(0xbfd1e5);
const SKY_COLOR_DARK = 0x111111;
const GROUND_COLOR = 0xCBA862;
const GROUND_WIDTH = 500;
// const CAMERA_PAN_RADIUS = 75;
// const CAMERA_PAN_SPEED = .01;
const SUN_PAN_RADIUS = 10;
// const SUN_PAN_SPEED = 0.1;
const SUN_PAN_SPEED = 1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, GROUND_WIDTH * 2);
camera.position.z = 100;
camera.position.y = 25;

if (developerMode()) {
  scene.add(new THREE.AxisHelper(100));
}

const textureLoader = new THREE.TextureLoader();
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(SKY_COLOR_LIGHT);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.15;
controls.enableZoom = true;
controls.enablePan = developerMode();
controls.enableKeys = developerMode();

const raycaster = new THREE.Raycaster();

const stats = new Stats();
document.body.appendChild(stats.dom);

const sun = new THREE.DirectionalLight(0xFFFFFF, 1);
sun.position.set(0, 1, 0);
scene.add(sun);
const sun2 = new THREE.HemisphereLight(SKY_COLOR_LIGHT, GROUND_COLOR, 0.4);
scene.add(sun2);

const terrainGeometry = new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_WIDTH, 25, 25);
terrainGeometry.rotateX(-Math.PI / 2);
terrainGeometry.vertices.forEach((vertice) => {
  vertice.y = getRandomArbitrary(-0.5, 0.5);
});

const sandSpec = textureLoader.load("img/sand_spec.png");
// const terrainTexture = new THREE.MeshLambertMaterial({color: GROUND_COLOR, emissive: 0x3e0000, side: THREE.DoubleSide, emissiveMap: sandSpec});
const terrainTexture = new THREE.MeshLambertMaterial({color: GROUND_COLOR});
const terrain = new THREE.Mesh(terrainGeometry, terrainTexture);
scene.add(terrain);

const CUBE_LENGTH = 1;
const cubeGeometry = new THREE.BoxGeometry(CUBE_LENGTH, CUBE_LENGTH, CUBE_LENGTH);
const cubeMaterial = new THREE.MeshLambertMaterial({wireframe: false, color: 0xffffff});
const availableCubes = [];
const PYRAMID_HEIGHT = developerMode() ? 3 : 17;
var pyramidGrid = [];
for (var i = 0; i < PYRAMID_HEIGHT; i++) {
  pyramidGrid.push([]);
}

function getTotalBlocksInLayer(yTest) {
  var previousWidth = 1;
  for (var y = pyramidGrid.length - 1; y > -1; y--) {
    if (y == yTest) {
      break;
    }
    previousWidth += 2;
  }
  return Math.pow(previousWidth, 2);
}

const PYRAMID_WIDTH = Math.sqrt(getTotalBlocksInLayer(0));

function getNextBlockInLayer(y, reserve) {
  const blocksForLayer = getTotalBlocksInLayer(y);
  if (blocksForLayer == 0) {
    return undefined;
  }
  const width = Math.sqrt(blocksForLayer);
  for (var x = 0; x < width; x++) {
    for (var z = 0; z < width; z++) {
      const blockX = (x + y) - (PYRAMID_WIDTH / 2);
      const blockZ = (z + y) - (PYRAMID_WIDTH / 2);
      const block = new THREE.Vector3(blockX, y, blockZ);

      if (pyramidGrid[y][blockX]) {
        if (!pyramidGrid[y][blockX][blockZ]) {

          if (reserve) {
            pyramidGrid[y][blockX][blockZ] = true;
          }

          return block;
        }
      }
      else {
        if (reserve) {
          pyramidGrid[y][blockX] = [];
          pyramidGrid[y][blockX][blockZ] = true;
        }
        return block;
      }
    }
  }
}

function getNextBlockPlacement() {
  for (var y = 0; y < pyramidGrid.length; y++) {
    const next = getNextBlockInLayer(y, true);
    if (next) {
      return next;
    }
  }
}

function getAvailableBuildingBlock() {
  const index = getRandomInt(0, availableCubes.length);
  const blockId = availableCubes.splice(index, 1)[0];
  return scene.getObjectById(blockId);
}

function addBlockToWorld(pos) {
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(pos.x, pos.y, pos.z);
  scene.add(cube);
  return cube;
}

const GROUND_WIDTH_HALF = GROUND_WIDTH / 2;
const QUARY_WIDTH = GROUND_WIDTH * .10;

function getRandomQuaryPoint() {
  return Math.random() > 0.5 ? getRandomInt(-GROUND_WIDTH_HALF, -GROUND_WIDTH_HALF + QUARY_WIDTH) : getRandomInt(GROUND_WIDTH_HALF, GROUND_WIDTH_HALF - QUARY_WIDTH);
}

function fillQuery(totalBlocks) {
  for (var i = 0; i < totalBlocks; i++) {
    const pos = new THREE.Vector3(0, 4, 0);
    if (Math.random() > 0.5) {
      pos.x = getRandomInt(-GROUND_WIDTH_HALF, GROUND_WIDTH_HALF);
      pos.z = getRandomQuaryPoint();
    }
    else {
      pos.z = getRandomInt(-GROUND_WIDTH_HALF, GROUND_WIDTH_HALF);
      pos.x = getRandomQuaryPoint();
    }

    pos.set(pos.x, pos.y, pos.z);
    const cube = addBlockToWorld(pos);
    availableCubes.push(cube.id);

    raycaster.set(cube.position, new THREE.Vector3(0, -1, 0).normalize());
    const intersections = raycaster.intersectObjects(scene.children);
    if (intersections[0]) {
      cube.position.setY(intersections[0].point.y + CUBE_LENGTH);
    }
  }
}
fillQuery(50);
setInterval(function() {
  if (availableCubes.length <= 20) {
    fillQuery(20);
  }
}, 500);

const SKIN_COLOR_LIGHT = 0xD7AF88;
const SKIN_COLOR_DARK = new THREE.Color(0x080403);
const PLAYER_DIMENSIONS = {
  bodyWidth: 0.5,
  chestHeight: 1,
  legsHeight: .9,
  armLength: .7,
  bicepRadius: .15,
  headLength: 0.3
};
PLAYER_DIMENSIONS.legWidth = PLAYER_DIMENSIONS.bodyWidth * .33;
PLAYER_DIMENSIONS.bodyHeight = PLAYER_DIMENSIONS.legsHeight + PLAYER_DIMENSIONS.chestHeight + PLAYER_DIMENSIONS.headLength;
const BODY = new THREE.BoxGeometry(PLAYER_DIMENSIONS.bodyWidth, PLAYER_DIMENSIONS.chestHeight, PLAYER_DIMENSIONS.bodyWidth);
const LEG = new THREE.BoxGeometry(PLAYER_DIMENSIONS.legWidth, PLAYER_DIMENSIONS.legsHeight, PLAYER_DIMENSIONS.bodyWidth * .75);
const HEAD = new THREE.BoxGeometry(PLAYER_DIMENSIONS.headLength, PLAYER_DIMENSIONS.headLength, PLAYER_DIMENSIONS.headLength);
const ARM = new THREE.BoxGeometry(PLAYER_DIMENSIONS.legWidth, PLAYER_DIMENSIONS.armLength, PLAYER_DIMENSIONS.legWidth);
const BICEP = new THREE.SphereGeometry(PLAYER_DIMENSIONS.bicepRadius)
const WORKER_BASE_SPEED = developerMode() ? 0.001 : .001;
const workerGroups = [];


class Worker {
  constructor(pos, group) {
    this.group = group;

    this.skinColor = new THREE.Color(SKIN_COLOR_LIGHT).lerp(SKIN_COLOR_DARK, Math.random());
    this.skinMaterial = new THREE.MeshLambertMaterial({color: this.skinColor});

    this.playerMesh = new THREE.Object3D();
    this.playerMesh.position.set(pos.x, pos.y, pos.z);

    // If we dont have time for animations make this 1 merged mesh

    this.bodyMesh = new THREE.Mesh(BODY, this.skinMaterial);
    this.playerMesh.add(this.bodyMesh);
    this.bodyMesh.position.setY(PLAYER_DIMENSIONS.legsHeight + .1);

    this.leftLegMesh = new THREE.Mesh(LEG, this.skinMaterial);
    this.playerMesh.add(this.leftLegMesh);
    this.leftLegMesh.position.setX((-PLAYER_DIMENSIONS.bodyWidth / 2) + (PLAYER_DIMENSIONS.legWidth / 2));

    this.rightLegMesh = new THREE.Mesh(LEG, this.skinMaterial);
    this.playerMesh.add(this.rightLegMesh);
    this.rightLegMesh.position.setX((PLAYER_DIMENSIONS.bodyWidth / 2) - (PLAYER_DIMENSIONS.legWidth / 2));

    this.headMesh = new THREE.Mesh(HEAD, this.skinMaterial)
    this.playerMesh.add(this.headMesh);
    this.headMesh.position.setY(PLAYER_DIMENSIONS.legsHeight + .1 + PLAYER_DIMENSIONS.chestHeight - PLAYER_DIMENSIONS.headLength);

    this.leftArmMesh = new THREE.Mesh(ARM, this.skinMaterial);
    this.playerMesh.add(this.leftArmMesh);
    this.leftArmMesh.position.setX(PLAYER_DIMENSIONS.bodyWidth - .15);
    this.leftArmMesh.position.setY(PLAYER_DIMENSIONS.legsHeight + .1);

    this.rightArmMesh = new THREE.Mesh(ARM, this.skinMaterial);
    this.playerMesh.add(this.rightArmMesh);
    this.rightArmMesh.position.setX(PLAYER_DIMENSIONS.bodyWidth - .85);
    this.rightArmMesh.position.setY(PLAYER_DIMENSIONS.legsHeight + .1);

    // if not equal to basic, add bicep
    if (this.group.type != 'basic') {
      this.leftBicepMesh = new THREE.Mesh(BICEP, this.skinMaterial);
      this.leftArmMesh.add(this.leftBicepMesh);

      this.rightBicepMesh = new THREE.Mesh(BICEP, this.skinMaterial);
      this.rightArmMesh.add(this.rightBicepMesh);
    }

    scene.add(this.playerMesh);
  }

  update() {
    const delta = clock.getDelta();
    switch (this.group.state) {
      case "get": case "going back":
        break;
      default:
    }
  }
}

class WorkerGroup {
  constructor(type) {
    this.type = type;
    this.workers = [];
    this.block = {};
    this.startPosition = new THREE.Vector3(PYRAMID_WIDTH / 2, 2, getRandomInt(-(PYRAMID_WIDTH / 2), PYRAMID_WIDTH / 2));
    this.target = this.startPosition;
    this.speed = WORKER_BASE_SPEED;

    this.mesh = new THREE.Object3D();
    this.mesh.position.set(this.startPosition.x, this.startPosition.y, this.startPosition.z);
    scene.add(this.mesh);

    switch (type) {
      case 'basic': this.generateWorkers(4); break;
    }

    const boundingExpand = 2.5
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh).expandByVector(new THREE.Vector3(boundingExpand, boundingExpand, boundingExpand));
    this.getBlockTarget();
  }

  getBlockTarget() {
    this.state = 'get';
    this.block = getAvailableBuildingBlock();
    if (this.block == undefined) {
      setTimeout(this.getBlockTarget.bind(this), 2000);
      return;
    }
    this.target = this.block.position;
  }

  getPlacementTarget() {
    this.state = 'going back';
    this.target = getNextBlockPlacement();
  }

  generateWorkers(amount) {
    for (var i = 0; i < amount; i++) {
      const worker = new Worker(new THREE.Vector3(i / 2, 0, i % 2), this);
      this.workers.push(worker);
      this.mesh.add(worker.playerMesh);
    }
  }

  atTarget() {
    return new THREE.Box3().setFromObject(this.mesh).expandByScalar(1.5).containsPoint(this.target);
  }

  update() {
    if (!this.target) {
      return;
    }

    const dir = new THREE.Vector3().subVectors(this.mesh.position, this.target);
    this.mesh.position.add(dir.multiplyScalar(this.speed).multiplyScalar(-1));

    const theta = Math.atan2(dir.x, dir.z);
    this.mesh.rotation.y = theta;

    raycaster.set(this.mesh.position, new THREE.Vector3(0, -1, 0).normalize());
    const intersections = raycaster.intersectObjects(scene.children);
    if (intersections[0]) {
      this.mesh.position.setY(intersections[0].point.y + PLAYER_DIMENSIONS.legsHeight);
    }

    if (this.state == 'get') {
      if (this.atTarget() && this.block) {
        this.state = 'picking up';
        this.target = new THREE.Vector3().copy(this.block.position);
        scene.remove(this.block);
        this.mesh.add(this.block);
        this.block.position.set(1, 1, 0.5);

        setTimeout(function() {
          this.getPlacementTarget();
        }.bind(this), 1000);
      }
    }
    else if(this.state == 'going back') {
      raycaster.set(this.mesh.position, new THREE.Vector3(0, 0, 1).normalize());
      const intersections = raycaster.intersectObjects(scene.children);
      if (intersections[0] && intersections[0].distance <= 1) {
        this.mesh.position.setY(intersections[0].point.y + PLAYER_DIMENSIONS.bodyHeight);
      }

      if (this.atTarget() && this.block) {
        this.state = 'putting down';
        const blockPos = new THREE.Vector3().copy(this.target);
        this.target = new THREE.Vector3().copy(this.target);
        this.mesh.remove(this.block);
        const newBlock = this.block.clone();
        scene.add(newBlock);
        newBlock.position.set(blockPos.x, blockPos.y, blockPos.z);
        this.block = {};

        setTimeout(function() {
          this.getBlockTarget();
        }.bind(this), 1000);
      }
    }

    this.workers.forEach(function(worker) {
      worker.update();
    });
  }
}
// workerGroups.push(new WorkerGroup('basic'));
for (var i = 0; i < 10; i++) {
  workerGroups.push(new WorkerGroup('basic'));
}

function render() {
  requestAnimationFrame(render);
  controls.update();

  workerGroups.forEach(function(workerGroup) {
    workerGroup.update();
  })

  renderer.render(scene, camera);
  stats.update();
}
render();
