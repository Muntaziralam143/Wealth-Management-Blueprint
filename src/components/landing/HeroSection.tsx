import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, TrendingUp, Shield, Zap } from 'lucide-react';
import gsap from 'gsap';
import FloatingCoins from '@/components/three/FloatingCoins';
import GlassButton from '@/components/ui/GlassButton';

const HeroSection = () => {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statsRef.current) {
      const stats = statsRef.current.querySelectorAll('.stat-item');
      gsap.fromTo(
        stats,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          delay: 1.2,
          ease: 'power3.out',
        }
      );
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-glow opacity-60" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse-glow animation-delay-500" />

      {/* 3D Background */}
      <div className="absolute inset-0 opacity-70">
        <FloatingCoins />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Trusted by 50,000+ investors worldwide
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            variants={itemVariants}
            className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Your Wealth,{' '}
            <span className="text-gradient">Intelligently</span>
            <br />
            Managed
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Set financial goals, track investments, and simulate your future wealth
            with AI-powered insights and beautiful analytics.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link to="/register">
              <GlassButton
                variant="primary"
                size="xl"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Start Free Trial
              </GlassButton>
            </Link>
            <GlassButton
              variant="ghost"
              size="xl"
              leftIcon={<Play className="w-5 h-5" />}
            >
              Watch Demo
            </GlassButton>
          </motion.div>

          {/* Stats */}
          <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-item glass-card p-6 rounded-2xl opacity-0">
              <div className="flex items-center justify-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <span className="text-3xl font-bold font-display">$2.4B+</span>
              </div>
              <p className="text-muted-foreground">Assets Tracked</p>
            </div>
            <div className="stat-item glass-card p-6 rounded-2xl opacity-0">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-accent" />
                <span className="text-3xl font-bold font-display">99.9%</span>
              </div>
              <p className="text-muted-foreground">Uptime Security</p>
            </div>
            <div className="stat-item glass-card p-6 rounded-2xl opacity-0">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-warning" />
                <span className="text-3xl font-bold font-display">24/7</span>
              </div>
              <p className="text-muted-foreground">Real-time Updates</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex justify-center pt-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
