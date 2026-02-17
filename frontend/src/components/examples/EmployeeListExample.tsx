// @ts-nocheck
/**
 * Example Component: Employee List with API Integration
 * 
 * This demonstrates how to use the Pulse API client in a React component.
 * Copy and adapt this pattern for your own components.
 */

'use client';

import { useState, useEffect } from 'react';
import { pulseApi } from '@/lib/api/pulse-client';
import type { Employee, CreateEmployeeRequest } from '@/lib/api/types';

export default function EmployeeListExample() {
    // State management
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalEmployees, setTotalEmployees] = useState(0);
    const itemsPerPage = 10;

    // Load employees on mount and when filters change
    useEffect(() => {
        loadEmployees();
    }, [currentPage, selectedDepartment, searchQuery]);

    /**
     * Load employees from API
     */
    const loadEmployees = async () => {
        setLoading(true);
        setError(null);

        const result = await pulseApi.employees.list({
            skip: currentPage * itemsPerPage,
            limit: itemsPerPage,
            department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
            search: searchQuery || undefined,
        });

        if (result.success && result.data) {
            setEmployees(result.data.employees);
            setTotalEmployees(result.data.total);
        } else {
            setError(result.error || 'Failed to load employees');
        }

        setLoading(false);
    };

    /**
     * Create new employee
     */
    const handleCreateEmployee = async (employeeData: CreateEmployeeRequest) => {
        const result = await pulseApi.employees.create(employeeData);

        if (result.success) {
            // Refresh the list
            await loadEmployees();
            alert('Employee created successfully!');
        } else {
            alert(`Failed to create employee: ${result.error}`);
        }
    };

    /**
     * Update employee
     */
    const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
        const result = await pulseApi.employees.update(id, updates);

        if (result.success) {
            // Update local state
            setEmployees(employees.map(emp =>
                emp.id === id ? { ...emp, ...updates } : emp
            ));
            alert('Employee updated successfully!');
        } else {
            alert(`Failed to update employee: ${result.error}`);
        }
    };

    /**
     * Delete employee
     */
    const handleDeleteEmployee = async (id: string) => {
        if (!confirm('Are you sure you want to delete this employee?')) {
            return;
        }

        const result = await pulseApi.employees.delete(id);

        if (result.success) {
            // Remove from local state
            setEmployees(employees.filter(emp => emp.id !== id));
            setTotalEmployees(totalEmployees - 1);
            alert('Employee deleted successfully!');
        } else {
            alert(`Failed to delete employee: ${result.error}`);
        }
    };

    /**
     * Handle search
     */
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(0); // Reset to first page
    };

    /**
     * Handle department filter
     */
    const handleDepartmentChange = (department: string) => {
        setSelectedDepartment(department);
        setCurrentPage(0); // Reset to first page
    };

    // Calculate pagination
    const totalPages = Math.ceil(totalEmployees / itemsPerPage);
    const hasNextPage = currentPage < totalPages - 1;
    const hasPrevPage = currentPage > 0;

    // Loading state
    if (loading && employees.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="text-lg">Loading employees...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error && employees.length === 0) {
        return (
            <div className="p-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <strong>Error:</strong> {error}
                    <button
                        onClick={loadEmployees}
                        className="ml-4 underline"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-4">Employees</h1>

                {/* Filters */}
                <div className="flex gap-4 mb-4">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="px-4 py-2 border rounded flex-1"
                    />

                    {/* Department Filter */}
                    <select
                        value={selectedDepartment}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="px-4 py-2 border rounded"
                    >
                        <option value="all">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="HR">HR</option>
                    </select>
                </div>

                {/* Stats */}
                <div className="text-sm text-gray-600">
                    Showing {employees.length} of {totalEmployees} employees
                </div>
            </div>

            {/* Employee Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Position
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {employees.map((employee) => (
                            <tr key={employee.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {employee.first_name} {employee.last_name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{employee.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{employee.department}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{employee.position}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : employee.status === 'on_leave'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {employee.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleUpdateEmployee(employee.id, {
                                            salary: '100000.00' // Example update
                                        })}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmployee(employee.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!hasPrevPage || loading}
                        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!hasNextPage || loading}
                        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center">
                    <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
                        Loading...
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Additional Examples
// ============================================================================

/**
 * Example: Login Form Component
 */
export function LoginFormExample() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await pulseApi.auth.login(email, password);

        if (result.success) {
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } else {
            setError(result.error || 'Login failed');
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Login</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
}

/**
 * Example: Create Transaction Form
 */
export function CreateTransactionFormExample() {
    const [formData, setFormData] = useState({
        type: 'expense' as 'income' | 'expense',
        amount: '',
        category: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await pulseApi.finances.createTransaction(formData);

        if (result.success) {
            alert('Transaction created successfully!');
            // Reset form
            setFormData({
                type: 'expense',
                amount: '',
                category: '',
                description: '',
                transaction_date: new Date().toISOString().split('T')[0],
            });
        } else {
            alert(`Failed to create transaction: ${result.error}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">New Transaction</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded"
                >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    rows={3}
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    required
                />
            </div>

            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
                Create Transaction
            </button>
        </form>
    );
}
