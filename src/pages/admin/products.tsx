import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Vendor {
  id: string;
  name: string;
  category: string;
  city: string;
}

interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  icon: string; // Now stores image URL instead of emoji
  isActive: boolean;
  vendorId: string;
}

export default function AdminProducts() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for new/edit product
  const [formData, setFormData] = useState<Product>({
    name: '',
    price: 0,
    description: '',
    icon: '',
    isActive: true,
    vendorId: '',
  });

  useEffect(() => {
    checkAuthAndFetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchProducts(selectedVendorId);
    }
  }, [selectedVendorId]);

  const checkAuthAndFetchVendors = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor?limit=100`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setVendors(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (vendorId: string) => {
    try {
      setLoadingProducts(true);
      const token = localStorage.getItem('accessToken');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/product/vendor/${vendorId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Compress image before upload
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxDimension = 800;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload image to backend
  const uploadImage = async (file: File): Promise<string> => {
    const compressedFile = await compressImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${selectedVendorId}/upload-image`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageData: base64,
                fileName: `product-${Date.now()}.jpg`
              })
            }
          );

          const data = await res.json();
          if (data.success && data.data?.imageUrl) {
            resolve(data.data.imageUrl);
          } else {
            reject(new Error(data.message || 'Upload failed'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(compressedFile);
    });
  };

  // Handle file selection for product image
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(10);
      setError('');

      setUploadProgress(30);
      const imageUrl = await uploadImage(file);
      
      setUploadProgress(100);
      setFormData({ ...formData, icon: imageUrl });
      setSuccess('Image uploaded!');
      
      setTimeout(() => {
        setUploadProgress(0);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProduct = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('accessToken');

      if (!formData.name || formData.price <= 0) {
        setError('Please enter product name and valid price');
        setSaving(false);
        return;
      }

      const productData = {
        ...formData,
        vendorId: selectedVendorId,
      };

      let res;
      if (editingProduct?.id) {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/product/${editingProduct.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          }
        );
      } else {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/product`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          }
        );
      }

      if (res.ok) {
        setSuccess(editingProduct?.id ? 'Product updated!' : 'Product added!');
        setShowAddForm(false);
        setEditingProduct(null);
        setFormData({ name: '', price: 0, description: '', icon: '', isActive: true, vendorId: '' });
        fetchProducts(selectedVendorId);
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'Failed to save product');
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('accessToken');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/product/${productId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setSuccess('Product deleted!');
        fetchProducts(selectedVendorId);
      } else {
        setError('Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      description: product.description || '',
      icon: product.icon || '',
      isActive: product.isActive !== false,
      vendorId: product.vendorId,
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const token = localStorage.getItem('accessToken');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/product/${product.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...product, isActive: !product.isActive }),
        }
      );

      if (res.ok) {
        fetchProducts(selectedVendorId);
      }
    } catch (err) {
      console.error('Error toggling product:', err);
    }
  };

  // Check if icon is URL (image) or emoji
  const isImageUrl = (icon: string) => {
    return icon && (icon.startsWith('http') || icon.startsWith('/api/'));
  };

  // Render product icon/image
  const renderProductImage = (icon: string, size: 'small' | 'medium' = 'small') => {
    const sizeClasses = {
      small: 'w-12 h-12',
      medium: 'w-16 h-16'
    };

    if (isImageUrl(icon)) {
      return (
        <img
          src={icon}
          alt="Product"
          className={`${sizeClasses[size]} object-cover rounded-lg`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%236b7280" font-size="40">📦</text></svg>';
          }}
        />
      );
    }

    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 rounded-lg text-2xl`}>
        {icon || '📦'}
      </div>
    );
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl text-gray-600">⏳ Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Products - Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🍽️ Manage Vendor Products</h1>
                <p className="text-gray-600 text-sm mt-1">Add and edit menu items for any vendor</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold text-sm"
                >
                  ← Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700">
              ✅ {success}
            </div>
          )}

          {/* Vendor Selector */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Vendor</label>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a vendor --</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name} ({vendor.category} - {vendor.city})
                </option>
              ))}
            </select>
          </div>

          {/* Products Management */}
          {selectedVendorId && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Products for: {selectedVendor?.name}
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingProduct(null);
                    setFormData({ name: '', price: 0, description: '', icon: '', isActive: true, vendorId: '' });
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-semibold text-sm"
                >
                  + Add Product
                </button>
              </div>

              {/* Add/Edit Form Modal */}
              {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {editingProduct?.id ? '✏️ Edit Product' : '➕ Add Product'}
                    </h2>

                    {/* Product Image Upload */}
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm mb-2">Product Image</label>
                      <div className="flex items-center gap-4">
                        {/* Image Preview */}
                        <div className="relative">
                          {formData.icon && isImageUrl(formData.icon) ? (
                            <img
                              src={formData.icon}
                              alt="Product"
                              className="w-20 h-20 object-cover rounded-lg border-2 border-blue-500"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 text-3xl">
                              📷
                            </div>
                          )}
                        </div>
                        
                        {/* Upload Button */}
                        <div className="flex-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.heic,.heif"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="product-image-input"
                          />
                          <label
                            htmlFor="product-image-input"
                            className={`block w-full text-center px-4 py-2 rounded-lg font-semibold cursor-pointer transition ${
                              uploadingImage
                                ? 'bg-gray-200 text-gray-500'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {uploadingImage ? `Uploading... ${uploadProgress}%` : '📤 Upload Image'}
                          </label>
                          
                          {/* Progress Bar */}
                          {uploadingImage && (
                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          )}
                          
                          {formData.icon && isImageUrl(formData.icon) && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, icon: '' })}
                              className="mt-2 w-full text-center text-red-600 hover:text-red-700 text-sm"
                            >
                              🗑️ Remove Image
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Product Name */}
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Coffee"
                      />
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 199"
                      />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Fresh brewed coffee"
                        rows={2}
                      />
                    </div>

                    {/* Active Toggle */}
                    <div className="mb-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                        <span className="text-gray-700">Show on menu</span>
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingProduct(null);
                        }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProduct}
                        disabled={saving || uploadingImage}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : (editingProduct?.id ? 'Update' : 'Add Product')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Products List */}
              {loadingProducts ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">⏳ Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">No products yet</h2>
                  <p className="text-gray-600 mb-6">Add products for this vendor</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    + Add First Product
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.id} className={!product.isActive ? 'opacity-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderProductImage(product.icon, 'small')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            {product.description && (
                              <div className="text-sm text-gray-500">{product.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">₹{product.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleActive(product)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                                product.isActive
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {product.isActive ? '✓ Active' : 'Hidden'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id!)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
