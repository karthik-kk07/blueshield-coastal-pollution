import React, { useState, useEffect } from 'react';
import {
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  toggleOrganizationActive,
  seedDefaultOrganizations,
} from '../../services/organizationService';
import { OrganizationDoc, OrganizationType } from '../../types/firestore';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  X,
  Radio,
  Cpu,
} from 'lucide-react';

interface OrganizationManagerProps {
  isAdmin?: boolean;
}

export const ORGANIZATION_TYPES: {
  key: OrganizationType;
  label: string;
  badgeClass: string;
}[] = [
  { key: 'MUNICIPAL', label: 'Municipal Corporation', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'NGO', label: 'Accredited NGO', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { key: 'VOLUNTEER_GROUP', label: 'Volunteer Group', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { key: 'CLEANUP_TEAM', label: 'Cleanup Team / Crew', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { key: 'OTHER', label: 'Maritime / Port / Other', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' },
];

export const OrganizationManager: React.FC<OrganizationManagerProps> = ({ isAdmin = true }) => {
  const [organizations, setOrganizations] = useState<OrganizationDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationDoc | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: OrganizationType;
    contactName: string;
    email: string;
    phone: string;
    coverageArea: string;
    active: boolean;
  }>({
    name: '',
    type: 'MUNICIPAL',
    contactName: '',
    email: '',
    phone: '',
    coverageArea: '',
    active: true,
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadOrgs();
  }, []);

  const loadOrgs = async () => {
    setIsLoading(true);
    try {
      const orgs = await listOrganizations();
      setOrganizations(orgs);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingOrg(null);
    setFormData({
      name: '',
      type: 'MUNICIPAL',
      contactName: '',
      email: '',
      phone: '',
      coverageArea: 'Visakhapatnam Shoreline Sector',
      active: true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (org: OrganizationDoc) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      type: (org.type?.toUpperCase() as OrganizationType) || 'OTHER',
      contactName: org.contactName || '',
      email: org.email || org.contactEmail || '',
      phone: org.phone || org.contactPhone || '',
      coverageArea: org.coverageArea || org.jurisdictionZone || '',
      active: org.active ?? true,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (org: OrganizationDoc) => {
    try {
      await toggleOrganizationActive(org.id, !org.active);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === org.id ? { ...o, active: !o.active } : o))
      );
    } catch (err) {
      console.error('Failed to toggle organization status:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove organization "${name}" from the dispatch registry?`)) {
      return;
    }
    try {
      await deleteOrganization(id);
      setOrganizations((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('Failed to delete organization:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Organization name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingOrg) {
        await updateOrganization(editingOrg.id, {
          name: formData.name.trim(),
          type: formData.type,
          contactName: formData.contactName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          coverageArea: formData.coverageArea.trim(),
          active: formData.active,
        });
        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === editingOrg.id
              ? {
                  ...o,
                  name: formData.name.trim(),
                  type: formData.type,
                  contactName: formData.contactName.trim(),
                  email: formData.email.trim(),
                  phone: formData.phone.trim(),
                  coverageArea: formData.coverageArea.trim(),
                  active: formData.active,
                }
              : o
          )
        );
      } else {
        const created = await createOrganization({
          name: formData.name.trim(),
          type: formData.type,
          contactName: formData.contactName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          coverageArea: formData.coverageArea.trim(),
          active: formData.active,
        });
        setOrganizations((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error('Error saving organization:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save organization.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Seed/reset default Visakhapatnam response organizations?')) return;
    try {
      await seedDefaultOrganizations();
      await loadOrgs();
    } catch (err) {
      console.error('Failed to seed default organizations:', err);
    }
  };

  // Filtered organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.contactName && org.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.coverageArea && org.coverageArea.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      selectedTypeFilter === 'all' || org.type?.toUpperCase() === selectedTypeFilter.toUpperCase();

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                Organization Dispatch Registry
              </h2>
              <span className="text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-semibold">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage accredited municipal wings, NGOs, volunteer groups, and cleanup teams available for coastal pollution remediation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Seed default Visakhapatnam coastal organizations"
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Organization</span>
              </button>
            )}
          </div>
        </div>

        {/* Integration Architecture Notice */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
          <Cpu className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800">
              Internal Organization Routing System
            </span>
            <p className="text-[11px] text-slate-500 leading-snug">
              This operational registry uses an internal dispatch routing table. The architecture is engineered with decoupled gateway interfaces to allow direct official municipal integration (e.g. GVMC civic dispatch APIs) in production deployments.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search organizations by name, contact, or coverage area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            />
          </div>
          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Organization Types</option>
              {ORGANIZATION_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading organization registry...</p>
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No organizations found</p>
          <p className="text-[11px] text-slate-500">
            {searchTerm ? 'Try adjusting your search query.' : 'Click "Add Organization" to register a new response partner.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOrgs.map((org) => {
            const typeConfig = ORGANIZATION_TYPES.find(
              (t) => t.key === org.type?.toUpperCase()
            ) || {
              key: 'OTHER' as OrganizationType,
              label: org.type || 'Other',
              badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
            };

            return (
              <div
                key={org.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs transition-all flex flex-col justify-between gap-3 ${
                  org.active
                    ? 'border-slate-200 hover:border-teal-300'
                    : 'border-slate-200 bg-slate-50/70 opacity-70'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${typeConfig.badgeClass}`}
                    >
                      {typeConfig.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(org)}
                      title={org.active ? 'Active (Click to deactivate)' : 'Inactive (Click to activate)'}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        org.active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {org.active ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {org.name}
                    </h3>
                    {org.contactName && (
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                        Contact: {org.contactName}
                      </p>
                    )}
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1 text-xs text-slate-600 font-mono">
                    {(org.email || org.contactEmail) && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{org.email || org.contactEmail}</span>
                      </div>
                    )}
                    {(org.phone || org.contactPhone) && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{org.phone || org.contactPhone}</span>
                      </div>
                    )}
                    {(org.coverageArea || org.jurisdictionZone) && (
                      <div className="flex items-start gap-1.5 text-[11px] font-sans text-slate-600 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{org.coverageArea || org.jurisdictionZone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card actions */}
                {isAdmin && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(org)}
                      className="px-2.5 py-1 rounded text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(org.id, org.name)}
                      className="px-2.5 py-1 rounded text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingOrg ? 'Edit Organization' : 'Register New Response Organization'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GVMC Beach Sanitation Wing, Sea Shepherd Vizag..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Organization Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as OrganizationType })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-600 font-medium"
                  >
                    {ORGANIZATION_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. E. Ramana Murthy"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@org.gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Phone / Helpline
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 891 2746401"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Shoreline Coverage Area / Jurisdiction
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramakrishna (RK) Beach to Lawson's Bay Intertidal Sands"
                  value={formData.coverageArea}
                  onChange={(e) => setFormData({ ...formData, coverageArea: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-slate-800 select-none cursor-pointer">
                  Active for automatic &amp; manual assignment routing
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingOrg ? 'Save Changes' : 'Register Organization'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
