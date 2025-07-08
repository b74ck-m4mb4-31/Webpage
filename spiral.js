import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

const canvas = document.getElementById('spiral-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
camera.position.set(0, 0, 10);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const pointLight = new THREE.PointLight(0xffffff, 1.2, 50);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const loader = new THREE.TextureLoader();
const woodTex = loader.load('images/wood-texture.jpg');
woodTex.colorSpace = THREE.SRGBColorSpace;

function createEngravedLabelTexture(text, woodImage) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const wood = new Image();
  wood.crossOrigin = 'anonymous';
  wood.src = woodImage;

  return new Promise(resolve => {
    wood.onload = () => {
      ctx.drawImage(wood, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold 42px Segoe UI';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      resolve(tex);
    };
  });
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickable = [];
let scrollPct = 0;

const spiralSection = document.getElementById('spiral-section');

window.addEventListener('scroll', () => {
  const rect = spiralSection.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const sectionTop = rect.top + window.scrollY;
  const sectionHeight = rect.height;

  const scrollY = window.scrollY;
  const startScroll = sectionTop;
  const endScroll = sectionTop + sectionHeight - windowHeight;
  const scrollRange = endScroll - startScroll;

  scrollPct = scrollRange > 0
    ? Math.max(0, Math.min(1, (scrollY - startScroll) / scrollRange))
    : 0;
});

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickable, true);
  if (hits.length) {
    let g = hits[0].object;
    while (!clickable.includes(g)) g = g.parent;
    window.location.href = g.userData.link;
  }
});

const topics = [
  { label: "Introduction", link: "introduction.html" },
  { label: "ENIGMA GUI", link: "gui.html" },
  { label: "Hardware Integrations", link: "hardware.html" },
  { label: "Software", link: "software_design.html" },
  { label: "Conclusion", link: "conclusion.html" },
  { label: "Appendix", link: "appendix.html" }
];

const count = topics.length;
const radius = 3;
const gap = 2;
const angleStep = Math.PI * 2 / count;
const angleOffset = -Math.PI / 2;

(async () => {
  for (let i = 0; i < count; i++) {
    const topic = topics[i];
    const labelTex = await createEngravedLabelTexture(topic.label, 'images/wood-texture.jpg');
    const group = new THREE.Group();

    const sideMat = new THREE.MeshStandardMaterial({ map: woodTex, metalness: 0.2, roughness: 0.8 });
    const labelMat = new THREE.MeshStandardMaterial({ map: labelTex, metalness: 0.2, roughness: 0.8 });

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.6, 0.5),
      [sideMat, sideMat, sideMat, sideMat, labelMat, sideMat]
    );
    group.add(box);

    const ang = i * angleStep + angleOffset;
    const y = -i * gap + 0.5;
    group.position.set(Math.sin(ang) * radius, y, Math.cos(ang) * radius);
    group.lookAt(0, y, 0);
    group.rotateY(Math.PI);

    group.userData.link = topic.link;
    scene.add(group);
    clickable.push(group);
  }
})();

function animate() {
  pointLight.intensity = 0.6 + Math.random() * 0.3;
  const camAng = scrollPct * Math.PI * 2 + angleOffset;
  const y = -scrollPct * count * gap;
  camera.position.set(Math.sin(camAng) * (radius + 6), y, Math.cos(camAng) * (radius + 6));
  camera.lookAt(0, y, 0);

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickable, true);

  clickable.forEach(g => {
    g.scale.set(1, 1, 1);
    g.children[0].material.emissiveIntensity = 0.8;
  });

  if (hits.length) {
    let g = hits[0].object;
    while (!clickable.includes(g)) g = g.parent;
    g.scale.set(1.1, 1.1, 1.1);
    g.children[0].material.emissiveIntensity = 1.5;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function resizeCanvas() {
  const width = spiralSection.clientWidth || window.innerWidth;
  const height = spiralSection.clientHeight || window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
