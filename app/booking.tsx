import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const COLORS = {
  background: '#F0F4F8',
  card: '#FFFFFF',
  primary: '#2F4F9F',
  primaryLight: '#DBEAFE',
  primaryBorder: '#BFDBFE',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  shadow: '#9CA3AF',
  accentGreen: '#16A34A',
};

type Slot = {
  time: string;
};

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  isPrimary: boolean;
  location: string;
};

const doctors: Doctor[] = [
  {
    id: 'anna-nowak',
    name: 'lek. Anna Nowak',
    specialty: 'Medycyna rodzinna',
    isPrimary: true,
    location: 'ul. 30-go Stycznia 55',
  },
  {
    id: 'jan-kowalski',
    name: 'lek. Jan Kowalski',
    specialty: 'Internista',
    isPrimary: false,
    location: 'ul. Jasia i Małgosi 8/4',
  },
  {
    id: 'maria-wisniewska',
    name: 'lek. Maria Wiśniewska',
    specialty: 'Pediatra',
    isPrimary: false,
    location: 'ul. Dąbrowskiego 10',
  },
  {
    id: 'tomasz-mazur',
    name: 'lek. Tomasz Mazur',
    specialty: 'Ortopeda',
    isPrimary: false,
    location: 'ul. Piaskowa 3',
  },
  {
    id: 'katarzyna-lis',
    name: 'lek. Katarzyna Lis',
    specialty: 'Dermatolog',
    isPrimary: false,
    location: 'ul. 30-go Stycznia 55',
  },
  {
    id: 'michal-krawczyk',
    name: 'lek. Michał Krawczyk',
    specialty: 'Kardiolog',
    isPrimary: false,
    location: 'ul. Jasia i Małgosi 8/4',
  },
];

const dateOptions = [
  { key: 'today' as const, label: 'Dzisiaj' },
  { key: 'tomorrow' as const, label: 'Jutro' },
  { key: 'dayAfter' as const, label: 'Pojutrze' },
];

const LOCATIONS = [
  'Dowolna placówka w Tczewie',
  'ul. 30-go Stycznia 55',
  'ul. Jasia i Małgosi 8/4',
  'ul. Dąbrowskiego 10',
  'ul. Piaskowa 3',
] as const;

type DateKey = (typeof dateOptions)[number]['key'] | 'custom';

export default function BookingScreen() {
  const router = useRouter();

  const [selectedDateKey, setSelectedDateKey] = useState<DateKey>('today');
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>('Dzisiaj');
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<(typeof LOCATIONS)[number]>('Dowolna placówka w Tczewie');
  const [tempLocation, setTempLocation] = useState<(typeof LOCATIONS)[number]>('Dowolna placówka w Tczewie');
  const [selectedBooking, setSelectedBooking] = useState<{
    doctor: Doctor;
    time: string;
    dateIso: string;
  } | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState<boolean>(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const minCalendarMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );

  const maxCalendarMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + 3, 1),
    [today],
  );

  const primaryDoctor = useMemo(
    () => doctors.find((d) => d.isPrimary),
    [],
  );

  const sortedDoctors = useMemo(() => {
    const primary = doctors.find((d) => d.isPrimary);
    const others = doctors.filter((d) => !d.isPrimary);
    return primary ? [primary, ...others] : others;
  }, []);

  const visibleDoctors = useMemo(() => {
    if (selectedLocation === 'Dowolna placówka w Tczewie') return sortedDoctors;
    return sortedDoctors.filter((d) => d.location === selectedLocation);
  }, [sortedDoctors, selectedLocation]);

  const getSelectedDate = (): Date => {
    if (selectedDateKey === 'today') {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    if (selectedDateKey === 'tomorrow') {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    }
    if (selectedDateKey === 'dayAfter') {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
    }
    if (selectedDateKey === 'custom' && selectedDateIso) {
      const d = new Date(selectedDateIso);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const fallback = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return fallback;
  };

  const getAvailableSlotsForDate = (date: Date): Slot[] => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setHours(0, 0, 0, 0);
    if (d < today) return [];

    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return [];
    }

    const baseEven = ['09:00', '10:30', '13:15', '15:00'];
    const baseOdd = ['08:30', '11:00', '14:30', '16:15'];
    const isEvenDay = d.getDate() % 2 === 0;
    const times = isEvenDay ? baseEven : baseOdd;
    return times.map((time) => ({ time }));
  };

  const anySlotsForSelectedDate = useMemo(() => {
    const dateObj = getSelectedDate();
    return getAvailableSlotsForDate(dateObj).length > 0;
  }, [selectedDateKey, selectedDateIso, today]);

  const goToPrevMonth = () => {
    setCurrentCalendarMonth((prev) => {
      const candidate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      if (candidate < minCalendarMonth) {
        return prev;
      }
      return candidate;
    });
  };

  const goToNextMonth = () => {
    setCurrentCalendarMonth((prev) => {
      const candidate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      if (candidate > maxCalendarMonth) {
        return prev;
      }
      return candidate;
    });
  };

  const isPrevDisabled =
    currentCalendarMonth.getFullYear() === minCalendarMonth.getFullYear() &&
    currentCalendarMonth.getMonth() === minCalendarMonth.getMonth();

  const isNextDisabled =
    currentCalendarMonth.getFullYear() === maxCalendarMonth.getFullYear() &&
    currentCalendarMonth.getMonth() === maxCalendarMonth.getMonth();

  const handleConfirm = () => {
    if (!selectedBooking) return;
    setIsConfirmVisible(false);
    setIsBookingSuccess(true);
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => {
    const dateObj = getSelectedDate();
    const slotsForDate = getAvailableSlotsForDate(dateObj);
    const isoDate =
      dateObj.getFullYear() +
      '-' +
      String(dateObj.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(dateObj.getDate()).padStart(2, '0');
    return (
      <View style={styles.doctorCard}>
        <View style={styles.doctorHeader}>
          <View style={styles.doctorAvatar}>
            <MaterialCommunityIcons name="stethoscope" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.doctorHeaderText}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
            {selectedLocation === 'Dowolna placówka w Tczewie' && (
              <Text style={styles.doctorLocation}>{item.location}</Text>
            )}
          </View>
          {item.isPrimary && (
            <View style={styles.primaryPill}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={styles.primaryPillText}>Twój lekarz</Text>
            </View>
          )}
        </View>

        <View style={styles.slotsGrid}>
          {slotsForDate.map((slot) => {
            const isSelected =
              !!selectedBooking &&
              selectedBooking.doctor.id === item.id &&
              selectedBooking.time === slot.time &&
              selectedBooking.dateIso === isoDate;
            return (
              <TouchableOpacity
                key={`${item.id}-${slot.time}`}
                style={[
                  styles.slotChip,
                  isSelected && styles.slotChipSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedBooking({
                    doctor: item,
                    time: slot.time,
                    dateIso: isoDate,
                  });
                  setIsConfirmVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Godzina ${slot.time} u lekarza ${item.name}`}>
                <Text
                  style={[
                    styles.slotChipText,
                    isSelected && styles.slotChipTextSelected,
                  ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const formatDisplayDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isBookingSuccess && selectedBooking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={88} color="#16A34A" />
          <Text style={styles.successTitle}>Wizyta potwierdzona!</Text>
          <Text style={styles.successText}>
            {`Termin: ${formatDisplayDate(selectedBooking.dateIso)} o ${selectedBooking.time}\n${selectedBooking.doctor.name}\nPlacówka: ${selectedBooking.doctor.location}`}
          </Text>
          <TouchableOpacity
            style={styles.successButton}
            activeOpacity={0.9}
            onPress={() => router.replace('/')}>
            <Text style={styles.successButtonText}>Wróć do Strefy Pacjenta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sticky header: daty + tytuł */}
        <View style={styles.stickyHeader}>
          <View style={styles.dateRow}>
            {dateOptions.map((opt) => {
              const isActive = selectedDateKey === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.dateChip,
                    isActive && styles.dateChipActive,
                  ]}
                  onPress={() => {
                    setSelectedDateKey(opt.key);
                    setSelectedDateLabel(opt.label);
                    setSelectedDateIso(null);
                    setSelectedBooking(null);
                  }}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.dateChipText,
                      isActive && styles.dateChipTextActive,
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Inny termin */}
            <TouchableOpacity
              style={[styles.dateChip, styles.dateChipCalendar]}
              onPress={() => setIsCalendarVisible(true)}
              activeOpacity={0.8}>
              <Ionicons name="calendar" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dostępne terminy</Text>
            <Text style={styles.sectionDateInfo}>Dzień: {selectedDateLabel}</Text>
            <TouchableOpacity
              style={styles.locationRow}
              activeOpacity={0.8}
              onPress={() => {
                setTempLocation(selectedLocation);
                setIsLocationModalVisible(true);
              }}>
              <Text style={styles.locationText}>
                Wybrana placówka: {selectedLocation}
              </Text>
              <Ionicons name="swap-horizontal-outline" size={18} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollowalna lista lekarzy */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {!anySlotsForSelectedDate ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Brak wolnych terminów</Text>
              <Text style={styles.emptyText}>
                {selectedDateKey === 'custom'
                  ? 'Brak dostępnych terminów w tym dniu. Wybierz inną datę.'
                  : 'Spróbuj wybrać inny dzień lub lekarza.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={visibleDoctors}
              keyExtractor={(item) => item.id}
              renderItem={renderDoctorCard}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          )}
        </ScrollView>

      </View>
      {/* Modal z wyborem daty (widok miesięczny) */}
      <Modal
        visible={isCalendarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCalendarVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Nagłówek modala */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wybierz datę wizyty</Text>
              <TouchableOpacity
                onPress={() => setIsCalendarVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Nagłówek kalendarza (miesiąc / nawigacja) */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={goToPrevMonth}
                disabled={isPrevDisabled}
                style={[styles.calendarNavButton, isPrevDisabled && styles.calendarNavButtonDisabled]}>
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={isPrevDisabled ? COLORS.textMuted : COLORS.textSecondary}
                />
              </TouchableOpacity>
              <Text style={styles.calendarHeaderTitle}>
                {currentCalendarMonth.toLocaleDateString('pl-PL', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity
                onPress={goToNextMonth}
                disabled={isNextDisabled}
                style={[styles.calendarNavButton, isNextDisabled && styles.calendarNavButtonDisabled]}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isNextDisabled ? COLORS.textMuted : COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Dni tygodnia */}
            <View style={styles.weekDaysRow}>
              {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((d) => (
                <Text key={d} style={styles.weekDayLabel}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Siatka dni */}
            <View style={styles.calendarGrid}>
              {(() => {
                const year = currentCalendarMonth.getFullYear();
                const month = currentCalendarMonth.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                // JS: 0 = niedziela, 1 = poniedziałek ...
                const firstJsDay = new Date(year, month, 1).getDay();
                const firstIdx = (firstJsDay + 6) % 7; // 0 = poniedziałek

                const cells: JSX.Element[] = [];

                // Puste kafelki przed pierwszym dniem
                for (let i = 0; i < firstIdx; i++) {
                  cells.push(<View key={`empty-${i}`} style={styles.calendarDayCell} />);
                }

                for (let day = 1; day <= daysInMonth; day++) {
                  const dateObj = new Date(year, month, day);
                  dateObj.setHours(0, 0, 0, 0);
                  const isPast = dateObj < today;
                  const iso =
                    dateObj.getFullYear() +
                    '-' +
                    String(dateObj.getMonth() + 1).padStart(2, '0') +
                    '-' +
                    String(dateObj.getDate()).padStart(2, '0');
                  const isSelected = selectedDateIso === iso;

                  const DayInner = (
                    <View
                      style={[
                        styles.calendarDayInner,
                        isSelected && styles.calendarDayInnerSelected,
                      ]}>
                      <Text
                        style={[
                          styles.calendarDayText,
                          isPast && styles.calendarDayTextDisabled,
                          isSelected && styles.calendarDayTextSelected,
                        ]}>
                        {day}
                      </Text>
                    </View>
                  );

                  if (isPast) {
                    cells.push(
                      <View key={iso} style={styles.calendarDayCell}>
                        {DayInner}
                      </View>,
                    );
                  } else {
                    cells.push(
                      <TouchableOpacity
                        key={iso}
                        style={styles.calendarDayCell}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedDateKey('custom');
                          setSelectedDateLabel(iso);
                          setSelectedDateIso(iso);
                          setSelectedBooking(null);
                          setIsCalendarVisible(false);
                        }}>
                        {DayInner}
                      </TouchableOpacity>,
                    );
                  }
                }

                return cells;
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal wyboru lokalizacji */}
      <Modal
        visible={isLocationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setTempLocation(selectedLocation);
          setIsLocationModalVisible(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>Wybierz placówkę</Text>
            {LOCATIONS.map((loc) => {
              const isActive = tempLocation === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  style={[
                    styles.locationOption,
                    isActive && styles.locationOptionActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setTempLocation(loc)}>
                  <Text
                    style={[
                      styles.locationOptionText,
                      isActive && styles.locationOptionTextActive,
                    ]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.locationButtonsRow}>
              <TouchableOpacity
                style={[styles.locationButton, styles.locationButtonSecondary]}
                activeOpacity={0.8}
                onPress={() => {
                  setTempLocation(selectedLocation);
                  setIsLocationModalVisible(false);
                }}>
                <Text style={styles.locationButtonSecondaryText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.locationButton, styles.locationButtonPrimary]}
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedLocation(tempLocation);
                  setIsLocationModalVisible(false);
                }}>
                <Text style={styles.locationButtonPrimaryText}>Zatwierdź</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal potwierdzenia rezerwacji */}
      <Modal
        visible={isConfirmVisible && !!selectedBooking}
        transparent
        animationType="fade"
        onRequestClose={() => setIsConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Potwierdź wizytę</Text>
            {selectedBooking && (
              <>
                <Text style={styles.confirmText}>
                  {`Data: ${formatDisplayDate(selectedBooking.dateIso)}\nGodzina: ${selectedBooking.time}\nLekarz: ${selectedBooking.doctor.name}\nPlacówka: ${selectedBooking.doctor.location}`}
                </Text>
              </>
            )}
            <View style={styles.confirmButtonsRow}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonSecondary]}
                activeOpacity={0.8}
                onPress={() => setIsConfirmVisible(false)}>
                <Text style={styles.confirmButtonSecondaryText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonPrimary]}
                activeOpacity={0.9}
                onPress={handleConfirm}
                disabled={!selectedBooking}>
                <Text style={styles.confirmButtonPrimaryText}>Potwierdzam</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },

  // Sticky header
  stickyHeader: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
  },

  // Dates
  dateRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: COLORS.card,
  },
  dateChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  dateChipCalendar: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
  },
  dateChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dateChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Location row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Doctors list
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionDateInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  doctorCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  doctorHeaderText: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  doctorLocation: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  primaryPillText: {
    fontSize: 11,
    color: '#92400E',
    marginLeft: 4,
    fontWeight: '600',
  },

  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginTop: 8,
    backgroundColor: COLORS.card,
  },
  slotChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  slotChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  slotChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  modalDatesGrid: {
    marginTop: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  calendarHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  calendarNavButton: {
    padding: 4,
    borderRadius: 999,
  },
  calendarNavButtonDisabled: {
    opacity: 0.4,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 4,
  },
  weekDayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayInnerSelected: {
    backgroundColor: COLORS.primary,
  },
  calendarDayText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  calendarDayTextDisabled: {
    color: COLORS.textMuted,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Location modal
  locationCard: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  locationOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginBottom: 8,
  },
  locationOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: '#2563EB',
  },
  locationOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  locationOptionTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  locationButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  locationButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  locationButtonSecondary: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  locationButtonPrimary: {
    marginLeft: 8,
    backgroundColor: '#2563EB',
  },
  locationButtonSecondaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  locationButtonPrimaryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Success screen
  successContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  successButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Confirm modal
  confirmCard: {
    width: '85%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  confirmButtonSecondary: {
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  confirmButtonPrimary: {
    marginLeft: 8,
    backgroundColor: COLORS.primary,
  },
  confirmButtonSecondaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  confirmButtonPrimaryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

