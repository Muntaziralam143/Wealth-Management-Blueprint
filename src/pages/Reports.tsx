import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, PieChart, TrendingUp, Target } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassButton from '@/components/ui/GlassButton';
import AnimatedLineChart from '@/components/charts/AnimatedLineChart';
import AnimatedPieChart from '@/components/charts/AnimatedPieChart';
import AnimatedBarChart from '@/components/charts/AnimatedBarChart';
import { mockPortfolioSummary, mockGoals, generatePerformanceData } from '@/services/mockData';
import { staggerContainer, staggerItem } from '@/components/layout/PageTransition';

const reportTypes = [
  { id: 'portfolio', label: 'Portfolio Summary', icon: PieChart },
  { id: 'performance', label: 'Performance Report', icon: TrendingUp },
  { id: 'goals', label: 'Goals Progress', icon: Target },
];

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('portfolio');
  const [dateRange, setDateRange] = useState('12m');

  const performanceData = generatePerformanceData(12);
  
  const allocationData = Object.entries(mockPortfolioSummary.asset_allocation).map(([name, percentage], index) => ({
    name,
    value: percentage,
    color: ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'][index % 5],
  }));

  const goalsData = mockGoals.map(goal => ({
    name: goal.name.length > 12 ? goal.name.substring(0, 12) + '...' : goal.name,
    value: goal.current_amount,
    target: goal.target_amount,
  }));

  const handleExport = (format: 'pdf' | 'csv') => {
    console.log(`Exporting ${selectedReport} report as ${format}`);
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
        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">Generate and export detailed financial reports.</p>
          </div>
          <div className="flex gap-2">
            <GlassButton
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => handleExport('pdf')}
            >
              Export PDF
            </GlassButton>
            <GlassButton
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => handleExport('csv')}
            >
              Export CSV
            </GlassButton>
          </div>
        </motion.div>

        {/* Report Type Selection */}
        <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
          {reportTypes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedReport(id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                selectedReport === id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'glass-card hover:bg-accent/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </motion.div>

        {/* Date Range Filter */}
        <motion.div variants={staggerItem} className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <div className="flex gap-2">
            {['1m', '3m', '6m', '12m', 'YTD', 'ALL'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Report Content */}
        <motion.div
          key={selectedReport}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {selectedReport === 'portfolio' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Asset Allocation</h3>
                  <AnimatedPieChart
                    data={allocationData}
                    centerLabel="Total"
                    centerValue={`$${(mockPortfolioSummary.total_value / 1000).toFixed(0)}K`}
                  />
                </div>
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Allocation Breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(mockPortfolioSummary.asset_allocation).map(([category, percentage], index) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: allocationData[index]?.color }}
                          />
                          <span>{category}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{percentage}%</p>
                          <p className="text-sm text-muted-foreground">
                            ${((mockPortfolioSummary.total_value * percentage) / 100).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Portfolio Summary</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Value', value: `$${mockPortfolioSummary.total_value.toLocaleString()}` },
                    { label: 'Total Gain', value: `$${mockPortfolioSummary.total_gain_loss.toLocaleString()}` },
                    { label: 'Return', value: `${mockPortfolioSummary.gain_loss_percentage.toFixed(1)}%` },
                    { label: 'Invested', value: `$${mockPortfolioSummary.total_invested.toLocaleString()}` },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-xl font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedReport === 'performance' && (
            <>
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
                <AnimatedLineChart data={performanceData} showBenchmark showArea height={400} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Return', value: '+18.5%', color: 'text-emerald-400' },
                  { label: 'vs Benchmark', value: '+3.2%', color: 'text-primary' },
                  { label: 'Volatility', value: '12.4%', color: 'text-muted-foreground' },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card p-4 text-center">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedReport === 'goals' && (
            <>
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">Goals Progress</h3>
                <AnimatedBarChart data={goalsData} showTarget height={350} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'On Track', value: mockGoals.filter(g => g.status === 'on_track').length, total: mockGoals.length },
                  { label: 'At Risk', value: mockGoals.filter(g => g.status === 'at_risk').length, total: mockGoals.length },
                  { label: 'Behind', value: mockGoals.filter(g => g.status === 'behind').length, total: mockGoals.length },
                ].map((stat) => (
                  <div key={stat.label} className="glass-card p-4 text-center">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value} <span className="text-base text-muted-foreground">/ {stat.total}</span></p>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Reports;
