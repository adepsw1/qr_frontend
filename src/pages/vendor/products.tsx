import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  icon: string; // Now stores image URL instead of emoji
  isActive: boolean;
}

export default function VendorProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      if (!token || !vendorId) {
        router.push('/vendor/login');
        return;
      }

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
        console.error('Failed to fetch products');
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
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
    const vendorId = localStorage.getItem('vendorId');
    const compressedFile = await compressImage(file);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}/upload-image`,
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

    // Check if it's an image
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
      const vendorId = localStorage.getItem('vendorId');

      if (!formData.name || formData.price <= 0) {
        setError('Please enter product name and valid price');
        setSaving(false);
        return;
      }

      const productData = {
        ...formData,
        vendorId,
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
        setFormData({ name: '', price: 0, description: '', icon: '', isActive: true });
        fetchProducts();
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
        fetchProducts();
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
        fetchProducts();
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
  const renderProductImage = (icon: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizeClasses = {
      small: 'w-12 h-12',
      medium: 'w-16 h-16',
      large: 'w-20 h-20'
    };

    if (isImageUrl(icon)) {
      return (
        <img
          src={icon}
          alt="Product"
          className={`${sizeClasses[size]} object-cover rounded-xl border-2 border-indigo-500/30`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23818cf8" font-size="40">📦</text></svg>';
          }}
        />
      );
    }

    // Fallback to emoji or placeholder
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center bg-slate-800 rounded-xl border-2 border-indigo-500/30 text-3xl`}>
        {icon || '📦'}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <p className="text-xl text-indigo-300">⏳ Loading products...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Manage Products - QR Offers</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950/95 via-indigo-950/95 to-slate-950/95 backdrop-blur-xl border-b border-indigo-500/20 shadow-2xl">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-white">🛍️ Manage Products</h1>
                <p className="text-indigo-300 text-sm mt-1">Add and edit your products & services</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/vendor/dashboard')}
                  className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition font-bold text-sm"
                >
                  ← Dashboard
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setEditingProduct(null);
                    setFormData({ name: '', price: 0, description: '', icon: '', isActive: true });
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition font-bold text-sm"
                >
                  + Add Product
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded-xl text-green-300">
              ✅ {success}
            </div>
          )}

          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-4">
                  {editingProduct?.id ? '✏️ Edit Product' : '➕ Add Product'}
                </h2>

                {/* Product Image Upload */}
                <div className="mb-4">
                  <label className="block text-indigo-300 text-sm mb-2">Product Image</label>
                  <div className="flex items-center gap-4">
                    {/* Image Preview */}
                    <div className="relative">
                      {formData.icon && isImageUrl(formData.icon) ? (
                        <img
                          src={formData.icon}
                          alt="Product"
                          className="w-24 h-24 object-cover rounded-xl border-2 border-indigo-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-slate-800 rounded-xl border-2 border-dashed border-indigo-500/50 text-4xl">
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
                        className={`block w-full text-center px-4 py-3 rounded-xl font-bold cursor-pointer transition ${
                          uploadingImage
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                        }`}
                      >
                        {uploadingImage ? `Uploading... ${uploadProgress}%` : '📤 Upload Image'}
                      </label>
                      
                      {/* Progress Bar */}
                      {uploadingImage && (
                        <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                      
                      {formData.icon && isImageUrl(formData.icon) && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: '' })}
                          className="mt-2 w-full text-center text-red-400 hover:text-red-300 text-sm"
                        >
                          🗑️ Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Name */}
                <div className="mb-4">
                  <label className="block text-indigo-300 text-sm mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-indigo-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Coffee"
                  />
                </div>

                {/* Price */}
                <div className="mb-4">
                  <label className="block text-indigo-300 text-sm mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-800 border border-indigo-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., 199"
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-indigo-300 text-sm mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-indigo-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
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
                      className="w-5 h-5 rounded bg-slate-800 border-indigo-500/30"
                    />
                    <span className="text-indigo-300">Show on menu</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-xl font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={saving || uploadingImage}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl font-bold transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (editingProduct?.id ? 'Update' : 'Add Product')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products List */}
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🛍️</div>
              <h2 className="text-xl font-bold text-white mb-2">No products yet</h2>
              <p className="text-indigo-300 mb-6">Add your first product or service to show to customers</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition"
              >
                + Add Your First Product
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 ${
                    !product.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {renderProductImage(product.icon, 'medium')}
                      <div>
                        <h3 className="text-lg font-bold text-white">{product.name}</h3>
                        {product.description && (
                          <p className="text-indigo-300 text-sm">{product.description}</p>
                        )}
                        <p className="text-emerald-400 font-bold mt-1">₹{product.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          product.isActive
                            ? 'bg-green-600/30 text-green-300 hover:bg-green-600/50'
                            : 'bg-slate-600/30 text-slate-400 hover:bg-slate-600/50'
                        }`}
                      >
                        {product.isActive ? '✓ Active' : 'Hidden'}
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 px-3 py-1 rounded-lg text-sm font-medium transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id!)}
                        className="bg-red-600/30 hover:bg-red-600/50 text-red-300 px-3 py-1 rounded-lg text-sm font-medium transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Preview Section */}
          {products.length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-indigo-500/20 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4">👀 Preview (How customers see it)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {products.filter(p => p.isActive).map((product) => (
                  <div
                    key={product.id}
                    className="bg-indigo-900/30 rounded-xl p-4 text-center border border-indigo-500/20"
                  >
                    <div className="flex justify-center mb-2">
                      {renderProductImage(product.icon, 'small')}
                    </div>
                    <p className="text-white font-semibold text-sm">{product.name}</p>
                    <p className="text-emerald-400 font-bold">₹{product.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
