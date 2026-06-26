"use client";

import { useState } from "react";
// import styles from "./onboarding-wizard.module.css"; // Not using module CSS right now as I'm styling with Tailwind.

const STEPS = [
  { id: 1, title: "Basic Information", desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
  { id: 2, title: "Employee & User details", desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
  { id: 3, title: "Membership & Space Allocation", desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
  { id: 4, title: "Finance & Deposits", desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
  { id: 5, title: "Additional Services", desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
  { id: 6, title: "Legal & Compliance", desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
  { id: 7, title: "Personalisation", desc: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
];

export default function OnboardingWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form State - Step 1
  const [basicInfo, setBasicInfo] = useState({
    superUser: "",
    phone: "",
    email: "",
    altContact: "",
    dob: "",
    companyName: "",
    gst: "",
  });

  const [userRoles, setUserRoles] = useState([
    { id: 1, role: "Head User/HR", name: "", phone: "" },
  ]);

  // Form State - Step 2
  const [employeeMode, setEmployeeMode] = useState<"bulk" | "individual">("bulk");
  const [individuals, setIndividuals] = useState([
    { id: 1, name: "", phone: "", email: "", dept: "", seat: "Seat D11" },
  ]);

  const addUserRole = () => {
    setUserRoles([
      ...userRoles,
      { id: Date.now(), role: "User Role", name: "", phone: "" },
    ]);
  };

  const addIndividual = () => {
    setIndividuals([
      ...individuals,
      { id: Date.now(), name: "", phone: "", email: "", dept: "", seat: "" },
    ]);
  };

  // Form State - Step 3
  const [planType, setPlanType] = useState<"Hot Desk" | "Customize Deal">("Hot Desk");
  const [bookingType, setBookingType] = useState<"Open Seating" | "Meeting Room Access">("Open Seating");
  const [recurringBooking, setRecurringBooking] = useState(false);
  const [showRoomBooking, setShowRoomBooking] = useState(false);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);

  // Form State - Step 4
  const [paymentMode, setPaymentMode] = useState<"UPI" | "Bank Transfer" | "Card" | "Cheque">("UPI");
  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Quarterly" | "Annually">("Monthly");
  const [securityDepositAmount, setSecurityDepositAmount] = useState("₹ 50,000");
  const [modeOfDeposit, setModeOfDeposit] = useState("Bank Transfer (NEFT/RTGS)");
  const [bankDetails, setBankDetails] = useState({
    holderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  // Form State - Step 5
  const [additionalServices, setAdditionalServices] = useState({
    meetingRoom: true,
    printing: true,
    valetParking: true,
    tokenWallet: true,
  });
  const [walletDetails, setWalletDetails] = useState({
    holderName: "Joe",
    accountNumber: "532888499456",
    autoRecharge: true,
  });

  const handleNext = () => {
    if (currentStep === 2 && employeeMode === "bulk" && !uploadSuccess) {
      setUploadSuccess(true);
      return;
    }
    if (uploadSuccess) setUploadSuccess(false);
    if (currentStep < 7) setCurrentStep((p) => p + 1);
  };

  const handlePrev = () => {
    if (uploadSuccess) {
      setUploadSuccess(false);
      return;
    }
    if (currentStep > 1) setCurrentStep((p) => p - 1);
  };

  if (showInteractiveMap) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col font-sans relative z-50">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shrink-0 shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="cabin 18" className="w-[200px] h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6A2F]" />
            </div>
            <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-[#FF6A2F] text-white rounded-md text-[13px] font-medium flex items-center gap-2">All <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px]">42</span></button>
              <button className="px-3 py-1.5 text-gray-700 border border-gray-200 rounded-md text-[13px] font-medium flex items-center gap-2 bg-white"><span className="w-2 h-2 rounded-full bg-[#21A366]"></span> Available <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-600">28</span></button>
              <button className="px-3 py-1.5 text-gray-700 border border-gray-200 rounded-md text-[13px] font-medium flex items-center gap-2 bg-white"><span className="w-2 h-2 rounded-full bg-[#D92D20]"></span> Occupied <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-600">12</span></button>
              <button className="px-3 py-1.5 text-gray-700 border border-gray-200 rounded-md text-[13px] font-medium flex items-center gap-2 bg-white"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Under Maintenance <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-600">2</span></button>
              <button className="px-3 py-1.5 text-gray-700 border border-gray-200 rounded-md text-[13px] font-medium flex items-center gap-2 bg-white"><span className="w-2 h-2 rounded-full bg-[#FF6A2F]"></span> Upcoming <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-gray-600">12</span></button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 bg-white">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              Apr 4, 2026
            </div>
            <button onClick={() => setShowInteractiveMap(false)} className="px-5 py-2 bg-[#FF6A2F] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E55A20] transition-colors shadow-sm">Continue</button>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-white overflow-auto p-4 flex items-center justify-center">
          {/* Main map container */}
          <div className="relative w-[1100px] h-[580px] border-2 border-gray-400 bg-white shadow-sm shrink-0">
            {/* Top row */}
            <div className="absolute top-0 left-0 w-[160px] h-[140px] bg-[#00BCD4] border-r-2 border-b-2 border-gray-400 p-3 flex flex-col justify-between cursor-pointer">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-white font-bold text-[15px]">Cabin 1A</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#21A366]"></span>
                </div>
                <div className="flex items-center gap-1 text-white/90 text-[13px] mt-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>5</div>
              </div>
              <div className="bg-white text-[#00BCD4] font-bold text-[12px] py-1.5 px-2 rounded w-max">Available Now</div>
            </div>

            <div className="absolute top-0 left-[160px] w-[160px] h-[140px] bg-[#FFF5F5] border-r-2 border-b-2 border-gray-400 p-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-[#D92D20] font-bold text-[15px]">Cabin 1B</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D92D20] opacity-50"></span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-[13px] mt-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>5</div>
              </div>
              <div className="text-[#D92D20] font-bold text-[12px] text-center mt-2 bg-white rounded py-1 border border-red-100">4 months left</div>
            </div>

            <div className="absolute top-0 left-[320px] w-[160px] h-[140px] bg-[#FFF8F6] border-r-2 border-b-2 border-gray-400 p-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-[#FF6A2F] font-bold text-[15px]">Cabin 1C</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A2F]"></span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-[13px] mt-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>5</div>
              </div>
              <div className="text-[#FF6A2F] text-[12px] text-center mt-2 bg-white rounded py-1 border border-orange-100 font-medium">Next In 30 m</div>
            </div>

            <div className="absolute top-0 left-[480px] w-[160px] h-[140px] bg-[#FFF8F6] border-r-2 border-b-2 border-gray-400 p-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-[#FF6A2F] font-bold text-[15px]">Cabin 1D</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A2F]"></span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-[13px] mt-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>5</div>
              </div>
              <div className="text-[#FF6A2F] text-[12px] text-center mt-2 bg-white rounded py-1 border border-orange-100 font-medium">Next In 45 m</div>
            </div>

            {/* Small cabins 3A 3B */}
            <div className="absolute top-0 left-[640px] w-[75px] h-[140px] bg-[#FFF8F6] border-r-2 border-b-2 border-gray-400 p-2 flex flex-col justify-between text-center">
              <div>
                <h3 className="text-[#FF6A2F] font-bold text-[13px]">Cabin<br/>3A</h3>
                <div className="flex items-center justify-center gap-1 text-gray-500 text-[11px] mt-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>2</div>
              </div>
              <div className="text-[#FF6A2F] text-[10px]">Next In<br/>45 m</div>
            </div>
            <div className="absolute top-0 left-[715px] w-[75px] h-[140px] bg-[#FFF8F6] border-r-2 border-b-2 border-gray-400 p-2 flex flex-col justify-between text-center">
              <div>
                <h3 className="text-[#FF6A2F] font-bold text-[13px]">Cabin<br/>3B</h3>
                <div className="flex items-center justify-center gap-1 text-gray-500 text-[11px] mt-1"><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>2</div>
              </div>
              <div className="text-[#FF6A2F] text-[10px]">Next In<br/>45 m</div>
            </div>

            {/* Cabin 3C */}
            <div className="absolute top-0 left-[790px] w-[140px] h-[140px] bg-[#FFF5F5] border-r-2 border-b-2 border-gray-400 p-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-[#D92D20] font-bold text-[15px]">Cabin 3C</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D92D20] opacity-50"></span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-[13px] mt-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>5</div>
              </div>
              <div className="text-[#D92D20] font-bold text-[12px] text-center mt-2 bg-white rounded py-1 border border-red-100">1h 30m left</div>
            </div>

            {/* Meeting Room */}
            <div className="absolute top-0 left-[930px] w-[168px] h-[220px] bg-[#FFF5F5] border-b-2 border-gray-400 p-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-[#D92D20] font-bold text-[15px]">Meeting Room</h3>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D92D20] opacity-50"></span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-[13px] mt-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>7</div>
              </div>
              <div className="text-[#D92D20] font-bold text-[12px] text-center mt-2 bg-white rounded py-1 border border-red-100">2h 30m left</div>
            </div>

            {/* Hexagons Area */}
            <div className="absolute top-[140px] left-0 w-[240px] h-[438px] border-r-2 border-gray-400 flex flex-col items-center pt-4">
              <h4 className="text-[14px] font-medium text-gray-800 mb-6">8 Hexagon</h4>
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 -ml-4">
                <div className="w-[70px] h-[80px] bg-[#00BCD4] border-2 border-gray-800 transform skew-x-[-15deg]"></div>
                <div className="w-[70px] h-[80px] bg-[#00BCD4] border-2 border-gray-800 transform skew-x-[-15deg] -mt-6"></div>
                <div className="w-[70px] h-[80px] bg-[#F2FBF5] border-2 border-gray-800 transform skew-x-[-15deg]"></div>
                <div className="w-[70px] h-[80px] bg-[#F2FBF5] border-2 border-gray-800 transform skew-x-[-15deg] -mt-6"></div>
                <div className="w-[70px] h-[80px] bg-[#F2FBF5] border-2 border-gray-800 transform skew-x-[-15deg]"></div>
                <div className="w-[70px] h-[80px] bg-[#F2FBF5] border-2 border-gray-800 transform skew-x-[-15deg] -mt-6"></div>
                <div className="w-[70px] h-[80px] bg-[#F2FBF5] border-2 border-gray-800 transform skew-x-[-15deg]"></div>
                <div className="w-[70px] h-[80px] bg-[#F2FBF5] border-2 border-gray-800 transform skew-x-[-15deg] -mt-6"></div>
              </div>
            </div>

            {/* 10 Open Seats */}
            <div className="absolute top-[140px] left-[240px] w-[200px] h-[438px] flex flex-col items-center pt-24 border-r-2 border-gray-400">
              <h4 className="text-[14px] font-medium text-gray-800 mb-4">10 Open Seats</h4>
              <div className="w-[90px] h-[240px] bg-[#F2FBF5] border-2 border-gray-400 flex items-center justify-center">
                <span className="text-[#21A366] font-bold text-[14px] text-center">Open<br/>Seats</span>
              </div>
            </div>

            {/* Cabin 2A & 2B */}
            <div className="absolute top-[340px] left-[440px] w-[200px] h-[238px]">
              <div className="w-full h-[120px] bg-[#FFF8F6] border-t-2 border-l-2 border-r-2 border-gray-400 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-[#FF6A2F] font-bold text-[15px]">Cabin 2A</h3>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A2F]"></span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-[13px] mt-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>4</div>
                </div>
                <div className="text-[#FF6A2F] text-[12px] text-center mt-2 bg-white rounded py-1 border border-orange-100 font-medium">Next In 45 m</div>
              </div>
              <div className="w-full h-[118px] bg-[#EEF2F6] border-2 border-gray-400 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-gray-900 font-bold text-[15px]">Cabin 2B</h3>
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-900"></span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-[13px] mt-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>4</div>
                </div>
                <div className="text-gray-900 text-[12px] font-bold text-center mt-2 bg-white rounded py-1 border border-gray-200">Unavailable</div>
              </div>
            </div>

            {/* Washroom Area */}
            <div className="absolute top-[340px] left-[640px] w-[200px] h-[238px] bg-[#F2FBF5] border-t-2 border-l-2 border-gray-400 p-4 flex justify-center pt-8">
              <span className="text-[#21A366] font-bold text-[15px]">Washroom Area</span>
            </div>

            {/* Sofa Area / Pantry */}
            <div className="absolute top-[220px] left-[840px] w-[258px] h-[358px] border-l-2 border-t-2 border-gray-400 flex flex-col items-center">
              <span className="text-gray-800 font-medium text-[15px] absolute top-[40px] left-[20px]">Sofa<br/>Area</span>
              
              {/* Small cabins 4A 4B */}
              <div className="absolute top-[0px] left-[130px] flex">
                <div className="w-[50px] h-[100px] bg-[#FFF8F6] border-2 border-gray-400 p-1 flex flex-col justify-between text-center">
                  <div>
                    <h3 className="text-[#FF6A2F] font-bold text-[10px]">Cabin<br/>4A</h3>
                    <div className="flex items-center justify-center gap-1 text-gray-500 text-[9px] mt-0.5"><svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>2</div>
                  </div>
                  <div className="text-[#FF6A2F] font-medium text-[8px]">Next In<br/>45 m</div>
                </div>
                <div className="w-[50px] h-[100px] bg-[#FFF8F6] border-t-2 border-r-2 border-b-2 border-gray-400 p-1 flex flex-col justify-between text-center -ml-[2px]">
                  <div>
                    <h3 className="text-[#FF6A2F] font-bold text-[10px]">Cabin<br/>4B</h3>
                    <div className="flex items-center justify-center gap-1 text-gray-500 text-[9px] mt-0.5"><svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>2</div>
                  </div>
                  <div className="text-[#FF6A2F] font-medium text-[8px]">Next In<br/>45 m</div>
                </div>
              </div>

              <span className="text-gray-800 font-medium text-[16px] absolute top-[80px] right-[40px]">Pantry</span>

              {/* Bottom right cabins 5A 5B */}
              <div className="absolute bottom-[-2px] right-[-2px] flex">
                <div className="w-[60px] h-[80px] bg-[#FFF8F6] border-t-2 border-l-2 border-gray-400 p-1 flex flex-col justify-between text-center">
                  <div>
                    <h3 className="text-[#FF6A2F] font-bold text-[10px]">Cabin 5A</h3>
                  </div>
                  <div className="text-[#FF6A2F] text-[7px] bg-white rounded border border-orange-100 mt-1">Next In 45 m</div>
                </div>
                <div className="w-[60px] h-[80px] bg-[#FFF8F6] border-t-2 border-l-2 border-gray-400 p-1 flex flex-col justify-between text-center relative -ml-[2px]">
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FF6A2F]"></span>
                  <div>
                    <h3 className="text-[#FF6A2F] font-bold text-[10px]">Cabin 5B</h3>
                  </div>
                  <div className="text-[#FF6A2F] text-[7px] bg-white rounded border border-orange-100 mt-1">Next In 45 m</div>
                </div>
              </div>
            </div>

            {/* Door paths */}
            <div className="absolute bottom-[80px] left-[840px] w-[50px] h-[50px] border-b-2 border-l-2 border-gray-300 rounded-bl-full"></div>
            <div className="absolute bottom-[40px] left-[890px] w-[148px] h-[2px] bg-gray-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1440px] mx-auto pb-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div>
          <h1 className="text-[28px] font-bold text-[#101828] leading-tight">Onboarding</h1>
          <p className="text-sm text-[#667085] mt-1">Track potential clients, manage inquiries, and convert them into members.</p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex gap-6 items-start">
        {/* Left Sidebar (Stepper) */}
        <div className="w-[380px] shrink-0 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-6 flex flex-col min-h-[700px]">
          <h2 className="text-[18px] font-bold text-[#101828] mb-6">Onboarding Process</h2>
          
          <div className="flex flex-col flex-1">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isPast = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex gap-4 relative group cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                  {/* Line connecting steps */}
                  {index !== STEPS.length - 1 && (
                    <div 
                      className={`absolute left-4 top-10 bottom-[-16px] w-[2px] transition-colors ${
                        isActive || isPast ? "bg-[#FF6A2F]" : "bg-gray-100"
                      }`}
                    />
                  )}

                  <div className="flex flex-col items-center z-10 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isActive || isPast 
                        ? "bg-[#FF6A2F] text-white shadow-sm" 
                        : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                    }`}>
                      {/* Using custom icons per step from Figma might be complex without the SVGs, so using generic or checkmarks */}
                      {isPast ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          {/* Generic user/file icons for now */}
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="pb-8 pt-1">
                    <h3 className={`text-[15px] font-bold transition-colors ${
                      isActive ? "text-[#101828]" : "text-gray-500 group-hover:text-gray-700"
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-[13px] text-gray-400 mt-1 leading-relaxed max-w-[240px]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Onboarding Tip */}
          <div className="mt-auto pt-6">
            <div className="bg-[#FF6A2F] rounded-xl p-5 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {/* Lightbulb Icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-bold text-[14px]">Onboarding Tip</span>
              </div>
              <p className="text-[13px] text-white/90 leading-relaxed">
                Ensure all required fields are completed before proceeding to the next step. This helps maintain data integrity throughout the process.
              </p>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col h-full min-h-[700px]">
          {/* Header */}
          <div className="mb-6">
            <p className="text-[#FF6A2F] text-[13px] font-bold mb-1 tracking-wide uppercase">Step {currentStep} of 7</p>
            <h2 className="text-[28px] font-bold text-[#101828] mb-2">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-[#667085] text-[15px]">
              {currentStep === 1 && "Let's begin with the basic information about your client. We'll use this to prepare their workspace and plan allocation."}
              {currentStep === 2 && "Add team member details to manage access and stay connected."}
              {currentStep > 2 && "Please fill out the details for this section."}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col flex-1">
            {uploadSuccess ? (
              <div className="flex flex-col items-center justify-center flex-1 p-10 text-center min-h-[500px]">
                {/* Success Image Mock */}
                <div className="relative w-40 h-40 mb-6">
                  {/* A green circle with checkmark representing the image */}
                  <div className="absolute inset-0 bg-green-50 rounded-full flex items-center justify-center">
                    <div className="w-20 h-20 bg-[#00C853] rounded-full flex items-center justify-center shadow-lg transform scale-110">
                       <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-10 h-10">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                       </svg>
                    </div>
                  </div>
                  {/* Confetti mocks */}
                  <div className="absolute top-2 left-4 w-2 h-2 bg-yellow-400 rounded-sm transform rotate-45"></div>
                  <div className="absolute top-8 right-2 w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="absolute bottom-6 left-2 w-3 h-3 bg-red-400 transform rotate-12"></div>
                  <div className="absolute bottom-2 right-8 w-2 h-2 bg-orange-400 rounded-sm"></div>
                </div>
                
                <h3 className="text-[22px] font-bold text-gray-900 mb-2">File Upload Successfully 🎉</h3>
                <p className="text-[14px] text-gray-500 mb-8 max-w-[300px] leading-relaxed">
                  Your employee details have been uploaded successfully.<br />You can now proceed to the next step.
                </p>
                <button 
                  onClick={handleNext}
                  className="px-8 py-3.5 bg-[#FF6A2F] text-white rounded-lg text-[15px] font-semibold hover:bg-[#E55A20] transition-colors shadow-sm"
                >
                  Go to next Step
                </button>
              </div>
            ) : (
              <div className="p-8 flex-1 flex flex-col gap-8">
                {currentStep === 1 && (
                  <>
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-[16px] font-bold text-[#101828] mb-5">Personal Information</h3>
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Super User <span className="text-[#FF6A2F]">*</span></label>
                          <input type="text" placeholder="John Doe" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Phone Number <span className="text-[#FF6A2F]">*</span></label>
                          <input type="text" placeholder="+91 9876543210" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Email Address <span className="text-[#FF6A2F]">*</span></label>
                          <input type="email" placeholder="john.doe@gmail.com" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Alternate Contact (optional)</label>
                          <input type="text" placeholder="+91 9876543210" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Date of Birth <span className="text-[#FF6A2F]">*</span></label>
                          <div className="relative">
                            <input type="text" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F]" />
                            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Company Information */}
                    <div>
                      <h3 className="text-[16px] font-bold text-[#101828] mb-5">Company Information</h3>
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Company Name <span className="text-[#FF6A2F]">*</span></label>
                          <input type="text" placeholder="Tech Solutions Inc." className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Gst Number <span className="text-[#FF6A2F]">*</span></label>
                          <input type="text" placeholder="GNT34586G" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* User Roles */}
                    <div className="pb-4">
                      <h3 className="text-[16px] font-bold text-[#101828] mb-5">User Roles</h3>
                      <div className="flex flex-col gap-8">
                        {userRoles.map((role, idx) => (
                          <div key={role.id} className="flex flex-col gap-4">
                            {idx === 0 ? (
                              <p className="text-[13px] text-gray-700 font-medium -mb-1">{role.role}</p>
                            ) : (
                              <div>
                                <label className="block text-[13px] text-gray-700 font-medium mb-1.5">User Role <span className="text-[#FF6A2F]">*</span></label>
                                <input type="text" placeholder="User type" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                              </div>
                            )}
                            <div>
                              <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Name <span className="text-[#FF6A2F]">*</span></label>
                              <input type="text" placeholder="John Doe" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                            </div>
                            <div>
                              <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Phone Number <span className="text-[#FF6A2F]">*</span></label>
                              <input type="text" placeholder="+91 9876543210" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-6">
                        <button 
                          onClick={addUserRole}
                          className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add User
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div>
                      <h3 className="text-[16px] font-bold text-[#101828] mb-5">Employees Details</h3>
                      
                      <div className="flex gap-8 mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="empMode" 
                            checked={employeeMode === "bulk"} 
                            onChange={() => setEmployeeMode("bulk")}
                            className="w-4 h-4 text-[#FF6A2F] focus:ring-[#FF6A2F] accent-[#FF6A2F]" 
                          />
                          <span className="text-[14px] text-gray-800 font-medium">Bulk Upload Employees</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="empMode" 
                            checked={employeeMode === "individual"} 
                            onChange={() => setEmployeeMode("individual")}
                            className="w-4 h-4 text-[#FF6A2F] focus:ring-[#FF6A2F] accent-[#FF6A2F]" 
                          />
                          <span className="text-[14px] text-gray-800 font-medium">Add Individually</span>
                        </label>
                      </div>

                      {employeeMode === "bulk" && (
                        <div className="border border-dashed border-gray-300 rounded-xl bg-white p-10 flex flex-col items-center justify-center relative min-h-[300px] hover:bg-gray-50 transition-colors cursor-pointer group">
                          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          {/* Excel Icon Mock */}
                          <div className="w-16 h-16 bg-[#21A366] rounded-xl flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-sm group-hover:scale-105 transition-transform">
                            X
                          </div>
                          <p className="text-[14px] font-bold text-gray-800">Employee Details</p>
                        </div>
                      )}

                      {employeeMode === "individual" && (
                        <div className="flex flex-col gap-8 pb-4">
                          {individuals.map((ind, idx) => (
                            <div key={ind.id} className="flex flex-col gap-4">
                              {idx > 0 && <div className="h-px bg-gray-100 my-2" />}
                              <div>
                                <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Full Name <span className="text-[#FF6A2F]">*</span></label>
                                <input type="text" placeholder="John Doe" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                              </div>
                              <div>
                                <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Phone Number <span className="text-[#FF6A2F]">*</span></label>
                                <input type="text" placeholder="+91 9876543210" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                              </div>
                              <div>
                                <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Email Address <span className="text-[#FF6A2F]">*</span></label>
                                <input type="email" placeholder="john.doe@gmail.com" className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                              </div>
                              <div>
                                <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Department/Designation <span className="text-[#FF6A2F]">*</span></label>
                                <div className="relative">
                                  <select className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] appearance-none bg-white">
                                    <option>HR</option>
                                    <option>IT</option>
                                    <option>Sales</option>
                                  </select>
                                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Assigned seat <span className="text-[#FF6A2F]">*</span></label>
                                <div className="w-full h-12 bg-[#FF6A2F] rounded-lg flex items-center justify-center text-white font-semibold text-[14px] cursor-pointer hover:bg-[#E55A20] transition-colors shadow-sm">
                                  {ind.seat || "Select Seat"}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex justify-end mt-2">
                            <button 
                              onClick={addIndividual}
                              className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm"
                            >
                              Add more
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {currentStep === 3 && !showRoomBooking && (
                  <div className="flex flex-col gap-8 pb-4">
                    {/* Plan Type */}
                    <div>
                      <h3 className="text-[14px] font-bold text-[#101828] mb-3">Plan Type</h3>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setPlanType("Hot Desk")}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border ${planType === "Hot Desk" ? "border-[#FF6A2F] bg-[#FFF8F6] text-[#FF6A2F]" : "border-gray-200 text-gray-500 hover:bg-gray-50"} transition-colors`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mb-2"><path d="M4 16h16M4 20h16M6 16v4M18 16v4M8 10h8M8 10v6M16 10v6M10 6h4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="text-[13px] font-semibold">Hot Desk</span>
                        </button>
                        <button 
                          onClick={() => setPlanType("Customize Deal")}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border ${planType === "Customize Deal" ? "border-[#FF6A2F] bg-[#FFF8F6] text-[#FF6A2F]" : "border-gray-200 text-gray-500 hover:bg-gray-50"} transition-colors`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mb-2"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="text-[13px] font-semibold">Customize Deal</span>
                        </button>
                      </div>
                    </div>

                    {/* Type of Booking */}
                    <div>
                      <h3 className="text-[14px] font-bold text-[#101828] mb-3">Type of Booking</h3>
                      <div className="flex flex-col gap-3">
                        <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${bookingType === "Open Seating" ? "border-[#FF6A2F]" : "border-gray-200"}`}>
                          <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300">
                            {bookingType === "Open Seating" && <div className="w-3 h-3 rounded-full bg-[#FF6A2F]" />}
                          </div>
                          <input type="radio" className="hidden" checked={bookingType === "Open Seating"} onChange={() => setBookingType("Open Seating")} />
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">Open Seating</p>
                            <p className="text-[12px] text-gray-500">Flexible desk arrangement</p>
                          </div>
                        </label>

                        <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${bookingType === "Meeting Room Access" ? "border-[#FF6A2F]" : "border-gray-200"}`}>
                          <div className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-300">
                            {bookingType === "Meeting Room Access" && <div className="w-3 h-3 rounded-full bg-[#FF6A2F]" />}
                          </div>
                          <input type="radio" className="hidden" checked={bookingType === "Meeting Room Access"} onChange={() => setBookingType("Meeting Room Access")} />
                          <div className="flex-1">
                            <p className="text-[14px] font-bold text-gray-900">Meeting Room Access</p>
                            <p className="text-[12px] text-gray-500">Book conference spaces</p>
                          </div>
                          {bookingType === "Meeting Room Access" && (
                            <button onClick={(e) => { e.preventDefault(); setShowRoomBooking(true); }} className="px-3 py-1.5 bg-[#FFF8F6] text-[#FF6A2F] text-[12px] font-bold rounded-lg hover:bg-[#FFEAE0] transition-colors">
                              Book Room
                            </button>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Recurring Booking */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                      <div>
                        <p className="text-[14px] font-bold text-gray-900">Recurring Booking</p>
                        <p className="text-[12px] text-gray-500">Book this meeting room on a regular schedule</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={recurringBooking} onChange={(e) => setRecurringBooking(e.target.checked)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6A2F]"></div>
                      </label>
                    </div>

                    {/* Seat Assignment */}
                    <div>
                      <h3 className="text-[14px] font-bold text-[#101828] mb-3">Seat Assignment</h3>
                      <button onClick={() => setShowInteractiveMap(true)} className="w-full py-4 rounded-xl border border-[#FF6A2F] bg-[#FFF8F6] hover:bg-[#FFEAE0] transition-colors flex flex-col items-center justify-center gap-1">
                        <span className="text-[14px] font-bold text-gray-900">Select Seats</span>
                        <span className="text-[12px] text-gray-500">Select seats from interactive map</span>
                      </button>
                    </div>

                    {/* Seat Allocation */}
                    <div>
                      <h3 className="text-[14px] font-bold text-[#101828] mb-1">Seat Allocation</h3>
                      <p className="text-[12px] text-gray-500 mb-3">Total allocation calculated automatically</p>
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Open Seats</label>
                          <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FF6A2F] appearance-none">
                            <option>0</option>
                            <option>1</option>
                            <option>2</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Cabins</label>
                          <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FF6A2F] appearance-none">
                            <option>Select Cabin</option>
                            <option>Cabin 1A</option>
                            <option>Cabin 2B</option>
                          </select>
                        </div>
                      </div>
                      <div className="w-full p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-[13px] font-medium text-gray-800">Total Allocation : {planType === 'Customize Deal' ? '10 seats, cabins - 3C, 4B' : '0'}</p>
                      </div>
                    </div>

                    {/* Customize Deal Details */}
                    {planType === "Customize Deal" && (
                      <div className="mt-2">
                        <h3 className="text-[14px] font-bold text-[#101828] mb-3">Deal Details (Customize Deal)</h3>
                        <p className="text-[13px] font-bold text-gray-800 mb-3">Section 1: Step-Up Pricing Schedule</p>
                        
                        <div className="flex gap-4 mb-4">
                          <div className="flex-1">
                            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Start Date</label>
                            <input type="date" defaultValue="2026-04-10" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FF6A2F]" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Initial Monthly Rent</label>
                            <input type="text" defaultValue="₹ 40,000/-" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FF6A2F]" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Duration</label>
                            <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FF6A2F] appearance-none">
                              <option>For [X] months</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-[12px] font-medium text-[#D92D20] mb-1.5">Year-on-Year Increase *</label>
                            <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FF6A2F] appearance-none">
                              <option>5%</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-4 mb-4">
                          <div className="flex-1 opacity-0 pointer-events-none"></div>
                          <div className="flex-1">
                            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Revised Monthly Rent</label>
                            <input type="text" defaultValue="₹ 50,000/-" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FF6A2F]" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Duration</label>
                            <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#FF6A2F] appearance-none">
                              <option>For [X] months</option>
                            </select>
                          </div>
                          <div className="flex-1 opacity-0 pointer-events-none"></div>
                        </div>

                        <div className="p-3 bg-[#FFF8F6] rounded-lg mb-2">
                          <p className="text-[12px] text-[#FF6A2F] font-medium">Deal Price: 10,000/- + 30,000/- + GST% = 50,000/-</p>
                        </div>
                        <div className="p-3 bg-[#FFF8F6] rounded-lg">
                          <p className="text-[12px] text-[#FF6A2F] font-medium">Deal: Jan-Mar 50k/mo, Apr-Dec 60k/mo.</p>
                        </div>
                      </div>
                    )}

                    {/* Security & Commitment */}
                    <div className="mt-2">
                      <h3 className="text-[14px] font-bold text-[#101828] mb-3">Security & Commitment</h3>
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Lock-in Period</label>
                          <div className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 flex items-center">
                            12 months
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[12px] font-medium text-gray-700 mb-1.5">Security Deposit</label>
                          <div className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                            <span className="text-[13px] text-gray-800">₹ 18,000/-</span>
                            <span className="text-[11px] text-gray-400">(2x highest monthly rent)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 mb-6">
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#FF6A2F]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-[13px] font-bold text-gray-900">Multi-center access</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6A2F]"></div>
                        </label>
                      </div>

                      <p className="text-[13px] font-bold text-gray-900 mb-2">Important Rules (A small information text)</p>
                      <div className="flex gap-3 p-4 bg-[#FFFAEB] border border-[#FEF0C7] rounded-xl text-[#B54708]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-[12px] leading-relaxed">
                          <span className="font-bold">Important:</span> Seat downgrades are not permitted during the Lock-in period. Seat increases are subject to availability and will trigger a pro-rata security deposit and billing adjustment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && showRoomBooking && (
                  <div className="flex flex-col gap-8 pb-4">
                    {/* Plan Type */}
                    <div>
                      <h3 className="text-[14px] font-bold text-[#101828] mb-3">Plan Type</h3>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setPlanType("Hot Desk")}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border ${planType === "Hot Desk" ? "border-[#FF6A2F] bg-[#FFF8F6] text-[#FF6A2F]" : "border-gray-200 text-gray-500 hover:bg-gray-50"} transition-colors`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mb-2"><path d="M4 16h16M4 20h16M6 16v4M18 16v4M8 10h8M8 10v6M16 10v6M10 6h4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="text-[13px] font-semibold">Hot Desk</span>
                        </button>
                        <button 
                          onClick={() => setPlanType("Customize Deal")}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border ${planType === "Customize Deal" ? "border-[#FF6A2F] bg-[#FFF8F6] text-[#FF6A2F]" : "border-gray-200 text-gray-500 hover:bg-gray-50"} transition-colors`}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 mb-2"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="text-[13px] font-semibold">Customize Deal</span>
                        </button>
                      </div>
                    </div>

                    {/* Room Selection Details */}
                    <div>
                      <h2 className="text-[24px] font-bold text-[#101828] mb-1">Cabin 1A</h2>
                      <div className="flex items-center gap-4 text-[13px] text-gray-500 mb-6">
                        <span className="flex items-center gap-1.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round"/></svg> Capacity: 5</span>
                        <span className="flex items-center gap-1.5"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round"/></svg> Saturday, Apr 4, 2026</span>
                      </div>

                      {/* Currently Occupied card */}
                      <div className="bg-[#FFF8F6] border border-[#FFEAE0] rounded-xl p-5 mb-8 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-[#FF6A2F]"></div>
                          <span className="text-[13px] font-bold text-[#FF6A2F]">Currently Occupied</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px]">
                          <div className="text-gray-500">Booked by</div>
                          <div className="text-right font-semibold text-[#FF6A2F]">Sarah Johnson</div>
                          <div className="text-gray-500">Company</div>
                          <div className="text-right font-semibold text-[#FF6A2F]">TechCorp</div>
                          <div className="text-gray-500">Time</div>
                          <div className="text-right font-semibold text-[#FF6A2F]">10:00 AM - 2:00 PM</div>
                          <div className="text-gray-500">Ends in</div>
                          <div className="text-right font-semibold text-[#FF6A2F]">1h 30m</div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[14px] font-bold text-[#101828] mb-4">Make New Booking</h3>
                        
                        <h3 className="text-[13px] font-medium text-gray-700 mb-3">Duration</h3>
                        <div className="flex gap-3 mb-6">
                          <button className="flex-1 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-[13px] font-semibold shadow-sm">1 Hour</button>
                          <button className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">2 Hours</button>
                          <button className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">4 Hours</button>
                          <button className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">Full Day</button>
                        </div>

                        <h3 className="text-[13px] font-medium text-gray-700 mb-3">Select Start Time</h3>
                        <div className="grid grid-cols-4 gap-3 mb-8">
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">09:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">10:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">11:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">12:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">13:00</button>
                          <button className="py-2.5 bg-[#FF6A2F] text-white rounded-lg text-[13px] font-semibold shadow-sm">14:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">15:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">16:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">17:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">18:00</button>
                          <button className="py-2.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-200 transition-colors">19:00</button>
                        </div>

                        <h3 className="text-[13px] font-medium text-gray-700 mb-3">Number of People</h3>
                        <div className="flex gap-3 items-center">
                          <button className="w-12 h-12 bg-gray-100 text-gray-600 rounded-lg font-bold text-lg flex items-center justify-center hover:bg-gray-200 transition-colors">-</button>
                          <div className="flex-1 h-12 border border-gray-200 rounded-lg flex items-center px-4 justify-between">
                            <span className="font-semibold text-[14px] text-gray-800">1</span>
                          </div>
                          <button className="w-12 h-12 bg-gray-100 text-gray-600 rounded-lg font-bold text-lg flex items-center justify-center hover:bg-gray-200 transition-colors">+</button>
                        </div>
                        <p className="text-center text-[11px] text-gray-400 mt-3">Maximum capacity: 5 people</p>
                      </div>
                      
                      <div className="flex gap-4 mt-10">
                        <button onClick={() => setShowRoomBooking(false)} className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                          Cancel
                        </button>
                        <button onClick={() => setShowRoomBooking(false)} className="flex-1 py-3.5 bg-[#FF6A2F] text-white rounded-lg text-[14px] font-semibold shadow-sm hover:bg-[#E55A20] transition-colors flex items-center justify-center gap-2">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Confirm Booking
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="flex flex-col gap-8 pb-4">
                    {/* Payment Mode Preference */}
                    <div>
                      <h3 className="text-[14px] font-bold text-[#101828] mb-3">Payment Mode Preference</h3>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setPaymentMode("UPI")}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border ${paymentMode === "UPI" ? "border-[#FF6A2F] bg-[#FFF8F6]" : "border-gray-200 text-gray-500 hover:bg-gray-50"} transition-colors`}
                        >
                          <span className={`text-[16px] font-bold mb-1 ${paymentMode === "UPI" ? "text-[#FF6A2F]" : "text-gray-700"}`}>G Pay</span>
                          <span className={`text-[12px] font-bold ${paymentMode === "UPI" ? "text-[#101828]" : ""}`}>UPI</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMode("Bank Transfer")}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border ${paymentMode === "Bank Transfer" ? "border-[#FF6A2F] bg-[#FFF8F6]" : "border-gray-200 text-gray-500 hover:bg-gray-50"} transition-colors`}
                        >
                          <svg className="w-6 h-6 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                          <span className={`text-[12px] font-bold ${paymentMode === "Bank Transfer" ? "text-[#101828]" : ""}`}>Bank Transfer</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMode("Card")}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border ${paymentMode === "Card" ? "border-[#FF6A2F] bg-[#FFF8F6]" : "border-gray-200 text-gray-500 hover:bg-gray-50"} transition-colors`}
                        >
                          <svg className="w-6 h-6 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                          <span className={`text-[12px] font-bold ${paymentMode === "Card" ? "text-[#101828]" : ""}`}>Card</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMode("Cheque")}
                          className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border ${paymentMode === "Cheque" ? "border-[#FF6A2F] bg-[#FFF8F6]" : "border-gray-200 text-gray-500 hover:bg-gray-50"} transition-colors`}
                        >
                          <svg className="w-6 h-6 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <span className={`text-[12px] font-bold ${paymentMode === "Cheque" ? "text-[#101828]" : ""}`}>Cheque</span>
                        </button>
                      </div>
                    </div>

                    {/* Billing Cycle */}
                    <div>
                      <h3 className="text-[14px] font-bold text-[#101828] mb-3">Billing Cycle</h3>
                      <div className="flex gap-4">
                        <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-colors relative ${billingCycle === "Monthly" ? "border-[#FF6A2F] bg-[#FFF8F6]" : "border-gray-200 hover:bg-gray-50"}`}>
                          <input type="radio" className="hidden" checked={billingCycle === "Monthly"} onChange={() => setBillingCycle("Monthly")} />
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[14px] font-bold text-gray-900">Monthly</span>
                            <div className="w-4 h-4 rounded-full border flex items-center justify-center border-gray-300">
                              {billingCycle === "Monthly" && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6A2F]"></div>}
                            </div>
                          </div>
                          <p className="text-[12px] text-gray-500 leading-tight">Billed on the 1st of every month</p>
                        </label>
                        <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-colors relative ${billingCycle === "Quarterly" ? "border-[#FF6A2F] bg-[#FFF8F6]" : "border-gray-200 hover:bg-gray-50"}`}>
                          <input type="radio" className="hidden" checked={billingCycle === "Quarterly"} onChange={() => setBillingCycle("Quarterly")} />
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[14px] font-bold text-gray-900">Quarterly</span>
                            <div className="w-4 h-4 rounded-full border flex items-center justify-center border-gray-300">
                              {billingCycle === "Quarterly" && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6A2F]"></div>}
                            </div>
                          </div>
                          <p className="text-[12px] text-gray-500 leading-tight">Billed every 3 months with 5% discount</p>
                        </label>
                        <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-colors relative ${billingCycle === "Annually" ? "border-[#FF6A2F] bg-[#FFF8F6]" : "border-gray-200 hover:bg-gray-50"}`}>
                          <input type="radio" className="hidden" checked={billingCycle === "Annually"} onChange={() => setBillingCycle("Annually")} />
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[14px] font-bold text-gray-900">Annually</span>
                            <div className="w-4 h-4 rounded-full border flex items-center justify-center border-gray-300">
                              {billingCycle === "Annually" && <div className="w-2.5 h-2.5 rounded-full bg-[#FF6A2F]"></div>}
                            </div>
                          </div>
                          <p className="text-[12px] text-gray-500 leading-tight">Billed 12 months with 20% discount</p>
                        </label>
                      </div>
                    </div>

                    {/* Deposit Info */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Security Deposit Amount</label>
                        <input type="text" value={securityDepositAmount} onChange={(e) => setSecurityDepositAmount(e.target.value)} className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F]" />
                      </div>
                      <div>
                        <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Mode of Deposit</label>
                        <div className="relative">
                          <select value={modeOfDeposit} onChange={(e) => setModeOfDeposit(e.target.value)} className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] text-gray-700 focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] appearance-none bg-white">
                            <option>Bank Transfer (NEFT/RTGS)</option>
                            <option>Cheque</option>
                            <option>UPI</option>
                          </select>
                          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>

                    {/* Linked Bank Account */}
                    <div>
                      <h3 className="text-[14px] font-bold text-[#101828] mb-3">Linked Bank Account (For Refunds)</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] text-gray-700 font-medium mb-1.5">Account Holder Name</label>
                          <input type="text" placeholder="Enter full name as per bank" value={bankDetails.holderName} onChange={(e) => setBankDetails({...bankDetails, holderName: e.target.value})} className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[12px] text-gray-700 font-medium mb-1.5">Account Number</label>
                          <input type="text" placeholder="Enter account number" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})} className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[12px] text-gray-700 font-medium mb-1.5">IFSC Code</label>
                          <input type="text" placeholder="e.g., HDFC0001234" value={bankDetails.ifscCode} onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})} className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[12px] text-gray-700 font-medium mb-1.5">Bank Name</label>
                          <input type="text" placeholder="Enter bank name" value={bankDetails.bankName} onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})} className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 p-4 bg-[#FF6A2F] rounded-xl text-white shadow-sm mt-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0 mt-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <p className="text-[14px] font-bold mb-1">Your financial data is secure</p>
                        <p className="text-[12px] text-white/90 leading-relaxed">
                          All payment and banking information is encrypted with bank-grade security (256-bit SSL) and never shared with third parties.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="flex flex-col gap-6 pb-4">
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Meeting Room Access */}
                      <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#FFF8F6] text-[#FF6A2F] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">Meeting Room Access</p>
                            <p className="text-[12px] text-gray-500">Allow client to book meeting rooms</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={additionalServices.meetingRoom} onChange={(e) => setAdditionalServices({...additionalServices, meetingRoom: e.target.checked})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6A2F]"></div>
                        </label>
                      </div>
                      
                      {/* Printing Access */}
                      <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#FFF8F6] text-[#FF6A2F] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" /></svg>
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">Printing Access</p>
                            <p className="text-[12px] text-gray-500">Enable printing and scanning facilities</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={additionalServices.printing} onChange={(e) => setAdditionalServices({...additionalServices, printing: e.target.checked})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6A2F]"></div>
                        </label>
                      </div>

                      {/* Valet Parking */}
                      <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#FFF8F6] text-[#FF6A2F] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">Valet Parking</p>
                            <p className="text-[12px] text-gray-500">Grant access to cafeteria services</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={additionalServices.valetParking} onChange={(e) => setAdditionalServices({...additionalServices, valetParking: e.target.checked})} className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6A2F]"></div>
                        </label>
                      </div>

                      {/* Token Wallet Setup */}
                      <div className="bg-gray-50">
                        <div className="flex items-center justify-between p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-[#FF6A2F] flex items-center justify-center shadow-sm">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            </div>
                            <div>
                              <p className="text-[14px] font-bold text-gray-900">Token Wallet Setup</p>
                              <p className="text-[12px] text-gray-500">Enable prepaid token system for services</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={additionalServices.tokenWallet} onChange={(e) => setAdditionalServices({...additionalServices, tokenWallet: e.target.checked})} className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF6A2F]"></div>
                          </label>
                        </div>
                        
                        {additionalServices.tokenWallet && (
                          <div className="p-5 pt-0">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-[12px] text-gray-700 font-medium mb-1.5">Account Holder Name</label>
                                <input type="text" value={walletDetails.holderName} onChange={(e) => setWalletDetails({...walletDetails, holderName: e.target.value})} className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] bg-white" />
                              </div>
                              <div>
                                <label className="block text-[12px] text-gray-700 font-medium mb-1.5">Account Number</label>
                                <input type="text" value={walletDetails.accountNumber} onChange={(e) => setWalletDetails({...walletDetails, accountNumber: e.target.value})} className="w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] bg-white" />
                              </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={walletDetails.autoRecharge} onChange={(e) => setWalletDetails({...walletDetails, autoRecharge: e.target.checked})} className="w-4 h-4 text-[#FF6A2F] focus:ring-[#FF6A2F] accent-[#FF6A2F] rounded border-gray-300" />
                              <span className="text-[13px] text-gray-800 font-medium">Enable auto-recharge when balance is low</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[#21A366]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[13px] font-medium">Changes are auto-saved</span>
                    </div>
                  </div>
                )}

                {currentStep > 5 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4 min-h-[400px]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-16 h-16 text-gray-200">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <p>Step {currentStep} Content (To be implemented)</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {!uploadSuccess && (
              <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-white rounded-b-2xl">
                <button 
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors ${
                    currentStep === 1 
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed" 
                      : "bg-[#F9FAFB] text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                    Save as Draft
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E55A20] transition-colors shadow-sm"
                  >
                    Continue
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
