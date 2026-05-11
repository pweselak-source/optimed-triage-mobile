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
  | 'bol_plecow'
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
  | 'ciezki_uraz'
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

type SpineS2Key = 's2_1' | 's2_2' | 's2_3' | 's2_4' | 's2_5' | 's2_6' | 's2_7';
type SpineTraumaSev =
  | 'major_wypadek'
  | 'major_upadek'
  | 'major_uderzenie'
  | 'niewielki'
  | 'brak';
type SpineInfectionKey =
  | 'goraczka'
  | 'dreszcze'
  | 'zle'
  | 'znaczne_oslabienie'
  | 'immunosupresja';
type SpineDurationKey = 'lt48' | 'd2_7' | 'w1_6' | 'gt6' | 'przewlekly_nasilenie';
type SpineOnsetKey = 'schyl_dzwiganie' | 'wysilek' | 'stopniowo' | 'nagle' | 'uraz';
type SpineLocKey = 'plecy_dol' | 'posladki' | 'jedna_noga' | 'dwie_nogi' | 'plecy_brzuch';
type SpineRadKey = 'nie' | 'posladek' | 'udo' | 'ponizej_kolana' | 'stopa' | 'dwie_nogi';
type SpineNumbKey =
  | 'brak'
  | 'dretwienie_udo'
  | 'dretwienie_stopa'
  | 'oslabienie_nogi'
  | 'opadanie_stopy'
  | 'chodzenie_problem';
type SpinePainKey = 'lagodny' | 'umiarkowany' | 'silny' | 'bardzo_silny';
type SpineWalkKey = 'normalnie' | 'ograniczenie' | 'ledwo' | 'nie_moge';
type SpineCancerKey = 'nowotwor_hist' | 'utrata_masy' | 'nocne_poty' | 'nocny_bol';
type SpineMechanicKey =
  | 'schylanie'
  | 'ruch'
  | 'unoszenie'
  | 'siedzenie'
  | 'kaszel_kichanie'
  | 'calyczas'
  | 'w_nocy';

type SpineAnswers = {
  s2: SpineS2Key | null;
  neuroAlarm: 'tak' | 'nie' | null;
  traumaSev: SpineTraumaSev | null;
  traumaRisk: {
    over70: boolean;
    osteoporoza: boolean;
    sterydy: boolean;
    nowotwor: boolean;
  };
  infection: SpineInfectionKey[];
  vascularAbdominal: 'tak' | 'nie' | null;
  duration: SpineDurationKey | null;
  onset: SpineOnsetKey | null;
  localization: SpineLocKey | null;
  radiation: SpineRadKey | null;
  numb: SpineNumbKey | null;
  pain: SpinePainKey | null;
  walking: SpineWalkKey | null;
  trend: Trend | null;
  cancer: SpineCancerKey[];
  mechanic: SpineMechanicKey | null;
};

type OutcomeKey = 'callback_today' | 'three_days' | 'plan_later' | 'symptomatic';
type ResultVariant = 'urgent' | 'routine' | 'selfcare' | 'callback';

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
const ROUTER_INF_STEP = 51;
const FIRST_SPINE_STEP = 100;
const LAST_SPINE_STEP = 115;
const SPINE_STEP_COUNT = LAST_SPINE_STEP - FIRST_SPINE_STEP + 1;

const emptySpine = (): SpineAnswers => ({
  s2: null,
  neuroAlarm: null,
  traumaSev: null,
  traumaRisk: { over70: false, osteoporoza: false, sterydy: false, nowotwor: false },
  infection: [],
  vascularAbdominal: null,
  duration: null,
  onset: null,
  localization: null,
  radiation: null,
  numb: null,
  pain: null,
  walking: null,
  trend: null,
  cancer: [],
  mechanic: null,
});

function computeSpineUrgencyCount(s: SpineAnswers): number {
  let n = 0;
  if (s.neuroAlarm === 'tak') n++;
  if (s.traumaSev === 'niewielki' && Object.values(s.traumaRisk).some(Boolean)) n++;
  if (s.infection.length) n++;
  if (s.vascularAbdominal === 'tak') n++;
  if (s.duration === 'gt6' || s.duration === 'przewlekly_nasilenie') n++;
  if (s.localization === 'plecy_brzuch' || s.localization === 'dwie_nogi') n++;
  if (s.radiation === 'dwie_nogi' || s.radiation === 'ponizej_kolana' || s.radiation === 'stopa') n++;
  if (s.numb && s.numb !== 'brak') n++;
  if (s.pain === 'silny' || s.pain === 'bardzo_silny') n++;
  if (s.walking === 'ledwo' || s.walking === 'nie_moge') n++;
  if (s.trend === 'pogorszenie' || s.trend === 'wax_wane') n++;
  if (s.cancer.length) n++;
  if (s.mechanic === 'kaszel_kichanie' || s.mechanic === 'w_nocy' || s.mechanic === 'calyczas') n++;
  return n;
}

function computeSpineOutcome(s: SpineAnswers): OutcomeKey {
  const hasNeuro = s.neuroAlarm === 'tak';
  const severePain = s.pain === 'silny' || s.pain === 'bardzo_silny';
  const feverish =
    s.infection.includes('goraczka') ||
    s.infection.includes('dreszcze') ||
    s.infection.includes('zle') ||
    s.infection.includes('znaczne_oslabienie');
  const immuno = s.infection.includes('immunosupresja');
  const traumaCallback =
    s.traumaSev === 'niewielki' &&
    (s.traumaRisk.over70 || s.traumaRisk.osteoporoza || s.traumaRisk.sterydy || s.traumaRisk.nowotwor);
  const vascularCb = s.vascularAbdominal === 'tak';
  const numbCb = s.numb === 'opadanie_stopy' || s.numb === 'chodzenie_problem';
  const cancerCb =
    s.cancer.includes('nowotwor_hist') ||
    (s.cancer.includes('nocny_bol') && s.cancer.includes('utrata_masy'));
  const infectionUrgent = (feverish && severePain) || immuno;
  const walkUrgent = s.walking === 'nie_moge';
  const durationUrgent = s.duration === 'gt6' || s.duration === 'przewlekly_nasilenie';
  const trendUrgent = s.trend === 'pogorszenie' || s.trend === 'wax_wane';
  const locUrgent = s.localization === 'plecy_brzuch';
  const radLegsSevere =
    (s.radiation === 'dwie_nogi' || s.localization === 'dwie_nogi') && severePain;
  const onsetSuddenSevere = s.onset === 'nagle' && severePain;
  const mechanicUrgent = s.mechanic === 'kaszel_kichanie' || s.mechanic === 'w_nocy';

  if (vascularCb || traumaCallback || numbCb || cancerCb) return 'callback_today';
  if (hasNeuro) return 'three_days';
  if (infectionUrgent) return 'three_days';
  if (walkUrgent) return 'three_days';
  if (durationUrgent) return 'three_days';
  if (trendUrgent) return 'three_days';
  if (locUrgent) return 'three_days';
  if (onsetSuddenSevere) return 'three_days';
  if (mechanicUrgent) return 'three_days';
  if (radLegsSevere) return 'three_days';

  const safeForSelf =
    s.pain === 'lagodny' &&
    (s.walking === 'normalnie' || s.walking === 'ograniczenie') &&
    s.trend === 'poprawa' &&
    (s.duration === 'lt48' || s.duration === 'd2_7') &&
    !hasNeuro &&
    s.vascularAbdominal === 'nie' &&
    s.infection.length === 0 &&
    s.numb === 'brak' &&
    s.cancer.length === 0 &&
    s.mechanic !== 'w_nocy' &&
    s.mechanic !== 'calyczas';

  if (safeForSelf) return 'symptomatic';
  return 'plan_later';
}

function buildSpineDoctorSummary(s: SpineAnswers, urgencyCount: number): string {
  const parts: string[] = ['Pacjent – ścieżka ból pleców / kręgosłup.'];
  const s2Labels: Record<SpineS2Key, string> = {
    s2_1: 'Doprecyzowanie: ból dolnej części pleców po przeciążeniu/schylaniu',
    s2_2: 'Doprecyzowanie: ból promieniujący do nogi',
    s2_3: 'Doprecyzowanie: ból po urazie lub upadku',
    s2_4: 'Doprecyzowanie: przewlekły lub nawracający ból krzyża',
    s2_5: 'Doprecyzowanie: ból krzyża z gorączką lub bardzo złym samopoczuciem',
    s2_6: 'Doprecyzowanie: ból krzyża z problemem oddawania moczu lub drętwieniem',
    s2_7: 'Doprecyzowanie: nie wiem',
  };
  if (s.s2) parts.push(s2Labels[s.s2] + '.');
  if (s.neuroAlarm === 'tak') {
    parts.push(
      'Objawy alarmowe (neuro): pacjent zgłosił, że występuje co najmniej jeden z objawów z listy (Tak).',
    );
  } else if (s.neuroAlarm === 'nie') {
    parts.push('Objawy alarmowe (neuro): żaden z wymienionych objawów (Nie).');
  } else {
    parts.push('Objawy alarmowe (neuro): nie ustalono.');
  }
  if (s.traumaSev) {
    const tm: Record<SpineTraumaSev, string> = {
      major_wypadek: 'uraz: wypadek komunikacyjny',
      major_upadek: 'uraz: upadek z wysokości',
      major_uderzenie: 'uraz: silne uderzenie',
      niewielki: 'uraz: niewielki',
      brak: 'uraz: brak',
    };
    parts.push(tm[s.traumaSev] + '.');
  }
  const tr = s.traumaRisk;
  if (tr.over70 || tr.osteoporoza || tr.sterydy || tr.nowotwor) {
    parts.push(
      'Czynniki ryzyka przy urazie: ' +
        [
          tr.over70 && 'wiek >70',
          tr.osteoporoza && 'osteoporoza',
          tr.sterydy && 'sterydy',
          tr.nowotwor && 'nowotwór',
        ]
          .filter(Boolean)
          .join(', ') +
        '.',
    );
  }
  if (s.infection.length) {
    const im: Record<SpineInfectionKey, string> = {
      goraczka: 'gorączka',
      dreszcze: 'dreszcze',
      zle: 'bardzo złe samopoczucie',
      znaczne_oslabienie: 'znaczne osłabienie',
      immunosupresja: 'immunosupresja / chemioterapia',
    };
    parts.push('Stan ogólny / infekcja: ' + s.infection.map((k) => im[k]).join(', ') + '.');
  }
  parts.push(
    s.vascularAbdominal === 'tak'
      ? 'Ból nagły i bardzo silny lub z bólem brzucha: tak.'
      : s.vascularAbdominal === 'nie'
        ? 'Ból nagły i bardzo silny lub z bólem brzucha: nie.'
        : '',
  );
  if (s.duration) {
    const dm: Record<SpineDurationKey, string> = {
      lt48: 'Czas epizodu: <48 h',
      d2_7: 'Czas epizodu: 2–7 dni',
      w1_6: 'Czas epizodu: 1–6 tygodni',
      gt6: 'Czas epizodu: >6 tygodni',
      przewlekly_nasilenie: 'Przewlekły, obecnie nasilony',
    };
    parts.push(dm[s.duration] + '.');
  }
  if (s.onset) {
    const om: Record<SpineOnsetKey, string> = {
      schyl_dzwiganie: 'Początek: po schylaniu/dźwiganiu',
      wysilek: 'Początek: po wysiłku',
      stopniowo: 'Początek: stopniowo',
      nagle: 'Początek: nagle bez wyraźnej przyczyny',
      uraz: 'Początek: po urazie',
    };
    parts.push(om[s.onset] + '.');
  }
  if (s.localization) {
    const lm: Record<SpineLocKey, string> = {
      plecy_dol: 'Lokalizacja: dolna część pleców',
      posladki: 'Lokalizacja: pośladek',
      jedna_noga: 'Lokalizacja: jedna noga',
      dwie_nogi: 'Lokalizacja: obie nogi',
      plecy_brzuch: 'Lokalizacja: plecy i brzuch',
    };
    parts.push(lm[s.localization] + '.');
  }
  if (s.radiation) {
    const rm: Record<SpineRadKey, string> = {
      nie: 'Promieniowanie: brak',
      posladek: 'Promieniowanie: do pośladka',
      udo: 'Promieniowanie: do uda',
      ponizej_kolana: 'Promieniowanie: poniżej kolana',
      stopa: 'Promieniowanie: do stopy',
      dwie_nogi: 'Promieniowanie: do obu nóg',
    };
    parts.push(rm[s.radiation] + '.');
  }
  if (s.numb) {
    const nm: Record<SpineNumbKey, string> = {
      brak: 'Drętwienie/osłabienie: brak',
      dretwienie_udo: 'Drętwienie uda',
      dretwienie_stopa: 'Drętwienie stopy',
      oslabienie_nogi: 'Osłabienie nogi',
      opadanie_stopy: 'Opadanie stopy',
      chodzenie_problem: 'Problem z chodzeniem',
    };
    parts.push(nm[s.numb] + '.');
  }
  if (s.pain) {
    const pm: Record<SpinePainKey, string> = {
      lagodny: 'Nasilenie bólu: łagodny',
      umiarkowany: 'Nasilenie bólu: umiarkowany',
      silny: 'Nasilenie bólu: silny',
      bardzo_silny: 'Nasilenie bólu: bardzo silny',
    };
    parts.push(pm[s.pain] + '.');
  }
  if (s.walking) {
    const wm: Record<SpineWalkKey, string> = {
      normalnie: 'Chodzenie: normalnie',
      ograniczenie: 'Chodzenie: z ograniczeniem',
      ledwo: 'Chodzenie: ledwo',
      nie_moge: 'Chodzenie: nie mogę',
    };
    parts.push(wm[s.walking] + '.');
  }
  if (s.trend) {
    const trm: Record<NonNullable<Trend>, string> = {
      poprawa: 'Przebieg: poprawia się',
      bez_zmian: 'Przebieg: bez zmian',
      pogorszenie: 'Przebieg: pogarsza się',
      wax_wane: 'Przebieg: było lepiej i znów gorzej',
    };
    parts.push(trm[s.trend] + '.');
  }
  if (s.cancer.length) {
    const cm: Record<SpineCancerKey, string> = {
      nowotwor_hist: 'Nowotwór w przeszłości',
      utrata_masy: 'Utrata masy ciała',
      nocne_poty: 'Nocne poty',
      nocny_bol: 'Nocny ból',
    };
    parts.push('Czerwone flagi: ' + s.cancer.map((k) => cm[k]).join(', ') + '.');
  }
  if (s.mechanic) {
    const mm: Record<SpineMechanicKey, string> = {
      schylanie: 'Nasilenie: przy schylaniu',
      ruch: 'Nasilenie: przy ruchu',
      unoszenie: 'Nasilenie: przy podnoszeniu',
      siedzenie: 'Nasilenie: przy siedzeniu',
      kaszel_kichanie: 'Nasilenie: przy kaszlu/kichaniu',
      calyczas: 'Nasilenie: cały czas',
      w_nocy: 'Nasilenie: w nocy',
    };
    parts.push(mm[s.mechanic] + '.');
  }
  parts.push('Liczba flag pilności (plecy): ' + urgencyCount + '.');
  return parts.filter(Boolean).join(' ');
}

function buildDoctorSummary(a: Answers, urgencyCount: number): string {
  if (a.mainSymptom === 'bol_plecow' && a.spine) {
    return buildSpineDoctorSummary(a.spine, urgencyCount);
  }
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
  spine: SpineAnswers | null;
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
  spine: null,
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
  if (o === 'callback_today') return 'callback';
  if (o === 'three_days') return 'urgent';
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
  const [emergencyReturnStep, setEmergencyReturnStep] = useState<number>(3);
  const [urgencyFlags, setUrgencyFlags] = useState(0);
  const [doctorSummary, setDoctorSummary] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeKey | null>(null);

  const showProgressBar =
    !emergencyExit &&
    ((currentStep >= FIRST_COUGH_STEP && currentStep <= LAST_COUGH_STEP) ||
      (currentStep >= FIRST_SPINE_STEP && currentStep <= LAST_SPINE_STEP));

  const progressFraction = useMemo(() => {
    if (!showProgressBar) return 0;
    if (currentStep >= FIRST_SPINE_STEP && currentStep <= LAST_SPINE_STEP) {
      return (currentStep - FIRST_SPINE_STEP + 1) / SPINE_STEP_COUNT;
    }
    return (currentStep - FIRST_COUGH_STEP + 1) / COUGH_STEP_COUNT;
  }, [currentStep, showProgressBar]);

  const goNext = (next: number) => setCurrentStep(next);

  const openEmergency = (acuteKey: AcuteKey, returnTo: number) => {
    setAnswers((a) => ({ ...a, acute: acuteKey }));
    setEmergencyReturnStep(returnTo);
    setEmergencyExit(true);
  };

  const finalizeTriage = (finalAnswers: Answers) => {
    if (finalAnswers.mainSymptom === 'bol_plecow' && finalAnswers.spine) {
      const uc = computeSpineUrgencyCount(finalAnswers.spine);
      setUrgencyFlags(uc);
      setOutcome(computeSpineOutcome(finalAnswers.spine));
      setDoctorSummary(buildDoctorSummary(finalAnswers, uc));
    } else {
      const flags = computeUrgencyFromAnswers(finalAnswers);
      setUrgencyFlags(flags);
      const oc = computeOutcome(flags, finalAnswers.duration, finalAnswers.trend);
      setOutcome(oc);
      setDoctorSummary(buildDoctorSummary(finalAnswers, flags));
    }
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
    if (currentStep === ROUTER_INF_STEP) {
      setCurrentStep(1);
      return;
    }
    if (currentStep === 2 && answers.mainSymptom === 'kaszel') {
      setCurrentStep(ROUTER_INF_STEP);
      return;
    }
    if (currentStep === 2 && answers.mainSymptom === 'bol_plecow') {
      setCurrentStep(1);
      return;
    }
    if (currentStep === FIRST_SPINE_STEP) {
      setCurrentStep(7);
      return;
    }
    if (currentStep === 104 && answers.mainSymptom === 'bol_plecow') {
      if (answers.spine?.traumaSev === 'niewielki') setCurrentStep(103);
      else setCurrentStep(102);
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
    opts?: { disabled?: boolean; danger?: boolean; outlined?: boolean },
  ) => (
    <Pressable
      onPress={opts?.disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.choiceBtn,
        opts?.outlined && styles.choiceBtnOutlined,
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

  const toggleSpineTraumaRisk = (k: keyof SpineAnswers['traumaRisk']) => {
    setAnswers((a) => {
      const sp = { ...(a.spine ?? emptySpine()) };
      sp.traumaRisk = { ...sp.traumaRisk, [k]: !sp.traumaRisk[k] };
      return { ...a, spine: sp };
    });
  };

  const toggleSpineInfection = (key: SpineInfectionKey) => {
    setAnswers((a) => {
      const sp = { ...(a.spine ?? emptySpine()) };
      const i = sp.infection.indexOf(key);
      if (i >= 0) sp.infection = sp.infection.filter((x) => x !== key);
      else sp.infection = [...sp.infection, key];
      return { ...a, spine: sp };
    });
  };

  const toggleSpineCancer = (key: SpineCancerKey) => {
    setAnswers((a) => {
      const sp = { ...(a.spine ?? emptySpine()) };
      const i = sp.cancer.indexOf(key);
      if (i >= 0) sp.cancer = sp.cancer.filter((x) => x !== key);
      else sp.cancer = [...sp.cancer, key];
      return { ...a, spine: sp };
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

    if (variant === 'callback') {
      return (
        <View style={styles.block}>
          <Text style={styles.resultHeadline}>Klinika skontaktuje się z Tobą jeszcze dziś</Text>
          <Text style={styles.resultSub}>
            Na podstawie odpowiedzi zespół medyczny oddzwoni lub nawiąże kontakt w trybie pilnym —
            nie musisz teraz samodzielnie rezerwować terminu.
          </Text>
          <View style={styles.callbackCard}>
            <Ionicons name="call" size={28} color={COLORS.primary} style={{ alignSelf: 'center' }} />
            <Text style={styles.callbackCardText}>
              Upewnij się, że numer telefonu w profilu jest aktualny. W razie znacznego pogorszenia
              stanu skorzystaj z pomocy nagłej (112 / SOR).
            </Text>
          </View>
          {summaryBlock}
          <Pressable style={styles.primaryBtn} onPress={exitTriageHome} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>Zakończ zgłoszenie</Text>
          </Pressable>
          <Pressable style={styles.textLinkBtn} onPress={exitTriageHome}>
            <Text style={styles.textLink}>Wróć na stronę główną</Text>
          </Pressable>
        </View>
      );
    }

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
            <Text style={styles.question}>Co jest dziś głównym problemem?</Text>
            {renderChoiceButton('Infekcja / gorączka', () => goNext(ROUTER_INF_STEP))}
            {renderChoiceButton(
              'Ból pleców / krzyża',
              () => {
                setAnswers((a) => ({ ...a, mainSymptom: 'bol_plecow', spine: emptySpine() }));
                goNext(2);
              },
            )}
            {renderChoiceButton('Klatka piersiowa / duszność', () => {}, { disabled: true })}
            {renderChoiceButton('Ból brzucha', () => {}, { disabled: true })}
            {renderChoiceButton('Uraz', () => {}, { disabled: true })}
            {renderChoiceButton('Objawy neurologiczne', () => {}, { disabled: true })}
            {renderChoiceButton('Recepty i dokumenty', () => {}, { disabled: true })}
          </View>
        );

      case ROUTER_INF_STEP:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Infekcja / gorączka — co dokładnie?</Text>
            <Text style={styles.hint}>Wybierz objaw pasujący do Twojego stanu.</Text>
            {renderChoiceButton('Kaszel', () => {
              setAnswers((a) => ({ ...a, mainSymptom: 'kaszel', spine: null }));
              goNext(2);
            })}
            {renderChoiceButton('Gorączka', () => {}, { disabled: true })}
            {renderChoiceButton('Ból gardła', () => {}, { disabled: true })}
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
          goNext(answers.mainSymptom === 'bol_plecow' ? FIRST_SPINE_STEP : 8);
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
                finalizeTriage(finalA);
              }}
              accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Zakończ</Text>
            </Pressable>
          </View>
        );
      }

      case 100: {
        const pick = (k: SpineS2Key) => {
          setAnswers((a) => ({
            ...a,
            spine: { ...(a.spine ?? emptySpine()), s2: k },
          }));
          goNext(101);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Który opis najlepiej pasuje do Twojego problemu?</Text>
            {renderChoiceButton('Ból dolnej części pleców po przeciążeniu lub schylaniu.', () =>
              pick('s2_1'),
            )}
            {renderChoiceButton('Ból promieniujący do nogi.', () => pick('s2_2'))}
            {renderChoiceButton('Ból po urazie lub upadku.', () => pick('s2_3'))}
            {renderChoiceButton('Przewlekły lub nawracający ból krzyża.', () => pick('s2_4'))}
            {renderChoiceButton('Ból krzyża z gorączką lub bardzo złym samopoczuciem.', () =>
              pick('s2_5'),
            )}
            {renderChoiceButton('Ból krzyża z problemem oddawania moczu lub drętwieniem.', () =>
              pick('s2_6'),
            )}
            {renderChoiceButton('Nie wiem.', () => pick('s2_7'))}
          </View>
        );
      }

      case 101: {
        const neuroListLabels = [
          'Problem z oddaniem moczu',
          'Nowe nietrzymanie moczu lub stolca',
          'Drętwienie okolicy krocza lub pośladków',
          'Nagłe znaczne osłabienie nogi',
          'Problem z chodzeniem',
        ];
        const setNeuroAlarm = (v: 'tak' | 'nie') => {
          setAnswers((a) => ({
            ...a,
            spine: { ...(a.spine ?? emptySpine()), neuroAlarm: v },
          }));
          goNext(102);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy występuje którykolwiek z poniższych objawów?</Text>
            <Text style={styles.hint}>Przeczytaj listę — wybierz na dole Tak albo Nie.</Text>
            {neuroListLabels.map((label) => (
              <View key={label} style={styles.choiceBtn} pointerEvents="none">
                <Text style={styles.choiceBtnText}>{label}</Text>
              </View>
            ))}
            {renderChoiceButton('Tak', () => setNeuroAlarm('tak'), { outlined: true })}
            {renderChoiceButton('Nie', () => setNeuroAlarm('nie'), { outlined: true })}
          </View>
        );
      }

      case 102:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy ból pojawił się po poważnym urazie?</Text>
            {renderChoiceButton('Wypadek komunikacyjny', () =>
              openEmergency('ciezki_uraz', 102),
            )}
            {renderChoiceButton('Upadek z wysokości', () => openEmergency('ciezki_uraz', 102))}
            {renderChoiceButton('Silne uderzenie', () => openEmergency('ciezki_uraz', 102))}
            {renderChoiceButton('Niewielki uraz', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), traumaSev: 'niewielki' },
              }));
              goNext(103);
            })}
            {renderChoiceButton('Brak urazu', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), traumaSev: 'brak' },
              }));
              goNext(104);
            })}
          </View>
        );

      case 103: {
        const tr = answers.spine?.traumaRisk ?? emptySpine().traumaRisk;
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy dotyczy Cię któryś z poniższych czynników?</Text>
            <Text style={styles.hint}>Przy niewielkim urazie — wybierz wszystkie pasujące.</Text>
            {(
              [
                ['over70', 'Mam ukończone 70 lat'] as const,
                ['osteoporoza', 'Stwierdzona osteoporoza'] as const,
                ['sterydy', 'Przyjmuję sterydy długotrwale'] as const,
                ['nowotwor', 'Aktywny lub leczony nowotwór'] as const,
              ] as const
            ).map(([k, label]) => (
              <Pressable
                key={k}
                onPress={() => toggleSpineTraumaRisk(k)}
                style={[styles.choiceBtn, tr[k] && styles.choiceBtnSelected]}
                accessibilityRole="button">
                <Text style={[styles.choiceBtnText, tr[k] && styles.choiceBtnTextSelected]}>
                  {label}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.primaryBtn} onPress={() => goNext(104)} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Dalej</Text>
            </Pressable>
          </View>
        );
      }

      case 104: {
        const infRows: { key: SpineInfectionKey; label: string }[] = [
          { key: 'goraczka', label: 'Gorączka' },
          { key: 'dreszcze', label: 'Dreszcze' },
          { key: 'zle', label: 'Bardzo złe samopoczucie' },
          { key: 'znaczne_oslabienie', label: 'Znaczne osłabienie' },
          { key: 'immunosupresja', label: 'Immunosupresja / chemioterapia' },
        ];
        const si = answers.spine ?? emptySpine();
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy występuje któryś z objawów?</Text>
            {infRows.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => toggleSpineInfection(key)}
                style={[styles.choiceBtn, si.infection.includes(key) && styles.choiceBtnSelected]}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.choiceBtnText,
                    si.infection.includes(key) && styles.choiceBtnTextSelected,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.secondaryCta}
              onPress={() => {
                setAnswers((a) => ({
                  ...a,
                  spine: { ...(a.spine ?? emptySpine()), infection: [] },
                }));
                goNext(105);
              }}
              accessibilityRole="button">
              <Text style={styles.secondaryCtaText}>Brak</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => goNext(105)} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Dalej</Text>
            </Pressable>
          </View>
        );
      }

      case 105:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>
              Czy ból jest nagły i bardzo silny lub towarzyszy mu ból brzucha?
            </Text>
            {renderChoiceButton('Tak', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), vascularAbdominal: 'tak' },
              }));
              goNext(106);
            })}
            {renderChoiceButton('Nie', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), vascularAbdominal: 'nie' },
              }));
              goNext(106);
            })}
          </View>
        );

      case 106:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Jak długo trwa obecny epizod bólu?</Text>
            {renderChoiceButton('Krócej niż 48 godzin', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), duration: 'lt48' },
              }));
              goNext(107);
            })}
            {renderChoiceButton('2–7 dni', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), duration: 'd2_7' },
              }));
              goNext(107);
            })}
            {renderChoiceButton('1–6 tygodni', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), duration: 'w1_6' },
              }));
              goNext(107);
            })}
            {renderChoiceButton('Ponad 6 tygodni', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), duration: 'gt6' },
              }));
              goNext(107);
            })}
            {renderChoiceButton('Przewlekły, ale teraz się nasilił', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), duration: 'przewlekly_nasilenie' },
              }));
              goNext(107);
            })}
          </View>
        );

      case 107:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Jak zaczął się ból?</Text>
            {renderChoiceButton('Po schylaniu / dźwiganiu', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), onset: 'schyl_dzwiganie' },
              }));
              goNext(108);
            })}
            {renderChoiceButton('Po wysiłku', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), onset: 'wysilek' },
              }));
              goNext(108);
            })}
            {renderChoiceButton('Stopniowo', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), onset: 'stopniowo' },
              }));
              goNext(108);
            })}
            {renderChoiceButton('Nagle, bez wyraźnej przyczyny', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), onset: 'nagle' },
              }));
              goNext(108);
            })}
            {renderChoiceButton('Po urazie', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), onset: 'uraz' },
              }));
              goNext(108);
            })}
          </View>
        );

      case 108:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Gdzie boli najbardziej?</Text>
            {renderChoiceButton('Dolna część pleców', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), localization: 'plecy_dol' },
              }));
              goNext(109);
            })}
            {renderChoiceButton('Pośladek', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), localization: 'posladki' },
              }));
              goNext(109);
            })}
            {renderChoiceButton('Jedna noga', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), localization: 'jedna_noga' },
              }));
              goNext(109);
            })}
            {renderChoiceButton('Obie nogi', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), localization: 'dwie_nogi' },
              }));
              goNext(109);
            })}
            {renderChoiceButton('Plecy i brzuch', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), localization: 'plecy_brzuch' },
              }));
              goNext(109);
            })}
          </View>
        );

      case 109:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy ból promieniuje?</Text>
            {renderChoiceButton('Nie', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), radiation: 'nie' },
              }));
              goNext(110);
            })}
            {renderChoiceButton('Do pośladka', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), radiation: 'posladek' },
              }));
              goNext(110);
            })}
            {renderChoiceButton('Do uda', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), radiation: 'udo' },
              }));
              goNext(110);
            })}
            {renderChoiceButton('Poniżej kolana', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), radiation: 'ponizej_kolana' },
              }));
              goNext(110);
            })}
            {renderChoiceButton('Do stopy', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), radiation: 'stopa' },
              }));
              goNext(110);
            })}
            {renderChoiceButton('Do obu nóg', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), radiation: 'dwie_nogi' },
              }));
              goNext(110);
            })}
          </View>
        );

      case 110:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy występuje drętwienie lub osłabienie?</Text>
            {renderChoiceButton('Brak', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), numb: 'brak' },
              }));
              goNext(111);
            })}
            {renderChoiceButton('Drętwienie uda', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), numb: 'dretwienie_udo' },
              }));
              goNext(111);
            })}
            {renderChoiceButton('Drętwienie stopy', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), numb: 'dretwienie_stopa' },
              }));
              goNext(111);
            })}
            {renderChoiceButton('Osłabienie nogi', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), numb: 'oslabienie_nogi' },
              }));
              goNext(111);
            })}
            {renderChoiceButton('Opadanie stopy', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), numb: 'opadanie_stopy' },
              }));
              goNext(111);
            })}
            {renderChoiceButton('Problem z chodzeniem', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), numb: 'chodzenie_problem' },
              }));
              goNext(111);
            })}
          </View>
        );

      case 111:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Jak silny jest ból?</Text>
            {renderChoiceButton('Łagodny', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), pain: 'lagodny' },
              }));
              goNext(112);
            })}
            {renderChoiceButton('Umiarkowany', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), pain: 'umiarkowany' },
              }));
              goNext(112);
            })}
            {renderChoiceButton('Silny', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), pain: 'silny' },
              }));
              goNext(112);
            })}
            {renderChoiceButton('Bardzo silny', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), pain: 'bardzo_silny' },
              }));
              goNext(112);
            })}
          </View>
        );

      case 112:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy możesz chodzić?</Text>
            {renderChoiceButton('Normalnie', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), walking: 'normalnie' },
              }));
              goNext(113);
            })}
            {renderChoiceButton('Z ograniczeniem', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), walking: 'ograniczenie' },
              }));
              goNext(113);
            })}
            {renderChoiceButton('Ledwo', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), walking: 'ledwo' },
              }));
              goNext(113);
            })}
            {renderChoiceButton('Nie mogę', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), walking: 'nie_moge' },
              }));
              goNext(113);
            })}
          </View>
        );

      case 113:
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Jak zmienia się ból?</Text>
            {renderChoiceButton('Poprawia się', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), trend: 'poprawa' },
              }));
              goNext(114);
            })}
            {renderChoiceButton('Bez zmian', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), trend: 'bez_zmian' },
              }));
              goNext(114);
            })}
            {renderChoiceButton('Pogarsza się', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), trend: 'pogorszenie' },
              }));
              goNext(114);
            })}
            {renderChoiceButton('Było lepiej i znów gorzej', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), trend: 'wax_wane' },
              }));
              goNext(114);
            })}
            {renderChoiceButton('Podobny do wcześniejszych epizodów', () => {
              setAnswers((a) => ({
                ...a,
                spine: { ...(a.spine ?? emptySpine()), trend: 'bez_zmian' },
              }));
              goNext(114);
            })}
          </View>
        );

      case 114: {
        const caRows: { key: SpineCancerKey; label: string }[] = [
          { key: 'nowotwor_hist', label: 'Nowotwór w przeszłości' },
          { key: 'utrata_masy', label: 'Utrata masy ciała' },
          { key: 'nocne_poty', label: 'Nocne poty' },
          { key: 'nocny_bol', label: 'Nocny ból' },
        ];
        const sc = answers.spine ?? emptySpine();
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Czy dotyczy Cię coś z poniższych?</Text>
            {caRows.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => toggleSpineCancer(key)}
                style={[styles.choiceBtn, sc.cancer.includes(key) && styles.choiceBtnSelected]}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.choiceBtnText,
                    sc.cancer.includes(key) && styles.choiceBtnTextSelected,
                  ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.secondaryCta}
              onPress={() => {
                setAnswers((a) => ({
                  ...a,
                  spine: { ...(a.spine ?? emptySpine()), cancer: [] },
                }));
                goNext(115);
              }}
              accessibilityRole="button">
              <Text style={styles.secondaryCtaText}>Brak</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => goNext(115)} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Dalej</Text>
            </Pressable>
          </View>
        );
      }

      case 115: {
        const finishMechanic = (m: SpineMechanicKey) => {
          const sp = { ...(answers.spine ?? emptySpine()), mechanic: m };
          const finalA: Answers = { ...answers, spine: sp };
          setAnswers(finalA);
          finalizeTriage(finalA);
        };
        return (
          <View style={styles.block}>
            <Text style={styles.question}>Kiedy ból się nasila?</Text>
            {renderChoiceButton('Przy schylaniu', () => finishMechanic('schylanie'))}
            {renderChoiceButton('Przy ruchu', () => finishMechanic('ruch'))}
            {renderChoiceButton('Przy podnoszeniu', () => finishMechanic('unoszenie'))}
            {renderChoiceButton('Przy siedzeniu', () => finishMechanic('siedzenie'))}
            {renderChoiceButton('Przy kaszlu lub kichaniu', () => finishMechanic('kaszel_kichanie'))}
            {renderChoiceButton('Cały czas', () => finishMechanic('calyczas'))}
            {renderChoiceButton('W nocy', () => finishMechanic('w_nocy'))}
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
  choiceBtnOutlined: {
    borderColor: COLORS.primary,
    borderWidth: 2,
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
  callbackCard: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 12,
  },
  callbackCardText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    textAlign: 'center',
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
