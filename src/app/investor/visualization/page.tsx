"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface Investment {
  id: string;
  birds_owned: number;
  amount_invested: number;
  status: string;
  flock_id: string;
  round_count: number;
}

export default function InvestorVisualization() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number>(0);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBirds, setTotalBirds] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("investments")
          .select("*")
          .eq("investor_id", user.id)
          .in("status", ["active", "completed"]);
        const inv = data || [];
        setInvestments(inv);
        setTotalBirds(inv.reduce((s, i) => s + (i.birds_owned || 0), 0));
        setTotalValue(inv.reduce((s, i) => s + (i.amount_invested || 0), 0));
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    let THREE: typeof import("three");

    async function init() {
      THREE = await import("three");

      const width = mountRef.current!.clientWidth;
      const height = 450;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a1f1a);

      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.set(0, 3, 6);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mountRef.current!.appendChild(renderer.domElement);
      canvasRef.current = renderer.domElement;

      // Ground plane (grid)
      const gridHelper = new THREE.GridHelper(10, 20, 0x1a4035, 0x1a4035);
      scene.add(gridHelper);

      // Create bars for each investment
      const barGroup = new THREE.Group();
      const maxBirds = Math.max(
        1,
        ...investments.map((i) => i.birds_owned || 1),
      );

      investments.forEach((inv, i) => {
        const barHeight = Math.max(
          0.3,
          ((inv.birds_owned || 1) / maxBirds) * 3,
        );
        const barGeo = new THREE.BoxGeometry(0.6, barHeight, 0.6);

        // Color based on status
        const color =
          inv.status === "active"
            ? 0xd4a843
            : inv.status === "completed"
              ? 0x10b981
              : 0x64748b;
        const barMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.85,
        });

        const bar = new THREE.Mesh(barGeo, barMat);
        const spacing = 1.2;
        const totalWidth = (investments.length - 1) * spacing;
        bar.position.x = -totalWidth / 2 + i * spacing;
        bar.position.y = barHeight / 2;
        barGroup.add(bar);

        // Wireframe outline
        const edgeMat = new THREE.MeshBasicMaterial({
          color: 0xd4a843,
          wireframe: true,
          transparent: true,
          opacity: 0.3,
        });
        const edge = new THREE.Mesh(barGeo, edgeMat);
        edge.position.copy(bar.position);
        barGroup.add(edge);

        // Top point
        const topGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const topMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.set(bar.position.x, barHeight + 0.1, bar.position.z);
        barGroup.add(top);
      });

      scene.add(barGroup);

      // Ambient particles
      const particleGeo = new THREE.BufferGeometry();
      const pCount = 100;
      const positions = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = Math.random() * 5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
      particleGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      const particleMat = new THREE.PointsMaterial({
        color: 0xd4a843,
        size: 0.03,
        transparent: true,
        opacity: 0.4,
      });
      scene.add(new THREE.Points(particleGeo, particleMat));

      setLoading(false);

      // Gentle rotation
      let angle = 0;
      function animate() {
        animRef.current = requestAnimationFrame(animate);
        angle += 0.003;
        camera.position.x = Math.sin(angle) * 6;
        camera.position.z = Math.cos(angle) * 6;
        camera.lookAt(0, 1, 0);
        renderer.render(scene, camera);
      }
      animate();

      // GSAP entrance
      gsap.fromTo(
        camera.position,
        { y: 8 },
        { y: 3, duration: 2, ease: "power3.out" },
      );
    }

    if (investments.length > 0) {
      init();
    } else {
      setLoading(false);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      if (canvasRef.current && mountRef.current) {
        try {
          mountRef.current.removeChild(canvasRef.current);
        } catch {
          /* unmounted */
        }
      }
    };
  }, [investments]);

  useEffect(() => {
    if (contentRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          contentRef.current!.querySelectorAll(".viz-card"),
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: "power3.out",
            delay: 0.3,
          },
        );
      });
      return () => ctx.revert();
    }
  }, []);

  return (
    <div ref={contentRef}>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
          Investment 3D View
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Interactive visualisation of your portfolio — bar height represents
          bird count
        </p>
      </div>

      {/* 3D Scene */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/50 mb-8">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a1f1a] z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/30 text-xs font-bold uppercase tracking-wider">
                Loading 3D View...
              </p>
            </div>
          </div>
        )}
        {investments.length === 0 && !loading ? (
          <div
            className="flex items-center justify-center bg-[#0a1f1a]"
            style={{ height: "450px" }}
          >
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-white/10 mb-3">
                view_in_ar
              </span>
              <p className="text-white/30 text-sm">
                No investments yet. Your 3D portfolio will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div ref={mountRef} className="w-full" style={{ height: "450px" }} />
        )}
      </div>

      {/* Legend + Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="viz-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="font-mono text-xl font-bold text-primary tracking-tighter">
            {investments.length}
          </p>
          <p className="text-slate-400 text-xs mt-1">Investments</p>
        </div>
        <div className="viz-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="font-mono text-xl font-bold text-accent tracking-tighter">
            {totalBirds}
          </p>
          <p className="text-slate-400 text-xs mt-1">Total Birds</p>
        </div>
        <div className="viz-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <p className="font-mono text-xl font-bold text-primary tracking-tighter">
            ₦{totalValue.toLocaleString()}
          </p>
          <p className="text-slate-400 text-xs mt-1">Invested Value</p>
        </div>
        <div className="viz-card bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm text-center">
          <div className="flex items-center justify-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-accent" /> Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Complete
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-2">Bar Colors</p>
        </div>
      </div>
    </div>
  );
}
