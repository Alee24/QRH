import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import { TableStatusBadge } from '../../components/Badge.js';
import { Modal } from '../../components/Modal.js';
import {
  LayoutGrid,
  Plus,
  QrCode,
  Download,
  RotateCw,
  ExternalLink,
  ShieldAlert,
  Users,
  Printer
} from 'lucide-react';

export const TableManager: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Modal
  const [selectedTableForQr, setSelectedTableForQr] = useState<any | null>(null);
  const [qrImageData, setQrImageData] = useState<any | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Add Table Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableCap, setNewTableCap] = useState(4);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const data = await apiFetch<any[]>('/tables');
      setTables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQr = async (table: any) => {
    setSelectedTableForQr(table);
    setQrLoading(true);
    try {
      const res = await apiFetch<any>(`/tables/${table.id}/qr-image`);
      setQrImageData(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setQrLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!selectedTableForQr) return;
    if (!confirm(`Are you sure you want to regenerate QR code for Table ${selectedTableForQr.table_number}? The old QR code on the table tent will be invalidated immediately.`)) {
      return;
    }
    try {
      await apiFetch(`/tables/${selectedTableForQr.id}/regenerate-qr`, { method: 'POST' });
      handleOpenQr(selectedTableForQr);
      loadTables();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddTable = async () => {
    if (!newTableNum || !newTableName) return;
    try {
      await apiFetch('/tables', {
        method: 'POST',
        body: JSON.stringify({
          table_number: newTableNum,
          name: newTableName,
          capacity: Number(newTableCap),
        }),
      });
      setAddModalOpen(false);
      setNewTableNum('');
      setNewTableName('');
      loadTables();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-4 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <LayoutGrid className="text-amber-600" />
              <span>Table Management & Floor Layout</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Table capacities, occupancy status, and cryptographic QR code generation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-colors"
            >
              <Plus size={15} />
              <span>Add Table</span>
            </button>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tables.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between h-48 hover:border-amber-500/50 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl font-black text-stone-900 dark:text-stone-100 block">
                      Table {t.table_number}
                    </span>
                    <span className="text-xs font-medium text-stone-500 block mt-0.5">{t.name}</span>
                  </div>
                  <TableStatusBadge status={t.status} size="sm" />
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Users size={13} />
                    <span>{t.capacity} Guests</span>
                  </span>
                  <span>•</span>
                  <span>{t.section_name || 'Ground Floor'}</span>
                </div>
              </div>

              {/* QR Code Action Buttons */}
              <div className="pt-3 border-t border-stone-150 dark:border-stone-800 flex items-center justify-between">
                <button
                  onClick={() => handleOpenQr(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold"
                >
                  <QrCode size={13} />
                  <span>QR Code</span>
                </button>

                <a
                  href={`/api/tables/${t.id}/qr-pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 text-xs font-semibold"
                  title="Download Printable A5 PDF Tent Card"
                >
                  <Download size={13} />
                  <span>PDF Tent</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR MODAL */}
      <Modal
        isOpen={Boolean(selectedTableForQr)}
        onClose={() => setSelectedTableForQr(null)}
        title={`Table ${selectedTableForQr?.table_number} QR Code`}
        maxWidth="sm"
      >
        {selectedTableForQr && (
          <div className="space-y-4 text-center">
            {qrLoading || !qrImageData ? (
              <div className="py-12 text-stone-400 text-xs">Generating secure QR code...</div>
            ) : (
              <>
                <div className="p-4 bg-white rounded-2xl border-2 border-stone-200 inline-block shadow-md">
                  <img src={qrImageData.dataUrl} alt="QR Code" className="w-56 h-56 mx-auto" />
                </div>

                <div>
                  <div className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                    {selectedTableForQr.name}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Token: <span className="font-mono text-amber-600">{selectedTableForQr.qr_token}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={`/api/tables/${selectedTableForQr.id}/qr-pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <Download size={15} />
                    <span>Download Printable PDF Tent Card</span>
                  </a>

                  <button
                    onClick={handleRegenerateQr}
                    className="w-full py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-rose-600 font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <ShieldAlert size={14} />
                    <span>Regenerate QR Token (Security)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* ADD TABLE MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Table"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Table Number
            </label>
            <input
              type="text"
              placeholder="E.g. 17 or T17"
              value={newTableNum}
              onChange={(e) => setNewTableNum(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Table Label / Location Name
            </label>
            <input
              type="text"
              placeholder="E.g. Garden Pavilion 01"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Seating Capacity
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={newTableCap}
              onChange={(e) => setNewTableCap(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-bold"
            />
          </div>

          <button
            onClick={handleAddTable}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow mt-2"
          >
            Create Table & Generate QR Code
          </button>
        </div>
      </Modal>
    </div>
  );
};
