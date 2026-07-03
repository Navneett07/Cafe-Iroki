import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const ThreeHero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // 1. Mobile, Tablet, and Low-Performance checks
    const checkPerformance = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTabletOrSmall = window.innerWidth < 1024;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const isLowPerf = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
      return isMobile || isTabletOrSmall || hasCoarsePointer || isLowPerf;
    };

    if (checkPerformance()) {
      setIsMobileDevice(true);
      setIsLoaded(true);
      return;
    }

    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 2. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1c0f0b, 0.015);

    // 3. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 12);

    // 4. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Reduced from 2 to 1.5 to save pixels/fillrate
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.7); // Warm ambient
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 512; // Reduced from 1024 for shadow map performance
    dirLight.shadow.mapSize.height = 512;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8c6239, 0.6);
    fillLight.position.set(-5, -3, -2);
    scene.add(fillLight);

    // 6. 3D Procedural Models Group
    const modelsGroup = new THREE.Group();
    scene.add(modelsGroup);

    // Materials
    const redLacquer = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.3, metalness: 0.1 });
    const blackLacquer = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
    const ceramicWhite = new THREE.MeshStandardMaterial({ color: 0xfffbf7, roughness: 0.3 });
    const matchaGreen = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.6 });
    const burgerBunMat = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.8 });
    const burgerPattyMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 });
    const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5 });
    const coffeeBeanMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.7 });
    const sakuraMat = new THREE.MeshBasicMaterial({ color: 0xffb7c5, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });

    // A. Torii Gate
    const toriiGroup = new THREE.Group();
    toriiGroup.position.set(-3.5, 0.5, -2);
    toriiGroup.rotation.y = Math.PI / 6;

    // Vertical Pillars (Segment count reduced 16 -> 8)
    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.14, 3.5, 8);
    const pillarLeft = new THREE.Mesh(pillarGeo, redLacquer);
    pillarLeft.position.set(-1, 0, 0);
    pillarLeft.castShadow = true;
    const pillarRight = pillarLeft.clone();
    pillarRight.position.set(1, 0, 0);
    toriiGroup.add(pillarLeft, pillarRight);

    // Horizontal Beam (Lower Lintels)
    const lintelLower = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.18), redLacquer);
    lintelLower.position.set(0, 1.1, 0);
    lintelLower.castShadow = true;
    toriiGroup.add(lintelLower);

    // Horizontal Top Curved Lintel (Kasagi)
    const lintelTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.16, 0.22), blackLacquer);
    lintelTop.position.set(0, 1.6, 0);
    lintelTop.castShadow = true;
    toriiGroup.add(lintelTop);

    // Center tablet (Gakuzuka)
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.12), redLacquer);
    tablet.position.set(0, 1.35, 0);
    toriiGroup.add(tablet);

    modelsGroup.add(toriiGroup);

    // B. Coffee Cup (Centered Left-ish) (Segment count reduced 32 -> 12)
    const coffeeCupGroup = new THREE.Group();
    coffeeCupGroup.position.set(-0.8, -1.2, 1.5);
    
    const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.8, 12), ceramicWhite);
    cupBody.castShadow = true;
    coffeeCupGroup.add(cupBody);

    // Cup handle (Torus radial/tubular segments reduced)
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 6, 12, Math.PI), ceramicWhite);
    handle.position.set(0.44, 0, 0);
    handle.rotation.z = -Math.PI / 2;
    coffeeCupGroup.add(handle);

    // Inside liquid
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.42, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a2711, roughness: 0.1 })
    );
    liquid.position.set(0, 0.36, 0);
    coffeeCupGroup.add(liquid);

    // Saucer plate
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.08, 12), ceramicWhite);
    saucer.position.set(0, -0.42, 0);
    saucer.castShadow = true;
    coffeeCupGroup.add(saucer);

    modelsGroup.add(coffeeCupGroup);

    // C. Matcha Bowl (Centered Right-ish)
    const matchaGroup = new THREE.Group();
    matchaGroup.position.set(2.8, -1, 1.2);
    
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.45, 0.7, 12), matchaGreen);
    bowl.castShadow = true;
    matchaGroup.add(bowl);

    // Inside matcha liquid
    const matchaLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.66, 0.5, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.5 })
    );
    matchaLiquid.position.set(0, 0.3, 0);
    matchaGroup.add(matchaLiquid);

    // Bamboo whisk (Chasen) standing next to it
    const whisk = new THREE.Group();
    whisk.position.set(0.9, -0.15, 0.2);
    const whiskHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0xd2b48c }));
    const whiskHead = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xe6c280, wireframe: true }));
    whiskHead.position.y = 0.3;
    whisk.add(whiskHandle, whiskHead);
    matchaGroup.add(whisk);

    modelsGroup.add(matchaGroup);

    // D. UFO Burger (Floating Center Right, Rotating)
    const ufoBurgerGroup = new THREE.Group();
    ufoBurgerGroup.position.set(1.5, 1.4, 1);
    ufoBurgerGroup.rotation.x = Math.PI / 8;
    ufoBurgerGroup.rotation.y = -Math.PI / 6;

    // Top Bun (Sphere geometry segments reduced 32/16 -> 16/8)
    const topBun = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), burgerBunMat);
    topBun.scale.y = 0.5;
    topBun.position.y = 0.18;
    topBun.castShadow = true;
    ufoBurgerGroup.add(topBun);

    // Sesame seeds on bun (Sprinkles simplified to 10 seeds, 4x4 spheres)
    const seedGeo = new THREE.SphereGeometry(0.02, 4, 4);
    const seedMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let i = 0; i < 10; i++) {
      const seed = new THREE.Mesh(seedGeo, seedMat);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI / 4);
      seed.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.68,
        Math.cos(phi) * 0.34 + 0.18,
        Math.sin(phi) * Math.sin(theta) * 0.68
      );
      ufoBurgerGroup.add(seed);
    }

    // Patty
    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.14, 12), burgerPattyMat);
    patty.position.y = 0;
    patty.castShadow = true;
    ufoBurgerGroup.add(patty);

    // Square Cheese sheet
    const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.9), cheeseMat);
    cheese.position.y = 0.08;
    cheese.rotation.y = Math.PI / 4;
    ufoBurgerGroup.add(cheese);

    // Sealed Edge Ring (UFO Ring)
    const sealRing = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.06, 6, 16), burgerBunMat);
    sealRing.rotation.x = Math.PI / 2;
    sealRing.position.y = 0.06;
    sealRing.castShadow = true;
    ufoBurgerGroup.add(sealRing);

    // Bottom Bun
    const bottomBun = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), burgerBunMat);
    bottomBun.scale.y = 0.4;
    bottomBun.rotation.x = Math.PI;
    bottomBun.position.y = -0.16;
    bottomBun.castShadow = true;
    ufoBurgerGroup.add(bottomBun);

    modelsGroup.add(ufoBurgerGroup);

    // 7. Floating Sakura Petals System (Particle count reduced 40 -> 15)
    const sakuraCount = 15;
    const sakuraPetals: THREE.Mesh[] = [];
    const sakuraSpeeds: { y: number; xOffset: number; speedOffset: number }[] = [];

    const petalGeo = new THREE.BoxGeometry(0.1, 0.12, 0.005);
    for (let i = 0; i < sakuraCount; i++) {
      const petal = new THREE.Mesh(petalGeo, sakuraMat);
      
      petal.position.set(
        (Math.random() - 0.5) * 15,
        Math.random() * 12 - 4,
        (Math.random() - 0.5) * 8
      );
      petal.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      scene.add(petal);
      sakuraPetals.push(petal);
      sakuraSpeeds.push({
        y: 0.01 + Math.random() * 0.015,
        xOffset: Math.random() * 10,
        speedOffset: 0.5 + Math.random() * 1.5
      });
    }

    // 8. Floating Coffee Beans System (Particle count reduced 15 -> 8, sphere segments reduced 16 -> 8)
    const beanCount = 8;
    const coffeeBeans: THREE.Mesh[] = [];
    const beanSpeeds: { rotX: number; rotY: number; floatSpeed: number; yOffset: number }[] = [];
    const beanGeo = new THREE.SphereGeometry(0.08, 8, 8);
    beanGeo.scale(1.4, 0.9, 0.9);

    for (let i = 0; i < beanCount; i++) {
      const bean = new THREE.Mesh(beanGeo, coffeeBeanMat);

      // Indent crease along the bean length
      const crease = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.01, 0.01), new THREE.MeshBasicMaterial({ color: 0x1d0f0a }));
      crease.position.y = 0.085;
      bean.add(crease);

      bean.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5 + 1,
        (Math.random() - 0.5) * 4
      );
      scene.add(bean);
      coffeeBeans.push(bean);
      beanSpeeds.push({
        rotX: (Math.random() - 0.5) * 0.01,
        rotY: (Math.random() - 0.5) * 0.02,
        floatSpeed: 0.002 + Math.random() * 0.003,
        yOffset: Math.random() * Math.PI * 2
      });
    }

    // 9. Steam Particles rising from Cup (Count reduced 8 -> 4, sphere segments 8 -> 4)
    const steamParticles: THREE.Mesh[] = [];
    const steamCount = 4;
    const steamGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });

    for (let i = 0; i < steamCount; i++) {
      const steam = new THREE.Mesh(steamGeo, steamMat);
      steam.position.set(
        coffeeCupGroup.position.x + (Math.random() - 0.5) * 0.1,
        coffeeCupGroup.position.y + 0.5 + i * 0.3,
        coffeeCupGroup.position.z + (Math.random() - 0.5) * 0.1
      );
      scene.add(steam);
      steamParticles.push(steam);
    }

    setIsLoaded(true);

    // 10. Interactive mouse events
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      targetY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 11. Visibility-based rendering (Intersection Observer)
    let isCanvasVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isCanvasVisible = entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    observer.observe(containerRef.current);

    // 12. Animation Tick loop
    const startTime = performance.now();
    let animationId: number;
    let isCancelled = false;

    const animateTick = () => {
      if (isCancelled) return;
      animationId = requestAnimationFrame(animateTick);

      // Skip render & updates if canvas is scrolled out of viewport
      if (!isCanvasVisible) return;

      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Mouse orientation drift
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      camera.position.x = mouseX * 1.5;
      camera.position.y = -mouseY * 1.5 + 0.5;
      camera.lookAt(0, 0, 0);

      // Shadows shifting
      dirLight.position.x = 5 + mouseX * 4;
      dirLight.position.y = 5 - mouseY * 4;

      // Model animations
      modelsGroup.position.y = Math.sin(elapsedTime * 0.6) * 0.15;
      
      ufoBurgerGroup.rotation.y += 0.008;
      ufoBurgerGroup.position.y = 1.4 + Math.sin(elapsedTime * 1.2) * 0.08;

      whisk.position.y = -0.15 + Math.sin(elapsedTime * 1.5) * 0.03;

      // Coffee beans
      coffeeBeans.forEach((bean, idx) => {
        const speed = beanSpeeds[idx];
        bean.rotation.x += speed.rotX;
        bean.rotation.y += speed.rotY;
        bean.position.y += Math.sin(elapsedTime * speed.floatSpeed * 200 + speed.yOffset) * 0.002;
      });

      // Sakura petals
      sakuraPetals.forEach((petal, idx) => {
        const speed = sakuraSpeeds[idx];
        petal.position.y -= speed.y;
        petal.position.x += Math.sin(elapsedTime * speed.speedOffset + speed.xOffset) * 0.01;
        petal.rotation.x += 0.005;
        petal.rotation.y += 0.01;

        if (petal.position.y < -5) {
          petal.position.y = 6;
          petal.position.x = (Math.random() - 0.5) * 15;
        }
      });

      // Steam
      steamParticles.forEach((steam, idx) => {
        steam.position.y += 0.004;
        
        const relativeY = steam.position.y - (coffeeCupGroup.position.y + 0.5);
        const opacity = Math.max(0, 0.2 - relativeY * 0.1);
        (steam.material as THREE.MeshBasicMaterial).opacity = opacity;
        steam.position.x += Math.sin(elapsedTime * 4 + idx) * 0.002;

        if (relativeY > 1.8) {
          steam.position.y = coffeeCupGroup.position.y + 0.5;
          steam.position.x = coffeeCupGroup.position.x + (Math.random() - 0.5) * 0.1;
        }
      });

      renderer.render(scene, camera);
    };

    animateTick();

    // 13. Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 14. Cleanup & Resource Disposal
    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationId);
      observer.disconnect();
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && renderer.domElement) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }

      // Dispose of geometries & materials to clear GPU memory
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
    };
  }, []);

  if (isMobileDevice) {
    // Return null on mobile to bypass canvas mount entirely
    return null;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none select-none">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/20 z-0">
          <div className="w-10 h-10 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default ThreeHero;
