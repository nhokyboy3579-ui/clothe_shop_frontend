// components/Pagination.js

import React from 'react';

/**
 * Component hiển thị các nút phân trang
 * @param {object} props
 * @param {number} props.currentPage Trang hiện tại
 * @param {number} props.totalPages Tổng số trang
 * @param {function} props.onPageChange Hàm xử lý khi chuyển trang
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null; // Không hiển thị nếu chỉ có 1 trang

    // Logic tạo danh sách các số trang để hiển thị (ví dụ: tối đa 5 nút)
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }
    
    return (
        <div className="flex justify-center items-center space-x-1 mt-6">
            {/* Nút Trang trước */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200 transition-colors"
            >
                &laquo; Trang trước
            </button>

            {/* Danh sách các số trang */}
            {pageNumbers.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 text-sm rounded font-bold transition-colors ${
                        page === currentPage
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border hover:bg-blue-100'
                    }`}
                >
                    {page}
                </button>
            ))}

            {/* Nút Trang sau */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded bg-gray-100 disabled:opacity-50 hover:bg-gray-200 transition-colors"
            >
                Trang sau &raquo;
            </button>
        </div>
    );
}