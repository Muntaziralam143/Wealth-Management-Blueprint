import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GoalCard, StatCard } from '@/components/ui/AnimatedCard';
import AnimatedBarChart from '@/components/charts/AnimatedBarChart';
import GlassButton from '@/components/ui/GlassButton';
import { mockGoals } from '@/services/mockData';
import { staggerContainer, staggerItem } from '@/components/layout/PageTransition';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import GlassInput from '@/components/ui/GlassInput';

const Goals = () => {
  const [filter, setFilter] = useState<'all' | 'on_track' | 'at_risk' | 'behind'>('all');
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  const filteredGoals = filter === 'all' 
    ? mockGoals 
    : mockGoals.filter(g => g.status === filter);

  const chartData = mockGoals.map(goal => ({
    name: goal.name.length > 15 ? goal.name.substring(0, 15) + '...' : goal.name,
    value: goal.current_amount,
    target: goal.target_amount,
  }));

  const stats = [
    {
      icon: <Target className="w-5 h-5" />,
      label: 'Total Goals',
      value: mockGoals.length,
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'On Track',
      value: mockGoals.filter(g => g.status === 'on_track').length,
      change: 75,
    },
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: 'At Risk',
      value: mockGoals.filter(g => g.status === 'at_risk').length,
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Total Target',
      value: mockGoals.reduce((acc, g) => acc + g.target_amount, 0),
      prefix: '$',
    },
  ];

  const filterButtons = [
    { key: 'all', label: 'All Goals' },
    { key: 'on_track', label: 'On Track' },
    { key: 'at_risk', label: 'At Risk' },
    { key: 'behind', label: 'Behind' },
  ] as const;

  return (
    <DashboardLayout>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Financial Goals</h1>
            <p className="text-muted-foreground mt-1">Track and manage your savings targets.</p>
          </div>
          <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
            <DialogTrigger asChild>
              <GlassButton leftIcon={<Plus className="w-4 h-4" />}>
                Add Goal
              </GlassButton>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <GlassInput label="Goal Name" placeholder="e.g., Emergency Fund" />
                <GlassInput label="Target Amount" placeholder="$10,000" type="number" />
                <GlassInput label="Deadline" type="date" />
                <GlassInput label="Monthly Contribution" placeholder="$500" type="number" />
                <GlassButton className="w-full" onClick={() => setIsAddingGoal(false)}>
                  Create Goal
                </GlassButton>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} delay={index * 0.1} />
          ))}
        </motion.div>

        {/* Progress Chart */}
        <motion.div variants={staggerItem} className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Goal Progress Overview</h2>
          <AnimatedBarChart data={chartData} showTarget height={300} />
        </motion.div>

        {/* Filter Tabs */}
        <motion.div variants={staggerItem} className="flex flex-wrap gap-2">
          {filterButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card hover:bg-accent/50'
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* Goals Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <GoalCard
                  name={goal.name}
                  current={goal.current_amount}
                  target={goal.target_amount}
                  deadline={goal.deadline}
                  status={goal.status}
                  category={goal.category}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Goals;
