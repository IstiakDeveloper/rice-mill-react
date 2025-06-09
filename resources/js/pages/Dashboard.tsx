import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PrimaryButton from '@/components/primaryButton';
import SecondaryButton from '@/components/secondaryButton';
import DangerButton from '@/components/dangerButton';
import Modal from '@/components/modal';
import InputLabel from '@/components/inputLabel';
import TextInput from '@/components/textInput';
import TextArea from '@/components/textArea';
import SelectInput from '@/components/selectInput';
import InputError from '@/components/inputError';
import { formatCurrency, formatDate } from '@/utils';
import CustomerSelect from '@/components/customerSelect';
import SearchableArea from '@/components/SearchableArea';
import { log } from 'console';

interface Customer {
    id: number;
    name: string;
    area: string;
    phone_number: string;
    total_due?: number;
    total_transactions?: number;
}

interface SackType {
    id: number;
    name: string;
    price: number;
}

interface Season {
    id: number;
    name: string;
}

interface Transaction {
    id: number;
    customer: Customer;
    season: Season;
    transaction_date: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: 'paid' | 'partial' | 'due';
    notes?: string;
}

interface Payment {
    id: number;
    customer: Customer;
    season: Season;
    payment_date: string;
    amount: number;
    notes?: string;
    received_by?: string;
}

interface MonthlyData {
    month: string;
    transactions: number;
    payments: number;
    expenses: number;
    profit: number;
}

interface DashboardProps extends PageProps {
    currentSeason: Season;
    seasons: Season[];

    todayTransactions: number;
    todayPayments: number;
    todayExpenses: number;
    seasonTransactions: number;
    seasonTotalQuantity: number;
    seasonPayments: number;
    totalCustomerDue: number;        // Updated from seasonDue
    totalCustomerAdvance: number;    // New field
    seasonExpenses: number;
    seasonFundInputs: number;
    seasonAdditionalIncomes: number;
    currentCashBalance: number;
    seasonProfit: number;
    recentTransactions: Transaction[];
    recentPayments: Payment[];
    customersWithDue: CustomerWithBalance[];      // Updated type
    customersWithAdvance: CustomerWithBalance[];  // New field
    topCustomers: CustomerWithBalance[];          // Updated type
    customers: Customer[];
    sackTypes: SackType[];
    monthlyData: MonthlyData[];
    existingAreas: string[]
}

interface CustomerWithBalance {
    id: number;
    customer: Customer;
    total_sales: number;
    total_payments: number;
    balance: number;
    advance_payment: number;
    last_transaction_date?: string;
    last_payment_date?: string;
}

interface TransactionItem {
    sack_type_id: number | string;
    quantity: number;      // This will now support decimals
    unit_price: number;
}

export default function Dashboard({
    auth,
    currentSeason,
    seasons,
    todayTransactions,
    todayPayments,
    todayExpenses,
    seasonTransactions,
    seasonPayments,
    totalCustomerDue,        // Updated field name
    seasonTotalQuantity,
    totalCustomerAdvance,    // New field
    seasonExpenses,
    seasonFundInputs,
    seasonAdditionalIncomes,
    currentCashBalance,
    seasonProfit,
    recentTransactions,
    recentPayments,
    customersWithDue,
    customersWithAdvance,    // New field
    topCustomers,
    customers,
    sackTypes,
    monthlyData,
    existingAreas
}: DashboardProps) {
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showSackTypeModal, setShowSackTypeModal] = useState(false);
    const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);

    const transactionForm = useForm({
        customer_id: '',
        season_id: currentSeason.id,
        transaction_date: new Date().toISOString().split('T')[0],
        paid_amount: 0,
        notes: '',
        items: [{ sack_type_id: sackTypes.length > 0 ? sackTypes[0].id : '', quantity: 1, unit_price: sackTypes.length > 0 ? sackTypes[0].price : 0 }] as TransactionItem[],
    });

    const paymentForm = useForm({
        customer_id: '',
        transaction_id: '',
        season_id: currentSeason.id,
        payment_date: new Date().toISOString().split('T')[0],
        amount: 0,
        notes: '',
        received_by: auth.user?.name || '',
    });

    const customerForm = useForm({
        name: '',
        area: '',
        phone_number: '',
        image: null as File | null,
    });

    const sackTypeForm = useForm({
        name: '',
        price: 0,
    });

    const seasonForm = useForm({
        season_id: currentSeason.id,
    });

    // console.log(seasonTransactions);
    // Initialize first item with first sack type
    useEffect(() => {
        if (sackTypes.length > 0 && !transactionForm.data.items[0].sack_type_id) {
            transactionForm.setData('items', [
                { sack_type_id: sackTypes[0].id, quantity: 1, unit_price: sackTypes[0].price }
            ]);
        }
    }, [sackTypes]);

    const addTransactionItem = () => {
        const defaultSackType = sackTypes.length > 0 ? sackTypes[0] : null;
        transactionForm.setData('items', [
            ...transactionForm.data.items,
            {
                sack_type_id: defaultSackType ? defaultSackType.id : '',
                quantity: 1.0,  // Default to 1.0 instead of 1
                unit_price: defaultSackType ? defaultSackType.price : 0
            }
        ]);
    };

    const removeTransactionItem = (index: number) => {
        const newItems = transactionForm.data.items.filter((_, i) => i !== index);
        transactionForm.setData('items', newItems);
    };

    const updateTransactionItem = (index: number, field: keyof TransactionItem, value: any) => {
        const newItems = [...transactionForm.data.items];

        if (field === 'quantity') {
            // Handle decimal quantities
            const numValue = parseFloat(value);
            newItems[index] = {
                ...newItems[index],
                [field]: isNaN(numValue) || numValue <= 0 ? 0.1 : numValue
            };
        } else if (field === 'unit_price') {
            // Handle decimal prices
            const numValue = parseFloat(value);
            newItems[index] = {
                ...newItems[index],
                [field]: isNaN(numValue) || numValue < 0 ? 0 : numValue
            };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }

        // Auto-update price when sack type changes
        if (field === 'sack_type_id') {
            const selectedSackType = sackTypes.find(s => s.id === parseInt(value));
            if (selectedSackType) {
                newItems[index].unit_price = selectedSackType.price;
            }
        }

        transactionForm.setData('items', newItems);
    };

    const calculateTotalAmount = () => {
        return transactionForm.data.items.reduce((total, item) => {
            return total + (item.quantity * item.unit_price);
        }, 0);
    };

    const loadCustomerTransactions = async (customerId: string) => {
        if (customerId) {
            try {
                const response = await fetch(`/customers/${customerId}/transactions`);
                const data = await response.json();
                setCustomerTransactions(data);
            } catch (error) {
                console.error('Error loading customer transactions:', error);
            }
        } else {
            setCustomerTransactions([]);
        }
    };

    const submitTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        transactionForm.post(route('dashboard.store-transaction'), {
            onSuccess: () => {
                setShowTransactionModal(false);
                transactionForm.reset();
                // Reset to default first sack type
                if (sackTypes.length > 0) {
                    transactionForm.setData('items', [
                        { sack_type_id: sackTypes[0].id, quantity: 1, unit_price: sackTypes[0].price }
                    ]);
                }
            },
        });
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        paymentForm.post(route('dashboard.store-payment'), {
            onSuccess: () => {
                setShowPaymentModal(false);
                paymentForm.reset();
                setCustomerTransactions([]);
            },
        });
    };

    const submitCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        customerForm.post(route('dashboard.store-customer'), {
            onSuccess: () => {
                setShowCustomerModal(false);
                customerForm.reset();
            },
        });
    };

    const submitSackType = (e: React.FormEvent) => {
        e.preventDefault();
        sackTypeForm.post(route('dashboard.store-sack-type'), {
            onSuccess: () => {
                setShowSackTypeModal(false);
                sackTypeForm.reset();
            },
        });
    };

    const switchSeason = (e: React.FormEvent) => {
        e.preventDefault();
        seasonForm.post(route('dashboard.switch-season'));
    };

    const getStatusBadge = (status: string) => {
        const classes = {
            paid: 'bg-green-100 text-green-800 border-green-200',
            partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            due: 'bg-red-100 text-red-800 border-red-200'
        };

        const labels = {
            paid: 'Paid',
            partial: 'Partial',
            due: 'Due'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes[status as keyof typeof classes]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Dashboard - {currentSeason.name}
                    </h2>
                    <form onSubmit={switchSeason} className="flex items-center gap-3">
                        <SelectInput
                            value={seasonForm.data.season_id}
                            onChange={(e) => seasonForm.setData('season_id', parseInt(e.target.value))}
                            className="text-sm"
                        >
                            {seasons.map((season) => (
                                <option key={season.id} value={season.id}>
                                    {season.name}
                                </option>
                            ))}
                        </SelectInput>
                        <SecondaryButton type="submit" className="text-sm">
                            Switch
                        </SecondaryButton>
                    </form>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Cash Balance Highlight */}
                    <div className="relative">
                        <div className={`p-6 rounded-xl shadow-lg border-2 ${currentCashBalance >= 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Current Cash Balance</h3>
                                    <p className={`text-3xl font-bold ${currentCashBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {formatCurrency(currentCashBalance)}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-full ${currentCashBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <svg className={`w-8 h-8 ${currentCashBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <PrimaryButton
                                    onClick={() => setShowTransactionModal(true)}
                                    className="w-full justify-center py-3"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    New Sale
                                </PrimaryButton>
                                <SecondaryButton
                                    onClick={() => setShowPaymentModal(true)}
                                    className="w-full justify-center py-3"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3-3-3a3 3 0 110-6zm0 0V6a2 2 0 012-2h6a2 2 0 012 2v2" />
                                    </svg>
                                    Payment
                                </SecondaryButton>
                                <SecondaryButton
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full justify-center py-3"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Customer
                                </SecondaryButton>
                                <SecondaryButton
                                    onClick={() => setShowSackTypeModal(true)}
                                    className="w-full justify-center py-3"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    Product
                                </SecondaryButton>
                            </div>
                        </div>
                    </div>

                    {/* Today's Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-blue-100">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(todayTransactions)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-green-100">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-medium text-gray-600">Today's Payments</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(todayPayments)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-red-100">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 0v6.5m0 0L16 10m-4 2.5L8 10" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <p className="text-sm font-medium text-gray-600">Today's Expenses</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(todayExpenses)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Season Stats */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Season Summary</h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Sales</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(seasonTransactions)}</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Payments</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(seasonPayments)}</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Due</p>
                                    <p className="text-xl font-bold text-red-600">{formatCurrency(totalCustomerDue)}</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Net Profit</p>
                                    <p className={`text-xl font-bold ${seasonProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(seasonProfit)}
                                    </p>
                                </div>

                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Sack</p>
                                    <p className="text-xl font-bold text-gray-900">{seasonTotalQuantity}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Transactions */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{transaction.customer.name}</p>
                                                <p className="text-sm text-gray-500">{transaction.customer.area}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(transaction.transaction_date)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{formatCurrency(transaction.total_amount)}</p>
                                                {getStatusBadge(transaction.payment_status)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Payments */}
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {recentPayments.map((payment) => (
                                    <div key={payment.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{payment.customer.name}</p>
                                                <p className="text-sm text-gray-500">{payment.customer.area}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(payment.payment_date)}
                                                </p>
                                                {payment.received_by && (
                                                    <p className="text-xs text-gray-400">By: {payment.received_by}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600">
                                                    {formatCurrency(payment.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Customer Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Customers with Due</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {customersWithDue.map((customer) => (
                                    <div key={customer.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{customer.name}</p>
                                                <p className="text-sm text-gray-500">{customer.area}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-red-600">
                                                    {formatCurrency(customer.total_due || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {topCustomers.map((customer) => (
                                    <div key={customer.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{customer.name}</p>
                                                <p className="text-sm text-gray-500">{customer.area}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-blue-600">
                                                    {formatCurrency(customer.total_transactions || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Transaction Modal */}
                    <Modal show={showTransactionModal} onClose={() => setShowTransactionModal(false)} maxWidth="2xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Create New Sale</h2>
                                <button
                                    onClick={() => setShowTransactionModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={submitTransaction} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CustomerSelect
                                        customers={customers}
                                        value={transactionForm.data.customer_id}
                                        onChange={(customerId) => transactionForm.setData('customer_id', customerId)}
                                        onCreateNew={() => setShowCustomerModal(true)}
                                        error={transactionForm.errors.customer_id}
                                        required
                                    />

                                    <div>
                                        <InputLabel htmlFor="transaction_date" value="Date *" />
                                        <TextInput
                                            id="transaction_date"
                                            type="date"
                                            value={transactionForm.data.transaction_date}
                                            onChange={(e) => transactionForm.setData('transaction_date', e.target.value)}
                                            className="mt-2 block w-full"
                                            required
                                        />
                                        <InputError message={transactionForm.errors.transaction_date} className="mt-1" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <InputLabel value="Products *" />
                                        <SecondaryButton type="button" onClick={addTransactionItem} className="text-sm">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Item
                                        </SecondaryButton>
                                    </div>

                                    <div className="space-y-4">
                                        {transactionForm.data.items.map((item, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <InputLabel htmlFor={`sack_type_${index}`} value="Product" />
                                                        <SelectInput
                                                            id={`sack_type_${index}`}
                                                            value={item.sack_type_id}
                                                            onChange={(e) => updateTransactionItem(index, 'sack_type_id', e.target.value)}
                                                            className="mt-1 block w-full"
                                                            required
                                                        >
                                                            <option value="">Select Product</option>
                                                            {sackTypes.map((sackType) => (
                                                                <option key={sackType.id} value={sackType.id}>
                                                                    {sackType.name}
                                                                </option>
                                                            ))}
                                                        </SelectInput>
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor={`quantity_${index}`} value="Quantity" />
                                                        <TextInput
                                                            id={`quantity_${index}`}
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            value={item.quantity}
                                                            onChange={(e) => updateTransactionItem(index, 'quantity', parseFloat(e.target.value) || 0)}  // Removed .0 as it's redundant
                                                            className="mt-1 block w-full"
                                                            placeholder="e.g. 1.66666, 2.33333, 0.125"
                                                            required
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">You can enter decimal quantities like 0.5, 1.5, 2.5</p>
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor={`unit_price_${index}`} value="Unit Price" />
                                                        <TextInput
                                                            id={`unit_price_${index}`}
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateTransactionItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                            className="mt-1 block w-full"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        {transactionForm.data.items.length > 1 && (
                                                            <DangerButton
                                                                type="button"
                                                                onClick={() => removeTransactionItem(index)}
                                                                className="w-full"
                                                            >
                                                                Remove
                                                            </DangerButton>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex justify-between items-center bg-white px-3 py-2 rounded border">
                                                    <span className="text-sm font-medium text-gray-600">Item Total:</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatCurrency(item.quantity * item.unit_price)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold text-blue-800">Grand Total:</span>
                                            <span className="text-xl font-bold text-blue-900">
                                                {formatCurrency(calculateTotalAmount())}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="paid_amount" value="Paid Amount *" />
                                        <TextInput
                                            id="paid_amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={transactionForm.data.paid_amount}
                                            onChange={(e) => transactionForm.setData('paid_amount', parseFloat(e.target.value) || 0)}
                                            className="mt-2 block w-full"
                                            required
                                        />
                                        <InputError message={transactionForm.errors.paid_amount} className="mt-1" />
                                        <p className="mt-1 text-sm text-gray-600">
                                            Due: {formatCurrency(Math.max(0, calculateTotalAmount() - transactionForm.data.paid_amount))}
                                        </p>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="notes" value="Notes" />
                                        <TextArea
                                            id="notes"
                                            value={transactionForm.data.notes}
                                            onChange={(e) => transactionForm.setData('notes', e.target.value)}
                                            className="mt-2 block w-full"
                                            rows={3}
                                            placeholder="Optional notes..."
                                        />
                                        <InputError message={transactionForm.errors.notes} className="mt-1" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                                    <SecondaryButton onClick={() => setShowTransactionModal(false)}>
                                        Cancel
                                    </SecondaryButton>
                                    <PrimaryButton type="submit" disabled={transactionForm.processing}>
                                        {transactionForm.processing ? 'Creating...' : 'Create Sale'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </Modal>

                    {/* Payment Modal */}
                    <Modal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} maxWidth="lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={submitPayment} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="payment_customer_id" value="Customer *" />
                                    <SelectInput
                                        id="payment_customer_id"
                                        value={paymentForm.data.customer_id}
                                        onChange={(e) => {
                                            paymentForm.setData('customer_id', e.target.value);
                                            loadCustomerTransactions(e.target.value);
                                        }}
                                        className="mt-2 block w-full"
                                        required
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name} - {customer.area}
                                            </option>
                                        ))}
                                    </SelectInput>
                                    <InputError message={paymentForm.errors.customer_id} className="mt-1" />
                                </div>

                                {customerTransactions.length > 0 && (
                                    <div>
                                        <InputLabel htmlFor="payment_transaction_id" value="Related Sale (Optional)" />
                                        <SelectInput
                                            id="payment_transaction_id"
                                            value={paymentForm.data.transaction_id}
                                            onChange={(e) => paymentForm.setData('transaction_id', e.target.value)}
                                            className="mt-2 block w-full"
                                        >
                                            <option value="">General Payment</option>
                                            {customerTransactions.map((transaction) => (
                                                <option key={transaction.id} value={transaction.id}>
                                                    {formatDate(transaction.transaction_date)} - Due: {formatCurrency(transaction.due_amount)}
                                                </option>
                                            ))}
                                        </SelectInput>
                                        <InputError message={paymentForm.errors.transaction_id} className="mt-1" />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="payment_date" value="Payment Date *" />
                                        <TextInput
                                            id="payment_date"
                                            type="date"
                                            value={paymentForm.data.payment_date}
                                            onChange={(e) => paymentForm.setData('payment_date', e.target.value)}
                                            className="mt-2 block w-full"
                                            required
                                        />
                                        <InputError message={paymentForm.errors.payment_date} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="payment_amount" value="Amount *" />
                                        <TextInput
                                            id="payment_amount"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={paymentForm.data.amount}
                                            onChange={(e) => paymentForm.setData('amount', parseFloat(e.target.value) || 0)}
                                            className="mt-2 block w-full"
                                            required
                                        />
                                        <InputError message={paymentForm.errors.amount} className="mt-1" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="received_by" value="Received By" />
                                    <TextInput
                                        id="received_by"
                                        type="text"
                                        value={paymentForm.data.received_by}
                                        onChange={(e) => paymentForm.setData('received_by', e.target.value)}
                                        className="mt-2 block w-full"
                                        placeholder="Person who received the payment"
                                    />
                                    <InputError message={paymentForm.errors.received_by} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="payment_notes" value="Notes" />
                                    <TextArea
                                        id="payment_notes"
                                        value={paymentForm.data.notes}
                                        onChange={(e) => paymentForm.setData('notes', e.target.value)}
                                        className="mt-2 block w-full"
                                        rows={3}
                                        placeholder="Optional notes..."
                                    />
                                    <InputError message={paymentForm.errors.notes} className="mt-1" />
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                                    <SecondaryButton onClick={() => setShowPaymentModal(false)}>
                                        Cancel
                                    </SecondaryButton>
                                    <PrimaryButton type="submit" disabled={paymentForm.processing}>
                                        {paymentForm.processing ? 'Recording...' : 'Record Payment'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </Modal>

                    {/* Customer Modal */}
                    <Modal show={showCustomerModal} onClose={() => setShowCustomerModal(false)} maxWidth="lg">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Add New Customer</h2>
                                <button
                                    onClick={() => setShowCustomerModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={submitCustomer} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="customer_name" value="Name *" />
                                        <TextInput
                                            id="customer_name"
                                            type="text"
                                            value={customerForm.data.name}
                                            onChange={(e) => customerForm.setData('name', e.target.value)}
                                            className="mt-2 block w-full"
                                            placeholder="Customer full name"
                                            required
                                        />
                                        <InputError message={customerForm.errors.name} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="customer_area" value="Area *" />
                                        <div className="mt-2">
                                            <SearchableArea
                                                value={customerForm.data.area}
                                                onChange={(value) => customerForm.setData('area', value)}
                                                areas={existingAreas || []}
                                                error={customerForm.errors.area}
                                                placeholder="Select or type area..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="customer_phone" value="Phone Number *" />
                                    <TextInput
                                        id="customer_phone"
                                        type="text"
                                        value={customerForm.data.phone_number}
                                        onChange={(e) => customerForm.setData('phone_number', e.target.value)}
                                        className="mt-2 block w-full"
                                        placeholder="01XXXXXXXXX"
                                        required
                                    />
                                    <InputError message={customerForm.errors.phone_number} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="customer_image" value="Photo (Optional)" />
                                    <input
                                        id="customer_image"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => customerForm.setData('image', e.target.files?.[0] || null)}
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <InputError message={customerForm.errors.image} className="mt-1" />
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                                    <SecondaryButton onClick={() => setShowCustomerModal(false)}>
                                        Cancel
                                    </SecondaryButton>
                                    <PrimaryButton type="submit" disabled={customerForm.processing}>
                                        {customerForm.processing ? 'Adding...' : 'Add Customer'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </Modal>

                    {/* Sack Type Modal */}
                    <Modal show={showSackTypeModal} onClose={() => setShowSackTypeModal(false)} maxWidth="md">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
                                <button
                                    onClick={() => setShowSackTypeModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={submitSackType} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="sack_name" value="Product Name *" />
                                    <TextInput
                                        id="sack_name"
                                        type="text"
                                        value={sackTypeForm.data.name}
                                        onChange={(e) => sackTypeForm.setData('name', e.target.value)}
                                        className="mt-2 block w-full"
                                        placeholder="e.g. Feed, Gom, Chot, Vushi"
                                        required
                                    />
                                    <InputError message={sackTypeForm.errors.name} className="mt-1" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="sack_price" value="Price *" />
                                    <TextInput
                                        id="sack_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={sackTypeForm.data.price}
                                        onChange={(e) => sackTypeForm.setData('price', parseFloat(e.target.value) || 0)}
                                        className="mt-2 block w-full"
                                        placeholder="0.00"
                                        required
                                    />
                                    <InputError message={sackTypeForm.errors.price} className="mt-1" />
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                                    <SecondaryButton onClick={() => setShowSackTypeModal(false)}>
                                        Cancel
                                    </SecondaryButton>
                                    <PrimaryButton type="submit" disabled={sackTypeForm.processing}>
                                        {sackTypeForm.processing ? 'Adding...' : 'Add Product'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </Modal>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
