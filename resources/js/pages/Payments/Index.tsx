import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Payment, Transaction, Customer, Season } from '@/types';
import { Edit, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';

interface PaymentListProps extends PageProps {
    payments: {
        data: Array<Payment & {
            customer: Customer;
            transaction?: Transaction;
            season: Season;
        }>;
        links: any[];
        meta: any;
    };
    transaction?: Transaction & {
        customer: Customer;
    };
}

export default function PaymentsList({ auth, payments, transaction }: PaymentListProps) {
    const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

    const { delete: deletePayment, processing } = useForm();

    const handleDelete = (paymentId: number) => {
        deletePayment(route('payments.destroy', paymentId), {
            onSuccess: () => {
                setShowDeleteModal(null);
            }
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA'); // yyyy-MM-dd format
    };

    const formatCurrency = (amount: string | number) => {
        return `৳${parseFloat(amount.toString()).toFixed(2)}`;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {transaction ? (
                            <Link
                                href={route('transactions.show', transaction.id)}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                        ) : (
                            <Link
                                href={route('dashboard')}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                        )}
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            {transaction
                                ? `Payments for Transaction #${transaction.id}`
                                : 'All Payments'
                            }
                        </h2>
                    </div>
                    {transaction && (
                        <Link
                            href={route('payments.create')}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Payment
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={transaction ? `Payments - Transaction #${transaction.id}` : 'Payments'} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    {/* Transaction Info (if viewing payments for specific transaction) */}
                    {transaction && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                            <div className="p-6 text-gray-900">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Customer:</span>
                                        <p className="text-lg">{transaction.customer.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Total Amount:</span>
                                        <p className="text-lg font-semibold text-blue-600">
                                            {formatCurrency(transaction.total_amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Paid Amount:</span>
                                        <p className="text-lg font-semibold text-green-600">
                                            {formatCurrency(transaction.paid_amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Due Amount:</span>
                                        <p className="text-lg font-semibold text-red-600">
                                            {formatCurrency(transaction.due_amount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payments List */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Payment Records ({payments?.meta?.total || payments?.data?.length || 0} total)
                                </h3>
                            </div>

                            {payments.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Customer
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Transaction
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Received By
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Notes
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {payments.data.map((payment) => (
                                                <tr key={payment.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDate(payment.payment_date)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {payment.customer.name}
                                                        </div>
                                                        {payment.customer.area && (
                                                            <div className="text-sm text-gray-500">
                                                                {payment.customer.area}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-semibold text-green-600">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {payment.transaction ? (
                                                            <Link
                                                                href={route('transactions.show', payment.transaction.id)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                #{payment.transaction.id}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {payment.received_by || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                        {payment.notes || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                href={route('payments.edit', payment.id)}
                                                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                                                title="Edit Payment"
                                                            >
                                                                <Edit size={16} />
                                                            </Link>
                                                            <button
                                                                onClick={() => setShowDeleteModal(payment.id)}
                                                                className="text-red-600 hover:text-red-900 p-1"
                                                                title="Delete Payment"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-500 text-lg mb-2">No payments found</div>
                                    <p className="text-gray-400">
                                        {transaction
                                            ? 'No payments have been made for this transaction yet.'
                                            : 'No payments have been recorded yet.'
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Pagination */}
                            {payments.links && payments.links.length > 3 && (
                                <div className="mt-6 flex justify-center">
                                    <nav className="flex items-center gap-2">
                                        {payments.links.map((link, index) => (
                                            <div key={index}>
                                                {link.url ? (
                                                    <Link
                                                        href={link.url}
                                                        className={`px-3 py-2 text-sm rounded-md ${
                                                            link.active
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span
                                                        className="px-3 py-2 text-sm text-gray-400"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Payment</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete this payment? This action will:
                                </p>
                                <ul className="text-sm text-gray-600 mt-2 text-left">
                                    <li>• Adjust customer balance accordingly</li>
                                    <li>• Update transaction payment status</li>
                                    <li>• Adjust cash balance</li>
                                    <li>• Cannot be undone</li>
                                </ul>
                            </div>
                            <div className="items-center px-4 py-3 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(null)}
                                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(showDeleteModal)}
                                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    disabled={processing}
                                >
                                    {processing ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
