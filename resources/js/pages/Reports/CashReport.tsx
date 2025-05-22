import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import PrimaryButton from '@/components/primaryButton';
import SelectInput from '@/components/selectInput';
import { formatCurrency } from '@/utils';

interface Season {
    id: number;
    name: string;
}

interface DailyData {
    date: string;
    formatted_date: string;
    day_name: string;
    cash_in: number;
    cash_out: number;
    net_amount: number;
    balance: number;
}

interface ReportData {
    opening_balance: number;
    closing_balance: number;
    total_cash_in: number;
    total_cash_out: number;
    daily_data: DailyData[];
}

interface CashReportProps extends PageProps {
    currentSeason: Season;
    seasons: Season[];
    selectedMonth: number;
    selectedYear: number;
    selectedSeason: number;
    reportData: ReportData;
    monthName: string;
}

export default function CashReport({
    auth,
    currentSeason,
    seasons,
    selectedMonth,
    selectedYear,
    selectedSeason,
    reportData,
    monthName,
}: CashReportProps) {
    const filterForm = useForm({
        season_id: selectedSeason,
        month: selectedMonth,
        year: selectedYear,
    });

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
        years.push(i);
    }

    const applyFilters = () => {
        filterForm.get(route('cash-report.index'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Cash Report - {monthName}
                    </h2>
                </div>
            }
        >
            <Head title="Cash Report" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">

                    {/* Filters */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                                    <SelectInput
                                        value={filterForm.data.season_id}
                                        onChange={(e) => filterForm.setData('season_id', parseInt(e.target.value))}
                                        className="w-full"
                                    >
                                        {seasons.map((season) => (
                                            <option key={season.id} value={season.id}>
                                                {season.name}
                                            </option>
                                        ))}
                                    </SelectInput>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                    <SelectInput
                                        value={filterForm.data.month}
                                        onChange={(e) => filterForm.setData('month', parseInt(e.target.value))}
                                        className="w-full"
                                    >
                                        {months.map((month) => (
                                            <option key={month.value} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </SelectInput>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                    <SelectInput
                                        value={filterForm.data.year}
                                        onChange={(e) => filterForm.setData('year', parseInt(e.target.value))}
                                        className="w-full"
                                    >
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </SelectInput>
                                </div>

                                <div className="flex items-end">
                                    <PrimaryButton onClick={applyFilters} className="w-full">
                                        Show Report
                                    </PrimaryButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-600 font-medium">Opening Balance</p>
                            <p className="text-xl font-bold text-blue-800">
                                {formatCurrency(reportData.opening_balance)}
                            </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-green-600 font-medium">Total Cash IN</p>
                            <p className="text-xl font-bold text-green-700">
                                {formatCurrency(reportData.total_cash_in)}
                            </p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-red-600 font-medium">Total Cash OUT</p>
                            <p className="text-xl font-bold text-red-700">
                                {formatCurrency(reportData.total_cash_out)}
                            </p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-purple-600 font-medium">Closing Balance</p>
                            <p className="text-xl font-bold text-purple-700">
                                {formatCurrency(reportData.closing_balance)}
                            </p>
                        </div>
                    </div>

                    {/* Monthly Cash Report Table */}
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Daily Cash Flow - {monthName}
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase border-r">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-green-50 border-r">
                                            Cash IN
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-red-50 border-r">
                                            Cash OUT
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            Available Balance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {/* Opening Balance Row */}
                                    <tr className="bg-blue-50 border-b-2 border-blue-200">
                                        <td className="px-6 py-4 border-r">
                                            <div className="font-medium text-blue-800">Previous Month Balance</div>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r bg-green-50">
                                            <span className="text-gray-400">-</span>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r bg-red-50">
                                            <span className="text-gray-400">-</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-blue-800">
                                                {formatCurrency(reportData.opening_balance)}
                                            </span>
                                        </td>
                                    </tr>

                                    {/* Daily Data Rows */}
                                    {reportData.daily_data.map((day, index) => (
                                        <tr key={day.date} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                                            <td className="px-6 py-4 border-r">
                                                <div>
                                                    <div className="font-medium text-gray-900">{day.formatted_date}</div>
                                                    <div className="text-xs text-gray-500">{day.day_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center border-r">
                                                {day.cash_in > 0 ? (
                                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                                                        {formatCurrency(day.cash_in)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">0.00</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center border-r">
                                                {day.cash_out > 0 ? (
                                                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">
                                                        {formatCurrency(day.cash_out)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">0.00</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`font-bold ${day.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                    {formatCurrency(day.balance)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Month Summary Row */}
                                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                                        <td className="px-6 py-4 border-r">
                                            <div className="font-bold text-gray-800">Month Total</div>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r">
                                            <span className="bg-green-200 text-green-900 px-3 py-1 rounded-full font-bold">
                                                {formatCurrency(reportData.total_cash_in)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center border-r">
                                            <span className="bg-red-200 text-red-900 px-3 py-1 rounded-full font-bold">
                                                {formatCurrency(reportData.total_cash_out)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold text-lg ${reportData.closing_balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                                {formatCurrency(reportData.closing_balance)}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State */}
                        {reportData.daily_data.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No data available for the selected month.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
