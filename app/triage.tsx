import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type PathType = 'prescription' | 'urgent' | 'triage' | null;

const COLORS = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  success: '#16A34A',
  successLight: '#DCFCE7',
  border: '#E5E7EB',
  shadow: '#9CA3AF',
};

export default function TriageScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedPath, setSelectedPath] = useState<PathType>(null);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'infection' | 'results' | 'chronic' | null>(
    null,
  );

  const resetToStep1 = () => {
    setStep(1);
    setSelectedPath(null);
    setPrescriptionText('');
    setSelectedDate(null);
    setSelectedCategory(null);
  };

  const handleFastTrackSubmit = () => {
    if (selectedPath === 'urgent') {
      router.replace({
        pathname: '/',
        params: { criticalTriage: 'true' },
      });
      return;
    }

    if (selectedPath === 'prescription' && !prescriptionText.trim()) {
      Alert.alert('Uzupełnij informacje', 'Opisz proszę leki i dawkowanie przed wysłaniem prośby.');
      return;
    }

    setStep(6);
  };

  const handleConfirmReservation = () => {
    if (!selectedDate) {
      Alert.alert('Wybierz termin', 'Zaznacz preferowany termin wizyty.');
      return;
    }
    setStep(6);
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <View style={styles.content}>
          <Text style={styles.header}>W czym możemy Ci dzisiaj pomóc?</Text>

          <Text style={styles.subheader}>
            Wybierz jedną z opcji poniżej. Zawsze możesz wrócić i zmienić wybór.
          </Text>

          <View style={styles.cardsColumn}>
            {/* Opcja 1 – Krytyczna */}
            <TouchableOpacity
              style={[styles.optionCard, styles.optionCardRed]}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedPath('urgent');
                setStep(2);
              }}
              accessibilityRole="button"
              accessibilityLabel="Silny ból lub złe samopoczucie. Wymaga pilnego kontaktu.">
              <View style={[styles.optionIconCircle, { backgroundColor: COLORS.dangerLight }]}>
                <Ionicons name="warning-outline" size={32} color={COLORS.danger} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Silny ból, złe samopoczucie</Text>
                <Text style={styles.optionSubtitle}>Wymaga pilnego kontaktu</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.danger} />
            </TouchableOpacity>

            {/* Opcja 2 – Zwykła wizyta */}
            <TouchableOpacity
              style={[styles.optionCard, styles.optionCardGreen]}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedPath('triage');
                setStep(3);
              }}
              accessibilityRole="button"
              accessibilityLabel="Zwykła wizyta do lekarza lub inny problem.">
              <View style={[styles.optionIconCircle, { backgroundColor: COLORS.successLight }]}>
                <Ionicons name="calendar-outline" size={32} color={COLORS.success} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Zwykła wizyta</Text>
                <Text style={styles.optionSubtitle}>Standardowa wizyta do lekarza</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.success} />
            </TouchableOpacity>

            {/* Opcja 3 – Recepta */}
            <TouchableOpacity
              style={[styles.optionCard, styles.optionCardBlue]}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedPath('prescription');
                setStep(2);
              }}
              accessibilityRole="button"
              accessibilityLabel="Przedłużenie recepty na stale przyjmowane leki.">
              <View style={styles.optionIconCircle}>
                <Ionicons name="medkit-outline" size={32} color={COLORS.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Przedłużenie recepty</Text>
                <Text style={styles.optionSubtitle}>Stale przyjmowane leki</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (step === 2) {
      return (
        <View style={styles.content}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={resetToStep1}
              accessibilityRole="button"
              accessibilityLabel="Wróć do wyboru problemu">
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Wstecz</Text>
            </TouchableOpacity>
          </View>

          {selectedPath === 'prescription' && (
            <>
              <Text style={styles.header}>Zamówienie e-Recepty</Text>
              <Text style={styles.subheader}>
                Podaj nazwy swoich leków, dawki oraz jak często je przyjmujesz. Nie wpisuj danych karty
                płatniczej ani numeru PIN.
              </Text>

              <View style={styles.card}>
                <TextInput
                  style={styles.textArea}
                  multiline
                  textAlignVertical="top"
                  placeholder="Wpisz nazwy leków i dawkowanie..."
                  placeholderTextColor={COLORS.textMuted}
                  value={prescriptionText}
                  onChangeText={setPrescriptionText}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, styles.primaryButtonFull]}
                activeOpacity={0.9}
                onPress={handleFastTrackSubmit}
                accessibilityRole="button"
                accessibilityLabel="Wyślij prośbę o przedłużenie recepty do lekarza">
                <Text style={styles.primaryButtonText}>Wyślij prośbę do lekarza</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedPath === 'urgent' && (
            <>
              <View style={[styles.card, styles.urgentBanner]}>
                <View style={styles.urgentIconWrapper}>
                  <Ionicons name="warning" size={36} color={COLORS.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.urgentTitle}>UWAGA!</Text>
                  <Text style={styles.urgentText}>
                    Jeśli podejrzewasz zawał, udar, masz duszności lub krwotok –{' '}
                    <Text style={styles.urgentTextBold}>natychmiast dzwoń na numer alarmowy 112!</Text>
                  </Text>
                </View>
              </View>

              <Text style={styles.subheader}>
                Jeśli sytuacja nie zagraża bezpośrednio życiu, ale wymaga pilnego kontaktu, możesz zgłosić
                problem do przychodni.
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, styles.primaryButtonDanger]}
                activeOpacity={0.9}
                onPress={handleFastTrackSubmit}
                accessibilityRole="button"
                accessibilityLabel="Zgłoś pilny problem do przychodni">
                <Text style={styles.primaryButtonText}>Zgłoś pilny problem do przychodni</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      );
    }

    if (step === 3 && selectedPath === 'triage') {
      return (
        <View style={styles.content}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={resetToStep1}
              accessibilityRole="button"
              accessibilityLabel="Wróć do menu głównego">
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Wstecz</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.header}>Czy masz duszności lub ból w klatce?</Text>
          <Text style={styles.subheader}>
            Jeśli tak, możesz wymagać pilniejszej pomocy. Dokładnie przeczytaj poniższe przykłady.
          </Text>

          <View style={styles.flagsList}>
            <View style={styles.flagItem}>
              <View style={styles.flagIconWrapper}>
                <Ionicons name="alert-circle-outline" size={26} color={COLORS.danger} />
              </View>
              <Text style={styles.flagText}>Silny ból w klatce piersiowej</Text>
            </View>

            <View style={styles.flagItem}>
              <View style={styles.flagIconWrapper}>
                <Ionicons name="alert-circle-outline" size={26} color={COLORS.danger} />
              </View>
              <Text style={styles.flagText}>Duszności / Problemy z oddychaniem</Text>
            </View>

            <View style={styles.flagItem}>
              <View style={styles.flagIconWrapper}>
                <Ionicons name="alert-circle-outline" size={26} color={COLORS.danger} />
              </View>
              <Text style={styles.flagText}>Zaburzenia mowy lub widzenia</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonDanger]}
            activeOpacity={0.9}
            onPress={() => {
              setSelectedPath('urgent');
              setStep(2);
            }}
            accessibilityRole="button"
            accessibilityLabel="Tak, mam takie objawy – przejdź do pilnego kontaktu">
            <Text style={styles.primaryButtonText}>Tak, mam takie objawy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.9}
            onPress={() => setStep(4)}
            accessibilityRole="button"
            accessibilityLabel="Nie, żaden z powyższych objawów – przejdź do wyboru terminu">
            <Text style={styles.secondaryButtonText}>Nie, żadne z powyższych</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 4) {
      return (
        <View style={styles.content}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(3)}
              accessibilityRole="button"
              accessibilityLabel="Wróć do poprzedniego kroku">
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Wstecz</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.header}>Czego dokładnie dotyczy Twój problem?</Text>
          <Text style={styles.subheader}>Wybierz kategorię, która najlepiej pasuje do Twojej sytuacji.</Text>

          <View style={styles.categoryList}>
            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategory === 'infection' && styles.categoryCardSelected,
              ]}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedCategory('infection');
                setStep(5);
              }}
              accessibilityRole="button"
              accessibilityLabel="Infekcja: kaszel, katar lub gorączka">
              <View style={styles.categoryIconWrapper}>
                <Ionicons name="thermometer-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.categoryTextContainer}>
                <Text style={styles.categoryTitle}>Infekcja</Text>
                <Text style={styles.categorySubtitle}>Kaszel, katar, gorączka</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategory === 'results' && styles.categoryCardSelected,
              ]}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedCategory('results');
                setStep(5);
              }}
              accessibilityRole="button"
              accessibilityLabel="Omówienie wyników lub skierowanie">
              <View style={styles.categoryIconWrapper}>
                <Ionicons name="document-text-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.categoryTextContainer}>
                <Text style={styles.categoryTitle}>Omówienie wyników / Skierowanie</Text>
                <Text style={styles.categorySubtitle}>Badania, konsultacja, dokumenty</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategory === 'chronic' && styles.categoryCardSelected,
              ]}
              activeOpacity={0.9}
              onPress={() => {
                setSelectedCategory('chronic');
                setStep(5);
              }}
              accessibilityRole="button"
              accessibilityLabel="Ból przewlekły: plecy, stawy i inne">
              <View style={styles.categoryIconWrapper}>
                <Ionicons name="body-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.categoryTextContainer}>
                <Text style={styles.categoryTitle}>Ból przewlekły</Text>
                <Text style={styles.categorySubtitle}>Plecy, stawy, inne narządy ruchu</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (step === 5) {
      return (
        <View style={styles.content}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(4)}
              accessibilityRole="button"
              accessibilityLabel="Wróć do wyboru kategorii problemu">
              <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
              <Text style={styles.backButtonText}>Wstecz</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.header}>Wybierz preferowany termin</Text>
          <Text style={styles.subheader}>
            To tylko wstępna propozycja. Rejestracja potwierdzi dokładną godzinę wizyty.
          </Text>

          <View style={styles.dateGrid}>
            <TouchableOpacity
              style={[
                styles.dateCard,
                selectedDate === 'today' && styles.dateCardSelected,
              ]}
              activeOpacity={0.9}
              onPress={() => setSelectedDate('today')}
              accessibilityRole="button"
              accessibilityLabel="Dzisiaj">
              <Ionicons
                name="sunny-outline"
                size={28}
                color={selectedDate === 'today' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.dateLabel,
                  selectedDate === 'today' && styles.dateLabelSelected,
                ]}>
                Dzisiaj
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dateCard,
                selectedDate === 'tomorrow' && styles.dateCardSelected,
              ]}
              activeOpacity={0.9}
              onPress={() => setSelectedDate('tomorrow')}
              accessibilityRole="button"
              accessibilityLabel="Jutro">
              <Ionicons
                name="today-outline"
                size={28}
                color={selectedDate === 'tomorrow' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.dateLabel,
                  selectedDate === 'tomorrow' && styles.dateLabelSelected,
                ]}>
                Jutro
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, styles.primaryButtonFull]}
            activeOpacity={0.9}
            onPress={handleConfirmReservation}
            accessibilityRole="button"
            accessibilityLabel="Potwierdź wstępną rezerwację terminu wizyty">
            <Text style={styles.primaryButtonText}>Potwierdź rezerwację</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Step 6 – success
    let confirmationText = '';
    if (selectedPath === 'prescription') {
      confirmationText =
        'Twoja prośba o przedłużenie recepty została wysłana do lekarza prowadzącego. Otrzymasz powiadomienie z kodem PIN.';
    } else if (selectedPath === 'urgent') {
      confirmationText =
        'Twoje pilne zgłoszenie trafiło do Rejestracji. Skontaktujemy się z Tobą telefonicznie w ciągu kilkunastu minut.';
    } else if (selectedPath === 'triage') {
      confirmationText =
        'Termin wizyty został wstępnie zarezerwowany. Potwierdzenie znajdziesz w zakładce Historia.';
    } else {
      confirmationText =
        'Twoje zgłoszenie zostało zapisane. W razie potrzeby skontaktujemy się z Tobą telefonicznie.';
    }

    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        </View>
        <Text style={styles.successTitle}>Gotowe!</Text>
        <Text style={styles.successText}>{confirmationText}</Text>

        <TouchableOpacity
          style={[styles.primaryButton, styles.primaryButtonFull, styles.successButton]}
          activeOpacity={0.9}
          onPress={() => router.push('/')}
          accessibilityRole="button"
          accessibilityLabel="Wróć na stronę główną">
          <Text style={styles.primaryButtonText}>Wróć na stronę główną</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SHADOW = Platform.select({
  ios: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  android: {
    elevation: 4,
  },
  default: {},
});

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
    paddingTop: 24,
    paddingBottom: 32,
  },

  content: {
    flex: 1,
  },

  header: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },

  cardsColumn: {
    gap: 16,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  optionCardBlue: {},
  optionCardRed: {},
  optionCardGreen: {},

  optionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '600',
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    ...SHADOW,
  },

  textArea: {
    minHeight: 140,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  primaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW,
  },
  primaryButtonFull: {
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  primaryButtonDanger: {
    backgroundColor: COLORS.danger,
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  urgentBanner: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.dangerLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  urgentIconWrapper: {
    marginTop: 2,
  },
  urgentTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.danger,
    marginBottom: 4,
  },
  urgentText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  urgentTextBold: {
    fontWeight: '700',
    color: COLORS.danger,
  },

  categoryList: {
    marginTop: 8,
    gap: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
    ...SHADOW,
  },
  categoryCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#DBEAFE',
  },
  categoryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  flagsList: {
    marginBottom: 24,
    gap: 12,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...SHADOW,
  },
  flagIconWrapper: {
    width: 40,
    alignItems: 'center',
    marginRight: 8,
  },
  flagText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  dateGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  dateCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    ...SHADOW,
  },
  dateCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#DBEAFE',
  },
  dateLabel: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  dateLabelSelected: {
    color: COLORS.primaryDark,
  },

  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...SHADOW,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 32,
  },
  successButton: {
    alignSelf: 'stretch',
  },
});

