import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';
import { Modal } from './Modal.js';
import {
  QrCode,
  Printer,
  Copy,
  Check,
  RefreshCw,
  Wifi,
  Sparkles,
  Smartphone,
  ExternalLink,
  Building2,
  Download
} from 'lucide-react';

interface MasterQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterQrModal: React.FC<MasterQrModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMasterQr();
    }
  }, [isOpen]);

  const loadMasterQr = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/hotel/master-qr');
      setData(res);
    } catch (err) {
      console.error('Failed to load master QR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const confirm = window.confirm(
      'Regenerate Master Hotel QR Code?\n\nThis will invalidate any previously printed Master QR tent cards and generate a new secure ordering token.'
    );
    if (!confirm) return;

    setRegenerating(true);
    try {
      await apiFetch('/hotel/master-qr/regenerate', { method: 'POST' });
      await loadMasterQr();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate master QR');
    } finally {
      setRegenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!data?.qr_url) return;
    navigator.clipboard.writeText(data.qr_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hotel Master Digital Menu QR Code & Standee"
    >
      {loading ? (
        <div className="p-8 flex items-center justify-center space-x-3 text-amber-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="font-semibold text-xs">Generating Master QR Code...</span>
        </div>
      ) : data ? (
        <div className="space-y-5">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-stone-500">
              Print this single master QR for your hotel lobby, tables, bar, or entrance standee.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link' : 'Copy URL'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Standee Tent Card</span>
              </button>
            </div>
          </div>

          {/* PRINTABLE STANDEE CANVAS (Styled for both on-screen preview & high-resolution paper print) */}
          <div
            id="printable-master-qr-standee"
            className="bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-lg max-w-sm mx-auto relative overflow-hidden print:border-none print:shadow-none print:max-w-none print:p-0"
          >
            {/* Top decorative badge */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Digital Menu & M-Pesa Ordering</span>
            </div>

            {/* Hotel Logo & Title */}
            <div>
              {data.logo_url && (
                <img
                  src={data.logo_url}
                  alt={data.hotel_name}
                  className="w-16 h-16 rounded-2xl mx-auto object-contain mb-2 p-1 border border-stone-200 dark:border-stone-700"
                />
              )}
              <h3 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                {data.hotel_name}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Welcome! Browse today's live culinary creations.
              </p>
            </div>

            {/* HIGH-RES VECTOR QR CODE */}
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-500/40 inline-block shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                  data.qr_url
                )}&margin=4`}
                alt="Master Hotel QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-center space-x-2 text-stone-900 dark:text-stone-100 font-bold text-xs">
                <Smartphone className="w-4 h-4 text-amber-600" />
                <span>Scan with Camera • Order • Pay via M-Pesa</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
                Point your smartphone camera at the QR code above. No app download or registration required.
              </p>
            </div>

            {/* Wi-Fi Credentials Badge */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 text-left flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-400">Complimentary Wi-Fi</div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200">{data.wifi_ssid}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-stone-400">Password</div>
                <div className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">{data.wifi_password}</div>
              </div>
            </div>

            {/* Token details footnote */}
            <div className="text-[9px] font-mono text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
              Master Token: {data.master_qr_token}
            </div>
          </div>

          {/* Regenerate footer */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-stone-800 text-xs">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-stone-400 hover:text-rose-600 text-xs flex items-center space-x-1.5 transition"
            >
              {regenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Regenerate Master QR</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
