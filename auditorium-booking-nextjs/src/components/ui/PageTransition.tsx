'use client'

import React, { ReactNode } from 'react'
import { Box, Fade, Slide, Zoom, Grow } from '@mui/material'
import { keyframes, styled } from '@mui/material/styles'

// Animation keyframes
const slideInFromBottom = keyframes`
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const slideInFromLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const staggeredFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`

// Styled components
const AnimatedContainer = styled(Box)<{ animationType?: string; delay?: number }>(
  ({ theme, animationType = 'slideUp', delay = 0 }) => {
    const animations = {
      slideUp: slideInFromBottom,
      slideRight: slideInFromRight,
      slideLeft: slideInFromLeft,
      stagger: staggeredFadeIn,
      float: float
    }

    const selectedAnimation = animations[animationType as keyof typeof animations] || animations.slideUp

    return {
      animation: `${selectedAnimation} 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms both`,
      willChange: 'transform, opacity'
    }
  }
)

const ParallaxContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    background: `linear-gradient(135deg, 
      ${theme.palette.primary.main}08 0%, 
      ${theme.palette.secondary.main}05 100%)`,
    transform: 'translateZ(0)',
    willChange: 'transform'
  }
}))

const GlassContainer = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.6s',
  },
  '&:hover::before': {
    left: '100%'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)'
  }
}))

// Animation hook for scroll-triggered animations
export const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

// Staggered children animation
const StaggerContainer = styled(Box)({
  '& > *': {
    opacity: 0,
    animation: `${staggeredFadeIn} 0.6s cubic-bezier(0.4, 0, 0.2, 1) both`
  },
  '&.animate > *:nth-of-type(1)': { animationDelay: '0ms' },
  '&.animate > *:nth-of-type(2)': { animationDelay: '100ms' },
  '&.animate > *:nth-of-type(3)': { animationDelay: '200ms' },
  '&.animate > *:nth-of-type(4)': { animationDelay: '300ms' },
  '&.animate > *:nth-of-type(5)': { animationDelay: '400ms' },
  '&.animate > *:nth-of-type(6)': { animationDelay: '500ms' },
  '&.animate > *:nth-of-type(7)': { animationDelay: '600ms' },
  '&.animate > *:nth-of-type(8)': { animationDelay: '700ms' },
  '&.animate > *:nth-of-type(n+9)': { animationDelay: '800ms' }
})

interface PageTransitionProps {
  children: ReactNode
  animationType?: 'slideUp' | 'slideRight' | 'slideLeft' | 'fade' | 'zoom' | 'grow'
  delay?: number
}

interface AnimatedSectionProps {
  children: ReactNode
  animationType?: 'slideUp' | 'slideRight' | 'slideLeft' | 'stagger' | 'float'
  delay?: number
  className?: string
}

interface GlassmorphismProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

interface StaggeredAnimationProps {
  children: ReactNode
  className?: string
}

// Main page transition component
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  animationType = 'slideUp',
  delay = 0
}) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const TransitionComponents = {
    fade: Fade,
    zoom: Zoom,
    grow: Grow,
    slideUp: Slide,
    slideRight: Slide,
    slideLeft: Slide
  }

  const Component = TransitionComponents[animationType]
  const direction = animationType.includes('slide') 
    ? animationType.replace('slide', '').toLowerCase() 
    : undefined

  return (
    <Component
      in={mounted}
      timeout={{ enter: 600, exit: 300 }}
      direction={direction as any}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Box>{children}</Box>
    </Component>
  )
}

// Animated section component
export const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  animationType = 'slideUp',
  delay = 0,
  className
}) => {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <Box ref={ref} className={className}>
      {isVisible && (
        <AnimatedContainer animationType={animationType} delay={delay}>
          {children}
        </AnimatedContainer>
      )}
    </Box>
  )
}

// Glassmorphism container
export const Glassmorphism: React.FC<GlassmorphismProps> = ({
  children,
  className,
  onClick
}) => {
  return (
    <GlassContainer className={className} onClick={onClick}>
      {children}
    </GlassContainer>
  )
}

// Staggered animation container
export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  children,
  className
}) => {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <StaggerContainer
      ref={ref}
      className={`${className || ''} ${isVisible ? 'animate' : ''}`}
    >
      {children}
    </StaggerContainer>
  )
}

// Parallax effect component
export const ParallaxSection: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className
}) => {
  const [scrollY, setScrollY] = React.useState(0)

  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <ParallaxContainer
      className={className}
      sx={{
        transform: `translateY(${scrollY * 0.5}px)`
      }}
    >
      {children}
    </ParallaxContainer>
  )
}

export default PageTransition