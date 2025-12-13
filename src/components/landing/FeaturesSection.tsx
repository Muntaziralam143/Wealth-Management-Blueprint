import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Target,
  PieChart,
  LineChart,
  Brain,
  Lock,
  Smartphone,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Target,
    title: 'Goal Tracking',
    description:
      'Set and track multiple financial goals with visual progress indicators and smart milestones.',
    color: 'from-primary to-warning',
    shadowColor: 'shadow-primary/20',
  },
  {
    icon: PieChart,
    title: 'Portfolio Analytics',
    description:
      'Real-time portfolio breakdown with asset allocation insights and performance metrics.',
    color: 'from-accent to-info',
    shadowColor: 'shadow-accent/20',
  },
  {
    icon: LineChart,
    title: 'What-If Simulations',
    description:
      'Run powerful Monte Carlo simulations to project your wealth under various market scenarios.',
    color: 'from-success to-accent',
    shadowColor: 'shadow-success/20',
  },
  {
    icon: Brain,
    title: 'AI Recommendations',
    description:
      'Get personalized investment recommendations based on your risk profile and goals.',
    color: 'from-purple-500 to-pink-500',
    shadowColor: 'shadow-purple-500/20',
  },
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    description:
      'Your data is protected with 256-bit encryption, 2FA, and SOC 2 compliance.',
    color: 'from-info to-primary',
    shadowColor: 'shadow-info/20',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description:
      'Access your wealth dashboard anywhere with our responsive, native-feel interface.',
    color: 'from-warning to-destructive',
    shadowColor: 'shadow-warning/20',
  },
];

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!sectionRef.current) return;

    const cards = sectionRef.current.querySelectorAll('.feature-card');

    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 60, rotateX: -10 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top bottom-=100',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} id="features" className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-primary font-medium mb-4 block">Features</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Everything you need to{' '}
            <span className="text-gradient">grow wealth</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful tools designed to give you complete control over your
            financial future.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card glass-card p-8 rounded-2xl group cursor-pointer transition-all duration-500 hover:-translate-y-2"
              style={{ perspective: '1000px' }}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg ${feature.shadowColor} group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-5 blur-xl`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
