import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { 
  Package, 
  Plus, 
  Minus, 
  ArrowRightLeft, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  MapPin,
  Truck,
  BarChart3,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface InventoryFilters {
  district?: string;
  category?: string;
  lowStock?: boolean;
  warehouseId?: string;
}

export const InventoryModule: React.FC = () => {
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [quantityChange, setQuantityChange] = useState(0);
  const [transferQuantity, setTransferQuantity] = useState(0);
  const [targetWarehouse, setTargetWarehouse] = useState('');

  // Get inventory with filters
  const inventory = useQuery(api.inventory.list, filters);
  
  // Get inventory analytics
  const analytics = useQuery(api.inventory.getInventoryAnalytics, {
    district: filters.district
  });

  // Get warehouses for transfer
  const warehouses = useQuery(api.warehouses?.list || "skip", {});

  // Mutations
  const updateQuantity = useMutation(api.inventory.updateQuantity);
  const transferStock = useMutation(api.inventory.transferStock);

  const warsawDistricts = [
    'Śródmieście', 'Mokotów', 'Wilanów', 'Żoliborz', 
    'Ursynów', 'Wola', 'Praga-Południe', 'Targówek'
  ];

  const equipmentCategories = [
    'split_ac', 'multi_split', 'vrf_system', 'heat_pump',
    'thermostat', 'ductwork', 'filter', 'parts', 'tools', 'refrigerant'
  ];

  const handleQuantityUpdate = async (itemId: string, change: number, reason: string) => {
    try {
      await updateQuantity({
        id: itemId as any,
        quantityChange: change,
        reason: reason as any,
        notes: `Manual adjustment: ${change > 0 ? 'added' : 'removed'} ${Math.abs(change)} units`
      });
      toast.success('Inventory updated successfully');
    } catch (error) {
      toast.error('Failed to update inventory');
    }
  };

  const handleTransfer = async () => {
    if (!selectedItem || !targetWarehouse || transferQuantity <= 0) {
      toast.error('Please fill all transfer details');
      return;
    }

    try {
      await transferStock({
        fromInventoryId: selectedItem._id,
        toWarehouseId: targetWarehouse as any,
        quantity: transferQuantity,
        reason: 'Manual transfer between warehouses'
      });
      toast.success('Stock transferred successfully');
      setShowTransferModal(false);
      setSelectedItem(null);
      setTransferQuantity(0);
      setTargetWarehouse('');
    } catch (error) {
      toast.error('Failed to transfer stock');
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'low': return 'text-orange-600 bg-orange-100';
      case 'adequate': return 'text-yellow-600 bg-yellow-100';
      case 'optimal': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderInventoryCard = (item: any) => (
    <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{item.equipment?.name}</h3>
          <p className="text-sm text-gray-600">{item.equipment?.brand} {item.equipment?.model}</p>
          <div className="flex items-center space-x-2 mt-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{item.warehouse?.name} • {item.district}</span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-semibold text-gray-900">{item.quantity}</p>
          <p className="text-xs text-gray-500">units</p>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(item.stockStatus)}`}>
            {item.stockStatus}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Category:</span>
          <span className="capitalize">{item.equipment?.category?.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Min Stock:</span>
          <span>{item.minStockLevel}</span>
        </div>
        {item.threshold && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Optimal:</span>
            <span>{item.threshold.optimal}</span>
          </div>
        )}
        {item.needsReorder && (
          <div className="flex items-center space-x-1 text-sm text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span>Reorder needed</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuantityUpdate(item._id, -1, 'usage')}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove 1 unit"
            disabled={item.quantity <= 0}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleQuantityUpdate(item._id, 1, 'restock')}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Add 1 unit"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedItem(item);
              setShowTransferModal(true);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Transfer Stock"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          Last updated: {new Date(item.lastRestocked).toLocaleDateString('pl-PL')}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {analytics && (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.totalItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Intl.NumberFormat('pl-PL', {
                      style: 'currency',
                      currency: 'PLN'
                    }).format(analytics.totalValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.lowStockItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Stock Level</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(analytics.averageStockLevel)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {analytics.byCategory && Object.keys(analytics.byCategory).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analytics.byCategory).map(([category, data]: [string, any]) => (
                  <div key={category} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 capitalize mb-2">
                      {category.replace('_', ' ')}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items:</span>
                        <span>{data.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Qty:</span>
                        <span>{data.totalQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span>
                          {new Intl.NumberFormat('pl-PL', {
                            style: 'currency',
                            currency: 'PLN'
                          }).format(data.totalValue)}
                        </span>
                      </div>
                      {data.lowStockCount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Low Stock:</span>
                          <span>{data.lowStockCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* District Breakdown */}
          {analytics.byDistrict && Object.keys(analytics.byDistrict).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by District</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(analytics.byDistrict).map(([district, data]: [string, any]) => (
                  <div key={district} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{district}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items:</span>
                        <span>{data.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Qty:</span>
                        <span>{data.totalQuantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span>
                          {new Intl.NumberFormat('pl-PL', {
                            style: 'currency',
                            currency: 'PLN'
                          }).format(data.totalValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="w-6 h-6 mr-2 text-blue-600" />
            Inventory Management
          </h1>
          <p className="text-gray-600">Stock tracking per Warsaw district with delivery optimization</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showAnalytics 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setFilters({ ...filters, lowStock: !filters.lowStock })}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filters.lowStock 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Low Stock
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && renderAnalytics()}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
            <select
              value={filters.district || ''}
              onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Districts</option>
              {warsawDistricts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {equipmentCategories.map(category => (
                <option key={category} value={category}>
                  {category.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({})}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-4">
        {inventory && inventory.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {inventory.map(renderInventoryCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-600">Try adjusting your filters or add new inventory items</p>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Transfer Stock</h2>
              <p className="text-gray-600">{selectedItem.equipment?.name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From: {selectedItem.warehouse?.name} ({selectedItem.quantity} available)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Warehouse</label>
                <select
                  value={targetWarehouse}
                  onChange={(e) => setTargetWarehouse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select warehouse</option>
                  {warehouses?.filter(w => w._id !== selectedItem.warehouseId).map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name} ({warehouse.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedItem(null);
                  setTransferQuantity(0);
                  setTargetWarehouse('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!targetWarehouse || transferQuantity <= 0 || transferQuantity > selectedItem.quantity}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
