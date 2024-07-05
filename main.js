import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { element } from 'three/examples/jsm/nodes/Nodes.js';

// SCENE
const scene = new THREE.Scene();

// CAMERA
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.2,
  1000
);
camera.position.x = -1.65;
camera.position.y = 1;
camera.position.z = 2.1;
camera.rotation.x = -0.14;

// RENDER
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0x020403);

// LIGHTS
const directionalLight = new THREE.DirectionalLight(0xffffff, 5);  
directionalLight.position.set(-1, 2, 2);
directionalLight.castShadow = true; 
directionalLight.shadow.camera.left = -5;
directionalLight.shadow.camera.right = 5;
directionalLight.shadow.camera.top = 5;
directionalLight.shadow.camera.bottom = -5;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.mapSize.width = 1024; 
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

const light1 = new THREE.PointLight(0xffffff, 8);
light1.position.set(0.5, 1.4, 0);
//scene.add(light1);

const light2 = new THREE.PointLight(0xffffff, 8);
light2.position.set(-0.5, 1, 0);
//scene.add(light2);

// AUDIO
const audio = new Audio('assets/Massaia.wav'); 
audio.loop = true;

// PIANO
let mixer;
let currentAnimationQueue = [];
const animationsQueue = [
  { names: ['21', '22', '26', '27', '31', '32', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '48', '49', '50', '53', '55'], delay: 0 },
];

const loader = new GLTFLoader();
loader.load(
  'assets/notas22.glb',
  function (glb) {
    const root = glb.scene;
    root.scale.set(2, 2, 1);
    mixer = new THREE.AnimationMixer(root);
    const clips = glb.animations;

    animationsQueue.forEach(animationEntry => {
      animationEntry.clips = animationEntry.names.map(name => {
        const clip = THREE.AnimationClip.findByName(clips, name);
        if (!clip) {
          console.error(`Animation clip not found: ${name}`);
        }
        return clip;
      }).filter(clip => clip !== undefined); 
    });

    scene.add(root);
  },
);

function playAnimationsSequentially(queue) {
  if (queue.length === 0) {
    console.log('All animations finished');
    if (!audio.paused) {
      setTimeout(() => {
        playAnimationsSequentially([...animationsQueue]); 
      }, 0); 
    }
    return;
  }

  currentAnimationQueue = queue; // Save the current queue

  const { clips, delay } = queue.shift(); 
  if (!clips || clips.length === 0) {
    setTimeout(() => {
      playAnimationsSequentially(queue); 
    }, delay);
    return;
  }

  const actions = clips.map(clip => {
    const action = mixer.clipAction(clip);
    action.loop = THREE.LoopOnce; 
    action.clampWhenFinished = true; 
    return action;
  });

  let finishedAnimationsCount = 0;

  actions.forEach(action => {
    action.reset().play(); 
    console.log(`Playing animation: ${action.getClip().name}`);
  });

  function onActionFinished() {
    finishedAnimationsCount++;
    if (finishedAnimationsCount === actions.length) {
      mixer.removeEventListener('finished', onActionFinished);
      console.log(`Finished animations: ${clips.map(clip => clip.name).join(', ')}`);
      setTimeout(() => {
        playAnimationsSequentially(queue); 
      }, delay);
    }
  }

  mixer.addEventListener('finished', onActionFinished);
}

// ANIMATION
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  if (mixer && mixer.timeScale !== 0) mixer.update(clock.getDelta()); 
  renderer.render(scene, camera);
}

// HEADER
const header = document.createElement('div');
header.className = 'menu-geral';
const headerLink = document.createElement('a');
const hrefAtributte = document.createAttribute("href");
hrefAtributte.value = "https://www.massaia.pt";
headerLink.setAttributeNode(hrefAtributte);
const linkH1 = document.createElement('h1');
linkH1.className = 'menu-massaia';
linkH1.textContent = 'MASSAIÁ';
headerLink.appendChild(linkH1);
header.appendChild(headerLink);
document.body.appendChild(header);

// BUTTON
const buttonDiv = document.createElement('div');
buttonDiv.id = "buttonDiv";
const button = document.createElement('button');
button.textContent = 'Play';
button.id = "button";
button.className = 'buttonPlay'
buttonDiv.appendChild(button);
document.body.appendChild(buttonDiv);

// State variable to track whether audio and animation are playing
let isPlaying = false;

document.getElementById('button').addEventListener('click', function() {
  if (isPlaying) {
    button.textContent = 'Play';
    audio.pause();
    pauseAnimations();
  } else {
    button.textContent = 'Pause';
    audio.play();
    if (mixer) {
      resumeAnimations();
      if (currentAnimationQueue.length === 0) {
        playAnimationsSequentially([...animationsQueue]); // Start animations if not already running
      }
    }
  }
  isPlaying = !isPlaying;
});

function pauseAnimations() {
  if (mixer) {
    mixer.timeScale = 0; // Pause animations by setting the time scale to 0
  }
}

function resumeAnimations() {
  if (mixer) {
    mixer.timeScale = 1; // Resume animations by setting the time scale to 1
    if (currentAnimationQueue.length > 0) {
      playAnimationsSequentially(currentAnimationQueue); // Resume the current animation queue
    }
  }
}

animate();