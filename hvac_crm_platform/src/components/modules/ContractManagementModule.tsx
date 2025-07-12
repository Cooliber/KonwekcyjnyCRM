import { useMutation, useQuery } from "convex/react";
import {
  Building,
  Calendar,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileSignature,
  FileText,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { WarsawDistrict } from "../../types/hvac";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface Contract {
  _id: Id<"contracts">;
  contractNumber: string;
  title: string;
  type: "installation" | "maintenance" | "service" | "warranty" | "lease" | "support";
  status:
    | "draft"
    | "pending_approval"
    | "active"
    | "suspended"
    | "expired"
    | "terminated"
    | "renewed";
  clientId: Id<"contacts">;
  clientName: string;
  clientAddress: string;
  district: WarsawDistrict;
  startDate: number;
  endDate: number;
  value: number;
  vatAmount: number;
  totalValue: number;
  currency: string;
  description: string;
  terms: string;
  equipmentIds: Id<"equipment">[];
  serviceLevel: "basic" | "standard" | "premium" | "enterprise";
  paymentTerms: string;
  renewalDate?: number;
  signedDate?: number;
  createdAt: number;
  updatedAt: number;
  digitalSignature?: {
    signatureData: string;
    timestamp: number;
    ipAddress: string;
  };
  performanceMetrics?: {
    slaCompliance: number;
    customerSatisfaction: number;
    responseTime: number;
    completionRate: number;
  };
  autoRenewal: boolean;
  gdprConsent: boolean;
  dataRetentionPeriod: number;
  districtPriority: number;
  routeOptimized: boolean;
  createdBy: Id<"users">;
  lastModifiedBy: Id<"users">;
}

interface ContractTemplate {
  _id: string;
  name: string;
  type: Contract["type"];
  template: string;
  variables: string[];
  isActive: boolean;
}

export function ContractManagementModule() {
  const [activeTab, setActiveTab] = useState("contracts");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [_selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [_isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [_isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  // Real Convex queries
  const contracts =
    useQuery(api.contracts.getContracts, {
      status: statusFilter !== "all" ? (statusFilter as any) : undefined,
      district: districtFilter !== "all" ? districtFilter : undefined,
      type: typeFilter !== "all" ? (typeFilter as any) : undefined,
      limit: 50,
    }) || [];

  const createContract = useMutation(api.contracts.createContract);
  const updateContract = useMutation(api.contracts.updateContract);
  const signContract = useMutation(api.contracts.signContract);
  const renewContract = useMutation(api.contracts.renewContract);

  // Search functionality
  const searchResults = useQuery(
    api.contracts.searchContracts,
    searchTerm
      ? {
          searchTerm,
          filters: {
            status: statusFilter !== "all" ? statusFilter : undefined,
            type: typeFilter !== "all" ? typeFilter : undefined,
            district: districtFilter !== "all" ? districtFilter : undefined,
          },
        }
      : undefined
  );

  // Use search results if searching, otherwise use filtered contracts
  const displayContracts = searchTerm && searchResults ? searchResults : contracts;

  // Mock contract templates - these could also be moved to Convex
  const _templates: ContractTemplate[] = [
    {
      _id: "t1",
      name: "Standardowa instalacja klimatyzacji",
      type: "installation",
      template: "Szablon dla standardowych instalacji...",
      variables: ["clientName", "address", "equipmentType", "value"],
      isActive: true,
    },
    {
      _id: "t2",
      name: "Kontrakt serwisowy roczny",
      type: "maintenance",
      template: "Szablon dla kontraktów serwisowych...",
      variables: ["clientName", "serviceLevel", "frequency", "value"],
      isActive: true,
    },
  ];

  // No need for additional filtering since we're using Convex queries with filters
  const filteredContracts = displayContracts;

  const getStatusBadge = (status: Contract["status"]) => {
    const variants = {
      draft: "secondary",
      pending_approval: "warning",
      active: "success",
      suspended: "warning",
      expired: "destructive",
      terminated: "destructive",
      renewed: "default",
    } as const;

    const labels = {
      draft: "Szkic",
      pending_approval: "Oczekuje zatwierdzenia",
      active: "Aktywny",
      suspended: "Zawieszony",
      expired: "Wygasły",
      terminated: "Rozwiązany",
      renewed: "Odnowiony",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: Contract["type"]) => {
    const labels = {
      installation: "Instalacja",
      maintenance: "Serwis",
      service: "Usługa",
      warranty: "Gwarancja",
      lease: "Leasing",
      support: "Wsparcie",
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  const handleCreateContract = async (contractData: any) => {
    try {
      const _contractId = await createContract({
        contractNumber: contractData.contractNumber,
        title: contractData.title,
        type: contractData.type,
        clientId: contractData.clientId,
        clientName: contractData.clientName,
        clientAddress: contractData.clientAddress,
        district: contractData.district,
        startDate: new Date(contractData.startDate).getTime(),
        endDate: new Date(contractData.endDate).getTime(),
        value: contractData.value,
        description: contractData.description,
        terms: contractData.terms,
        equipmentIds: contractData.equipmentIds || [],
        serviceLevel: contractData.serviceLevel,
        paymentTerms: contractData.paymentTerms,
        autoRenewal: contractData.autoRenewal,
        gdprConsent: true,
        dataRetentionPeriod: contractData.dataRetentionPeriod || 60,
      });

      toast.success(`Umowa ${contractData.contractNumber} została utworzona`);
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error(`Błąd podczas tworzenia umowy: ${error}`);
    }
  };

  const handleEditContract = async (contract: Contract, updates: any) => {
    try {
      await updateContract({
        contractId: contract._id,
        updates,
      });

      toast.success(`Umowa ${contract.contractNumber} została zaktualizowana`);
    } catch (error) {
      toast.error(`Błąd podczas aktualizacji umowy: ${error}`);
    }
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    toast.success(`Otwieranie umowy ${contract.contractNumber}`);
  };

  const handleDownloadContract = (contract: Contract) => {
    // This would integrate with document generation service
    toast.success(`Pobieranie umowy ${contract.contractNumber}`);
  };

  const handleSignContract = async (contract: Contract) => {
    try {
      // This would integrate with digital signature service
      await signContract({
        contractId: contract._id,
        signedBy: "Current User", // Would get from auth context
        signatureData: "digital_signature_data", // Would come from signature pad
        ipAddress: "127.0.0.1", // Would get real IP
      });

      toast.success(`Umowa ${contract.contractNumber} została podpisana cyfrowo`);
    } catch (error) {
      toast.error(`Błąd podczas podpisywania umowy: ${error}`);
    }
  };

  const handleRenewContract = async (contract: Contract) => {
    try {
      const newEndDate = new Date(contract.endDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);

      await renewContract({
        contractId: contract._id,
        newEndDate: newEndDate.getTime(),
      });

      toast.success(`Umowa ${contract.contractNumber} została odnowiona`);
    } catch (error) {
      toast.error(`Błąd podczas odnawiania umowy: ${error}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pl-PL");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zarządzanie Umowami</h1>
          <p className="text-gray-600 mt-1">
            Kompleksowe zarządzanie umowami HVAC z podpisem cyfrowym
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateContract} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Nowa Umowa
          </Button>
          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Szablony
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contracts">Umowy</TabsTrigger>
          <TabsTrigger value="templates">Szablony</TabsTrigger>
          <TabsTrigger value="signatures">Podpisy</TabsTrigger>
          <TabsTrigger value="analytics">Analityka</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Szukaj umów..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie statusy</SelectItem>
                    <SelectItem value="draft">Szkic</SelectItem>
                    <SelectItem value="pending_approval">Oczekuje zatwierdzenia</SelectItem>
                    <SelectItem value="active">Aktywny</SelectItem>
                    <SelectItem value="suspended">Zawieszony</SelectItem>
                    <SelectItem value="expired">Wygasły</SelectItem>
                    <SelectItem value="terminated">Rozwiązany</SelectItem>
                    <SelectItem value="renewed">Odnowiony</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie typy</SelectItem>
                    <SelectItem value="installation">Instalacja</SelectItem>
                    <SelectItem value="maintenance">Serwis</SelectItem>
                    <SelectItem value="service">Usługa</SelectItem>
                    <SelectItem value="warranty">Gwarancja</SelectItem>
                    <SelectItem value="lease">Leasing</SelectItem>
                    <SelectItem value="support">Wsparcie</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={districtFilter} onValueChange={setDistrictFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dzielnica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie dzielnice</SelectItem>
                    <SelectItem value="Śródmieście">Śródmieście</SelectItem>
                    <SelectItem value="Mokotów">Mokotów</SelectItem>
                    <SelectItem value="Wilanów">Wilanów</SelectItem>
                    <SelectItem value="Żoliborz">Żoliborz</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtry
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contracts List */}
          <div className="grid gap-4">
            {filteredContracts.map((contract) => (
              <Card key={contract._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{contract.title}</h3>
                        {getStatusBadge(contract.status)}
                        {getTypeBadge(contract.type)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{contract.contractNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{contract.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{contract.district}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatCurrency(contract.totalValue)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                          </span>
                        </div>
                        {contract.digitalSignature && (
                          <div className="flex items-center gap-1">
                            <FileSignature className="w-4 h-4" />
                            <span>Podpisana cyfrowo</span>
                          </div>
                        )}
                        {contract.signedDate && !contract.digitalSignature && (
                          <div className="flex items-center gap-1">
                            <FileSignature className="w-4 h-4" />
                            <span>Podpisana {formatDate(contract.signedDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewContract(contract)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditContract(contract, {})}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadContract(contract)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {(contract.status === "pending_approval" || contract.status === "draft") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSignContract(contract)}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        >
                          <FileSignature className="w-4 h-4" />
                        </Button>
                      )}
                      {contract.status === "active" && contract.autoRenewal && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRenewContract(contract)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Szablony Umów</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Zarządzanie szablonami umów będzie dostępne wkrótce...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signatures">
          <Card>
            <CardHeader>
              <CardTitle>Podpisy Cyfrowe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Moduł podpisów cyfrowych będzie dostępny wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analityka Umów</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analityka umów będzie dostępna wkrótce...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
