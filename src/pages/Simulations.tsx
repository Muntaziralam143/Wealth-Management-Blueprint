import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, TrendingUp, Calendar, DollarSign, Percent } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AnimatedLineChart from '@/components/charts/AnimatedLineChart';
import GlassButton from '@/components/ui/GlassButton';
import { mockSimulationResult } from '@/services/mockData';
import { staggerContainer, staggerItem } from '@/components/layout/PageTransition';
import { Slider } from '@/components/ui/slider';

const Simulations = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [params, setParams] = useState({
    initialInvestment: 100000,
    monthlyContribution: 2000,
    annualReturn: 8,
    inflationRate: 3,
    years: 20,
  });

  const simulationData = mockSimulationResult.timeline.map(point => ({
    date: `Year ${point.year}`,
    value: point.value,
    benchmark: point.contributions,
  }));

  const handleRunSimulation = () => {
    setIsRunning(true);
    setShowResults(false);
    setTimeout(() => {
      setIsRunning(false);
      setShowResults(true);
    }, 2000);
  };

  const handleReset = () => {
    setParams({
      initialInvestment: 100000,
      monthlyContribution: 2000,
      annualReturn: 8,
      inflationRate: 3,
      years: 20,
    });
    setShowResults(false);
  };

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Investment Simulations</h1>
          <p className="text-muted-foreground mt-1">Project your wealth growth with different scenarios.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parameters Panel */}
          <motion.div variants={staggerItem} className="glass-card p-6 space-y-6">
            <h2 className="text-lg font-semibold">Simulation Parameters</h2>

            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Initial Investment: ${params.initialInvestment.toLocaleString()}
                </label>
                <Slider
                  value={[params.initialInvestment]}
                  onValueChange={([v]) => setParams(p => ({ ...p, initialInvestment: v }))}
                  min={10000}
                  max={500000}
                  step={5000}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Monthly Contribution: ${params.monthlyContribution.toLocaleString()}
                </label>
                <Slider
                  value={[params.monthlyContribution]}
                  onValueChange={([v]) => setParams(p => ({ ...p, monthlyContribution: v }))}
                  min={0}
                  max={10000}
                  step={100}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Expected Annual Return: {params.annualReturn}%
                </label>
                <Slider
                  value={[params.annualReturn]}
                  onValueChange={([v]) => setParams(p => ({ ...p, annualReturn: v }))}
                  min={1}
                  max={15}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Inflation Rate: {params.inflationRate}%
                </label>
                <Slider
                  value={[params.inflationRate]}
                  onValueChange={([v]) => setParams(p => ({ ...p, inflationRate: v }))}
                  min={0}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Investment Period: {params.years} years
                </label>
                <Slider
                  value={[params.years]}
                  onValueChange={([v]) => setParams(p => ({ ...p, years: v }))}
                  min={5}
                  max={40}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <GlassButton
                className="flex-1"
                onClick={handleRunSimulation}
                isLoading={isRunning}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Run
              </GlassButton>
              <GlassButton
                variant="secondary"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </GlassButton>
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div variants={staggerItem} className="lg:col-span-2 space-y-6">
            {showResults ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: DollarSign, label: 'Projected Value', value: `$${(mockSimulationResult.projected_value / 1000000).toFixed(2)}M` },
                    { icon: TrendingUp, label: 'Total Growth', value: `${((mockSimulationResult.projected_value / params.initialInvestment - 1) * 100).toFixed(0)}%` },
                    { icon: Calendar, label: 'Time Period', value: `${params.years} years` },
                    { icon: Percent, label: 'Confidence', value: '85%' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card p-4"
                    >
                      <stat.icon className="w-5 h-5 text-primary mb-2" />
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-semibold">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Chart */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Wealth Projection</h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-primary" />
                        Projected Value
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-muted-foreground" />
                        Contributions
                      </span>
                    </div>
                  </div>
                  <AnimatedLineChart data={simulationData} showBenchmark showArea height={350} />
                </motion.div>

                {/* Scenarios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Best Case', value: mockSimulationResult.best_case, color: 'text-emerald-400' },
                    { label: 'Expected', value: mockSimulationResult.projected_value, color: 'text-primary' },
                    { label: 'Worst Case', value: mockSimulationResult.worst_case, color: 'text-destructive' },
                  ].map((scenario, index) => (
                    <motion.div
                      key={scenario.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="glass-card p-4 text-center"
                    >
                      <p className="text-sm text-muted-foreground">{scenario.label}</p>
                      <p className={`text-xl font-bold ${scenario.color}`}>
                        ${(scenario.value / 1000000).toFixed(2)}M
                      </p>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 flex flex-col items-center justify-center text-center"
              >
                <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Configure Your Simulation</h3>
                <p className="text-muted-foreground max-w-md">
                  Adjust the parameters on the left and click "Run" to see your projected wealth growth.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Simulations;
