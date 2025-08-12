import { CheckCircleIcon, EyeIcon, InformationCircleIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import simulationService, { type SimulationRequest, type SimulationResult } from '../services/simulationService';

const Simulations: React.FC = () => {
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  // Control the requested page/limit independently to avoid undefined reads
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRunForm, setShowRunForm] = useState(false);
  const [formData, setFormData] = useState<SimulationRequest>({
    driverCount: 0,
    routeStartTime: '',
    maxHours: 0,
    simulationName: '',
  });
  const { user } = useAuth();
  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user]);
  const [selected, setSelected] = useState<number[]>([]);
  const [comparison, setComparison] = useState<any | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [viewItem, setViewItem] = useState<SimulationResult | null>(null);

  useEffect(() => {
    fetchSimulations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const fetchSimulations = async () => {
    try {
      const data = await simulationService.getSimulations(page, limit);
      setSimulations(data.simulations || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error('Failed to fetch simulations:', error);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.driverCount || !formData.routeStartTime || !formData.maxHours) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);

    try {
      await simulationService.runSimulation(formData);
      setShowRunForm(false);
      setFormData({
        driverCount: 0,
        routeStartTime: '',
        maxHours: 0,
        simulationName: '',
      });
      fetchSimulations();
    } catch (error) {
      console.error('Failed to run simulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSimulation = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this simulation?')) {
      try {
        await simulationService.deleteSimulation(id);
        fetchSimulations();
      } catch (error) {
        console.error('Failed to delete simulation:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Simulations</h1>
          <p className="text-gray-600">Run and manage delivery simulations</p>
          {isAdmin && (
            <div className="flex items-center gap-2 ml-4">
              <button
                disabled={selected.length !== 2}
                className="btn-primary disabled:opacity-50"
                onClick={async () => {
                  if (selected.length !== 2) return;
                  try {
                    const data = await simulationService.compareSimulations(selected[0], selected[1]);
                    setComparison(data);
                    setShowCompare(true);
                  } catch (e) {
                    console.error('Compare failed', e);
                  }
                }}
              >
                Compare (2)
              </button>
              <button className="btn-secondary" onClick={() => setSelected([])}>Clear</button>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowRunForm(true)}
          className="btn-primary flex items-center"
        >
          <PlayIcon className="h-5 w-5 mr-2" />
          Run Simulation
        </button>
      </div>

      {/* Run Simulation Form Modal */}
      {showRunForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Run New Simulation</h3>
              <form onSubmit={handleRunSimulation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Simulation Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.simulationName}
                    onChange={(e) => setFormData({ ...formData, simulationName: e.target.value })}
                    className="input-field mt-1"
                    placeholder="Enter simulation name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Drivers <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.driverCount || ''}
                    onChange={(e) => setFormData({ ...formData, driverCount: parseInt(e.target.value) || 0 })}
                    className="input-field mt-1"
                    placeholder="Enter number of drivers"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Route Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.routeStartTime}
                    onChange={(e) => setFormData({ ...formData, routeStartTime: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Hours <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.maxHours || ''}
                    onChange={(e) => setFormData({ ...formData, maxHours: parseInt(e.target.value) || 0 })}
                    className="input-field mt-1"
                    placeholder="Enter maximum hours"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowRunForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.driverCount || !formData.routeStartTime || !formData.maxHours}
                    className="btn-primary"
                  >
                    {isLoading ? 'Running...' : 'Run Simulation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Simulations List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drivers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {simulations.map((simulation) => (
                <tr key={simulation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {simulation.simulationName || `Simulation ${simulation.id}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{simulation.driverCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{simulation.routeStartTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      simulation.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(simulation.totalProfit)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {simulation.efficiencyScore.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(simulation.createdAt)}
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 items-center">
                      {isAdmin && (
                        <input
                          type="checkbox"
                          checked={selected.includes(simulation.id)}
                          onChange={(e) => {
                            setSelected((prev) => {
                              if (e.target.checked) return Array.from(new Set([...prev, simulation.id])).slice(-2);
                              return prev.filter((id) => id !== simulation.id);
                            });
                          }}
                        />
                      )}
                      <button
                        onClick={() => setViewItem(simulation)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSimulation(simulation.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                 onClick={() => setPage((p) => Math.max(1, p - 1))}
                 disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                 onClick={() => setPage((p) => p + 1)}
                 disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                   <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                     {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                   <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                     onClick={() => setPage((p) => Math.max(1, p - 1))}
                     disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                     onClick={() => setPage((p) => p + 1)}
                     disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
        {/* compare controls moved to header */}
      </div>

      {showCompare && comparison && (
        <div className="fixed inset-0 bg-black/40 z-50">
          <div className="relative top-20 mx-auto p-5 w-[42rem] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Simulation Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <h4 className="font-semibold mb-2">Simulation {comparison.simulation1?.id}</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Profit: {comparison.simulation1?.profit}</li>
                  <li>Efficiency: {comparison.simulation1?.efficiency}</li>
                  <li>On-time %: {comparison.simulation1?.onTimeRate?.toFixed?.(1)}</li>
                  <li>Fuel Cost: {comparison.simulation1?.fuelCost}</li>
                  <li>Penalties: {comparison.simulation1?.penalties}</li>
                  <li>Bonuses: {comparison.simulation1?.bonuses}</li>
                </ul>
              </div>
              <div className="card">
                <h4 className="font-semibold mb-2">Simulation {comparison.simulation2?.id}</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Profit: {comparison.simulation2?.profit}</li>
                  <li>Efficiency: {comparison.simulation2?.efficiency}</li>
                  <li>On-time %: {comparison.simulation2?.onTimeRate?.toFixed?.(1)}</li>
                  <li>Fuel Cost: {comparison.simulation2?.fuelCost}</li>
                  <li>Penalties: {comparison.simulation2?.penalties}</li>
                  <li>Bonuses: {comparison.simulation2?.bonuses}</li>
                </ul>
              </div>
            </div>
            {comparison.recommendations?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="list-disc ml-5 text-sm text-gray-700">
                  {comparison.recommendations.map((r: string, idx: number) => (<li key={idx}>{r}</li>))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowCompare(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center min-h-screen">
          <div className="relative mx-auto p-5 w-[40rem] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Simulation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
              <div className="card">
                <ul className="space-y-1">
                  <li><span className="font-semibold">Name:</span> {viewItem.simulationName || `Simulation ${viewItem.id}`}</li>
                  <li><span className="font-semibold">Drivers:</span> {viewItem.driverCount}</li>
                  <li><span className="font-semibold">Start Time:</span> {viewItem.routeStartTime}</li>
                  <li><span className="font-semibold">Max Hours:</span> {viewItem.maxHours}</li>
                  <li><span className="font-semibold">Created:</span> {new Date(viewItem.createdAt).toLocaleString()}</li>
                </ul>
              </div>
              <div className="card">
                <ul className="space-y-1">
                  <li><span className="font-semibold">Total Profit:</span> {formatCurrency(viewItem.totalProfit)}</li>
                  <li><span className="font-semibold">Efficiency:</span> {viewItem.efficiencyScore.toFixed(1)}%</li>
                  <li><span className="font-semibold">On-time Deliveries:</span> {viewItem.onTimeDeliveries}</li>
                  <li><span className="font-semibold">Total Deliveries:</span> {viewItem.totalDeliveries}</li>
                  <li><span className="font-semibold">Fuel Cost:</span> {formatCurrency(viewItem.fuelCost)}</li>
                  <li><span className="font-semibold">Penalties:</span> {formatCurrency(viewItem.penalties)}</li>
                  <li><span className="font-semibold">Bonuses:</span> {formatCurrency(viewItem.bonuses)}</li>
                </ul>
              </div>
            </div>
            {/* Summary cards */}
            {viewItem.simulationData && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {(() => {
                  const summary: any = (viewItem as any).simulationData?.summary || {};
                  const items = [
                    { label: 'Total Orders', value: Number(summary.totalOrders || 0) },
                    { label: 'Total Routes', value: Number(summary.totalRoutes || 0) },
                    { label: 'Profit Margin', value: `${Number(summary.profitMargin || 0).toFixed(2)}%` },
                    { label: 'Avg Efficiency', value: `${Number(summary.averageEfficiency || 0).toFixed(2)}%` },
                  ];
                  return items.map((it, idx) => (
                    <div key={idx} className="card">
                      <div className="text-xs text-gray-500">{it.label}</div>
                      <div className="text-lg font-semibold text-gray-900">{it.value}</div>
                    </div>
                  ));
                })()}
              </div>
            )}
            {/* Extra counts */}
            {viewItem.simulationData && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card flex items-center gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                  <div className="text-sm text-gray-700">Driver assignments: {(viewItem as any).simulationData?.driverAssignments?.length ?? 0}</div>
                </div>
                <div className="card flex items-center gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                  <div className="text-sm text-gray-700">Orders evaluated: {(viewItem as any).simulationData?.orderResults?.length ?? 0}</div>
                </div>
              </div>
            )}
            {/* Recommendations list */}
            {(() => {
              const recs: string[] = (viewItem as any).simulationData?.summary?.recommendations || [];
              return (
                <div className="mt-4 card">
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  {recs.length > 0 ? (
                    <ul className="space-y-2">
                      {recs.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-800">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">No recommendations available.</div>
                  )}
                </div>
              );
            })()}
            <div className="mt-4 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Simulations;
