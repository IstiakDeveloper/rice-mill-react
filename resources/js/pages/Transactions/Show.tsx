// resources/js/Pages/Transactions/Show.tsx
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Transaction as TransactionType } from '@/types';
import { formatCurrency, formatDate, getPaymentStatusText, getPaymentStatusClass } from '@/utils';

interface TransactionShowProps extends PageProps {
  transaction: TransactionType;
}

export default function Show({ auth, transaction }: TransactionShowProps) {
  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">লেনদেন বিস্তারিত</h2>
          <div className="space-x-2">
            {transaction.payment_status !== 'paid' && (
              <Link
                href={route('payments.create', { transaction_id: transaction.id })}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                পেমেন্ট নিন
              </Link>
            )}
            <Link
              href={route('transactions.index')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              তালিকায় ফিরে যান
            </Link>
          </div>
        </div>
      }
    >
      <Head title="লেনদেন বিস্তারিত" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Transaction Details */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">লেনদেন তথ্য</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">গ্রাহক</p>
                  <p className="mt-1 text-lg text-gray-900">{transaction.customer?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">তারিখ</p>
                  <p className="mt-1 text-lg text-gray-900">{formatDate(transaction.transaction_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">সিজন</p>
                  <p className="mt-1 text-lg text-gray-900">{transaction.season?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">মোট পরিমাণ</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(transaction.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">পরিশোধিত পরিমাণ</p>
                  <p className="mt-1 text-lg text-green-600">{formatCurrency(transaction.paid_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">বাকি পরিমাণ</p>
                  <p className="mt-1 text-lg text-red-600">{formatCurrency(transaction.due_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">অবস্থা</p>
                  <p className="mt-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(
                        transaction.payment_status
                      )}`}
                    >
                      {getPaymentStatusText(transaction.payment_status)}
                    </span>
                  </p>
                </div>
                {transaction.notes && (
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-gray-500">নোট</p>
                    <p className="mt-1 text-gray-900">{transaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Items */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">লেনদেন আইটেম</h3>

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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transaction.items && transaction.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.sack_type?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-4 text-right font-medium">
                        মোট:
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatCurrency(transaction.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
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
                    {transaction.payments && transaction.payments.length > 0 ? (
                      transaction.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.payment_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.notes || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                          কোন পেমেন্ট নেই
                        </td>
                      </tr>
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
