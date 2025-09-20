'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  alpha
} from '@mui/material';
import {
  CheckCircle,
  Groups,
  EventAvailable,
  Schedule,
  AccessTime,
  Email,
  LocationOn,
  Phone
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { academicColorConstants } from '../theme/poornimaTheme';
import Navbar from '@/components/ui/Navbar';

const HomePage = () => {
  const router = useRouter();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const heroFeatures = [
    {
      icon: <CheckCircle sx={{ fontSize: 48, color: academicColorConstants.tertiary.gold }} />,
      title: "Instant Verification",
      description: "QR-based verification system for seamless event management"
    },
    {
      icon: <Groups sx={{ fontSize: 48, color: academicColorConstants.tertiary.gold }} />,
      title: "Capacity Management", 
      description: "Smart capacity planning and resource allocation"
    },
    {
      icon: <EventAvailable sx={{ fontSize: 48, color: academicColorConstants.tertiary.gold }} />,
      title: "Smart Scheduling",
      description: "Advanced scheduling with conflict detection"
    }
  ];

  const detailedFeatures = [
    {
      icon: <Schedule sx={{ fontSize: 40 }} />,
      title: "Streamlined Booking Process",
      description: "Reserve your auditorium space through our intuitive digital platform with real-time availability and instant confirmations.",
      iconBg: "#E3F2FD"
    },
    {
      icon: <AccessTime sx={{ fontSize: 40 }} />,
      title: "Real-Time Scheduling",
      description: "Access live availability updates and avoid scheduling conflicts with our comprehensive calendar management system.",
      iconBg: "#FFEBEE"
    },
    {
      icon: <Groups sx={{ fontSize: 40 }} />,
      title: "Capacity Optimization",
      description: "Intelligent capacity management ensures optimal space utilization with support for events ranging from 350 to 750 attendees.",
      iconBg: "#E8F5E8"
    },
    {
      icon: <Email sx={{ fontSize: 40 }} />,
      title: "Automated Notifications",
      description: "Comprehensive email notifications keep all stakeholders informed about booking confirmations, updates, and reminders.",
      iconBg: "#E3F2FD"
    }
  ];

  const benefits = [
    "Professional-grade security and reliability",
    "Intuitive interface for all user levels",
    "Comprehensive event management tools",
    "Real-time availability and instant confirmations"
  ];

  const specifications = [
    { label: "Capacity Range:", value: "350 - 750 People" },
    { label: "Availability:", value: "24/7 Online Access" },
    { label: "Notifications:", value: "Email & System Alerts" }
  ];

  return (
    <>
      {/* Navbar */}
      <Navbar />
      
      {/* Hero Section */}
      <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        backgroundImage: `url('https://images.pexels.com/photos/207691/pexels-photo-207691.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Enhanced Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(academicColorConstants.primary.main, 0.8)} 0%, ${alpha(academicColorConstants.secondary.main, 0.8)} 100%)`,
          zIndex: 1
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ pt: { xs: 4, md: 6 } }}>
          <Box sx={{ maxWidth: '800px' }}>
            {/* Institution Name */}
            <Typography
              variant="subtitle1"
              sx={{
                color: academicColorConstants.tertiary.cream,
                fontWeight: 500,
                letterSpacing: 2,
                textTransform: 'uppercase',
                mb: 3,
                mt: { xs: 2, md: 4 },
                fontSize: '0.95rem'
              }}
            >
              Poornima Group of Colleges
            </Typography>

            {/* Main Title */}
            <Typography
              variant="h1"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: 'white',
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                lineHeight: 1.1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Dr. S.M Seth
              <br />
              Auditorium
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="h2"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 600,
                color: academicColorConstants.tertiary.gold,
                mb: 4,
                fontSize: { xs: '1.8rem', md: '2.2rem', lg: '2.5rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Booking Platform
            </Typography>

            {/* Description */}
            <Typography
              variant="h6"
              sx={{
                color: academicColorConstants.tertiary.cream,
                mb: 5,
                maxWidth: '600px',
                lineHeight: 1.6,
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 400
              }}
            >
              Sophisticated venue management solution designed for academic institutions, 
              corporate events, and professional gatherings. Experience seamless booking 
              with enterprise-level reliability.
            </Typography>

            {/* Action Buttons */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3}
              sx={{ mb: 6 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/login')}
                sx={{
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  backgroundColor: academicColorConstants.tertiary.cream,
                  color: 'white',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 4px 20px rgba(245, 245, 220, 0.3)',
                  '&:hover': {
                    backgroundColor: '#F0F0DC',
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(245, 245, 220, 0.4)'
                  }
                }}
              >
                Access Platform
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={scrollToFeatures}
                sx={{
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderColor: academicColorConstants.tertiary.cream,
                  color: academicColorConstants.tertiary.cream,
                  borderWidth: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: academicColorConstants.tertiary.gold,
                    backgroundColor: alpha(academicColorConstants.tertiary.gold, 0.1),
                    color: academicColorConstants.tertiary.gold,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Learn More
              </Button>
            </Stack>

            {/* Feature Icons Row */}
            <Box sx={{ mt: 8 }}>
              <Box 
                sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: { xs: 2, md: 3 },
                  justifyContent: { xs: 'center', md: 'flex-start' }
                }}
              >
                {heroFeatures.map((feature, index) => (
                  <Box
                    key={index}
                    sx={{
                      textAlign: 'center',
                      p: { xs: 1.5, md: 2 },
                      borderRadius: 2,
                      background: alpha(academicColorConstants.tertiary.cream, 0.1),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(academicColorConstants.tertiary.gold, 0.2)}`,
                      transition: 'all 0.3s ease',
                      minWidth: { xs: '140px', sm: '180px', md: '200px' },
                      flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(33.333% - 12px)', md: '1 1 calc(25% - 12px)' },
                      maxWidth: { xs: 'calc(50% - 8px)', sm: 'calc(33.333% - 12px)' },
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        background: alpha(academicColorConstants.tertiary.cream, 0.15),
                        border: `1px solid ${alpha(academicColorConstants.tertiary.gold, 0.4)}`
                      }
                    }}
                  >
                    <Box sx={{ mb: 1 }}>
                      {React.cloneElement(feature.icon, { 
                        sx: { fontSize: { xs: 36, md: 48 } } 
                      })}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: academicColorConstants.tertiary.cream,
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                        mb: 0.5
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: alpha(academicColorConstants.tertiary.cream, 0.8),
                        fontSize: { xs: '0.65rem', md: '0.75rem' },
                        lineHeight: 1.3
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>

    {/* Comprehensive Features Section */}
    <Box id="features-section" sx={{ py: { xs: 6, md: 10 }, backgroundColor: '#F8F9FA' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="subtitle2"
            sx={{
              color: academicColorConstants.secondary.main,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              mb: 2,
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          >
            Comprehensive Features
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700,
              color: academicColorConstants.primary.main,
              mb: 3,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              px: { xs: 2, sm: 0 }
            }}
          >
            Advanced Booking Management
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: academicColorConstants.text.secondary,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1rem', md: '1.25rem' },
              px: { xs: 2, sm: 1, md: 0 }
            }}
          >
            Our platform combines institutional-grade reliability with modern user experience, 
            providing comprehensive tools for efficient auditorium management and seamless event coordination.
          </Typography>
        </Box>

        <Box 
          sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 2, sm: 3, md: 4 },
            justifyContent: 'center',
            px: { xs: 1, sm: 0 }
          }}
        >
          {detailedFeatures.map((feature, index) => (
            <Box
              key={index}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', lg: '1 1 calc(33.333% - 16px)' },
                minWidth: { xs: '280px', sm: '300px' },
                maxWidth: { xs: '100%', sm: '400px' }
              }}
            >
              <Card
                sx={{
                  height: '100%',
                  p: { xs: 2, md: 3 },
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      width: { xs: 60, md: 80 },
                      height: { xs: 60, md: 80 },
                      borderRadius: 2,
                      backgroundColor: feature.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: { xs: 2, md: 3 }
                    }}
                  >
                    {React.cloneElement(feature.icon, { 
                      sx: { fontSize: { xs: 32, md: 40 } } 
                    })}
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: academicColorConstants.primary.main,
                      mb: 2,
                      fontSize: { xs: '1.1rem', md: '1.5rem' }
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: academicColorConstants.text.secondary,
                      lineHeight: 1.6,
                      fontSize: { xs: '0.9rem', md: '1rem' }
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>

    {/* About Section */}
    <Box sx={{ py: { xs: 6, md: 10 }, backgroundColor: 'white' }}>
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: { xs: 4, lg: 8 },
            alignItems: 'center'
          }}
        >
          <Box sx={{ 
            flex: '1 1 400px', 
            minWidth: { xs: '100%', lg: '400px' },
            px: { xs: 2, sm: 0 }
          }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: academicColorConstants.secondary.main,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: 'uppercase',
                mb: 2,
                fontSize: { xs: '0.75rem', md: '0.875rem' }
              }}
            >
              About the Platform
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: academicColorConstants.primary.main,
                mb: 4,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              Excellence in Event Management
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: academicColorConstants.text.secondary,
                mb: 4,
                lineHeight: 1.7,
                fontSize: { xs: '1rem', md: '1.1rem' }
              }}
            >
              Our auditorium booking platform represents the convergence of institutional excellence 
              and technological innovation. Designed specifically for academic and professional environments, 
              we provide a comprehensive solution that ensures seamless event coordination and optimal facility utilization.
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
              {benefits.map((benefit, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle
                    sx={{
                      color: academicColorConstants.tertiary.green,
                      mr: 2,
                      fontSize: { xs: 20, md: 24 },
                      flexShrink: 0
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: academicColorConstants.text.secondary,
                      fontWeight: 500,
                      fontSize: { xs: '0.9rem', md: '1rem' }
                    }}
                  >
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ 
            flex: '1 1 400px', 
            minWidth: { xs: '100%', lg: '400px' },
            px: { xs: 2, sm: 0 }
          }}>
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                backgroundColor: '#F8F9FA',
                border: `2px solid ${alpha(academicColorConstants.tertiary.gold, 0.2)}`,
                borderRadius: 3
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: academicColorConstants.primary.main,
                  mb: { xs: 3, md: 4 },
                  fontFamily: '"Playfair Display", serif',
                  fontSize: { xs: '1.5rem', md: '2rem' }
                }}
              >
                Platform Specifications
              </Typography>
              <Stack spacing={{ xs: 2, md: 3 }}>
                {specifications.map((spec, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: { sm: 'space-between' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      py: 1,
                      borderBottom: `1px solid ${alpha(academicColorConstants.primary.main, 0.1)}`,
                      gap: { xs: 0.5, sm: 0 }
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ 
                        color: academicColorConstants.text.secondary,
                        fontSize: { xs: '0.9rem', md: '1rem' }
                      }}
                    >
                      {spec.label}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: academicColorConstants.primary.main,
                        fontSize: { xs: '0.9rem', md: '1rem' }
                      }}
                    >
                      {spec.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>

    {/* Contact Support Section */}
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        background: `linear-gradient(135deg, ${academicColorConstants.primary.main} 0%, ${academicColorConstants.primary.dark} 100%)`,
        color: 'white'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', px: { xs: 2, sm: 0 } }}>
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              backgroundColor: 'rgba(255,255,255,0.98)',
              borderRadius: 3,
              maxWidth: { xs: '100%', sm: 500 },
              mx: 'auto',
              textAlign: 'center'
            }}
          >
            <LocationOn sx={{ 
              fontSize: { xs: 40, md: 50 }, 
              color: academicColorConstants.primary.main, 
              mb: 2 
            }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                fontFamily: '"Playfair Display", serif',
                color: academicColorConstants.primary.main,
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}
            >
              Need Assistance?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: academicColorConstants.text.secondary,
                maxWidth: '400px',
                mx: 'auto',
                lineHeight: 1.5,
                fontSize: { xs: '0.9rem', md: '1rem' }
              }}
            >
              Our dedicated support team is available to assist you with your auditorium booking needs
            </Typography>

            <Box
              sx={{
                backgroundColor: '#F8F9FA',
                borderRadius: 2,
                p: { xs: 2, md: 3 },
                mb: 3
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: academicColorConstants.primary.main,
                  mb: 1,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Facility Coordinator
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: academicColorConstants.text.secondary,
                  fontSize: { xs: '0.8rem', md: '0.875rem' }
                }}
              >
                Available for technical support and booking assistance
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              sx={{
                px: { xs: 3, md: 4 },
                py: { xs: 1.5, md: 2 },
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 600,
                backgroundColor: academicColorConstants.primary.main,
                color: 'white',
                borderRadius: 2,
                textTransform: 'none',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  backgroundColor: academicColorConstants.primary.dark,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Contact Support: 9929002075
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  </>
  );
};

export default HomePage;
