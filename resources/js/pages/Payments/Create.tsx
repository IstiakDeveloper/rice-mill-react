import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Customer, Transaction, Season } from '@/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { ArrowLeft, DollarSign, User, Calendar } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

interface PaymentsCreateProps extends PageProps {
  customers: Array<Customer & {
    balance_info: {
      total_sales: number;
      total_payments: number;
      balance: number;
      advance_payment: number;
    };
  }>;
  transactions: Array<Transaction & {
    customer: { id: number; name: string };
    season: { id: number; name: string };
  }>;
  seasons: Season[];
  currentSeason: Season;
  selectedCustomerId?: number;
}

export default function Create({ auth, customers, transactions, seasons, currentSeason, selectedCustomerId }: PaymentsCreateProps) {
  const [filteredTransactions, setFilteredTransactions] = useState<typeof transactions>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null);

  const { data, setData, post, processing, errors, reset } = useForm({
    customer_id: selectedCustomerId || '',
    transaction_id: '',
    season_id: currentSeason.id,
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    notes: '',
    received_by: auth.user.name,
  });

  // Set initial customer if selectedCustomerId is provided
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setSelectedCustomer(customer);
        setData('customer_id', selectedCustomerId);
      }
    }
  }, [selectedCustomerId]);

  // Filter transactions when customer changes
  useEffect(() => {
    if (data.customer_id) {
      const customerId = parseInt(data.customer_id.toString());
      const customerTransactions = transactions.filter(t => t.customer.id === customerId);
      setFilteredTransactions(customerTransactions);

      const customer = customers.find(c => c.id === customerId);
      setSelectedCustomer(customer || null);
    } else {
      setFilteredTransactions([]);
      setSelectedCustomer(null);
    }
  }, [data.customer_id]);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('payments.store'), {
      onSuccess: () => {
        reset();
      },
    });
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toFixed(2)}`;
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href={route('payments.index')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </Link>
            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
              Record New Payment
            </h2>
          </div>
          <Link
            href={route('payments.index')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back to List
          </Link>
        </div>
      }
    >
      <Head title="Record Payment" />

      <div className="py-12">
        <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">

          {/* Customer Balance Display */}
          {selectedCustomer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
                <User size={20} />
                {selectedCustomer.name} - Balance Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Total Sales</div>
                  <div className="text-xl font-bold text-blue-900">
                    {formatCurrency(selectedCustomer.balance_info.total_sales)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Total Payments</div>
                  <div className="text-xl font-bold text-green-900">
                    {formatCurrency(selectedCustomer.balance_info.total_payments)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Current Balance</div>
                  <div className={`text-xl font-bold ${selectedCustomer.balance_info.balance > 0 ? 'text-red-900' : 'text-gray-600'}`}>
                    {formatCurrency(selectedCustomer.balance_info.balance)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">Advance Payment</div>
                  <div className="text-xl font-bold text-purple-900">
                    {formatCurrency(selectedCustomer.balance_info.advance_payment)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={submit}>
            {/* Payment Information */}
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6 text-gray-900">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign size={20} />
                  Payment Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <InputLabel htmlFor="customer_id" value="Customer *" />
                    <select
                      id="customer_id"
                      value={data.customer_id}
                      onChange={(e) => setData('customer_id', e.target.value)}
                      className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                          {customer.balance_info.balance > 0 && (
                            ` (Due: ${formatCurrency(customer.balance_info.balance)})`
                          )}
                          {customer.balance_info.advance_payment > 0 && (
                            ` (Advance: ${formatCurrency(customer.balance_info.advance_payment)})`
                          )}
                        </option>
                      ))}
                    </select>
                    <InputError message={errors.customer_id} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="season_id" value="Season *" />
                    <select
                      id="season_id"
                      value={data.season_id}
                      onChange={(e) => setData('season_id', parseInt(e.target.value))}
                      className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                      required
                    >
                      {seasons.map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name}
                        </option>
                      ))}
                    </select>
                    <InputError message={errors.season_id} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="payment_date" value="Payment Date *" />
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
                    <InputLabel htmlFor="amount" value="Payment Amount *" />
                    <TextInput
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={data.amount}
                      onChange={(e) => setData('amount', e.target.value)}
                      className="mt-1 block w-full"
                      placeholder="0.00"
                      required
                    />
                    <InputError message={errors.amount} className="mt-2" />
                  </div>

                  <div>
                    <InputLabel htmlFor="transaction_id" value="Specific Transaction (Optional)" />
                    <select
                      id="transaction_id"
                      value={data.transaction_id}
                      onChange={(e) => setData('transaction_id', e.target.value)}
                      className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                    >
                      <option value="">General Payment (Not linked to specific transaction)</option>
                      {filteredTransactions.map((transaction) => (
                        <option key={transaction.id} value={transaction.id}>
                          Transaction #{transaction.id} - Due: {formatCurrency(transaction.due_amount)}
                          ({transaction.transaction_date})
                        </option>
                      ))}
                    </select>
                    <InputError message={errors.transaction_id} className="mt-2" />
                    {data.customer_id && filteredTransactions.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        No pending transactions found for this customer.
                      </p>
                    )}
                  </div>

                  <div>
                    <InputLabel htmlFor="received_by" value="Received By" />
                    <TextInput
                      id="received_by"
                      type="text"
                      value={data.received_by}
                      onChange={(e) => setData('received_by', e.target.value)}
                      className="mt-1 block w-full"
                      placeholder="Person who received the payment"
                    />
                    <InputError message={errors.received_by} className="mt-2" />
                  </div>

                  <div className="md:col-span-2">
                    <InputLabel htmlFor="notes" value="Notes (Optional)" />
                    <textarea
                      id="notes"
                      value={data.notes}
                      onChange={(e) => setData('notes', e.target.value)}
                      className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                      rows={3}
                      placeholder="Any additional notes about this payment..."
                    />
                    <InputError message={errors.notes} className="mt-2" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-4">
                  <Link
                    href={route('payments.index')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </Link>
                  <PrimaryButton disabled={processing}>
                    {processing ? 'Recording...' : 'Record Payment'}
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </form>

          {/* Available Transactions */}
          {data.customer_id && filteredTransactions.length > 0 && (
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6 text-gray-900">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} />
                  Pending Transactions for {selectedCustomer?.name}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Paid Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Due Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.transaction_date).toLocaleDateString('en-CA')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(transaction.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            {formatCurrency(transaction.paid_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                            {formatCurrency(transaction.due_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : transaction.payment_status === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.payment_status === 'paid' ? 'Paid' :
                               transaction.payment_status === 'partial' ? 'Partial' : 'Unpaid'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
