import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Payment, Customer, Transaction, Season } from '@/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { FormEventHandler } from 'react';

interface PaymentEditProps extends PageProps {
    payment: Payment & {
        customer: Customer;
        transaction?: Transaction;
        season: Season;
    };
    customers: Customer[];
    transactions: Transaction[];
    seasons: Season[];
}

export default function EditPayment({
    auth,
    payment,
    customers,
    transactions,
    seasons
}: PaymentEditProps) {

    const { data, setData, put, processing, errors } = useForm({
        amount: payment.amount || 0,
        payment_date: payment.payment_date ?
            new Date(payment.payment_date).toISOString().split('T')[0] :
            new Date().toISOString().split('T')[0],
        notes: payment.notes || '',
        received_by: payment.received_by || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('payments.update', payment.id), {
            onSuccess: () => {
                // Success handled by controller redirect
            },
        });
    };

    const amountDifference = parseFloat(data.amount.toString()) - parseFloat(payment.amount.toString());
    const isIncreasing = amountDifference > 0;
    const isDecreasing = amountDifference < 0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('payments.index', payment.transaction_id || undefined)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Edit Payment
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Edit Payment" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Payment Info */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Customer:</span>
                                    <p className="text-lg">{payment.customer.name}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Season:</span>
                                    <p className="text-lg">{payment.season.name}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Original Amount:</span>
                                    <p className="text-lg font-bold text-blue-600">৳{parseFloat(payment.amount.toString()).toFixed(2)}</p>
                                </div>
                                {payment.transaction && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Transaction:</span>
                                        <p className="text-lg">#{payment.transaction.id}</p>
                                    </div>
                                )}
                            </div>

                            {/* Warning about balance changes */}
                            {amountDifference !== 0 && (
                                <div className={`p-4 rounded-lg border ${
                                    isIncreasing ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle
                                            size={20}
                                            className={isIncreasing ? 'text-green-600 mt-0.5' : 'text-yellow-600 mt-0.5'}
                                        />
                                        <div>
                                            <h4 className={`font-medium ${
                                                isIncreasing ? 'text-green-800' : 'text-yellow-800'
                                            }`}>
                                                Balance Change Warning
                                            </h4>
                                            <p className={`text-sm mt-1 ${
                                                isIncreasing ? 'text-green-700' : 'text-yellow-700'
                                            }`}>
                                                {isIncreasing ? (
                                                    <>
                                                        Payment will <strong>increase</strong> by ৳{Math.abs(amountDifference).toFixed(2)}.
                                                        Customer balance will be adjusted accordingly.
                                                    </>
                                                ) : (
                                                    <>
                                                        Payment will <strong>decrease</strong> by ৳{Math.abs(amountDifference).toFixed(2)}.
                                                        Customer balance and transaction status will be updated.
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Payment</h3>

                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="amount" value="Payment Amount" />
                                        <TextInput
                                            id="amount"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', parseFloat(e.target.value) || 0)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <InputError message={errors.amount} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="payment_date" value="Payment Date" />
                                        <TextInput
                                            id="payment_date"
                                            type="date"
                                            value={data.payment_date}
                                            onChange={(e) => setData('payment_date', e.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <InputError message={errors.payment_date} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="received_by" value="Received By" />
                                        <TextInput
                                            id="received_by"
                                            type="text"
                                            value={data.received_by}
                                            onChange={(e) => setData('received_by', e.target.value)}
                                            className="mt-1 block w-full"
                                            placeholder="Enter receiver name"
                                        />
                                        <InputError message={errors.received_by} className="mt-2" />
                                    </div>

                                    <div className="md:col-span-1">
                                        <InputLabel htmlFor="notes" value="Notes" />
                                        <textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            rows={3}
                                            placeholder="Any notes about this payment..."
                                        />
                                        <InputError message={errors.notes} className="mt-2" />
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-900 mb-2">Payment Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <span className="text-sm text-gray-500">Original Amount:</span>
                                            <p className="text-lg font-semibold">৳{parseFloat(payment.amount.toString()).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">New Amount:</span>
                                            <p className="text-lg font-semibold text-blue-600">৳{parseFloat(data.amount.toString()).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Difference:</span>
                                            <p className={`text-lg font-semibold ${
                                                amountDifference > 0 ? 'text-green-600' :
                                                amountDifference < 0 ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                                {amountDifference > 0 ? '+' : ''}৳{amountDifference.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <Link
                                        href={route('payments.index', payment.transaction_id || undefined)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        Cancel
                                    </Link>

                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Updating...' : 'Update Payment'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
