import { useState, useMemo } from 'react';
import Header from '../../components/Header/Header';
import CalendarWidget from '../../components/CalendarWidget/CalendarWidget';
import FilterBar from '../../components/FilterBar/FilterBar';
import BookingCard from '../../components/BookingCard/BookingCard';
import type { MultiSelectOption } from '../../components/MultiSelect/MultiSelect';
import ContractModal from '../../components/ContractModal/ContractModal';
import {
  PlusCircle, CalendarDays, List, ArrowUp, ArrowDown,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBookings, useDeleteBooking, useUpdateBookingStatus } from '../../hooks/useBookings';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDateISO } from '../../utils';
import type { Booking } from '../../types';
import './Dashboard.css';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortKey = 'date' | 'startTime' | 'prmName' | 'status' | 'owner_name';

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deleteBooking = useDeleteBooking();
  const updateStatus = useUpdateBookingStatus();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // ── Contract signing ───────────────────────────────────────────────────────
  const [signingBooking, setSigningBooking] = useState<Booking | null>(null);

  // ── View toggle ────────────────────────────────────────────────────────────
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  // ── Shared filter state ────────────────────────────────────────────────────
  const [filterOwnerIds, setFilterOwnerIds] = useState<string[]>([]);
  const [filterPrmIds, setFilterPrmIds]     = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  // Date range — list view only
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');

  function handleOwnerChange(ids: string[]) {
    setFilterOwnerIds(ids);
    setFilterPrmIds([]); // reset PRMs when owner selection changes
  }

  // Derive the ownerId hint for PrmMultiSelect: only meaningful when 1 user selected
  const singleOwnerId = filterOwnerIds.length === 1 ? filterOwnerIds[0] : undefined;

  // Common active filters (no date range — those are list-only)
  const baseFilters = useMemo(() => ({
    status:  filterStatuses.length ? filterStatuses : undefined,
    prmId:   filterPrmIds.length   ? filterPrmIds   : undefined,
    ownerId: filterOwnerIds.length ? filterOwnerIds  : undefined,
  }), [filterStatuses, filterPrmIds, filterOwnerIds]);

  // ── Calendar view state ───────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const dateStr = formatDateISO(selectedDate);

  const { data: bookings = [], isLoading } = useBookings(
    { date: dateStr, ...baseFilters },
    { enabled: view === 'calendar' },
  );

  const monthDateFrom = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
  const monthDateTo = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const { data: monthBookings = [] } = useBookings(
    { date_from: monthDateFrom, date_to: monthDateTo, ...baseFilters },
    { enabled: view === 'calendar' },
  );

  const bookingsByDate = useMemo<Record<string, Booking[]>>(() => {
    return monthBookings.reduce<Record<string, Booking[]>>((accumulator, booking) => {
      (accumulator[booking.date] ??= []).push(booking);
      return accumulator;
    }, {});
  }, [monthBookings]);

  const total = bookings.length;
  const pending = bookings.filter((booking) => booking.status === 'Pending').length;
  const completed = bookings.filter((booking) => booking.status === 'Completed').length;

  const todayStr = formatDateISO(new Date());
  const isToday = dateStr === todayStr;
  const dateLabel = isToday
    ? t('dashboard.todayBookings')
    : t('dashboard.dateLabel', { date: selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) });

  // ── List view state ────────────────────────────────────────────────────────
  const [sortKey, setSortKey]   = useState<SortKey>('date');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc');

  const { data: listBookings = [], isLoading: listLoading } = useBookings(
    {
      date_from: filterDateFrom || undefined,
      date_to:   filterDateTo   || undefined,
      ...baseFilters,
    },
    { enabled: view === 'list' },
  );

  const sortedBookings = useMemo(() =>
    [...listBookings].sort((bookingA, bookingB) => {
      const valueA = String(bookingA[sortKey] ?? '');
      const valueB = String(bookingB[sortKey] ?? '');
      return sortDir === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }),
  [listBookings, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortColumns: { key: SortKey; label: string }[] = [
    { key: 'date',       label: t('dashboard.sort.date') },
    { key: 'startTime',  label: t('dashboard.sort.time') },
    { key: 'prmName',    label: t('dashboard.sort.prm') },
    { key: 'status',     label: t('dashboard.sort.status') },
    ...(isAdmin ? [{ key: 'owner_name' as SortKey, label: t('dashboard.sort.responsible') }] : []),
  ];

  // ── Status options for MultiSelect ─────────────────────────────────────────
  const statusOptions = useMemo<MultiSelectOption[]>(() => [
    { id: 'SignPending', label: t('bookingStatuses.SignPending') },
    { id: 'Pending',     label: t('bookingStatuses.Pending') },
    { id: 'Approved',    label: t('bookingStatuses.Approved') },
    { id: 'Completed',   label: t('bookingStatuses.Completed') },
    { id: 'Cancelled',   label: t('bookingStatuses.Cancelled') },
  ], [t]);



  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <div className="dashboard__view-toggle">
            <button
              className={`dashboard__view-btn${view === 'calendar' ? ' dashboard__view-btn--active' : ''}`}
              onClick={() => setView('calendar')}
            >
              <CalendarDays size={16} />
              <span>{t('dashboard.viewCalendar')}</span>
            </button>
            <button
              className={`dashboard__view-btn${view === 'list' ? ' dashboard__view-btn--active' : ''}`}
              onClick={() => setView('list')}
            >
              <List size={16} />
              <span>{t('dashboard.viewList')}</span>
            </button>
          </div>
        }
      />

      <div className="dashboard__body">

        {/* ── Calendar view ── */}
        {view === 'calendar' && (
          <div className="dashboard__grid">
            <div className="dashboard__left">
              <CalendarWidget
                onDateSelect={setSelectedDate}
                onMonthChange={setCalendarMonth}
                bookingsByDate={bookingsByDate}
              />
              <div className="summary-card">
                <h4 className="summary-card__title">{t('dashboard.summary')}</h4>
                <div className="summary-card__rows">
                  <div className="summary-card__row">
                    <span className="summary-card__label">{t('dashboard.todayTotal')}</span>
                    <span className="summary-card__value">
                      {isLoading ? '—' : `${total} ${t('dashboard.trips')}`}
                    </span>
                  </div>
                  <div className="summary-card__row">
                    <span className="summary-card__label">{t('dashboard.pending')}</span>
                    <span className="summary-card__value summary-card__value--pending">
                      {isLoading ? '—' : pending}
                    </span>
                  </div>
                  <div className="summary-card__row">
                    <span className="summary-card__label">{t('dashboard.completed')}</span>
                    <span className="summary-card__value summary-card__value--completed">
                      {isLoading ? '—' : completed}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard__right">
              {/* Filter bar — calendar view (no date range) */}
              <FilterBar
                isAdmin={isAdmin}
                filterOwnerIds={filterOwnerIds}
                onOwnerChange={handleOwnerChange}
                filterPrmIds={filterPrmIds}
                onPrmChange={setFilterPrmIds}
                singleOwnerId={singleOwnerId}
                filterStatuses={filterStatuses}
                onStatusChange={setFilterStatuses}
                statusOptions={statusOptions}
                filterDateFrom={filterDateFrom}
                onDateFromChange={setFilterDateFrom}
                filterDateTo={filterDateTo}
                onDateToChange={setFilterDateTo}
              />

              <div className="bookings-header">
                <h3 className="bookings-header__title">{dateLabel}</h3>
              </div>

              {isLoading ? (
                <div className="booking-list">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="booking-card booking-card--skeleton" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="booking-list booking-list--empty">
                  <p className="booking-list__empty-text">{t('dashboard.noBookingsToday')}</p>
                </div>
              ) : (
                <div className="booking-list">
                  {bookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onEdit={() => navigate(`/app/bookings/${booking.id}/edit`)}
                      onDelete={() => deleteBooking.mutate(booking.id)}
                      onStatusChange={(status) => updateStatus.mutate({ id: booking.id, status })}
                      onSign={() => setSigningBooking(booking)}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}

              <Link to="/app/bookings/new" state={{ date: dateStr }} className="new-booking-btn">
                <PlusCircle size={20} />
                <span>{t('dashboard.requestNewBooking')}</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── List view ── */}
        {view === 'list' && (
          <div className="dashboard__list-view">

            {/* Filter bar — list view (with date range) */}
            <FilterBar
              isAdmin={isAdmin}
              showDateRange
              filterOwnerIds={filterOwnerIds}
              onOwnerChange={handleOwnerChange}
              filterPrmIds={filterPrmIds}
              onPrmChange={setFilterPrmIds}
              singleOwnerId={singleOwnerId}
              filterStatuses={filterStatuses}
              onStatusChange={setFilterStatuses}
              statusOptions={statusOptions}
              filterDateFrom={filterDateFrom}
              onDateFromChange={setFilterDateFrom}
              filterDateTo={filterDateTo}
              onDateToChange={setFilterDateTo}
            />

            {/* Sort controls */}
            <div className="booking-sort">
              <span className="booking-sort__label">{t('dashboard.sort.label')}:</span>
              <div className="booking-sort__chips">
                {sortColumns.map((col) => (
                  <button
                    key={col.key}
                    className={`booking-sort__chip${sortKey === col.key ? ' booking-sort__chip--active' : ''}`}
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc'
                        ? <ArrowUp size={12} />
                        : <ArrowDown size={12} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking list */}
            {listLoading ? (
              <div className="booking-list">
                <div className="booking-card booking-card--skeleton" />
                <div className="booking-card booking-card--skeleton" />
                <div className="booking-card booking-card--skeleton" />
              </div>
            ) : sortedBookings.length === 0 ? (
              <div className="booking-list booking-list--empty">
                <p className="booking-list__empty-text">{t('dashboard.noBookings')}</p>
              </div>
            ) : (
              <div className="booking-list">
                {sortedBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onEdit={() => navigate(`/app/bookings/${booking.id}/edit`)}
                    onDelete={() => deleteBooking.mutate(booking.id)}
                    onStatusChange={(status) => updateStatus.mutate({ id: booking.id, status })}
                    onSign={() => setSigningBooking(booking)}
                    isAdmin={isAdmin}
                    showDate
                  />
                ))}
              </div>
            )}

            <Link to="/app/bookings/new" className="new-booking-btn">
              <PlusCircle size={20} />
              <span>{t('dashboard.requestNewBooking')}</span>
            </Link>
          </div>
        )}

      </div>

      {signingBooking && (
        <ContractModal
          booking={signingBooking}
          onClose={() => setSigningBooking(null)}
          onSigned={() => setSigningBooking(null)}
        />
      )}
    </div>
  );
}
