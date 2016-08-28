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

// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
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

var GAME_WON = false;
var FLY_AWAY = false;

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
const SCENE_HEIGHT = window.innerHeight * .60;
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / SCENE_HEIGHT, 0.1, GROUND_WIDTH * 2);
camera.position.z = 100;
camera.position.y = 25;

if (developerMode()) {
  scene.add(new THREE.AxisHelper(100));
}

const textureLoader = new THREE.TextureLoader();
const clock = new THREE.Clock();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, SCENE_HEIGHT);
renderer.setClearColor(SKY_COLOR_LIGHT);
document.body.insertBefore(renderer.domElement, document.getElementById('container'));

var animationID = 0;
renderer.context.canvas.addEventListener("webglcontextlost", function(event) {
  event.preventDefault();
  cancelAnimationFrame(animationID);
}, false); //http://stackoverflow.com/questions/14350350/how-do-we-handle-webgl-context-lost-event-in-three-js

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

terrainGeometry.vertices.forEach(function(vertice) {
  vertice.y = getRandomArbitrary(-0.5, 0.5);
});

const colors = [0xD0C371, 0xC7A757, 0xC79A57, 0xD4BD7D];
terrainGeometry.faces.forEach(function(face) {
  const color = colors[getRandomInt(0, colors.length - 1)];
  face.color.setHex(color);
});

const sandSpec = textureLoader.load("img/sand_spec.png");
// const terrainTexture = new THREE.MeshLambertMaterial({color: GROUND_COLOR, emissive: 0x3e0000, side: THREE.DoubleSide, emissiveMap: sandSpec});
// const terrainTexture = new THREE.MeshLambertMaterial({color: GROUND_COLOR});
const terrainTexture = new THREE.MeshBasicMaterial({vertexColors: THREE.FaceColors});
const terrain = new THREE.Mesh(terrainGeometry, terrainTexture);
scene.add(terrain);

const CUBE_LENGTH = 1;
const cubeGeometry = new THREE.BoxGeometry(CUBE_LENGTH, CUBE_LENGTH, CUBE_LENGTH);
const cubeMaterial = new THREE.MeshLambertMaterial({wireframe: false, color: 0xffffff});
const availableCubes = [];
const PYRAMID_HEIGHT = getParameterByName('height') || 9;
const pyramidGrid = [];
const pyramidLayers = [];
for (var i = 0; i < PYRAMID_HEIGHT; i++) {
  pyramidGrid.push([]);

  const layerGeometry = new THREE.Geometry();
  layerGeometry.dynamic = true;
  const layerMesh = new THREE.Mesh(layerGeometry, cubeMaterial);
  pyramidLayers.push([layerGeometry, layerMesh, false]);
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

function addBlockToPyramid(block) {
  const y = block.position.y;
  const layerGeometry = pyramidLayers[y][0];
  layerGeometry.elementsNeedUpdate = true;
  block.updateMatrix();
  layerGeometry.merge(block.geometry, block.matrix);

  if (!pyramidLayers[y][2]) {
    scene.add(pyramidLayers[y][1]);
    pyramidLayers[y][2] = true;
  }
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
  if (GAME_WON) {
    return;
  }
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

    if (this.group.type == 'camel') {
      this.leftLegMesh.rotation.x = degToRad(320);
      this.leftLegMesh.position.setZ(0.4);

      this.rightLegMesh.rotation.x = degToRad(320);
      this.rightLegMesh.position.setZ(0.4);
    }

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

class Storage {
  constructor(parent) {
    this.parent = parent;
  }

  getPlacementLocation() {
    return new THREE.Vector3(1, 1, 0.5);
  }

  createObjects() {

  }

  placePlayer(i) {
    return new THREE.Vector3(i / 2, 0, i % 2)
  }
}

class StorageSled extends Storage {
  constructor(parent) {
    super(parent);
  }

  getPlacementLocation() {
    return new THREE.Vector3(0.5, 0, -1.5);
  }

  createObjects() {
    const sledGeometry = new THREE.PlaneGeometry(1.5, 2);
    const sledMaterial = new THREE.MeshLambertMaterial({color: 0x9D3F34, side: THREE.DoubleSide});
    const sledMesh = new THREE.Mesh(sledGeometry, sledMaterial);
    sledMesh.rotateX(degToRad(90));
    sledMesh.position.x = PLAYER_DIMENSIONS.bodyWidth;
    sledMesh.position.y = -(PLAYER_DIMENSIONS.legsHeight / 2);
    sledMesh.position.z = -PLAYER_DIMENSIONS.bodyWidth * 3;
    this.parent.mesh.add(sledMesh);
    // const ropeMaterial = new THREE.LineBasicMaterial({color: 0x26160D}); http://threejs.org/docs/index.html?q=Line#Reference/Objects/Line
  }

  placePlayer(i) {
    return new THREE.Vector3(i, 0, 0);
  }
}

class StorageCamel extends Storage {
  constructor(parent) {
    super(parent);

    this.stomachRadius = .5;
    this.stomachLength = .9;
    this.legHeight = 5;
  }

  getPlacementLocation() {
    return new THREE.Vector3(0.5, this.legHeight * .70, 0.3);
  }

  placePlayer(i) {
    return new THREE.Vector3(0.5, this.legHeight * .65, 2);
  }

  createObjects() {
    const camelLightMaterial = new THREE.MeshLambertMaterial({color: 0xCFB16E});
    const camelDarkMaterial = new THREE.MeshLambertMaterial({color: 0xA88338});

    const legGeometry = new THREE.CylinderGeometry(0.2, 0.05, this.legHeight);

    const leftFrontLeg = new THREE.Mesh(legGeometry, camelLightMaterial);
    this.parent.mesh.add(leftFrontLeg);
    leftFrontLeg.position.x = 0;

    const rightFrontLeg = new THREE.Mesh(legGeometry, camelLightMaterial);
    this.parent.mesh.add(rightFrontLeg);
    rightFrontLeg.position.x = this.stomachRadius * 2;

    const leftBackLeg = new THREE.Mesh(legGeometry, camelLightMaterial);
    this.parent.mesh.add(leftBackLeg);
    leftBackLeg.position.x = 0;
    leftBackLeg.position.z = this.stomachLength * 3;

    const rightBackLeg = new THREE.Mesh(legGeometry, camelLightMaterial);
    this.parent.mesh.add(rightBackLeg);
    rightBackLeg.position.x = this.stomachRadius * 2;
    rightBackLeg.position.z = this.stomachLength * 3;

    const stomachCenter = new THREE.TorusGeometry(this.stomachRadius, this.stomachLength, 10, 12);
    const stomachCenterMesh = new THREE.Mesh(stomachCenter, camelDarkMaterial);
    this.parent.mesh.add(stomachCenterMesh);
    stomachCenterMesh.position.setX(0.5);
    stomachCenterMesh.position.setY(this.legHeight / 2);
    stomachCenterMesh.position.setZ(this.stomachLength * 1.5);

    const stomachPart = new THREE.SphereGeometry(this.stomachRadius * 2);
    const stomachPartFront = new THREE.Mesh(stomachPart, camelDarkMaterial);
    stomachCenterMesh.add(stomachPartFront);
    stomachPartFront.position.setZ(this.stomachRadius * 1.25);

    const stomachPartBack = new THREE.Mesh(stomachPart, camelDarkMaterial);
    stomachCenterMesh.add(stomachPartBack);
    stomachPartBack.position.setZ(-this.stomachRadius * 1.25);

    const neckCurve = new THREE.TorusGeometry(1, this.stomachRadius, 8, 6, 2.4);
    const neck = new THREE.Mesh(neckCurve, camelDarkMaterial);
    stomachPartFront.add(neck);
    neck.rotateY(80);
    neck.rotateZ(180);
    neck.position.setY(0.5);
    neck.position.setZ(1.3);

    const headGeometry = new THREE.SphereGeometry(0.7, 16, 6);
    const head = new THREE.Mesh(headGeometry, camelLightMaterial);
    neck.add(head);
    head.position.x = -0.65;
    head.position.y = .8;
  }
}

class StorageAlien extends Storage {
  constructor(parent) {
    super(parent);

    this.heightOffset = PYRAMID_HEIGHT + 2;
    this.radius = 2;
    this.base = {};

    this.customExchangeDelay = 2000;
    this.customExchangeFunction = this.createBeam;
    this.beam = {};
  }

  createBeam(status) {
    if (status) {
      const beamGeometry = new THREE.CylinderGeometry(this.radius, 1.2, this.heightOffset, 8, 1, true);
      const beamMaterial = new THREE.MeshLambertMaterial({color: 0xDAEEF5, emissive: 0x8FDDF7, side: THREE.DoubleSide, transparent: true, opacity: 0.5});
      this.beam = new THREE.Mesh(beamGeometry, beamMaterial);
      this.base.add(this.beam);
      this.beam.position.setY(this.heightOffset * 0.5);
    }
    else {
      this.base.remove(this.beam);
    }
  }

  getPlacementLocation() {
    return new THREE.Vector3(0, this.heightOffset + 1, 0);
  }

  placePlayer(i) {
    return new THREE.Vector3(0.5, this.legHeight * .65, 2);
  }

  createObjects() {
    const baseMaterial = new THREE.MeshLambertMaterial({color: 0xA8B2B5});
    const baseGeometry = new THREE.ConeGeometry(this.radius, this.radius / 2);
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    this.base = base;
    this.parent.mesh.add(base);
    base.rotateX(degToRad(180));

    const topGeometry = new THREE.SphereGeometry(this.radius * 0.85, 8, 6, 0, Math.PI);
    const topMaterial = new THREE.MeshLambertMaterial({color: 0xB1E8FA});
    const top = new THREE.Mesh(topGeometry, topMaterial);
    base.add(top);
    top.rotateX(degToRad(90));
    top.position.setY(-0.5);

    base.position.setY(this.heightOffset);
  }
}

class WorkerGroup {
  constructor(type) {
    this.type = type;
    this.workers = [];
    this.block = {};
    this.storage = {};
    this.startPosition = new THREE.Vector3(PYRAMID_WIDTH / 2, 2, getRandomInt(-(PYRAMID_WIDTH / 2), PYRAMID_WIDTH / 2));
    this.target = this.startPosition;
    this.speed = WORKER_BASE_SPEED;

    this.mesh = new THREE.Object3D();
    this.mesh.position.set(this.startPosition.x, this.startPosition.y, this.startPosition.z);
    scene.add(this.mesh);

    switch (type) {
      case 'basic':
        this.storage = new Storage(this);
        this.generateWorkers(4);
        break;
      case 'strong':
        this.storage = new Storage(this);
        this.speed += 0.002;
        this.generateWorkers(2);
        break;
      case 'sled':
        this.storage = new StorageSled(this);
        this.speed += 0.004;
        this.generateWorkers(2);
        break;
      case 'camel':
       this.storage = new StorageCamel(this);
       this.speed += 0.008;
       this.generateWorkers(1);
       break;
      case 'alien':
       this.storage = new StorageAlien(this);
       this.speed += 0.1;
       // this.generateWorkers(1); Actually, we probs shouldnt unless we make a way to turn off the "physics"
       break;
    }

    this.storage.createObjects();
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
    if (this.target == undefined) {
      setWinState();
    }
  }

  generateWorkers(amount) {
    for (var i = 0; i < amount; i++) {
      const worker = new Worker(this.storage.placePlayer(i), this);
      this.workers.push(worker);
      this.mesh.add(worker.playerMesh);
    }
  }

  atTarget() {
    if (this.type == 'alien') {
      const offset = new THREE.Vector3(0, this.storage.heightOffset, 0);
      return new THREE.Box3().setFromObject(this.mesh).expandByVector(offset).expandByScalar(1.5).containsPoint(this.target);
    }
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

    if (this.type != 'alien' || GAME_WON) {
      raycaster.set(this.mesh.position, new THREE.Vector3(0, -1, 0).normalize());
      const intersections = raycaster.intersectObjects(scene.children);
      if (intersections[0]) {
        this.mesh.position.setY(intersections[0].point.y + PLAYER_DIMENSIONS.legsHeight);
      }
    }

    if (GAME_WON && !this.block) {
      this.target = new THREE.Vector3(0, 0, 0);
      return;
    }

    const exchangeDelay = this.storage.customExchangeDelay || 1000;
    const exchangeFunction = this.storage.customExchangeFunction ? this.storage.customExchangeFunction.bind(this.storage) : function(status) {};

    if (this.state == 'get') {
      if (this.atTarget() && this.block) {
        this.state = 'picking up';
        exchangeFunction(true);
        this.target = new THREE.Vector3().copy(this.block.position);
        scene.remove(this.block);
        this.mesh.add(this.block);
        const placement = this.storage.getPlacementLocation();
        this.block.position.set(placement.x, placement.y, placement.z);

        setTimeout(function() {
          exchangeFunction(false);
          this.getPlacementTarget();
        }.bind(this), exchangeDelay);
      }
    }
    else if(this.state == 'going back') {
      if (this.type != 'alien') {
        raycaster.set(this.mesh.position, new THREE.Vector3(0, 0, 1).normalize());
        const intersections = raycaster.intersectObjects(scene.children);
        if (intersections[0] && intersections[0].distance <= 1) {
          this.mesh.position.setY(intersections[0].point.y + PLAYER_DIMENSIONS.bodyHeight);
        }
      }

      if (this.atTarget() && this.block) {
        this.state = 'putting down';
        exchangeFunction(true);
        const blockPos = new THREE.Vector3().copy(this.target);
        this.target = new THREE.Vector3().copy(this.target);
        this.mesh.remove(this.block);
        const newBlock = this.block.clone();
        newBlock.position.set(blockPos.x, blockPos.y, blockPos.z);
        //scene.add(newBlock);
        addBlockToPyramid(newBlock);
        this.block = {};

        if (GAME_WON) {
          return;
        }

        setTimeout(function() {
          exchangeFunction(false);
          this.getBlockTarget();
        }.bind(this), exchangeDelay);
      }
    }

    this.workers.forEach(function(worker) {
      worker.update();
    });
  }
}

function removeBuildingBlock(block) {
  console.log(block);
  if (block == undefined) {
    return;
  }

  scene.remove(block);
  removeBuildingBlock(getAvailableBuildingBlock());
}

function setWinState() {
  GAME_WON = true;
  removeBuildingBlock(getAvailableBuildingBlock());
  workerGroups.forEach(function(workerGroup) {
    workerGroup.speed = 1;
    if (!workerGroup.target) {
      workerGroup.target = new THREE.Vector3(0, 0, 0);
    }
  });

  setTimeout(function() {
    FLY_AWAY = true;
  }, 4000);
}

// Starting builders
for (var i = 0; i < 4; i++) {
  workerGroups.push(new WorkerGroup('basic'));
}

var skyAlpha = 1;
const flyRate = 10;
function render() {
  animationID = requestAnimationFrame(render);
  controls.update();

  if (GAME_WON && FLY_AWAY) {
    terrain.position.y -= flyRate * clock.getDelta();
    skyAlpha -= .002;
    sun.intensity -= .002;
    sun2.intensity -= .002;
    renderer.setClearColor(new THREE.Color(SKY_COLOR_DARK).lerp(SKY_COLOR_LIGHT, skyAlpha), 1);
  }
  else {
    workerGroups.forEach(function(workerGroup) {
      workerGroup.update();
    });
  }

  renderer.render(scene, camera);
  stats.update();
}
render();
