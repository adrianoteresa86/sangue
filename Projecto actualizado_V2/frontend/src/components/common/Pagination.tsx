import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex items-center text-sm text-gray-700 mb-4 sm:mb-0">
        <span className="mr-2">Mostrar</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1); // Reset to first page
          }}
          className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:ring-red-500 focus:border-red-500 outline-none cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
        </select>
        <span className="ml-2 hidden sm:inline">
          itens por página. Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de <span className="font-medium">{totalItems}</span> resultados
        </span>
        <span className="ml-2 sm:hidden">
          ({startItem}-{endItem} de {totalItems})
        </span>
      </div>
      
      <div className="flex justify-between items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 sm:px-4 sm:py-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1 hidden sm:block" />
          Anterior
        </Button>
        <div className="text-sm text-gray-700 font-medium">
          Página {currentPage} de {totalPages}
        </div>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2 py-1 sm:px-4 sm:py-2"
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-1 hidden sm:block" />
        </Button>
      </div>
    </div>
  );
};
