"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";

// Import Services
import {
  fetchProductData,
  saveProduct,
  deleteProduct,
} from "@/services/admin/ProductService";
import {
  getProductImages,
  uploadProductImages,
  deleteProductImage,
} from "@/services/admin/ProductImageService";
import {
  getAttributeDefinitions,
  getProductAttributes,
  addProductAttribute,
  deleteProductAttribute,
} from "@/services/admin/ProductAttributeService";

export default function AdminProducts() {
  const router = useRouter();

  // --- STATE DỮ LIỆU CHÍNH ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PHÂN TRANG & TÌM KIẾM & LỌC ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(""); // State lọc danh mục
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- STATE MODAL FORM (THÊM/SỬA SẢN PHẨM) ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const initialForm = {
    name: "",
    slug: "",
    category_id: "",
    price_buy: 0,
    description: "",
    content: "",
    status: "0",
  };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // --- STATE MODAL GALLERY ---
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryProductId, setGalleryProductId] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const fileInputRef = useRef(null);

  // --- STATE MODAL ATTRIBUTE ---
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrProductId, setAttrProductId] = useState(null);
  const [attrDefinitions, setAttrDefinitions] = useState([]);
  const [currentAttrs, setCurrentAttrs] = useState([]);
  const [newAttrData, setNewAttrData] = useState({
    attribute_id: "",
    value: "",
  });
  const [attrLoading, setAttrLoading] = useState(false);

  // Helper: Chuyển tên thành slug
  const toSlug = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  // 1. Load dữ liệu ban đầu
  const fetchData = async () => {
    try {
      const data = await fetchProductData();
      setProducts(data.products);
      setCategories(data.categories);
    } catch (error) {
      toast.error(error.message || "Lỗi tải dữ liệu sản phẩm");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIC LỌC VÀ PHÂN TRANG ---
  const { paginatedProducts, totalPages, totalFilteredItems } = useMemo(() => {
    const term = searchTerm.toLowerCase();

    // Thực hiện lọc dữ liệu
    const filtered = products.filter((p) => {
      const matchSearch =
        p.name?.toLowerCase().includes(term) ||
        p.slug?.toLowerCase().includes(term);
      const matchCategory =
        selectedCategory === "" ||
        String(p.category_id) === String(selectedCategory);
      return matchSearch && matchCategory;
    });

    const totalFilteredItems = filtered.length;
    const totalPagesCount = Math.ceil(totalFilteredItems / itemsPerPage) || 1;

    // Nếu lọc làm giảm số trang, đưa người dùng về trang cuối khả dụng hoặc trang 1
    const adjustedPage = currentPage > totalPagesCount ? 1 : currentPage;

    const startIndex = (adjustedPage - 1) * itemsPerPage;
    return {
      paginatedProducts: filtered.slice(startIndex, startIndex + itemsPerPage),
      totalPages: totalPagesCount,
      totalFilteredItems,
    };
  }, [products, searchTerm, selectedCategory, currentPage, itemsPerPage]);

  // --- HANDLERS PRODUCT CRUD ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialForm);
    setImageFile(null);
    setImagePreview(null);
    setValidationErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setIsEditing(true);
    setEditId(product.id);
    setFormData({
      name: product.name,
      slug: product.slug || toSlug(product.name),
      category_id: product.category_id || "",
      price_buy: product.price_buy || product.price,
      description: product.description || "",
      content: product.content || "",
      status: String(product.status),
    });
    setImageFile(null);
    setImagePreview(product.image || null);
    setValidationErrors({});
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let newSlug = prev.slug;
      if (name === "name" && !isEditing) newSlug = toSlug(value);
      if (name === "slug") newSlug = value;
      if (name === "slug" && value === "") newSlug = toSlug(formData.name);
      return { ...prev, [name]: value, slug: newSlug };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors({});
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (!formData.slug) data.append("slug", toSlug(formData.name));
    if (imageFile) data.append("image", imageFile);

    try {
      await saveProduct(data, isEditing ? editId : null);
      toast.success(
        isEditing
          ? "Cập nhật sản phẩm thành công!"
          : "Thêm mới sản phẩm thành công!"
      );
      setShowModal(false);
      if (!isEditing) setCurrentPage(1);
      fetchData();
    } catch (error) {
      const errors = error.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat()[0]
        : error.response?.data?.message || "Có lỗi xảy ra";
      setValidationErrors(errors || {});
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;
    try {
      await deleteProduct(id);
      toast.success("Đã xóa sản phẩm thành công!");
      fetchData();
    } catch (error) {
      toast.error("Xóa thất bại. Vui lòng thử lại.");
    }
  };

  // --- HANDLERS GALLERY ---
  const handleOpenGallery = async (productId) => {
    setGalleryProductId(productId);
    setNewGalleryFiles([]);
    setGalleryImages([]);
    setGalleryLoading(true);
    setShowGalleryModal(true);
    try {
      const images = await getProductImages(productId);
      setGalleryImages(Array.isArray(images) ? images : []);
    } catch (error) {
      toast.error("Không tải được thư viện ảnh");
      setGalleryImages([]);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleGalleryFileChange = (e) => {
    if (e.target.files) setNewGalleryFiles(Array.from(e.target.files));
  };

  const handleUploadGallery = async () => {
    if (newGalleryFiles.length === 0)
      return toast.error("Vui lòng chọn ít nhất một ảnh!");
    const formData = new FormData();
    newGalleryFiles.forEach((file) => formData.append("images[]", file));
    setGalleryLoading(true);
    try {
      const res = await uploadProductImages(galleryProductId, formData);
      toast.success("Tải ảnh lên thành công!");
      const newImages = res.data || res || [];
      setGalleryImages((prev) => [
        ...prev,
        ...(Array.isArray(newImages) ? newImages : []),
      ]);
      setNewGalleryFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("Lỗi khi tải ảnh lên");
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleDeleteGalleryImage = async (imageId) => {
    if (!confirm("Xóa ảnh này khỏi thư viện?")) return;
    try {
      await deleteProductImage(imageId);
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success("Đã xóa ảnh thành công!");
    } catch (error) {
      toast.error("Lỗi khi xóa ảnh");
    }
  };

  // --- HANDLERS ATTRIBUTE ---
  const handleOpenAttribute = async (productId) => {
    setAttrProductId(productId);
    setNewAttrData({ attribute_id: "", value: "" });
    setCurrentAttrs([]);
    setAttrLoading(true);
    setShowAttrModal(true);
    try {
      const [definitions, productAttrs] = await Promise.all([
        getAttributeDefinitions(),
        getProductAttributes(productId),
      ]);
      setAttrDefinitions(definitions);
      setCurrentAttrs(productAttrs);
    } catch (error) {
      toast.error("Không tải được thông tin thuộc tính");
    } finally {
      setAttrLoading(false);
    }
  };

  const handleAddAttribute = async () => {
    if (!newAttrData.attribute_id || !newAttrData.value) {
      return toast.error("Vui lòng chọn loại thuộc tính và nhập giá trị!");
    }
    setAttrLoading(true);
    try {
      const res = await addProductAttribute(attrProductId, newAttrData);
      toast.success("Thêm thuộc tính thành công!");
      const newItem = res.data.data || res.data;
      setCurrentAttrs((prev) => [...prev, newItem]);
      setNewAttrData({ ...newAttrData, value: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm thuộc tính");
    } finally {
      setAttrLoading(false);
    }
  };

  const handleDeleteAttribute = async (id) => {
    if (!confirm("Bạn chắc chắn muốn xóa giá trị này?")) return;
    try {
      await deleteProductAttribute(id);
      setCurrentAttrs((prev) => prev.filter((item) => item.id !== id));
      toast.success("Đã xóa thuộc tính thành công!");
    } catch (error) {
      toast.error("Lỗi khi xóa thuộc tính");
    }
  };

  // --- COMPONENT TABLE ---
  const ProductTable = ({ data, onEdit, onDelete, onGallery, onAttribute }) => {
    const formatPriceDisplay = (price) =>
      new Intl.NumberFormat("vi-VN").format(price);

    if (data.length === 0)
      return (
        <div className="p-10 text-center text-gray-500 italic">
          Không tìm thấy sản phẩm nào phù hợp.
        </div>
      );

    return (
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700">
          <tr>
            <th className="p-4">ID</th>
            <th className="p-4">Ảnh</th>
            <th className="p-4">Tên sản phẩm</th>
            <th className="p-4">Giá mua</th>
            <th className="p-4">Danh mục</th>
            <th className="p-4">Trạng thái</th>
            <th className="p-4 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {data.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="p-4 font-mono">{p.id}</td>
              <td className="p-4">
                <div className="relative w-10 h-10 border rounded bg-gray-100">
                  <Image
                    src={p.image || "https://placehold.co/40x40?text=No+Img"}
                    alt={p.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </td>
              <td className="p-4 font-bold">{p.name}</td>
              <td className="p-4 text-red-600">
                {formatPriceDisplay(p.price_buy || p.price)} đ
              </td>
              <td className="p-4 text-gray-500">{p.category_name || "N/A"}</td>
              <td className="p-4">
                {p.status == 0 ? (
                  <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold">
                    Active
                  </span>
                ) : (
                  <span className="text-red-500 bg-red-100 px-2 py-1 rounded text-xs font-bold">
                    Hidden
                  </span>
                )}
              </td>
              <td className="p-4 text-center whitespace-nowrap">
                <button
                  onClick={() => onGallery(p.id)}
                  className="text-purple-600 font-bold mr-3 hover:underline"
                >
                  Ảnh phụ
                </button>
                <button
                  onClick={() => onAttribute(p.id)}
                  className="text-orange-600 font-bold mr-3 hover:underline"
                >
                  Thuộc tính
                </button>
                <button
                  onClick={() => onEdit(p)}
                  className="text-blue-600 font-bold mr-3 hover:underline"
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="text-red-600 font-bold hover:underline"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading)
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#333",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            borderRadius: "8px",
            fontSize: "14px",
          },
          success: { style: { borderLeft: "5px solid #22c55e" } },
          error: { style: { borderLeft: "5px solid #ef4444" } },
        }}
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 uppercase">
          Quản lý Sản phẩm
        </h2>
        <button
          onClick={handleOpenAdd}
          className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 shadow"
        >
          + Thêm Sản phẩm
        </button>
      </div>

      {/* TÌM KIẾM & LỌC DANH MỤC */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-1 gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc slug..."
            className="flex-1 max-w-sm p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="w-48 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">-- Tất cả danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {(searchTerm || selectedCategory) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Xóa lọc
            </button>
          )}
        </div>
        <div className="text-sm text-gray-600 font-medium">
          Hiển thị {paginatedProducts.length} / {totalFilteredItems} mục.
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto border-l-4 border-red-500">
        <ProductTable
          data={paginatedProducts}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onGallery={handleOpenGallery}
          onAttribute={handleOpenAttribute}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* --- MODAL PRODUCT FORM --- (Giữ nguyên phần modal của bạn) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center sticky top-0">
              <h3 className="font-bold text-lg uppercase">
                {isEditing ? "Cập nhật" : "Thêm mới"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-2xl">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {/* Phần Avatar & Upload */}
              <div className="flex justify-center flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-2">
                  <div className="relative w-24 h-24 rounded-lg border-2 border-gray-300 bg-white p-1">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Product"
                        fill
                        className="object-cover rounded-lg"
                        unoptimized
                      />
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center text-gray-400">
                        No Img
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 shadow border-2 border-white z-10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                      />
                    </svg>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Tên SP</label>
                  <input
                    type="text"
                    name="name"
                    className="border p-2 rounded w-full"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    className="border p-2 rounded w-full"
                    value={formData.slug}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Giá</label>
                  <input
                    type="number"
                    name="price_buy"
                    className="border p-2 rounded w-full"
                    value={formData.price_buy}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Danh mục
                  </label>
                  <select
                    name="category_id"
                    className="border p-2 rounded w-full"
                    value={formData.category_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Chọn --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">
                  Trạng thái
                </label>
                <select
                  name="status"
                  className="border p-2 rounded w-full"
                  value={formData.status}
                  onChange={handleFormChange}
                >
                  <option value="0">Active</option>
                  <option value="1">Hidden</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">
                  Mô tả ngắn
                </label>
                <textarea
                  name="description"
                  className="border p-2 rounded w-full"
                  rows="2"
                  value={formData.description}
                  onChange={handleFormChange}
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-1">Chi tiết</label>
                <textarea
                  name="content"
                  className="border p-2 rounded w-full"
                  rows="4"
                  value={formData.content}
                  onChange={handleFormChange}
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded"
                >
                  {isSubmitting ? "..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL GALLERY --- (Giữ nguyên) */}
      {showGalleryModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="bg-purple-700 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h3 className="font-bold uppercase">
                Thư viện ảnh (ID: {galleryProductId})
              </h3>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white p-4 mb-6 border border-dashed border-purple-300 rounded">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleGalleryFileChange}
                />
                <button
                  onClick={handleUploadGallery}
                  disabled={galleryLoading}
                  className="ml-2 bg-purple-600 text-white px-4 py-1 rounded"
                >
                  Upload
                </button>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {galleryImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square border rounded"
                  >
                    <Image
                      src={
                        img.image_url || img.url || "https://placehold.co/400"
                      }
                      alt="img"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      onClick={() => handleDeleteGalleryImage(img.id)}
                      className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 rounded-full"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ATTRIBUTE --- (Giữ nguyên) */}
      {showAttrModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden transform transition-all scale-100">
            <div className="bg-orange-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg uppercase flex items-center gap-2">
                  <span>🔖 Biến thể sản phẩm</span>
                </h3>
                <p className="text-orange-100 text-xs mt-1">
                  Sản phẩm:{" "}
                  <span className="font-bold">
                    {products.find((p) => p.id === attrProductId)?.name}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowAttrModal(false)}
                className="text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-orange-700/50"
              >
                &times;
              </button>
            </div>

            <div className="p-6 bg-gray-50 flex-1 overflow-y-auto max-h-[70vh]">
              <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-orange-100">
                <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>{" "}
                  Thêm thuộc tính mới
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="flex-1 border border-gray-300 p-2.5 rounded-lg text-sm outline-none"
                    value={newAttrData.attribute_id}
                    onChange={(e) =>
                      setNewAttrData({
                        ...newAttrData,
                        attribute_id: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Chọn Loại --</option>
                    {attrDefinitions.map((def) => (
                      <option key={def.id} value={def.id}>
                        {def.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Giá trị..."
                    className="flex-1 border border-gray-300 p-2.5 rounded-lg text-sm outline-none"
                    value={newAttrData.value}
                    onChange={(e) =>
                      setNewAttrData({ ...newAttrData, value: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleAddAttribute()}
                  />
                  <button
                    onClick={handleAddAttribute}
                    disabled={attrLoading}
                    className="bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-orange-700 disabled:bg-gray-400"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Danh
                sách hiện có
              </h4>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 uppercase font-bold text-xs">
                    <tr>
                      <th className="p-3 pl-4">Loại</th>
                      <th className="p-3">Giá trị</th>
                      <th className="p-3 text-right pr-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentAttrs.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="hover:bg-orange-50/50 transition-colors group"
                      >
                        <td className="p-3 pl-4 font-medium text-gray-800">
                          {item.attribute?.name || "---"}
                        </td>
                        <td className="p-3">
                          <span className="inline-block bg-gray-100 px-2.5 py-1 rounded text-gray-700 border border-gray-200 font-mono font-bold text-xs">
                            {item.value}
                          </span>
                        </td>
                        <td className="p-3 text-right pr-4">
                          <button
                            onClick={() => handleDeleteAttribute(item.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 transition-all"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
