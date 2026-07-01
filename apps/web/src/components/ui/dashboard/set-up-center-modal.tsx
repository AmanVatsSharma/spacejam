"use client";

import React, { useState, useEffect } from "react";

interface SetUpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simple icons
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-red-500 transition-colors cursor-pointer">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

export function SetUpCenterModal({ isOpen, onClose }: SetUpCenterModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 2 State
  const [products, setProducts] = useState([
    { id: 1, type: "Open Desk", price: "6500", gst: "18", tokens: 65 },
    { id: 2, type: "Hexagon Seat", price: "7500", gst: "18", tokens: 75 },
    { id: 3, type: "Cabin (4 Seater)", price: "28000", gst: "18", tokens: 280 }
  ]);

  // Step 3 State
  const [floors, setFloors] = useState([
    { id: 1, name: "Floor 1", status: "Active", expanded: true, units: 5, distributions: [
      { id: 1, type: "Open Desk", format: "SJ34-desk-A-1", count: 2, amenities: ["WiFi", "CCTV"], availability: "Available" },
      { id: 2, type: "Hexagon Seat", format: "SJ34-hex-A-1", count: 1, amenities: ["WiFi", "CCTV"], availability: "Available" },
      { id: 3, type: "Cabin (2 Seater)", format: "SJ34-Cabin(2s)-A-1", count: 2, amenities: ["WiFi", "CCTV"], availability: "Available" }
    ]},
    { id: 2, name: "Floor 2", status: "Active", expanded: false, units: 2, distributions: [] }
  ]);

  // Step 4 State
  const [activeFloorTab, setActiveFloorTab] = useState(1);
  const [selectedSpaceDetails, setSelectedSpaceDetails] = useState<string | null>(null);

  // Close animation effect
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      setTimeout(() => setShow(false), 300);
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(c => c + 1);
    else onClose();
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const renderStepper = () => {
    const steps = [
      { num: 1, label: "Center Info" },
      { num: 2, label: "Product Types & Pricing" },
      { num: 3, label: "Floor Setup" },
      { num: 4, label: "Space Setup" },
      { num: 5, label: "Review" }
    ];

    return (
      <div className="flex items-center gap-2 mt-4 text-[14px]">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.num;
          const isActive = currentStep === step.num;
          const isFuture = currentStep < step.num;

          return (
            <React.Fragment key={step.num}>
              <div className={`flex items-center gap-2 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold
                  ${isCompleted ? 'bg-[#FF6A2F] text-white' : isActive ? 'bg-[#FF6A2F] text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {isCompleted ? <CheckIcon /> : step.num}
                </div>
                <span>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className="w-4 border-b border-gray-300 mx-1"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // -------------------------------------------------------------
  // STEP 1: Center Info
  // -------------------------------------------------------------
  const renderStep1 = () => (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto bg-[#F9FAFB] flex-1">
      
      {/* Location */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Location</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">City</label>
            <input type="text" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Branch</label>
            <input type="text" placeholder="e.g., Sector 17" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-[14px] font-medium text-gray-700">Full Address</label>
            <textarea placeholder="Enter complete address" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F] h-20 resize-none"></textarea>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">State</label>
            <input type="text" defaultValue="Punjab" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Country</label>
            <input type="text" defaultValue="India" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-[14px] font-medium text-gray-700">Timezone</label>
            <input type="text" defaultValue="Asia/Kolkata" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
        </div>
      </div>

      {/* Business & Tax */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <span className="text-[14px] font-medium text-gray-700">Enable GST for this center</span>
        </div>
        <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Business & Tax</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Legal Name</label>
            <input type="text" placeholder="Legal entity name" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Trade Name</label>
            <input type="text" placeholder="Business name" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">GSTIN</label>
            <input type="text" placeholder="22AAAAA0000A1Z5" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">PAN</label>
            <input type="text" placeholder="ABCDE1234F" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">GST Registration Type</label>
            <input type="text" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">GST State Code</label>
            <input type="text" placeholder="03" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
        </div>
      </div>

      {/* Billing Defaults */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Billing Defaults</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Invoice Prefix</label>
            <input type="text" placeholder="SJ-CHD-" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Currency</label>
            <input type="text" defaultValue="₹ INR" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F] bg-gray-50" readOnly />
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // STEP 2: Product Types
  // -------------------------------------------------------------
  const renderStep2 = () => (
    <div className="flex flex-col p-6 bg-[#F9FAFB] flex-1 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-[18px] font-semibold text-gray-900">Product Types & Pricing</h2>
        <p className="text-[14px] text-gray-500">Define what your center sells — this drives everything</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Product Catalog</span>
          <button 
            onClick={() => setProducts([...products, { id: Date.now(), type: "Open Desk", price: "0", gst: "18", tokens: 0 }])}
            className="text-[#FF6A2F] text-[14px] font-semibold flex items-center gap-1"
          >
            + Add Product Type
          </button>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-[13px] font-semibold text-gray-700">
              <th className="py-3 px-4 w-[25%]">Product Type</th>
              <th className="py-3 px-4 w-[15%]">Base Price (₹)</th>
              <th className="py-3 px-4 w-[15%]">GST (%)</th>
              <th className="py-3 px-4 w-[20%] text-center">Token Included</th>
              <th className="py-3 px-4 w-[15%]">Token Value</th>
              <th className="py-3 px-4 w-[10%]"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500 text-[14px]">
                  No products added. Click "+ Add Product Type" above.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4">
                    <div className="relative">
                      <select className="w-full appearance-none border border-gray-200 rounded-md py-2 px-3 text-[14px] text-gray-700 focus:outline-none focus:border-[#FF6A2F] bg-white">
                        <option>{p.type}</option>
                        <option>Hexagon Seat</option>
                        <option>Cabin (4 Seater)</option>
                      </select>
                      <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                        <ChevronDownIcon />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input type="text" defaultValue={p.price} className="w-full border border-gray-200 rounded-md py-2 px-3 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
                  </td>
                  <td className="py-3 px-4">
                    <input type="text" defaultValue={p.gst} className="w-full border border-gray-200 rounded-md py-2 px-3 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-between border border-gray-200 rounded-md py-1.5 px-3">
                      <button className="text-gray-500 hover:text-gray-900">-</button>
                      <span className="text-[14px]">0</span>
                      <button className="text-gray-500 hover:text-gray-900">+</button>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input type="text" defaultValue={p.tokens} className="w-full border border-gray-200 rounded-md py-2 px-3 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setProducts(products.filter(pr => pr.id !== p.id))} className="text-gray-400 hover:text-red-500 p-1">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-[#FFFCFA] border border-[#FFDCD0] rounded-xl p-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-[#FF6A2F] text-white flex items-center justify-center font-bold text-[14px] shrink-0 mt-0.5">
          {products.length}
        </div>
        <div>
          <h4 className="text-[15px] font-semibold text-gray-900">Product types configured</h4>
          <p className="text-[14px] text-gray-600 mt-1">These products will be distributed across floors in the next step</p>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // STEP 3: Floor Setup
  // -------------------------------------------------------------
  const renderStep3 = () => (
    <div className="flex flex-col p-6 bg-[#F9FAFB] flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">Floor Setup</h2>
          <p className="text-[14px] text-gray-500">Distribute your products across floors</p>
        </div>
        <button className="bg-[#FF6A2F] text-white px-4 py-2 rounded-lg text-[14px] font-semibold">
          + Add Floor
        </button>
      </div>

      {floors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center mt-2">
          <p className="text-gray-500 font-medium mb-1">No floors added yet</p>
          <p className="text-gray-400 text-[14px]">Click "Add Floor" to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-[#FFFCFA] border border-[#FFDCD0] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center font-bold text-[16px]">
              {floors.reduce((acc, f) => acc + f.units, 0)}
            </div>
            <div>
              <h4 className="text-[15px] font-semibold text-gray-900">Total Units Across All Floors</h4>
              <p className="text-[14px] text-gray-600">{floors.length} floors configured</p>
            </div>
          </div>

          {floors.map(floor => (
            <div key={floor.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setFloors(floors.map(f => f.id === floor.id ? {...f, expanded: !f.expanded} : f))}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{floor.name}</span>
                  <span className="bg-[#FFE8DF] text-[#FF6A2F] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                  <span className="text-[14px] text-gray-500">{floor.units} units configured</span>
                  <TrashIcon />
                  <div className={`transform transition-transform ${floor.expanded ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>

              {floor.expanded && (
                <div className="p-6 border-t border-gray-100 bg-white">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-gray-700">Floor Name</label>
                      <input type="text" defaultValue={floor.name} className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-gray-700">Status</label>
                      <input type="text" defaultValue="Active" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
                    <h4 className="text-[13px] font-bold text-gray-900 mb-4">Product Distribution</h4>
                    <div className="flex flex-col gap-6">
                      {floor.distributions.map(dist => (
                        <div key={dist.id} className="flex flex-col gap-3">
                          <div className="grid grid-cols-[1.5fr_1.5fr_1fr] gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Product Type</label>
                              <input type="text" defaultValue={dist.type} className="border border-gray-200 rounded-md px-3 py-2 text-[14px] bg-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Space Code Format</label>
                              <input type="text" defaultValue={dist.format} className="border border-gray-200 rounded-md px-3 py-2 text-[14px] bg-white" />
                              <span className="text-[11px] text-gray-400">Use for Space code</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Count</label>
                              <input type="text" defaultValue={dist.count} className="border border-gray-200 rounded-md px-3 py-2 text-[14px] bg-white" />
                            </div>
                          </div>
                          <div className="grid grid-cols-[2fr_1.5fr] gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Amenities</label>
                              <div className="border border-gray-200 rounded-md px-3 py-1.5 bg-white min-h-[38px] flex flex-wrap gap-2 items-center">
                                {dist.amenities.map(am => (
                                  <div key={am} className="bg-gray-100 text-gray-700 text-[12px] px-2 py-0.5 rounded flex items-center gap-1">
                                    {am}
                                    <span className="text-gray-400 cursor-pointer hover:text-gray-600">×</span>
                                  </div>
                                ))}
                                <span className="text-[13px] text-gray-400">+ Add amenities</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Availability</label>
                              <div className="relative">
                                <select className="w-full appearance-none border border-gray-200 rounded-md py-2 px-3 text-[14px] text-gray-700 bg-white focus:outline-none focus:border-[#FF6A2F]">
                                  <option>{dist.availability}</option>
                                </select>
                                <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                                  <ChevronDownIcon />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="w-full h-px bg-gray-200 my-1"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#FFFCFA] border border-[#FFDCD0] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6A2F] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
                      {floor.units}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-gray-900">{floor.units} spaces will be generated automatically</h4>
                      <p className="text-[13px] text-gray-600">Preview: 2x Open Desk · 1x Hexagon Seat · 2x Cabin (2 Seater)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------
  // STEP 4: Space Setup
  // -------------------------------------------------------------
  const renderStep4 = () => (
    <div className="flex flex-col bg-[#F9FAFB] flex-1 overflow-y-hidden relative h-full">
      <div className="p-6 pb-0 flex-shrink-0">
        <h2 className="text-[18px] font-semibold text-gray-900">Space Setup</h2>
        <p className="text-[14px] text-gray-500">Configure auto-generated spaces from your floor distribution</p>
        
        <div className="flex items-center gap-6 border-b border-gray-200 mt-6">
          <button 
            onClick={() => setActiveFloorTab(1)}
            className={`pb-3 text-[14px] font-semibold border-b-2 transition-colors ${activeFloorTab === 1 ? 'border-[#FF6A2F] text-[#FF6A2F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Floor 1
          </button>
          <button 
            onClick={() => setActiveFloorTab(2)}
            className={`pb-3 text-[14px] font-semibold border-b-2 transition-colors ${activeFloorTab === 2 ? 'border-[#FF6A2F] text-[#FF6A2F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Floor 2
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6 relative">
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-900">Floor Map</span>
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#FF6A2F] text-[#FF6A2F] rounded-lg text-[13px] font-semibold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload Layout
              </button>
            </div>
            <div className="border border-dashed border-gray-300 rounded-lg h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="font-medium text-gray-500">No layout image uploaded</span>
              <span className="text-[13px]">Visual reference for space allocation</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[13px] font-semibold text-gray-700">
                  <th className="py-3 px-4">Space Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'FD01', type: 'Open Desk', cap: 1 },
                  { id: 'FD02', type: 'Open Desk', cap: 1 },
                  { id: 'FH01', type: 'Hexagon Seat', cap: 1 },
                  { id: 'FC01', type: 'Cabin (2 Seater)', cap: 2 }
                ].map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{s.id}</td>
                    <td className="py-3 px-4 text-gray-600">{s.type}</td>
                    <td className="py-3 px-4 text-gray-600">{s.cap}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-[#FF6A2F] bg-[#FFE8DF] px-2 py-1 rounded-md w-fit">
                        Available <ChevronDownIcon />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => setSelectedSpaceDetails(s.id)}
                        className="bg-[#FF6A2F] text-white px-3 py-1.5 rounded-lg text-[13px] font-semibold shadow-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Space Details Side Panel (absolute or flexible width depending on layout, we use flex here if selected) */}
        {selectedSpaceDetails && (
          <div className="w-[320px] bg-white border border-gray-200 rounded-xl shadow-lg flex-shrink-0 flex flex-col overflow-hidden animate-in slide-in-from-right">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="font-semibold text-gray-900">Space Details</span>
              <button onClick={() => setSelectedSpaceDetails(null)} className="text-gray-400 hover:text-gray-600">
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6 custom-scrollbar">
              
              <div className="flex flex-col gap-3">
                <h4 className="text-[13px] font-bold text-gray-900">Basic Info</h4>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Space Name</label>
                  <input type="text" defaultValue={selectedSpaceDetails} className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-gray-700">Type</label>
                    <input type="text" defaultValue="Open Desk" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] bg-gray-50" readOnly />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-gray-700">Capacity</label>
                    <input type="text" defaultValue="1" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[13px] font-bold text-gray-900">Status</h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" defaultChecked className="accent-[#FF6A2F] w-4 h-4" />
                    <span className="text-[14px] text-gray-800">Available</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" className="accent-[#FF6A2F] w-4 h-4" />
                    <span className="text-[14px] text-gray-800">Occupied</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" className="accent-[#FF6A2F] w-4 h-4" />
                    <span className="text-[14px] text-gray-800">Maintenance</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[13px] font-bold text-gray-900">Amenities</h4>
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-500 focus:outline-none focus:border-[#FF6A2F]">
                  <option>Add amenities</option>
                </select>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-gray-100 text-[12px] px-2 py-1 rounded border border-gray-200 flex items-center gap-1">WiFi <span className="text-gray-400">×</span></span>
                  <span className="bg-gray-100 text-[12px] px-2 py-1 rounded border border-gray-200 flex items-center gap-1">CCTV <span className="text-gray-400">×</span></span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-gray-900">Override Pricing</h4>
                  <div className="w-9 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Base Price</label>
                  <input type="text" defaultValue="₹6,500" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] bg-gray-50 text-gray-500" readOnly />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Base Token</label>
                  <input type="text" defaultValue="65" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] bg-gray-50 text-gray-500" readOnly />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[13px] font-bold text-gray-900">Notes (optional)</h4>
                <textarea className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F] h-20 resize-none" placeholder="Add any special notes about this space..."></textarea>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );

  // -------------------------------------------------------------
  // STEP 5: Review
  // -------------------------------------------------------------
  const renderStep5 = () => (
    <div className="flex flex-col p-6 bg-[#F9FAFB] flex-1 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-[18px] font-semibold text-gray-900">Review & Confirm</h2>
        <p className="text-[14px] text-gray-500">Verify all details before creating your center</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-gray-500 font-medium">Center Details</span>
            <span className="text-[16px] font-bold text-gray-900 mb-1">Unnamed Center</span>
            <span className="text-[13px] text-gray-500">Code: SJ-MECN91</span>
            <span className="text-[13px] text-gray-500">Location: —, Punjab</span>
            <span className="text-[13px] text-gray-500">Currency: ₹ INR</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-gray-500 font-medium">Product Types</span>
            <span className="text-[18px] font-bold text-gray-900 mb-1">6</span>
            <span className="text-[13px] text-gray-500">GST: 18%</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l10 5 10-5-10-5zM2 17l10 5 10-5M2 7l10 5 10-5"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-gray-500 font-medium">Total Floors</span>
            <span className="text-[18px] font-bold text-gray-900 mb-1">2</span>
            <span className="text-[13px] text-gray-500">Floor 1</span>
            <span className="text-[13px] text-gray-500">Floor 2</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] text-gray-500 font-medium">Total Inventory</span>
            <span className="text-[18px] font-bold text-gray-900 mb-1">7</span>
            <span className="text-[13px] text-gray-500">Available: 7</span>
            <span className="text-[13px] text-gray-500">Occupied: 0</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        
        {/* Business Information */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-[14px] font-bold text-gray-900 mb-4">Business Information</h4>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <div className="text-[12px] text-gray-500 mb-1">Legal Name</div>
              <div className="text-[14px] font-semibold text-gray-900">—</div>
            </div>
            <div>
              <div className="text-[12px] text-gray-500 mb-1">Trade Name</div>
              <div className="text-[14px] font-semibold text-gray-900">—</div>
            </div>
            <div>
              <div className="text-[12px] text-gray-500 mb-1">GSTIN</div>
              <div className="text-[14px] font-semibold text-gray-900">—</div>
            </div>
            <div>
              <div className="text-[12px] text-gray-500 mb-1">PAN</div>
              <div className="text-[14px] font-semibold text-gray-900">—</div>
            </div>
          </div>
        </div>

        {/* Product Pricing Summary */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-[14px] font-bold text-gray-900 mb-4">Product Pricing Summary</h4>
          <div className="flex flex-col gap-4">
            {[
              { t: 'Open Desk', p: '₹6,500' },
              { t: 'Hexagon Seat', p: '₹7,500' },
              { t: 'Cabin (2 Seater)', p: '₹19,000' },
              { t: 'Cabin (4 Seater)', p: '₹28,000' },
              { t: 'Cabin (6 Seater)', p: '₹32,000' },
              { t: 'Meeting Room', p: '₹1,000' },
            ].map(item => (
              <div key={item.t} className="flex justify-between items-center">
                <span className="text-[14px] text-gray-700">{item.t}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[14px] text-gray-900">{item.p}</span>
                  <span className="text-[13px] text-gray-400 w-16 text-right">GST: 18%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floor Distribution */}
        <div className="p-6">
          <h4 className="text-[14px] font-bold text-gray-900 mb-4">Floor Distribution</h4>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-gray-600 font-medium">Floor 1</span>
              <span className="text-[13px] text-gray-500">5 spaces</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-gray-50 border border-gray-200 text-gray-700 text-[12px] px-2 py-1 rounded-md">2× Open Desk</span>
              <span className="bg-gray-50 border border-gray-200 text-gray-700 text-[12px] px-2 py-1 rounded-md">1× Hexagon Seat</span>
              <span className="bg-gray-50 border border-gray-200 text-gray-700 text-[12px] px-2 py-1 rounded-md">2× Cabin (2 Seater)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-gray-600 font-medium">Floor 2</span>
              <span className="text-[13px] text-gray-500">2 spaces</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-gray-50 border border-gray-200 text-gray-700 text-[12px] px-2 py-1 rounded-md">2× Open Desk</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`relative w-full max-w-[1000px] h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex flex-col relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          >
            <CloseIcon />
          </button>
          
          <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Set Up New Center</h2>
          <p className="text-[15px] text-gray-500 mt-1">Configure location, products, floors and spaces</p>
          
          {renderStepper()}
        </div>

        {/* Body Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
          <button 
            onClick={handleBack}
            className={`px-6 py-2.5 border border-gray-300 rounded-xl text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            Back
          </button>
          <button 
            onClick={handleNext}
            className="px-6 py-2.5 bg-[#FF6A2F] text-white rounded-xl text-[14px] font-semibold shadow-sm hover:bg-[#e55a20] transition-colors"
          >
            {currentStep === 5 ? 'Create center' : 'Continue'}
          </button>
        </div>

      </div>
    </div>
  );
}
