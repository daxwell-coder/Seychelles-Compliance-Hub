// Seychelles Paradise Theme with Glass Morphism
export const seychellesTheme = {
  colors: {
    primary: {
      oceanBlue: '#0ea5e9',
      paradiseCyan: '#06b6d4',
      sunsetPurple: '#8b5cf6',
      emeraldGreen: '#10b981',
      coralPink: '#f472b6',
      sandBeige: '#fbbf24'
    },
    neutral: {
      white: '#ffffff',
      pearl: '#fefefe',
      lightGray: '#f8fafc',
      mediumGray: '#64748b',
      darkGray: '#334155',
      charcoal: '#1e293b'
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4'
    },
    glass: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      heavy: 'rgba(255, 255, 255, 0.25)',
      border: 'rgba(255, 255, 255, 0.2)'
    }
  },
  
  gradients: {
    paradise: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 25%, #8b5cf6 75%, #10b981 100%)',
    ocean: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    sunset: 'linear-gradient(135deg, #8b5cf6, #f472b6)',
    emerald: 'linear-gradient(135deg, #10b981, #22c55e)',
    coral: 'linear-gradient(135deg, #f472b6, #fbbf24)'
  },

  shadows: {
    glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
    floating: '0 20px 40px rgba(0, 0, 0, 0.15)',
    elevated: '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
  },

  blur: {
    light: 'blur(8px)',
    medium: 'blur(16px)',
    heavy: 'blur(24px)'
  },

  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '24px',
    round: '50%'
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7
    }
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px'
  },

  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      ease: 'ease',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)'
    }
  },

  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1280px'
  }
};

// Component-specific styles
export const componentStyles = {
  card: {
    base: {
      background: seychellesTheme.colors.glass.light,
      backdropFilter: seychellesTheme.blur.medium,
      border: `1px solid ${seychellesTheme.colors.glass.border}`,
      borderRadius: seychellesTheme.borderRadius.large,
      boxShadow: seychellesTheme.shadows.glass,
      transition: `all ${seychellesTheme.animation.duration.normal} ${seychellesTheme.animation.easing.easeInOut}`
    },
    hover: {
      background: seychellesTheme.colors.glass.medium,
      transform: 'translateY(-2px)',
      boxShadow: seychellesTheme.shadows.floating
    }
  },

  button: {
    primary: {
      background: seychellesTheme.gradients.ocean,
      color: seychellesTheme.colors.neutral.white,
      border: 'none',
      borderRadius: seychellesTheme.borderRadius.medium,
      padding: `${seychellesTheme.spacing.md} ${seychellesTheme.spacing.xl}`,
      fontWeight: seychellesTheme.typography.fontWeight.semibold,
      fontSize: seychellesTheme.typography.fontSize.base,
      cursor: 'pointer',
      transition: `all ${seychellesTheme.animation.duration.normal} ${seychellesTheme.animation.easing.easeInOut}`,
      boxShadow: `0 4px 12px ${seychellesTheme.colors.primary.oceanBlue}30`
    },
    secondary: {
      background: seychellesTheme.colors.glass.light,
      color: seychellesTheme.colors.neutral.white,
      border: `1px solid ${seychellesTheme.colors.glass.border}`,
      borderRadius: seychellesTheme.borderRadius.medium,
      padding: `${seychellesTheme.spacing.md} ${seychellesTheme.spacing.xl}`,
      fontWeight: seychellesTheme.typography.fontWeight.medium,
      fontSize: seychellesTheme.typography.fontSize.base,
      cursor: 'pointer',
      transition: `all ${seychellesTheme.animation.duration.normal} ${seychellesTheme.animation.easing.easeInOut}`,
      backdropFilter: seychellesTheme.blur.light
    }
  },

  input: {
    base: {
      background: seychellesTheme.colors.glass.light,
      border: `1px solid ${seychellesTheme.colors.glass.border}`,
      borderRadius: seychellesTheme.borderRadius.medium,
      padding: `${seychellesTheme.spacing.md}`,
      color: seychellesTheme.colors.neutral.white,
      fontSize: seychellesTheme.typography.fontSize.base,
      fontFamily: seychellesTheme.typography.fontFamily,
      backdropFilter: seychellesTheme.blur.light,
      transition: `all ${seychellesTheme.animation.duration.normal} ${seychellesTheme.animation.easing.easeInOut}`,
      '::placeholder': {
        color: 'rgba(255, 255, 255, 0.6)'
      }
    },
    focus: {
      borderColor: seychellesTheme.colors.primary.paradiseCyan,
      boxShadow: `0 0 0 3px ${seychellesTheme.colors.primary.paradiseCyan}20`,
      outline: 'none'
    },
    error: {
      borderColor: seychellesTheme.colors.status.error,
      boxShadow: `0 0 0 3px ${seychellesTheme.colors.status.error}20`
    }
  }
};

// Paradise Background SVG (Animated)
export const paradiseBackgroundSVG = `
<svg width="100%" height="100%" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="25%" style="stop-color:#06b6d4;stop-opacity:1" />
      <stop offset="75%" style="stop-color:#8b5cf6;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.6" />
    </linearGradient>
    <linearGradient id="islandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.3" />
      <stop offset="50%" style="stop-color:#16a34a;stop-opacity:0.4" />
      <stop offset="100%" style="stop-color:#15803d;stop-opacity:0.3" />
    </linearGradient>
  </defs>
  
  <!-- Ocean Background -->
  <rect width="100%" height="100%" fill="url(#oceanGradient)" />
  
  <!-- Floating Islands -->
  <ellipse cx="300" cy="700" rx="120" ry="60" fill="url(#islandGradient)" opacity="0.6">
    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-10; 0,0" dur="6s" repeatCount="indefinite"/>
  </ellipse>
  
  <ellipse cx="800" cy="600" rx="80" ry="40" fill="url(#islandGradient)" opacity="0.4">
    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-15; 0,0" dur="4s" repeatCount="indefinite"/>
  </ellipse>
  
  <ellipse cx="1400" cy="750" rx="100" ry="50" fill="url(#islandGradient)" opacity="0.5">
    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-8; 0,0" dur="8s" repeatCount="indefinite"/>
  </ellipse>
  
  <!-- Palm Trees -->
  <g transform="translate(280, 650)" opacity="0.4">
    <line x1="0" y1="0" x2="0" y2="50" stroke="#16a34a" stroke-width="3"/>
    <path d="M0,0 Q-15,-10 -25,0 Q-10,5 0,0 Q15,-10 25,0 Q10,5 0,0" fill="#22c55e"/>
    <animateTransform attributeName="transform" type="rotate" values="0 0 25; 5 0 25; 0 0 25" dur="3s" repeatCount="indefinite"/>
  </g>
  
  <g transform="translate(820, 580)" opacity="0.3">
    <line x1="0" y1="0" x2="0" y2="40" stroke="#16a34a" stroke-width="2"/>
    <path d="M0,0 Q-12,-8 -20,0 Q-8,4 0,0 Q12,-8 20,0 Q8,4 0,0" fill="#22c55e"/>
    <animateTransform attributeName="transform" type="rotate" values="0 0 20; -3 0 20; 0 0 20" dur="4s" repeatCount="indefinite"/>
  </g>
  
  <!-- Floating Particles -->
  <circle cx="200" cy="200" r="2" fill="#fbbf24" opacity="0.6">
    <animateTransform attributeName="transform" type="translate" values="0,0; 50,30; 0,0" dur="10s" repeatCount="indefinite"/>
  </circle>
  
  <circle cx="600" cy="300" r="3" fill="#f472b6" opacity="0.4">
    <animateTransform attributeName="transform" type="translate" values="0,0; -30,40; 0,0" dur="8s" repeatCount="indefinite"/>
  </circle>
  
  <circle cx="1200" cy="250" r="2" fill="#fbbf24" opacity="0.5">
    <animateTransform attributeName="transform" type="translate" values="0,0; 40,-20; 0,0" dur="12s" repeatCount="indefinite"/>
  </circle>
</svg>`;

// CSS-in-JS helper functions
export const createGlassEffect = (opacity = 0.1, blur = '16px') => ({
  background: `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: `blur(${blur})`,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
});

export const createHoverEffect = (scale = 1.02) => ({
  transform: `scale(${scale})`,
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
});

export const createFocusEffect = (color = seychellesTheme.colors.primary.paradiseCyan) => ({
  borderColor: color,
  boxShadow: `0 0 0 3px ${color}20`,
  outline: 'none'
});
