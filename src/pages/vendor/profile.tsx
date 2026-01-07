import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  category: string;
  city: string;
  address: string;
  description?: string;
  profile_image?: string;
  store_image?: string;
}

export default function VendorProfile() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    profileImageUrl: '',
    storeImageUrl: '',
  });
  const [activeTab, setActiveTab] = useState('images');
  
  // Image upload states
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingStore, setUploadingStore] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadType, setUploadType] = useState<'profile' | 'store' | null>(null);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [showStoreOptions, setShowStoreOptions] = useState(false);
  const [tempProfileUrl, setTempProfileUrl] = useState('');
  const [tempStoreUrl, setTempStoreUrl] = useState('');
  const [showProfileUrlInput, setShowProfileUrlInput] = useState(false);
  const [showStoreUrlInput, setShowStoreUrlInput] = useState(false);
  
  // Refs for file inputs
  const profileFileRef = useRef<HTMLInputElement>(null);
  const storeFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      if (!token || !vendorId) {
        router.push('/vendor/login');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const vendorData = data.data || data;
        setVendor(vendorData);
        setFormData({
          description: vendorData.description || '',
          profileImageUrl: vendorData.profile_image || '',
          storeImageUrl: vendorData.store_image || '',
        });
      } else {
        setError('Failed to load vendor data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compress image before upload (more aggressive compression)
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if larger than maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          // Also limit height
          const maxHeight = 1200;
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // If still too large, reduce quality more
                if (blob.size > 2 * 1024 * 1024) {
                  canvas.toBlob(
                    (smallerBlob) => {
                      if (smallerBlob) {
                        const compressedFile = new File([smallerBlob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                          type: 'image/jpeg',
                          lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                      } else {
                        reject(new Error('Failed to compress image'));
                      }
                    },
                    'image/jpeg',
                    0.5 // Lower quality for very large images
                  );
                } else {
                  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  // Upload image directly to backend (stores in Firebase)
  const uploadToBackend = async (file: File, onProgress: (percent: number) => void): Promise<string> => {
    const token = localStorage.getItem('accessToken');
    const vendorId = localStorage.getItem('vendorId');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        
        // Simulate progress (file is already read)
        onProgress(50);
        
        // Send to backend
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}/upload-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: base64Data,
            fileName: file.name,
          }),
        })
          .then(res => res.json())
          .then(data => {
            onProgress(100);
            if (data.success && data.data?.imageUrl) {
              console.log('✅ Image uploaded to backend:', data.data.imageUrl);
              resolve(data.data.imageUrl);
            } else {
              reject(new Error(data.message || 'Backend upload failed'));
            }
          })
          .catch(err => {
            reject(new Error(`Backend error: ${err.message}`));
          });
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file: File, type: 'profile' | 'store') => {
    if (!file) return;
    
    // Accept all image formats including .heic (iPhone), .webp, etc.
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!file.type.startsWith('image/') && !hasValidExtension) {
      setError('Please select an image file (JPG, PNG, WebP, HEIC, etc.)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size should be less than 10MB');
      return;
    }

    setError('');
    setUploadProgress(0);
    setUploadType(type);
    
    if (type === 'profile') {
      setUploadingProfile(true);
      setShowProfileOptions(false);
    } else {
      setUploadingStore(true);
      setShowStoreOptions(false);
    }

    try {
      // Compress image first (shows 0-30% progress)
      setUploadProgress(5);
      const compressedFile = await compressImage(file, type === 'profile' ? 800 : 1200, 0.7);
      setUploadProgress(20);
      
      console.log(`Original: ${(file.size/1024).toFixed(1)}KB → Compressed: ${(compressedFile.size/1024).toFixed(1)}KB`);
      
      // Upload to backend instead of ImgBB (shows 20-95% progress)
      const imageUrl = await uploadToBackend(compressedFile, (percent) => {
        setUploadProgress(20 + Math.round(percent * 0.75)); // 20% to 95%
      });
      
      setUploadProgress(95);
      
      // Save to vendor profile (final 5%) - with retry
      await saveImageUrl(imageUrl, type);
      setUploadProgress(100);
      
      setSuccess(`${type === 'profile' ? 'Profile picture' : 'Store banner'} uploaded successfully!`);
    } catch (err: any) {
      console.error('Upload error:', err);
      // Check if image was uploaded but save failed (contains URL in message)
      if (err.message?.includes('uploaded but')) {
        setError(err.message);
        setSuccess('Image uploaded! Refresh page and try "Paste URL" with the URL above.');
      } else {
        setError(`Upload failed: ${err.message}`);
      }
    } finally {
      if (type === 'profile') {
        setUploadingProfile(false);
      } else {
        setUploadingStore(false);
      }
      setTimeout(() => {
        setUploadProgress(0);
        setUploadType(null);
      }, 1000);
    }
  };

  // Save image URL to vendor profile with retry
  const saveImageUrl = async (imageUrl: string, type: 'profile' | 'store', retries = 2): Promise<void> => {
    const token = localStorage.getItem('accessToken');
    const vendorId = localStorage.getItem('vendorId');

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const updateRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              [type === 'profile' ? 'profile_image' : 'store_image']: imageUrl,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!updateRes.ok) {
          const errorData = await updateRes.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error (${updateRes.status})`);
        }

        // Success - update local state
        if (type === 'profile') {
          setFormData(prev => ({ ...prev, profileImageUrl: imageUrl }));
        } else {
          setFormData(prev => ({ ...prev, storeImageUrl: imageUrl }));
        }
        
        fetchVendorData();
        return; // Success, exit function
      } catch (err: any) {
        console.error(`Save attempt ${attempt + 1} failed:`, err);
        
        if (attempt === retries) {
          // All retries exhausted - but image is already uploaded to ImgBB!
          // Save the URL locally so user doesn't lose it
          if (type === 'profile') {
            setFormData(prev => ({ ...prev, profileImageUrl: imageUrl }));
          } else {
            setFormData(prev => ({ ...prev, storeImageUrl: imageUrl }));
          }
          throw new Error(`Image uploaded but couldn't save to profile. URL: ${imageUrl.slice(0, 50)}...`);
        }
        
        // Wait before retry
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  // Handle URL save
  const handleImageUrlSave = async (field: 'profile' | 'store') => {
    const imageUrl = field === 'profile' ? tempProfileUrl : tempStoreUrl;
    
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await saveImageUrl(imageUrl, field);
      
      setSuccess(`${field === 'profile' ? 'Profile picture' : 'Store banner'} updated successfully!`);
      if (field === 'profile') {
        setShowProfileUrlInput(false);
        setShowProfileOptions(false);
        setTempProfileUrl('');
      } else {
        setShowStoreUrlInput(false);
        setShowStoreOptions(false);
        setTempStoreUrl('');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Remove image
  const handleRemoveImage = async (type: 'profile' | 'store') => {
    if (!confirm(`Are you sure you want to remove the ${type === 'profile' ? 'profile picture' : 'store banner'}?`)) {
      return;
    }

    setSaving(true);
    try {
      await saveImageUrl('', type);
      setSuccess(`${type === 'profile' ? 'Profile picture' : 'Store banner'} removed`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      const vendorId = localStorage.getItem('vendorId');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendor/${vendorId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: formData.description,
          }),
        }
      );

      if (res.ok) {
        setSuccess('Description updated successfully!');
        fetchVendorData();
      } else {
        throw new Error('Update failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full"></div>
          </div>
          <p className="text-indigo-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Failed to load profile</p>
          <button
            onClick={() => router.push('/vendor/dashboard')}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile Settings - {vendor.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={profileFileRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'profile')}
      />
      <input
        type="file"
        ref={storeFileRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'store')}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950/95 via-indigo-950/95 to-slate-950/95 backdrop-blur-xl border-b border-indigo-500/20 shadow-2xl sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Profile Settings</h1>
                <p className="text-indigo-300 text-sm mt-1">{vendor.name}</p>
              </div>
              <button
                onClick={() => router.push('/vendor/dashboard')}
                className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition font-bold text-sm"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'images', label: '🖼️ Images' },
              { id: 'description', label: '📝 Description' },
              { id: 'info', label: 'ℹ️ Info' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-3 rounded-lg font-bold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-800/50 text-indigo-300 hover:bg-slate-700/50 border border-indigo-500/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-500/20 text-red-300 rounded-lg mb-6 border border-red-500/30">
              ❌ {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-500/20 text-green-300 rounded-lg mb-6 border border-green-500/30">
              ✅ {success}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile Image */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Profile Picture</h3>
                
                <div 
                  className="relative mb-4 cursor-pointer group"
                  onClick={() => !uploadingProfile && setShowProfileOptions(true)}
                >
                  {formData.profileImageUrl ? (
                    <div className="relative">
                      <img
                        src={formData.profileImageUrl}
                        alt="Profile"
                        className="w-full h-56 object-cover rounded-xl border-2 border-indigo-500 transition group-hover:opacity-80"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Invalid+URL';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                        <span className="text-white font-bold">📷 Change Photo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-slate-800 rounded-xl border-2 border-dashed border-indigo-500 flex flex-col items-center justify-center transition group-hover:bg-slate-700 group-hover:border-violet-500">
                      <span className="text-5xl mb-2">📷</span>
                      <span className="text-indigo-300 font-medium">Tap to add photo</span>
                      <span className="text-indigo-400 text-sm">From gallery or camera</span>
                    </div>
                  )}
                  
                  {uploadingProfile && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                      <div className="text-center w-full px-8">
                        <div className="mb-3">
                          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${uploadType === 'profile' ? uploadProgress : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-white font-bold text-lg">{uploadType === 'profile' ? uploadProgress : 0}%</span>
                        <p className="text-indigo-300 text-sm mt-1">
                          {uploadProgress < 20 ? 'Compressing...' : uploadProgress < 95 ? 'Uploading...' : 'Saving...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Options Modal */}
                {showProfileOptions && (
                  <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowProfileOptions(false)}>
                    <div className="bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <div className="p-4 border-b border-slate-700">
                        <h4 className="text-lg font-bold text-white text-center">Profile Picture</h4>
                      </div>
                      
                      <div className="p-2">
                        <button
                          onClick={() => profileFileRef.current?.click()}
                          className="w-full p-4 text-left hover:bg-slate-800 rounded-xl transition flex items-center gap-4"
                        >
                          <span className="text-2xl">📷</span>
                          <div>
                            <p className="text-white font-semibold">Take Photo or Choose from Gallery</p>
                            <p className="text-indigo-400 text-sm">Use camera or select from phone</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { setShowProfileOptions(false); setShowProfileUrlInput(true); }}
                          className="w-full p-4 text-left hover:bg-slate-800 rounded-xl transition flex items-center gap-4"
                        >
                          <span className="text-2xl">🔗</span>
                          <div>
                            <p className="text-white font-semibold">Paste Image URL</p>
                            <p className="text-indigo-400 text-sm">From Imgur, ImgBB, or any website</p>
                          </div>
                        </button>
                        
                        {formData.profileImageUrl && (
                          <button
                            onClick={() => { setShowProfileOptions(false); handleRemoveImage('profile'); }}
                            className="w-full p-4 text-left hover:bg-red-900/30 rounded-xl transition flex items-center gap-4"
                          >
                            <span className="text-2xl">🗑️</span>
                            <div>
                              <p className="text-red-400 font-semibold">Remove Photo</p>
                              <p className="text-red-400/70 text-sm">Delete current profile picture</p>
                            </div>
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setShowProfileOptions(false)}
                        className="w-full p-4 border-t border-slate-700 text-indigo-400 font-bold hover:bg-slate-800 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* URL Input Modal */}
                {showProfileUrlInput && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowProfileUrlInput(false)}>
                    <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                      <h4 className="text-lg font-bold text-white mb-4">Paste Image URL</h4>
                      <input
                        type="url"
                        value={tempProfileUrl}
                        onChange={(e) => setTempProfileUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 bg-slate-800 border border-indigo-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                        autoFocus
                      />
                      <p className="text-indigo-400 text-sm mb-4">
                        💡 Upload your image to <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-violet-400 underline">imgbb.com</a> and paste the direct link
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setShowProfileUrlInput(false); setTempProfileUrl(''); }}
                          className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleImageUrlSave('profile')}
                          disabled={saving || !tempProfileUrl.trim()}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-indigo-300 text-sm text-center">
                  Tap the image to change your profile picture
                </p>
              </div>

              {/* Store Banner */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Store Banner</h3>
                
                <div 
                  className="relative mb-4 cursor-pointer group"
                  onClick={() => !uploadingStore && setShowStoreOptions(true)}
                >
                  {formData.storeImageUrl ? (
                    <div className="relative">
                      <img
                        src={formData.storeImageUrl}
                        alt="Store Banner"
                        className="w-full h-56 object-cover rounded-xl border-2 border-indigo-500 transition group-hover:opacity-80"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x300?text=Invalid+URL';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                        <span className="text-white font-bold">🖼️ Change Banner</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-slate-800 rounded-xl border-2 border-dashed border-indigo-500 flex flex-col items-center justify-center transition group-hover:bg-slate-700 group-hover:border-violet-500">
                      <span className="text-5xl mb-2">🏪</span>
                      <span className="text-indigo-300 font-medium">Tap to add banner</span>
                      <span className="text-indigo-400 text-sm">Your store's cover image</span>
                    </div>
                  )}
                  
                  {uploadingStore && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
                      <div className="text-center w-full px-8">
                        <div className="mb-3">
                          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-violet-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${uploadType === 'store' ? uploadProgress : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-white font-bold text-lg">{uploadType === 'store' ? uploadProgress : 0}%</span>
                        <p className="text-indigo-300 text-sm mt-1">
                          {uploadProgress < 20 ? 'Compressing...' : uploadProgress < 95 ? 'Uploading...' : 'Saving...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Options Modal */}
                {showStoreOptions && (
                  <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowStoreOptions(false)}>
                    <div className="bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <div className="p-4 border-b border-slate-700">
                        <h4 className="text-lg font-bold text-white text-center">Store Banner</h4>
                      </div>
                      
                      <div className="p-2">
                        <button
                          onClick={() => storeFileRef.current?.click()}
                          className="w-full p-4 text-left hover:bg-slate-800 rounded-xl transition flex items-center gap-4"
                        >
                          <span className="text-2xl">📷</span>
                          <div>
                            <p className="text-white font-semibold">Take Photo or Choose from Gallery</p>
                            <p className="text-indigo-400 text-sm">Use camera or select from phone</p>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { setShowStoreOptions(false); setShowStoreUrlInput(true); }}
                          className="w-full p-4 text-left hover:bg-slate-800 rounded-xl transition flex items-center gap-4"
                        >
                          <span className="text-2xl">🔗</span>
                          <div>
                            <p className="text-white font-semibold">Paste Image URL</p>
                            <p className="text-indigo-400 text-sm">From Imgur, ImgBB, or any website</p>
                          </div>
                        </button>
                        
                        {formData.storeImageUrl && (
                          <button
                            onClick={() => { setShowStoreOptions(false); handleRemoveImage('store'); }}
                            className="w-full p-4 text-left hover:bg-red-900/30 rounded-xl transition flex items-center gap-4"
                          >
                            <span className="text-2xl">🗑️</span>
                            <div>
                              <p className="text-red-400 font-semibold">Remove Banner</p>
                              <p className="text-red-400/70 text-sm">Delete current store banner</p>
                            </div>
                          </button>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setShowStoreOptions(false)}
                        className="w-full p-4 border-t border-slate-700 text-indigo-400 font-bold hover:bg-slate-800 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* URL Input Modal */}
                {showStoreUrlInput && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowStoreUrlInput(false)}>
                    <div className="bg-slate-900 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                      <h4 className="text-lg font-bold text-white mb-4">Paste Banner URL</h4>
                      <input
                        type="url"
                        value={tempStoreUrl}
                        onChange={(e) => setTempStoreUrl(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full px-4 py-3 bg-slate-800 border border-indigo-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
                        autoFocus
                      />
                      <p className="text-indigo-400 text-sm mb-4">
                        💡 Upload your banner to <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-violet-400 underline">imgbb.com</a> and paste the direct link
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setShowStoreUrlInput(false); setTempStoreUrl(''); }}
                          className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleImageUrlSave('store')}
                          disabled={saving || !tempStoreUrl.trim()}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-indigo-300 text-sm text-center">
                  Tap the image to change your store banner
                </p>
              </div>
            </div>
          )}

          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Store Description</h3>
              <div className="space-y-4">
                <label className="block">
                  <span className="block text-indigo-300 font-medium mb-2">About Your Business</span>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell your customers about your business, specialties, products, and what makes you unique..."
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-indigo-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
                  />
                </label>
                <p className="text-indigo-300 text-sm">
                  This description will appear on your store page when customers scan your QR code
                </p>
                <button
                  onClick={handleSaveDescription}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {saving ? '⏳ Saving...' : '✅ Save Description'}
                </button>
              </div>
            </div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 border border-indigo-500/30 rounded-xl shadow-2xl p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Business Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-indigo-400 text-sm">Business Name</p>
                    <p className="text-white font-semibold">{vendor.name}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-indigo-400 text-sm">Category</p>
                    <p className="text-white font-semibold">{vendor.category}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-indigo-400 text-sm">Email</p>
                    <p className="text-white font-semibold">{vendor.email}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-indigo-400 text-sm">Phone</p>
                    <p className="text-white font-semibold">{vendor.phone_number}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-indigo-400 text-sm">City</p>
                    <p className="text-white font-semibold">{vendor.city}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 sm:col-span-2">
                    <p className="text-indigo-400 text-sm">Address</p>
                    <p className="text-white font-semibold">{vendor.address}</p>
                  </div>
                </div>
                <p className="text-indigo-300 text-sm mt-4">
                  To update your business information, please contact support.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
