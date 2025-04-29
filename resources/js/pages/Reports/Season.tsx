// resources/js/Pages/Reports/Season.tsx
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Season, Customer } from '@/types';
import { formatCurrency } from '@/utils';

interface SeasonReportProps extends PageProps {
  allSeasons: Season[];
  selectedSeason: Season;
  totalTransactions: number;
  totalPaid: number;
  totalDue: number;
  sackTypeData: Record<string, { quantity: number; total: number }>;
  customerData: (Customer & {
    total_transactions: number;
    total_due: number;
    total_paid: number;
  })[];
}

export default function SeasonReport({
  auth,
  allSeasons,
  selectedSeason,
  totalTransactions,
  totalPaid,
  totalDue,
  sackTypeData,
  customerData,
}: SeasonReportProps) {
  const [seasonId, setSeasonId] = useState(selectedSeason.id.toString());

  // Handle season change
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeasonId = e.target.value;
    setSeasonId(newSeasonId);
    router.get(route('reports.season', { season_id: newSeasonId }));
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-xl text-gray-800 leading-tight">সিজন রিপোর্ট</h2>
          <div className="flex items-center">
            <label htmlFor="season_id" className="mr-2 text-sm font-medium text-gray-700">
              সিজন:
            </label>
            <select
              id="season_id"
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={seasonId}
              onChange={handleSeasonChange}
            >
              {allSeasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
    >
      <Head title={`সিজন রিপোর্ট - ${selectedSeason.name}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Summary */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">সিজন সারসংক্ষেপ: {selectedSeason.name}</h3>

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

          {/* Customer Summary */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              <h3 className="text-lg font-medium text-gray-900 mb-4">গ্রাহক সারসংক্ষেপ</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        গ্রাহকের নাম
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
                        মোট লেনদেন
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        মোট পেমেন্ট
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        বাকি
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          কোন গ্রাহকের তথ্য নেই
                        </td>
                      </tr>
                    ) : (
                      customerData.map((customer) => (
                        <tr key={customer.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {customer.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {customer.area}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(customer.total_transactions)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(customer.total_paid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(customer.total_due)}
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
