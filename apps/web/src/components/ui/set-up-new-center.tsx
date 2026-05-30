/**
 * File:        apps/web/src/components/ui/set-up-new-center.tsx
 * Module:      Web · UI · SetUpNewCenter
 * Purpose:     Set up new center modal component
 *
 * Exports:
 *   - SetUpNewCenter — multi-step modal for setting up new center
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

'use client';

import React, { useState } from 'react';
import styles from './set-up-new-center.module.css';

interface Product {
  id: string;
  name: string;
  basePrice: number;
  gstPercent: number;
  tokenEnabled: boolean;
  tokenValue: number;
}

interface SetUpNewCenterProps {
  onClose?: () => void;
}

interface Step {
  number: number;
  label: string;
}

const steps: Step[] = [
  { number: 1, label: 'Center Info' },
  { number: 2, label: 'Product Types & Pricing' },
  { number: 3, label: 'Floor Setup' },
  { number: 4, label: 'Space Setup' },
  { number: 5, label: 'Review' },
];

export function SetUpNewCenter({ onClose }: SetUpNewCenterProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    basePrice: '',
    gstPercent: '',
    tokenEnabled: false,
    tokenValue: '',
  });

  const [formData, setFormData] = useState({
    city: '',
    branch: '',
    fullAddress: '',
    state: 'Punjab',
    country: 'India',
    timezone: 'Asia/Kolkata',
    legalName: '',
    tradeName: '',
    gstin: '',
    pan: '',
    gstRegistrationType: '',
    gstStateCode: '',
    invoicePrefix: 'SJ-CHD-',
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: productForm.name,
      basePrice: parseFloat(productForm.basePrice) || 0,
      gstPercent: parseFloat(productForm.gstPercent) || 0,
      tokenEnabled: productForm.tokenEnabled,
      tokenValue: parseFloat(productForm.tokenValue) || 0,
    };
    setProducts([...products, newProduct]);
    setShowProductModal(false);
    setProductForm({
      name: '',
      basePrice: '',
      gstPercent: '',
      tokenEnabled: false,
      tokenValue: '',
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleToggleToken = (id: string, enabled: boolean) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, tokenEnabled: enabled } : p))
    );
  };

  const renderStepper = () => (
    <div className={styles.stepper}>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className={styles.step}>
            <div
              className={`${styles.stepCircle} ${
                currentStep > step.number
                  ? styles.completed
                  : currentStep === step.number
                  ? styles.active
                  : styles.inactive
              }`}
            >
              {currentStep > step.number ? '✓' : step.number}
            </div>
            <span
              className={`${styles.stepLabel} ${
                currentStep >= step.number ? styles.active : styles.pending
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`${styles.stepConnector} ${
                currentStep > step.number ? styles.completed : ''
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderPage1 = () => (
    <>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Location</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>City</label>
            <select
              className={styles.formSelect}
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            >
              <option value="">Select City</option>
              <option value="chandigarh">Chandigarh</option>
              <option value="mohali">Mohali</option>
              <option value="jalandhar">Jalandhar</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Branch</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="e.g., Sector 17"
              value={formData.branch}
              onChange={(e) => handleInputChange('branch', e.target.value)}
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Full Address</label>
          <textarea
            className={styles.formTextarea}
            placeholder="Enter complete address"
            value={formData.fullAddress}
            onChange={(e) => handleInputChange('fullAddress', e.target.value)}
          />
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>State</label>
            <input
              type="text"
              className={styles.formInput}
              value="Punjab"
              readOnly
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Country</label>
            <input
              type="text"
              className={styles.formInput}
              value="India"
              readOnly
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Timezone</label>
          <input
            type="text"
            className={styles.formInput}
            value="Asia/Kolkata"
            readOnly
          />
        </div>
      </div>

      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Business & Tax</h2>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={gstEnabled}
              onChange={(e) => setGstEnabled(e.target.checked)}
            />
            <span>Enable GST for this center</span>
          </label>
        </div>
        <div className={`${styles.gstFields} ${!gstEnabled ? styles.disabled : ''}`}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Legal Name</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Legal entity name"
              value={formData.legalName}
              onChange={(e) => handleInputChange('legalName', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Trade Name</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Business name"
              value={formData.tradeName}
              onChange={(e) => handleInputChange('tradeName', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>GSTIN</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="22AAAAA0000A1Z5"
              value={formData.gstin}
              onChange={(e) => handleInputChange('gstin', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>PAN</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="ABCDE1234F"
              value={formData.pan}
              onChange={(e) => handleInputChange('pan', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>GST Registration Type</label>
            <select
              className={styles.formSelect}
              value={formData.gstRegistrationType}
              onChange={(e) =>
                handleInputChange('gstRegistrationType', e.target.value)
              }
            >
              <option value="">Select Type</option>
              <option value="regular">Regular</option>
              <option value="composite">Composite</option>
              <option value="unregistered">Unregistered</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>GST State Code</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="03"
              value={formData.gstStateCode}
              onChange={(e) => handleInputChange('gstStateCode', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Billing Defaults</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Invoice Prefix</label>
            <input
              type="text"
              className={styles.formInput}
              value="SJ-CHD-"
              readOnly
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Currency</label>
            <input
              type="text"
              className={styles.formInput}
              value="INR"
              readOnly
            />
          </div>
        </div>
      </div>
    </>
  );

  const renderPage2 = () => (
    <>
      <div className={styles.pageHeader}>
        <h2>Product Types & Pricing</h2>
        <p>Define what your center sells — this drives everything downstream</p>
      </div>

      <div className={styles.productCatalog}>
        <div className={styles.catalogHeader}>
          <h3>Product Catalog</h3>
          <button
            className={styles.addProductBtn}
            onClick={() => setShowProductModal(true)}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.33"
            >
              <line x1="8" y1="2" x2="8" y2="14" />
              <line x1="2" y1="8" x2="14" y2="8" />
            </svg>
            Add Product Type
          </button>
        </div>
        <div className={styles.productTable}>
          <div className={styles.tableHeader}>
            <span>Product Type</span>
            <span>Base Price</span>
            <span>GST (%)</span>
            <span>Token</span>
            <span>Token Value</span>
            <span></span>
          </div>
          <div className={styles.productList}>
            {products.length === 0 && (
              <div className={styles.emptyState}>
                No products added yet. Click &quot;Add Product Type&quot; to get started.
              </div>
            )}
            {products.map((product) => (
              <div key={product.id} className={styles.productRow}>
                <span className={styles.productName}>{product.name}</span>
                <span className={styles.productData}>INR{product.basePrice}</span>
                <span className={styles.productData}>{product.gstPercent}%</span>
                <span className={styles.productData}>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={product.tokenEnabled}
                      onChange={(e) =>
                        handleToggleToken(product.id, e.target.checked)
                      }
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </span>
                <span className={styles.productData}>
                  {product.tokenEnabled ? `INR${product.tokenValue}` : '-'}
                </span>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.infoBanner}>
        <div className={styles.iconCircle}>{products.length}</div>
        <div className={styles.textContent}>
          <h4>Product types configured</h4>
          <p>These products will be distributed across floors in the next step</p>
        </div>
      </div>

      {showProductModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProductModal(false)}>
          <div className={styles.addProductModal} onClick={(e) => e.stopPropagation()}>
            <h3>Add Product Type</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Product Type Name</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g., Cabin, Hot Desk"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
              />
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Base Price</label>
                <input
                  type="number"
                  className={styles.formInput}
                  placeholder="500"
                  value={productForm.basePrice}
                  onChange={(e) =>
                    setProductForm({ ...productForm, basePrice: e.target.value })
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>GST (%)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  placeholder="18"
                  value={productForm.gstPercent}
                  onChange={(e) =>
                    setProductForm({ ...productForm, gstPercent: e.target.value })
                  }
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={productForm.tokenEnabled}
                  onChange={(e) =>
                    setProductForm({ ...productForm, tokenEnabled: e.target.checked })
                  }
                />
                <span>Enable Token System</span>
              </label>
            </div>
            {productForm.tokenEnabled && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Token Value</label>
                <input
                  type="number"
                  className={styles.formInput}
                  placeholder="100"
                  value={productForm.tokenValue}
                  onChange={(e) =>
                    setProductForm({ ...productForm, tokenValue: e.target.value })
                  }
                />
              </div>
            )}
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowProductModal(false)}
              >
                Cancel
              </button>
              <button className={styles.btnAdd} onClick={handleAddProduct}>
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderPlaceholder = (text: string) => (
    <div className={styles.placeholder}>{text}</div>
  );

  const renderCurrentPage = () => {
    switch (currentStep) {
      case 1:
        return renderPage1();
      case 2:
        return renderPage2();
      case 3:
        return renderPlaceholder('Floor setup content coming soon...');
      case 4:
        return renderPlaceholder('Space setup content coming soon...');
      case 5:
        return renderPlaceholder('Review content coming soon...');
      default:
        return null;
    }
  };

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>Set Up New Center</h1>
            <p>Configure location, products, floors and spaces</p>
          </div>
          <button className={styles.closeBtn} aria-label="Close" onClick={onClose} />
        </div>
        {renderStepper()}
      </div>

      <div className={styles.pageBody}>{renderCurrentPage()}</div>

      <div className={styles.modalFooter}>
        <button
          className={styles.btnBack}
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </button>
        <button
          className={styles.btnContinue}
          onClick={currentStep === 5 ? () => alert('Center created!') : handleNext}
        >
          {currentStep === 5 ? 'Create Center' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

export default SetUpNewCenter;
