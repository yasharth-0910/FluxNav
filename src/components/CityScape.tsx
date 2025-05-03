"use client"
import { useEffect, useState } from "react"

export default function CityScape() {
  const [rects, setRects] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    // Only run on client
    const newRects = Array.from({ length: 20 }).map((_, i) => ({
      x: i * 50 + 10,
      y: Math.random() * 100 + 50,
    }));
    setRects(newRects);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32">
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 200"
        preserveAspectRatio="none"
      >
        {/* Buildings */}
        <path
          d="M0,200 L50,150 L100,180 L150,120 L200,160 L250,100 L300,140 L350,80 L400,120 L450,60 L500,100 L550,40 L600,80 L650,20 L700,60 L750,0 L800,40 L850,0 L900,20 L950,0 L1000,40 L1000,200 Z"
          className="fill-gray-800"
        />
        {/* Windows */}
        {rects.map((rect, i) => (
          <rect
            key={i}
            x={rect.x}
            y={rect.y}
            width="10"
            height="10"
            className="fill-yellow-500/20"
          />
        ))}
      </svg>
    </div>
  );
}