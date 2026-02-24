'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function AdminGlobe() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const [loading, setLoading] = useState(true);
  const [flockCount, setFlockCount] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { count } = await supabase.from('flocks').select('id', { count: 'exact', head: true }).eq('status', 'active');
        setFlockCount(count || 0);
      } catch (err) { console.error(err); }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    let THREE: typeof import('three');

    async function init() {
      THREE = await import('three');

      const width = mountRef.current!.clientWidth;
      const height = 500;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a1f1a);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.z = 3.5;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current!.appendChild(renderer.domElement);
      canvasRef.current = renderer.domElement;

      // Globe wireframe
      const globeGeo = new THREE.SphereGeometry(1.2, 48, 48);
      const globeMat = new THREE.MeshBasicMaterial({
        color: 0xd4a843,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      scene.add(globe);

      // Solid inner globe
      const innerGeo = new THREE.SphereGeometry(1.18, 48, 48);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x0a2f1a,
        transparent: true,
        opacity: 0.6,
      });
      scene.add(new THREE.Mesh(innerGeo, innerMat));

      // Single farm marker — Sokoto, Nigeria (our only farm location)
      const markerPositions = [
        { lat: 13.06, lng: 5.24, label: 'Sokoto Farm' },
      ];

      const markerGroup = new THREE.Group();

      markerPositions.forEach((pos) => {
        const phi = (90 - pos.lat) * (Math.PI / 180);
        const theta = (pos.lng + 180) * (Math.PI / 180);
        const x = -(1.22) * Math.sin(phi) * Math.cos(theta);
        const y = (1.22) * Math.cos(phi);
        const z = (1.22) * Math.sin(phi) * Math.sin(theta);

        // Point
        const pointGeo = new THREE.SphereGeometry(0.035, 16, 16);
        const pointMat = new THREE.MeshBasicMaterial({ color: 0xd4a843 });
        const point = new THREE.Mesh(pointGeo, pointMat);
        point.position.set(x, y, z);
        markerGroup.add(point);

        // Glow ring
        const ringGeo = new THREE.RingGeometry(0.04, 0.08, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xd4a843,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, y, z);
        ring.lookAt(0, 0, 0);
        markerGroup.add(ring);

        // Pulse ring animation
        const pulseGeo = new THREE.RingGeometry(0.05, 0.055, 16);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0xd4a843,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });
        const pulse = new THREE.Mesh(pulseGeo, pulseMat);
        pulse.position.set(x, y, z);
        pulse.lookAt(0, 0, 0);
        markerGroup.add(pulse);
      });

      scene.add(markerGroup);

      // Floating particles
      const particleGeo = new THREE.BufferGeometry();
      const particleCount = 200;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({ color: 0xd4a843, size: 0.015, transparent: true, opacity: 0.4 });
      scene.add(new THREE.Points(particleGeo, particleMat));

      setLoading(false);

      // Animate
      function animate() {
        animRef.current = requestAnimationFrame(animate);
        globe.rotation.y += 0.002;
        markerGroup.rotation.y += 0.002;
        renderer.render(scene, camera);
      }
      animate();

      // GSAP entrance
      gsap.fromTo(camera.position, { z: 8 }, { z: 3.5, duration: 2, ease: 'power3.out' });
    }

    init();

    return () => {
      cancelAnimationFrame(animRef.current);
      if (canvasRef.current && mountRef.current) {
        mountRef.current.removeChild(canvasRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(contentRef.current!.querySelectorAll('.info-card'),
          { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out', delay: 0.3 });
      });
      return () => ctx.revert();
    }
  }, []);

  return (
    <div ref={contentRef}>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">Farm Globe</h1>
        <p className="text-slate-400 text-sm mt-1">Interactive 3D globe showing our farm location in Sokoto, Nigeria</p>
      </div>

      {/* 3D Globe */}
      <div className="relative rounded-xl overflow-hidden shadow-xl border border-slate-200/50 mb-6 md:mb-8">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a1f1a] z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/30 text-xs font-bold uppercase tracking-wider">Loading Globe...</p>
            </div>
          </div>
        )}
        <div ref={mountRef} className="w-full" style={{ height: '500px' }} />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <div className="info-card bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-emerald-600 text-lg">location_on</span>
          </div>
          <p className="font-mono text-2xl font-bold text-primary tracking-tighter">1</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">Farm Location</p>
          <p className="text-[10px] text-slate-300 mt-0.5">Sokoto, Nigeria</p>
        </div>
        <div className="info-card bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-amber-700 text-lg">egg_alt</span>
          </div>
          <p className="font-mono text-2xl font-bold text-primary tracking-tighter">{flockCount}</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">Active Flocks</p>
        </div>
        <div className="info-card bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-sky-600 text-lg">public</span>
          </div>
          <p className="font-mono text-2xl font-bold text-primary tracking-tighter">Nigeria</p>
          <p className="text-slate-400 text-xs mt-1 font-medium">Operating Country</p>
        </div>
      </div>
    </div>
  );
}
