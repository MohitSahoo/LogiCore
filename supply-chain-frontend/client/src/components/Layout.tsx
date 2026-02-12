import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Package2,
  Home,
  User,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Package, label: 'Products', href: '/products' },
    { icon: Users, label: 'Suppliers', href: '/suppliers' },
    { icon: ShoppingCart, label: 'Orders', href: '/orders' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
  ];

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className="p-2 bg-primary rounded-lg">
              <Package2 className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && <span className="font-bold text-foreground">Supply Chain</span>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-orange-50 hover:text-primary transition-colors"
              title={!sidebarOpen ? item.label : ''}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors">
                <User className="w-5 h-5 text-primary flex-shrink-0" />
                {sidebarOpen && (
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setLocation('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
