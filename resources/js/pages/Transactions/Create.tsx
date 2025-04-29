// resources/js/Pages/Transactions/Create.tsx
import { useState, useEffect, FormEvent } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Customer, SackType, Season } from '@/types';
import { formatCurrency } from '@/utils';

interface TransactionCreateProps extends PageProps {
    customers: Customer[];
    sackTypes: SackType[];
    currentSeason: Season;
}

interface TransactionItem {
    id: number;
    sack_type_id: string;
    quantity: string;
    unit_price: string;
    total_price: number;
}

export default function Create({ auth, customers, sackTypes, currentSeason }: TransactionCreateProps) {
    const [items, setItems] = useState<TransactionItem[]>([
        { id: 1, sack_type_id: '', quantity: '', unit_price: '', total_price: 0 },
    ]);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const { data, setData, errors, processing, post, reset } = useForm({
        customer_id: '',
        transaction_date: new Date().toISOString().slice(0, 10),
        paid_amount: '0',
        notes: '',
        items: [] as { sack_type_id: number; quantity: number; unit_price: number }[],
    });

    // Calculate total price when items change
    useEffect(() => {
        const total = items.reduce((sum, item) => sum + item.total_price, 0);
        setTotalAmount(total);
    }, [items]);

    // Add new item row
    const addItem = () => {
        const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
        setItems([...items, { id: newId, sack_type_id: '', quantity: '', unit_price: '', total_price: 0 }]);
    };

    // Remove item row
    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    // Update item data
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

    // Handle form submission
    const handleSubmit = (e: FormEvent) => {
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
        setData('items', formattedItems);

        // Submit form
        post(route('transactions.store'), {
            onSuccess: () => {
                reset();
                router.visit(route('transactions.index'));
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">নতুন লেনদেন</h2>
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold">সিজন:</span> {currentSeason.name}
                    </div>
                </div>
            }
        >
            <Head title="নতুন লেনদেন" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Customer Selection */}
                                    <div>
                                        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">
                                            গ্রাহক নির্বাচন করুন
                                        </label>
                                        <select
                                            id="customer_id"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            value={data.customer_id}
                                            onChange={(e) => setData('customer_id', e.target.value)}
                                            required
                                        >
                                            <option value="">গ্রাহক নির্বাচন করুন</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name} - {customer.area}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.customer_id && <div className="text-red-500 text-sm mt-1">{errors.customer_id}</div>}
                                    </div>

                                    {/* Transaction Date */}
                                    <div>
                                        <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700 mb-1">
                                            লেনদেনের তারিখ
                                        </label>
                                        <input
                                            type="date"
                                            id="transaction_date"
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            value={data.transaction_date}
                                            onChange={(e) => setData('transaction_date', e.target.value)}
                                            required
                                        />
                                        {errors.transaction_date && <div className="text-red-500 text-sm mt-1">{errors.transaction_date}</div>}
                                    </div>
                                </div>

                                {/* Transaction Items */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-medium text-gray-700">লেনদেনের আইটেম</h3>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            + নতুন আইটেম
                                        </button>
                                    </div>

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
                                                    <tr key={item.id}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <select
                                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                                value={item.sack_type_id}
                                                                onChange={(e) => updateItem(item.id, 'sack_type_id', e.target.value)}
                                                                required
                                                            >
                                                                <option value="">বস্তার ধরন নির্বাচন করুন</option>
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
                                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
                                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                                value={item.unit_price}
                                                                onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                                                                required
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {formatCurrency(item.total_price)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(item.id)}
                                                                disabled={items.length === 1}
                                                                className={`text-red-600 hover:text-red-900 ${items.length === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                                                    }`}
                                                            >
                                                                মুছুন
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gray-50">
                                                    <td colSpan={3} className="px-6 py-4 text-right font-medium">
                                                        মোট:
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(totalAmount)}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    {errors.items && <div className="text-red-500 text-sm mt-1">{errors.items}</div>}
                                </div>

                                {/* Payment Information */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-700 mb-2">পেমেন্ট তথ্য</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="paid_amount" className="block text-sm font-medium text-gray-700 mb-1">
                                                জমাকৃত অর্থ
                                            </label>
                                            <input
                                                type="number"
                                                id="paid_amount"
                                                step="0.01"
                                                min="0"
                                                max={totalAmount}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                value={data.paid_amount}
                                                onChange={(e) => setData('paid_amount', e.target.value)}
                                            />
                                            {errors.paid_amount && <div className="text-red-500 text-sm mt-1">{errors.paid_amount}</div>}
                                        </div>
                                        <div>
                                            <label htmlFor="due_amount" className="block text-sm font-medium text-gray-700 mb-1">
                                                বাকি অর্থ
                                            </label>
                                            <input
                                                type="text"
                                                id="due_amount"
                                                className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                value={formatCurrency(totalAmount - parseFloat(data.paid_amount || '0'))}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="mb-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                        নোট (ঐচ্ছিক)
                                    </label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                    ></textarea>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end mt-6">
                                    <button
                                        type="button"
                                        onClick={() => router.visit(route('transactions.index'))}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                                    >
                                        বাতিল করুন
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        {processing ? 'অপেক্ষা করুন...' : 'লেনদেন সম্পন্ন করুন'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
