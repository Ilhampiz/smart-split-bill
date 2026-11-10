import { useState, type FormEvent } from 'react';
import { useBillStore } from '../store/useBillStore';
import {
  Users,
  UserPlus,
  X,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Tag,
} from './icons';

export const Step3Assign = () => {
  const {
    items,
    participants,
    assignments,
    addParticipant,
    removeParticipant,
    toggleAssignment,
    assignAllToItem,
    setStep,
  } = useBillStore();

  const [newParticipantName, setNewParticipantName] = useState('');

  const handleAddParticipant = (e: FormEvent) => {
    e.preventDefault();
    if (newParticipantName.trim()) {
      addParticipant(newParticipantName.trim());
      setNewParticipantName('');
    }
  };

  const unassignedCount = items.filter(
    (it) => !assignments[it.id] || assignments[it.id].length === 0
  ).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          Alokasi Pesanan ke Peserta
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tentukan pihak yang bertanggung jawab atas tiap pos belanja. Item bersama akan dibagi rata antar pihak yang dipilih.
        </p>
      </div>

      {/* Participant Management Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 tracking-tight">
            <Users size={14} className="text-slate-500" />
            <span>Daftar Peserta Patungan ({participants.length} Orang)</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3.5">
          {participants.map((p) => (
            <div
              key={p.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800"
            >
              <span>{p.name}</span>
              {participants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParticipant(p.id)}
                  className="w-4 h-4 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 flex items-center justify-center transition"
                  title="Hapus peserta"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleAddParticipant} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Nama peserta baru..."
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 outline-none font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={!newParticipantName.trim()}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-md text-xs font-medium transition"
          >
            <UserPlus size={13} />
            <span>Tambah</span>
          </button>
        </form>
      </div>

      {/* Unassigned Warning */}
      {unassignedCount > 0 && (
        <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <span>Terdapat {unassignedCount} item yang belum dialokasikan ke peserta mana pun.</span>
        </div>
      )}

      {/* Item Allocation List */}
      <div className="space-y-3 mb-6">
        {items.map((it) => {
          const assignedIds = assignments[it.id] || [];
          const isAllAssigned = assignedIds.length === participants.length;

          return (
            <div
              key={it.id}
              className={`bg-white rounded-xl border p-4 shadow-2xs transition ${
                assignedIds.length === 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {it.qty > 1 && <span className="text-slate-500 font-mono text-xs mr-1">{it.qty}x</span>}
                    {it.name}
                  </h4>
                  <div className="text-xs text-slate-600 font-medium mt-0.5 flex flex-wrap items-center gap-2">
                    {it.discount && it.discount > 0 ? (
                      <>
                        <span className="line-through text-slate-400">
                          Rp {it.line_total.toLocaleString('id-ID')}
                        </span>
                        <span className="text-emerald-700 font-semibold">
                          Rp {Math.max(0, it.line_total - it.discount).toLocaleString('id-ID')}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                          <Tag size={10} />
                          <span>Diskon Rp {it.discount.toLocaleString('id-ID')}</span>
                        </span>
                      </>
                    ) : (
                      <span>Rp {it.line_total.toLocaleString('id-ID')}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => assignAllToItem(it.id)}
                  className={`self-start sm:self-auto text-xs font-medium px-2.5 py-1 rounded border transition ${
                    isAllAssigned
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {isAllAssigned ? 'Terpilih Semua' : 'Bagi ke Semua'}
                </button>
              </div>

              {/* Participant Selection Chips */}
              <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-100">
                {participants.map((p) => {
                  const isChecked = assignedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleAssignment(it.id, p.id)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition ${
                        isChecked
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] border ${
                          isChecked ? 'border-white text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Review Item</span>
        </button>
        <button
          type="button"
          onClick={() => setStep(4)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
        >
          <span>Hitung Ringkasan</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
