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
import { useLocalSearchParams, useRouter } from 'expo-router';

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
  location: string;
};

const doctors: Doctor[] = [
  {
    id: 'ewa-nowaczyk-rogowska',
    name: 'lek. Ewa Nowaczyk-Rogowska',
    specialty: 'Internista',
    location: 'ul. 30-go Stycznia 55',
  },
  {
    id: 'anna-freza',
    name: 'lek. Anna Freza',
    specialty: 'Internista',
    location: 'ul. Jasia i Małgosi 8/4',
  },
  {
    id: 'agnieszka-biedrzycka',
    name: 'lek. Agnieszka Biedrzycka',
    specialty: 'Okulista',
    location: 'ul. 30-go Stycznia 55',
  },
  {
    id: 'hanna-pardo',
    name: 'lek. Hanna Pardo',
    specialty: 'Reumatolog',
    location: 'ul. Piaskowa 3',
  },
  {
    id: 'tomasz-mazur',
    name: 'lek. Tomasz Mazur',
    specialty: 'Kardiolog',
    location: 'ul. Jasia i Małgosi 8/4',
  },
  {
    id: 'jan-kowalski',
    name: 'lek. Jan Kowalski',
    specialty: 'Ortopeda',
    location: 'ul. Dąbrowskiego 10',
  },
];

const dateOptions = [
  { key: 'today' as const, label: 'Dzisiaj' },
  { key: 'tomorrow' as const, label: 'Jutro' },
  { key: 'dayAfter' as const, label: 'Pojutrze' },
];

const SPECIALTIES = [
  'dowolny specjalista',
  'Internista',
  'Okulista',
  'Reumatolog',
  'Kardiolog',
  'Ortopeda',
] as const;

const LOCATIONS = [
  'dowolna placówka w Tczewie',
  'ul. 30-go Stycznia 55',
  'ul. Jasia i Małgosi 8/4',
  'ul. Piaskowa 3',
  'ul. Dąbrowskiego 10',
] as const;

type DateKey = (typeof dateOptions)[number]['key'] | 'custom';

export default function BookingScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ autoAssign?: string; triageUrgent?: string }>();
  const autoAssignRaw = searchParams.autoAssign;
  const autoAssignFlag =
    (Array.isArray(autoAssignRaw) ? autoAssignRaw[0] : autoAssignRaw) === 'true';
  const isAutoAssign = autoAssignFlag;

  const initialToday = new Date();
  initialToday.setHours(0, 0, 0, 0);
  const initialIso =
    initialToday.getFullYear() +
    '-' +
    String(initialToday.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(initialToday.getDate()).padStart(2, '0');
  const initialLabel = initialToday.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const [selectedDateKey, setSelectedDateKey] = useState<DateKey>('today');
  const [selectedDateLabel, setSelectedDateLabel] = useState<string>(initialLabel);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(initialIso);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('dowolny specjalista');
  const [tempSpecialty, setTempSpecialty] = useState<string>('dowolny specjalista');
  const [selectedLocation, setSelectedLocation] = useState<(typeof LOCATIONS)[number]>('dowolna placówka w Tczewie');
  const [tempLocation, setTempLocation] = useState<(typeof LOCATIONS)[number]>('dowolna placówka w Tczewie');
  const [selectedBooking, setSelectedBooking] = useState<{
    doctor: Doctor;
    time: string;
    dateIso: string;
  } | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState<boolean>(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState<boolean>(false);
  const [isWizardVisible, setIsWizardVisible] = useState<boolean>(() => !isAutoAssign);
  const [wizardStep, setWizardStep] = useState<number>(1);

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

  const sortedDoctors = useMemo(() => [...doctors], []);

  const visibleDoctors = useMemo(() => {
    let base = sortedDoctors;

    if (selectedLocation !== 'dowolna placówka w Tczewie') {
      base = base.filter((d) => d.location === selectedLocation);
    }

    if (selectedSpecialty === 'dowolny specjalista') {
      return base;
    }
    return base.filter((d) => d.specialty === selectedSpecialty);
  }, [sortedDoctors, selectedLocation, selectedSpecialty]);

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

    // Deterministyczna "losowość" na podstawie daty,
    // żeby mock wyglądał naturalniej, ale był stabilny.
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

    const patterns: string[][] = [
      [], // brak terminów
      ['09:00', '10:30'],
      ['09:00', '10:30', '13:15'],
      ['08:30', '11:00', '14:30'],
      ['08:30', '11:00', '14:30', '16:15'],
      ['09:15', '12:00', '15:45'],
    ];

    let idx = seed % patterns.length;
    let times = patterns[idx];

    // Weekendy: częściej pusto, czasem kilka terminów
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (seed % 3 !== 0) {
        times = [];
      } else {
        times = patterns[(idx + 1) % patterns.length].slice(0, 2);
      }
    }

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
            {selectedLocation === 'dowolna placówka w Tczewie' && (
              <Text style={styles.doctorLocation}>{item.location}</Text>
            )}
          </View>
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
            onPress={() =>
              router.replace({
                pathname: '/my-visits',
                params: {
                  newVisit: JSON.stringify({
                    id: Date.now().toString(),
                    doctorName: selectedBooking.doctor.name,
                    specialty: selectedSpecialty,
                    date: selectedBooking.dateIso,
                    time: selectedBooking.time,
                    location: selectedBooking.doctor.location,
                  }),
                },
              } as never)
            }>
            <Text style={styles.successButtonText}>Przejdź do Moich Wizyt</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sticky header: daty + podsumowanie wyboru */}
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
                    let offset = 0;
                    if (opt.key === 'tomorrow') offset = 1;
                    if (opt.key === 'dayAfter') offset = 2;
                    const base = new Date(initialToday.getTime());
                    base.setDate(base.getDate() + offset);
                    base.setHours(0, 0, 0, 0);
                    const iso =
                      base.getFullYear() +
                      '-' +
                      String(base.getMonth() + 1).padStart(2, '0') +
                      '-' +
                      String(base.getDate()).padStart(2, '0');
                    setSelectedDateKey(opt.key);
                    setSelectedDateIso(iso);
                    setSelectedDateLabel(
                      base.toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }),
                    );
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
            <TouchableOpacity
              style={styles.wizardSummary}
              activeOpacity={0.8}
              onPress={() => {
                setTempSpecialty(selectedSpecialty);
                setTempLocation(selectedLocation);
                setWizardStep(1);
                setIsWizardVisible(true);
              }}>
              <View style={{ flex: 1 }}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dzień wizyty:</Text>
                  <Text style={styles.infoValue}>{selectedDateLabel}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Specjalista:</Text>
                  <Text style={styles.infoValue}>{selectedSpecialty}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Placówka:</Text>
                  <Text style={styles.infoValue}>{selectedLocation}</Text>
                </View>
                {isAutoAssign ? (
                  <Text style={styles.autoAssignHint}>
                    Na start pokazujemy wszystkich lekarzy — dotknij tutaj, aby zawęzić specjalizację
                    i placówkę.
                  </Text>
                ) : null}
              </View>
              <Ionicons name="swap-horizontal-outline" size={20} color="#2563EB" />
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

                  const hasAvailability =
                    !isPast &&
                    getAvailableSlotsForDate(dateObj).length > 0 &&
                    visibleDoctors.length > 0;

                  const DayInner = (
                    <View
                      style={[
                        styles.calendarDayInner,
                        !isSelected &&
                          !isPast &&
                          (hasAvailability
                            ? styles.calendarDayInnerAvailable
                            : styles.calendarDayInnerUnavailable),
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
                          setSelectedDateLabel(formatDisplayDate(iso));
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

      {/* Kreator (Wizard) wyboru specjalizacji i lokalizacji */}
      <Modal
        visible={isWizardVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setTempSpecialty(selectedSpecialty);
          setTempLocation(selectedLocation);
          setWizardStep(1);
          setIsWizardVisible(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.locationCard}>
            {wizardStep === 1 && (
              <>
                <Text style={styles.locationTitle}>Kogo szukasz?</Text>
                <ScrollView style={{ maxHeight: 260 }}>
                  {SPECIALTIES.map((spec) => {
                    const isActive = tempSpecialty === spec;
                    return (
                      <TouchableOpacity
                        key={spec}
                        style={[
                          styles.locationOption,
                          isActive && styles.locationOptionActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setTempSpecialty(spec)}>
                        <Text
                          style={[
                            styles.locationOptionText,
                            isActive && styles.locationOptionTextActive,
                          ]}>
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.locationButtonsRow}>
                  <TouchableOpacity
                    style={[styles.locationButton, styles.locationButtonSecondary]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setTempSpecialty(selectedSpecialty);
                      setTempLocation(selectedLocation);
                      setWizardStep(1);
                      setIsWizardVisible(false);
                    }}>
                    <Text style={styles.locationButtonSecondaryText}>Anuluj</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.locationButton, styles.locationButtonPrimary]}
                    activeOpacity={0.9}
                    onPress={() => setWizardStep(2)}>
                    <Text style={styles.locationButtonPrimaryText}>Dalej</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {wizardStep === 2 && (
              <>
                <View style={styles.wizardStepHeader}>
                  <TouchableOpacity
                    onPress={() => setWizardStep(1)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.locationTitle}>Gdzie chcesz pójść?</Text>
                  <View style={{ width: 20 }} />
                </View>

                <ScrollView style={{ maxHeight: 260 }}>
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
                </ScrollView>

                <View style={styles.locationButtonsRow}>
                  <TouchableOpacity
                    style={[styles.locationButton, styles.locationButtonSecondary]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setTempSpecialty(selectedSpecialty);
                      setTempLocation(selectedLocation);
                      setWizardStep(1);
                      setIsWizardVisible(false);
                    }}>
                    <Text style={styles.locationButtonSecondaryText}>Anuluj</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.locationButton, styles.locationButtonPrimary]}
                    activeOpacity={0.9}
                    onPress={() => {
                      setSelectedSpecialty(tempSpecialty);
                      setSelectedLocation(tempLocation);
                      setWizardStep(1);
                      setIsWizardVisible(false);
                    }}>
                    <Text style={styles.locationButtonPrimaryText}>Zatwierdź</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  wizardSummary: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoAssignHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 110,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
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
  calendarDayInnerAvailable: {
    backgroundColor: '#BBF7D0', // jasna zieleń
  },
  calendarDayInnerUnavailable: {
    backgroundColor: '#E5E7EB', // jasna szarość
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

  wizardStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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

