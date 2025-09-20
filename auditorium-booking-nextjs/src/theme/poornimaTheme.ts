'use client'

import { createTheme } from '@mui/material/styles'

// Academic Institution Color Palette
const academicColors = {
  // Primary Colors - Academic Navy
  primary: {
    main: '#1B365D',      // Deep Academic Navy
    light: '#2E4A6B',     // Lighter Navy 
    dark: '#0F2333',      // Darker Navy
    contrastText: '#FFFFFF'
  },
  
  // Secondary Colors - Burgundy/Maroon
  secondary: {
    main: '#8B0000',      // Deep Burgundy/Maroon
    light: '#A52A2A',     // Lighter Burgundy
    dark: '#5D0000',      // Darker Burgundy
    contrastText: '#FFFFFF'
  },
  
  // Accent Colors
  tertiary: {
    green: '#2E8B57',     // Academic Green
    gold: '#D4AF37',      // Gold accents
    sage: '#87A96B',      // Sage green
    slate: '#2F4F4F',     // Slate gray
    cream: '#F5F5DC'      // Cream
  },
  
  // Background Colors
  background: {
    default: '#F8F9FA',           // Main background
    paper: '#FFFFFF',             // Card/paper surfaces
    secondary: '#F1F3F5',         // Secondary background
    accent: '#E9ECEF',            // Accent background
    
    // Gradients
    primary: 'linear-gradient(135deg, #1B365D 0%, #0F2333 100%)',
    institutional: 'linear-gradient(135deg, #1B365D 0%, #8B0000 100%)',
    academic: 'linear-gradient(135deg, #2E8B57 0%, #1B365D 100%)',
    heroGradient: 'linear-gradient(135deg, #1B365D 0%, #0F2333 35%, #8B0000 100%)'
  },
  
  // Text Colors
  text: {
    primary: '#2C3E50',    // Main text
    secondary: '#576574',  // Secondary text
    tertiary: '#7F8C8D',   // Tertiary text
    disabled: '#BDC3C7'    // Disabled text
  },
  
  // Status Colors
  success: {
    main: '#2E8B57',
    light: '#87A96B',
    dark: '#1F5F3F'
  },
  
  warning: {
    main: '#D4AF37',
    light: '#F4E07B',
    dark: '#B8860B'
  },
  
  error: {
    main: '#8B0000',
    light: '#A52A2A',
    dark: '#5D0000'
  },
  
  info: {
    main: '#1B365D',
    light: '#2E4A6B',
    dark: '#0F2333'
  }
}

// Animation Configurations
export const academicAnimations = {
  // Duration settings
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195
  },
  
  // Easing functions
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  },
  
  // Academic keyframes
  keyframes: {
    academicShimmer: `
      @keyframes academicShimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `,
    institutionalFade: `
      @keyframes institutionalFade {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
    academicPulse: `
      @keyframes academicPulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(27, 54, 93, 0.4); }
        70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(27, 54, 93, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(27, 54, 93, 0); }
      }
    `
  }
}

// Create the academic theme
export const poornimaTheme = createTheme({
  palette: {
    mode: 'light',
    primary: academicColors.primary,
    secondary: academicColors.secondary,
    background: academicColors.background,
    success: academicColors.success,
    warning: academicColors.warning,
    error: academicColors.error,
    info: academicColors.info,
    text: academicColors.text
  },
  
  typography: {
    // Font Families
    fontFamily: '"Source Sans Pro", "Helvetica", "Arial", sans-serif',
    
    // Headers (Playfair Display style)
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      fontFamily: '"Playfair Display", "Georgia", serif',
      color: academicColors.primary.main,
      '@media (max-width:600px)': {
        fontSize: '2.5rem'
      }
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      fontFamily: '"Playfair Display", "Georgia", serif',
      color: academicColors.primary.main,
      '@media (max-width:600px)': {
        fontSize: '2rem'
      }
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
      fontFamily: '"Playfair Display", "Georgia", serif',
      color: academicColors.primary.dark,
      '@media (max-width:600px)': {
        fontSize: '1.75rem'
      }
    },
    
    // Body Text (Source Sans Pro)
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: academicColors.text.primary
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: academicColors.text.primary
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      color: academicColors.text.primary
    },
    
    // Content Text
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.6,
      color: academicColors.text.secondary
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      fontWeight: 400,
      color: academicColors.text.primary
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
      color: academicColors.text.secondary
    },
    
    // UI Text
    button: {
      fontSize: '0.95rem',
      fontWeight: 600,
      textTransform: 'none'
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      fontWeight: 400,
      color: academicColors.text.tertiary
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em'
    }
  },
  
  shape: {
    borderRadius: 8
  },
  
  spacing: 8,
  
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536
    }
  },
  
  shadows: [
    'none',
    '0px 2px 8px rgba(27, 54, 93, 0.08)',
    '0px 4px 12px rgba(27, 54, 93, 0.10)',
    '0px 6px 16px rgba(27, 54, 93, 0.12)',
    '0px 8px 20px rgba(27, 54, 93, 0.14)',
    '0px 10px 24px rgba(27, 54, 93, 0.16)',
    '0px 12px 28px rgba(27, 54, 93, 0.18)',
    '0px 14px 32px rgba(27, 54, 93, 0.20)',
    '0px 16px 36px rgba(27, 54, 93, 0.22)',
    '0px 18px 40px rgba(27, 54, 93, 0.24)',
    '0px 20px 44px rgba(27, 54, 93, 0.26)',
    '0px 22px 48px rgba(27, 54, 93, 0.28)',
    '0px 24px 52px rgba(27, 54, 93, 0.30)',
    '0px 26px 56px rgba(27, 54, 93, 0.32)',
    '0px 28px 60px rgba(27, 54, 93, 0.34)',
    '0px 30px 64px rgba(27, 54, 93, 0.36)',
    '0px 32px 68px rgba(27, 54, 93, 0.38)',
    '0px 34px 72px rgba(27, 54, 93, 0.40)',
    '0px 36px 76px rgba(27, 54, 93, 0.42)',
    '0px 38px 80px rgba(27, 54, 93, 0.44)',
    '0px 40px 84px rgba(27, 54, 93, 0.46)',
    '0px 42px 88px rgba(27, 54, 93, 0.48)',
    '0px 44px 92px rgba(27, 54, 93, 0.50)',
    '0px 46px 96px rgba(27, 54, 93, 0.52)',
    '0px 48px 100px rgba(27, 54, 93, 0.54)'
  ],
  
  components: {
    // Button Styling
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '12px 32px',
          fontSize: '0.95rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0px 4px 12px rgba(27, 54, 93, 0.15)'
          }
        },
        contained: {
          background: academicColors.background.primary,
          color: '#FFFFFF',
          '&:hover': {
            background: academicColors.background.institutional,
            transform: 'translateY(-1px)',
            boxShadow: '0px 6px 20px rgba(27, 54, 93, 0.25)'
          }
        },
        outlined: {
          borderColor: academicColors.primary.main,
          color: academicColors.primary.main,
          '&:hover': {
            borderColor: academicColors.primary.dark,
            backgroundColor: `rgba(27, 54, 93, 0.04)`,
            transform: 'translateY(-1px)'
          }
        }
      }
    },
    
    // Card Styling
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(27, 54, 93, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid #E1E5E9',
          background: '#FFFFFF',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 8px 25px rgba(27, 54, 93, 0.12)'
          }
        }
      }
    },
    
    // TextField Styling
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.3s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: academicColors.primary.main
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: academicColors.primary.main,
              borderWidth: '2px'
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: academicColors.primary.main
          }
        }
      }
    },
    
    // Chip Styling
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          transition: 'all 0.3s ease'
        },
        colorPrimary: {
          backgroundColor: academicColors.primary.main,
          color: '#FFFFFF'
        },
        colorSecondary: {
          backgroundColor: academicColors.secondary.main,
          color: '#FFFFFF'
        }
      }
    },
    
    // Paper Styling
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF'
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(27, 54, 93, 0.08)'
        },
        elevation2: {
          boxShadow: '0px 4px 12px rgba(27, 54, 93, 0.10)'
        },
        elevation3: {
          boxShadow: '0px 6px 16px rgba(27, 54, 93, 0.12)'
        }
      }
    },
    
    // AppBar Styling
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: academicColors.background.institutional,
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }
    },
    
    // Tabs Styling
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: academicColors.tertiary.gold
        }
      }
    },
    
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.95rem',
          '&.Mui-selected': {
            color: academicColors.primary.main
          }
        }
      }
    }
  }
})

// Export academic color constants for use in components
export const academicColorConstants = academicColors

export default poornimaTheme
