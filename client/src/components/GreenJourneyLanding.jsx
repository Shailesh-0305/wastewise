import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowRight, 
  MapPin, 
  Calendar, 
  BookOpen, 
  PlusCircle, 
  CheckCircle2, 
  Recycle, 
  Sparkles, 
  Leaf, 
  ChevronDown, 
  ShieldCheck, 
  LogIn, 
  UserPlus,
  Compass,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ForestSilhouettes, FloatingLeaf } from './NatureDecorations';

/**
 * Illustrated Green Municipal Waste-Collection Mini-Truck (SVG)
 * Centered at (0, 0) with a forward-facing orientation.
 * Detailed vector design: cab, tinted windshield, cargo bed with WasteWise emblem,
 * headlights with gentle amber beam, chrome accents, and rubber tires.
 */
function GreenTruckSVG({ size = 56, isReducedMotion = false }) {
  return (
    <svg 
      width={size} 
      height={Math.round(size * 0.58)} 
      viewBox="-30 -18 64 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 4px 10px rgba(22, 101, 52, 0.35))',
        transformOrigin: '0px 0px',
        overflow: 'visible'
      }}
      aria-label="WasteWise Collection Vehicle"
    >
      {/* Headlight beam */}
      <polygon 
        points="26,-6 48,-14 48,14 26,6" 
        fill="url(#headlightBeam)" 
        opacity="0.35"
      />
      
      {/* Chassis / Underframe */}
      <rect x="-24" y="5" width="46" height="4" rx="2" fill="#1f2937" />

      {/* Cargo Box (Green waste container) */}
      <rect x="-24" y="-12" width="28" height="18" rx="3" fill="#15803D" stroke="#166534" strokeWidth="1.2" />
      {/* Cargo Ribs */}
      <line x1="-18" y1="-10" x2="-18" y2="4" stroke="#166534" strokeWidth="1" opacity="0.6" />
      <line x1="-10" y1="-10" x2="-10" y2="4" stroke="#166534" strokeWidth="1" opacity="0.6" />
      
      {/* WasteWise Recycle Emblem on Cargo Box */}
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

      {/* Windshield & Side Window */}
      <path 
        d="M7,-9 L13,-9 Q17,-9 19,-4 L20,-1 L7,-1 Z" 
        fill="#D1FAE5" 
        stroke="#86EFAC" 
        strokeWidth="0.8" 
        opacity="0.9"
      />

      {/* Front Chrome Bumper */}
      <rect x="24" y="3" width="3" height="4" rx="1.5" fill="#E5E7EB" />
      {/* Headlight bulb */}
      <circle cx="25.5" cy="-0.5" r="2" fill="#FDE047" stroke="#CA8A04" strokeWidth="0.5" />

      {/* Rear Tail Light */}
      <rect x="-24.5" y="0" width="1.5" height="3.5" rx="0.5" fill="#EF4444" />

      {/* Wheels */}
      {/* Rear Wheel */}
      <g className={isReducedMotion ? '' : 'truck-wheel'}>
        <circle cx="-15" cy="8" r="5" fill="#1F2937" stroke="#111827" strokeWidth="1" />
        <circle cx="-15" cy="8" r="2.2" fill="#9CA3AF" />
        <circle cx="-15" cy="8" r="0.8" fill="#111827" />
      </g>
      {/* Front Wheel */}
      <g className={isReducedMotion ? '' : 'truck-wheel'}>
        <circle cx="16" cy="8" r="5" fill="#1F2937" stroke="#111827" strokeWidth="1" />
        <circle cx="16" cy="8" r="2.2" fill="#9CA3AF" />
        <circle cx="16" cy="8" r="0.8" fill="#111827" />
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

export default function GreenJourneyLanding({
  onOpenAuth,
  onRequestPickup,
  onNavigateCentres,
  onNavigateSchedule,
  onNavigateCatalog
}) {
  const containerRef = useRef(null);
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

  // Listen to prefers-reduced-motion and screen width changes
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

  // Scroll listener for truck animation along the SVG road path
  useEffect(() => {
    if (isReducedMotion) return;

    let rafId = null;

    const handleScroll = () => {
      if (!containerRef.current || !pathRef.current || !truckRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Calculate progress between start of journey and end of journey container
      const totalScrollable = rect.height - viewportHeight * 0.4;
      const currentScroll = viewportHeight * 0.45 - rect.top;
      const rawProgress = Math.min(Math.max(currentScroll / totalScrollable, 0), 1);

      // Plateau easing: gently slow down at checkpoints (0, 0.25, 0.50, 0.75, 1.0)
      // so the visitor reads each stage comfortably while the truck pauses
      const stageIndex = Math.min(Math.floor(rawProgress * 5), 4);
      setActiveStage(stageIndex);

      const path = pathRef.current;
      const totalLength = path.getTotalLength();
      const distance = rawProgress * totalLength;

      const pt = path.getPointAtLength(distance);
      const lookAhead = Math.min(distance + 4, totalLength);
      const ptNext = path.getPointAtLength(lookAhead);

      // Tangent angle
      const dx = ptNext.x - pt.x;
      const dy = ptNext.y - pt.y;

      // Calculate SVG scale relative to rendered DOM container
      const svgEl = path.ownerSVGElement;
      if (!svgEl) return;
      const svgRect = svgEl.getBoundingClientRect();
      const scaleX = svgRect.width / 1000;
      const scaleY = svgRect.height / 3200;

      const screenX = pt.x * scaleX;
      const screenY = pt.y * scaleY;
      const screenAngle = Math.atan2(dy * scaleY, dx * scaleX) * (180 / Math.PI);

      truckRef.current.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%) rotate(${screenAngle}deg)`;
    };

    const onScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Trigger initial calculation
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isReducedMotion, isMobile]);

  // Stage details configuration
  const stages = [
    {
      id: 1,
      badge: 'Stage 01 • Source Segregation',
      title: 'It Starts At Home.',
      quote: 'Segregate today. Protect tomorrow.',
      description:
        'Responsible waste management begins with small everyday actions. Separate organic, recyclable, plastic, glass, metal and hazardous waste at the source before collection.',
      image: '/assets/landing/stage1-home-segregation.jpg',
      quoteCallout:
        '"The cleanest city is not the one cleaned best, but the one littered least. It begins right at our doorstep."',
      items: [
        { label: 'Wet & Organic Waste', desc: 'Vegetable peels, food scraps, garden foliage', tag: 'Compost Bin' },
        { label: 'Dry Recyclables', desc: 'Paper, cardboard, clean packaging', tag: 'Recycle Bin' },
        { label: 'Plastics & Metals', desc: 'Bottles, cans, foils, containers', tag: 'Recovery Bin' },
        { label: 'Domestic Hazardous', desc: 'Expired batteries, paints, sanitary items', tag: 'Safe Disposal' }
      ]
    },
    {
      id: 2,
      badge: 'Stage 02 • Doorstep Collection',
      title: 'Every Collection Counts.',
      quote: 'Every street deserves a cleaner tomorrow.',
      description:
        'Doorstep collection connects residential households with dependable municipal waste services. Segregated compartments prevent cross-contamination while traversing Coimbatore wards.',
      image: '/assets/landing/stage2-curbside-collection.jpg',
      quoteCallout:
        '"Every morning, sanitation personnel connect our streets with a cleaner, greener tomorrow through disciplined collection."',
      items: [
        { label: 'Regular Ward Sweeps', desc: 'Timely scheduled pickups across all 100 Coimbatore municipal wards', tag: 'Scheduled' },
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
        'Collected waste is systematically categorized at Material Recovery Facilities (MRFs) so that recyclable, reusable, and hazardous materials are properly directed.',
      image: '/assets/landing/stage3-sorting-facility.jpg',
      quoteCallout:
        '"Sorting is the gateway to sustainability. Nothing is waste until we lose the will to recover it."',
      items: [
        { label: 'Streamlined Conveyor Segregation', desc: 'Precision sorting separating polymers, metals, and fibre', tag: 'Recovery' },
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
        'Recovered recyclable materials re-enter productive supply chains, while organic waste undergoes natural aerobic decomposition to produce nutrient-rich bio-compost for Tamil Nadu agriculture.',
      image: '/assets/landing/stage4-recycle-compost.jpg',
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
        'Residents, collection workers, recycling centres, and municipal administrators unite to sustain an eco-conscious urban ecosystem. The journey of waste concludes in a continuous circular loop.',
      image: '/assets/landing/stage5-green-coimbatore.jpg',
      quoteCallout:
        '"When every resident, ward, and recycler acts with shared responsibility, Coimbatore flourishes as a beacon of green living."',
      items: [
        { label: 'Clean Public Spaces', desc: 'Tree-lined avenues, litter-free water bodies, and vibrant parks', tag: 'Green City' },
        { label: 'Community Eco-Points', desc: 'Recognizing conscientious citizen recycling with meaningful incentives', tag: 'Rewards' },
        { label: 'Circular Economy Loop', desc: 'A sustainable municipal rhythm that continuously renews resources', tag: 'Perpetual' }
      ]
    }
  ];

  // SVG Road Path Definition (Scale: 1000 width x 3200 height)
  // S-curving between stages and concluding in an elegant circular recycling loop at Stage 5
  const desktopRoadPath = `
    M 280,140
    C 280,260 360,340 360,460
    C 360,620 640,680 660,860
    C 680,1040 680,1160 550,1320
    C 420,1480 320,1540 330,1740
    C 340,1940 640,2020 670,2220
    C 700,2420 540,2560 500,2700
    C 460,2840 440,2900 500,2900
    A 65,65 0 1,1 500,3030
    A 65,65 0 1,1 500,2900
  `;

  // Mobile Road Path (Clean vertical track down the left-hand margin)
  const mobileRoadPath = `
    M 50,100
    L 50,600
    L 50,1200
    L 50,1800
    L 50,2400
    L 50,2920
    A 40,40 0 1,1 50,3000
    A 40,40 0 1,1 50,2920
  `;

  const roadPathD = isMobile ? mobileRoadPath : desktopRoadPath;

  return (
    <div style={{ width: '100%', overflowX: 'hidden', background: 'var(--main-background)' }}>
      {/* ======================================================== */}
      {/* 1. HERO SECTION – A Cleaner Coimbatore Starts With Us */}
      {/* ======================================================== */}
      <section 
        style={{
          position: 'relative',
          minHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px 24px 100px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #F0F8F0 0%, #F8FAF8 100%)'
        }}
      >
        {/* Large Faded Landscape Background */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/assets/landing/hero-landscape.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            opacity: 0.22,
            filter: 'saturate(0.9)',
            zIndex: 0
          }} 
          aria-hidden="true"
        />

        {/* Soft Mint Gradient Overlay for crisp text contrast */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(240, 248, 240, 0.75) 0%, rgba(248, 250, 248, 0.92) 80%, #F8FAF8 100%)',
            zIndex: 1
          }} 
          aria-hidden="true"
        />

        {/* Botanical Silhouettes */}
        <ForestSilhouettes opacity={0.16} height={140} />
        <FloatingLeaf size={32} top={40} right={80} rotate={25} opacity={0.3} />
        <FloatingLeaf size={24} top={140} right={180} rotate={-15} opacity={0.2} />

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
          {/* Coimbatore Initiative Badge */}
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: '#FFFFFF',
              border: '1.5px solid var(--soft-leaf-green)',
              boxShadow: '0 2px 12px rgba(22, 101, 52, 0.08)',
              marginBottom: 24
            }}
          >
            <Sparkles size={16} color="var(--primary-forest)" />
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--primary-forest)', letterSpacing: '0.4px' }}>
              Coimbatore Waste-Management Initiative
            </span>
          </div>

          {/* Main Headline */}
          <h1 
            style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
              fontWeight: 800,
              color: 'var(--primary-forest)',
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              marginBottom: 20
            }}
          >
            A Cleaner Coimbatore <br />
            <span style={{ color: 'var(--secondary-green)' }}>Starts With Us.</span>
          </h1>

          {/* Supporting Text */}
          <p 
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.35rem)',
              color: 'var(--primary-text)',
              maxWidth: 680,
              margin: '0 auto 36px',
              lineHeight: 1.6,
              fontWeight: 500
            }}
          >
            Every piece of waste has a journey. <br className="hidden-mobile" />
            Let’s make it a meaningful one.
          </p>

          {/* Action Buttons */}
          <div 
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 48
            }}
          >
            <a
              href="#the-green-journey"
              className="btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(22, 101, 52, 0.25)',
                textDecoration: 'none'
              }}
            >
              <Compass size={18} />
              <span>Explore Our Journey</span>
              <ChevronDown size={16} />
            </a>

            <button
              onClick={() => onOpenAuth('register')}
              className="btn-secondary"
              style={{
                padding: '13px 26px',
                fontSize: '0.98rem',
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

          {/* Illustrated Mini-Truck Preview */}
          <div 
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '14px 24px',
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1.5px solid var(--border-light)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 28px rgba(22, 101, 52, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <GreenTruckSVG size={60} isReducedMotion={isReducedMotion} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--primary-forest)' }}>
                  Meet the WasteWise Municipal Carrier
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary-text)' }}>
                  Ready to travel along Coimbatore's green waste collection route below
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider to seamlessly connect into the journey */}
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
          <svg viewBox="0 0 1440 80" fill="none" style={{ width: '100%', height: 'auto', display: 'block' }}>
            <path 
              d="M0,32 C320,74 720,10 1440,48 L1440,80 L0,80 Z" 
              fill="#F8FAF8" 
            />
          </svg>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THE MAIN FEATURE – SCROLL-DRIVEN GREEN JOURNEY */}
      {/* ======================================================== */}
      <section 
        id="the-green-journey"
        ref={containerRef}
        style={{
          position: 'relative',
          padding: '40px 0 100px',
          background: '#F8FAF8'
        }}
      >
        {/* Section Headline */}
        <div style={{ maxWidth: 880, margin: '0 auto 60px', textAlign: 'center', padding: '0 24px' }}>
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
            <span>Interactive Storytelling Experience</span>
          </div>

          <h2 
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              fontWeight: 800,
              color: 'var(--primary-forest)',
              letterSpacing: '-0.8px',
              marginBottom: 14
            }}
          >
            The Green Journey of Coimbatore
          </h2>

          <p style={{ fontSize: '1.05rem', color: 'var(--secondary-text)', lineHeight: 1.6, maxWidth: 660, margin: '0 auto' }}>
            Follow our small green municipal truck as it travels across residential streets, collection routes,
            recovery facilities, and circular transformations that keep Coimbatore pristine.
          </p>
        </div>

        {/* Journey Road SVG Overlay & Traveling Truck */}
        <div 
          style={{
            position: 'absolute',
            top: 240,
            left: 0,
            right: 0,
            bottom: 80,
            pointerEvents: 'none',
            zIndex: 15
          }}
          aria-hidden="true"
        >
          <svg 
            viewBox="0 0 1000 3200" 
            preserveAspectRatio="none" 
            style={{ width: '100%', height: '100%', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#15803D" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#166534" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Road Outer Curb */}
            <path 
              d={roadPathD} 
              fill="none" 
              stroke="#E2ECE4" 
              strokeWidth={isMobile ? "14" : "24"} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              opacity="0.9"
            />
            {/* Road Inner Green Lane */}
            <path 
              d={roadPathD} 
              fill="none" 
              stroke="#86EFAC" 
              strokeWidth={isMobile ? "6" : "12"} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              opacity="0.6"
            />
            {/* Road Median Dashed Line */}
            <path 
              ref={pathRef}
              d={roadPathD} 
              fill="none" 
              stroke="#15803D" 
              strokeWidth={isMobile ? "2" : "3"} 
              strokeDasharray="12, 10" 
              strokeLinecap="round" 
            />

            {/* Checkpoint Rings on Road */}
            {!isMobile && (
              <>
                <circle cx="360" cy="460" r="14" fill="#FFFFFF" stroke="#166534" strokeWidth="4" />
                <circle cx="680" cy="1040" r="14" fill="#FFFFFF" stroke="#166534" strokeWidth="4" />
                <circle cx="330" cy="1740" r="14" fill="#FFFFFF" stroke="#166534" strokeWidth="4" />
                <circle cx="670" cy="2220" r="14" fill="#FFFFFF" stroke="#166534" strokeWidth="4" />
                <circle cx="500" cy="2900" r="16" fill="#166534" stroke="#86EFAC" strokeWidth="4" />
              </>
            )}
          </svg>

          {/* Traveling Green Truck Node */}
          {!isReducedMotion && (
            <div 
              ref={truckRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                willChange: 'transform',
                transform: 'translate3d(280px, 140px, 0) translate(-50%, -50%)',
                zIndex: 25,
                pointerEvents: 'none'
              }}
            >
              <GreenTruckSVG size={isMobile ? 42 : 56} />
            </div>
          )}
        </div>

        {/* 5 Connected Journey Stages */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 120 }}>
          {stages.map((stage, idx) => {
            const isEven = idx % 2 === 1;

            return (
              <div 
                key={stage.id}
                style={{
                  position: 'relative',
                  minHeight: '640px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '60px 24px',
                  overflow: 'hidden'
                }}
              >
                {/* Stage Transparent Photographic Background (20-30% opacity) */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${stage.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: isEven ? 'right center' : 'left center',
                    opacity: 0.24,
                    filter: 'saturate(0.85)',
                    zIndex: 1
                  }} 
                  aria-hidden="true"
                />

                {/* Soft Mint Gradient Overlay for crystal clarity and high contrast */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isEven 
                      ? 'linear-gradient(90deg, rgba(248, 250, 248, 0.95) 0%, rgba(240, 248, 240, 0.82) 60%, rgba(248, 250, 248, 0.94) 100%)'
                      : 'linear-gradient(90deg, rgba(248, 250, 248, 0.95) 0%, rgba(234, 246, 234, 0.84) 50%, rgba(248, 250, 248, 0.95) 100%)',
                    zIndex: 2
                  }} 
                  aria-hidden="true"
                />

                {/* Stage Content Card Container */}
                <div 
                  style={{
                    position: 'relative',
                    zIndex: 3,
                    maxWidth: 1240,
                    width: '100%',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : (isEven ? '1.1fr 0.9fr' : '0.9fr 1.1fr'),
                    gap: 40,
                    alignItems: 'center'
                  }}
                >
                  {/* Left Column (or right depending on isEven) */}
                  <div style={{ order: (!isMobile && isEven) ? 2 : 1 }}>
                    {/* Badge */}
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
                        boxShadow: '0 2px 8px rgba(22, 101, 52, 0.06)',
                        marginBottom: 16
                      }}
                    >
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: activeStage === idx ? 'var(--secondary-green)' : '#9ca3af'
                      }} />
                      <span>{stage.badge}</span>
                    </div>

                    {/* Stage Heading */}
                    <h3 
                      style={{
                        fontSize: 'clamp(2rem, 3.2vw, 2.7rem)',
                        fontWeight: 800,
                        color: 'var(--primary-forest)',
                        lineHeight: 1.2,
                        letterSpacing: '-0.8px',
                        marginBottom: 10
                      }}
                    >
                      {stage.title}
                    </h3>

                    {/* Supporting Quote */}
                    <div 
                      style={{
                        fontSize: '1.18rem',
                        fontWeight: 700,
                        color: 'var(--secondary-green)',
                        marginBottom: 18,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <span>{stage.quote}</span>
                    </div>

                    {/* Description */}
                    <p 
                      style={{
                        fontSize: '1rem',
                        color: 'var(--primary-text)',
                        lineHeight: 1.65,
                        marginBottom: 24,
                        maxWidth: 540
                      }}
                    >
                      {stage.description}
                    </p>

                    {/* Motivational Quote Box */}
                    <div 
                      style={{
                        padding: '16px 20px',
                        borderRadius: 16,
                        background: '#FFFFFF',
                        border: '1px solid var(--border-light)',
                        borderLeft: '4px solid var(--secondary-green)',
                        boxShadow: '0 4px 16px rgba(22, 101, 52, 0.05)',
                        maxWidth: 540
                      }}
                    >
                      <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--primary-text)', lineHeight: 1.5 }}>
                        {stage.quoteCallout}
                      </p>
                    </div>
                  </div>

                  {/* Feature Breakdown Pill List (Card Surface) */}
                  <div style={{ order: (!isMobile && isEven) ? 1 : 2 }}>
                    <div 
                      style={{
                        background: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(12px)',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 24,
                        padding: '28px',
                        boxShadow: '0 12px 32px rgba(22, 101, 52, 0.07)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary-forest)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                          Process Highlights
                        </div>
                        <Leaf size={18} color="var(--secondary-green)" />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {stage.items.map((item, i) => (
                          <div 
                            key={i}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 12,
                              padding: '12px 14px',
                              borderRadius: 14,
                              background: 'var(--very-light-mint)',
                              border: '1px solid var(--border-light)'
                            }}
                          >
                            <CheckCircle2 size={18} color="var(--secondary-green)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-forest)' }}>
                                  {item.label}
                                </span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  background: '#FFFFFF',
                                  color: 'var(--secondary-green)',
                                  border: '1px solid var(--soft-leaf-green)'
                                }}>
                                  {item.tag}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: 3, lineHeight: 1.4 }}>
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
      {/* 3. PLATFORM FEATURES – Be Part of the Change */}
      {/* ======================================================== */}
      <section 
        id="features"
        style={{
          padding: '90px 24px',
          background: 'linear-gradient(180deg, #F8FAF8 0%, #F0F8F0 100%)',
          position: 'relative',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 54px' }}>
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
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: 14
              }}
            >
              <Layers size={16} />
              <span>WasteWise Public Portal</span>
            </div>

            <h2 
              style={{
                fontSize: 'clamp(2.1rem, 3.8vw, 3rem)',
                fontWeight: 800,
                color: 'var(--primary-forest)',
                letterSpacing: '-0.8px',
                marginBottom: 14
              }}
            >
              Be Part of the Change.
            </h2>

            <p style={{ fontSize: '1.05rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              Whether you are managing household recycling, scheduling doorstep pickup, or locating verified collection
              facilities in Coimbatore, WasteWise provides dedicated tools for everyday environmental action.
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24
            }}
          >
            {/* Feature 1: Doorstep Pickup */}
            <div 
              style={{
                background: '#FFFFFF',
                borderRadius: 22,
                padding: '30px 24px',
                border: '1.5px solid var(--border-light)',
                boxShadow: '0 8px 24px rgba(22, 101, 52, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div>
                <div 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--pale-green-section)',
                    border: '1.5px solid var(--soft-leaf-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-forest)',
                    marginBottom: 20
                  }}
                >
                  <PlusCircle size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 8 }}>
                  Doorstep Pickup
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--secondary-text)', lineHeight: 1.5, marginBottom: 22 }}>
                  Submit household waste-collection requests with real-time municipal tracking and ward-level verification.
                </p>
              </div>
              <button
                onClick={onRequestPickup}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 12
                }}
              >
                <span>Request Pickup</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Feature 2: Recycling Centres */}
            <div 
              style={{
                background: '#FFFFFF',
                borderRadius: 22,
                padding: '30px 24px',
                border: '1.5px solid var(--border-light)',
                boxShadow: '0 8px 24px rgba(22, 101, 52, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div>
                <div 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--pale-green-section)',
                    border: '1.5px solid var(--soft-leaf-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-forest)',
                    marginBottom: 20
                  }}
                >
                  <MapPin size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 8 }}>
                  Recycling Centres
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--secondary-text)', lineHeight: 1.5, marginBottom: 22 }}>
                  Discover authorized recycling centres, scrap facilities, and material drop-off points across Coimbatore on an interactive map.
                </p>
              </div>
              <button
                onClick={onNavigateCentres}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 12
                }}
              >
                <span>Explore Map</span>
                <ArrowUpRight size={15} />
              </button>
            </div>

            {/* Feature 3: Collection Schedule */}
            <div 
              style={{
                background: '#FFFFFF',
                borderRadius: 22,
                padding: '30px 24px',
                border: '1.5px solid var(--border-light)',
                boxShadow: '0 8px 24px rgba(22, 101, 52, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div>
                <div 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--pale-green-section)',
                    border: '1.5px solid var(--soft-leaf-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-forest)',
                    marginBottom: 20
                  }}
                >
                  <Calendar size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 8 }}>
                  Collection Schedule
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--secondary-text)', lineHeight: 1.5, marginBottom: 22 }}>
                  View scheduled collection days, morning timings, and material-specific pickup routines for your Coimbatore ward.
                </p>
              </div>
              <button
                onClick={onNavigateSchedule}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 12
                }}
              >
                <span>View Schedule</span>
                <ArrowUpRight size={15} />
              </button>
            </div>

            {/* Feature 4: Waste Guide */}
            <div 
              style={{
                background: '#FFFFFF',
                borderRadius: 22,
                padding: '30px 24px',
                border: '1.5px solid var(--border-light)',
                boxShadow: '0 8px 24px rgba(22, 101, 52, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div>
                <div 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'var(--pale-green-section)',
                    border: '1.5px solid var(--soft-leaf-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-forest)',
                    marginBottom: 20
                  }}
                >
                  <BookOpen size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 8 }}>
                  Waste Guide
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--secondary-text)', lineHeight: 1.5, marginBottom: 22 }}>
                  Understand proper waste segregation with category-by-category disposal guidelines, bin colors, and recycling tips.
                </p>
              </div>
              <button
                onClick={onNavigateCatalog}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 12
                }}
              >
                <span>Browse Guide</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. IMPACT SECTION – Every Small Action Creates A Bigger Impact */}
      {/* ======================================================== */}
      <section 
        id="mission"
        style={{
          padding: '90px 24px',
          background: '#FFFFFF',
          position: 'relative'
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 54px' }}>
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
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: 14
              }}
            >
              <ShieldCheck size={16} />
              <span>Environmental Mission</span>
            </div>

            <h2 
              style={{
                fontSize: 'clamp(2.1rem, 3.8vw, 3rem)',
                fontWeight: 800,
                color: 'var(--primary-forest)',
                letterSpacing: '-0.8px',
                marginBottom: 14
              }}
            >
              Every Small Action Creates A Bigger Impact.
            </h2>

            <p style={{ fontSize: '1.05rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              A sustainable city is built on genuine daily stewardship. By combining citizen participation,
              transparent doorstep collections, and regional recycling networks, Coimbatore creates measurable
              environmental resilience.
            </p>
          </div>

          {/* Genuine Narrative Environmental Pillars (No fabricated animated numbers) */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 28
            }}
          >
            <div 
              style={{
                padding: '32px 28px',
                borderRadius: 22,
                background: 'var(--very-light-mint)',
                border: '1.5px solid var(--border-light)'
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 8 }}>
                100%
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--secondary-green)', marginBottom: 8 }}>
                Doorstep Segregation Vision
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
                Ensuring every residential household and commercial establishment segregates wet organic, dry recyclable,
                and domestic hazardous waste at source before the morning sweep.
              </p>
            </div>

            <div 
              style={{
                padding: '32px 28px',
                borderRadius: 22,
                background: 'var(--very-light-mint)',
                border: '1.5px solid var(--border-light)'
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 8 }}>
                Circular
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--secondary-green)', marginBottom: 8 }}>
                Decentralised Composting
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
                Diverting organic waste away from open dumps into micro-composting centres that nourish
                Coimbatore's community gardens, roadside green belts, and local agriculture.
              </p>
            </div>

            <div 
              style={{
                padding: '32px 28px',
                borderRadius: 22,
                background: 'var(--very-light-mint)',
                border: '1.5px solid var(--border-light)'
              }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-forest)', marginBottom: 8 }}>
                Verified
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--secondary-green)', marginBottom: 8 }}>
                Authorised Recycler Network
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
                Connecting residents with licensed recycling centres for certified e-waste, scrap metals, plastics,
                and glass processing with transparent accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. FINAL CALL TO ACTION – The Journey Doesn't End Here */}
      {/* ======================================================== */}
      <section 
        style={{
          position: 'relative',
          padding: '110px 24px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #F0F8F0 0%, #EAF6EA 100%)',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        {/* Full-width Panoramic Green Landscape Background */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/assets/landing/cta-green-horizon.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.22,
            filter: 'saturate(0.9)',
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
            background: 'linear-gradient(180deg, rgba(240, 248, 240, 0.88) 0%, rgba(234, 246, 234, 0.94) 100%)',
            zIndex: 1
          }} 
          aria-hidden="true"
        />

        <ForestSilhouettes opacity={0.2} height={160} />
        <FloatingLeaf size={36} top={50} right={60} rotate={30} opacity={0.25} />

        <div 
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 820,
            margin: '0 auto',
            textAlign: 'center'
          }}
        >
          {/* Mini-truck reaching final destination icon */}
          <div style={{ display: 'inline-flex', marginBottom: 20 }}>
            <GreenTruckSVG size={68} isReducedMotion={isReducedMotion} />
          </div>

          <h2 
            style={{
              fontSize: 'clamp(2.3rem, 4.5vw, 3.6rem)',
              fontWeight: 800,
              color: 'var(--primary-forest)',
              lineHeight: 1.2,
              letterSpacing: '-1px',
              marginBottom: 16
            }}
          >
            The Journey Doesn't End Here. <br />
            <span style={{ color: 'var(--secondary-green)' }}>It Begins With You.</span>
          </h2>

          <p 
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              color: 'var(--primary-text)',
              lineHeight: 1.6,
              maxWidth: 620,
              margin: '0 auto 36px'
            }}
          >
            Join WasteWise and become an active partner in a cleaner, greener Coimbatore. Track your household eco-points,
            schedule doorstep pickups, and help shape our circular future.
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
              onClick={() => onOpenAuth('register')}
              className="btn-primary"
              style={{
                padding: '14px 32px',
                fontSize: '1.02rem',
                fontWeight: 700,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(22, 101, 52, 0.25)'
              }}
            >
              <UserPlus size={18} />
              <span>Join WasteWise</span>
            </button>

            <button
              onClick={() => onOpenAuth('login')}
              className="btn-secondary"
              style={{
                padding: '13px 28px',
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
              <LogIn size={18} color="var(--primary-forest)" />
              <span>Sign In to Account</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. CLEAN FOOTER */}
      {/* ======================================================== */}
      <footer 
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid var(--border-light)',
          padding: '40px 24px 80px',
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
              The Green Journey
            </a>
            <button onClick={onNavigateCentres} style={{ color: 'var(--primary-text)', fontWeight: 600 }}>
              Recycling Centres
            </button>
            <button onClick={onNavigateSchedule} style={{ color: 'var(--primary-text)', fontWeight: 600 }}>
              Collection Schedule
            </button>
            <button onClick={onNavigateCatalog} style={{ color: 'var(--primary-text)', fontWeight: 600 }}>
              Waste Guide
            </button>
            <button onClick={() => onOpenAuth('login')} style={{ color: 'var(--secondary-green)', fontWeight: 700 }}>
              Sign In
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
