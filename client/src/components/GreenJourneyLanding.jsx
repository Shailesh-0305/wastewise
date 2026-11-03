import React, { useEffect, useRef, useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Recycle, 
  Compass, 
  Sparkles, 
  Leaf, 
  ChevronDown, 
  CheckCircle2, 
  Lock,
  PlusCircle,
  MapPin,
  Calendar,
  BookOpen
} from 'lucide-react';
import { ForestSilhouettes, FloatingLeaf } from './NatureDecorations';

// Resolve asset URLs with Vite base path (e.g. /wastewise/)
const BASE = import.meta.env.BASE_URL || '/';
const getAssetUrl = (filename) => `${BASE}assets/landing/${filename}`;

/**
 * Illustrated Green Municipal Waste-Collection Mini-Truck (SVG)
 * Centered at (0, 0) with a forward-facing orientation.
 * Detailed vector: cab, tinted windshield, cargo bed with WasteWise emblem,
 * amber headlight beam, chrome bumper, and rubber tires.
 */
function GreenTruckSVG({ size = 52, isReducedMotion = false }) {
  return (
    <svg 
      width={size} 
      height={Math.round(size * 0.58)} 
      viewBox="-30 -18 64 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 4px 10px rgba(22, 101, 52, 0.32))',
        transformOrigin: '0px 0px',
        overflow: 'visible'
      }}
      aria-label="WasteWise Municipal Collection Vehicle"
    >
      {/* Soft amber headlight beam */}
      <polygon 
        points="26,-6 46,-14 46,14 26,6" 
        fill="url(#headlightBeam)" 
        opacity="0.32"
      />
      
      {/* Chassis / Underframe */}
      <rect x="-24" y="5" width="46" height="4" rx="2" fill="#1f2937" />

      {/* Cargo Box (Green waste container) */}
      <rect x="-24" y="-12" width="28" height="18" rx="3" fill="#15803D" stroke="#166534" strokeWidth="1.2" />
      <line x1="-18" y1="-10" x2="-18" y2="4" stroke="#166534" strokeWidth="1" opacity="0.6" />
      <line x1="-10" y1="-10" x2="-10" y2="4" stroke="#166534" strokeWidth="1" opacity="0.6" />
      
      {/* WasteWise Recycle Emblem */}
      <circle cx="-10" cy="-3" r="4.5" fill="#EAF6EA" />
      <path 
        d="M-10,-5.5 L-8,-3.5 L-9.2,-3.5 C-9.2,-1.5 -8.2,-1 -7,-1 C-7.5,0.2 -9,0.5 -10.2,-0.2 C-10.8,-0.6 -11.2,-1.2 -11.2,-2.2 L-12,-2.2 Z" 
        fill="#15803D" 
      />

      {/* Driver Cab */}
      <path 
        d="M4,-12 L14,-12 Q20,-12 23,-5 L25,0 Q26,3 26,6 L4,6 Z" 
        fill="#166534" 
        stroke="#0f4523" 
        strokeWidth="1.2" 
      />

      {/* Windshield */}
      <path 
        d="M7,-9 L13,-9 Q17,-9 19,-4 L20,-1 L7,-1 Z" 
        fill="#D1FAE5" 
        stroke="#86EFAC" 
        strokeWidth="0.8" 
        opacity="0.9"
      />

      {/* Front Chrome Bumper */}
      <rect x="24" y="3" width="3" height="4" rx="1.5" fill="#E5E7EB" />
      <circle cx="25.5" cy="-0.5" r="2" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.5" />

      {/* Rear Tail Light */}
      <rect x="-24.5" y="0" width="1.5" height="3.5" rx="0.5" fill="#EF4444" />

      {/* Wheels */}
      <g className={isReducedMotion ? '' : 'truck-wheel'}>
        <circle cx="-15" cy="8" r="5" fill="#1F2937" stroke="#111827" strokeWidth="1" />
        <circle cx="-15" cy="8" r="2.2" fill="#9CA3AF" />
      </g>
      <g className={isReducedMotion ? '' : 'truck-wheel'}>
        <circle cx="16" cy="8" r="5" fill="#1F2937" stroke="#111827" strokeWidth="1" />
        <circle cx="16" cy="8" r="2.2" fill="#9CA3AF" />
      </g>

      <defs>
        <radialGradient id="headlightBeam" cx="26" cy="0" r="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function GreenJourneyLanding({ onOpenAuth }) {
  const journeyRef = useRef(null);
  const pathRef = useRef(null);
  const truckRef = useRef(null);
  const [activeStage, setActiveStage] = useState(0);

  const [isReducedMotion, setIsReducedMotion] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  // Track prefers-reduced-motion and screen width changes
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', checkMobile);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Scroll listener: locks the truck to the VERTICAL CENTRE of the screen (50vh)
  // As the visitor scrolls, the truck follows the road curves right in the middle of their viewport
  useEffect(() => {
    if (isReducedMotion) return;

    let rafId = null;

    const handleScroll = () => {
      if (!pathRef.current || !truckRef.current) return;

      const path = pathRef.current;
      const svgEl = path.ownerSVGElement;
      if (!svgEl) return;

      const svgRect = svgEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Bring truck to the vertical centre of the screen
      const desiredScreenY = viewportHeight * 0.5;
      const targetScreenY = desiredScreenY - svgRect.top;

      const scaleY = svgRect.height / 2800;
      const scaleX = svgRect.width / 100;

      // Target Y in SVG viewBox coordinates (0 to 2800)
      const targetSvgY = Math.min(Math.max(targetScreenY / scaleY, 40), 2672);

      // Binary search along the path for the distance where pt.y matches targetSvgY
      const totalLength = path.getTotalLength();
      let low = 0;
      let high = totalLength;
      let bestDist = 0;

      for (let i = 0; i < 14; i++) {
        const mid = (low + high) / 2;
        const p = path.getPointAtLength(mid);
        if (p.y <= targetSvgY) {
          bestDist = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      // If at or past Stage 5 circular loop, advance smoothly around the loop
      if (targetSvgY >= 2520) {
        const loopStartDist = bestDist;
        const loopRemaining = totalLength - loopStartDist;
        const loopProgress = Math.min(Math.max((targetSvgY - 2520) / 152, 0), 1);
        bestDist = loopStartDist + loopProgress * loopRemaining;
      }

      const pt = path.getPointAtLength(bestDist);
      const lookAhead = Math.min(bestDist + 3, totalLength);
      const ptNext = path.getPointAtLength(lookAhead);

      const dx = ptNext.x - pt.x;
      const dy = ptNext.y - pt.y;

      const screenX = pt.x * scaleX;
      const screenY = pt.y * scaleY;
      const screenAngle = Math.atan2(dy * scaleY, dx * scaleX) * (180 / Math.PI);

      // Identify active stage (0 to 4)
      const stageIdx = Math.min(Math.floor((pt.y / 2800) * 5), 4);
      setActiveStage(stageIdx);

      truckRef.current.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%) rotate(${screenAngle}deg)`;
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isReducedMotion, isMobile]);

  // Five-stage waste management narrative
  const stages = [
    {
      id: 1,
      badge: 'Stage 01 • Source Segregation',
      title: 'It Starts At Home.',
      quote: 'Segregate today. Protect tomorrow.',
      description:
        'Responsible waste management begins with everyday actions. Separate organic, recyclable, plastic, glass, metal and hazardous waste before collection.',
      image: 'stage1-home-segregation.jpg',
      quoteCallout:
        '"The cleanest city is not the one cleaned best, but the one littered least. It begins at our doorstep."',
      items: [
        { label: 'Wet & Organic Waste', desc: 'Vegetable peels, food scraps, garden foliage', tag: 'Green Bin' },
        { label: 'Dry Recyclables', desc: 'Paper, cardboard, clean packaging', tag: 'Blue Bin' },
        { label: 'Plastics & Metals', desc: 'Bottles, cans, foils, containers', tag: 'Recovery Bin' },
        { label: 'Domestic Hazardous', desc: 'Expired batteries, paints, sanitary items', tag: 'Red Bin' }
      ]
    },
    {
      id: 2,
      badge: 'Stage 02 • Doorstep Collection',
      title: 'Every Collection Counts.',
      quote: 'Every street deserves a cleaner tomorrow.',
      description:
        'Doorstep collection connects households with responsible waste-management services. Dedicated vehicles ensure segregated waste remains separated throughout transit.',
      image: 'stage2-curbside-collection.jpg',
      quoteCallout:
        '"Every morning, sanitation personnel connect our streets with a cleaner, greener tomorrow through disciplined collection."',
      items: [
        { label: 'Regular Ward Sweeps', desc: 'Scheduled morning sweeps across all 100 Coimbatore municipal wards', tag: 'Scheduled' },
        { label: 'Dual Compartment Transit', desc: 'Ensuring wet and dry waste remain strictly separated during transport', tag: 'Segregated' },
        { label: 'Citizen Pickup Requests', desc: 'On-demand requests for e-waste, scrap, and bulk recyclable materials', tag: 'On Demand' }
      ]
    },
    {
      id: 3,
      badge: 'Stage 03 • Material Recovery',
      title: 'Sorting Makes A Difference.',
      quote: 'Give every material its right destination.',
      description:
        'Collected waste is separated so that reusable and recyclable materials can be recovered and responsibly processed at Material Recovery Facilities (MRFs).',
      image: 'stage3-sorting-facility.jpg',
      quoteCallout:
        '"Sorting is the gateway to sustainability. Nothing is waste until we lose the will to recover it."',
      items: [
        { label: 'Conveyor Segregation', desc: 'Precision sorting separating polymers, metals, and fibre streams', tag: 'Recovery' },
        { label: 'Baling & Densification', desc: 'Compacting recyclable cardboard and plastics for clean transport', tag: 'Processing' },
        { label: 'Safe Residue Diversion', desc: 'Minimizing landfill dependency through strict material recovery', tag: 'Zero Landfill' }
      ]
    },
    {
      id: 4,
      badge: 'Stage 04 • Circular Transformation',
      title: 'Turn Waste Into Worth.',
      quote: 'What we recycle today becomes tomorrow\'s resource.',
      description:
        'Suitable organic waste can become compost, while recyclable materials can return to productive use in circular manufacturing loops.',
      image: 'stage4-recycle-compost.jpg',
      quoteCallout:
        '"Nature produces zero waste. By recycling and composting, we bring nature\'s closed-loop wisdom back to our city."',
      items: [
        { label: 'Organic Bio-Compost', desc: 'Enriching agricultural soils, public gardens, and local urban farming', tag: 'Soil Health' },
        { label: 'Reprocessed Polymers', desc: 'Clean granules returned to manufacturers for industrial containers', tag: 'Circular' },
        { label: 'Scrap Metal & Glass', desc: 'Remelted with over 70% energy savings compared to raw virgin materials', tag: 'Low Carbon' }
      ]
    },
    {
      id: 5,
      badge: 'Stage 05 • Coimbatore Thriving',
      title: 'Together, We Grow Greener.',
      quote: 'A cleaner Coimbatore is everyone\'s responsibility.',
      description:
        'Residents, collection workers and recycling facilities all contribute to a cleaner city. Our shared commitment keeps Coimbatore flourishing.',
      image: 'stage5-green-coimbatore.jpg',
      quoteCallout:
        '"When every resident, ward, and recycler acts with shared responsibility, Coimbatore flourishes as a beacon of green living."',
      items: [
        { label: 'Clean Public Spaces', desc: 'Tree-lined avenues, litter-free water bodies, and vibrant public parks', tag: 'Green City' },
        { label: 'Community Eco-Points', desc: 'Recognizing conscientious citizen recycling with meaningful incentives', tag: 'Rewards' },
        { label: 'Perpetual Circular Loop', desc: 'A sustainable municipal rhythm that continuously renews resources', tag: 'Circular' }
      ]
    }
  ];

  // Dedicated Road Spine Path: strictly confined within a 100px wide channel (viewBox 0 0 100 2800)
  // Gentle organic S-curves that NEVER stray outside x: [30, 70]
  // Checkpoints at stage centers: 280, 840, 1400, 1960, and loops at 2520
  const roadSpinePath = `
    M 50,40
    C 50,140 65,180 65,280
    C 65,460 35,640 35,840
    C 35,1040 65,1200 65,1400
    C 65,1600 35,1760 35,1960
    C 35,2160 50,2340 50,2520
    A 26,26 0 1,1 50,2672
    A 26,26 0 1,1 50,2520
  `;

  return (
    <div style={{ width: '100%', overflowX: 'hidden', background: 'var(--main-background)' }}>
      {/* ======================================================== */}
      {/* 1. HERO SECTION – Authentication-First Opening */}
      {/* ======================================================== */}
      <section 
        style={{
          position: 'relative',
          minHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 24px 80px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #F0F8F0 0%, #F8FAF8 100%)'
        }}
      >
        {/* Full-width High-Quality Environmental Photograph (visibly present, ~35% opacity) */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${getAssetUrl('hero-landscape.jpg')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
            opacity: 0.35,
            filter: 'saturate(0.95)',
            zIndex: 0
          }} 
          aria-hidden="true"
        />

        {/* Soft Forest-Green & Pale-Green Overlay for crisp, legible typography */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(22, 101, 52, 0.22) 0%, rgba(240, 248, 240, 0.65) 75%, #F8FAF8 100%)',
            zIndex: 1
          }} 
          aria-hidden="true"
        />

        {/* Subtle Botanical Silhouettes */}
        <ForestSilhouettes opacity={0.2} height={150} />
        <FloatingLeaf size={34} top={36} right={70} rotate={25} opacity={0.35} />
        <FloatingLeaf size={24} top={120} right={160} rotate={-15} opacity={0.22} />

        {/* Hero Content Container */}
        <div 
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 920,
            textAlign: 'center',
            margin: '0 auto'
          }}
        >
          {/* Coimbatore Municipal Initiative Badge */}
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 18px',
              borderRadius: 999,
              background: '#FFFFFF',
              border: '1.5px solid var(--soft-leaf-green)',
              boxShadow: '0 2px 12px rgba(22, 101, 52, 0.08)',
              marginBottom: 24
            }}
          >
            <Sparkles size={16} color="var(--primary-forest)" />
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary-forest)', letterSpacing: '0.3px' }}>
              Coimbatore Municipal Waste-Management Initiative
            </span>
          </div>

          {/* Headline */}
          <h1 
            style={{
              fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)',
              fontWeight: 800,
              color: 'var(--primary-forest)',
              lineHeight: 1.15,
              letterSpacing: '-1.2px',
              marginBottom: 20
            }}
          >
            Be Part of a Cleaner Coimbatore.
          </h1>

          {/* Supporting Text */}
          <p 
            style={{
              fontSize: 'clamp(1.1rem, 2.2vw, 1.35rem)',
              color: 'var(--primary-text)',
              maxWidth: 720,
              margin: '0 auto 36px',
              lineHeight: 1.6,
              fontWeight: 500
            }}
          >
            Together, we can transform the way our city collects, manages and recycles waste.
          </p>

          {/* Authentication Actions */}
          <div 
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 36
            }}
          >
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-primary"
              style={{
                padding: '14px 34px',
                fontSize: '1.02rem',
                fontWeight: 700,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(22, 101, 52, 0.28)'
              }}
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => onOpenAuth('register')}
              className="btn-secondary"
              style={{
                padding: '13px 30px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFFFFF',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
              }}
            >
              <UserPlus size={18} color="var(--primary-forest)" />
              <span>Join WasteWise</span>
            </button>
          </div>

          {/* Scroll Prompt Link */}
          <div>
            <a
              href="#the-green-journey"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 18px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid var(--border-light)',
                color: 'var(--primary-forest)',
                fontSize: '0.84rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <Compass size={15} />
              <span>Explore Our Story</span>
              <ChevronDown size={14} />
            </a>
          </div>
        </div>

        {/* Bottom wave divider */}
        <div 
          style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            lineHeight: 0,
            zIndex: 3
          }}
        >
          <svg viewBox="0 0 1440 60" fill="none" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <path d="M0,24 C360,54 840,4 1440,36 L1440,60 L0,60 Z" fill="#F8FAF8" />
          </svg>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THE FIVE-STAGE GREEN JOURNEY */}
      {/* ======================================================== */}
      <section 
        id="the-green-journey"
        ref={journeyRef}
        style={{
          position: 'relative',
          padding: '40px 0 80px',
          background: '#F8FAF8'
        }}
      >
        {/* Storytelling Header */}
        <div style={{ maxWidth: 840, margin: '0 auto 60px', textAlign: 'center', padding: '0 24px' }}>
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 999,
              background: 'var(--pale-green-section)',
              border: '1px solid var(--soft-leaf-green)',
              color: 'var(--primary-forest)',
              fontSize: '0.8rem',
              fontWeight: 800,
              marginBottom: 14
            }}
          >
            <Recycle size={15} />
            <span>The Green Journey of Coimbatore</span>
          </div>

          <h2 
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 2.8rem)',
              fontWeight: 800,
              color: 'var(--primary-forest)',
              letterSpacing: '-0.8px',
              marginBottom: 14
            }}
          >
            Five Stages of Circular Responsibility
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--secondary-text)', lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
            Follow our municipal green collection vehicle along its dedicated route — from residential household segregation
            to collection, sorting, composting, and community renewal.
          </p>
        </div>

        {/* 5 Connected Stages with Integrated Central Road Spine */}
        {/* Content sits in left and right columns safely away from the center 100px spine */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
          {/* Dedicated Road Spine Overlay directly spanning the 5 stages */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: isMobile ? 14 : '50%',
              transform: isMobile ? 'none' : 'translateX(-50%)',
              width: isMobile ? 44 : 100,
              pointerEvents: 'none',
              zIndex: 15
            }}
            aria-hidden="true"
          >
            <svg 
              viewBox="0 0 100 2800" 
              preserveAspectRatio="none" 
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {/* Road Outer Surface */}
              <path 
                d={roadSpinePath} 
                fill="none" 
                stroke="#D1FAE5" 
                strokeWidth="16" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                opacity="0.9"
              />
              {/* Road Inner Green Line */}
              <path 
                d={roadSpinePath} 
                fill="none" 
                stroke="#EAF6EA" 
                strokeWidth="10" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Dashed Center Guidance Line */}
              <path 
                ref={pathRef}
                d={roadSpinePath} 
                fill="none" 
                stroke="#15803D" 
                strokeWidth="2" 
                strokeDasharray="6, 5" 
                strokeLinecap="round" 
              />

              {/* Checkpoint Nodes along the road positioned at stage centers */}
              <circle cx="65" cy="280" r="10" fill="#FFFFFF" stroke="#166534" strokeWidth="3" />
              <circle cx="35" cy="840" r="10" fill="#FFFFFF" stroke="#166534" strokeWidth="3" />
              <circle cx="65" cy="1400" r="10" fill="#FFFFFF" stroke="#166534" strokeWidth="3" />
              <circle cx="35" cy="1960" r="10" fill="#FFFFFF" stroke="#166534" strokeWidth="3" />
              <circle cx="50" cy="2520" r="12" fill="#166534" stroke="#86EFAC" strokeWidth="3" />
            </svg>

            {/* Traveling Green Municipal Mini-Truck */}
            {!isReducedMotion && (
              <div 
                ref={truckRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  willChange: 'transform',
                  transform: 'translate3d(50px, 40px, 0) translate(-50%, -50%)',
                  zIndex: 25,
                  pointerEvents: 'none'
                }}
              >
                <GreenTruckSVG size={isMobile ? 38 : 52} />
              </div>
            )}
          </div>
          {stages.map((stage, idx) => {
            const isEven = idx % 2 === 1;

            return (
              <div 
                key={stage.id}
                style={{
                  position: 'relative',
                  minHeight: '560px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '50px 24px',
                  overflow: 'hidden'
                }}
              >
                {/* Full-width Photographic Background (Visibly present at ~32% opacity) */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${getAssetUrl(stage.image)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.32,
                    filter: 'saturate(0.95)',
                    zIndex: 0
                  }} 
                  aria-hidden="true"
                />

                {/* Gentle Pale-Green Tint Overlay: Preserves photo visibility while maximizing text contrast */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, rgba(248, 250, 248, 0.65) 0%, rgba(240, 248, 240, 0.55) 50%, rgba(248, 250, 248, 0.65) 100%)',
                    zIndex: 1
                  }} 
                  aria-hidden="true"
                />

                {/* Editorial Content Container */}
                {/* On desktop: 2 content columns separated by the dedicated center spine */}
                {/* On mobile: single column indented right to avoid the left road gutter */}
                <div 
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: 1200,
                    width: '100%',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    columnGap: isMobile ? 0 : 140, // 140px gap ensures the 100px road spine never touches cards or text!
                    rowGap: 30,
                    alignItems: 'center',
                    paddingLeft: isMobile ? 54 : 0 // Leave space for mobile left gutter
                  }}
                >
                  {/* Text Column (alternates left/right on desktop) */}
                  <div style={{ order: (!isMobile && isEven) ? 2 : 1 }}>
                    {/* Stage Number Badge */}
                    <div 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 12px',
                        borderRadius: 999,
                        background: '#FFFFFF',
                        border: '1.5px solid var(--soft-leaf-green)',
                        color: 'var(--primary-forest)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        boxShadow: '0 2px 8px rgba(22, 101, 52, 0.06)',
                        marginBottom: 14
                      }}
                    >
                      <span style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: activeStage === idx ? 'var(--secondary-green)' : '#9ca3af'
                      }} />
                      <span>{stage.badge}</span>
                    </div>

                    {/* Stage Heading */}
                    <h3 
                      style={{
                        fontSize: 'clamp(1.9rem, 3.2vw, 2.5rem)',
                        fontWeight: 800,
                        color: 'var(--primary-forest)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.6px',
                        marginBottom: 8
                      }}
                    >
                      {stage.title}
                    </h3>

                    {/* Supporting Message */}
                    <div 
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--secondary-green)',
                        marginBottom: 16
                      }}
                    >
                      {stage.quote}
                    </div>

                    {/* Description */}
                    <p 
                      style={{
                        fontSize: '0.98rem',
                        color: 'var(--primary-text)',
                        lineHeight: 1.65,
                        marginBottom: 20,
                        maxWidth: 500
                      }}
                    >
                      {stage.description}
                    </p>

                    {/* Motivational Callout */}
                    <div 
                      style={{
                        padding: '14px 18px',
                        borderRadius: 14,
                        background: 'rgba(255, 255, 255, 0.92)',
                        border: '1px solid var(--border-light)',
                        borderLeft: '4px solid var(--secondary-green)',
                        boxShadow: '0 4px 14px rgba(22, 101, 52, 0.05)',
                        maxWidth: 500
                      }}
                    >
                      <p style={{ fontSize: '0.86rem', fontStyle: 'italic', color: 'var(--primary-text)', lineHeight: 1.5 }}>
                        {stage.quoteCallout}
                      </p>
                    </div>
                  </div>

                  {/* Highlights / Process Card Column */}
                  <div style={{ order: (!isMobile && isEven) ? 1 : 2 }}>
                    <div 
                      style={{
                        background: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(10px)',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 22,
                        padding: '24px',
                        boxShadow: '0 8px 28px rgba(22, 101, 52, 0.07)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--primary-forest)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Process Highlights
                        </div>
                        <Leaf size={16} color="var(--secondary-green)" />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {stage.items.map((item, i) => (
                          <div 
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              padding: '10px 12px',
                              borderRadius: 12,
                              background: 'var(--very-light-mint)',
                              border: '1px solid var(--border-light)'
                            }}
                          >
                            <CheckCircle2 size={16} color="var(--secondary-green)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--primary-forest)' }}>
                                  {item.label}
                                </span>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: 999,
                                  background: '#FFFFFF',
                                  color: 'var(--secondary-green)',
                                  border: '1px solid var(--soft-leaf-green)'
                                }}>
                                  {item.tag}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', marginTop: 2, lineHeight: 1.4 }}>
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. PLATFORM OVERVIEW (INFORMATIONAL ONLY – NO GUEST ACTIONS) */}
      {/* ======================================================== */}
      <section 
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(180deg, #F8FAF8 0%, #F0F8F0 100%)',
          position: 'relative',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' }}>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 14px',
                borderRadius: 999,
                background: '#FFFFFF',
                border: '1.5px solid var(--soft-leaf-green)',
                color: 'var(--primary-forest)',
                fontSize: '0.8rem',
                fontWeight: 800,
                marginBottom: 14
              }}
            >
              <Sparkles size={15} />
              <span>Dedicated Municipal Capabilities</span>
            </div>

            <h2 
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.7rem)',
                fontWeight: 800,
                color: 'var(--primary-forest)',
                letterSpacing: '-0.7px',
                marginBottom: 14
              }}
            >
              How WasteWise Works for Coimbatore
            </h2>

            <p style={{ fontSize: '1rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              A centralized digital platform connecting residents, sanitation teams, and verified recycling facilities.
              Sign in or create an account to access active municipal tools.
            </p>
          </div>

          {/* 4 Informational Cards with explicit auth protection */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20
            }}
          >
            {[
              {
                title: 'Doorstep Waste Pickups',
                desc: 'Schedule on-demand collections for recyclables, e-waste, and bulk items with municipal confirmation.',
                icon: PlusCircle
              },
              {
                title: 'Authorized Recycling Centres',
                desc: 'Locate certified material recovery centres, scrap facilities, and drop-off points across Coimbatore.',
                icon: MapPin
              },
              {
                title: 'Ward Collection Schedules',
                desc: 'Review regular morning timings, designated collection days, and segregated routines for your ward.',
                icon: Calendar
              },
              {
                title: 'Citizen Waste Guide',
                desc: 'Access verified guidelines for separating organic, dry, hazardous, and electronic waste safely.',
                icon: BookOpen
              }
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={i}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    padding: '26px 20px',
                    border: '1.5px solid var(--border-light)',
                    boxShadow: '0 4px 16px rgba(22, 101, 52, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div 
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'var(--pale-green-section)',
                        border: '1.5px solid var(--soft-leaf-green)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-forest)',
                        marginBottom: 16
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 8 }}>
                      {feat.title}
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: 'var(--secondary-text)', lineHeight: 1.5, marginBottom: 18 }}>
                      {feat.desc}
                    </p>
                  </div>

                  {/* Auth trigger button */}
                  <button
                    onClick={() => onOpenAuth('login')}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: 'var(--very-light-mint)',
                      color: 'var(--primary-forest)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <Lock size={13} color="var(--secondary-green)" />
                    <span>Sign in to access</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. FINAL CALL TO ACTION – The Journey Doesn't End Here */}
      {/* ======================================================== */}
      <section 
        style={{
          position: 'relative',
          padding: '100px 24px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #F0F8F0 0%, #EAF6EA 100%)',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        {/* Full-width Panoramic Landscape Background (visibly present, ~34% opacity) */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${getAssetUrl('cta-green-horizon.jpg')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.34,
            filter: 'saturate(0.95)',
            zIndex: 0
          }} 
          aria-hidden="true"
        />

        {/* Soft Mint Gradient Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(240, 248, 240, 0.72) 0%, rgba(234, 246, 234, 0.88) 100%)',
            zIndex: 1
          }} 
          aria-hidden="true"
        />

        <ForestSilhouettes opacity={0.22} height={160} />
        <FloatingLeaf size={36} top={40} right={70} rotate={30} opacity={0.3} />

        <div 
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 800,
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          {/* Mini-truck icon at destination */}
          <div style={{ display: 'inline-flex', marginBottom: 20 }}>
            <GreenTruckSVG size={64} isReducedMotion={isReducedMotion} />
          </div>

          <h2 
            style={{
              fontSize: 'clamp(2.2rem, 4.2vw, 3.4rem)',
              fontWeight: 800,
              color: 'var(--primary-forest)',
              lineHeight: 1.2,
              letterSpacing: '-0.9px',
              marginBottom: 16
            }}
          >
            The Journey Doesn't End Here. <br />
            <span style={{ color: 'var(--secondary-green)' }}>It Begins With You.</span>
          </h2>

          <p 
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.22rem)',
              color: 'var(--primary-text)',
              lineHeight: 1.6,
              maxWidth: 640,
              margin: '0 auto 36px'
            }}
          >
            Let's make Coimbatore cleaner, greener and better for generations to come.
          </p>

          <div 
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-primary"
              style={{
                padding: '14px 34px',
                fontSize: '1.02rem',
                fontWeight: 700,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(22, 101, 52, 0.28)'
              }}
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => onOpenAuth('register')}
              className="btn-secondary"
              style={{
                padding: '13px 30px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)'
              }}
            >
              <UserPlus size={18} color="var(--primary-forest)" />
              <span>Join WasteWise</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. CLEAN MINIMAL FOOTER */}
      {/* ======================================================== */}
      <footer 
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid var(--border-light)',
          padding: '36px 24px 70px',
          color: 'var(--secondary-text)',
          fontSize: '0.84rem'
        }}
      >
        <div 
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--pale-green-section)',
              border: '1px solid var(--soft-leaf-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-forest)'
            }}>
              <Recycle size={18} />
            </div>
            <div>
              <span style={{ fontWeight: 800, color: 'var(--primary-forest)' }}>WasteWise Coimbatore</span>
              <div style={{ fontSize: '0.74rem' }}>Smart Waste Management & Circular Resource Platform</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="#the-green-journey" style={{ color: 'var(--primary-text)', textDecoration: 'none', fontWeight: 600 }}>
              Our Story
            </a>
            <button onClick={() => onOpenAuth('login')} style={{ color: 'var(--primary-text)', fontWeight: 600 }}>
              Sign In
            </button>
            <button onClick={() => onOpenAuth('register')} style={{ color: 'var(--secondary-green)', fontWeight: 700 }}>
              Join WasteWise
            </button>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>
            Coimbatore, Tamil Nadu • Asia/Kolkata (IST)
          </div>
        </div>
      </footer>
    </div>
  );
}
