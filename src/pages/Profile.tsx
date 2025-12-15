import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Bell, Palette, Save, Camera } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassButton from '@/components/ui/GlassButton';
import GlassInput from '@/components/ui/GlassInput';
import { useAuth } from '@/contexts/AuthContext';
import { mockUserProfile } from '@/services/mockData';
import { staggerContainer, staggerItem } from '@/components/layout/PageTransition';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: mockUserProfile.phone || '',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    goalReminders: true,
    weeklyReport: false,
    marketUpdates: true,
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

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
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div variants={staggerItem} className="glass-card p-4 h-fit">
            <div className="flex flex-col items-center mb-6 pt-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-gold flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
              <h3 className="font-semibold mt-3">{user?.first_name} {user?.last_name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>

            <nav className="space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </motion.div>

          {/* Content */}
          <motion.div variants={staggerItem} className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-6"
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassInput
                      label="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                      leftIcon={<User className="w-4 h-4" />}
                    />
                    <GlassInput
                      label="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                      leftIcon={<User className="w-4 h-4" />}
                    />
                    <GlassInput
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                    <GlassInput
                      label="Phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      leftIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>

                  <div className="pt-4">
                    <h3 className="font-medium mb-4">Investment Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="glass-card p-4">
                        <p className="text-sm text-muted-foreground">Risk Profile</p>
                        <p className="text-lg font-semibold capitalize">{mockUserProfile.risk_profile?.risk_tolerance}</p>
                      </div>
                      <div className="glass-card p-4">
                        <p className="text-sm text-muted-foreground">Experience Level</p>
                        <p className="text-lg font-semibold capitalize">{mockUserProfile.investment_experience}</p>
                      </div>
                    </div>
                  </div>

                  <GlassButton
                    onClick={handleSave}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Changes
                  </GlassButton>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Security Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Password</h3>
                          <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                        </div>
                        <GlassButton variant="secondary" size="sm">Change</GlassButton>
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Two-Factor Authentication</h3>
                          <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                        </div>
                        <GlassButton variant="secondary" size="sm">Enable</GlassButton>
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Active Sessions</h3>
                          <p className="text-sm text-muted-foreground">Manage your active sessions</p>
                        </div>
                        <GlassButton variant="secondary" size="sm">View All</GlassButton>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive important updates via email' },
                      { key: 'goalReminders', label: 'Goal Reminders', description: 'Get notified about goal progress' },
                      { key: 'weeklyReport', label: 'Weekly Report', description: 'Receive a weekly portfolio summary' },
                      { key: 'marketUpdates', label: 'Market Updates', description: 'Stay informed about market changes' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="glass-card p-4 flex items-center justify-between">
                        <div>
                          <Label htmlFor={key} className="font-medium">{label}</Label>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                        <Switch
                          id={key}
                          checked={notifications[key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications(p => ({ ...p, [key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>

                  <GlassButton
                    onClick={handleSave}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Preferences
                  </GlassButton>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">App Preferences</h2>
                  
                  <div className="space-y-4">
                    <div className="glass-card p-4">
                      <h3 className="font-medium mb-3">Theme</h3>
                      <div className="flex gap-3">
                        {['dark', 'light', 'system'].map((theme) => (
                          <button
                            key={theme}
                            className="px-4 py-2 rounded-lg capitalize glass-card hover:bg-accent/50 transition-all"
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <h3 className="font-medium mb-3">Currency</h3>
                      <select className="w-full bg-card border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>

                    <div className="glass-card p-4">
                      <h3 className="font-medium mb-3">Date Format</h3>
                      <select className="w-full bg-card border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  <GlassButton
                    onClick={handleSave}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Preferences
                  </GlassButton>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Profile;
