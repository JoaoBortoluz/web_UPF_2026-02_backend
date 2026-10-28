'use client';

import React, { useEffect, useState } from 'react';
import {
  createProductApi,
  createReservationApi,
  createTableApi,
  fetchDashboardData,
  registerStaffApi,
} from '@/lib/api';
import { Role, Table } from '@/types/restaurant';
import { AdminModalType } from './AdminHeader';
import { formatTableNumber } from '@/lib/format';

/**
 * CLIENT COMPONENT (`'use client'`)
 * Gerenciador global de modais do cabeçalho administrativo:
 * - + Nova mesa
 * - + Novo produto
 * - + Nova reserva
 * - + Cadastrar funcionário
 */
export default function AdminModals() {
  const [modalType, setModalType] = useState<AdminModalType>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Campos de Nova Mesa
  const [tableNumber, setTableNumber] = useState('7');
  const [tableCapacity, setTableCapacity] = useState('4');

  // Campos de Novo Produto
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('Prato principal');

  // Campos de Nova Reserva
  const [resCustomerName, setResCustomerName] = useState('');
  const [resCustomerPhone, setResCustomerPhone] = useState('');
  const [resDateTime, setResDateTime] = useState('2026-10-20T20:30');
  const [resGuestCount, setResGuestCount] = useState('2');
  const [resTableId, setResTableId] = useState<string>('');

  // Campos de Cadastrar Funcionário
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<Role>('WAITER');

  useEffect(() => {
    const handleOpen = async (event: Event) => {
      const custom = event as CustomEvent<{ type: AdminModalType }>;
      if (custom.detail?.type) {
        setError(null);
        setModalType(custom.detail.type);
        const { snapshot } = await fetchDashboardData();
        setTables(snapshot.tables);
        const nextNum =
          Math.max(0, ...snapshot.tables.map((t) => t.number)) + 1;
        setTableNumber(String(nextNum));
      }
    };

    window.addEventListener('open-admin-modal', handleOpen);
    return () => window.removeEventListener('open-admin-modal', handleOpen);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function closeModal() {
    setModalType(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (modalType === 'table') {
        const created = await createTableApi({
          number: Number(tableNumber),
          capacity: Number(tableCapacity),
        });
        setToast(
          `Mesa ${formatTableNumber(created.number)} (${created.capacity} lugares) criada com sucesso!`,
        );
      } else if (modalType === 'product') {
        const created = await createProductApi({
          name: prodName.trim(),
          description: prodDescription.trim() || undefined,
          price: Number(prodPrice.replace(',', '.')),
          category: prodCategory.trim(),
        });
        setProdName('');
        setProdDescription('');
        setProdPrice('');
        setToast(`Produto "${created.name}" adicionado ao catálogo!`);
      } else if (modalType === 'reservation') {
        const isoDate = new Date(resDateTime).toISOString();
        const created = await createReservationApi({
          customerName: resCustomerName.trim(),
          customerPhone: resCustomerPhone.trim(),
          dateTime: isoDate,
          guestCount: Number(resGuestCount),
          tableId: resTableId ? Number(resTableId) : undefined,
        });
        setResCustomerName('');
        setResCustomerPhone('');
        setToast(`Reserva confirmada para ${created.customerName}!`);
      } else if (modalType === 'staff') {
        const created = await registerStaffApi({
          name: staffName.trim(),
          email: staffEmail.trim(),
          password: staffPassword,
          role: staffRole,
        });
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
        setToast(
          `Funcionário ${created.name} (${created.role}) cadastrado com sucesso!`,
        );
      }

      closeModal();
      window.dispatchEvent(new CustomEvent('admin-data-mutated'));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao salvar registro. Verifique os dados informados.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-zinc-100 text-zinc-950 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-3 border border-zinc-300"
        >
          <span>✓ {toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-zinc-500 hover:text-zinc-900"
          >
            ✕
          </button>
        </div>
      )}

      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-100">
                {modalType === 'table' && 'Cadastrar Nova Mesa'}
                {modalType === 'product' && 'Cadastrar Novo Produto'}
                {modalType === 'reservation' && 'Registrar Nova Reserva'}
                {modalType === 'staff' && 'Cadastrar Funcionário'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/50 border border-red-800/60 px-3.5 py-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === 'table' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Número da Mesa
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Capacidade (lugares)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={tableCapacity}
                      onChange={(e) => setTableCapacity(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                    />
                  </div>
                </>
              )}

              {modalType === 'product' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Nome do produto
                    </label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ex: Filé à Parmegiana"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Preço (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="68.00"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Categoria
                      </label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                      >
                        <option value="Prato principal">Prato principal</option>
                        <option value="Entrada">Entrada</option>
                        <option value="Bebida">Bebida</option>
                        <option value="Sobremesa">Sobremesa</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Descrição (exibida no Cardápio do Cliente)
                    </label>
                    <textarea
                      rows={2}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Ingredientes e modo de preparo..."
                      className="w-full p-3 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                    />
                  </div>
                </>
              )}

              {modalType === 'reservation' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Nome do cliente
                    </label>
                    <input
                      type="text"
                      required
                      value={resCustomerName}
                      onChange={(e) => setResCustomerName(e.target.value)}
                      placeholder="Ex: Ana Martins"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        required
                        value={resCustomerPhone}
                        onChange={(e) => setResCustomerPhone(e.target.value)}
                        placeholder="(54) 99988-7766"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Convidados
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={resGuestCount}
                        onChange={(e) => setResGuestCount(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Data e Horário
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={resDateTime}
                        onChange={(e) => setResDateTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#18181c] border border-zinc-800 text-xs text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Mesa (opcional)
                      </label>
                      <select
                        value={resTableId}
                        onChange={(e) => setResTableId(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                      >
                        <option value="">Sem mesa fixa</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>
                            Mesa {formatTableNumber(t.number)} ({t.capacity} lug.)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {modalType === 'staff' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      required
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Ex: Carlos Garçom"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      E-mail corporativo
                    </label>
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="carlos@restaurant.com"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Senha (mín. 6)
                      </label>
                      <input
                        type="password"
                        minLength={6}
                        required
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full h-10 px-3.5 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Cargo (Role)
                      </label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as Role)}
                        className="w-full h-10 px-3 rounded-xl bg-[#18181c] border border-zinc-800 text-sm text-zinc-100"
                      >
                        <option value="WAITER">WAITER</option>
                        <option value="RECEPTIONIST">RECEPTIONIST</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 px-5 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-60 text-xs font-semibold text-zinc-950"
                >
                  {loading ? 'Salvando...' : 'Salvar registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

