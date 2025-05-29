import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { toBengaliDigits, formatCurrency } from '@/utils';
import {
    ArrowLeft,
    Edit2,
    Phone,
    MapPin,
    Calendar,
    Package,
    Banknote,
    TrendingUp,
    TrendingDown,
    FileText,
    User,
    DollarSign
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    area: string;
    phone_number: string;
    image?: string;
    transactions: Transaction[];
    payments: Payment[];
    customer_balances: CustomerBalance[];
}

interface Transaction {
    id: number;
    transaction_date: string;
    total_amount: number;
    payment_status: string;
    notes?: string;
    season: Season;
    transaction_items: TransactionItem[];
}

interface TransactionItem {
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    sack_type: SackType;
}

interface Payment {
    id: number;
    payment_date: string;
    amount: number;
    notes?: string;
    season: Season;
}

interface CustomerBalance {
    season_id: number;
    total_sales: number;
    total_payments: number;
    balance: number;
    advance_payment: number;
    last_transaction_date?: string;
    last_payment_date?: string;
    season: Season;
}

interface Season {
    id: number;
    name: string;
}

interface SackType {
    id: number;
    name: string;
    price: number;
}

interface CustomerShowProps extends PageProps {
    customer: Customer;
    seasons: Season[];
    currentSeason?: Season;
    seasonSummary: any[];
}

export default function Show({ auth, customer, seasons, currentSeason, seasonSummary }: CustomerShowProps) {
    const totalSacks = customer.transactions.flatMap(transaction =>
        transaction.transaction_items
    ).reduce((sum, item) => sum + Number(item.quantity), 0);

    const overallBalance = customer.customer_balances.reduce((sum, balance) => sum + balance.balance, 0);
    const overallSales = customer.customer_balances.reduce((sum, balance) => sum + balance.total_sales, 0);
    const overallPayments = customer.customer_balances.reduce((sum, balance) => sum + balance.total_payments, 0);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route('customers.index')}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Customer Details
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title={`Customer - ${customer.name}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Customer Header */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                            <div className="flex items-center space-x-4 mb-4 md:mb-0">
                                {customer.image ? (
                                    <img
                                        src={`/storage/${customer.image}`}
                                        alt={customer.name}
                                        className="h-16 w-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User className="w-8 h-8 text-gray-500" />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            {customer.area}
                                        </div>
                                        <div className="flex items-center">
                                            <Phone className="w-4 h-4 mr-1" />
                                            {toBengaliDigits(customer.phone_number)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href={route('customers.edit', customer.id)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Customer
                            </Link>
                        </div>
                    </div>

                    {/* Overall Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Sacks</p>
                                    <p className="text-2xl font-bold text-gray-900">{toBengaliDigits(totalSacks.toString())}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(overallSales)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-purple-100">
                                    <Banknote className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(overallPayments)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className={`p-3 rounded-full ${overallBalance >= 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                                    {overallBalance >= 0 ? (
                                        <TrendingDown className="w-6 h-6 text-red-600" />
                                    ) : (
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    )}
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Current Balance</p>
                                    <p className={`text-2xl font-bold ${overallBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatCurrency(Math.abs(overallBalance))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Season-wise Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Summary</h3>
                            <div className="space-y-4">
                                {seasonSummary.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No transactions yet</p>
                                ) : (
                                    seasonSummary.map((summary) => (
                                        <div key={summary.season_id} className="border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-2">{summary.season_name}</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Sales</p>
                                                    <p className="font-medium">{formatCurrency(summary.total_sales)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Payments</p>
                                                    <p className="font-medium">{formatCurrency(summary.total_payments)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Balance</p>
                                                    <p className={`font-medium ${summary.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {formatCurrency(Math.abs(summary.balance))}
                                                    </p>
                                                </div>
                                                {summary.advance_payment > 0 && (
                                                    <div>
                                                        <p className="text-gray-600">Advance</p>
                                                        <p className="font-medium text-green-600">{formatCurrency(summary.advance_payment)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {[...customer.transactions, ...customer.payments]
                                    .sort((a, b) => {
                                        const dateA = new Date('transaction_date' in a ? a.transaction_date : a.payment_date);
                                        const dateB = new Date('transaction_date' in b ? b.transaction_date : b.payment_date);
                                        return dateB.getTime() - dateA.getTime();
                                    })
                                    .slice(0, 10)
                                    .map((activity, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                {'transaction_date' in activity ? (
                                                    <div className="p-2 bg-blue-100 rounded-full">
                                                        <Package className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-green-100 rounded-full">
                                                        <Banknote className="w-4 h-4 text-green-600" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {'transaction_date' in activity ? 'Sale Transaction' : 'Payment'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date('transaction_date' in activity ? activity.transaction_date : activity.payment_date).toLocaleDateString()}
                                                        {' • '}
                                                        {activity.season.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-medium ${'transaction_date' in activity ? 'text-blue-600' : 'text-green-600'
                                                    }`}>
                                                    {formatCurrency('transaction_date' in activity ? activity.total_amount : activity.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Transactions */}
                    <div className="bg-white rounded-lg shadow-sm mt-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Season</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customer.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        customer.transactions.map((transaction) => (
                                            <tr key={transaction.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(transaction.transaction_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {transaction.season.name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {transaction.transaction_items.map((item, index) => (
                                                        <div key={index} className="mb-1">
                                                            {item.sack_type.name}: {toBengaliDigits(item.quantity.toString())} sacks
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(transaction.total_amount)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${transaction.payment_status === 'paid'
                                                            ? 'bg-green-100 text-green-800'
                                                            : transaction.payment_status === 'partial'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {transaction.payment_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {transaction.notes || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white rounded-lg shadow-sm mt-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Season</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customer.payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No payments found
                                            </td>
                                        </tr>
                                    ) : (
                                        customer.payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(payment.payment_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {payment.season.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                    {formatCurrency(payment.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {payment.notes || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
