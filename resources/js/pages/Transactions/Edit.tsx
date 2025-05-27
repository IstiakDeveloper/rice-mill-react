import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Transaction, Customer, SackType, Season } from '@/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { FormEventHandler, useEffect } from 'react';
import SelectInput from '@/components/SelectInput';

interface TransactionEditProps extends PageProps {
    transaction: Transaction & {
        items: Array<{
            id: number;
            sack_type_id: number;
            quantity: number;
            unit_price: number;
            total_price: number;
            sack_type: { id: number; name: string };
        }>;
        payments?: Array<{
            id: number;
            amount: string;
            payment_date: string;
            notes?: string;
        }>;
    };
    customers: Customer[];
    sackTypes: Array<{
        id: number;
        name: string;
        price?: number;
    }>;
    seasons: Season[];
}

interface TransactionItem {
    sack_type_id: number; // Keep as number only
    quantity: number;
    unit_price: number;
}

export default function Edit({ auth, transaction, customers, sackTypes, seasons }: TransactionEditProps) {
    // Get total payments already made for this transaction (from payments table)
    const existingPayments = transaction.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0;

    // Debug: Log the data to console
    console.log('Edit Transaction Props:', {
        transaction,
        customers: customers?.length || 0,
        sackTypes: sackTypes?.length || 0,
        seasons: seasons?.length || 0,
        existingPayments,
        payments: transaction.payments
    });

    // Helper function to format date for HTML input
    const formatDateForInput = (dateString: string): string => {
        if (!dateString) return new Date().toISOString().split('T')[0];

        // Handle different date formats
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // Returns yyyy-MM-dd format
        } catch (error) {
            console.error('Date formatting error:', error);
            return new Date().toISOString().split('T')[0];
        }
    };

    const { data, setData, put, processing, errors, reset } = useForm({
        customer_id: transaction.customer_id,
        season_id: transaction.season_id,
        transaction_date: formatDateForInput(transaction.transaction_date), // Use helper function
        paid_amount: 0, // Set to 0 initially - this is for ADDITIONAL payment with this edit
        notes: transaction.notes || '',
        items: transaction.items.map(item => ({
            sack_type_id: item.sack_type_id, // Keep as number for existing items
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
        })) as TransactionItem[],
    });

    const calculateTotals = () => {
        const total = data.items.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity.toString()) || 0;
            const unitPrice = parseFloat(item.unit_price.toString()) || 0;
            return sum + (quantity * unitPrice);
        }, 0);

        const additionalPayment = parseFloat(data.paid_amount.toString()) || 0;
        const totalPaid = existingPayments + additionalPayment;
        const due = Math.max(0, total - totalPaid);

        return {
            total: total.toFixed(2),
            existingPayments: existingPayments.toFixed(2),
            additionalPayment: additionalPayment.toFixed(2),
            totalPaid: totalPaid.toFixed(2),
            due: due.toFixed(2)
        };
    };

    const addTransactionItem = () => {
        setData('items', [
            ...data.items,
            { sack_type_id: 0, quantity: 1, unit_price: 0 } // Use 0 for new items, will be converted to empty string in select
        ]);
    };

    const removeTransactionItem = (index: number) => {
        if (data.items.length > 1) {
            const newItems = data.items.filter((_, i) => i !== index);
            setData('items', newItems);
        }
    };

    const updateTransactionItem = (index: number, field: keyof TransactionItem, value: any) => {
        const newItems = [...data.items];

        // Handle sack_type_id specially
        if (field === 'sack_type_id') {
            newItems[index] = {
                ...newItems[index],
                [field]: parseInt(value) || 0
            };
        } else {
            newItems[index] = {
                ...newItems[index],
                [field]: value
            };
        }

        // Force React to re-render by creating a completely new array reference
        setData('items', [...newItems]);
    };

    // Auto-fill unit price when sack type is selected
    const handleSackTypeChange = (index: number, sackTypeId: string) => {
        console.log('Sack type changed:', { index, sackTypeId, sackTypes });

        const numericSackTypeId = sackTypeId === '' ? 0 : parseInt(sackTypeId);

        // Create a new items array to ensure React detects the change
        const newItems = [...data.items];

        // Update the specific item
        newItems[index] = {
            ...newItems[index],
            sack_type_id: numericSackTypeId
        };

        // Find the selected sack type and auto-fill price
        if (numericSackTypeId > 0) {
            const selectedSackType = sackTypes?.find(sack => sack.id === numericSackTypeId);
            console.log('Selected sack type:', selectedSackType);

            if (selectedSackType && selectedSackType.price) {
                newItems[index] = {
                    ...newItems[index],
                    unit_price: parseFloat(selectedSackType.price.toString())
                };
            }
        } else {
            // Reset price if no sack type selected
            newItems[index] = {
                ...newItems[index],
                unit_price: 0
            };
        }

        // Update the state with the new items array
        setData('items', newItems);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('transactions.update', transaction.id), {
            onSuccess: () => {
                // Handle success - redirect will be handled by controller
            },
        });
    };

    const totals = calculateTotals();

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('transactions.show', transaction.id)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Edit Transaction
                        </h2>
                    </div>
                    <Link
                        href={route('transactions.index')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Back to List
                    </Link>
                </div>
            }
        >
            <Head title="Edit Transaction" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Existing Payments Info */}
                    {existingPayments > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-blue-800">
                                <h4 className="font-medium mb-2">Existing Payments</h4>
                                <p className="text-sm mb-3">This transaction has existing payments of ৳{existingPayments.toFixed(2)}. Any payment amount you enter below will be ADDITIONAL to this.</p>

                                {/* Show payment details */}
                                {transaction.payments && transaction.payments.length > 0 && (
                                    <div className="mt-3">
                                        <h5 className="font-medium text-sm mb-2">Payment History:</h5>
                                        <div className="space-y-1">
                                            {transaction.payments.map((payment, index) => (
                                                <div key={payment.id || index} className="text-xs bg-white p-2 rounded border">
                                                    <span className="font-medium">৳{parseFloat(payment.amount).toFixed(2)}</span>
                                                    {payment.payment_date && (
                                                        <span className="text-gray-600 ml-2">
                                                            on {new Date(payment.payment_date).toLocaleDateString('en-CA')} {/* en-CA gives yyyy-MM-dd format */}
                                                        </span>
                                                    )}
                                                    {payment.notes && (
                                                        <span className="text-gray-500 ml-2">- {payment.notes}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit}>
                        {/* Transaction Details */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel htmlFor="customer_id" value="Customer" />
                                        <select
                                            id="customer_id"
                                            value={data.customer_id}
                                            onChange={(e) => setData('customer_id', parseInt(e.target.value))}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            required
                                        >
                                            <option value="">Select Customer</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.customer_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="season_id" value="Season" />
                                        <select
                                            id="season_id"
                                            value={data.season_id || ''}
                                            onChange={(e) => setData('season_id', e.target.value ? parseInt(e.target.value) : null)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        >
                                            <option value="">Select Season</option>
                                            {seasons.map((season) => (
                                                <option key={season.id} value={season.id}>
                                                    {season.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.season_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="transaction_date" value="Transaction Date" />
                                        <TextInput
                                            id="transaction_date"
                                            type="date"
                                            value={data.transaction_date}
                                            onChange={(e) => setData('transaction_date', e.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <InputError message={errors.transaction_date} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="paid_amount" value="Additional Payment Amount" />
                                        <TextInput
                                            id="paid_amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.paid_amount}
                                            onChange={(e) => setData('paid_amount', parseFloat(e.target.value) || 0)}
                                            className="mt-1 block w-full"
                                            placeholder="0.00"
                                        />
                                        <InputError message={errors.paid_amount} className="mt-2" />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Enter any additional payment to be made with this update
                                        </p>
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel htmlFor="notes" value="Notes (Optional)" />
                                        <textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            rows={3}
                                            placeholder="Any additional notes about this transaction..."
                                        />
                                        <InputError message={errors.notes} className="mt-2" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Items */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Transaction Items</h3>
                                    <button
                                        type="button"
                                        onClick={addTransactionItem}
                                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add Item
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {data.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                                            <div>
                                                <InputLabel htmlFor={`sack_type_${index}`} value="Sack Type" />

                                                <select
                                                    key={`sack_type_select_${index}_${item.sack_type_id}`} // Add this key
                                                    id={`sack_type_${index}`}
                                                    value={item.sack_type_id === 0 ? '' : item.sack_type_id.toString()}
                                                    onChange={(e) => handleSackTypeChange(index, e.target.value)}
                                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                                    required
                                                >
                                                    <option value="">Select Sack Type</option>
                                                    {sackTypes && sackTypes.length > 0 ? (
                                                        sackTypes.map((sackType) => (
                                                            <option key={sackType.id} value={sackType.id.toString()}>
                                                                {sackType.name} {sackType.price ? `(৳${sackType.price})` : ''}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option value="" disabled>No sack types available</option>
                                                    )}
                                                </select>
                                                <InputError message={errors[`items.${index}.sack_type_id`]} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor={`quantity_${index}`} value="Quantity" />
                                                <TextInput
                                                    id={`quantity_${index}`}
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={item.quantity}
                                                    onChange={(e) => updateTransactionItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="mt-1 block w-full"
                                                    placeholder="e.g. 1.66666, 2.5, 0.5"
                                                    required
                                                />
                                                <InputError message={errors[`items.${index}.quantity`]} className="mt-2" />
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
                                                    placeholder="0.00"
                                                    required
                                                />
                                                <InputError message={errors[`items.${index}.unit_price`]} className="mt-2" />
                                            </div>

                                            <div className="flex items-end">
                                                <div className="w-full">
                                                    <InputLabel value="Total Price" />
                                                    <div className="mt-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-medium">
                                                        ৳{((parseFloat(item.quantity.toString()) || 0) * (parseFloat(item.unit_price.toString()) || 0)).toFixed(2)}
                                                    </div>
                                                </div>
                                                {data.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTransactionItem(index)}
                                                        className="ml-2 p-2 text-red-600 hover:text-red-900 focus:outline-none"
                                                        title="Remove Item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Transaction Summary */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Summary</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-blue-600">Total Amount</div>
                                        <div className="text-xl font-bold text-blue-900">৳{totals.total}</div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-green-600">Existing Payments</div>
                                        <div className="text-xl font-bold text-green-900">৳{totals.existingPayments}</div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-purple-600">Additional Payment</div>
                                        <div className="text-xl font-bold text-purple-900">৳{totals.additionalPayment}</div>
                                    </div>
                                    <div className="bg-indigo-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-indigo-600">Total Paid</div>
                                        <div className="text-xl font-bold text-indigo-900">৳{totals.totalPaid}</div>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <div className="text-sm font-medium text-red-600">Due Amount</div>
                                        <div className="text-xl font-bold text-red-900">৳{totals.due}</div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-end gap-4">
                                    <Link
                                        href={route('transactions.show', transaction.id)}
                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        Cancel
                                    </Link>
                                    <PrimaryButton disabled={processing}>
                                        {processing ? 'Updating...' : 'Update Transaction'}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
