/**
 * Standalone Single-File HTML Exporter
 * Generates an ultra-optimized, fully self-contained single .html file that runs
 * locally on mobile devices and browsers with zero backend required.
 */

export function exportStandaloneHTML(): void {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>پوریا جم - Poria Jam Tactical 3D FPS</title>
  <meta name="theme-color" content="#0a0e14">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
  <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Vazirmatn:wght@700;900&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; user-select:none; -webkit-user-select:none; font-family:'Chakra Petch', sans-serif; }
    body, html { width:100%; height:100%; overflow:hidden; background:#000; color:#fff; touch-action:none; }
    #canvas-container { width:100%; height:100%; position:absolute; top:0; left:0; }
    .hud-layer { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:10; }
    .interactive { pointer-events:auto; }
    .touch-btn { position:absolute; border-radius:50%; background:rgba(10,15,25,0.75); border:2px solid rgba(0,240,255,0.4); display:flex; align-items:center; justify-content:center; color:#00f0ff; font-weight:bold; box-shadow:0 0 15px rgba(0,240,255,0.2); }
    .touch-btn:active { background:rgba(0,240,255,0.3); transform:scale(0.95); }
    .crosshair-tick { position:absolute; top:50%; left:50%; width:20px; height:20px; transform:translate(-50%,-50%); }
    .sniper-overlay { position:absolute; top:0; left:0; width:100%; height:100%; background:radial-gradient(circle at center, transparent 38%, black 48%, black 100%); display:none; }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <div class="hud-layer">
    <div id="sniper-scope" class="sniper-overlay">
      <div style="position:absolute;top:50%;left:0;width:100%;height:2px;background:rgba(255,50,50,0.8);"></div>
      <div style="position:absolute;top:0;left:50%;width:2px;height:100%;background:rgba(255,50,50,0.8);"></div>
    </div>
    <div style="position:absolute;top:16px;left:20px;font-size:20px;color:#00f0ff;font-weight:700;">PORIA JAM // TACTICAL OPS</div>
    <div style="position:absolute;bottom:20px;left:20px;background:rgba(0,0,0,0.7);padding:8px 16px;border-radius:8px;border:1px solid #333;">
      <span style="color:#00f0ff;">HEALTH: <strong id="hp-val">100</strong></span> | <span style="color:#ffaa00;">AMMO: <strong id="ammo-val">30 / 90</strong></span>
    </div>
  </div>
  <script>
    // Embedded standalone Poria Jam tactical FPS engine
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd9c59d, 0.008);
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 1.7, 10);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xeedcb2, 0x5a4832, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4db, 1.4);
    sun.position.set(40, 60, 30);
    scene.add(sun);

    // Procedural Poria Jam Graffiti Wall
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#00f0ff';
    ctx.font = '900 120px "Vazirmatn", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('پوریا جم', 512, 190);
    ctx.font = '700 36px monospace';
    ctx.fillText('PORIA_JAM // TACTICAL OPS', 512, 290);
    // Drips
    for(let i=0; i<8; i++){
      ctx.fillRect(350 + i*45, 310, 8, 80 + i*15);
    }
    const gTex = new THREE.CanvasTexture(c);
    const gMat = new THREE.MeshBasicMaterial({ map: gTex, transparent: true });
    const gWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), gMat);
    gWall.position.set(0, 2.5, -10);
    scene.add(gWall);

    // Sandstone Ground
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xdfbe88 }));
    ground.rotateX(-Math.PI/2);
    scene.add(ground);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();
  <\/script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'poria_jam_tactical_fps.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
