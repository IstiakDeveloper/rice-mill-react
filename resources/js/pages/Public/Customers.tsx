import { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { toBengaliDigits, formatCurrency } from '@/utils';
import {
    Search,
    MapPin,
    X,
    TrendingUp,
    TrendingDown,
    Minus,
    Package,
    Banknote,
    Users,
    AlertCircle,
    Filter,
    Grid,
    List,
    LogIn
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    area: string;
    phone_number: string;
    image?: string;
    total_sacks: number;
    total_sales: number;
    total_payments: number;
    remaining_balance: number;
    due_amount: number;
    advance_payment: number;
    last_transaction_date?: string;
    last_payment_date?: string;
    payment_status: 'settled' | 'due' | 'advance';
    transaction_count: number;
    payment_count: number;
}

interface Season {
    id: number;
    name: string;
}

interface Summary {
    total_customers: number;
    total_due_amount: number;
    total_sacks: number;
    total_sales: number;
    customers_with_due: number;
}

interface PublicCustomersProps {
    customers: Customer[];
    seasons: Season[];
    currentSeason?: Season;
    areas: string[];
    summary: Summary;
}

export default function PublicCustomers({
    customers,
    seasons,
    currentSeason,
    areas,
    summary
}: PublicCustomersProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedSeason, setSelectedSeason] = useState<number | null>(currentSeason?.id || null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filter customers based on search query and selected area
    const filteredCustomers = useMemo(() => {
        return customers.filter(customer => {
            const matchesSearch = searchQuery === '' ||
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.phone_number.includes(searchQuery) ||
                customer.area.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesArea = selectedArea === '' || customer.area === selectedArea;

            return matchesSearch && matchesArea;
        });
    }, [customers, searchQuery, selectedArea]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedArea('');
    };

    function getStatusBadge(status: string) {
        switch (status) {
            case 'due':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Due
                    </span>
                );
            case 'advance':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Advance
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Minus className="w-3 h-3 mr-1" />
                        Settled
                    </span>
                );
        }
    }

    function handleSeasonChange(seasonId: string) {
        const newSeasonId = seasonId ? parseInt(seasonId) : null;
        setSelectedSeason(newSeasonId);

        // Redirect to the same page with new season parameter
        const url = new URL(window.location.href);
        if (newSeasonId) {
            url.searchParams.set('season_id', newSeasonId.toString());
        } else {
            url.searchParams.delete('season_id');
        }
        window.location.href = url.toString();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Customer Information" />

            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Customer Information</h1>
                            <p className="text-gray-600 mt-1">
                                {currentSeason && (
                                    <span className="text-blue-600 font-medium">
                                        {currentSeason.name} Season
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Login Button */}
                            <Link
                                href={route('login')}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Login
                            </Link>

                            {/* Season Selector */}
                            <select
                                value={selectedSeason || ''}
                                onChange={(e) => handleSeasonChange(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Seasons</option>
                                {seasons.map((season) => (
                                    <option key={season.id} value={season.id}>
                                        {season.name}
                                    </option>
                                ))}
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'grid'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {toBengaliDigits(summary.total_customers.toString())}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-red-100">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Due Customers</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {toBengaliDigits(summary.customers_with_due.toString())}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-orange-100">
                                <Banknote className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Due</p>
                                <p className="text-xl font-bold text-orange-600">
                                    {formatCurrency(summary.total_due_amount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100">
                                <Package className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Sacks</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {toBengaliDigits(summary.total_sacks.toString())}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-purple-100">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(summary.total_sales)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search customers by name, phone, or area..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                            />
                        </div>

                        {/* Area Filter */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MapPin className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                value={selectedArea}
                                onChange={(e) => setSelectedArea(e.target.value)}
                                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px]"
                            >
                                <option value="">All Areas</option>
                                {areas.map((area) => (
                                    <option key={area} value={area}>
                                        {area}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {(searchQuery || selectedArea) && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Filter Results Summary */}
                    {(searchQuery || selectedArea) && (
                        <div className="mt-3 text-sm text-gray-600">
                            Showing {toBengaliDigits(filteredCustomers.length.toString())} of {toBengaliDigits(customers.length.toString())} customers
                            {searchQuery && <span> matching "{searchQuery}"</span>}
                            {selectedArea && <span> in {selectedArea}</span>}
                        </div>
                    )}
                </div>

                {/* Customers Grid/List */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCustomers.length === 0 ? (
                            <div className="col-span-full text-center py-12">
                                <div className="text-gray-500">
                                    {searchQuery || selectedArea ? (
                                        <>
                                            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium mb-2">No customers found</p>
                                            <p className="text-sm">Try adjusting your search or filters</p>
                                        </>
                                    ) : (
                                        <>
                                            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium mb-2">No customers found</p>
                                            <p className="text-sm">No customer data available for this season</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="p-6">
                                        {/* Customer Header */}
                                        <div className="flex items-center mb-4">
                                            {customer.image ? (
                                                <img
                                                    src={`/storage/${customer.image}`}
                                                    alt={customer.name}
                                                    className="h-12 w-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-500 font-medium text-lg">
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="ml-3 flex-1">
                                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                                    {customer.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{customer.area}</p>
                                            </div>
                                            {getStatusBadge(customer.payment_status)}
                                        </div>

                                        {/* Customer Stats */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Phone:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {toBengaliDigits(customer.phone_number)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Total Sacks:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {toBengaliDigits(customer.total_sacks.toString())}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Total Sales:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(customer.total_sales)}
                                                </span>
                                            </div>

                                            {customer.due_amount > 0 && (
                                                <div className="flex justify-between items-center border-t pt-3">
                                                    <span className="text-sm font-medium text-red-600">Due Amount:</span>
                                                    <span className="text-sm font-bold text-red-600">
                                                        {formatCurrency(customer.due_amount)}
                                                    </span>
                                                </div>
                                            )}

                                            {customer.advance_payment > 0 && (
                                                <div className="flex justify-between items-center border-t pt-3">
                                                    <span className="text-sm font-medium text-green-600">Advance:</span>
                                                    <span className="text-sm font-bold text-green-600">
                                                        {formatCurrency(customer.advance_payment)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* List View */
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Sacks
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Sales
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Due Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center">
                                                <div className="text-gray-500">
                                                    {searchQuery || selectedArea ? (
                                                        <>
                                                            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                            <p className="text-lg font-medium mb-2">No customers found</p>
                                                            <p className="text-sm">Try adjusting your search or filters</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                            <p className="text-lg font-medium mb-2">No customers found</p>
                                                            <p className="text-sm">No customer data available for this season</p>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {customer.image ? (
                                                            <img
                                                                src={`/storage/${customer.image}`}
                                                                alt={customer.name}
                                                                className="h-10 w-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <span className="text-gray-500 font-medium">
                                                                    {customer.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {customer.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {customer.area}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {toBengaliDigits(customer.phone_number)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="font-medium">
                                                        {toBengaliDigits(customer.total_sacks.toString())}
                                                    </span>
                                                    <div className="text-xs text-gray-500">
                                                        {toBengaliDigits(customer.transaction_count.toString())} transactions
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(customer.total_sales)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {customer.due_amount > 0 ? (
                                                        <span className="font-medium text-red-600">
                                                            {formatCurrency(customer.due_amount)}
                                                        </span>
                                                    ) : customer.advance_payment > 0 ? (
                                                        <span className="font-medium text-green-600">
                                                            Advance: {formatCurrency(customer.advance_payment)}
                                                        </span>
                                                    ) : (
                                                        <span className="font-medium text-gray-900">
                                                            {formatCurrency(0)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(customer.payment_status)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
