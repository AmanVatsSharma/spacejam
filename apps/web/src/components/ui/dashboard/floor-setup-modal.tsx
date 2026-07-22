"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { CREATE_FLOOR, GET_FLOORS, GET_MY_CENTERS, CREATE_SEAT, CREATE_MEETING_ROOM } from "@/lib/apollo/operations";

export interface LocalSpace {
  id: string; // e.g. FD01
  floorId: string | number;
  type: string;
  seatType: string;
  capacity: number;
  status: string;
  basePrice: number;
  amenities: string[];
}

interface FloorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Center the new floor belongs to. If absent, submit is rejected with a toast. */
  centerId?: string;
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

export function FloorSetupModal({ isOpen, onClose, centerId }: FloorSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const [spaces, setSpaces] = useState<LocalSpace[]>([]);

  // Fetch floors from backend when centerId is provided
  const { data: floorsData, loading: floorsLoading } = useQuery(GET_FLOORS, {
    variables: { centerId },
    skip: !centerId,
  });

  // Step 1 State (Floor Setup) — populated from backend via GET_FLOORS + local additions
  const [floors, setFloors] = useState<
    { id: string | number; name: string; status: string; expanded: boolean; units: number; distributions: { id: number; type: string; format: string; count: number; amenities: string[]; availability: string }[], isLocal?: boolean }[]
  >([]);
  const [saving, setSaving] = useState(false);

  const [createFloor] = useMutation(CREATE_FLOOR, {
    refetchQueries: centerId ? [{ query: GET_FLOORS, variables: { centerId } }] : [{ query: GET_FLOORS }],
  });
  const [createSeat] = useMutation(CREATE_SEAT);
  const [createMeetingRoom] = useMutation(CREATE_MEETING_ROOM);

  // Add Floor: creates a new local floor entry in the wizard
  const handleAddFloor = () => {
    const nextId = `local-${Date.now()}`;
    const defaultName = `Floor ${floors.length + 1}`;
    
    setFloors(prev => [
      ...prev,
      {
        id: nextId,
        name: defaultName,
        status: "Active",
        expanded: true,
        units: 5,
        distributions: [
          { id: 1, type: "Open Desk", format: "FD", count: 2, amenities: ["WiFi"], availability: "Available" },
          { id: 2, type: "Hexagon Seat", format: "FH", count: 1, amenities: ["WiFi"], availability: "Available" },
          { id: 3, type: "Cabin (2 Seater)", format: "FC", count: 2, amenities: ["WiFi", "Whiteboard"], availability: "Available" },
          { id: 4, type: "Meeting Room (6 Seater)", format: "MR", count: 1, amenities: ["WiFi", "TV"], availability: "Available" }
        ],
        isLocal: true,
      }
    ]);
  };

  const mapTypeToBackend = (type: string) => {
    if (type.includes("Cabin")) return "CABIN";
    if (type.includes("Meeting")) return "MEETING_ROOM";
    if (type.includes("Hexagon") || type.includes("Dedicated")) return "DEDICATED";
    return "HOT_DESK";
  };

  const mapTypeToCapacity = (type: string) => {
    const match = type.match(/(\d+)\s*Seater/);
    if (match) return parseInt(match[1], 10);
    return 1;
  };

  const generateSpacesForFloors = () => {
    setSpaces(prevSpaces => {
      const newSpaces = [...prevSpaces];
      floors.forEach(floor => {
        if (newSpaces.some(s => s.floorId === floor.id)) return;

        floor.distributions.forEach(dist => {
          for (let i = 1; i <= dist.count; i++) {
            const paddedNum = i.toString().padStart(2, '0');
            const spaceId = `${dist.format}${paddedNum}`;
            let price = 6500;
            if (dist.type.includes("Cabin")) price = 19000;
            if (dist.type.includes("Hexagon")) price = 7500;
            if (dist.type.includes("Meeting")) price = 1000;

            newSpaces.push({
              id: `${spaceId}-${floor.id}-${Date.now()}`, // unique ID for local state
              floorId: floor.id,
              type: dist.type,
              seatType: mapTypeToBackend(dist.type),
              capacity: mapTypeToCapacity(dist.type),
              status: "AVAILABLE",
              basePrice: price,
              amenities: [...dist.amenities],
            });
          }
        });
      });
      return newSpaces;
    });
  };

  const [activeFloorTab, setActiveFloorTab] = useState<string | number>(1);
  const [selectedSpaceDetails, setSelectedSpaceDetails] = useState<LocalSpace | null>(null);

  // Close animation effect
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setCurrentStep(1); // Reset to step 1 when opened
    } else {
      setTimeout(() => setShow(false), 300);
    }
  }, [isOpen]);

  // Populate floors from backend when data arrives
  useEffect(() => {
    if (floorsData?.floors) {
      setFloors(floorsData.floors.map((f: any) => ({
        ...f,
        expanded: false,
        distributions: (f.distributions || []).map((d: any) => ({
          ...d,
          amenities: d.amenities || [],
        })),
      })));
    }
  }, [floorsData]);

  if (!isOpen && !show) return null;

  const handleNext = async () => {
    if (currentStep < 3) {
      if (currentStep === 1) {
        generateSpacesForFloors();
        setActiveFloorTab(floors[0]?.id ?? 1);
      }
      setCurrentStep(c => c + 1);
      return;
    }
    // Step 3: persist any queued local floors.
    if (!centerId) {
      toast.error("No center selected");
      return;
    }
    const localFloors = floors.filter(f => f.isLocal);
    
    if (localFloors.length === 0) {
      toast.error("Add at least one floor before finishing");
      return;
    }
    setSaving(true);
    let createdFloors = 0;
    let createdSeats = 0;
    try {
      for (const floor of localFloors) {
        // Create Floor
        const { data, errors } = await createFloor({
          variables: { input: { name: floor.name.trim() || `Floor ${createdFloors + 1}`, centerId } },
        });
        if (errors && errors.length) {
          toast.error(errors[0].message);
          return;
        }
        const createdFloorId = data?.createFloor?.id;
        createdFloors += 1;

        if (createdFloorId) {
          // Find spaces for this floor
          const floorSpaces = spaces.filter(s => s.floorId === floor.id);
          for (const space of floorSpaces) {
            // Provide a display-friendly number by dropping the timestamp suffix
            const number = space.id.split('-')[0];
            if (space.seatType === "MEETING_ROOM") {
              const { errors: roomErrors } = await createMeetingRoom({
                variables: {
                  input: {
                    name: `${floor.name} - ${space.type} ${number}`,
                    centerId: centerId,
                    floorId: createdFloorId,
                    type: "MEETING_ROOM",
                    capacity: space.capacity,
                    pricePerHour: space.basePrice,
                  }
                }
              });
              if (roomErrors && roomErrors.length) {
                toast.error(`Failed to create meeting room ${number}: ${roomErrors[0].message}`);
              } else {
                createdSeats += 1;
              }
            } else {
              const { errors: seatErrors } = await createSeat({
                variables: {
                  input: {
                    name: number,
                    floorId: createdFloorId,
                    seatType: space.seatType,
                    price: space.basePrice,
                    status: space.status,
                  }
                }
              });
              if (seatErrors && seatErrors.length) {
                toast.error(`Failed to create space ${number}: ${seatErrors[0].message}`);
              } else {
                createdSeats += 1;
              }
            }
          }
        }
      }
      toast.success(`${createdFloors} floor(s) and ${createdSeats} space(s) created`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create floors");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const renderStepper = () => {
    const steps = [
      { num: 1, label: "Floor Setup" },
      { num: 2, label: "Space Setup" },
      { num: 3, label: "Review" }
    ];

    return (
      <div className="flex items-center justify-between w-full mt-4 text-[14px]">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.num;
          const isActive = currentStep === step.num;

          return (
            <React.Fragment key={step.num}>
              <div className={`flex items-center gap-2 flex-shrink-0 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold
                  ${isCompleted ? 'bg-[#FF6A2F] text-white' : isActive ? 'bg-[#FF6A2F] text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {isCompleted ? <CheckIcon /> : step.num}
                </div>
                <span>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 border-b border-gray-200 mx-4"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // -------------------------------------------------------------
  // STEP 1: Floor Setup
  // -------------------------------------------------------------
  const renderStep1 = () => (
    <div className="flex flex-col p-6 bg-[#F9FAFB] flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">Floor Setup</h2>
          <p className="text-[14px] text-gray-500">Distribute your products across floors</p>
        </div>
        <button onClick={handleAddFloor} className="bg-[#FF6A2F] text-white px-4 py-2 rounded-lg text-[14px] font-semibold hover:bg-[#E55A20] active:scale-[0.97] transition-all duration-150">
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
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
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
                      <input
                        type="text"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]"
                        value={floor.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFloors(floors.map(f => f.id === floor.id ? { ...f, name: e.target.value } : f));
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-gray-700">Status</label>
                      <input type="text" defaultValue="Active" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[13px] font-bold text-gray-900">Product Distribution</h4>
                      <button 
                        onClick={() => {
                          const newDist = { id: Date.now(), type: "New Space", format: "NS", count: 1, amenities: [], availability: "Available" };
                          setFloors(floors.map(f => f.id === floor.id ? { ...f, distributions: [...f.distributions, newDist] } : f));
                        }}
                        className="text-[13px] font-semibold text-[#FF6A2F] hover:text-[#e55a20] transition-colors flex items-center gap-1"
                      >
                        + Add Space
                      </button>
                    </div>
                    <div className="flex flex-col gap-6">
                      {floor.distributions.map(dist => (
                        <div key={dist.id} className="flex flex-col gap-3 relative">
                          <button 
                            onClick={() => {
                              setFloors(floors.map(f => f.id === floor.id ? { ...f, distributions: f.distributions.filter(d => d.id !== dist.id) } : f));
                            }}
                            className="absolute -right-2 -top-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-colors shadow-sm"
                            title="Remove space"
                          >
                            ×
                          </button>
                          <div className="grid grid-cols-[1.5fr_1.5fr_1fr] gap-4 pr-6">
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Product Type</label>
                              <select 
                                value={dist.type} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let newFormat = dist.format;
                                  if (val.includes("Cabin")) newFormat = "FC";
                                  else if (val.includes("Meeting Room")) newFormat = "MR";
                                  else if (val.includes("Hexagon")) newFormat = "FH";
                                  else if (val.includes("Dedicated")) newFormat = "DD";
                                  else if (val.includes("Open Desk")) newFormat = "FD";

                                  setFloors(floors.map(f => f.id === floor.id ? { ...f, distributions: f.distributions.map(d => d.id === dist.id ? { ...d, type: val, format: newFormat } : d) } : f));
                                }}
                                className="border border-gray-200 rounded-md px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#FF6A2F]" 
                              >
                                <option value="Open Desk">Open Desk</option>
                                <option value="Dedicated Desk">Dedicated Desk</option>
                                <option value="Hexagon Seat">Hexagon Seat</option>
                                <option value="Cabin (1 Seater)">Cabin (1 Seater)</option>
                                <option value="Cabin (2 Seater)">Cabin (2 Seater)</option>
                                <option value="Cabin (4 Seater)">Cabin (4 Seater)</option>
                                <option value="Cabin (6 Seater)">Cabin (6 Seater)</option>
                                <option value="Meeting Room (4 Seater)">Meeting Room (4 Seater)</option>
                                <option value="Meeting Room (6 Seater)">Meeting Room (6 Seater)</option>
                                <option value="Meeting Room (8 Seater)">Meeting Room (8 Seater)</option>
                                <option value="Meeting Room (10 Seater)">Meeting Room (10 Seater)</option>
                                <option value="Meeting Room (12 Seater)">Meeting Room (12 Seater)</option>
                                <option value="Custom Space">Custom Space</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Space Code Format</label>
                              <input 
                                type="text" 
                                value={dist.format} 
                                onChange={(e) => {
                                  setFloors(floors.map(f => f.id === floor.id ? { ...f, distributions: f.distributions.map(d => d.id === dist.id ? { ...d, format: e.target.value } : d) } : f));
                                }}
                                className="border border-gray-200 rounded-md px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#FF6A2F]" 
                              />
                              <span className="text-[11px] text-gray-400">Use for Space code</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Count</label>
                              <input 
                                type="number" 
                                value={dist.count} 
                                onChange={(e) => {
                                  setFloors(floors.map(f => f.id === floor.id ? { ...f, distributions: f.distributions.map(d => d.id === dist.id ? { ...d, count: parseInt(e.target.value) || 0 } : d) } : f));
                                }}
                                className="border border-gray-200 rounded-md px-3 py-2 text-[14px] bg-white focus:outline-none focus:border-[#FF6A2F]" 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-[2fr_1.5fr] gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Amenities</label>
                              <div className="border border-gray-200 rounded-md px-3 py-1.5 bg-white min-h-[38px] flex flex-wrap gap-2 items-center">
                                {dist.amenities.map(am => (
                                  <div key={am} className="bg-gray-100 text-gray-700 text-[12px] px-2 py-0.5 rounded flex items-center gap-1">
                                    {am}
                                    <span 
                                      className="text-gray-400 cursor-pointer hover:text-gray-600"
                                      onClick={() => {
                                        setFloors(floors.map(f => f.id === floor.id ? { ...f, distributions: f.distributions.map(d => d.id === dist.id ? { ...d, amenities: d.amenities.filter(a => a !== am) } : d) } : f));
                                      }}
                                    >
                                      ×
                                    </span>
                                  </div>
                                ))}
                                <span className="text-[13px] text-gray-400">+ Add amenities</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[12px] text-gray-500 font-medium">Availability</label>
                              <div className="relative">
                                <select 
                                  value={dist.availability}
                                  onChange={(e) => {
                                    setFloors(floors.map(f => f.id === floor.id ? { ...f, distributions: f.distributions.map(d => d.id === dist.id ? { ...d, availability: e.target.value } : d) } : f));
                                  }}
                                  className="w-full appearance-none border border-gray-200 rounded-md py-2 px-3 text-[14px] text-gray-700 bg-white focus:outline-none focus:border-[#FF6A2F]"
                                >
                                  <option value="Available">Available</option>
                                  <option value="Occupied">Occupied</option>
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
                      {floor.distributions.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-[13px] border border-dashed border-gray-300 rounded-lg">
                          No spaces configured yet. Click "+ Add Space" to begin.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#FFFCFA] border border-[#FFDCD0] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6A2F] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
                      {floor.distributions.reduce((acc, d) => acc + d.count, 0)}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-gray-900">{floor.distributions.reduce((acc, d) => acc + d.count, 0)} spaces will be generated automatically</h4>
                      <p className="text-[13px] text-gray-600">
                        Preview: {floor.distributions.slice(0, 3).map(d => `${d.count}x ${d.type}`).join(' · ')}
                        {floor.distributions.length > 3 ? ` · and ${floor.distributions.length - 3} more` : ''}
                      </p>
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
  // STEP 2: Space Setup
  // -------------------------------------------------------------
  const renderStep2 = () => (
    <div className="flex flex-col bg-[#F9FAFB] flex-1 overflow-y-hidden relative h-full">
      <div className="p-6 pb-0 flex-shrink-0">
        <h2 className="text-[18px] font-semibold text-gray-900">Space Setup</h2>
        <p className="text-[14px] text-gray-500">Configure auto-generated spaces from your floor distribution</p>
        
        <div className="flex items-center gap-6 border-b border-gray-200 mt-6 overflow-x-auto custom-scrollbar">
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => { setActiveFloorTab(floor.id); setSelectedSpaceDetails(null); }}
              className={`pb-3 text-[14px] font-semibold border-b-2 transition-all duration-200 active:scale-[0.97] whitespace-nowrap ${activeFloorTab === floor.id ? 'border-[#FF6A2F] text-[#FF6A2F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {floor.name}
            </button>
          ))}
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
                {spaces.filter(s => s.floorId === activeFloorTab).map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{s.id.split('-')[0]}</td>
                    <td className="py-3 px-4 text-gray-600">{s.type}</td>
                    <td className="py-3 px-4 text-gray-600">{s.capacity}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-[#FF6A2F] bg-[#FFE8DF] px-2 py-1 rounded-md w-fit">
                        {s.status === 'AVAILABLE' ? 'Available' : 'Occupied'} <ChevronDownIcon />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => setSelectedSpaceDetails(s)}
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

        {/* Space Details Side Panel */}
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
                  <input type="text" value={selectedSpaceDetails.id.split('-')[0]} className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] bg-gray-50" readOnly />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-gray-700">Type</label>
                    <input type="text" defaultValue={selectedSpaceDetails.type} className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] bg-gray-50" readOnly />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-gray-700">Capacity</label>
                    <input 
                      type="number" 
                      value={selectedSpaceDetails.capacity} 
                      onChange={(e) => {
                        const newSpaces = spaces.map(s => s.id === selectedSpaceDetails.id ? { ...s, capacity: parseInt(e.target.value) || 1 } : s);
                        setSpaces(newSpaces);
                        setSelectedSpaceDetails({ ...selectedSpaceDetails, capacity: parseInt(e.target.value) || 1 });
                      }}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[13px] font-bold text-gray-900">Status</h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" checked={selectedSpaceDetails.status === 'AVAILABLE'} onChange={() => {
                        const newSpaces = spaces.map(s => s.id === selectedSpaceDetails.id ? { ...s, status: 'AVAILABLE' } : s);
                        setSpaces(newSpaces);
                        setSelectedSpaceDetails({ ...selectedSpaceDetails, status: 'AVAILABLE' });
                    }} className="accent-[#FF6A2F] w-4 h-4" />
                    <span className="text-[14px] text-gray-800">Available</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" checked={selectedSpaceDetails.status === 'OCCUPIED'} onChange={() => {
                        const newSpaces = spaces.map(s => s.id === selectedSpaceDetails.id ? { ...s, status: 'OCCUPIED' } : s);
                        setSpaces(newSpaces);
                        setSelectedSpaceDetails({ ...selectedSpaceDetails, status: 'OCCUPIED' });
                    }} className="accent-[#FF6A2F] w-4 h-4" />
                    <span className="text-[14px] text-gray-800">Occupied</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[13px] font-bold text-gray-900">Amenities</h4>
                <div className="flex gap-2 flex-wrap">
                  {selectedSpaceDetails.amenities.map(am => (
                    <span key={am} className="bg-gray-100 text-[12px] px-2 py-1 rounded border border-gray-200 flex items-center gap-1">{am}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-gray-700">Base Price</label>
                  <input 
                    type="number" 
                    value={selectedSpaceDetails.basePrice} 
                    onChange={(e) => {
                      const newSpaces = spaces.map(s => s.id === selectedSpaceDetails.id ? { ...s, basePrice: parseInt(e.target.value) || 0 } : s);
                      setSpaces(newSpaces);
                      setSelectedSpaceDetails({ ...selectedSpaceDetails, basePrice: parseInt(e.target.value) || 0 });
                    }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" 
                  />
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
  // STEP 3: Review
  // -------------------------------------------------------------
  const renderStep3 = () => {
    // Dynamic review calculations
    const uniqueProductTypes = new Set(spaces.map(s => s.type)).size;
    const totalInventory = spaces.length;
    const available = spaces.filter(s => s.status === 'AVAILABLE').length;
    const occupied = spaces.filter(s => s.status === 'OCCUPIED').length;
    const groupedSpaces = spaces.reduce((acc, curr) => {
      if (!acc[curr.type]) acc[curr.type] = curr.basePrice;
      return acc;
    }, {} as Record<string, number>);

    return (
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
              <span className="text-[16px] font-bold text-gray-900 mb-1">Center ID: {centerId || "New"}</span>
              <span className="text-[13px] text-gray-500">Currency: ₹ INR</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-gray-500 font-medium">Product Types</span>
              <span className="text-[18px] font-bold text-gray-900 mb-1">{uniqueProductTypes}</span>
              <span className="text-[13px] text-gray-500">GST: 18%</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l10 5 10-5-10-5zM2 17l10 5 10-5M2 7l10 5 10-5"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-gray-500 font-medium">Total Floors</span>
              <span className="text-[18px] font-bold text-gray-900 mb-1">{floors.filter(f => f.isLocal).length} New</span>
              {floors.filter(f => f.isLocal).slice(0, 3).map(f => (
                <span key={f.id} className="text-[13px] text-gray-500">{f.name}</span>
              ))}
              {floors.filter(f => f.isLocal).length > 3 && <span className="text-[13px] text-gray-500">...and more</span>}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] text-gray-500 font-medium">Total Inventory</span>
              <span className="text-[18px] font-bold text-gray-900 mb-1">{totalInventory}</span>
              <span className="text-[13px] text-gray-500">Available: {available}</span>
              <span className="text-[13px] text-gray-500">Occupied: {occupied}</span>
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
            {Object.entries(groupedSpaces).map(([type, price]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-[14px] text-gray-700">{type}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[14px] text-gray-900">₹{price.toLocaleString()}</span>
                  <span className="text-[13px] text-gray-400 w-16 text-right">GST: 18%</span>
                </div>
              </div>
            ))}
            {Object.keys(groupedSpaces).length === 0 && (
              <span className="text-[14px] text-gray-500 italic">No spaces generated yet.</span>
            )}
          </div>
        </div>

        {/* Floor Distribution */}
        <div className="p-6">
          <h4 className="text-[14px] font-bold text-gray-900 mb-4">Floor Distribution</h4>
          
          {floors.filter(f => f.isLocal).map(floor => {
            const floorSpaces = spaces.filter(s => s.floorId === floor.id);
            // Count by type
            const counts = floorSpaces.reduce((acc, curr) => {
              acc[curr.type] = (acc[curr.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return (
              <div key={floor.id} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] text-gray-600 font-medium">{floor.name}</span>
                  <span className="text-[13px] text-gray-500">{floorSpaces.length} spaces</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(counts).map(([type, count]) => (
                    <span key={type} className="bg-gray-50 border border-gray-200 text-gray-700 text-[12px] px-2 py-1 rounded-md">
                      {count}× {type}
                    </span>
                  ))}
                  {Object.keys(counts).length === 0 && (
                    <span className="text-[12px] text-gray-400">No spaces</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 active:scale-[0.9] transition-all duration-150"
          >
            <CloseIcon />
          </button>
          
          <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Floor Setup</h2>
          <p className="text-[15px] text-gray-500 mt-1">Add new floor or setup floor</p>
          
          {renderStepper()}
        </div>

        {/* Body Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 bg-white flex items-center justify-between shrink-0">
          <button 
            onClick={handleBack}
            className={`px-6 py-2.5 border border-gray-300 rounded-xl text-[14px] font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className="px-6 py-2.5 bg-[#FF6A2F] text-white rounded-xl text-[14px] font-semibold shadow-sm hover:bg-[#e55a20] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {currentStep === 3 ? (saving ? "Creating..." : "Setup Floor") : "Continue"}
          </button>
        </div>

      </div>
    </div>
  );
}
