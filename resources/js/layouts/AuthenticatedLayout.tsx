import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { User } from '@/types';

interface Props {
  user: User;
  header?: React.ReactNode;
  children: React.ReactNode;
}

export default function Authenticated({ user, header, children }: Props) {
  const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-green-800 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="shrink-0 flex items-center">
                <Link href="/dashboard">
                  <h1 className="font-bold text-xl text-white">ধান মিল হিসাব</h1>
                </Link>
              </div>

              <div className="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                <NavLink href={route('dashboard')} active={route().current('dashboard')}>
                  ড্যাশবোর্ড
                </NavLink>
                <NavLink href={route('customers.index')} active={route().current('customers.*')}>
                  গ্রাহক
                </NavLink>
                <NavLink href={route('transactions.index')} active={route().current('transactions.*')}>
                  লেনদেন
                </NavLink>
                <NavLink href={route('payments.index')} active={route().current('payments.*')}>
                  পেমেন্ট
                </NavLink>
                <NavLink href={route('sack-types.index')} active={route().current('sack-types.*')}>
                  বস্তার ধরন
                </NavLink>
                <div className="hidden sm:flex sm:items-center">
                  <div className="relative ml-3">
                    <Dropdown>
                      <Dropdown.Trigger>
                        <span className="inline-flex rounded-md">
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white hover:text-gray-200 focus:outline-none transition ease-in-out duration-150"
                          >
                            রিপোর্ট
                            <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      </Dropdown.Trigger>

                      <Dropdown.Content>
                        <Dropdown.Link href={route('reports.daily')}>দৈনিক রিপোর্ট</Dropdown.Link>
                        <Dropdown.Link href={route('reports.season')}>সিজন রিপোর্ট</Dropdown.Link>
                        <Dropdown.Link href={route('reports.customer')}>গ্রাহক রিপোর্ট</Dropdown.Link>
                      </Dropdown.Content>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex sm:items-center sm:ml-6">
              <div className="ml-3 relative">
                <Dropdown>
                  <Dropdown.Trigger>
                    <span className="inline-flex rounded-md">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white hover:text-gray-200 focus:outline-none transition ease-in-out duration-150"
                      >
                        {user?.name}
                        <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  </Dropdown.Trigger>

                  <Dropdown.Content>
                    <Dropdown.Link href={route('profile.edit')}>প্রোফাইল</Dropdown.Link>
                    <Dropdown.Link href={route('logout')} method="post" as="button">
                      লগআউট
                    </Dropdown.Link>
                  </Dropdown.Content>
                </Dropdown>
              </div>
            </div>

            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setShowingNavigationDropdown((previousState) => !previousState)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:text-gray-200 transition duration-150 ease-in-out"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path
                    className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                  <path
                    className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={(showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden'}>
          <div className="pt-2 pb-3 space-y-1">
            <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
              ড্যাশবোর্ড
            </ResponsiveNavLink>
            <ResponsiveNavLink href={route('customers.index')} active={route().current('customers.*')}>
              গ্রাহক
            </ResponsiveNavLink>
            <ResponsiveNavLink href={route('transactions.index')} active={route().current('transactions.*')}>
              লেনদেন
            </ResponsiveNavLink>
            <ResponsiveNavLink href={route('payments.index')} active={route().current('payments.*')}>
              পেমেন্ট
            </ResponsiveNavLink>
            <ResponsiveNavLink href={route('sack-types.index')} active={route().current('sack-types.*')}>
              বস্তার ধরন
            </ResponsiveNavLink>
            <div className="pt-2 pb-1 border-t border-gray-200">
              <div className="px-4">
                <div className="font-medium text-base text-white">রিপোর্ট</div>
              </div>
              <div className="mt-3 space-y-1">
                <ResponsiveNavLink href={route('reports.daily')}>
                  দৈনিক রিপোর্ট
                </ResponsiveNavLink>
                <ResponsiveNavLink href={route('reports.season')}>
                  সিজন রিপোর্ট
                </ResponsiveNavLink>
                <ResponsiveNavLink href={route('reports.customer')}>
                  গ্রাহক রিপোর্ট
                </ResponsiveNavLink>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-1 border-t border-gray-200">
            <div className="px-4">
              <div className="font-medium text-base text-white">{user?.name}</div>
              <div className="font-medium text-sm text-gray-200">{user?.email}</div>
            </div>

            <div className="mt-3 space-y-1">
              <ResponsiveNavLink href={route('profile.edit')}>প্রোফাইল</ResponsiveNavLink>
              <ResponsiveNavLink method="post" href={route('logout')} as="button">
                লগআউট
              </ResponsiveNavLink>
            </div>
          </div>
        </div>
      </nav>

      {header && (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{header}</div>
        </header>
      )}

      <main>{children}</main>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'inline-flex items-center px-1 pt-1 border-b-2 border-white text-sm font-medium leading-5 text-white focus:outline-none focus:border-white transition duration-150 ease-in-out'
          : 'inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium leading-5 text-gray-200 hover:text-white hover:border-gray-300 focus:outline-none focus:text-white focus:border-gray-300 transition duration-150 ease-in-out'
      }
    >
      {children}
    </Link>
  );
}

interface ResponsiveNavLinkProps {
  method?: string;
  as?: string;
  href: string;
  active?: boolean;
  children: React.ReactNode;
}

function ResponsiveNavLink({ method = 'get', as = 'a', href, active = false, children }: ResponsiveNavLinkProps) {
  return (
    <Link
      method={method}
      as={as}
      href={href}
      className={`block pl-3 pr-4 py-2 border-l-4 ${
        active
          ? 'border-white text-white bg-green-700 focus:outline-none focus:text-white focus:bg-green-700 focus:border-white'
          : 'border-transparent text-gray-200 hover:text-white hover:bg-green-700 hover:border-gray-300 focus:outline-none focus:text-white focus:bg-green-700 focus:border-gray-300'
      } text-base font-medium focus:outline-none transition duration-150 ease-in-out`}
    >
      {children}
    </Link>
  );
}

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
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter}>
      {children}
    </div>
  );
};

interface DropdownContentProps {
  children: React.ReactNode;
  open?: boolean;
}

Dropdown.Content = function DropdownContent({ children, open = false }: DropdownContentProps) {
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
      <div className="absolute z-50 mt-2 w-48 rounded-md shadow-lg origin-top-right right-0">
        <div className="rounded-md ring-1 ring-black ring-opacity-5 py-1 bg-white">
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
}

Dropdown.Link = function DropdownLink({ href, method = 'get', as = 'a', children }: DropdownLinkProps) {
  return (
    <Link
      href={href}
      method={method}
      as={as}
      className="block w-full px-4 py-2 text-left text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out"
    >
      {children}
    </Link>
  );
};
