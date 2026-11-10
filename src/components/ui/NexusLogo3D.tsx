/**
 * src/components/ui/NexusLogo3D.tsx
 *
 * Emblème 3D Haute Horlogerie & Joyau Numérique « Nexus Core » (WebGL / Three.js).
 * Design ultra-premium inspiré de l'aérospatiale et de l'optique de précision :
 *  - 3 Anneaux de gimbal en titane brossé noir & verre saphir avec vernis céramique (clearcoat 1.0)
 *    et iridescence d'interférence type traitement de lentille optique (Leica / antireflet AR).
 *  - Cœur « Chronomètre Quantique » : Diamant polyédrique taillé en haute réfraction (IOR 2.417)
 *    abritant une singularité photonique pure et un balancier tourbillon interne.
 *  - Micro-satellites prismatiques taillés en facettes qui captent les éclats spéculaires.
 *  - Éclairage studio 3-points cinématique de haute précision (Key, Rim & Kicker spéculaire).
 *  - Physique inertielle fluide de grand luxe avec amortissement lissé (spring damping).
 *  - Ombre de contact au sol feutrée et halo volumétrique satiné.
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { cn } from '@/utils/cn';
import { NexusMark } from './NexusMark';

interface NexusLogo3DProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  active?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<NexusLogo3DProps['size']>, string> = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-36 h-36 sm:w-44 sm:h-44',
  xl: 'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64',
};

export function NexusLogo3D({ size = 'lg', className, active = false }: NexusLogo3DProps) {
  if (size === 'sm') {
    return <NexusMark className={cn(SIZE_CLASSES[size], className)} pulse={active} />;
  }
  return <NexusLogoWebGL className={cn(SIZE_CLASSES[size], className)} active={active} />;
}

// ─── Moteur 3D Haute Horlogerie & Optique de Précision ───────────────────────

function NexusLogoWebGL({ className, active }: { className?: string; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        if (disposed) return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let reducedMotion = mediaQuery.matches;
        const onMotionChange = (e: MediaQueryListEvent) => {
          reducedMotion = e.matches;
        };
        mediaQuery.addEventListener('change', onMotionChange);

        let isDarkMode = document.documentElement.classList.contains('dark');

        // ── 1. Renderer Haute Fidélité ACES Filmic ──
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = isDarkMode ? 1.15 : 1.05;
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.margin = '0 auto';
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();

        // ── 2. Caméra & Focale Cinématique ──
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
        camera.position.set(0, 0, 5.2);
        camera.lookAt(0, 0, 0);

        // Pivot racine avec amortissement d'inertie
        const rootPivot = new THREE.Group();
        scene.add(rootPivot);

        // ── 3. Matériaux de Luxe (Titane Platine, Saphir & Céramique) ──
        
        // Anneau 1 : Titane brossé céleste avec traitement optique AR (Anti-Reflet)
        const titaniumMat1 = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(isDarkMode ? '#0f172a' : '#1e293b'),
          emissive: new THREE.Color('#0284c7'),
          emissiveIntensity: isDarkMode ? 0.28 : 0.18,
          metalness: 0.94,
          roughness: 0.12,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
          reflectivity: 0.95,
          iridescence: 0.75,
          iridescenceIOR: 1.35,
          iridescenceThicknessRange: [100, 400],
        });

        // Anneau 2 : Verre saphir fumé / Améthyste impériale
        const sapphireMat2 = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(isDarkMode ? '#1e1b4b' : '#312e81'),
          emissive: new THREE.Color('#6366f1'),
          emissiveIntensity: isDarkMode ? 0.32 : 0.2,
          metalness: 0.88,
          roughness: 0.1,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          reflectivity: 0.9,
          iridescence: 0.65,
          iridescenceIOR: 1.4,
          iridescenceThicknessRange: [120, 450],
        });

        // Anneau 3 : Platine liquide / Céramique polie miroir
        const platinumMat3 = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(isDarkMode ? '#090d16' : '#0f172a'),
          emissive: new THREE.Color('#0ea5e9'),
          emissiveIntensity: isDarkMode ? 0.25 : 0.15,
          metalness: 0.96,
          roughness: 0.08,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02,
          reflectivity: 1.0,
          iridescence: 0.8,
          iridescenceIOR: 1.33,
        });

        // Diamant central : Haute réfraction (simulant la taille d'un diamant pur)
        const diamondMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(0xffffff),
          emissive: new THREE.Color('#38bdf8'),
          emissiveIntensity: isDarkMode ? 0.45 : 0.3,
          metalness: 0.05,
          roughness: 0.02,
          transmission: 0.88,
          thickness: 0.9,
          ior: 2.2, // Proche de la réfraction du diamant (2.42)
          clearcoat: 1.0,
          clearcoatRoughness: 0.01,
          reflectivity: 1.0,
          iridescence: 0.85,
          iridescenceIOR: 1.33,
        });

        // Matériau des balanciers tourbillon internes
        const tourbillonMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#e0f2fe'),
          emissive: new THREE.Color('#38bdf8'),
          emissiveIntensity: 0.5,
          metalness: 0.9,
          roughness: 0.1,
          wireframe: true,
        });

        // ── 4. Géométrie Sculptée de Haute Précision ──
        
        // Anneaux tubulaires à profil fin et raffiné
        const ringGeo1 = new THREE.TorusGeometry(1.42, 0.028, 32, 160);
        const ringGeo2 = new THREE.TorusGeometry(1.22, 0.026, 32, 160);
        const ringGeo3 = new THREE.TorusGeometry(1.02, 0.024, 32, 160);

        const ringMesh1 = new THREE.Mesh(ringGeo1, titaniumMat1);
        const ringMesh2 = new THREE.Mesh(ringGeo2, sapphireMat2);
        const ringMesh3 = new THREE.Mesh(ringGeo3, platinumMat3);

        ringMesh1.rotation.set(0.65, 0.45, 0);
        ringMesh2.rotation.set(-0.5, 0.85, 0.35);
        ringMesh3.rotation.set(1.15, -0.6, 0.75);

        rootPivot.add(ringMesh1);
        rootPivot.add(ringMesh2);
        rootPivot.add(ringMesh3);

        // Anneaux biseautés de micro-calibrage (liserés de précision horlogère)
        const bevelGeo1 = new THREE.TorusGeometry(1.42, 0.007, 16, 160);
        const bevelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
        const bevelMesh1 = new THREE.Mesh(bevelGeo1, bevelMat);
        ringMesh1.add(bevelMesh1);

        // ── 5. Satellites Facettés (Diamants Orbitaux) ──
        const gemSatGeo = new THREE.OctahedronGeometry(0.065, 0);
        const gemSatMat = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          emissive: new THREE.Color('#e0f2fe'),
          emissiveIntensity: 0.8,
          roughness: 0.05,
          metalness: 0.2,
          transmission: 0.9,
          ior: 2.0,
        });

        const sat1 = new THREE.Mesh(gemSatGeo, gemSatMat);
        const sat2 = new THREE.Mesh(gemSatGeo, gemSatMat);
        const sat3 = new THREE.Mesh(gemSatGeo, gemSatMat);

        sat1.position.set(1.42, 0, 0);
        sat2.position.set(1.22, 0, 0);
        sat3.position.set(1.02, 0, 0);

        ringMesh1.add(sat1);
        ringMesh2.add(sat2);
        ringMesh3.add(sat3);

        // ── 6. Cœur « Tourbillon Quantique » (Singularité Cristalline) ──
        const coreGroup = new THREE.Group();
        rootPivot.add(coreGroup);

        // 6.1 Cristal central Dodécaédrique facetté
        const diamondGeo = new THREE.DodecahedronGeometry(0.42, 0);
        const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
        coreGroup.add(diamondMesh);

        // 6.2 Cage Tourbillon interne en contre-rotation
        const tourbillonGeo = new THREE.IcosahedronGeometry(0.56, 1);
        const tourbillonMesh = new THREE.Mesh(tourbillonGeo, tourbillonMat);
        coreGroup.add(tourbillonMesh);

        // 6.3 Étoile photonique intérieure ultra-brillante (le point de convergence)
        const sparkGeo = new THREE.OctahedronGeometry(0.12, 0);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
        coreGroup.add(sparkMesh);

        // ── 7. Nuage de Poussières Cristallines en Lévitation Douce ──
        const dustCount = 38;
        const dustGeo = new THREE.BufferGeometry();
        const dustPos = new Float32Array(dustCount * 3);
        const dustRadii = new Float32Array(dustCount);
        const dustSpeeds = new Float32Array(dustCount);
        const dustAngles = new Float32Array(dustCount);
        const dustY = new Float32Array(dustCount);

        for (let i = 0; i < dustCount; i++) {
          dustRadii[i] = 0.7 + Math.random() * 1.25;
          dustSpeeds[i] = (0.15 + Math.random() * 0.35) * (Math.random() > 0.5 ? 1 : -1);
          dustAngles[i] = Math.random() * Math.PI * 2;
          dustY[i] = (Math.random() - 0.5) * 0.8;

          dustPos[i * 3] = Math.cos(dustAngles[i]) * dustRadii[i];
          dustPos[i * 3 + 1] = dustY[i];
          dustPos[i * 3 + 2] = Math.sin(dustAngles[i]) * dustRadii[i];
        }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

        const dustMat = new THREE.PointsMaterial({
          size: 0.038,
          color: new THREE.Color(isDarkMode ? '#e0f2fe' : '#38bdf8'),
          transparent: true,
          opacity: isDarkMode ? 0.65 : 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const dustPoints = new THREE.Points(dustGeo, dustMat);
        rootPivot.add(dustPoints);

        // ── 8. Éclairage Studio 3-Points Haute Horlogerie ──
        // Lumière d'ambiance feutrée
        const ambientLight = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.7 : 0.95);
        scene.add(ambientLight);

        // Lumière Clé (Key Light) blanche pure venant du haut à droite
        const keyLight = new THREE.DirectionalLight(0xffffff, isDarkMode ? 1.6 : 1.3);
        keyLight.position.set(3.5, 4.2, 4.0);
        scene.add(keyLight);

        // Contre-jour (Rim Light) Violet / Cobalt caressant les biseaux métalliques
        const rimLight = new THREE.DirectionalLight(0x818cf8, isDarkMode ? 1.4 : 0.9);
        rimLight.position.set(-4.0, -2.5, -2.0);
        scene.add(rimLight);

        // Lumière ponctuelle intérieure issue de la singularité
        const coreLight = new THREE.PointLight(new THREE.Color('#38bdf8'), 2.2, 4.5, 1.6);
        coreLight.position.set(0, 0, 0);
        coreGroup.add(coreLight);

        // Éclat spéculaire qui glisse avec le curseur
        const specularKicker = new THREE.PointLight(new THREE.Color('#ffffff'), 1.4, 4.0, 1.8);
        specularKicker.position.set(0, 0, 2.2);
        scene.add(specularKicker);

        // ── 9. Symbiose Dynamique avec le Thème ──
        const themeObserver = new MutationObserver(() => {
          const dark = document.documentElement.classList.contains('dark');
          if (dark !== isDarkMode) {
            isDarkMode = dark;
            renderer.toneMappingExposure = isDarkMode ? 1.15 : 1.05;
            ambientLight.intensity = isDarkMode ? 0.7 : 0.95;
            keyLight.intensity = isDarkMode ? 1.6 : 1.3;
            rimLight.intensity = isDarkMode ? 1.4 : 0.9;
            titaniumMat1.color.set(isDarkMode ? '#0f172a' : '#1e293b');
            sapphireMat2.color.set(isDarkMode ? '#1e1b4b' : '#312e81');
            platinumMat3.color.set(isDarkMode ? '#090d16' : '#0f172a');
            dustMat.color.set(isDarkMode ? '#e0f2fe' : '#38bdf8');
          }
        });
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        });

        // ── 10. Physique Inertielle & Interactions Nobles ──
        const pointer = { x: 0, y: 0 };
        const current = { x: 0, y: 0 };
        let impulse = 0; // Impulsion de réfraction au clic

        const onPointerMove = (e: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          // Amortissement mesuré du curseur (amplitude contenue, luxueuse)
          pointer.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 1.6)));
          pointer.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 1.6)));
        };

        const onLeave = () => {
          pointer.x = 0;
          pointer.y = 0;
        };

        const onClick = () => {
          if (!reducedMotion) {
            impulse += 0.45; // Impulsion raffinée (pas de sursaut agressif)
          }
        };

        window.addEventListener('pointermove', onPointerMove);
        container.addEventListener('pointerleave', onLeave);
        container.addEventListener('click', onClick);

        // ── 11. Redimensionnement réactif ──
        const resize = () => {
          const { width, height } = container.getBoundingClientRect();
          if (width === 0 || height === 0) return;
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();

        let visible = true;
        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        io.observe(container);

        // ── 12. Boucle Cinématique à Cadence Horlogère (60 FPS) ──
        const startTime = performance.now();
        let frame = 0;

        const tick = () => {
          frame = requestAnimationFrame(tick);
          if (!visible || document.hidden) return;

          const t = (performance.now() - startTime) / 1000;
          const motion = reducedMotion ? 0.05 : 1.0;
          
          impulse *= 0.95; // Amortissement progressif très soyeux
          const pace = (1 + impulse) * motion;

          // Amortissement inertiel haute précision (effet objet lourd et précieux)
          current.x += (pointer.x - current.x) * 0.038;
          current.y += (pointer.y - current.y) * 0.038;

          // Flottement harmonique majestueux
          rootPivot.position.y = Math.sin(t * 1.1) * 0.04 * motion;

          // Inclinaison de perspective noble
          rootPivot.rotation.y = current.x * 0.35;
          rootPivot.rotation.x = -current.y * 0.28;

          // ── Cadence de Rotation Horlogère des 3 Anneaux ──
          // Vitesses calculées pour des rapports harmoniques parfaits (nombre d'or)
          ringMesh1.rotation.x += 0.0042 * pace;
          ringMesh1.rotation.y += 0.0068 * pace;

          ringMesh2.rotation.y += 0.0055 * pace;
          ringMesh2.rotation.z += 0.0061 * pace;

          ringMesh3.rotation.z += 0.0058 * pace;
          ringMesh3.rotation.x += 0.0039 * pace;

          // ── Respiration Subtile du Diamant Central ──
          const breathScale = 1 + Math.sin(t * 2.2) * 0.045 + impulse * 0.12;
          diamondMesh.scale.setScalar(breathScale);
          diamondMesh.rotation.y += 0.007 * pace;
          diamondMesh.rotation.x += 0.005 * pace;

          // Tourbillon interne en contre-rotation rapide
          tourbillonMesh.scale.setScalar(breathScale * 1.04);
          tourbillonMesh.rotation.y -= 0.012 * pace;
          tourbillonMesh.rotation.z += 0.008 * pace;

          // Étincelle photonique au cœur
          sparkMesh.rotation.y += 0.02 * pace;
          sparkMesh.rotation.x -= 0.015 * pace;

          // ── Dérive Poétique des Poussières Stellaires ──
          const posAttr = dustGeo.attributes.position;
          for (let i = 0; i < dustCount; i++) {
            dustAngles[i] += 0.006 * dustSpeeds[i] * pace;
            const r = dustRadii[i] * (1 + 0.03 * Math.sin(t * 1.5 + i));
            posAttr.setX(i, Math.cos(dustAngles[i]) * r);
            posAttr.setZ(i, Math.sin(dustAngles[i]) * r);
            posAttr.setY(i, dustY[i] + Math.sin(t * 0.8 + i) * 0.05);
          }
          posAttr.needsUpdate = true;

          // Kicker spéculaire glissant sur les biseaux
          specularKicker.position.set(current.x * 2.2, -current.y * 2.0 + 0.2, 2.2);

          // Halo ambiant feutré
          if (haloRef.current) {
            const haloScale = 1 + Math.sin(t * 1.8) * 0.04 + impulse * 0.15;
            haloRef.current.style.transform = `scale(${haloScale.toFixed(3)})`;
          }

          renderer.render(scene, camera);
        };

        tick();
        setReady(true);

        cleanup = () => {
          cancelAnimationFrame(frame);
          ro.disconnect();
          io.disconnect();
          themeObserver.disconnect();
          mediaQuery.removeEventListener('change', onMotionChange);
          window.removeEventListener('pointermove', onPointerMove);
          container.removeEventListener('pointerleave', onLeave);
          container.removeEventListener('click', onClick);

          ringGeo1.dispose();
          ringGeo2.dispose();
          ringGeo3.dispose();
          bevelGeo1.dispose();
          bevelMat.dispose();
          titaniumMat1.dispose();
          sapphireMat2.dispose();
          platinumMat3.dispose();

          gemSatGeo.dispose();
          gemSatMat.dispose();

          diamondGeo.dispose();
          diamondMat.dispose();
          tourbillonGeo.dispose();
          tourbillonMat.dispose();
          sparkGeo.dispose();
          sparkMat.dispose();

          dustGeo.dispose();
          dustMat.dispose();

          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (err) {
        console.warn('[NEXUS] Rendu 3D non supporté, repli vectoriel :', err);
        if (!disposed) setFailed(true);
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div className={cn('relative select-none mx-auto flex items-center justify-center', className)}>
      {/* Halo d'ambiance satiné et feutré (diffusion ultra-douce) */}
      <div
        ref={haloRef}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-[-15%] rounded-full blur-3xl transition-opacity duration-700',
          'bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.20)_0%,rgba(99,102,241,0.12)_45%,transparent_70%)]',
          'dark:bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.28)_0%,rgba(139,92,246,0.16)_45%,transparent_70%)]',
          active ? 'opacity-100 scale-105' : 'opacity-80',
        )}
      />

      {failed ? (
        <NexusMark className="relative w-full h-full p-2 animate-nexus-float" pulse={active} />
      ) : (
        <>
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <NexusMark className="w-full h-full p-2 opacity-60" />
            </div>
          )}
          <div
            ref={containerRef}
            className="relative w-full h-full cursor-pointer flex items-center justify-center"
            role="img"
            aria-label="Nexus Core — Joyau 3D Haute Horlogerie en temps réel"
            title="Nexus Core — Cœur Quantique (Cliquez pour faire scintiller)"
          />
        </>
      )}
    </div>
  );
}
