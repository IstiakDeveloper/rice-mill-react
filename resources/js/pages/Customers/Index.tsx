import { useState, FormEvent } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { toBengaliDigits, formatCurrency } from '@/utils';
import {
    Camera,
    X,
    Plus,
    Edit2,
    Trash2,
    Eye,
    Filter,
    TrendingUp,
    TrendingDown,
    Minus,
    Calendar,
    Banknote,
    Package
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

interface CustomersProps extends PageProps {
    customers: Customer[];
    seasons: Season[];
    currentSeason?: Season;
}

export default function Index({ auth, customers, seasons, currentSeason }: CustomersProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<number | null>(currentSeason?.id || null);

    const { data, setData, post, put, errors, processing, reset } = useForm({
        name: '',
        area: '',
        phone_number: '',
        image: null as File | null,
    });

    function closeModal() {
        setIsModalOpen(false);
        setEditingCustomer(null);
        reset();
        setImagePreview(null);
    }

    function openCreateModal() {
        setEditingCustomer(null);
        setImagePreview(null);
        reset();
        setIsModalOpen(true);
    }

    function openEditModal(customer: Customer) {
        setEditingCustomer(customer);
        setData({
            name: customer.name,
            area: customer.area,
            phone_number: customer.phone_number,
            image: null,
        });
        setImagePreview(customer.image ? `/storage/${customer.image}` : null);
        setIsModalOpen(true);
    }

    function confirmDelete(customerId: number) {
        setDeleteConfirmationId(customerId);
    }

    function cancelDelete() {
        setDeleteConfirmationId(null);
    }

    function deleteCustomer(customerId: number) {
        window.axios
            .delete(route('customers.destroy', customerId))
            .then(() => {
                window.location.reload();
            })
            .catch((error) => {
                console.error('Error deleting customer:', error);
                setDeleteConfirmationId(null);
            });
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setData('image', file);

            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setImagePreview(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    }

    function removeImage() {
        setData('image', null);
        setImagePreview(null);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (editingCustomer) {
            put(route('customers.update', editingCustomer.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('customers.store'), {
                onSuccess: () => closeModal(),
            });
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'due':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        Due
                    </span>
                );
            case 'advance':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Advance
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Minus className="w-3 h-3 mr-1" />
                        Settled
                    </span>
                );
        }
    }

    const filteredCustomers = customers.filter(customer =>
        customer.transaction_count > 0 || customer.payment_count > 0
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Customer Management</h2>}
        >
            <Head title="Customers" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                                <p className="text-gray-600 mt-1">
                                    Manage your customer database and track their transactions
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={selectedSeason || ''}
                                    onChange={(e) => setSelectedSeason(e.target.value ? parseInt(e.target.value) : null)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Seasons</option>
                                    {seasons.map((season) => (
                                        <option key={season.id} value={season.id}>
                                            {season.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Customer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                    <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Active Customers</p>
                                    <p className="text-2xl font-bold text-gray-900">{filteredCustomers.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-red-100">
                                    <TrendingDown className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Pending Dues</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {customers.filter(c => c.payment_status === 'due').length}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-yellow-100">
                                    <Banknote className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Balance</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(customers.reduce((sum, c) => sum + Math.abs(c.remaining_balance), 0))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customers Table */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sacks
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sales
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payments
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Activity
                                        </th> */}
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-12 text-center">
                                                <div className="text-gray-500">
                                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <p className="text-lg font-medium mb-2">No customers found</p>
                                                    <p className="text-sm">Get started by adding your first customer</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        customers.map((customer) => (
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {toBengaliDigits(customer.phone_number)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="font-medium">{toBengaliDigits(customer.total_sacks.toString())}</span>
                                                    <div className="text-xs text-gray-500">
                                                        {toBengaliDigits(customer.transaction_count.toString())} transactions
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(customer.total_sales)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(customer.total_payments)}
                                                    <div className="text-xs text-gray-500">
                                                        {toBengaliDigits(customer.payment_count.toString())} payments
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`font-medium ${
                                                        customer.remaining_balance > 0
                                                            ? 'text-red-600'
                                                            : customer.remaining_balance < 0
                                                            ? 'text-green-600'
                                                            : 'text-gray-900'
                                                    }`}>
                                                        {formatCurrency(Math.abs(customer.remaining_balance))}
                                                    </span>
                                                    {customer.advance_payment > 0 && (
                                                        <div className="text-xs text-green-600">
                                                            Advance: {formatCurrency(customer.advance_payment)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(customer.payment_status)}
                                                </td>
                                                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {customer.last_transaction_date && (
                                                        <div className="flex items-center text-xs">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {new Date(customer.last_transaction_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                    {customer.last_payment_date && (
                                                        <div className="flex items-center text-xs mt-1">
                                                            <Banknote className="w-3 h-3 mr-1" />
                                                            {new Date(customer.last_payment_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </td> */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('customers.show', customer.id)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => openEditModal(customer)}
                                                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(customer.id)}
                                                            className="text-red-600 hover:text-red-900 p-1 rounded"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                                </div>

                                <div>
                                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                                        Area
                                    </label>
                                    <input
                                        type="text"
                                        id="area"
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={data.area}
                                        onChange={(e) => setData('area', e.target.value)}
                                        required
                                    />
                                    {errors.area && <div className="text-red-500 text-sm mt-1">{errors.area}</div>}
                                </div>

                                <div>
                                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        id="phone_number"
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={data.phone_number}
                                        onChange={(e) => setData('phone_number', e.target.value)}
                                        required
                                    />
                                    {errors.phone_number && <div className="text-red-500 text-sm mt-1">{errors.phone_number}</div>}
                                </div>

                                <div>
                                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                                        Photo
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {imagePreview ? (
                                                <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100">
                                                    <img className="h-20 w-20 object-cover" src={imagePreview} alt="Preview" />
                                                    <button
                                                        type="button"
                                                        onClick={removeImage}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    <Camera className="h-8 w-8 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                                                <span>Upload Photo</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                PNG, JPG, GIF up to 2MB
                                            </p>
                                        </div>
                                    </div>
                                    {errors.image && <div className="mt-2 text-sm text-red-600">{errors.image}</div>}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmationId !== null && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center mb-4">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Customer</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Are you sure you want to delete this customer? This action cannot be undone and will remove all associated transactions and payments.
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteCustomer(deleteConfirmationId)}
                                    className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
