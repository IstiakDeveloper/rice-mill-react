import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import InputLabel from './inputLabel';

interface Customer {
    id: number;
    name: string;
    area: string;
    phone_number: string;
}

interface CustomerSelectProps {
    customers: Customer[];
    value: string | number;
    onChange: (customerId: string | number) => void;
    onCreateNew?: () => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
    className?: string;
}

export default function CustomerSelect({
    customers,
    value,
    onChange,
    onCreateNew,
    placeholder = "Search or select customer...",
    error,
    required = false,
    className = ""
}: CustomerSelectProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Safe value handling - prevent null/undefined errors
    const safeValue = value || '';
    const selectedCustomer = customers.find(customer =>
        customer.id === parseInt(safeValue.toString()) ||
        customer.id.toString() === safeValue.toString()
    );

    const filteredCustomers = query === ''
        ? customers
        : customers.filter((customer) =>
            customer.name.toLowerCase().includes(query.toLowerCase()) ||
            customer.area.toLowerCase().includes(query.toLowerCase()) ||
            customer.phone_number.includes(query)
        );

    const displayValue = selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.area}` : '';

    return (
        <div className={className}>
            <InputLabel htmlFor="transaction_date" value="Customer *" />
            <Combobox value={safeValue} onChange={onChange}>
                <div className="relative">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <Combobox.Input
                            className="w-full border-none py-3 pl-4 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none"
                            displayValue={() => displayValue}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                // Clear selection when typing
                                if (event.target.value !== displayValue) {
                                    onChange('');
                                }
                            }}
                            onFocus={() => setIsOpen(true)}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => {
                            setQuery('');
                            setIsOpen(false);
                        }}
                    >
                        <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {/* Quick Create Option */}
                            {onCreateNew && (
                                <div className="border-b border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onCreateNew();
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-3" />
                                        <div className="text-left">
                                            <div className="font-medium">Add New Customer</div>
                                            <div className="text-xs text-gray-500">Create a new customer record</div>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* No Results Message */}
                            {filteredCustomers.length === 0 && query !== '' ? (
                                <div className="relative cursor-default select-none px-4 py-3 text-gray-700">
                                    <div className="flex items-center">
                                        <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                                        <div>
                                            <div className="text-sm">No customers found for "{query}"</div>
                                            <div className="text-xs text-gray-500">Try a different search term or add a new customer</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Customer Options */
                                filteredCustomers.map((customer) => (
                                    <Combobox.Option
                                        key={customer.id}
                                        className={({ active }) =>
                                            `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                            }`
                                        }
                                        value={customer.id}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? 'bg-blue-100' : 'bg-gray-100'
                                                            }`}>
                                                            <UserIcon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-gray-600'
                                                                }`} />
                                                        </div>
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <div className={`block truncate font-medium ${selected ? 'font-semibold' : 'font-normal'
                                                            }`}>
                                                            {customer.name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {customer.area} • {customer.phone_number}
                                                        </div>
                                                    </div>
                                                </div>
                                                {selected ? (
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>

            {error && (
                <div className="flex items-center mt-2">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}
