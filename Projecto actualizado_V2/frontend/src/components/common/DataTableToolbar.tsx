import React from 'react';
import { Search, Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onExport: () => void;
}

export const DataTableToolbar: React.FC<DataTableToolbarProps> = ({
  searchTerm,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onExport,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="relative w-full md:w-96 shrink-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm transition-colors"
          placeholder={t('common.search_placeholder', 'Pesquisar...')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        {filters.map((filter) => (
          <div key={filter.key} className="relative flex-1 sm:flex-none min-w-37.5">
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg border appearance-none bg-white"
              value={filterValues[filter.key] || ''}
              onChange={(e) => onFilterChange && onFilterChange(filter.key, e.target.value)}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 px-2 flex items-center">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ))}
        <button
          onClick={onExport}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          {t('common.export_xls', 'Exportar XLS')}
        </button>
      </div>
    </div>
  );
};

export const exportToXLS = (data: any[], fileName: string) => {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
