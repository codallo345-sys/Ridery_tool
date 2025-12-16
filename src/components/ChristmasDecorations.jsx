// src/components/ChristmasDecorations.jsx
import React, { useState, useEffect } from 'react';
import { Box, keyframes } from '@mui/material';

const snowfall = keyframes`
  0% { transform: translateY(-10px) translateX(0); opacity: 1; }
  100% { transform: translateY(100vh) translateX(50px); opacity: 0.8; }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`;

const swing = keyframes`
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
`;

const ChristmasDecorations = () => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if current date is before January 1, 2026
    const now = new Date();
    const endDate = new Date('2026-01-01T00:00:00');
    setShouldShow(now < endDate);
  }, []);

  if (!shouldShow) {
    return null;
  }

  // Generate random snowflakes
  const snowflakes = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${5 + Math.random() * 10}s`,
    fontSize: `${10 + Math.random() * 20}px`,
  }));

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {/* Snowflakes */}
      {snowflakes.map((flake) => (
        <Box
          key={flake.id}
          sx={{
            position: 'absolute',
            top: '-10px',
            left: flake.left,
            color: '#fff',
            fontSize: flake.fontSize,
            animation: `${snowfall} ${flake.animationDuration} linear infinite`,
            animationDelay: flake.animationDelay,
            opacity: 0.8,
          }}
        >
          ❄️
        </Box>
      ))}

      {/* Christmas lights on top */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '40px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {Array.from({ length: 20 }, (_, i) => (
          <Box
            key={i}
            sx={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              bgcolor: ['#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff'][i % 5],
              boxShadow: `0 0 10px ${['#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff'][i % 5]}`,
              animation: `${twinkle} ${1 + Math.random()}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </Box>

      {/* Santa hat on top-right corner */}
      <Box
        sx={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          fontSize: '48px',
          animation: `${swing} 3s ease-in-out infinite`,
          transformOrigin: 'top center',
        }}
      >
        🎅
      </Box>

      {/* Christmas tree on bottom-left corner */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          fontSize: '64px',
          animation: `${twinkle} 2s ease-in-out infinite`,
        }}
      >
        🎄
      </Box>

      {/* Reindeer on bottom-right corner */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          fontSize: '48px',
          animation: `${swing} 4s ease-in-out infinite`,
          transformOrigin: 'bottom center',
        }}
      >
        🦌
      </Box>

      {/* Gift boxes scattered */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '100px',
          left: '15%',
          fontSize: '32px',
          animation: `${twinkle} 3s ease-in-out infinite`,
        }}
      >
        🎁
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: '80px',
          right: '25%',
          fontSize: '28px',
          animation: `${twinkle} 2.5s ease-in-out infinite`,
          animationDelay: '0.5s',
        }}
      >
        🎁
      </Box>

      {/* Candy canes */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '5%',
          fontSize: '36px',
          animation: `${swing} 5s ease-in-out infinite`,
          transformOrigin: 'bottom center',
        }}
      >
        🍭
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: '40%',
          right: '8%',
          fontSize: '36px',
          animation: `${swing} 4.5s ease-in-out infinite`,
          animationDelay: '1s',
          transformOrigin: 'bottom center',
        }}
      >
        🍭
      </Box>
    </Box>
  );
};

export default ChristmasDecorations;
