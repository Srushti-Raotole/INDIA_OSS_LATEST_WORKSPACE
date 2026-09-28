
import { useMemo } from 'react';

interface StarFieldProps {
  count?: number;
}

export function StarField({ count = 220 }: StarFieldProps) {
  const stars = useMemo(() => {
    const out: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.2 + 0.2,
        o: Math.random() * 0.7 + 0.3,
      });
    }
    return out;
  }, [count]);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at 50% 50%, #0b1024 0%, #04050d 70%, #000 100%)',
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.15}
            fill="#fff"
            opacity={s.o}
          >
            {/* gentle twinkle on a few stars */}
            {i % 9 === 0 && (
              <animate
                attributeName="opacity"
                values={`${s.o};${s.o * 0.3};${s.o}`}
                dur={`${2 + (i % 5)}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
      </svg>
    </div>
  );
}
