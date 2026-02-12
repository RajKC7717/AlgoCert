import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './Preloader.css';
import img from '../assets/mlsclogo.png';
import imgi from '../assets/algorandlogo.png';
interface PreloaderProps {
  onComplete: () => void;
}

const Preloader = ({ onComplete }: PreloaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Create a GSAP timeline
    const tl = gsap.timeline({
      onComplete: () => {
        // When the entire animation sequence is done, call parent function
        onComplete();
      }
    });

    // --- CONTEXT ---
    // We use a proxy object to animate the numeric value from 0 to 100
    const counterProxy = { value: 0 };

    // --- ANIMATION SEQUENCE ---

    // 1. Count to 100 (1.5s)
    tl.to(counterProxy, {
      value: 100,
      duration: 1.5,
      ease: "power1.inOut",
      onUpdate: () => {
        // Update the DOM directly for performance
        if (counterRef.current) {
          counterRef.current.innerText = Math.round(counterProxy.value).toString();
        }
      }
    })
    // Fade image in slightly after start (0.5s delay)
    .to(".loader-image-container", {
        opacity: 1,
        duration: 0.5
    }, "<0.5");


    // 2. The Split (Curtain Reveal)
    // Wait a tiny fraction (0.1s) after counter hits 100 for dramatic effect
    tl.to(".half-upper", {
      yPercent: -100, // Move UP by 100% of its height
      duration: 1.2,
      ease: "power3.inOut"
    }, "+=0.1");
    
    tl.to(".half-lower", {
      yPercent: 100, // Move DOWN by 100% of its height
      duration: 1.2,
      ease: "power3.inOut"
    }, "<"); // Sync with upper half ("<" means start with previous tween)

    // 3. Cleanup (Fade out container slightly to prevent flicker if unmount lags)
    tl.to(containerRef.current, {
        opacity: 0,
        duration: 0.2
    });

    return () => {
      tl.kill(); // Cleanup GSAP instance if component unmounts prematurely
    };
  }, [onComplete]);

  return (
    <div className="preloader-container" ref={containerRef}>
      
      {/* UPPER HALF */}
      <div className="preloader-half half-upper">
        {/* Left Center Image */}
        <div className="loader-image-container">
            <img src={img} alt="Logo" />
        </div>

        {/* Top Right Text */}
        <div className="loader-text">
            <img src={imgi} alt="Logo" />
        </div>
      </div>

      {/* LOWER HALF */}
      <div className="preloader-half half-lower">
        {/* Big Bold Counter (Bottom Left) */}
        <h1 className="counter-text" ref={counterRef}>0</h1>
      </div>

    </div>
  );
};

export default Preloader;