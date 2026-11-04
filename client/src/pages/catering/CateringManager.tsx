import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { Modal } from '../../components/Modal.js';
import {
  UtensilsCrossed,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Building,
  Check,
  X,
  CreditCard,
  Layers,
  ChevronRight,
  Calculator,
  Download,
  AlertCircle
} from 'lucide-react';

interface CateringEnquiry {
  id: string;
  enquiry_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  organization?: string;
  event_name: string;
  event_type: string;
  event_date: string;
  event_duration_hours: number;
  venue: string;
  guest_count: number;
  budget?: number;
  service_style: string;
  dietary_requirements?: string;
  special_instructions?: string;
  status: string;
}

interface CateringBooking {
  id: string;
  booking_number: string;
  event_name: string;
  event_date: string;
  venue: string;
  guest_count: number;
  total_amount: number;
  deposit_amount: number;
  deposit_paid: number;
  balance_due: number;
  balance_paid: number;
  payment_status: string;
  event_status: string;
}

interface CateringPackage {
  id: string;
  name: string;
  event_type: string;
  description: string;
  price_per_person: number;
  min_guests: number;
  max_guests: number;
  included_items: string[];
}

export const CateringManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'quotations' | 'bookings' | 'packages' | 'equipment'>('overview');
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [enquiries, setEnquiries] = useState<CateringEnquiry[]>([]);
  const [bookings, setBookings] = useState<CateringBooking[]>([]);
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Enquiry Modal
  const [newEnquiryModalOpen, setNewEnquiryModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custOrg, setCustOrg] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('corporate');
  const [eventDate, setEventDate] = useState('2026-11-28');
  const [venue, setVenue] = useState('');
  const [guestCount, setGuestCount] = useState('100');
  const [budget, setBudget] = useState('350000');
  const [serviceStyle, setServiceStyle] = useState('buffet');
  const [dietary, setDietary] = useState('Halal & Vegetarian options');

  // Quotation Calculator Modal
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<CateringEnquiry | null>(null);
  const [quoteRate, setQuoteRate] = useState('3500');
  const [quoteLabor, setQuoteLabor] = useState('35000');
  const [quoteEquipment, setQuoteEquipment] = useState('45000');
  const [quoteTransport, setQuoteTransport] = useState('15000');
  const [quoteDiscount, setQuoteDiscount] = useState('0');
  const [createdQuote, setCreatedQuote] = useState<any | null>(null);

  // Deposit Modal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CateringBooking | null>(null);
  const [mpesaCode, setMpesaCode] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dash, enq, bkg, pkg, eq] = await Promise.all([
        apiFetch<any>('/catering/dashboard'),
        apiFetch<CateringEnquiry[]>('/catering/enquiries'),
        apiFetch<CateringBooking[]>('/catering/bookings'),
        apiFetch<CateringPackage[]>('/catering/packages'),
        apiFetch<any[]>('/catering/equipment'),
      ]);
      setDashboardData(dash);
      setEnquiries(enq);
      setBookings(bkg);
      setPackages(pkg);
      setEquipment(eq);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnquiry = async () => {
    if (!custName || !custPhone || !eventName || !eventDate) {
      alert('Please fill in required enquiry details.');
      return;
    }
    try {
      await apiFetch('/catering/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: custName,
          customer_phone: custPhone,
          customer_email: custEmail,
          organization: custOrg,
          event_name: eventName,
          event_type: eventType,
          event_date: eventDate,
          venue: venue || 'Client Venue',
          guest_count: parseInt(guestCount, 10) || 50,
          budget: parseFloat(budget || '0'),
          service_style: serviceStyle,
          dietary_requirements: dietary,
        }),
      });
      setNewEnquiryModalOpen(false);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to create enquiry');
    }
  };

  const handleCalculateQuote = async () => {
    if (!selectedEnquiry) return;
    try {
      const quote = await apiFetch<any>('/catering/quotations/calculate', {
        method: 'POST',
        body: JSON.stringify({
          enquiry_id: selectedEnquiry.id,
          per_person_rate: parseFloat(quoteRate),
          guest_count: selectedEnquiry.guest_count,
          labor_cost: parseFloat(quoteLabor),
          equipment_cost: parseFloat(quoteEquipment),
          transport_cost: parseFloat(quoteTransport),
          discount_amount: parseFloat(quoteDiscount),
        }),
      });
      setCreatedQuote(quote);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      await apiFetch(`/catering/quotations/${quoteId}/accept`, { method: 'POST' });
      setQuoteModalOpen(false);
      setCreatedQuote(null);
      loadAllData();
      alert('Quotation accepted! Confirmed event booking created.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePayDeposit = async () => {
    if (!selectedBooking) return;
    try {
      await apiFetch(`/catering/bookings/${selectedBooking.id}/pay-deposit`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: 'mpesa_stk',
          mpesa_code: mpesaCode || `MPESA-${Date.now()}`,
        }),
      });
      setDepositModalOpen(false);
      setSelectedBooking(null);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSettleBalance = async (bookingId: string) => {
    try {
      await apiFetch(`/catering/bookings/${bookingId}/reconcile-balance`, { method: 'POST' });
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-3 sm:p-5 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 1. TOP CATERING KPI STRIP */}
        {dashboardData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Enquiries</span>
              <span className="text-xl font-black text-stone-900 dark:text-stone-100 mt-0.5 block">{dashboardData.enquiries.total_enquiries}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{dashboardData.enquiries.new_enquiries} New • {dashboardData.enquiries.quoted_enquiries} Quoted</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-amber-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Confirmed Events</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">{dashboardData.bookings.confirmed_bookings}</span>
              <span className="text-[10px] text-stone-500">{dashboardData.bookings.total_guests_catered} Total Guests Catered</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Deposits Collected</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                KES {dashboardData.bookings.total_deposits_collected.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Verified via M-Pesa STK</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Booked Event Value</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400 mt-0.5 block">
                KES {dashboardData.bookings.total_booked_value.toLocaleString()}
              </span>
              <span className="text-[10px] text-stone-500">Balances Due: KES {dashboardData.bookings.outstanding_balances.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* 2. SUBMODULE TABS & ACTIONS */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {[
              { id: 'overview', label: 'Catering Overview' },
              { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
              { id: 'bookings', label: `Events & Bookings (${bookings.length})` },
              { id: 'packages', label: `Packages (${packages.length})` },
              { id: 'equipment', label: `Equipment (${equipment.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setNewEnquiryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>New Event Enquiry</span>
          </button>
        </div>

        {/* 3. ENQUIRIES TAB */}
        {activeTab === 'enquiries' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs overflow-hidden">
            <div className="p-3 bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
              <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                Prospective Event Enquiries Pipeline
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 text-stone-500 font-extrabold uppercase text-[10px]">
                    <th className="p-3">Ref & Event</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Date & Venue</th>
                    <th className="p-3">Guests</th>
                    <th className="p-3">Budget</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {enquiries.map((enq) => (
                    <tr key={enq.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50">
                      <td className="p-3">
                        <span className="font-extrabold font-mono text-stone-900 dark:text-stone-100 block">
                          {enq.enquiry_number}
                        </span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">{enq.event_name}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">{enq.customer_name}</span>
                        <span className="text-[10px] text-stone-400">{enq.customer_phone}</span>
                        {enq.organization && <span className="text-[10px] text-purple-600 block">{enq.organization}</span>}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block">{enq.event_date}</span>
                        <span className="text-[10px] text-stone-400">{enq.venue}</span>
                      </td>
                      <td className="p-3 font-bold text-stone-800 dark:text-stone-200">
                        {enq.guest_count} pax
                      </td>
                      <td className="p-3 font-bold text-amber-600">
                        {enq.budget ? `KES ${enq.budget.toLocaleString()}` : 'Flexible'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          enq.status === 'booked' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          enq.status === 'quoted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {enq.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {enq.status !== 'booked' && (
                          <button
                            onClick={() => {
                              setSelectedEnquiry(enq);
                              setQuoteModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                          >
                            Prepare Quote
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. BOOKINGS & EVENTS TAB */}
        {(activeTab === 'bookings' || activeTab === 'overview') && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs overflow-hidden">
            <div className="p-3 bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
              <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                Confirmed Event Bookings & Production Schedules
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 text-stone-500 font-extrabold uppercase text-[10px]">
                    <th className="p-3">Booking #</th>
                    <th className="p-3">Event & Venue</th>
                    <th className="p-3">Date & Guests</th>
                    <th className="p-3">Total Value</th>
                    <th className="p-3">Deposit Status</th>
                    <th className="p-3">Balance Due</th>
                    <th className="p-3 text-right">Settlement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50">
                      <td className="p-3 font-mono font-extrabold text-stone-900 dark:text-stone-100">
                        {b.booking_number}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-900 dark:text-stone-100 block">{b.event_name}</span>
                        <span className="text-[10px] text-stone-400">{b.venue}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-stone-800 dark:text-stone-200 block">{b.event_date}</span>
                        <span className="text-[10px] text-stone-400">{b.guest_count} guests</span>
                      </td>
                      <td className="p-3 font-extrabold text-amber-600 dark:text-amber-400">
                        KES {b.total_amount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        {b.deposit_paid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            ✓ 50% Paid (KES {b.deposit_amount.toLocaleString()})
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setDepositModalOpen(true);
                            }}
                            className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-[10px]"
                          >
                            Pay Deposit (KES {b.deposit_amount.toLocaleString()})
                          </button>
                        )}
                      </td>
                      <td className="p-3 font-bold text-stone-700 dark:text-stone-300">
                        KES {b.balance_due.toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        {b.deposit_paid && b.balance_due > 0 ? (
                          <button
                            onClick={() => handleSettleBalance(b.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            Reconcile Balance
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600">Fully Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PACKAGES TAB */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {pkg.event_type}
                  </span>
                  <span className="text-sm font-black text-amber-600">
                    KES {pkg.price_per_person.toLocaleString()} / pax
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">{pkg.name}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{pkg.description}</p>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 space-y-1">
                  <span className="font-bold text-[10px] text-stone-400 uppercase block">Sample Courses Included:</span>
                  {pkg.included_items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. EQUIPMENT TAB */}
        {activeTab === 'equipment' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs overflow-hidden">
            <div className="p-3 bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 font-bold text-xs text-stone-900 dark:text-stone-100">
              Catering Equipment, Tents & Chafing Inventory
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200/80 dark:border-stone-800/80 text-stone-500 font-extrabold uppercase text-[10px]">
                    <th className="p-3">Equipment Item</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Total In Stock</th>
                    <th className="p-3">Available for Events</th>
                    <th className="p-3">Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {equipment.map((eq) => (
                    <tr key={eq.id}>
                      <td className="p-3 font-bold text-stone-900 dark:text-stone-100">{eq.name}</td>
                      <td className="p-3 uppercase text-[10px] text-stone-500 font-mono">{eq.category}</td>
                      <td className="p-3 font-bold">{eq.total_quantity} units</td>
                      <td className="p-3 font-extrabold text-emerald-600">{eq.available_quantity} available</td>
                      <td className="p-3 capitalize text-stone-600 dark:text-stone-400">{eq.condition_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 7. NEW ENQUIRY MODAL */}
      <Modal
        isOpen={newEnquiryModalOpen}
        onClose={() => setNewEnquiryModalOpen(false)}
        title="Create New Catering & Event Enquiry"
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Customer / Host Name *</label>
              <input
                type="text"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="Dr. Harrison"
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Phone Number *</label>
              <input
                type="text"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="+254 7..."
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Organization / Company</label>
              <input
                type="text"
                value={custOrg}
                onChange={(e) => setCustOrg(e.target.value)}
                placeholder="UNEP / Safaricom"
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Email</label>
              <input
                type="email"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="client@org.com"
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Event Name *</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Annual Sustainability Banquet"
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold block mb-1">Event Date *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Guest Count *</label>
              <input
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Budget (KES)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-bold block mb-1">Venue / Location *</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Gigiri Gardens, Nairobi"
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setNewEnquiryModalOpen(false)}
              className="flex-1 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEnquiry}
              className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Save Enquiry
            </button>
          </div>
        </div>
      </Modal>

      {/* 8. QUOTATION CALCULATOR MODAL */}
      <Modal
        isOpen={quoteModalOpen}
        onClose={() => {
          setQuoteModalOpen(false);
          setCreatedQuote(null);
        }}
        title={`Quotation Engine: ${selectedEnquiry?.event_name || ''}`}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-between">
            <div>
              <span className="font-bold block text-stone-900 dark:text-stone-100">{selectedEnquiry?.customer_name}</span>
              <span className="text-[11px] text-stone-500">Date: {selectedEnquiry?.event_date} • {selectedEnquiry?.guest_count} Guests</span>
            </div>
            <span className="font-mono font-bold text-purple-600">{selectedEnquiry?.enquiry_number}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Per Person Food Rate (KES)</label>
              <input
                type="number"
                value={quoteRate}
                onChange={(e) => setQuoteRate(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Equipment & Warmers (KES)</label>
              <input
                type="number"
                value={quoteEquipment}
                onChange={(e) => setQuoteEquipment(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold block mb-1">Service & Chef Labor (KES)</label>
              <input
                type="number"
                value={quoteLabor}
                onChange={(e) => setQuoteLabor(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Transport & Logistics (KES)</label>
              <input
                type="number"
                value={quoteTransport}
                onChange={(e) => setQuoteTransport(e.target.value)}
                className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
              />
            </div>
          </div>

          <button
            onClick={handleCalculateQuote}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Calculator size={14} />
            <span>Calculate Official Quotation</span>
          </button>

          {createdQuote && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 space-y-2 mt-3 animate-fadeIn">
              <div className="flex items-center justify-between font-mono font-bold text-xs text-amber-700 dark:text-amber-400">
                <span>Quotation Ref: {createdQuote.quotation_number}</span>
                <span>50% Deposit: KES {createdQuote.deposit_required.toLocaleString()}</span>
              </div>
              <div className="text-xs space-y-1 text-stone-700 dark:text-stone-300">
                <div className="flex justify-between">
                  <span>Food ({createdQuote.guest_count} pax @ KES {createdQuote.per_person_rate}):</span>
                  <span className="font-bold">KES {createdQuote.food_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipment & Warmers:</span>
                  <span>KES {createdQuote.equipment_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor & Transport:</span>
                  <span>KES {(createdQuote.labor_cost + createdQuote.transport_cost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-2 border-t border-amber-500/30 text-stone-900 dark:text-white">
                  <span>Total Quoted Amount (VAT Included):</span>
                  <span className="text-amber-600 dark:text-amber-400">KES {createdQuote.total_amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => handleAcceptQuote(createdQuote.id)}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Accept Quotation & Confirm Booking</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 9. DEPOSIT PAYMENT MODAL */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title={`Confirm Deposit: ${selectedBooking?.event_name || ''}`}
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-500">
            Confirm 50% deposit payment of <strong className="text-amber-600">KES {selectedBooking?.deposit_amount.toLocaleString()}</strong>.
          </p>

          <div>
            <label className="font-bold block mb-1">M-Pesa Confirmation Code</label>
            <input
              type="text"
              placeholder="e.g. QKH7189281"
              value={mpesaCode}
              onChange={(e) => setMpesaCode(e.target.value)}
              className="w-full p-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono font-bold"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setDepositModalOpen(false)}
              className="flex-1 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handlePayDeposit}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Confirm Deposit Paid
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
