"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
interface GlobeProps {
  className?: string;
}

export default function ThreeGlobe({ className = "" }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Controls (drag rotate)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    const loader = new THREE.TextureLoader();

    const earthTexture = loader.load(
      "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
    );

    const normalTexture = loader.load(
      "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg"
    );

    const specularTexture = loader.load(
      "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg"
    );

    const cloudTexture = loader.load(
      "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
    );

    // Earth
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 64, 64),
      new THREE.MeshPhongMaterial({
        map: earthTexture,
        normalMap: normalTexture,
        specularMap: specularTexture,
        shininess: 20,
      })
    );

    scene.add(earth);

    // Clouds
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.52, 64, 64),
      new THREE.MeshLambertMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.4,
      })
    );

    scene.add(clouds);

    // Atmosphere glow
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
      `,
      fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0,0,1)), 2.0);
        gl_FragColor = vec4(0.3,0.6,1.0,1.0) * intensity;
      }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 64, 64),
      atmosphereMaterial
    );

    scene.add(atmosphere);

    // ⭐ Star field
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const starVertices = [];

    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );

    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
      })
    );

    scene.add(stars);

    // 🌍 City markers
    const cities = [
      { lat: 40.7128, lng: -74.006 }, // New York
      { lat: 51.5074, lng: -0.1278 }, // London
      { lat: 35.6762, lng: 139.6503 }, // Tokyo
      { lat: 28.6139, lng: 77.209 }, // Delhi
    ];

    const markers: THREE.Mesh[] = [];

    cities.forEach((c) => {
      const lat = (c.lat * Math.PI) / 180;
      const lng = (c.lng * Math.PI) / 180;

      const x = 1.52 * Math.cos(lat) * Math.cos(lng);
      const y = 1.52 * Math.sin(lat);
      const z = 1.52 * Math.cos(lat) * Math.sin(lng);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );

      marker.position.set(x, y, z);

      scene.add(marker);
      markers.push(marker);
    });

    // Animation
    let time = 0;

    const animate = () => {
      requestAnimationFrame(animate);

      time += 0.01;

      earth.rotation.y += 0.0015;
      clouds.rotation.y += 0.002;

      stars.rotation.y += 0.0003;

      // Pulsing city markers
      markers.forEach((m, i) => {
        const scale = 1 + Math.sin(time * 3 + i) * 0.4;
        m.scale.set(scale, scale, scale);
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;

      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: "500px" }}
    />
  );
}