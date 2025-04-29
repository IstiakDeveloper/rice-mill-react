// resources/js/Pages/Dashboard.tsx
import { useState, useEffect, FormEvent } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Customer, SackType, Season, Transaction as TransactionType, Payment as PaymentType } from '@/types';
import { formatCurrency, formatDate, getPaymentStatusText, getPaymentStatusClass } from '@/utils';
import { toast } from 'react-hot-toast';

interface TransactionItem {
    id: number;
    sack_type_id: string;
    quantity: string;
    unit_price: string;
    total_price: number;
}

interface DashboardProps extends PageProps {
    currentSeason: Season;
    todayTransactions: number;
    todayPayments: number;
    seasonTransactions: number;
    seasonPayments: number;
    seasonDue: number;
    recentTransactions: TransactionType[];
    recentPayments: PaymentType[];
    customersWithDue: (Customer & { total_due: number })[];
    customers: Customer[];
    sackTypes: SackType[];
}

export default function Dashboard({
    auth,
    currentSeason,
    todayTransactions,
    todayPayments,
    seasonTransactions,
    seasonPayments,
    seasonDue,
    recentTransactions,
    recentPayments,
    customersWithDue,
    customers,
    sackTypes
}: DashboardProps) {
    // Modal states
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isSackTypeModalOpen, setIsSackTypeModalOpen] = useState(false);

    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

    // For Transaction
    const [items, setItems] = useState<TransactionItem[]>([
        { id: 1, sack_type_id: '', quantity: '', unit_price: '', total_price: 0 },
    ]);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [dueTransactions, setDueTransactions] = useState<TransactionType[]>([]);

    // Forms
    const transactionForm = useForm({
        customer_id: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        paid_amount: '0',
        notes: '',
        items: [] as { sack_type_id: number; quantity: number; unit_price: number }[],
    });

    const paymentForm = useForm({
        customer_id: '',
        transaction_id: '',
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        notes: '',
    });

    const customerForm = useForm({
        name: '',
        area: '',
        phone_number: '',
        image: null as File | null,
    });

    const sackTypeForm = useForm({
        name: '',
        price: '',
    });


    const filteredCustomers = useMemo(() => {
        if (!customerSearchQuery.trim()) {
            return customers; // Return all customers when search is empty
        }

        const query = customerSearchQuery.toLowerCase();
        return customers.filter(
            customer =>
                customer.name.toLowerCase().includes(query) ||
                customer.area.toLowerCase().includes(query)
        );
    }, [customers, customerSearchQuery]);



    useEffect(() => {
        function handleClickOutside(event) {
          if (
            showCustomerDropdown &&
            event.target.closest('#customer_search') === null &&
            !event.target.closest('.customer-dropdown')
          ) {
            setShowCustomerDropdown(false);
          }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }, [showCustomerDropdown]);

    // Calculate total price when items change
    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.total_price, 0);
        setTotalAmount(total);
    }, [items]);

    // Update due transactions when customer changes
    useEffect(() => {
        if (selectedCustomerId) {
            const filtered = recentTransactions.filter(
                (transaction) => transaction.customer.id === selectedCustomerId &&
                    transaction.payment_status !== 'paid'
            );
            setDueTransactions(filtered);
        } else {
            setDueTransactions([]);
        }
    }, [selectedCustomerId, recentTransactions]);

    // Transaction Functions
    const handleTransactionCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const customerId = e.target.value;
        transactionForm.setData('customer_id', customerId);
        setSelectedCustomerId(customerId ? parseInt(customerId) : null);
    };

    const addItem = () => {
        const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
        setItems([...items, { id: newId, sack_type_id: '', quantity: '', unit_price: '', total_price: 0 }]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: number, field: string, value: string) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };

                // Auto-fill unit price when sack type is selected
                if (field === 'sack_type_id' && value) {
                    const selectedSackType = sackTypes.find(st => st.id.toString() === value);
                    if (selectedSackType) {
                        updatedItem.unit_price = selectedSackType.price.toString();
                    }
                }

                // Calculate total price
                if ((field === 'quantity' || field === 'unit_price' || field === 'sack_type_id') &&
                    updatedItem.quantity && updatedItem.unit_price) {
                    updatedItem.total_price = parseFloat(updatedItem.quantity) * parseFloat(updatedItem.unit_price);
                }

                return updatedItem;
            }
            return item;
        });

        setItems(updatedItems);
    };

    const handleTransactionSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Prepare items data
        const formattedItems = items
            .filter(item => item.sack_type_id && item.quantity && item.unit_price)
            .map(item => ({
                sack_type_id: parseInt(item.sack_type_id),
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(item.unit_price),
            }));

        // Update form data
        transactionForm.setData('items', formattedItems);

        // Submit form
        transactionForm.post(route('dashboard.transactions.store'), {
            onSuccess: () => {
                setIsTransactionModalOpen(false);
                resetTransactionForm();
                toast.success('লেনদেন সফলভাবে সম্পন্ন হয়েছে');
            },
            onError: () => {
                toast.error('লেনদেন সম্পন্ন করতে ত্রুটি');
            }
        });
    };

    const resetTransactionForm = () => {
        transactionForm.reset();
        setItems([{ id: 1, sack_type_id: '', quantity: '', unit_price: '', total_price: 0 }]);
        setTotalAmount(0);
        setSelectedCustomerId(null);
    };

    // Payment Functions
    const handlePaymentCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const customerId = e.target.value;
        paymentForm.setData('customer_id', customerId);
        setSelectedCustomerId(customerId ? parseInt(customerId) : null);
        paymentForm.setData('transaction_id', '');
    };

    const handleTransactionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const transactionId = e.target.value;
        paymentForm.setData('transaction_id', transactionId);

        if (transactionId) {
            const selectedTransaction = dueTransactions.find(
                transaction => transaction.id.toString() === transactionId
            );
            if (selectedTransaction) {
                paymentForm.setData('amount', selectedTransaction.due_amount.toString());
            }
        }
    };

    const handlePaymentSubmit = (e: FormEvent) => {
        e.preventDefault();

        paymentForm.post(route('dashboard.payments.store'), {
            onSuccess: () => {
                setIsPaymentModalOpen(false);
                paymentForm.reset();
                setSelectedCustomerId(null);
                toast.success('পেমেন্ট সফলভাবে সম্পন্ন হয়েছে');
            },
            onError: () => {
                toast.error('পেমেন্ট সম্পন্ন করতে ত্রুটি');
            }
        });
    };

    // Customer Functions
    const handleCustomerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            customerForm.setData('image', e.target.files[0]);
        }
    };

    const handleCustomerSubmit = (e: FormEvent) => {
        e.preventDefault();

        customerForm.post(route('dashboard.customers.store'), {
            onSuccess: () => {
                setIsCustomerModalOpen(false);
                customerForm.reset();
                toast.success('গ্রাহক সফলভাবে যোগ করা হয়েছে');
            },
            onError: () => {
                toast.error('গ্রাহক যোগ করতে ত্রুটি');
            }
        });
    };

    // Sack Type Functions
    const handleSackTypeSubmit = (e: FormEvent) => {
        e.preventDefault();

        sackTypeForm.post(route('dashboard.sack-types.store'), {
            onSuccess: () => {
                setIsSackTypeModalOpen(false);
                sackTypeForm.reset();
                toast.success('বস্তার ধরন সফলভাবে যোগ করা হয়েছে');
            },
            onError: () => {
                toast.error('বস্তার ধরন যোগ করতে ত্রুটি');
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">ড্যাশবোর্ড</h2>
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold">চলমান সিজন:</span> {currentSeason.name}
                    </div>
                </div>
            }
        >
            <Head title="ড্যাশবোর্ড" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Today's Summary */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <h3 className="text-lg font-semibold mb-4">আজকের হিসাব</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">মোট লেনদেন</p>
                                        <p className="text-xl font-semibold text-green-600">{formatCurrency(todayTransactions)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">মোট পেমেন্ট</p>
                                        <p className="text-xl font-semibold text-blue-600">{formatCurrency(todayPayments)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Season Summary */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <h3 className="text-lg font-semibold mb-4">সিজন হিসাব</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <p className="text-sm text-gray-600">মোট লেনদেন</p>
                                        <p className="text-lg font-semibold text-green-600">{formatCurrency(seasonTransactions)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">মোট পেমেন্ট</p>
                                        <p className="text-lg font-semibold text-blue-600">{formatCurrency(seasonPayments)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">মোট বাকি</p>
                                        <p className="text-lg font-semibold text-red-600">{formatCurrency(seasonDue)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <h3 className="text-lg font-semibold mb-4">দ্রুত কাজ</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setIsTransactionModalOpen(true)}
                                        className="inline-flex justify-center items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        নতুন লেনদেন
                                    </button>
                                    <button
                                        onClick={() => setIsPaymentModalOpen(true)}
                                        className="inline-flex justify-center items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        নতুন পেমেন্ট
                                    </button>
                                    <button
                                        onClick={() => setIsCustomerModalOpen(true)}
                                        className="inline-flex justify-center items-center px-4 py-2 bg-purple-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-purple-700 focus:bg-purple-700 active:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        নতুন গ্রাহক
                                    </button>
                                    <button
                                        onClick={() => setIsSackTypeModalOpen(true)}
                                        className="inline-flex justify-center items-center px-4 py-2 bg-yellow-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-yellow-700 focus:bg-yellow-700 active:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                    >
                                        নতুন বস্তার ধরন
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions and Payments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Recent Transactions */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">সাম্প্রতিক লেনদেন</h3>
                                    <Link href={route('transactions.index')} className="text-sm text-blue-600 hover:underline">
                                        সব দেখুন
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    তারিখ
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    গ্রাহক
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    পরিমাণ
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    অবস্থা
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentTransactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                        কোন লেনদেন নেই
                                                    </td>
                                                </tr>
                                            ) : (
                                                recentTransactions.map((transaction) => (
                                                    <tr key={transaction.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(transaction.transaction_date)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            <Link
                                                                href={route('transactions.show', transaction.id)}
                                                                className="text-blue-600 hover:underline"
                                                            >
                                                                {transaction.customer.name}
                                                            </Link>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatCurrency(transaction.total_amount)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span
                                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(transaction.payment_status)
                                                                    }`}
                                                            >
                                                                {getPaymentStatusText(transaction.payment_status)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Recent Payments */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">সাম্প্রতিক পেমেন্ট</h3>
                                    <Link href={route('payments.index')} className="text-sm text-blue-600 hover:underline">
                                        সব দেখুন
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    তারিখ
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    গ্রাহক
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    পরিমাণ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentPayments.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                                        কোন পেমেন্ট নেই
                                                    </td>
                                                </tr>
                                            ) : (
                                                recentPayments.map((payment) => (
                                                    <tr key={payment.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatDate(payment.payment_date)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            <Link
                                                                href={route('customer.payments', payment.customer.id)}
                                                                className="text-blue-600 hover:underline"
                                                            >
                                                                {payment.customer.name}
                                                            </Link>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatCurrency(payment.amount)}
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

                    {/* Customers with Due */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">বাকি আছে এমন গ্রাহক</h3>
                                <Link href={route('reports.customer')} className="text-sm text-blue-600 hover:underline">
                                    সব দেখুন
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                গ্রাহকের নাম
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                এলাকা
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                মোট বাকি
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                কার্যক্রম
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {customersWithDue.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    কোন গ্রাহকের বাকি নেই
                                                </td>
                                            </tr>
                                        ) : (
                                            customersWithDue.map((customer) => (
                                                <tr key={customer.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        <Link
                                                            href={route('customer.payments', customer.id)}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {customer.name}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {customer.area}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(customer.total_due)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCustomerId(customer.id);
                                                                paymentForm.setData('customer_id', customer.id.toString());
                                                                setIsPaymentModalOpen(true);
                                                            }}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            পেমেন্ট নিন
                                                        </button>
                                                        <Link
                                                            href={route('reports.customer', { customer_id: customer.id })}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            রিপোর্ট দেখুন
                                                        </Link>
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
            </div>

            {/* Transaction Modal */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">নতুন লেনদেন</h3>
                            <button
                                onClick={() => setIsTransactionModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleTransactionSubmit}>
                            <div className="p-3 sm:p-6">
                                {/* Top Section - Customer & Date */}
                                <div className="grid grid-cols-1 gap-4 mb-4 sm:mb-6">
                                    {/* Customer Selection */}
                                    <div>
                                        <label htmlFor="customer_id" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                            গ্রাহক নির্বাচন করুন
                                        </label>
                                        <select
                                            id="customer_id"
                                            className="block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                            value={transactionForm.data.customer_id}
                                            onChange={handleTransactionCustomerChange}
                                            required
                                        >
                                            <option value="">গ্রাহক নির্বাচন করুন</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name} - {customer.area}
                                                </option>
                                            ))}
                                        </select>
                                        {transactionForm.errors.customer_id && (
                                            <div className="text-red-500 text-xs sm:text-sm mt-1">{transactionForm.errors.customer_id}</div>
                                        )}
                                    </div>

                                    {/* Transaction Date */}
                                    <div>
                                        <label htmlFor="transaction_date" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                            লেনদেনের তারিখ
                                        </label>
                                        <input
                                            type="date"
                                            id="transaction_date"
                                            className="block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                            value={transactionForm.data.transaction_date}
                                            onChange={(e) => transactionForm.setData('transaction_date', e.target.value)}
                                            required
                                        />
                                        {transactionForm.errors.transaction_date && (
                                            <div className="text-red-500 text-xs sm:text-sm mt-1">{transactionForm.errors.transaction_date}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Transaction Items */}
                                <div className="mb-4 sm:mb-6">
                                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">লেনদেনের আইটেম</h3>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="inline-flex items-center px-2 py-1 sm:px-4 sm:py-2 border border-transparent rounded-lg shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            নতুন আইটেম
                                        </button>
                                    </div>

                                    {/* Mobile Card View and Desktop Table View */}
                                    <div className="block sm:hidden">
                                        {/* Mobile Card Layout */}
                                        {items.map((item, index) => (
                                            <div key={item.id} className="mb-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                                <div className="bg-gray-50 px-4 py-2 rounded-t-lg flex justify-between items-center">
                                                    <span className="font-medium text-sm text-gray-700">আইটেম #{index + 1}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.id)}
                                                        disabled={items.length === 1}
                                                        className={`text-red-600 hover:text-red-800 transition-colors duration-150 ${items.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="p-4">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">বস্তার ধরন</label>
                                                            <select
                                                                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                                                value={item.sack_type_id}
                                                                onChange={(e) => updateItem(item.id, 'sack_type_id', e.target.value)}
                                                                required
                                                            >
                                                                <option value="">নির্বাচন করুন</option>
                                                                {sackTypes.map((sackType) => (
                                                                    <option key={sackType.id} value={sackType.id}>
                                                                        {sackType.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">পরিমাণ</label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">একক মূল্য</label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                                                value={item.unit_price}
                                                                onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">মোট মূল্য</label>
                                                            <div className="px-2 py-1.5 text-sm font-medium border border-gray-300 rounded-md bg-gray-50 text-gray-900">
                                                                {formatCurrency(item.total_price)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Mobile Total */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-700">মোট:</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden sm:block rounded-lg shadow border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        বস্তার ধরন
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        পরিমাণ
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        একক মূল্য
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        মোট মূল্য
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        কার্যক্রম
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {items.map((item) => (
                                                    <tr key={item.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <select
                                                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                                                value={item.sack_type_id}
                                                                onChange={(e) => updateItem(item.id, 'sack_type_id', e.target.value)}
                                                                required
                                                            >
                                                                <option value="">বস্তার ধরন</option>
                                                                {sackTypes.map((sackType) => (
                                                                    <option key={sackType.id} value={sackType.id}>
                                                                        {sackType.name} - {formatCurrency(sackType.price)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                                                value={item.unit_price}
                                                                onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {formatCurrency(item.total_price)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(item.id)}
                                                                disabled={items.length === 1}
                                                                className={`flex items-center text-red-600 hover:text-red-800 transition-colors duration-150 text-sm ${items.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                মুছুন
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gray-50 font-semibold">
                                                    <td colSpan={3} className="px-6 py-4 text-right text-sm text-gray-700">
                                                        মোট:
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-sm text-gray-900">{formatCurrency(totalAmount)}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    {transactionForm.errors.items && (
                                        <div className="text-red-500 text-xs sm:text-sm mt-2">{transactionForm.errors.items}</div>
                                    )}
                                </div>

                                {/* Payment Information */}
                                <div className="mb-4 sm:mb-6 bg-gray-50 p-3 sm:p-5 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">পেমেন্ট তথ্য</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                        <div>
                                            <label htmlFor="paid_amount" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                                জমাকৃত অর্থ
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 text-sm">৳</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    id="paid_amount"
                                                    step="0.01"
                                                    min="0"
                                                    max={totalAmount}
                                                    className="block w-full pl-7 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                                    value={transactionForm.data.paid_amount}
                                                    onChange={(e) => transactionForm.setData('paid_amount', e.target.value)}
                                                />
                                            </div>
                                            {transactionForm.errors.paid_amount && (
                                                <div className="text-red-500 text-xs sm:text-sm mt-1">{transactionForm.errors.paid_amount}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="due_amount" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                                বাকি অর্থ
                                            </label>
                                            <div className="relative rounded-lg shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 text-sm">৳</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    id="due_amount"
                                                    className="block w-full pl-7 pr-3 py-2 text-sm sm:text-base border border-gray-300 bg-gray-100 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-gray-700 font-medium"
                                                    value={formatCurrency(totalAmount - parseFloat(transactionForm.data.paid_amount || '0')).replace('৳', '')}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="mb-4 sm:mb-6">
                                    <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                        নোট (ঐচ্ছিক)
                                    </label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        className="block w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-gray-900"
                                        placeholder="লেনদেন সম্পর্কে অতিরিক্ত তথ্য..."
                                        value={transactionForm.data.notes}
                                        onChange={(e) => transactionForm.setData('notes', e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-4 rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={() => setIsTransactionModalOpen(false)}
                                    className="w-full sm:w-auto bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                                >
                                    বাতিল করুন
                                </button>
                                <button
                                    type="submit"
                                    disabled={transactionForm.processing}
                                    className="w-full sm:w-auto inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                                >
                                    {transactionForm.processing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            অপেক্ষা করুন...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            লেনদেন সম্পন্ন করুন
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">নতুন পেমেন্ট</h3>
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit}>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-6 mb-6">
                                    {/* Customer Selection */}
                                    <div>
                                        <label htmlFor="payment_customer_id" className="block text-sm font-medium text-gray-700 mb-1">
                                            গ্রাহক নির্বাচন করুন
                                        </label>
                                        <select
                                            id="payment_customer_id"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            value={paymentForm.data.customer_id}
                                            onChange={handlePaymentCustomerChange}
                                            required
                                        >
                                            <option value="">গ্রাহক নির্বাচন করুন</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name} - {customer.area}
                                                </option>
                                            ))}
                                        </select>
                                        {paymentForm.errors.customer_id && (
                                            <div className="text-red-500 text-sm mt-1">{paymentForm.errors.customer_id}</div>
                                        )}
                                    </div>

                                    {/* Transaction Selection (Optional) */}
                                    <div>
                                        <label htmlFor="transaction_id" className="block text-sm font-medium text-gray-700 mb-1">
                                            লেনদেন নির্বাচন করুন (ঐচ্ছিক)
                                        </label>
                                        <select
                                            id="transaction_id"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            value={paymentForm.data.transaction_id}
                                            onChange={handleTransactionSelect}
                                            disabled={!selectedCustomerId || dueTransactions.length === 0}
                                        >
                                            <option value="">নির্বাচন করুন না (সরাসরি পেমেন্ট)</option>
                                            {dueTransactions.map((transaction) => (
                                                <option key={transaction.id} value={transaction.id}>
                                                    {formatDate(transaction.transaction_date)} - বাকি: {formatCurrency(transaction.due_amount)}
                                                </option>
                                            ))}
                                        </select>
                                        {paymentForm.errors.transaction_id && (
                                            <div className="text-red-500 text-sm mt-1">{paymentForm.errors.transaction_id}</div>
                                        )}
                                    </div>

                                    {/* Payment Date */}
                                    <div>
                                        <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
                                            পেমেন্টের তারিখ
                                        </label>
                                        <input
                                            type="date"
                                            id="payment_date"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            value={paymentForm.data.payment_date}
                                            onChange={(e) => paymentForm.setData('payment_date', e.target.value)}
                                            required
                                        />
                                        {paymentForm.errors.payment_date && (
                                            <div className="text-red-500 text-sm mt-1">{paymentForm.errors.payment_date}</div>
                                        )}
                                    </div>

                                    {/* Payment Amount */}
                                    <div>
                                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                                            পেমেন্ট পরিমাণ
                                        </label>
                                        <input
                                            type="number"
                                            id="amount"
                                            step="0.01"
                                            min="0.01"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            value={paymentForm.data.amount}
                                            onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                            required
                                        />
                                        {paymentForm.errors.amount && (
                                            <div className="text-red-500 text-sm mt-1">{paymentForm.errors.amount}</div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label htmlFor="payment_notes" className="block text-sm font-medium text-gray-700 mb-1">
                                            নোট (ঐচ্ছিক)
                                        </label>
                                        <textarea
                                            id="payment_notes"
                                            rows={3}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            value={paymentForm.data.notes}
                                            onChange={(e) => paymentForm.setData('notes', e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                                >
                                    বাতিল করুন
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {paymentForm.processing ? 'অপেক্ষা করুন...' : 'পেমেন্ট যোগ করুন'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">নতুন গ্রাহক যোগ করুন</h3>
                            <button
                                onClick={() => setIsCustomerModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCustomerSubmit}>
                            <div className="p-6">
                                <div className="mb-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        নাম
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={customerForm.data.name}
                                        onChange={(e) => customerForm.setData('name', e.target.value)}
                                        required
                                    />
                                    {customerForm.errors.name && <div className="text-red-500 text-sm mt-1">{customerForm.errors.name}</div>}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                                        এলাকা
                                    </label>
                                    <input
                                        type="text"
                                        id="area"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={customerForm.data.area}
                                        onChange={(e) => customerForm.setData('area', e.target.value)}
                                        required
                                    />
                                    {customerForm.errors.area && <div className="text-red-500 text-sm mt-1">{customerForm.errors.area}</div>}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                                        ফোন নাম্বার
                                    </label>
                                    <input
                                        type="text"
                                        id="phone_number"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={customerForm.data.phone_number}
                                        onChange={(e) => customerForm.setData('phone_number', e.target.value)}
                                        required
                                    />
                                    {customerForm.errors.phone_number && (
                                        <div className="text-red-500 text-sm mt-1">{customerForm.errors.phone_number}</div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                                        ছবি (ঐচ্ছিক)
                                    </label>
                                    <input
                                        type="file"
                                        id="image"
                                        className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100"
                                        onChange={handleCustomerImageChange}
                                    />
                                    {customerForm.errors.image && (
                                        <div className="text-red-500 text-sm mt-1">{customerForm.errors.image}</div>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={() => setIsCustomerModalOpen(false)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                                >
                                    বাতিল করুন
                                </button>
                                <button
                                    type="submit"
                                    disabled={customerForm.processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    {customerForm.processing ? 'অপেক্ষা করুন...' : 'গ্রাহক যোগ করুন'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SackType Modal */}
            {isSackTypeModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">নতুন বস্তার ধরন যোগ করুন</h3>
                            <button
                                onClick={() => setIsSackTypeModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSackTypeSubmit}>
                            <div className="p-6">
                                <div className="mb-4">
                                    <label htmlFor="sack_type_name" className="block text-sm font-medium text-gray-700 mb-1">
                                        বস্তার ধরন
                                    </label>
                                    <input
                                        type="text"
                                        id="sack_type_name"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={sackTypeForm.data.name}
                                        onChange={(e) => sackTypeForm.setData('name', e.target.value)}
                                        required
                                    />
                                    {sackTypeForm.errors.name && <div className="text-red-500 text-sm mt-1">{sackTypeForm.errors.name}</div>}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                        মূল্য
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={sackTypeForm.data.price}
                                        onChange={(e) => sackTypeForm.setData('price', e.target.value)}
                                        required
                                    />
                                    {sackTypeForm.errors.price && <div className="text-red-500 text-sm mt-1">{sackTypeForm.errors.price}</div>}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={() => setIsSackTypeModalOpen(false)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                                >
                                    বাতিল করুন
                                </button>
                                <button
                                    type="submit"
                                    disabled={sackTypeForm.processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                                >
                                    {sackTypeForm.processing ? 'অপেক্ষা করুন...' : 'বস্তার ধরন যোগ করুন'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
