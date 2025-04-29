import { useState, FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Customer } from '@/types';
import { toBengaliDigits } from '@/utils';
import { Camera, X } from 'lucide-react';

interface CustomersProps extends PageProps {
    customers: Customer[];
}

export default function Index({ auth, customers }: CustomersProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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

            // Create image preview
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

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('area', data.area);
        formData.append('phone_number', data.phone_number);

        if (data.image) {
            formData.append('image', data.image);
        }

        if (editingCustomer) {
            formData.append('_method', 'PUT');
            post(route('customers.update', editingCustomer.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('customers.store'), {
                onSuccess: () => closeModal(),
            });
        }
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">গ্রাহক তালিকা</h2>}
        >
            <Head title="গ্রাহক তালিকা" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">গ্রাহক তালিকা</h2>
                                <button
                                    onClick={openCreateModal}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                >
                                    নতুন গ্রাহক যোগ করুন
                                </button>
                            </div>

                            <div className="overflow-x-auto mt-6">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                নাম
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
                                                ফোন নাম্বার
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                ছবি
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                কার্যক্রম
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {customers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    কোন গ্রাহক নেই
                                                </td>
                                            </tr>
                                        ) : (
                                            customers.map((customer) => (
                                                <tr key={customer.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{customer.area}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{toBengaliDigits(customer.phone_number)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {customer.image ? (
                                                            <img
                                                                src={`/storage/${customer.image}`}
                                                                alt={customer.name}
                                                                className="h-10 w-10 rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <span className="text-gray-500">{customer.name.charAt(0)}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => openEditModal(customer)}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            সম্পাদনা
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(customer.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            মুছুন
                                                        </button>
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {editingCustomer ? 'গ্রাহক সম্পাদনা করুন' : 'নতুন গ্রাহক যোগ করুন'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="p-6">
                                <div className="mb-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        নাম
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className='block w-full pl-5 pr-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm'
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                                        এলাকা
                                    </label>
                                    <input
                                        type="text"
                                        id="area"
                                        className='block w-full pl-5 pr-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm'
                                        value={data.area}
                                        onChange={(e) => setData('area', e.target.value)}
                                        required
                                    />
                                    {errors.area && <div className="text-red-500 text-sm mt-1">{errors.area}</div>}
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                                        ফোন নাম্বার
                                    </label>
                                    <input
                                        type="text"
                                        id="phone_number"
                                        className='block w-full pl-5 pr-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm'
                                        value={data.phone_number}
                                        onChange={(e) => setData('phone_number', e.target.value)}
                                        required
                                    />
                                    {errors.phone_number && <div className="text-red-500 text-sm mt-1">{errors.phone_number}</div>}
                                </div>

                                <div>
                                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                                        ছবি
                                    </label>
                                    <div className="mt-1 flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {imagePreview ? (
                                                <div className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100">
                                                    <img className="h-24 w-24 object-cover" src={imagePreview} alt="Preview" />
                                                    <button
                                                        type="button"
                                                        onClick={removeImage}
                                                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-md hover:bg-red-600"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-24 w-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    <Camera className="h-12 w-12 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                                                <span>ছবি আপলোড করুন</span>
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    onChange={handleImageChange}
                                                    accept="image/*"
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG, GIF সর্বোচ্চ 2MB
                                            </p>
                                        </div>
                                    </div>
                                    {errors.image && <div className="mt-2 text-sm text-red-600">{errors.image}</div>}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                                >
                                    বাতিল করুন
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    {processing ? 'অপেক্ষা করুন...' : editingCustomer ? 'আপডেট করুন' : 'যোগ করুন'}
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
                        <h3 className="text-lg font-medium text-gray-900 mb-4">গ্রাহক মুছে ফেলার নিশ্চিতকরণ</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            আপনি কি নিশ্চিত যে আপনি এই গ্রাহককে মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={cancelDelete}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                            >
                                বাতিল করুন
                            </button>
                            <button
                                onClick={() => deleteCustomer(deleteConfirmationId)}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                মুছে ফেলুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
