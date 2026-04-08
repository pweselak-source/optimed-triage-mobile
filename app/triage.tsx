import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type IntroReason = 'nowy_objaw' | 'pogorszenie' | 'admin' | null;
type MainSymptom =
  | 'kaszel'
  | 'goraczka'
  | 'bol_gardla'
  | 'katar'
  | 'dusznosc'
  | 'bol_klatki'
  | 'inne'
  | null;
type AcuteKey =
  | 'dusznosc'
  | 'nie_mowa'
  | 'bol_klatki'
  | 'utrata_przytomnosci'
  | 'udar'
  | 'krwawienie'
  | 'obrzęk_gardla'
  | 'brak';
type HeavyKey = 'oslabiony' | 'goraczka_zle' | 'splatanie' | 'szybki_oddech' | 'nie';
type DehydrationKey = 'nie_pije' | 'wymioty' | 'brak_moczu' | 'brak';
type MentalKey = 'tak' | 'nie' | null;
type CoughType = 'suchy' | 'mokry' | 'nie_wiem' | null;
type CoughDuration = 'lt1' | 'd1_3' | 'd4_7' | 'd7plus' | null;
type FeverLevel = 'brak' | 'lt38' | '38_39' | 'gt39' | null;
type BreathLevel = 'nie' | 'lekkie' | 'umiarkowane' | 'duze' | null;
type Sputum = 'brak' | 'jasna' | 'zolta_zielona' | 'krew' | null;
type ExtraSymptomA = 'bol_gardla' | 'katar' | 'bol_zatok' | 'bol_klatki_oddech';
type ExtraSymptomB = 'bole_miesni' | 'bol_uszu';
type ExtraSymptom = ExtraSymptomA | ExtraSymptomB;
type BotherLevel = 'lekko' | 'umiarkowanie' | 'bardzo' | null;
type Trend = 'poprawa' | 'bez_zmian' | 'pogorszenie' | 'wax_wane' | null;
type ChronicKey = 'pluca' | 'serce' | 'cukrzyca' | 'nowotwor' | 'leki_odpornosc' | 'brak';

type OutcomeKey = 'callback_today' | 'three_days' | 'plan_later' | 'symptomatic';
type ResultVariant = 'urgent' | 'routine' | 'selfcare';

const COLORS = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  primary: '#2563EB',
  primarySoft: '#DBEAFE',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  border: '#E5E7EB',
  shadow: '#9CA3AF',
};

const RESULT_STEP = 20;
const FIRST_COUGH_STEP = 8;
const LAST_COUGH_STEP = 17;
const COUGH_STEP_COUNT = LAST_COUGH_STEP - FIRST_COUGH_STEP + 1;

function buildDoctorSummary(a: Answers, urgencyCount: number): string {
  const parts: string[] = ['Pacjent – ścieżka kaszel.'];
  if (a.coughType) {
    const m: Record<NonNullable<CoughType>, string> = {
      suchy: 'Kaszel suchy',
      mokry: 'Kaszel mokry',
      nie_wiem: 'Typ kaszlu nieokreślony',
    };
    parts.push(m[a.coughType] + '.');
  }
  if (a.duration) {
    const m: Record<NonNullable<CoughDuration>, string> = {
      lt1: 'Kaszel do 1 dnia',
      d1_3: 'Kaszel 1–3 dni',
      d4_7: 'Kaszel 4–7 dni',
      d7plus: 'Kaszel ponad tydzień',
    };
    parts.push(m[a.duration] + '.');
  }
  if (a.fever) {
    const m: Record<NonNullable<FeverLevel>, string> = {
      brak: 'Bez gorączki',
      lt38: 'Gorączka poniżej 38 °C',
      '38_39': 'Gorączka 38–39 °C',
      gt39: 'Gorączka powyżej 39 °C',
    };
    parts.push(m[a.fever] + '.');
  }
  if (a.breath) {
    const m: Record<NonNullable<BreathLevel>, string> = {
      nie: 'Bez trudności w oddychaniu',
      lekkie: 'Lekka trudność w oddychaniu',
      umiarkowane: 'Umiarkowana trudność w oddychaniu',
      duze: 'Znaczna trudność w oddychaniu',
    };
    parts.push(m[a.breath] + '.');
  }
  if (a.sputum) {
    const m: Record<NonNullable<Sputum>, string> = {
      brak: 'Bez odkrztuszania',
      jasna: 'Odkrztuszana wydzielina jasna',
      zolta_zielona: 'Żółta/zielona wydzielina',
      krew: 'Krew w odkrztuszanej wydzielinie',
    };
    parts.push(m[a.sputum] + '.');
  }
  if (a.extraSymptoms.length) {
    const labels: Record<ExtraSymptom, string> = {
      bol_gardla: 'ból gardła',
      katar: 'katar',
      bol_zatok: 'ból zatok',
      bol_klatki_oddech: 'ból w klatce przy oddychaniu',
      bole_miesni: 'bóle mięśni',
      bol_uszu: 'ból uszu',
    };
    parts.push('Objawy dodatkowe: ' + a.extraSymptoms.map((k) => labels[k]).join(', ') + '.');
  }
  if (a.bother) {
    const m: Record<NonNullable<BotherLevel>, string> = {
      lekko: 'Utrudnienia lekkie',
      umiarkowanie: 'Utrudnienia umiarkowane',
      bardzo: 'Utrudnienia duże',
    };
    parts.push(m[a.bother] + '.');
  }
  if (a.trend) {
    const m: Record<NonNullable<Trend>, string> = {
      poprawa: 'Trend: poprawa',
      bez_zmian: 'Trend: bez zmian',
      pogorszenie: 'Trend: pogorszenie',
      wax_wane: 'Trend: było lepiej, znów gorzej',
    };
    parts.push(m[a.trend] + '.');
  }
  if (a.chronic?.length) {
    const disease = a.chronic.filter((c) => c !== 'brak');
    if (disease.length) {
      parts.push('Choroby przewlekłe zadeklarowane: ' + disease.join(', ') + '.');
    } else {
      parts.push('Bez zadeklarowanych chorób przewlekłych z listy.');
    }
  }
  parts.push('Liczba flag pilności z ankiety: ' + urgencyCount + '.');
  return parts.join(' ');
}

function computeUrgencyFromAnswers(a: Answers): number {
  let n = 0;
  if (a.heavy && a.heavy !== 'nie') n++;
  if (a.dehydration && a.dehydration !== 'brak') n++;
  if (a.mental === 'tak') n++;
  if (a.breath === 'umiarkowane' || a.breath === 'duze') n++;
  if (a.sputum === 'krew') n++;
  if (a.bother === 'bardzo') n++;
  if (a.trend === 'pogorszenie' || a.trend === 'wax_wane') n++;
  if (a.chronic.some((c) => c !== 'brak')) n++;
  return n;
}

type Answers = {
  introReason: IntroReason;
  mainSymptom: MainSymptom;
  acute: AcuteKey | null;
  heavy: HeavyKey | null;
  dehydration: DehydrationKey | null;
  mental: MentalKey;
  coughType: CoughType;
  duration: CoughDuration;
  fever: FeverLevel;
  breath: BreathLevel;
  sputum: Sputum;
  extraSymptoms: ExtraSymptom[];
  bother: BotherLevel;
  trend: Trend;
  chronic: ChronicKey[];
};

const emptyAnswers = (): Answers => ({
  introReason: null,
  mainSymptom: null,
  acute: null,
  heavy: null,
  dehydration: null,
  mental: null,
  coughType: null,
  duration: null,
  fever: null,
  breath: null,
  sputum: null,
  extraSymptoms: [],
  bother: null,
  trend: null,
  chronic: [],
});

function computeOutcome(flags: number, duration: CoughDuration, trend: Trend): OutcomeKey {
  if (flags >= 2) return 'callback_today';
  const longCough = duration === 'd4_7' || duration === 'd7plus';
  if (flags === 1 || longCough) return 'three_days';
  if (flags === 0 && trend !== null && trend !== 'poprawa') return 'plan_later';
  if ((duration === 'lt1' || duration === 'd1_3') && trend === 'poprawa') return 'symptomatic';
  return 'plan_later';
}

function outcomeToVariant(o: OutcomeKey): ResultVariant {
  if (o === 'callback_today' || o === 'three_days') return 'urgent';
  if (o === 'plan_later') return 'routine';
  return 'selfcare';
}

function KillSwitchScreen({ onRestart }: { onRestart: () => void }) {
  const pulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const mockDial = (num: string) => {
    Alert.alert(num, 'Symulacja nawiązywania połączenia...', [{ text: 'OK' }]);
  };

  return (
    <View style={killStyles.root}>
      <Animated.View style={[killStyles.pulseLayer, { opacity: pulse }]} />
      <SafeAreaView style={killStyles.safe}>
        <ScrollView
          contentContainerStyle={killStyles.scrollInner}
          showsVerticalScrollIndicator={false}>
          <Ionicons name="warning" size={72} color="#FEF2F2" style={{ alignSelf: 'center' }} />
          <Text style={killStyles.killTitle}>Możliwe zagrożenie życia</Text>
          <Text style={killStyles.killLead}>
            Nie zwlekaj — wezwij pomoc medyczną lub poproś kogoś w pobliżu, aby zadzwonił za Ciebie.
          </Text>
          <Pressable
            style={killStyles.dialBtn}
            onPress={() => mockDial('112')}
            accessibilityRole="button"
            accessibilityLabel="Zadzwoń na 112">
            <Ionicons name="call" size={28} color="#FFF" />
            <Text style={killStyles.dialBtnText}>Zadzwoń na 112</Text>
          </Pressable>
          <Pressable
            style={killStyles.dialBtn}
            onPress={() => mockDial('999')}
            accessibilityRole="button"
            accessibilityLabel="Zadzwoń na 999">
            <Ionicons name="call" size={28} color="#FFF" />
            <Text style={killStyles.dialBtnText}>Zadzwoń na 999</Text>
          </Pressable>
          <Pressable style={killStyles.restartBtn} onPress={onRestart} accessibilityRole="button">
            <Text style={killStyles.restartText}>Od początku ankiety</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const killStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#7F1D1D',
  },
  pulseLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DC2626',
  },
  safe: {
    flex: 1,
    zIndex: 1,
  },
  scrollInner: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  killTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFBEB',
    textAlign: 'center',
    lineHeight: 34,
    marginTop: 8,
  },
  killLead: {
    fontSize: 17,
    color: '#FEE2E2',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    paddingVertical: 22,
    minHeight: 72,
  },
  dialBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  restartBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  restartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FECACA',
    textDecorationLine: 'underline',
  },
});

export default function TriageScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => emptyAnswers());
  const [emergencyExit, setEmergencyExit] = useState(false);
  const [emergencyReturnStep, setEmergencyReturnStep] = useState(3);
  const [urgencyFlags, setUrgencyFlags] = useState(0);
  const [doctorSummary, setDoctorSummary] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeKey | null>(null);

  const showProgressBar =
    currentStep >= FIRST_COUGH_STEP && currentStep <= LAST_COUGH_STEP && !emergencyExit;

  const progressFraction = useMemo(() => {
    if (!showProgressBar) return 0;
    return (currentStep - FIRST_COUGH_STEP + 1) / COUGH_STEP_COUNT;
  }, [currentStep, showProgressBar]);

  const goNext = (next: number) => setCurrentStep(next);

  const openEmergency = (acuteKey: AcuteKey, returnTo: 3 | 4) => {
    setAnswers((a) => ({ ...a, acute: acuteKey }));
    setEmergencyReturnStep(returnTo);
    setEmergencyExit(true);
  };

  const finishFlow = (finalAnswers: Answers) => {
    const flags = computeUrgencyFromAnswers(finalAnswers);
    setUrgencyFlags(flags);
    const oc = computeOutcome(flags, finalAnswers.duration, finalAnswers.trend);
    setOutcome(oc);
    setDoctorSummary(buildDoctorSummary(finalAnswers, flags));
    setCurrentStep(RESULT_STEP);
  };

  const navigateToAutoAssign = (urgent: boolean) => {
    console.log('Nawigacja do kalendarza - ominięcie wyboru placówki/lekarza', { urgent });
    router.push({
      pathname: '/booking',
      params: { autoAssign: 'true', triageUrgent: urgent ? 'true' : 'false' },
    } as never);
  };

  const exitTriageHome = () => {
    router.replace('/' as never);
  };

  const handleBack = () => {
    if (emergencyExit) {
      setEmergencyExit(false);
      setCurrentStep(emergencyReturnStep);
      return;
    }
    if (currentStep === RESULT_STEP) {
      setOutcome(null);
      setDoctorSummary(null);
      setUrgencyFlags(0);
      setAnswers(emptyAnswers());
      setCurrentStep(0);
      return;
    }
    if (currentStep <= 0) {
      router.back();
      return;
    }
    setCurrentStep((s) => s - 1);
  };

  const renderChoiceButton = (
    label: string,
    onPress: () => void,
    opts?: { disabled?: boolean; danger?: boolean },
  ) => (
    <Pressable
      onPress={opts?.disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.choiceBtn,
        opts?.disabled && styles.choiceBtnDisabled,
        opts?.danger && styles.choiceBtnDanger,
        !opts?.disabled && pressed && styles.choiceBtnPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!opts?.disabled }}>
      <Text
        style={[
          styles.choiceBtnText,
          opts?.disabled && styles.choiceBtnTextDisabled,
          opts?.danger && styles.choiceBtnTextLight,
        ]}>
        {label}
      </Text>
    </Pressable>
  );

  const renderProgress = () =>
    showProgressBar ? (
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progressFraction * 100)}%` }]} />
        </View>
      </View>
    ) : null;

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <Pressable onPress={handleBack} style={styles.backBtn} accessibilityRole="button">
        <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        <Text style={styles.backBtnText}>Wstecz</Text>
      </Pressable>
    </View>
  );

  const toggleExtraA = (key: ExtraSymptomA) => {
    setAnswers((a) => {
      const next = [...a.extraSymptoms];
      const i = next.indexOf(key);
      if (i >= 0) next.splice(i, 1);
      else next.push(key);
      return { ...a, extraSymptoms: next as ExtraSymptom[] };
    });
  };

  const toggleExtraB = (key: ExtraSymptomB) => {
    setAnswers((a) => {
      const next = [...a.extraSymptoms];
      const i = next.indexOf(key);
      if (i >= 0) next.splice(i, 1);
      else next.push(key);
      return { ...a, extraSymptoms: next as ExtraSymptom[] };
    });
  };

  const renderResults = () => {
    if (currentStep !== RESULT_STEP || !outcome || !doctorSummary) return null;
    const variant = outcomeToVariant(outcome);

    const summaryBlock = (
      <>
        <Text style={styles.summaryLabel}>
          Podsumowanie dla lekarza · pilność: {urgencyFlags}
        </Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>{doctorSummary}</Text>
        </View>
      </>
    );

    if (variant === 'urgent') {
      return (
        <View style={styles.block}>
          <Text style={styles.resultHeadline}>Twoje objawy wymagają szybkiej konsultacji</Text>
          <Text style={styles.resultSub}>
            Umów się możliwie szybko z lekarzem — przygotujemy dla Ciebie termin priorytetowy.
          </Text>
          <Pressable
            style={styles.ctaDoctor}
            onPress={() => navigateToAutoAssign(true)}
            accessibilityRole="button">
            <Ionicons name="medkit" size={26} color="#FFF" />
            <Text style={styles.ctaDoctorText}>Umów termin pilny</Text>
          </Pressable>
          {summaryBlock}
          <Pressable style={styles.textLinkBtn} onPress={exitTriageHome}>
            <Text style={styles.textLink}>Wróć na stronę główną</Text>
          </Pressable>
        </View>
      );
    }

    if (variant === 'routine') {
      return (
        <View style={styles.block}>
          <Text style={styles.resultHeadline}>Zalecamy konsultację lekarską w celu diagnostyki</Text>
          <Text style={styles.resultSub}>Umów standardową wizytę, gdy będzie Ci dogodnie.</Text>
          <Pressable
            style={styles.ctaDoctor}
            onPress={() => navigateToAutoAssign(false)}
            accessibilityRole="button">
            <Ionicons name="medkit" size={26} color="#FFF" />
            <Text style={styles.ctaDoctorText}>Umów termin</Text>
          </Pressable>
          {summaryBlock}
          <Pressable style={styles.textLinkBtn} onPress={exitTriageHome}>
            <Text style={styles.textLink}>Wróć na stronę główną</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.block}>
        <Text style={styles.resultHeadline}>Twój stan nie wymaga interwencji lekarskiej</Text>
        <Text style={styles.resultSub}>Możesz kontynuować obserwację w domu.</Text>
        <View style={styles.selfcareCard}>
          <Text style={styles.selfcareCardTitle}>Zalecenia</Text>
          <Text style={styles.selfcareCardText}>
            Nawadniaj organizm, odpoczywaj, stosuj dostępne w aptece środki łagodzące.
          </Text>
        </View>
        {summaryBlock}
        <Pressable style={styles.primaryBtn} onPress={exitTriageHome} accessibilityRole="button">
          <Text style={styles.primaryBtnText}>Zakończ zgłoszenie</Text>
        </Pressable>
      </View>
    );
  };

  const renderBody = () => {
    if (currentStep === RESULT_STEP && outcome && doctorSummary) {
      return renderResults();
    }

    switch (currentStep) {
      case 0:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>W czym możemy pomóc?</Text>
            {renderChoiceButton('Mam nowy objaw', () => {
              setAnswers((a) => ({ ...a, introReason: 'nowy_objaw' }));
              goNext(1);
            })}
            {renderChoiceButton('Pogorszenie stanu zdrowia', () => {}, { disabled: true })}
            {renderChoiceButton('Sprawa administracyjna', () => {}, { disabled: true })}
          </View>
        );

      case 1:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Co Ci dolega?</Text>
            {renderChoiceButton('Kaszel', () => {
              setAnswers((a) => ({ ...a, mainSymptom: 'kaszel' }));
              goNext(2);
            })}
            {renderChoiceButton('Gorączka', () => {}, { disabled: true })}
            {renderChoiceButton('Ból gardła', () => {}, { disabled: true })}
            {renderChoiceButton('Katar', () => {}, { disabled: true })}
            {renderChoiceButton('Duszność', () => {}, { disabled: true })}
            {renderChoiceButton('Ból w klatce', () => {}, { disabled: true })}
            {renderChoiceButton('Inne', () => {}, { disabled: true })}
          </View>
        );

      case 2:
        return (
          <View style={styles.block}>
            <Text style={styles.safetyLead}>Najpierw sprawdzimy, czy nie wymagasz pilnej pomocy.</Text>
            <Pressable style={styles.primaryBtn} onPress={() => goNext(3)} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Dalej</Text>
            </Pressable>
          </View>
        );

      case 3:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy masz któryś z objawów?</Text>
            {renderChoiceButton('Bardzo nasilona duszność', () => openEmergency('dusznosc', 3))}
            {renderChoiceButton('Nie możesz mówić pełnymi zdaniami', () => openEmergency('nie_mowa', 3))}
            {renderChoiceButton('Silny ból w klatce', () => openEmergency('bol_klatki', 3))}
            {renderChoiceButton('Utrata przytomności', () => openEmergency('utrata_przytomnosci', 3))}
            <Pressable style={styles.secondaryCta} onPress={() => goNext(4)} accessibilityRole="button">
              <Text style={styles.secondaryCtaText}>Pokaż kolejne</Text>
            </Pressable>
          </View>
        );

      case 4:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy masz któryś z objawów?</Text>
            {renderChoiceButton('Objawy udaru', () => openEmergency('udar', 4))}
            {renderChoiceButton('Silne krwawienie', () => openEmergency('krwawienie', 4))}
            {renderChoiceButton('Obrzęk gardła', () => openEmergency('obrzęk_gardla', 4))}
            <Pressable
              style={styles.secondaryCta}
              onPress={() => {
                setAnswers((a) => ({ ...a, acute: 'brak' }));
                goNext(5);
              }}
              accessibilityRole="button">
              <Text style={styles.secondaryCtaText}>Żadne z powyższych</Text>
            </Pressable>
          </View>
        );

      case 5: {
        const onHeavy = (key: HeavyKey) => {
          setAnswers((a) => ({ ...a, heavy: key }));
          goNext(6);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy czujesz się bardzo źle?</Text>
            {renderChoiceButton('Bardzo osłabiony', () => onHeavy('oslabiony'))}
            {renderChoiceButton('Wysoka gorączka i złe samopoczucie', () => onHeavy('goraczka_zle'))}
            {renderChoiceButton('Splątanie', () => onHeavy('splatanie'))}
            {renderChoiceButton('Bardzo szybki oddech', () => onHeavy('szybki_oddech'))}
            {renderChoiceButton('Nie', () => onHeavy('nie'))}
          </View>
        );
      }

      case 6: {
        const onDehydration = (key: DehydrationKey) => {
          setAnswers((a) => ({ ...a, dehydration: key }));
          goNext(7);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy masz problem z piciem lub oddawaniem moczu?</Text>
            {renderChoiceButton('Nie mogę pić', () => onDehydration('nie_pije'))}
            {renderChoiceButton('Wymiotuję intensywnie', () => onDehydration('wymioty'))}
            {renderChoiceButton('Nie oddaję moczu', () => onDehydration('brak_moczu'))}
            {renderChoiceButton('Brak problemu', () => onDehydration('brak'))}
          </View>
        );
      }

      case 7: {
        const onMental = (key: MentalKey) => {
          setAnswers((a) => ({ ...a, mental: key }));
          goNext(8);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy masz myśli o zrobieniu sobie krzywdy?</Text>
            {renderChoiceButton('Tak', () => onMental('tak'), { danger: true })}
            {renderChoiceButton('Nie', () => onMental('nie'))}
          </View>
        );
      }

      case 8: {
        const onType = (coughType: CoughType) => {
          setAnswers((a) => ({ ...a, coughType }));
          goNext(9);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Jaki masz kaszel?</Text>
            {renderChoiceButton('Suchy', () => onType('suchy'))}
            {renderChoiceButton('Mokry', () => onType('mokry'))}
            {renderChoiceButton('Nie wiem', () => onType('nie_wiem'))}
          </View>
        );
      }

      case 9: {
        const onDur = (duration: CoughDuration) => {
          setAnswers((a) => ({ ...a, duration }));
          goNext(10);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Od ilu dni kaszlesz?</Text>
            {renderChoiceButton('Mniej niż 1 dzień', () => onDur('lt1'))}
            {renderChoiceButton('1–3 dni', () => onDur('d1_3'))}
            {renderChoiceButton('4–7 dni', () => onDur('d4_7'))}
            {renderChoiceButton('Ponad tydzień', () => onDur('d7plus'))}
          </View>
        );
      }

      case 10: {
        const onFever = (fever: FeverLevel) => {
          setAnswers((a) => ({ ...a, fever }));
          goNext(11);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy masz gorączkę?</Text>
            {renderChoiceButton('Brak', () => onFever('brak'))}
            {renderChoiceButton('Poniżej 38 °C', () => onFever('lt38'))}
            {renderChoiceButton('38–39 °C', () => onFever('38_39'))}
            {renderChoiceButton('Powyżej 39 °C', () => onFever('gt39'))}
          </View>
        );
      }

      case 11: {
        const onBreath = (breath: BreathLevel) => {
          setAnswers((a) => ({ ...a, breath }));
          goNext(12);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy masz trudność w oddychaniu?</Text>
            {renderChoiceButton('Nie', () => onBreath('nie'))}
            {renderChoiceButton('Lekkie', () => onBreath('lekkie'))}
            {renderChoiceButton('Umiarkowane', () => onBreath('umiarkowane'))}
            {renderChoiceButton('Duże', () => onBreath('duze'))}
          </View>
        );
      }

      case 12: {
        const onSputum = (sputum: Sputum) => {
          setAnswers((a) => ({ ...a, sputum }));
          goNext(13);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy odkrztuszasz wydzielinę?</Text>
            {renderChoiceButton('Brak', () => onSputum('brak'))}
            {renderChoiceButton('Jasna', () => onSputum('jasna'))}
            {renderChoiceButton('Żółta lub zielona', () => onSputum('zolta_zielona'))}
            {renderChoiceButton('Z krwią', () => onSputum('krew'), { danger: true })}
          </View>
        );
      }

      case 13: {
        const row = (key: ExtraSymptomA, label: string) => (
          <Pressable
            key={key}
            onPress={() => toggleExtraA(key)}
            style={[styles.choiceBtn, answers.extraSymptoms.includes(key) && styles.choiceBtnSelected]}
            accessibilityRole="button">
            <Text
              style={[
                styles.choiceBtnText,
                answers.extraSymptoms.includes(key) && styles.choiceBtnTextSelected,
              ]}>
              {label}
            </Text>
          </Pressable>
        );
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy masz któryś z objawów dodatkowych?</Text>
            <Text style={styles.hint}>Zaznacz pasujące lub przejdź dalej.</Text>
            {row('bol_gardla', 'Ból gardła')}
            {row('katar', 'Katar')}
            {row('bol_zatok', 'Ból zatok')}
            {row('bol_klatki_oddech', 'Ból w klatce przy oddychaniu')}
            <Pressable style={styles.secondaryCta} onPress={() => goNext(14)} accessibilityRole="button">
              <Text style={styles.secondaryCtaText}>Pokaż kolejne</Text>
            </Pressable>
          </View>
        );
      }

      case 14: {
        const row = (key: ExtraSymptomB, label: string) => (
          <Pressable
            key={key}
            onPress={() => toggleExtraB(key)}
            style={[styles.choiceBtn, answers.extraSymptoms.includes(key) && styles.choiceBtnSelected]}
            accessibilityRole="button">
            <Text
              style={[
                styles.choiceBtnText,
                answers.extraSymptoms.includes(key) && styles.choiceBtnTextSelected,
              ]}>
              {label}
            </Text>
          </Pressable>
        );
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Dalsze objawy dodatkowe</Text>
            <Text style={styles.hint}>Opcjonalnie zaznacz lub przejdź dalej.</Text>
            {row('bole_miesni', 'Bóle mięśni')}
            {row('bol_uszu', 'Ból uszu')}
            <Pressable style={styles.secondaryCta} onPress={() => goNext(15)} accessibilityRole="button">
              <Text style={styles.secondaryCtaText}>Nie mam innych objawów</Text>
            </Pressable>
          </View>
        );
      }

      case 15: {
        const onBother = (bother: BotherLevel) => {
          setAnswers((a) => ({ ...a, bother }));
          goNext(16);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Jak bardzo objawy Ci przeszkadzają?</Text>
            {renderChoiceButton('Lekko', () => onBother('lekko'))}
            {renderChoiceButton('Umiarkowanie', () => onBother('umiarkowanie'))}
            {renderChoiceButton('Bardzo', () => onBother('bardzo'))}
          </View>
        );
      }

      case 16: {
        const onTrend = (trend: Trend) => {
          setAnswers((a) => ({ ...a, trend }));
          goNext(17);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Jak się zmieniają objawy?</Text>
            {renderChoiceButton('Poprawa', () => onTrend('poprawa'))}
            {renderChoiceButton('Bez zmian', () => onTrend('bez_zmian'))}
            {renderChoiceButton('Pogorszenie', () => onTrend('pogorszenie'))}
            {renderChoiceButton('Było lepiej i znów gorzej', () => onTrend('wax_wane'))}
          </View>
        );
      }

      case 17: {
        const toggleChronic = (key: ChronicKey) => {
          setAnswers((a) => {
            let next = [...a.chronic];
            if (key === 'brak') next = ['brak'];
            else {
              next = next.filter((x) => x !== 'brak');
              if (next.includes(key)) next = next.filter((x) => x !== key);
              else next.push(key);
            }
            return { ...a, chronic: next };
          });
        };
        const items: { key: ChronicKey; label: string }[] = [
          { key: 'pluca', label: 'Płuca' },
          { key: 'serce', label: 'Serce' },
          { key: 'cukrzyca', label: 'Cukrzyca' },
          { key: 'nowotwor', label: 'Nowotwór' },
          { key: 'leki_odpornosc', label: 'Leki obniżające odporność' },
          { key: 'brak', label: 'Brak' },
        ];
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy masz choroby przewlekłe?</Text>
            <Text style={styles.hint}>Wybierz wszystkie pasujące.</Text>
            {items.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => toggleChronic(key)}
                style={[styles.choiceBtn, answers.chronic.includes(key) && styles.choiceBtnSelected]}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.choiceBtnText,
                    answers.chronic.includes(key) && styles.choiceBtnTextSelected,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.primaryBtn}
              onPress={() => {
                const chronicFinal: ChronicKey[] =
                  answers.chronic.length > 0 ? [...answers.chronic] : ['brak'];
                const finalA: Answers = { ...answers, chronic: chronicFinal };
                setAnswers(finalA);
                finishFlow(finalA);
              }}
              accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Zakończ</Text>
            </Pressable>
          </View>
        );
      }

      default:
        return null;
    }
  };

  if (emergencyExit) {
    return (
      <KillSwitchScreen
        onRestart={() => {
          setEmergencyExit(false);
          setCurrentStep(0);
          setAnswers(emptyAnswers());
          setUrgencyFlags(0);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {currentStep !== RESULT_STEP ? renderTopBar() : null}
      {renderProgress()}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
}

const SHADOW = Platform.select({
  ios: {
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 2,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  block: {
    gap: 12,
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 28,
  },
  safetyLead: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
    marginTop: -4,
  },
  choiceBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  choiceBtnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  choiceBtnDisabled: {
    opacity: 0.45,
  },
  choiceBtnDanger: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerSoft,
  },
  choiceBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  choiceBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  choiceBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  choiceBtnTextSelected: {
    color: COLORS.primary,
  },
  choiceBtnTextLight: {
    color: COLORS.danger,
  },
  secondaryCta: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  secondaryCtaText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOW,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resultHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginTop: 8,
  },
  resultSub: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  ctaDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 20,
    marginTop: 8,
    ...SHADOW,
  },
  ctaDoctorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  selfcareCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selfcareCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selfcareCardText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  textLinkBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  textLink: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    marginTop: 8,
  },
  summaryBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});
