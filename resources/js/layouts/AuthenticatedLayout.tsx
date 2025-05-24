import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import {
    ChevronDown,
    LayoutDashboard,
    Users,
    ArrowLeftRight,
    CreditCard,
    Package,
    TrendingUp,
    TrendingDown,
    PlusCircle,
    Tag,
    FileText,
    CalendarDays,
    Layers,
    UserCheck,
    Banknote,
    User as UserIcon,
    Settings,
    LogOut,
    Building2,
    Menu,
    X
} from 'lucide-react';
import { User } from '@/types';

interface Props {
    user: User;
    header?: React.ReactNode;
    children: React.ReactNode;
}

export default function Authenticated({ user, header, children }: Props) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const { auth } = usePage().props as any;
    const currentUser = user || auth?.user;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Left side - Logo and Main Navigation */}
                        <div className="flex">
                            <div className="shrink-0 flex items-center">
                                <Link href="/dashboard" className="flex items-center group">
                                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-2.5 rounded-xl mr-3 shadow-md group-hover:shadow-lg transition-all duration-200">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-xl text-gray-800 group-hover:text-green-600 transition-colors">Rice Mill Pro</h1>
                                        <p className="text-xs text-gray-500 -mt-1">Management System</p>
                                    </div>
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex lg:space-x-1 lg:ml-10 items-center">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')} icon={LayoutDashboard}>
                                    Dashboard
                                </NavLink>

                                <NavLink href={route('customers.index')} active={route().current('customers.*')} icon={Users}>
                                    Customers
                                </NavLink>

                                {/* Operations Dropdown */}
                                <div className="relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <NavButton
                                                active={route().current('transactions.*') || route().current('payments.*') || route().current('sack-types.*')}
                                                icon={ArrowLeftRight}
                                                className="flex items-center"
                                            >
                                                Operations
                                                <ChevronDown className="ml-1 h-4 w-4" />
                                            </NavButton>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                            <Dropdown.Link href={route('transactions.index')} icon={ArrowLeftRight}>
                                                Transactions
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('payments.index')} icon={CreditCard}>
                                                Payments
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('sack-types.index')} icon={Package}>
                                                Sack Types
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>

                                {/* Finance Dropdown */}
                                <div className="relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <NavButton
                                                active={route().current('funds.*') || route().current('expenses.*') || route().current('additional-incomes.*') || route().current('expense-categories.*')}
                                                icon={TrendingUp}
                                                className="flex items-center"
                                            >
                                                Finance
                                                <ChevronDown className="ml-1 h-4 w-4" />
                                            </NavButton>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                            <Dropdown.Link href={route('funds.index')} icon={PlusCircle}>
                                                Fund Input
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('expenses.index')} icon={TrendingDown}>
                                                Expenses
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('additional-incomes.index')} icon={TrendingUp}>
                                                Additional Income
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('expense-categories.index')} icon={Tag}>
                                                Categories
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>

                                {/* Reports Dropdown */}
                                <div className="relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <NavButton
                                                active={route().current('reports.*') || route().current('cash-report.*')}
                                                icon={FileText}
                                                className="flex items-center"
                                            >
                                                Reports
                                                <ChevronDown className="ml-1 h-4 w-4" />
                                            </NavButton>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                            <Dropdown.Link href={route('reports.daily')} icon={CalendarDays}>
                                                Daily Report
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('reports.season')} icon={Layers}>
                                                Season Report
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('reports.customer')} icon={UserCheck}>
                                                Customer Report
                                            </Dropdown.Link>
                                            <Dropdown.Link href={route('reports.cash-report.index')} icon={Banknote}>
                                                Cash Report
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>

                        {/* Right side - User Menu */}
                        <div className="hidden sm:flex sm:items-center sm:ml-6">
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center max-w-xs bg-white rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 hover:bg-gray-50 transition-all duration-200 border border-gray-200">
                                            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="ml-3 text-left min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {currentUser?.name || 'User'}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {currentUser?.email || 'user@example.com'}
                                                </div>
                                            </div>
                                            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                                        </button>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content align="right" className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'User'}</p>
                                            <p className="text-sm text-gray-500 truncate">{currentUser?.email || 'user@example.com'}</p>
                                        </div>
                                        <Dropdown.Link href={route('profile.edit')} icon={Settings}>
                                            Profile Settings
                                        </Dropdown.Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <Dropdown.Link href={route('logout')} method="post" as="button" icon={LogOut}>
                                            Sign out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown(!showingNavigationDropdown)}
                                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                            >
                                {showingNavigationDropdown ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <Transition
                    show={showingNavigationDropdown}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <div className="sm:hidden bg-white border-t border-gray-200 shadow-lg">
                        <div className="pt-2 pb-3 space-y-1">
                            <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')} icon={LayoutDashboard}>
                                Dashboard
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('customers.index')} active={route().current('customers.*')} icon={Users}>
                                Customers
                            </ResponsiveNavLink>

                            {/* Mobile Operations Section */}
                            <div className="px-4 py-3 bg-gray-50">
                                <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                                    Operations
                                </div>
                            </div>
                            <ResponsiveNavLink href={route('transactions.index')} active={route().current('transactions.*')} icon={ArrowLeftRight} isSubItem>
                                Transactions
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('payments.index')} active={route().current('payments.*')} icon={CreditCard} isSubItem>
                                Payments
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('sack-types.index')} active={route().current('sack-types.*')} icon={Package} isSubItem>
                                Sack Types
                            </ResponsiveNavLink>

                            {/* Mobile Finance Section */}
                            <div className="px-4 py-3 bg-gray-50">
                                <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Finance
                                </div>
                            </div>
                            <ResponsiveNavLink href={route('funds.index')} active={route().current('funds.*')} icon={PlusCircle} isSubItem>
                                Fund Input
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('expenses.index')} active={route().current('expenses.*')} icon={TrendingDown} isSubItem>
                                Expenses
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('additional-incomes.index')} active={route().current('additional-incomes.*')} icon={TrendingUp} isSubItem>
                                Additional Income
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('expense-categories.index')} active={route().current('expense-categories.*')} icon={Tag} isSubItem>
                                Categories
                            </ResponsiveNavLink>

                            {/* Mobile Reports Section */}
                            <div className="px-4 py-3 bg-gray-50">
                                <div className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Reports
                                </div>
                            </div>
                            <ResponsiveNavLink href={route('reports.daily')} active={route().current('reports.daily')} icon={CalendarDays} isSubItem>
                                Daily Report
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('reports.season')} active={route().current('reports.season')} icon={Layers} isSubItem>
                                Season Report
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('reports.customer')} active={route().current('reports.customer')} icon={UserCheck} isSubItem>
                                Customer Report
                            </ResponsiveNavLink>
                            <ResponsiveNavLink href={route('reports.cash-report.index')} active={route().current('cash-report.*')} icon={Banknote} isSubItem>
                                Cash Report
                            </ResponsiveNavLink>
                        </div>

                        {/* Mobile User Section */}
                        <div className="pt-4 pb-1 border-t border-gray-200 bg-gray-50">
                            <div className="px-4 flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center text-white font-semibold">
                                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="ml-3 min-w-0 flex-1">
                                    <div className="font-medium text-base text-gray-800 truncate">{currentUser?.name || 'User'}</div>
                                    <div className="font-medium text-sm text-gray-500 truncate">{currentUser?.email || 'user@example.com'}</div>
                                </div>
                            </div>

                            <div className="mt-3 space-y-1">
                                <ResponsiveNavLink href={route('profile.edit')} icon={Settings}>
                                    Profile Settings
                                </ResponsiveNavLink>
                                <ResponsiveNavLink method="post" href={route('logout')} as="button" icon={LogOut}>
                                    Sign out
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                </Transition>
            </nav>

            {header && (
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{header}</div>
                </header>
            )}

            <main className="py-6">{children}</main>
        </div>
    );
}

// Component Helper Functions
interface NavLinkProps {
    href: string;
    active: boolean;
    children: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
}

function NavLink({ href, active, children, icon: Icon }: NavLinkProps) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? 'bg-green-100 text-green-800 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
        >
            <Icon className="w-4 h-4 mr-2" />
            {children}
        </Link>
    );
}

interface NavButtonProps {
    active: boolean;
    children: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
}

function NavButton({ active, children, icon: Icon }: NavButtonProps) {
    return (
        <button
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? 'bg-green-100 text-green-800 shadow-sm border border-green-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
        >
            <Icon className="w-4 h-4 mr-2" />
            {children}
        </button>
    );
}

interface ResponsiveNavLinkProps {
    method?: string;
    as?: string;
    href: string;
    active?: boolean;
    children: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    isSubItem?: boolean;
}

function ResponsiveNavLink({ method = 'get', as = 'a', href, active = false, children, icon: Icon, isSubItem = false }: ResponsiveNavLinkProps) {
    return (
        <Link
            method={method}
            as={as}
            href={href}
            className={`flex items-center ${isSubItem ? 'pl-8 pr-4' : 'px-4'} py-3 text-base font-medium transition-all duration-200 ${active
                    ? 'bg-green-50 border-r-4 border-green-500 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
        >
            <Icon className="w-5 h-5 mr-3" />
            {children}
        </Link>
    );
}

// Dropdown Component
interface DropdownProps {
    children: React.ReactNode;
}

function Dropdown({ children }: DropdownProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative" onMouseLeave={() => setOpen(false)}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === Dropdown.Trigger) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        onClick: () => setOpen(!open),
                        onMouseEnter: () => setOpen(true),
                    });
                }

                if (React.isValidElement(child) && child.type === Dropdown.Content) {
                    return React.cloneElement(child as React.ReactElement<any>, {
                        open,
                        setOpen,
                    });
                }

                return child;
            })}
        </div>
    );
}

interface DropdownTriggerProps {
    children: React.ReactNode;
    onClick?: () => void;
    onMouseEnter?: () => void;
}

Dropdown.Trigger = function DropdownTrigger({ children, onClick, onMouseEnter }: DropdownTriggerProps) {
    return <div onClick={onClick} onMouseEnter={onMouseEnter}>{children}</div>;
};

interface DropdownContentProps {
    children: React.ReactNode;
    open?: boolean;
    setOpen?: (open: boolean) => void;
    align?: 'left' | 'right';
}

Dropdown.Content = function DropdownContent({ children, open = false, setOpen, align = 'left' }: DropdownContentProps) {
    return (
        <Transition
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
        >
            <div
                className={`absolute z-50 mt-1 w-56 rounded-xl shadow-lg bg-white border border-gray-200 focus:outline-none ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
                    }`}
                style={{ top: '100%' }}
                onMouseLeave={() => setOpen && setOpen(false)}
            >
                <div className="py-2">
                    {children}
                </div>
            </div>
        </Transition>
    );
};

interface DropdownLinkProps {
    href: string;
    method?: string;
    as?: string;
    children: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
}

Dropdown.Link = function DropdownLink({ href, method = 'get', as = 'a', children, icon: Icon }: DropdownLinkProps) {
    return (
        <Link
            href={href}
            method={method}
            as={as}
            className="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 mx-2 rounded-lg"
        >
            <Icon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-600" />
            {children}
        </Link>
    );
};
