import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserPlus, Target, BarChart3, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Profile',
    description:
      'Answer a few questions about your financial situation, goals, and risk tolerance to get personalized insights.',
  },
  {
    number: '02',
    icon: Target,
    title: 'Set Your Goals',
    description:
      'Define what you\'re saving for—retirement, a home, education—and we\'ll help you build a roadmap.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Track & Simulate',
    description:
      'Connect your accounts, track progress in real-time, and run simulations to see potential outcomes.',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Optimize & Grow',
    description:
      'Receive AI-powered recommendations to optimize your portfolio and accelerate your wealth growth.',
  },
];

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!lineRef.current) return;

    gsap.fromTo(
      lineRef.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/30" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-primary font-medium mb-4 block">How It Works</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Start in <span className="text-gradient">4 simple steps</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Getting started with WealthTrack is easy. Here's how to begin your
            journey to financial freedom.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Connecting Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border/50 hidden md:block">
            <div
              ref={lineRef}
              className="absolute inset-0 bg-gradient-to-b from-primary via-accent to-success origin-top"
              style={{ transformOrigin: 'top' }}
            />
          </div>

          {/* Steps Grid */}
          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex items-center gap-8 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content Card */}
                <div className="flex-1 glass-card p-8 rounded-2xl group hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-bold text-primary/60">
                          {step.number}
                        </span>
                        <h3 className="font-display text-xl font-semibold">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Center Dot */}
                <div className="hidden md:flex w-4 h-4 rounded-full bg-primary shadow-lg glow-primary flex-shrink-0 z-10" />

                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
