'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Stack,
  alpha,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  GitHub,
  LinkedIn,
  Instagram,
  Language
} from '@mui/icons-material';
import { academicColorConstants } from '../../theme/poornimaTheme';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const socialLinks = [
    {
      icon: <GitHub />,
      label: 'GitHub',
      url: 'https://github.com/beekntr', // Replace with your actual GitHub URL
      color: '#333'
    },
    {
      icon: <LinkedIn />,
      label: 'LinkedIn',
      url: 'https://linkedin.com/in/kshitijsinghbhati', // Replace with your actual LinkedIn URL
      color: '#0077B5'
    },
    {
      icon: <Instagram />,
      label: 'Instagram',
      url: 'https://instagram.com/_ksiij', // Replace with your actual Instagram URL
      color: '#E4405F'
    },
    {
      icon: <Language />,
      label: 'Website',
      url: 'https://kshitijsinghbhati.in', // Replace with your actual website URL
      color: academicColorConstants.tertiary.gold
    }
  ];

  return (
    <Box
      component="footer"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: `linear-gradient(135deg, ${alpha(academicColorConstants.primary.main, 0.95)} 0%, ${alpha(academicColorConstants.primary.dark, 0.95)} 100%)`,
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${alpha(academicColorConstants.tertiary.gold, 0.3)}`,
        zIndex: 1000,
        py: { xs: 1, sm: 1.5 }
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 2 },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          {/* Made by info */}
          <Box sx={{ 
            textAlign: { xs: 'center', sm: 'left' },
            order: { xs: 2, sm: 1 }
          }}>
            <Typography
              variant="body2"
              sx={{
                color: academicColorConstants.tertiary.cream,
                fontWeight: 500,
                mb: { xs: 0.25, sm: 0.5 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              Made by{' '}
              <Box
                component="span"
                sx={{
                  color: academicColorConstants.tertiary.gold,
                  fontWeight: 600
                }}
              >
                Kshitij Singh Bhati
              </Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: alpha(academicColorConstants.tertiary.cream, 0.8),
                fontSize: { xs: '0.625rem', sm: '0.75rem' },
                display: 'block'
              }}
            >
              {isMobile ? 'PIET23CR033' : 'PIET23CR033 • Auditorium Booking System'}
            </Typography>
          </Box>

          {/* Social links */}
          <Stack
            direction="row"
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{
              alignItems: 'center',
              order: { xs: 1, sm: 2 }
            }}
          >
            {socialLinks.map((link, index) => (
              <IconButton
                key={index}
                component="a"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  color: academicColorConstants.tertiary.cream,
                  backgroundColor: alpha(academicColorConstants.tertiary.cream, 0.1),
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  },
                  '&:hover': {
                    backgroundColor: alpha(link.color, 0.2),
                    color: link.color === '#333' ? academicColorConstants.tertiary.cream : link.color,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
                aria-label={link.label}
              >
                {link.icon}
              </IconButton>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;