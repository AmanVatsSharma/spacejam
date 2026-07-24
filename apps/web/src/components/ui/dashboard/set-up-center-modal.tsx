"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  CREATE_CENTER,
  CREATE_FLOOR,
  CREATE_SEAT,
  GET_FLOORS,
  GET_MY_CENTERS,
  GET_SEATS,
} from "@/lib/apollo/operations";

interface SetUpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the newly created center after a successful create. */
  onCreated?: (center: { id: string }) => void;
}

type SeatType = "HOT_DESK" | "DEDICATED" | "CABIN" | "MEETING_ROOM";

interface CreatedFloor {
  id: string;
  name: string;
}

interface CreatedSeat {
  id: string;
  number: string;
  seatType: SeatType;
  price: number | null;
}

// Simple icons
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
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

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const SEAT_TYPE_LABEL: Record<SeatType, string> = {
  HOT_DESK: "Hot Desk",
  DEDICATED: "Dedicated Desk",
  CABIN: "Cabin",
  MEETING_ROOM: "Meeting Room",
};

export function SetUpCenterModal({ isOpen, onClose, onCreated }: SetUpCenterModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 — Center form (collected for CREATE_CENTER)
  const [centerForm, setCenterForm] = useState({
    city: "",
    branch: "",
    address: "",
    state: "Punjab",
    tradeName: "",
  });

  // Track created resources
  const [createdCenterId, setCreatedCenterId] = useState<string | null>(null);
  const [createdFloors, setCreatedFloors] = useState<CreatedFloor[]>([]);
  // seats keyed by floorId for display
  const [seatsByFloor, setSeatsByFloor] = useState<Record<string, CreatedSeat[]>>({});

  // Step 2 — Floor form
  const [floorName, setFloorName] = useState("");
  const [floorDescription, setFloorDescription] = useState("");

  // Step 3 — Seat form
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [seatNumber, setSeatNumber] = useState("");
  const [seatType, setSeatType] = useState<SeatType>("HOT_DESK");
  const [seatPrice, setSeatPrice] = useState("");

  // Loading flags
  const [creatingCenter, setCreatingCenter] = useState(false);
  const [addingFloor, setAddingFloor] = useState(false);
  const [addingSeat, setAddingSeat] = useState(false);

  const [createCenter] = useMutation(CREATE_CENTER, {
    refetchQueries: [{ query: GET_MY_CENTERS }],
  });
  const [createFloor] = useMutation(CREATE_FLOOR);
  const [createSeat] = useMutation(CREATE_SEAT);

  // Close animation effect
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShow(true);
      return;
    }
    const t = setTimeout(() => setShow(false), 300);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Reset the wizard whenever the modal is (re)opened fresh
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setCenterForm({ city: "", branch: "", address: "", state: "Punjab", tradeName: "" });
      setCreatedCenterId(null);
      setCreatedFloors([]);
      setSeatsByFloor({});
      setFloorName("");
      setFloorDescription("");
      setSelectedFloorId(null);
      setSeatNumber("");
      setSeatType("HOT_DESK");
      setSeatPrice("");
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  const updateCenterField = (field: keyof typeof centerForm, value: string) =>
    setCenterForm((prev) => ({ ...prev, [field]: value }));

  const derivedCenterName = () =>
    centerForm.tradeName.trim() || centerForm.branch.trim() || centerForm.city.trim();

  // -------------------------------------------------------------
  // Step 1 — create the center immediately, then advance
  // -------------------------------------------------------------
  const handleCreateCenter = async () => {
    // If the center was already created (user navigated back), just advance.
    if (createdCenterId) {
      setCurrentStep(2);
      return;
    }
    const name = derivedCenterName();
    if (!name) {
      toast.error("Enter a center name (Trade Name, Branch, or City) before creating");
      return;
    }
    const input: Record<string, unknown> = { name };
    if (centerForm.address.trim()) input.address = centerForm.address.trim();
    if (centerForm.city.trim()) input.city = centerForm.city.trim();
    if (centerForm.state.trim()) input.state = centerForm.state.trim();

    setCreatingCenter(true);
    try {
      const { data, errors } = await createCenter({ variables: { input } });
      if (errors && errors.length) {
        toast.error(errors[0].message);
        return;
      }
      const centerId = data?.createCenter?.id;
      if (!centerId) {
        toast.error("Center created, but no id was returned");
        return;
      }
      setCreatedCenterId(centerId);
      onCreated?.({ id: centerId });
      toast.success("Center created");
      setCurrentStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create center");
    } finally {
      setCreatingCenter(false);
    }
  };

  // -------------------------------------------------------------
  // Step 2 — add a floor immediately
  // -------------------------------------------------------------
  const handleAddFloor = async () => {
    if (!createdCenterId) {
      toast.error("Create the center first");
      return;
    }
    const name = floorName.trim();
    if (!name) {
      toast.error("Enter a floor name");
      return;
    }
    const input: Record<string, unknown> = { name, centerId: createdCenterId };
    if (floorDescription.trim()) input.description = floorDescription.trim();

    setAddingFloor(true);
    try {
      const { data, errors } = await createFloor({
        variables: { input },
        refetchQueries: [{ query: GET_FLOORS, variables: { centerId: createdCenterId } }],
      });
      if (errors && errors.length) {
        toast.error(errors[0].message);
        return;
      }
      const id = data?.createFloor?.id;
      if (!id) {
        toast.error("Floor created, but no id was returned");
        return;
      }
      const newFloor: CreatedFloor = { id, name };
      setCreatedFloors((prev) => [...prev, newFloor]);
      // Auto-select the first floor so seats can be added right away
      setSelectedFloorId((prev) => prev ?? id);
      setFloorName("");
      setFloorDescription("");
      toast.success(`Floor "${name}" created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create floor");
    } finally {
      setAddingFloor(false);
    }
  };

  // -------------------------------------------------------------
  // Step 3 — add a seat immediately to the selected floor
  // -------------------------------------------------------------
  const handleAddSeat = async () => {
    if (!selectedFloorId) {
      toast.error("Select a floor first");
      return;
    }
    const number = seatNumber.trim();
    if (!number) {
      toast.error("Enter a space number / name");
      return;
    }
    const input: Record<string, unknown> = {
      // CreateSeatInput requires `name` (not `number`) — backend rejects
      // inputs missing name (@IsNotEmpty). Keep the local `number` var for
      // display in the seatsByFloor list.
      name: number,
      floorId: selectedFloorId,
      seatType,
    };
    const trimmedPrice = seatPrice.trim();
    if (trimmedPrice) {
      const parsed = Number(trimmedPrice);
      if (Number.isFinite(parsed) && parsed >= 0) {
        input.price = parsed;
      }
    }

    setAddingSeat(true);
    try {
      const { data, errors } = await createSeat({
        variables: { input },
        refetchQueries: [{ query: GET_SEATS, variables: { floorId: selectedFloorId } }],
      });
      if (errors && errors.length) {
        toast.error(errors[0].message);
        return;
      }
      const id = data?.createSeat?.id;
      if (!id) {
        toast.error("Space created, but no id was returned");
        return;
      }
      const newSeat: CreatedSeat = {
        id,
        number,
        seatType,
        price: typeof input.price === "number" ? input.price : null,
      };
      setSeatsByFloor((prev) => ({
        ...prev,
        [selectedFloorId]: [...(prev[selectedFloorId] ?? []), newSeat],
      }));
      setSeatNumber("");
      toast.success(`Space "${number}" created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create space");
    } finally {
      setAddingSeat(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((c) => c - 1);
  };

  const handlePrimary = () => {
    if (currentStep === 1) {
      void handleCreateCenter();
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      // Step 3 — finish
      onClose();
    }
  };

  const renderStepper = () => {
    const steps = [
      { num: 1, label: "Center Info" },
      { num: 2, label: "Floor Setup" },
      { num: 3, label: "Space Setup" },
    ];

    return (
      <div className="flex items-center gap-2 mt-4 text-[14px]">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.num;
          const isActive = currentStep === step.num;
          return (
            <React.Fragment key={step.num}>
              <div className={`flex items-center gap-2 transition-all duration-200 ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all duration-200
                  ${isCompleted || isActive ? 'bg-[#FF6A2F] text-white' : 'bg-gray-200 text-gray-500'}`}
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

      {createdCenterId && (
        <div className="bg-[#FFFCFA] border border-[#FFDCD0] rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FF6A2F] text-white flex items-center justify-center shrink-0">
            <CheckIcon />
          </div>
          <div className="text-[14px] text-gray-700">
            <span className="font-semibold text-gray-900">{derivedCenterName() || "Center"}</span> is created. Continue to set up floors.
          </div>
        </div>
      )}

      {/* Location */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Location</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">City</label>
            <input type="text" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" value={centerForm.city} onChange={(e) => updateCenterField("city", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Branch</label>
            <input type="text" placeholder="e.g., Sector 17" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" value={centerForm.branch} onChange={(e) => updateCenterField("branch", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-[14px] font-medium text-gray-700">Full Address</label>
            <textarea placeholder="Enter complete address" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F] h-20 resize-none" value={centerForm.address} onChange={(e) => updateCenterField("address", e.target.value)}></textarea>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">State</label>
            <input type="text" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" value={centerForm.state} onChange={(e) => updateCenterField("state", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Country</label>
            <input type="text" defaultValue="India" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
        </div>
      </div>

      {/* Business & Tax */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-[16px] font-semibold text-gray-900 mb-4">Business</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Trade Name</label>
            <input type="text" placeholder="Business name" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" value={centerForm.tradeName} onChange={(e) => updateCenterField("tradeName", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">GSTIN</label>
            <input type="text" placeholder="22AAAAA0000A1Z5" className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]" />
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // STEP 2: Floor Setup
  // -------------------------------------------------------------
  const renderStep2 = () => (
    <div className="flex flex-col p-6 bg-[#F9FAFB] flex-1 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-[18px] font-semibold text-gray-900">Floor Setup</h2>
        <p className="text-[14px] text-gray-500">
          {createdCenterId
            ? `Adding floors to "${derivedCenterName() || "your center"}". Each floor is created immediately.`
            : "Add floors to your center."}
        </p>
      </div>

      {/* Add floor form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h4 className="text-[14px] font-semibold text-gray-900 mb-3">Add a floor</h4>
        <div className="grid grid-cols-[2fr_3fr_auto] gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Floor Name</label>
            <input
              type="text"
              placeholder="e.g., Ground Floor"
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddFloor(); } }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Description (optional)</label>
            <input
              type="text"
              placeholder="e.g., Reception and open desks"
              value={floorDescription}
              onChange={(e) => setFloorDescription(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddFloor(); } }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]"
            />
          </div>
          <button
            onClick={() => void handleAddFloor()}
            disabled={addingFloor || !createdCenterId}
            className="h-[38px] px-4 bg-[#FF6A2F] text-white rounded-lg text-[14px] font-semibold flex items-center gap-1.5 active:scale-[0.97] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {addingFloor ? "Adding..." : (<><PlusIcon /> Add Floor</>)}
          </button>
        </div>
      </div>

      {/* Created floors list */}
      {createdFloors.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 font-medium mb-1">No floors added yet</p>
          <p className="text-gray-400 text-[14px]">Add a floor above to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="bg-[#FFFCFA] border border-[#FFDCD0] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center font-bold text-[16px]">
              {createdFloors.length}
            </div>
            <div>
              <h4 className="text-[15px] font-semibold text-gray-900">Floors created</h4>
              <p className="text-[14px] text-gray-600">{createdFloors.length} floor{createdFloors.length > 1 ? "s" : ""} ready for spaces</p>
            </div>
          </div>

          {createdFloors.map((floor, idx) => {
            const seatCount = seatsByFloor[floor.id]?.length ?? 0;
            return (
              <div key={floor.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FFE8DF] text-[#FF6A2F] flex items-center justify-center font-bold text-[14px]">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-[15px]">{floor.name}</span>
                    <span className="text-[12px] text-gray-400 font-mono">{floor.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-gray-500">{seatCount} space{seatCount === 1 ? "" : "s"}</span>
                  <span className="bg-[#E6F4EA] text-[#1E7B34] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">Created</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------
  // STEP 3: Space Setup
  // -------------------------------------------------------------
  const renderStep3 = () => {
    const activeFloorId = selectedFloorId ?? createdFloors[0]?.id ?? null;
    const activeSeats = activeFloorId ? seatsByFloor[activeFloorId] ?? [] : [];

    return (
      <div className="flex flex-col bg-[#F9FAFB] flex-1 overflow-y-auto">
        <div className="p-6 pb-0 flex-shrink-0">
          <h2 className="text-[18px] font-semibold text-gray-900">Space Setup</h2>
          <p className="text-[14px] text-gray-500">Add desks, dedicated seats, and cabins to each floor.</p>

          {createdFloors.length > 0 ? (
            <div className="flex items-center gap-6 border-b border-gray-200 mt-6 overflow-x-auto">
              {createdFloors.map((floor) => {
                const isActive = (selectedFloorId ?? createdFloors[0]?.id) === floor.id;
                return (
                  <button
                    key={floor.id}
                    onClick={() => setSelectedFloorId(floor.id)}
                    className={`pb-3 text-[14px] font-semibold border-b-2 transition-all duration-200 active:scale-[0.97] whitespace-nowrap ${isActive ? 'border-[#FF6A2F] text-[#FF6A2F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {floor.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {createdFloors.length === 0 ? (
          <div className="p-6 flex-1 flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center max-w-md">
              <p className="text-gray-500 font-medium mb-1">No floors to add spaces to</p>
              <p className="text-gray-400 text-[14px]">Go back to the Floor Setup step and add at least one floor.</p>
              <button
                onClick={handleBack}
                className="mt-4 px-4 py-2 border border-[#FF6A2F] text-[#FF6A2F] rounded-lg text-[14px] font-semibold active:scale-[0.97] transition-all duration-150"
              >
                Back to Floors
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-4">
            {/* Add seat form */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-[14px] font-semibold text-gray-900 mb-3">
                Add a space to {createdFloors.find((f) => f.id === activeFloorId)?.name ?? "this floor"}
              </h4>
              <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_auto] gap-3 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Number / Name</label>
                  <input
                    type="text"
                    placeholder="e.g., A1"
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddSeat(); } }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Type</label>
                  <div className="relative">
                    <select
                      value={seatType}
                      onChange={(e) => setSeatType(e.target.value as SeatType)}
                      className="w-full appearance-none border border-gray-200 rounded-lg py-2 px-3 text-[14px] text-gray-700 bg-white focus:outline-none focus:border-[#FF6A2F]"
                    >
                      <option value="HOT_DESK">Hot Desk</option>
                      <option value="DEDICATED">Dedicated Desk</option>
                      <option value="CABIN">Cabin</option>
                      <option value="MEETING_ROOM">Meeting Room</option>
                    </select>
                    <div className="absolute right-3 top-2.5 pointer-events-none text-gray-400">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Price (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="optional"
                    value={seatPrice}
                    onChange={(e) => setSeatPrice(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAddSeat(); } }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-[#FF6A2F]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-gray-700">Status</label>
                  <input
                    type="text"
                    defaultValue="Available"
                    readOnly
                    className="border border-gray-200 rounded-lg px-3 py-2 text-[14px] bg-gray-50 text-gray-500"
                  />
                </div>
                <button
                  onClick={() => void handleAddSeat()}
                  disabled={addingSeat || !activeFloorId}
                  className="h-[38px] px-4 bg-[#FF6A2F] text-white rounded-lg text-[14px] font-semibold flex items-center gap-1.5 active:scale-[0.97] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {addingSeat ? "Adding..." : (<><PlusIcon /> Add</>)}
                </button>
              </div>
            </div>

            {/* Seats table for the active floor */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-[14px]">
                  Spaces on {createdFloors.find((f) => f.id === activeFloorId)?.name ?? ""}
                </span>
                <span className="text-[13px] text-gray-500">{activeSeats.length} created</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[13px] font-semibold text-gray-700">
                    <th className="py-3 px-4">Number / Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSeats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-500 text-[14px]">
                        No spaces added yet. Use the form above to add one.
                      </td>
                    </tr>
                  ) : (
                    activeSeats.map((seat) => (
                      <tr key={seat.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{seat.number}</td>
                        <td className="py-3 px-4 text-gray-600">{SEAT_TYPE_LABEL[seat.seatType]}</td>
                        <td className="py-3 px-4 text-gray-600">{seat.price != null ? `₹${seat.price}` : "—"}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center text-[12px] font-semibold text-[#1E7B34] bg-[#E6F4EA] px-2 py-0.5 rounded-md">
                            Available
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Primary button label / disabled state per step
  const primaryLabel = (() => {
    if (currentStep === 1) return createdCenterId ? "Continue" : creatingCenter ? "Creating..." : "Create Center & Continue";
    if (currentStep === 2) return createdFloors.length === 0 ? "Continue anyway" : "Continue to Spaces";
    return "Finish";
  })();
  const primaryDisabled = creatingCenter;

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

          <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Set Up New Center</h2>
          <p className="text-[15px] text-gray-500 mt-1">Create your center, add floors, then add spaces</p>

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
            className={`px-6 py-2.5 border border-gray-300 rounded-xl text-[14px] font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.97] transition-all duration-150 ${currentStep === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            Back
          </button>
          <button
            onClick={handlePrimary}
            disabled={primaryDisabled}
            className="px-6 py-2.5 bg-[#FF6A2F] text-white rounded-xl text-[14px] font-semibold shadow-sm hover:bg-[#e55a20] active:scale-[0.97] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {primaryLabel}
          </button>
        </div>

      </div>
    </div>
  );
}
