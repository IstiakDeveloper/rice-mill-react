// resources/js/Pages/Payments/CustomerPayments.tsx
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Customer, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/utils';

interface CustomerPaymentsProps extends PageProps {
  customer: Customer;
  payments: Payment[];
  totalPaid: number;
  totalTransactions: number;
  totalDue: number;
}

export default function CustomerPayments({
  auth,
  customer,
  payments,
  totalPaid,
  totalTransactions,
  totalDue,
}: CustomerPaymentsProps) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">
            {customer.name} - পেমেন্ট হিস্টোরি
          </h2>
          <Link
            href={route('payments.create', { customer_id: customer.id })}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            নতুন পেমেন্ট যোগ করুন
          </Link>
        </div>
      }
    >
      <Head title={`${customer.name} - পেমেন্ট হিস্টোরি`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Customer Details */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">গ্রাহক তথ্য</h3>

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
                  <p className="text-sm font-medium text-gray-500">মোট পরিশোধিত</p>
                  <p className="mt-1 text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">মোট বাকি</p>
                  <p className="mt-1 text-lg font-bold text-red-600">{formatCurrency(totalDue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">পেমেন্ট হিস্টোরি</h3>

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
                            {payment.transaction_id ? (
                              <Link
                                href={route('transactions.show', payment.transaction_id)}
                                className="text-blue-600 hover:underline"
                              >
                                #{payment.transaction_id}
                              </Link>
                            ) : (
                              'সরাসরি পেমেন্ট'
                            )}
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
