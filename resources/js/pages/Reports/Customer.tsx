// resources/js/Pages/Reports/Customer.tsx
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, Customer, Transaction, Payment } from '@/types';
import { formatCurrency, formatDate, getPaymentStatusText, getPaymentStatusClass } from '@/utils';

interface CustomerReportProps extends PageProps {
    allCustomers: Customer[];
    customer?: Customer;
    transactions?: Transaction[];
    payments?: Payment[];
    totalTransactions?: number;
    totalPaid?: number;
    totalDue?: number;
    sackTypeData?: Record<string, { quantity: number; total: number }>;
}

export default function CustomerReport({
    auth,
    allCustomers,
    customer,
    transactions = [],
    payments = [],
    totalTransactions = 0,
    totalPaid = 0,
    totalDue = 0,
    sackTypeData = {},
}: CustomerReportProps) {
    const [customerId, setCustomerId] = useState(customer?.id?.toString() || '');

    // Handle customer change
    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCustomerId = e.target.value;
        setCustomerId(newCustomerId);
        router.get(route('reports.customer', { customer_id: newCustomerId }));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">গ্রাহক রিপোর্ট</h2>
                    <div className="flex items-center">
                        <label htmlFor="customer_id" className="mr-2 text-sm font-medium text-gray-700">
                            গ্রাহক:
                        </label>
                        <select
                            id="customer_id"
                            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            value={customerId}
                            onChange={handleCustomerChange}
                        >
                            <option value="">গ্রাহক নির্বাচন করুন</option>
                            {allCustomers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} - {c.area}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <Head title={customer ? `গ্রাহক রিপোর্ট - ${customer.name}` : 'গ্রাহক রিপোর্ট'} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {!customer ? (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900 text-center">
                                <p className="text-lg">দয়া করে রিপোর্ট দেখার জন্য একজন গ্রাহক নির্বাচন করুন।</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Customer Summary */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 text-gray-900">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">গ্রাহক সারসংক্ষেপ: {customer.name}</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">নাম</p>
                                            <p className="mt-1 text-lg text-gray-900">{customer.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">এলাকা</p>
                                            <p className="mt-1 text-lg text-gray-900">{customer.area}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">ফোন নাম্বার</p>
                                            <p className="mt-1 text-lg text-gray-900">{customer.phone_number}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">মোট লেনদেন</p>
                                            <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(totalTransactions)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">মোট পেমেন্ট</p>
                                            <p className="mt-1 text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">মোট বাকি</p>
                                            <p className="mt-1 text-lg font-bold text-red-600">{formatCurrency(totalDue)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sack Type Summary */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 text-gray-900">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">বস্তার সারসংক্ষেপ</h3>

                                    <div className="overflow-x-auto">
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
                                                        মোট মূল্য
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {Object.keys(sackTypeData).length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                                            কোন বস্তার তথ্য নেই
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    Object.entries(sackTypeData).map(([name, data]) => (
                                                        <tr key={name}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {name}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {data.quantity}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatCurrency(data.total)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 text-gray-900">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">লেনদেন ইতিহাস</h3>

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
                                                        মোট পরিমাণ
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        পরিশোধিত
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        বাকি
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
                                                {transactions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                            কোন লেনদেন নেই
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    transactions.map((transaction) => (
                                                        <tr key={transaction.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(transaction.transaction_date)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatCurrency(transaction.total_amount)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatCurrency(transaction.paid_amount)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatCurrency(transaction.due_amount)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span
                                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(
                                                                        transaction.payment_status
                                                                    )}`}
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

                            {/* Payment History */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6 text-gray-900">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">পেমেন্ট ইতিহাস</h3>

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
                                                        লেনদেন
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
                                                        নোট
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {payments.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                                            কোন পেমেন্ট নেই
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    payments.map((payment) => (
                                                        <tr key={payment.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(payment.payment_date)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {payment.transaction_id ? `#${payment.transaction_id}` : 'সরাসরি পেমেন্ট'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {formatCurrency(payment.amount)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
