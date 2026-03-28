import { API_BASE_URL } from "../config";
import axios from "axios";

export const fetchProducts = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/read.php`);
        return response.data;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

export const fetchProduct = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/single.php?id=${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching product with id ${id}:`, error);
        throw error;
    }
};
