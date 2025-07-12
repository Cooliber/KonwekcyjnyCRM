import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Search, Package, AlertTriangle, Edit } from "lucide-react";
import { toast } from "sonner";

export function EquipmentModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const equipment = useQuery(api.equipment.list, {
    category: filterCategory || undefined,
    search: searchQuery || undefined,
    lowStock: showLowStock || undefined,
  });

  const createEquipment = useMutation(api.equipment.create);
  const updateEquipment = useMutation(api.equipment.update);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    category: "split_ac" as "split_ac" | "multi_split" | "vrf_system" | "heat_pump" | "thermostat" | "ductwork" | "filter" | "parts" | "tools" | "refrigerant",
    serialNumber: "",
    purchasePrice: "",
    sellPrice: "",
    quantity: "",
    minStock: "",
    supplier: "",
    location: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEquipment({
        ...formData,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        sellPrice: formData.sellPrice ? parseFloat(formData.sellPrice) : undefined,
        quantity: parseInt(formData.quantity),
        minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
      });
      toast.success("Equipment added successfully");
      setShowAddForm(false);
      setFormData({
        name: "",
        brand: "",
        model: "",
        category: "split_ac",
        serialNumber: "",
        purchasePrice: "",
        sellPrice: "",
        quantity: "",
        minStock: "",
        supplier: "",
        location: "",
        description: "",
      });
    } catch (error) {
      toast.error("Failed to add equipment");
    }
  };

  const categoryLabels: Record<string, string> = {
    split_ac: "Split AC",
    multi_split: "Multi Split",
    vrf_system: "VRF System", 
    heat_pump: "Heat Pump",
    thermostat: "Thermostat",
    ductwork: "Ductwork",
    filter: "Filter",
    parts: "Parts",
    tools: "Tools",
    refrigerant: "Refrigerant",
    hvac_unit: "HVAC Unit", // Legacy support
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Inventory</h1>
          <p className="text-gray-600">Manage HVAC equipment and parts inventory</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Equipment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="hvac_unit">HVAC Units</option>
            <option value="thermostat">Thermostats</option>
            <option value="ductwork">Ductwork</option>
            <option value="filter">Filters</option>
            <option value="parts">Parts</option>
            <option value="tools">Tools</option>
          </select>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment && equipment.length > 0 ? (
          equipment.map((item) => {
            const isLowStock = item.minStock && item.quantity <= item.minStock;
            
            return (
              <div key={item._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${isLowStock ? "bg-red-100" : "bg-blue-100"}`}>
                      <Package className={`w-5 h-5 ${isLowStock ? "text-red-600" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{categoryLabels[item.category]}</p>
                    </div>
                  </div>
                  {isLowStock && (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">Low Stock</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Brand:</span>
                    <span className="text-gray-900">{item.brand}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Model:</span>
                    <span className="text-gray-900">{item.model}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Quantity:</span>
                    <span className={`font-medium ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
                      {item.quantity}
                      {item.minStock && ` / ${item.minStock} min`}
                    </span>
                  </div>
                  {item.location && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location:</span>
                      <span className="text-gray-900">{item.location}</span>
                    </div>
                  )}
                  {item.sellPrice && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="text-gray-900 font-medium">${item.sellPrice}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1">
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <div className="text-xs text-gray-500">
                    {item.serialNumber && `S/N: ${item.serialNumber}`}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No equipment found</p>
          </div>
        )}
      </div>

      {/* Add Equipment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Equipment</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="split_ac">Split AC</option>
                    <option value="multi_split">Multi Split</option>
                    <option value="vrf_system">VRF System</option>
                    <option value="heat_pump">Heat Pump</option>
                    <option value="thermostat">Thermostat</option>
                    <option value="ductwork">Ductwork</option>
                    <option value="filter">Filter</option>
                    <option value="parts">Parts</option>
                    <option value="tools">Tools</option>
                    <option value="refrigerant">Refrigerant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price (PLN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sell Price (PLN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Warehouse A, Shelf 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}