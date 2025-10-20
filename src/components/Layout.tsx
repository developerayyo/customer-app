import { Fragment, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  HomeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  NewspaperIcon,
  TagIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import useAuthStore from '../store/useAuthStore';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
  { name: 'Complaints', href: '/complaints', icon: ChatBubbleLeftRightIcon },
  { name: 'News', href: '/news', icon: NewspaperIcon },
  { name: 'Price List', href: '/price-list', icon: TagIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="h-full bg-[var(--color-gray-50)]">
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <Logo size={28} className="mr-2" />
                    <h1 className="text-xl font-bold text-gray-900">LMT Customer Portal</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={`
                                  group flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 transition-colors
                                  ${location.pathname === item.href
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                  }
                                `}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <item.icon
                                  className={`h-6 w-6 shrink-0 transition-colors ${
                                    location.pathname === item.href ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                                  }`}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li className="mt-auto">
                        <button
                          onClick={handleLogout}
                          className="group -mx-2 flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <span className="truncate">Logout</span>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Logo size={28} className="mr-2" />
            <h1 className="text-xl font-bold text-gray-900">LMT Customer Portal</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`
                          group flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 transition-colors
                          ${location.pathname === item.href
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                          }
                        `}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 transition-colors ${
                            location.pathname === item.href ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className="group -mx-2 flex gap-x-3 rounded-lg p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="truncate">Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/90 backdrop-blur px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden rounded-md hover:bg-blue-50 hover:text-blue-700"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center">
              <Logo size={28} className="mr-2" />
              <span className="font-semibold text-gray-900 hidden sm:inline">LMT Customer Portal</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:text-sm lg:font-semibold lg:leading-6 lg:text-gray-900">
                {user}
              </div>
            </div>
          </div>
        </div>

        <main className="py-10 pb-20 lg:pb-0">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="tabbar lg:hidden">
          <ul className="tabbar-list">
            <li>
              <Link
                to="/"
                className={`tabbar-item ${location.pathname === '/' ? 'tabbar-item-active' : ''}`}
              >
                <HomeIcon className="h-6 w-6" />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <Link
                to="/orders"
                className={`tabbar-item ${location.pathname.startsWith('/orders') ? 'tabbar-item-active' : ''}`}
              >
                <ShoppingCartIcon className="h-6 w-6" />
                <span>Orders</span>
              </Link>
            </li>
            <li>
              <Link
                to="/invoices"
                className={`tabbar-item ${location.pathname.startsWith('/invoices') ? 'tabbar-item-active' : ''}`}
              >
                <DocumentTextIcon className="h-6 w-6" />
                <span>Invoices</span>
              </Link>
            </li>
            <li>
              <Link
                to="/payments"
                className={`tabbar-item ${location.pathname.startsWith('/payments') ? 'tabbar-item-active' : ''}`}
              >
                <CreditCardIcon className="h-6 w-6" />
                <span>Payments</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}