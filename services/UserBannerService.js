// services/UserBannerService.js

import api from '@/services/axios'; 

const SLIDESHOW_ENDPOINT = '/banners/slideshow';

/**
 * Tải TẤT CẢ Banner Slideshow cho trang chủ.
 * @returns {Promise<Array>}
 */
export const fetchSlideshowBanners = async () => {
    try {
        const res = await api.get(SLIDESHOW_ENDPOINT); 
        return res.data; 
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu Slideshow:", error);
        return []; 
    }
};