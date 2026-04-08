import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'aktywne' | 'przekazane' | 'bledne';

type PackageStatus = 'aktywne' | 'przekazane';

type Package = {
  id: string;
  seqNr: string;
  registeredAt: string;
  transferredAt?: string;
  patientName: string;
  pesel: string;
  fileName: string;
  aiFileName: string;
  documentType: string;
  status: PackageStatus | 'bledne';
  errorMessage?: string;
};

type UrgentCall = {
  id: string;
  patientName: string;
  pesel: string;
  phone: string;
  registeredAt: string;
  lastReactionAt?: string;
  status: 'pending' | 'done' | 'danger';
  handledBy?: string;
  history?: {
    action: string;
    by: string;
    at: string;
  }[];
  result?:
    | 'porada'
    | 'wizyta'
    | 'e_recepta'
    | 'przekazano_informacje'
    | 'pacjent_zrezygnowal'
    | 'przekierowano_inna_placowka'
    | 'brak_kontaktu'
    | 'wezwanie_pogotowia';
};

const COLORS = {
  bg: '#F3F4F6',
  sidebarBg: '#FFFFFF',
  sidebarAccent: '#3B82F6',
  textOnSidebar: '#111827',
  textOnSidebarMuted: '#6B7280',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  success: '#16A34A',
  chipGrayBg: '#F3F4F6',
  chipGrayText: '#4B5563',
  chipBlueBg: '#E0F2FE',
  chipBlueText: '#1D4ED8',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  danger: '#DC2626',
  shadow: '#9CA3AF',
};

const formatNow = (): string => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
};

type UrgentTab = 'oczekujace' | 'zagrozenie' | 'wykonane';

type TriageSubTab = 'zgloszenia' | 'ankieta' | 'statystyki';

type MockTriageRow = {
  id: string;
  patient: string;
  nip: string;
  symptom: string;
  result: string;
  timeLabel: string;
  /** Zgodne z licznikiem z aplikacji mobilnej (ankieta kaszel) */
  urgencyFlags: number;
  /** Tekst jak `buildDoctorSummary` w app/triage.tsx */
  doctorSummary: string;
};

type MockSurveyQuestion = {
  id: string;
  question: string;
  category: string;
  weight: string;
  action: string;
};

type UrgentAction = 'confirm' | 'danger' | 'history';

const getUrgentTooltipText = (variant: UrgentAction): string => {
  switch (variant) {
    case 'confirm':
      return 'Potwierdź wykonanie zgłoszenia i bezpieczeństwo pacjenta';
    case 'danger':
      return 'Zgłoś zagrożenie';
    default:
      return '';
  }
};

const UrgentActionButton: React.FC<{
  variant: UrgentAction;
  onPress: () => void;
}> = ({ variant, onPress }) => {
  const iconScale = useRef(new Animated.Value(1)).current;

  const baseStyle = styles.urgentIconButton;
  const variantStyle =
    variant === 'confirm'
      ? null
      : variant === 'danger'
      ? styles.urgentIconButtonDanger
      : styles.urgentIconButtonHistory;

  const circleStyle =
    variant === 'confirm'
      ? styles.urgentIconCircle
      : variant === 'danger'
      ? styles.urgentIconCircleDanger
      : styles.urgentIconCircleHistory;

  const iconName =
    variant === 'confirm' ? 'checkmark' : variant === 'danger' ? 'alert' : 'time-outline';

  const iconColor = variant === 'history' ? '#FFFBEB' : '#ECFDF3';

  const handleHoverIn = () => {
    Animated.timing(iconScale, {
      toValue: 1.3,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = () => {
    Animated.timing(iconScale, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.urgentActionWrapper}>
      <Pressable
        onPress={onPress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        style={({ pressed }) => [
          baseStyle,
          variantStyle,
          pressed && styles.urgentIconButtonPressed,
        ]}>
        <Animated.View style={[circleStyle, { transform: [{ scale: iconScale }] }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const CallMockButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handleHoverIn = () => {
    Animated.timing(scale, {
      toValue: 1.66, // powiększenie o około 2/3
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  const handleHoverOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={styles.urgentCallIconButton}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name="call" size={20} color="#2563EB" />
      </Animated.View>
    </Pressable>
  );
};

const mockTriageList: MockTriageRow[] = [
  {
    id: 't1',
    patient: 'Jan Kowalski',
    nip: '1112223334',
    symptom: 'Kaszel (5 dni)',
    result: 'Wizyta do 3 dni',
    timeLabel: '10 min temu',
    urgencyFlags: 1,
    doctorSummary:
      'Pacjent – ścieżka kaszel. Kaszel mokry. Kaszel 4–7 dni. Gorączka poniżej 38 °C. Bez trudności w oddychaniu. Odkrztuszana wydzielina jasna. Objawy dodatkowe: katar. Utrudnienia umiarkowane. Trend: bez zmian. Bez zadeklarowanych chorób przewlekłych z listy. Liczba flag pilności z ankiety: 1.',
  },
  {
    id: 't2',
    patient: 'Anna Nowak',
    nip: '9998887776',
    symptom: 'Ból gardła',
    result: 'Leczenie objawowe',
    timeLabel: '1 godz. temu',
    urgencyFlags: 0,
    doctorSummary:
      'Pacjent – ścieżka kaszel. Kaszel suchy. Kaszel 1–3 dni. Bez gorączki. Bez trudności w oddychaniu. Bez odkrztuszania. Objawy dodatkowe: ból gardła. Utrudnienia lekkie. Trend: poprawa. Bez zadeklarowanych chorób przewlekłych z listy. Liczba flag pilności z ankiety: 0.',
  },
  {
    id: 't3',
    patient: 'Michał Wiśniewski',
    nip: '5554443332',
    symptom: 'Katar i stan podgorączkowy',
    result: 'Leczenie objawowe',
    timeLabel: '2 godz. temu',
    urgencyFlags: 0,
    doctorSummary:
      'Pacjent – ścieżka kaszel. Kaszel suchy. Kaszel do 1 dnia. Gorączka poniżej 38 °C. Lekka trudność w oddychaniu. Bez odkrztuszania. Objawy dodatkowe: katar. Utrudnienia lekkie. Trend: bez zmian. Bez zadeklarowanych chorób przewlekłych z listy. Liczba flag pilności z ankiety: 0.',
  },
];

const mockSurveyQuestions: MockSurveyQuestion[] = [
  {
    id: 'q1',
    question: 'Silna duszność / Ból w klatce',
    category: 'Stan nagły',
    weight: 'Krytyczna',
    action: 'Przerwanie ankiety, zalecenie 112/999',
  },
  {
    id: 'q2',
    question: 'Kaszel z krwią',
    category: 'Wydzielina',
    weight: 'Wysoka (+2 pkt pilności)',
    action: 'Oznacz jako PILNE',
  },
  {
    id: 'q3',
    question: 'Gorączka powyżej 39°C',
    category: 'Temperatura',
    weight: 'Wysoka (+1 pkt pilności)',
    action: 'Zwiększenie priorytetu',
  },
  {
    id: 'q4',
    question: 'Kaszel poniżej 3 dni, stan dobry',
    category: 'Czas trwania',
    weight: 'Niska (0 pkt)',
    action: 'Leczenie objawowe',
  },
];

/** Paleta wykresów · spójna z modułem recepcji */
const TRIAGE_CHART = {
  indigo: '#6366F1',
  violet: '#8B5CF6',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  rose: '#F43F5E',
  emerald: '#10B981',
  slate: '#94A3B8',
};

type TriageStatTileDef = {
  id: string;
  value: string;
  label: string;
  hint?: string;
  tone?: 'default' | 'accent' | 'muted' | 'warn' | 'violet' | 'cyan';
};

/** 3 pierwsze kafle + 15 kolejnych KPI z logiki triage (mock) */
const triageStatTiles: TriageStatTileDef[] = [
  { id: 's1', value: '24', label: 'Ankiety dziś', hint: '+3 vs średnia tygodnia', tone: 'default' },
  { id: 's2', value: '3', label: 'Skierowani na pilnie', hint: 'Wymagają kontaktu dziś', tone: 'accent' },
  { id: 's3', value: '12', label: 'Odesłani do samoopieki', tone: 'muted' },
  { id: 's4', value: '168', label: 'Ankiety w tym tygodniu', hint: 'Pn–Nd', tone: 'violet' },
  { id: 's5', value: '4,2 min', label: 'Mediana czasu wywiadu', hint: 'Od startu do wyniku', tone: 'default' },
  { id: 's6', value: '94%', label: 'Ankiety ukończone w całości', tone: 'muted' },
  { id: 's7', value: '2', label: 'Przerwania (red flag)', hint: 'Stan nagły w pytaniu', tone: 'warn' },
  { id: 's8', value: '0,41', label: 'Średnia liczba flag pilności', hint: 'Z wag ankiety', tone: 'default' },
  { id: 's9', value: '1', label: 'Rekomendacja 112 / SOR', hint: 'W ostatnich 7 dniach', tone: 'warn' },
  { id: 's10', value: '61%', label: 'Ścieżka „kaszel”', hint: 'Udział w zgłoszeniach', tone: 'cyan' },
  { id: 's11', value: '19%', label: 'Ścieżka „gorączka”', tone: 'cyan' },
  { id: 's12', value: '20%', label: 'Pozostałe ścieżki', tone: 'default' },
  { id: 's13', value: '31', label: 'Szczyt 9:00–11:00', hint: 'Ankiety w oknie', tone: 'violet' },
  { id: 's14', value: '11', label: 'Noc 22:00–6:00', hint: 'Poza godzinami', tone: 'default' },
  { id: 's15', value: '5', label: 'Ponowne zgłoszenie ≤72 h', hint: 'Ten sam NIP', tone: 'accent' },
  { id: 's16', value: '36%', label: 'Z zaznaczoną chorobą przewlekłą', tone: 'muted' },
  { id: 's17', value: '12', label: 'E-recepta w rekomendacji', tone: 'cyan' },
  { id: 's18', value: '8', label: 'Teleporada / video', hint: 'Dzisiaj', tone: 'accent' },
];

const triageWeeklyVolume = [
  { key: 'pn', label: 'Pn', count: 18, color: TRIAGE_CHART.indigo },
  { key: 'wt', label: 'Wt', count: 22, color: TRIAGE_CHART.indigo },
  { key: 'sr', label: 'Śr', count: 26, color: TRIAGE_CHART.violet },
  { key: 'cz', label: 'Cz', count: 31, color: TRIAGE_CHART.violet },
  { key: 'pt', label: 'Pt', count: 28, color: TRIAGE_CHART.cyan },
  { key: 'so', label: 'So', count: 14, color: TRIAGE_CHART.slate },
  { key: 'nd', label: 'Nd', count: 11, color: TRIAGE_CHART.slate },
];

const triageUrgencyDistribution = [
  { label: '0 flag pilności', pct: 72, color: TRIAGE_CHART.emerald },
  { label: '1 flaga', pct: 22, color: TRIAGE_CHART.amber },
  { label: '2+ flagi', pct: 6, color: TRIAGE_CHART.rose },
];

const triageOutcomeMix = [
  { label: 'Wizyta / kontakt dziś', flex: 38, color: TRIAGE_CHART.indigo },
  { label: 'Leczenie objawowe', flex: 34, color: TRIAGE_CHART.cyan },
  { label: 'Teleporada', flex: 15, color: TRIAGE_CHART.violet },
  { label: 'Inne / przekierowanie', flex: 13, color: TRIAGE_CHART.slate },
];

const triageTopSymptoms = [
  { label: 'Kaszel', pct: 44, color: TRIAGE_CHART.indigo },
  { label: 'Gorączka / stan podgorączkowy', pct: 26, color: TRIAGE_CHART.rose },
  { label: 'Ból gardła', pct: 14, color: TRIAGE_CHART.violet },
  { label: 'Katar', pct: 10, color: TRIAGE_CHART.cyan },
  { label: 'Duszność lekka', pct: 6, color: TRIAGE_CHART.amber },
];

const triageHourBlocks = [
  { label: '6–9', count: 12 },
  { label: '9–12', count: 31 },
  { label: '12–15', count: 24 },
  { label: '15–18', count: 19 },
  { label: '18–22', count: 14 },
  { label: '22–6', count: 11 },
];

const TriageWeeklyBarChart: React.FC = () => {
  const maxC = Math.max(...triageWeeklyVolume.map((d) => d.count), 1);
  const barMaxH = 112;
  return (
    <View style={styles.triageChartCard}>
      <View style={styles.triageChartCardHeader}>
        <Ionicons name="bar-chart-outline" size={22} color={TRIAGE_CHART.indigo} />
        <View style={styles.triageChartCardHeaderText}>
          <Text style={styles.triageChartTitle}>Wolumen ankiet</Text>
          <Text style={styles.triageChartSubtitle}>Ostatnie 7 dni · sztuki dziennie (mock)</Text>
        </View>
      </View>
      <View style={styles.triageVChartRow}>
        {triageWeeklyVolume.map((d) => {
          const h = Math.max(10, (d.count / maxC) * barMaxH);
          return (
            <View key={d.key} style={styles.triageVBarWrap}>
              <View style={styles.triageVBarTrack}>
                <View style={[styles.triageVBarFill, { height: h, backgroundColor: d.color }]} />
              </View>
              <Text style={styles.triageVBarLabel}>{d.label}</Text>
              <Text style={styles.triageVBarValue}>{d.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const TriageUrgencyBarsChart: React.FC = () => (
  <View style={styles.triageChartCard}>
    <View style={styles.triageChartCardHeader}>
      <Ionicons name="flag-outline" size={22} color={TRIAGE_CHART.amber} />
      <View style={styles.triageChartCardHeaderText}>
        <Text style={styles.triageChartTitle}>Rozkład pilności (flagi)</Text>
        <Text style={styles.triageChartSubtitle}>Z agregacji punktów z ankiety mobilnej</Text>
      </View>
    </View>
    <View style={styles.triageHBarGroup}>
      {triageUrgencyDistribution.map((row) => (
        <View key={row.label} style={styles.triageHBarRow}>
          <Text style={styles.triageHBarLabel}>{row.label}</Text>
          <View style={styles.triageHBarTrack}>
            <View style={[styles.triageHBarFill, { width: `${row.pct}%`, backgroundColor: row.color }]} />
          </View>
          <Text style={styles.triageHBarPct}>{row.pct}%</Text>
        </View>
      ))}
    </View>
  </View>
);

const TriageOutcomeStripChart: React.FC = () => (
  <View style={styles.triageChartCard}>
    <View style={styles.triageChartCardHeader}>
      <Ionicons name="git-merge-outline" size={22} color={TRIAGE_CHART.cyan} />
      <View style={styles.triageChartCardHeaderText}>
        <Text style={styles.triageChartTitle}>Miks wyników końcowych</Text>
        <Text style={styles.triageChartSubtitle}>Rekomendacja pokazywana pacjentowi</Text>
      </View>
    </View>
    <View style={styles.triageStripWrap}>
      <View style={styles.triageStripRow}>
        {triageOutcomeMix.map((seg) => (
          <View
            key={seg.label}
            style={[styles.triageStripSeg, { flex: seg.flex, backgroundColor: seg.color }]}
          />
        ))}
      </View>
    </View>
    <View style={styles.triageLegendCol}>
      {triageOutcomeMix.map((seg) => (
        <View key={seg.label} style={styles.triageLegendRow}>
          <View style={[styles.triageLegendDot, { backgroundColor: seg.color }]} />
          <Text style={styles.triageLegendText}>
            {seg.label}
            <Text style={styles.triageLegendPct}> · {seg.flex}%</Text>
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const TriageSymptomsRankChart: React.FC = () => (
  <View style={styles.triageChartCard}>
    <View style={styles.triageChartCardHeader}>
      <Ionicons name="medkit-outline" size={22} color={TRIAGE_CHART.rose} />
      <View style={styles.triageChartCardHeaderText}>
        <Text style={styles.triageChartTitle}>Top objawy główne</Text>
        <Text style={styles.triageChartSubtitle}>Pierwszy wybór z listy w ankiecie</Text>
      </View>
    </View>
    <View style={styles.triageHBarGroup}>
      {triageTopSymptoms.map((row) => (
        <View key={row.label} style={styles.triageHBarRow}>
          <Text style={styles.triageHBarLabel} numberOfLines={1}>
            {row.label}
          </Text>
          <View style={styles.triageHBarTrack}>
            <View style={[styles.triageHBarFill, { width: `${row.pct}%`, backgroundColor: row.color }]} />
          </View>
          <Text style={styles.triageHBarPct}>{row.pct}%</Text>
        </View>
      ))}
    </View>
  </View>
);

const TriageHourlyFlowChart: React.FC = () => {
  const maxC = Math.max(...triageHourBlocks.map((b) => b.count), 1);
  const barMaxH = 96;
  return (
    <View style={styles.triageChartCard}>
      <View style={styles.triageChartCardHeader}>
        <Ionicons name="time-outline" size={22} color={TRIAGE_CHART.violet} />
        <View style={styles.triageChartCardHeaderText}>
          <Text style={styles.triageChartTitle}>Ruch wg przedziałów godzinowych</Text>
          <Text style={styles.triageChartSubtitle}>Kiedy pacjenci najczęściej kończą ankietę</Text>
        </View>
      </View>
      <View style={styles.triageHourChartRow}>
        {triageHourBlocks.map((b) => {
          const h = Math.max(8, (b.count / maxC) * barMaxH);
          return (
            <View key={b.label} style={styles.triageHourBarWrap}>
              <View style={styles.triageHourBarTrack}>
                <View
                  style={[
                    styles.triageHourBarFill,
                    { height: h, backgroundColor: TRIAGE_CHART.violet },
                  ]}
                />
              </View>
              <Text style={styles.triageHourBarLabel}>{b.label}</Text>
              <Text style={styles.triageHourBarCount}>{b.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const TriageStatKpiTile: React.FC<{ tile: TriageStatTileDef }> = ({ tile }) => {
  const valueStyle = [
    styles.triageStatValue,
    tile.tone === 'accent' && styles.triageStatValueAccent,
    tile.tone === 'muted' && styles.triageStatValueMuted,
    tile.tone === 'warn' && styles.triageStatValueWarn,
    tile.tone === 'violet' && styles.triageStatValueViolet,
    tile.tone === 'cyan' && styles.triageStatValueCyan,
  ];
  return (
    <View style={styles.triageStatCard}>
      <Text style={valueStyle}>{tile.value}</Text>
      <Text style={styles.triageStatLabel}>{tile.label}</Text>
      {tile.hint ? <Text style={styles.triageStatHint}>{tile.hint}</Text> : null}
    </View>
  );
};

const TriageDetailButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const handleHoverIn = () => {
    Animated.timing(scale, {
      toValue: 1.08,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };
  const handleHoverOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      style={styles.triageDetailBtnGlow}
      accessibilityLabel="Szczegóły ankiety"
      accessibilityRole="button">
      <Animated.View style={[styles.triageDetailBtnCircle, { transform: [{ scale }] }]}>
        <Ionicons name="eye" size={18} color="#F0F9FF" />
      </Animated.View>
    </Pressable>
  );
};

export default function ReceptionScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('aktywne');
  const [activeSidebarItem, setActiveSidebarItem] = useState<'import' | 'urgent' | 'triage'>(
    'import',
  );
  const [activeMenu, setActiveMenu] = useState<'import' | 'nagle' | 'triage'>('import');
  const [triageTab, setTriageTab] = useState<TriageSubTab>('zgloszenia');
  const [triageDetailRow, setTriageDetailRow] = useState<MockTriageRow | null>(null);
  const importScale = useRef(new Animated.Value(1)).current;
  const urgentScale = useRef(new Animated.Value(1)).current;
  const triageScale = useRef(new Animated.Value(1)).current;
  const urgentBorderAnim = useRef(new Animated.Value(0)).current;
  const [activeUrgentTab, setActiveUrgentTab] = useState<UrgentTab>('oczekujace');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [packages, setPackages] = useState<Package[]>([
    {
      id: '1',
      seqNr: '001/03/26',
      registeredAt: '12.03.2026 09:30',
      patientName: 'Jan Kowalski',
      pesel: '82031409876',
      fileName: 'wypis_szpitalny_kowalski.pdf',
      aiFileName: 'notatka_ai_kowalski.pdf',
      documentType: 'Wypis szpitalny',
      transferredAt: undefined,
      status: 'aktywne',
    },
    {
      id: '2',
      seqNr: '002/03/26',
      registeredAt: '12.03.2026 09:45',
      patientName: 'Marek Zając',
      pesel: '75022100123',
      fileName: 'skierowanie.pdf',
      aiFileName: 'notatka_ai_zajac.pdf',
      documentType: 'Skierowanie',
      transferredAt: undefined,
      status: 'bledne',
      errorMessage: 'Brak odpowiedzi od API Optimed',
    },
  ]);

  const [urgentCalls, setUrgentCalls] = useState<UrgentCall[]>([
    {
      id: '1',
      patientName: 'Piotr Kaczmarek',
      pesel: '78051212345',
      phone: '+48 500 600 700',
      registeredAt: '11.03.2026 08:05',
      status: 'pending',
    },
    {
      id: '2',
      patientName: 'Marta Lis',
      pesel: '92110598765',
      phone: '+48 601 202 303',
      registeredAt: '11.03.2026 08:42',
      status: 'pending',
    },
    {
      id: '3',
      patientName: 'Tomasz Wojciechowski',
      pesel: '64031745678',
      phone: '+48 602 111 222',
      registeredAt: '11.03.2026 09:15',
      status: 'pending',
    },
    {
      id: '4',
      patientName: 'Anna Borkowska',
      pesel: '90072811223',
      phone: '+48 603 333 444',
      registeredAt: '11.03.2026 09:37',
      status: 'pending',
    },
    {
      id: '5',
      patientName: 'Krzysztof Malinowski',
      pesel: '70010199887',
      phone: '+48 604 555 666',
      registeredAt: '11.03.2026 10:02',
      status: 'pending',
    },
  ]);

  const [confirmingCall, setConfirmingCall] = useState<UrgentCall | null>(null);
  const [dangerCall, setDangerCall] = useState<UrgentCall | null>(null);
  const [callingCall, setCallingCall] = useState<UrgentCall | null>(null);
  const callDotsAnim = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Package | null>(null);
  const [transferCandidate, setTransferCandidate] = useState<Package | null>(null);
  const deleteModalAnim = useRef(new Animated.Value(0)).current;
  const SYSTEM_USERS = [
    'Magdalena Nowak',
    'Paweł Wiśniewski',
    'Joanna Rutkowska',
  ] as const;
  const getRandomUserFullName = () =>
    SYSTEM_USERS[Math.floor(Math.random() * SYSTEM_USERS.length)];
  const urgentModalAnim = useRef(new Animated.Value(0)).current;
  const [historyCall, setHistoryCall] = useState<UrgentCall | null>(null);
  const [isDeleteSuccessVisible, setIsDeleteSuccessVisible] = useState(false);
  const deleteSuccessAnim = useRef(new Animated.Value(0)).current;
  const [successMessageTitle, setSuccessMessageTitle] = useState('');
  const [successMessageSubtitle, setSuccessMessageSubtitle] = useState('');
  const [editForm, setEditForm] = useState({
    patientName: '',
    pesel: '',
    fileName: '',
    aiFileName: '',
    attachments: [] as string[],
    newAttachmentName: '',
  });

  const pendingUrgentCount = urgentCalls.filter((c) => c.status === 'pending').length;
  const dangerUrgentCount = urgentCalls.filter((c) => c.status === 'danger').length;

  const hasPendingUrgent = urgentCalls.some((c) => c.status === 'pending');

  useEffect(() => {
    // miejsce na przyszłe integracje (np. polling statusu AI)
  }, []);

  useEffect(() => {
    // łagodne miganie ramki tylko gdy są oczekujące nagłe wezwania
    if (!hasPendingUrgent) {
      urgentBorderAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(urgentBorderAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(urgentBorderAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [hasPendingUrgent, urgentBorderAnim]);

  useEffect(() => {
    if (isDeleteModalVisible) {
      deleteModalAnim.setValue(0);
      Animated.timing(deleteModalAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [isDeleteModalVisible, deleteModalAnim]);

  const urgentTabBadgeScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(urgentTabBadgeScale, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(urgentTabBadgeScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [urgentTabBadgeScale]);

  useEffect(() => {
    if (confirmingCall || dangerCall) {
      urgentModalAnim.setValue(0);
      Animated.timing(urgentModalAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [confirmingCall, dangerCall, urgentModalAnim]);

  useEffect(() => {
    if (!callingCall) return;
    callDotsAnim.forEach((v) => v.setValue(0));
    const animations = callDotsAnim.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 120),
          Animated.timing(anim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [callingCall, callDotsAnim]);

  const handleFileUpload = () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      setPackages((prev) => {
        const nextIndex = prev.length + 1;
        const seqNr = `${String(nextIndex).padStart(3, '0')}/03/26`;
        return [
          {
            id: Date.now().toString(),
            seqNr,
            registeredAt: formatNow(),
            patientName: 'Anna Nowak',
            pesel: '90051412345',
            fileName: 'historia_choroby_nowak.pdf',
            aiFileName: 'notatka_ai_nowak.pdf',
            documentType: 'Konsultacja specjalistyczna',
            transferredAt: undefined,
            status: 'aktywne',
          },
          ...prev,
        ];
      });

      setIsAnalyzing(false);
    }, 2500);
  };

  const handleTransferToOptimed = (id: string) => {
    const now = formatNow();
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id
          ? {
              ...pkg,
              status: 'przekazane',
              transferredAt: now,
              errorMessage: undefined,
            }
          : pkg,
      ),
    );
  };

  const confirmTransferToOptimed = () => {
    if (!transferCandidate) return;
    handleTransferToOptimed(transferCandidate.id);
    showSuccessToast(
      'Przekazano do Optimed',
      'Paczka została pomyślnie przekazana do systemu Optimed.',
    );
    setTransferCandidate(null);
  };

  const handleRetryTransfer = (id: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id
          ? {
              ...pkg,
              status: 'aktywne',
              errorMessage: undefined,
              transferredAt: undefined,
            }
          : pkg,
      ),
    );
  };

  const filteredPackages = packages.filter((pkg) => pkg.status === activeTab);

  const urgentBorderColor = urgentBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F3F4F6', '#FECACA'],
  });

  const showSuccessToast = (title: string, subtitle: string) => {
    setSuccessMessageTitle(title);
    setSuccessMessageSubtitle(subtitle);
    deleteSuccessAnim.setValue(0);
    setIsDeleteSuccessVisible(true);
    Animated.timing(deleteSuccessAnim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(deleteSuccessAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start(() => {
          setIsDeleteSuccessVisible(false);
        });
      }, 1600);
    });
  };

  const handleConfirmUrgent = (
    id: string,
    result:
      | 'porada'
      | 'wizyta'
      | 'e_recepta'
      | 'przekazano_informacje'
      | 'pacjent_zrezygnowal'
      | 'przekierowano_inna_placowka',
  ) => {
    let label: string;
    switch (result) {
      case 'porada':
        label = 'Dokonano porady';
        break;
      case 'wizyta':
        label = 'Umówiono wizytę';
        break;
      case 'e_recepta':
        label = 'Wystawiono e-receptę / e-ZLA';
        break;
      case 'przekazano_informacje':
        label = 'Przekazano informacje / wyniki badań';
        break;
      case 'pacjent_zrezygnowal':
        label = 'Pacjent zrezygnował z pomocy';
        break;
      case 'przekierowano_inna_placowka':
        label = 'Przekierowano do innej placówki';
        break;
      default:
        label = 'Zaktualizowano status zgłoszenia';
    }
    const reactionAt = formatNow();
    const actor = getRandomUserFullName();
    setUrgentCalls((prev) =>
      prev.map((call) =>
        call.id === id
          ? {
              ...call,
              status: 'done',
              result,
              handledBy: actor,
              lastReactionAt: reactionAt,
              history: [
                ...(call.history ?? []),
                {
                  action: label,
                  by: actor,
                  at: reactionAt,
                },
              ],
            }
          : call,
      ),
    );
    showSuccessToast(
      label,
      confirmingCall
        ? `Rozmowa z pacjentem ${confirmingCall.patientName} została zapisana.`
        : 'Zaktualizowano status zgłoszenia.',
    );
    setConfirmingCall(null);
  };

  const openConfirmUrgentModal = (call: UrgentCall) => {
    setConfirmingCall(call);
  };

  const handleMarkDanger = (
    id: string,
    result:
      | 'brak_kontaktu'
      | 'wezwanie_pogotowia'
      | 'brak_kontaktu_sms'
      | 'eskalacja_do_lekarza'
      | 'bledne_dane'
      | 'brak_terminow'
      | 'agresywny_pacjent'
      | 'bariera_jezykowa',
  ) => {
    const actionLabel =
      result === 'brak_kontaktu'
        ? 'Nie dodzwoniłem się'
        : result === 'wezwanie_pogotowia'
        ? 'Wezwano pogotowie'
        : result === 'brak_kontaktu_sms'
        ? 'Brak kontaktu - Wysłano SMS (Próba 1/3)'
        : result === 'eskalacja_do_lekarza'
        ? 'Pilna eskalacja do lekarza'
        : result === 'bledne_dane'
        ? 'Błędne dane kontaktowe / Zły numer'
        : result === 'brak_terminow'
        ? 'Brak wolnych terminów (Lista rezerwowa)'
        : result === 'agresywny_pacjent'
        ? 'Agresywny pacjent / Odmowa współpracy'
        : 'Bariera językowa / Wymaga tłumacza';
    const reactionAt = formatNow();
    const actor = getRandomUserFullName();
    setUrgentCalls((prev) =>
      prev.map((call) =>
        call.id === id
          ? {
              ...call,
              status: 'danger',
              result,
              handledBy: actor,
              lastReactionAt: reactionAt,
              history: [
                ...(call.history ?? []),
                {
                  action: actionLabel,
                  by: actor,
                  at: reactionAt,
                },
              ],
            }
          : call,
      ),
    );

    const label =
      result === 'brak_kontaktu' ? 'Brak kontaktu telefonicznego' : 'Wezwanie pogotowia';
    showSuccessToast(
      label,
      dangerCall
        ? `Zgłoszenie pacjenta ${dangerCall.patientName} zostało oznaczone jako zagrożenie.`
        : 'Zaktualizowano status zgłoszenia.',
    );
    setDangerCall(null);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setEditForm({
      patientName: pkg.patientName,
      pesel: pkg.pesel,
      fileName: pkg.fileName,
      aiFileName: pkg.aiFileName,
      attachments: [pkg.fileName, pkg.aiFileName].filter(Boolean),
      newAttachmentName: '',
    });
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editingPackage) return;
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === editingPackage.id
          ? {
              ...pkg,
              patientName: editForm.patientName,
              pesel: editForm.pesel,
              fileName: editForm.attachments[0] ?? '',
              aiFileName: editForm.attachments[1] ?? '',
            }
          : pkg,
      ),
    );
    setIsEditModalVisible(false);
    setEditingPackage(null);
  };

  const handleDeletePackageRequest = (pkg: Package) => {
    setDeleteCandidate(pkg);
    setIsDeleteModalVisible(true);
  };

  const confirmDeletePackage = () => {
    if (!deleteCandidate) {
      setIsDeleteModalVisible(false);
      return;
    }
    const idToDelete = deleteCandidate.id;
    setPackages((prev) => prev.filter((pkg) => pkg.id !== idToDelete));
    setIsDeleteModalVisible(false);
    setDeleteCandidate(null);
    // pokaż krótki zielony popup „usunięto”
    showSuccessToast(
      'Paczka usunięta',
      'Rekord został pomyślnie usunięty z listy importu.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Image
              source={require('../../assets/images/KlinikaRogLogo.png')}
              style={styles.sidebarLogo}
            />
            <Text style={styles.sidebarClinicRole}>Panel Recepcji | Back Office</Text>
          </View>

          <View style={styles.sidebarMenu}>
            <Pressable
              style={({ pressed }) => [
                styles.sidebarMenuItemActive,
                pressed && styles.sidebarMenuItemActivePressed,
                activeMenu === 'import' && styles.sidebarMenuItemPrimaryActive,
              ]}
              onPress={() => {
                setActiveSidebarItem('import');
                setActiveMenu('import');
              }}
              onPressIn={() =>
                Animated.spring(importScale, {
                  toValue: 1.04,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onPressOut={() =>
                Animated.spring(importScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onHoverIn={() =>
                Animated.spring(importScale, {
                  toValue: 1.04,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onHoverOut={() =>
                Animated.spring(importScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }>
              <Animated.View
                style={[
                  styles.sidebarMenuItemInner,
                  activeSidebarItem === 'import' && styles.sidebarMenuItemSelected,
                  { transform: [{ scale: importScale }] },
                ]}>
                <View style={styles.sidebarMenuIcon}>
                  <Ionicons
                    name="cloud-download-outline"
                    size={20}
                    color={activeMenu === 'import' ? COLORS.primary : COLORS.textSecondary}
                  />
                </View>
                <View style={styles.sidebarMenuTextGroup}>
                  <Text style={styles.sidebarMenuTitle}>Import Dokumentacji</Text>
                </View>
              </Animated.View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sidebarMenuItemSecondary,
                pressed && styles.sidebarMenuItemSecondaryPressed,
                activeMenu === 'nagle' && styles.sidebarMenuItemUrgentActive,
              ]}
              onPress={() => {
                setActiveSidebarItem('urgent');
                setActiveMenu('nagle');
              }}
              onPressIn={() =>
                Animated.spring(urgentScale, {
                  toValue: 1.04,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onPressOut={() =>
                Animated.spring(urgentScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onHoverIn={() =>
                Animated.spring(urgentScale, {
                  toValue: 1.04,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onHoverOut={() =>
                Animated.spring(urgentScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }>
              <Animated.View
                style={[
                  styles.sidebarMenuItemInner,
                  activeSidebarItem === 'urgent' && styles.sidebarMenuItemSelected,
                  hasPendingUrgent && {
                    borderWidth: 2,
                    borderColor: urgentBorderColor,
                    borderRadius: 10,
                  },
                  { transform: [{ scale: urgentScale }] },
                ]}>
                <View style={styles.sidebarMenuIconSecondary}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={activeMenu === 'nagle' ? COLORS.danger : COLORS.textSecondary}
                  />
                </View>
                <View style={styles.sidebarMenuTextGroup}>
                  <Text
                    style={[
                      styles.sidebarMenuTitleSecondary,
                      activeMenu === 'nagle' && styles.sidebarMenuTitleUrgentActive,
                    ]}>
                    Nagłe wezwania
                  </Text>
                </View>
              </Animated.View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.sidebarMenuItemSecondary,
                pressed && styles.sidebarMenuItemSecondaryPressed,
                activeMenu === 'triage' && styles.sidebarMenuItemTriageActive,
              ]}
              onPress={() => {
                setActiveSidebarItem('triage');
                setActiveMenu('triage');
              }}
              onPressIn={() =>
                Animated.spring(triageScale, {
                  toValue: 1.04,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onPressOut={() =>
                Animated.spring(triageScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onHoverIn={() =>
                Animated.spring(triageScale, {
                  toValue: 1.04,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }
              onHoverOut={() =>
                Animated.spring(triageScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  friction: 7,
                  tension: 90,
                }).start()
              }>
              <Animated.View
                style={[
                  styles.sidebarMenuItemInner,
                  activeSidebarItem === 'triage' && styles.sidebarMenuItemSelectedTriage,
                  { transform: [{ scale: triageScale }] },
                ]}>
                <View style={styles.sidebarMenuIconTriage}>
                  <Ionicons
                    name="git-network-outline"
                    size={18}
                    color={activeMenu === 'triage' ? '#4F46E5' : COLORS.textSecondary}
                  />
                </View>
                <View style={styles.sidebarMenuTextGroup}>
                  <Text
                    style={[
                      styles.sidebarMenuTitleSecondary,
                      activeMenu === 'triage' && styles.sidebarMenuTitleTriageActive,
                    ]}>
                    Triage
                  </Text>
                </View>
              </Animated.View>
            </Pressable>

            {/* Pozycje na przyszłość (jeszcze nieaktywne) */}
            {[
              { label: 'Kalendarz Wizyt', icon: 'calendar-outline' as const },
              { label: 'Baza Pacjentów', icon: 'people-outline' as const },
              { label: 'E-Recepty i Skierowania', icon: 'medkit-outline' as const },
              { label: 'Rozliczenia i NFZ', icon: 'cash-outline' as const },
              { label: 'Grafiki Personelu', icon: 'time-outline' as const },
              { label: 'Telemedycyna', icon: 'chatbubbles-outline' as const },
              { label: 'Raporty i Analityka', icon: 'bar-chart-outline' as const },
            ].map((item) => (
              <View key={item.label} style={[styles.sidebarMenuItemSecondary, { opacity: 0.7 }]}>
                <View style={styles.sidebarMenuItemInner}>
                  <View style={styles.sidebarMenuIconSecondary}>
                    <Ionicons name={item.icon} size={18} color={COLORS.textSecondary} />
                  </View>
                  <View style={styles.sidebarMenuTextGroup}>
                    <Text style={styles.sidebarMenuTitleSecondary}>{item.label}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* MAIN WORKSPACE */}
        <View style={styles.main}>
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}>
            {activeMenu === 'import' && (
              <>
                <Text style={styles.mainTitle}>Dokumentacja i załączniki</Text>
                <Text style={styles.mainSubtitle}>
                  Wgrywaj historię choroby, a system AI automatycznie tworzy streszczenia i
                  przygotowuje paczki do integracji z Optimed.
                </Text>

                {/* Upload zone */}
                <TouchableOpacity
                  style={[
                    styles.uploadZone,
                    isAnalyzing && { borderStyle: 'solid', borderColor: COLORS.primary },
                  ]}
                  activeOpacity={0.9}
                  onPress={handleFileUpload}>
                  {isAnalyzing ? (
                    <View style={styles.uploadInner}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                      <Text style={styles.uploadAnalyzingText}>
                        Sztuczna inteligencja analizuje i parafrazuje dokument...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.uploadInner}>
                      <Text style={styles.uploadIcon}>☁️</Text>
                      <Text style={styles.uploadTitle}>
                        Kliknij lub upuść plik PDF z historią choroby
                      </Text>
                      <Text style={styles.uploadHint}>
                        Moduł AI automatycznie wyodrębni kluczowe informacje kliniczne.
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Tabs */}
                <View style={styles.tabsRow}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'aktywne' && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveTab('aktywne')}>
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'aktywne' && styles.tabButtonTextActive,
                      ]}>
                      Aktywne
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'przekazane' && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveTab('przekazane')}>
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'przekazane' && styles.tabButtonTextActive,
                      ]}>
                      Przekazane do Optimed
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'bledne' && styles.tabButtonErrorActive,
                    ]}
                    onPress={() => setActiveTab('bledne')}>
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === 'bledne' && styles.tabButtonTextActive,
                      ]}>
                      Błędne przekazania
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Packages list - minimalistyczna tabela jak Nagłe wezwania */}
                <View style={styles.urgentCard}>
                  <View style={styles.urgentHeaderRow}>
                    <View style={[styles.urgentHeaderCell, styles.importColPatient]}>
                      <Text style={styles.urgentHeaderText}>PACJENT</Text>
                    </View>
                    <View style={[styles.urgentHeaderCell, styles.importColNumber]}>
                      <Text style={styles.urgentHeaderText}>NUMER</Text>
                    </View>
                    <View style={[styles.urgentHeaderCell, styles.importColRegistered]}>
                      <Text style={styles.urgentHeaderText}>ZAREJESTROWANO</Text>
                    </View>
                    <View style={[styles.urgentHeaderCell, styles.importColDocType]}>
                      <Text style={styles.urgentHeaderText}>TYP DOKUMENTU</Text>
                    </View>
                    <View style={[styles.urgentHeaderCell, styles.importColAttachments]}>
                      <Text style={styles.urgentHeaderText}>ZAŁĄCZNIKI DO OPTIMED</Text>
                    </View>
                    <View style={[styles.urgentHeaderCell, styles.importColActions]}>
                      <Text style={[styles.urgentHeaderText, styles.urgentHeaderTextRight]}>
                        EDYCJA
                      </Text>
                    </View>
                  </View>

                  {filteredPackages.length === 0 ? (
                    <View style={styles.urgentEmptyRow}>
                      <Text style={styles.urgentEmptyText}>
                        Brak pakietów w tej zakładce. Wgraj nowy plik PDF lub zmień filtr.
                      </Text>
                    </View>
                  ) : (
                    filteredPackages.map((pkg) => (
                      <View key={pkg.id} style={styles.urgentRow}>
                        <View style={[styles.urgentCell, styles.importColPatient]}>
                          <Text style={styles.urgentPatientName}>{pkg.patientName}</Text>
                          <Text style={styles.urgentPatientPeselSub}>
                            {pkg.pesel.toLowerCase()}
                          </Text>
                          {pkg.status === 'bledne' && pkg.errorMessage ? (
                            <Text style={styles.errorText}>{pkg.errorMessage}</Text>
                          ) : null}
                        </View>
                        <View style={[styles.urgentCell, styles.importColNumber]}>
                          <Text style={styles.importCellText}>{pkg.seqNr}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.importColRegistered]}>
                          <Text style={styles.importCellText}>{pkg.registeredAt}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.importColDocType]}>
                          <View style={styles.docTypeBadge}>
                            <Text style={styles.docTypeText}>{pkg.documentType}</Text>
                          </View>
                        </View>
                        <View style={[styles.urgentCell, styles.importColAttachments]}>
                          <View style={styles.inlineRow}>
                            <Ionicons
                              name="document-outline"
                              size={14}
                              color={COLORS.textMuted}
                              style={styles.inlineIcon}
                            />
                            <Text style={styles.inlineText}>{pkg.fileName}</Text>
                          </View>
                          <View style={[styles.inlineRow, { marginTop: 8 }]}>
                            <Ionicons
                              name="sparkles-outline"
                              size={14}
                              color={COLORS.primary}
                              style={styles.inlineIcon}
                            />
                            <Text style={styles.aiFileText}>{pkg.aiFileName}</Text>
                          </View>
                        </View>
                        <View
                          style={[
                            styles.urgentCell,
                            styles.importColActions,
                            styles.urgentConfirmCell,
                          ]}>
                          <View style={styles.editActionsRow}>
                            {pkg.status === 'aktywne' && (
                              <TouchableOpacity
                                style={styles.importActionIconButton}
                                onPress={() => setTransferCandidate(pkg)}>
                                <Ionicons name="arrow-forward" size={18} color="#16A34A" />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={styles.importActionIconButton}
                              onPress={() => openEditModal(pkg)}>
                              <Ionicons name="create-outline" size={18} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.importActionIconButton}
                              onPress={() => handleDeletePackageRequest(pkg)}>
                              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </>
            )}

            {activeMenu === 'nagle' && (
              <View>
                <Text style={styles.urgentTitle}>Nagłe wezwania</Text>
                <Text style={styles.urgentSubtitle}>
                  Zgłoszenia pacjentów wymagających pilnego kontaktu.
                </Text>

                {/* Tabs for urgent calls */}
                <View style={styles.tabsRow}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeUrgentTab === 'oczekujace' && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveUrgentTab('oczekujace')}>
                    <View style={styles.tabLabelWithBadge}>
                      <Text
                        style={[
                          styles.tabButtonText,
                          activeUrgentTab === 'oczekujace' && styles.tabButtonTextActive,
                        ]}>
                        Oczekujące
                      </Text>
                      {pendingUrgentCount > 0 && (
                        <Animated.View
                          style={[
                            styles.tabBadge,
                            { transform: [{ scale: urgentTabBadgeScale }] },
                          ]}>
                          <Text style={styles.tabBadgeText}>{pendingUrgentCount}</Text>
                        </Animated.View>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeUrgentTab === 'zagrozenie' && styles.tabButtonErrorActive,
                    ]}
                    onPress={() => setActiveUrgentTab('zagrozenie')}>
                    <View style={styles.tabLabelWithBadge}>
                      <Text
                        style={[
                          styles.tabButtonText,
                          activeUrgentTab === 'zagrozenie' && styles.tabButtonTextActive,
                        ]}>
                        W trakcie
                      </Text>
                      {dangerUrgentCount > 0 && (
                        <Animated.View
                          style={[
                            styles.tabBadge,
                            styles.tabBadgeDanger,
                            { transform: [{ scale: urgentTabBadgeScale }] },
                          ]}>
                          <Text style={styles.tabBadgeText}>{dangerUrgentCount}</Text>
                        </Animated.View>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeUrgentTab === 'wykonane' && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveUrgentTab('wykonane')}>
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeUrgentTab === 'wykonane' && styles.tabButtonTextActive,
                      ]}>
                      Wykonane
                    </Text>
                  </TouchableOpacity>
                  {/* Zakładka „Anulowane” usunięta na życzenie użytkownika */}
                </View>

                <Animated.View
                  style={[
                    styles.urgentCard,
                    hasPendingUrgent && {
                      borderColor: urgentBorderColor,
                      borderWidth: 2,
                    },
                  ]}>
                  <View style={styles.urgentHeaderRow}>
                    <View style={[styles.urgentHeaderCell, styles.urgentColPatient]}>
                      <Text style={styles.urgentHeaderText}>PACJENT</Text>
                    </View>
                    <View style={[styles.urgentHeaderCell, styles.urgentColRegisteredUrgent]}>
                      <Text style={styles.urgentHeaderText}>ZAREJESTROWANO</Text>
                    </View>
                    {activeUrgentTab === 'wykonane' || activeUrgentTab === 'zagrozenie' ? (
                      <View style={[styles.urgentHeaderCell, styles.urgentColStatus]}>
                        <Text style={styles.urgentHeaderText}>STATUS</Text>
                      </View>
                    ) : null}
                    <View style={[styles.urgentHeaderCell, styles.urgentColReactionUrgent]}>
                      <Text style={styles.urgentHeaderText}>REAKCJA</Text>
                    </View>
                    {activeUrgentTab === 'wykonane' || activeUrgentTab === 'zagrozenie' ? (
                      <View style={[styles.urgentHeaderCell, styles.urgentColHandledBy]}>
                        <Text style={styles.urgentHeaderText}>OBSŁUGUJĄCY</Text>
                      </View>
                    ) : null}
                    <View style={[styles.urgentHeaderCell, styles.urgentColPhone]}>
                      <Text style={styles.urgentHeaderText}>TELEFON</Text>
                    </View>
                    {activeUrgentTab === 'wykonane' ? (
                      <View style={[styles.urgentHeaderCell, styles.urgentColConfirm]}>
                        <Text style={[styles.urgentHeaderText, styles.urgentHeaderTextRight]}>
                          AKCJE
                        </Text>
                      </View>
                    ) : activeUrgentTab === 'oczekujace' || activeUrgentTab === 'zagrozenie' ? (
                      <View style={[styles.urgentHeaderCell, styles.urgentColConfirm]}>
                        <Text style={[styles.urgentHeaderText, styles.urgentHeaderTextRight]}>
                          POTWIERDŹ
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {urgentCalls.filter((c) => {
                    if (activeUrgentTab === 'oczekujace') {
                      return c.status === 'pending';
                    }
                    if (activeUrgentTab === 'zagrozenie') return c.status === 'danger';
                    if (activeUrgentTab === 'wykonane') return c.status === 'done';
                    return false;
                  }).length === 0 ? (
                    <View style={styles.urgentEmptyRow}>
                      <Text style={styles.urgentEmptyText}>
                        Brak zgłoszeń w tej zakładce.
                      </Text>
                    </View>
                  ) : (
                    urgentCalls
                      .filter((c) => {
                        if (activeUrgentTab === 'oczekujace') {
                          return c.status === 'pending';
                        }
                        if (activeUrgentTab === 'zagrozenie') return c.status === 'danger';
                        if (activeUrgentTab === 'wykonane') return c.status === 'done';
                        return false;
                      })
                      .map((call) => (
                        <View key={call.id} style={styles.urgentRow}>
                          <View style={[styles.urgentCell, styles.urgentColPatient]}>
                            <Text style={styles.urgentPatientName}>{call.patientName}</Text>
                            <Text style={styles.urgentPatientPeselSub}>
                              {call.pesel.toLowerCase()}
                            </Text>
                          </View>
                          <View style={[styles.urgentCell, styles.urgentColRegisteredUrgent]}>
                            <Text style={styles.urgentStatusText}>{call.registeredAt}</Text>
                          </View>
                          {activeUrgentTab === 'wykonane' || activeUrgentTab === 'zagrozenie' ? (
                            <View style={[styles.urgentCell, styles.urgentColStatus]}>
                              <Text style={styles.urgentStatusText}>
                                {activeUrgentTab === 'wykonane'
                                  ? call.result === 'porada'
                                    ? 'Dokonano porady'
                                    : call.result === 'wizyta'
                                    ? 'Umówiono wizytę'
                                    : call.result === 'e_recepta'
                                    ? 'Wystawiono e-receptę / e-ZLA'
                                    : call.result === 'przekazano_informacje'
                                    ? 'Przekazano informacje / wyniki badań'
                                    : call.result === 'pacjent_zrezygnowal'
                                    ? 'Pacjent zrezygnował z pomocy'
                                    : call.result === 'przekierowano_inna_placowka'
                                    ? 'Przekierowano do innej placówki'
                                    : 'Zrealizowane'
                                  : call.result === 'brak_kontaktu'
                                  ? 'Brak kontaktu telefonicznego'
                                  : call.result === 'wezwanie_pogotowia'
                                  ? 'Wezwano pogotowie'
                                  : call.result === 'brak_kontaktu_sms'
                                  ? 'Brak kontaktu – wysłano SMS (próba 1/3)'
                                  : call.result === 'eskalacja_do_lekarza'
                                  ? 'Pilna eskalacja do lekarza'
                                  : call.result === 'bledne_dane'
                                  ? 'Błędne dane kontaktowe / zły numer'
                                  : call.result === 'brak_terminow'
                                  ? 'Brak wolnych terminów (lista rezerwowa)'
                                  : call.result === 'agresywny_pacjent'
                                  ? 'Agresywny pacjent / odmowa współpracy'
                                  : call.result === 'bariera_jezykowa'
                                  ? 'Bariera językowa / wymaga tłumacza'
                                  : 'Zgłoszone zagrożenie'}
                              </Text>
                            </View>
                          ) : null}
                          <View style={[styles.urgentCell, styles.urgentColReactionUrgent]}>
                            <Text style={styles.urgentStatusText}>
                              {call.lastReactionAt ?? '—'}
                            </Text>
                          </View>
                          {activeUrgentTab === 'wykonane' || activeUrgentTab === 'zagrozenie' ? (
                            <View style={[styles.urgentCell, styles.urgentColHandledBy]}>
                              <Text style={styles.urgentStatusText}>
                                {call.handledBy ?? '-'}
                              </Text>
                            </View>
                          ) : null}
                          <View style={[styles.urgentCell, styles.urgentColPhone]}>
                            <View style={styles.urgentPhoneRow}>
                              <Text style={styles.urgentPhone}>{call.phone}</Text>
                              {(activeUrgentTab === 'oczekujace' ||
                                activeUrgentTab === 'zagrozenie') && (
                                <CallMockButton onPress={() => setCallingCall(call)} />
                              )}
                            </View>
                          </View>
                          {activeUrgentTab === 'wykonane' ? (
                            <View
                              style={[
                                styles.urgentCell,
                                styles.urgentColConfirm,
                                styles.urgentConfirmCell,
                              ]}>
                              <UrgentActionButton
                                variant="history"
                                onPress={() => setHistoryCall(call)}
                              />
                            </View>
                          ) : (activeUrgentTab === 'oczekujace' || activeUrgentTab === 'zagrozenie') && (
                            <View
                              style={[
                                styles.urgentCell,
                                styles.urgentColConfirm,
                                styles.urgentConfirmCell,
                              ]}>
                              <View style={styles.urgentActionsRow}>
                                <UrgentActionButton
                                  variant="confirm"
                                  onPress={() => openConfirmUrgentModal(call)}
                                />
                                <UrgentActionButton
                                  variant="danger"
                                  onPress={() => setDangerCall(call)}
                                />
                                {activeUrgentTab === 'zagrozenie' && (
                                  <UrgentActionButton
                                    variant="history"
                                    onPress={() => setHistoryCall(call)}
                                  />
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      ))
                  )}
                </Animated.View>
              </View>
            )}

            {activeMenu === 'triage' && (
              <View>
                <Text style={styles.triageMainTitle}>Centrum Triage (Wywiad Medyczny)</Text>
                <Text style={styles.triageMainSubtitle}>
                  Podgląd zgłoszeń ankiet mobilnych, reguł drzewa decyzyjnego i skróconych statystyk.
                </Text>

                <View style={styles.triagePillsRow}>
                  {(
                    [
                      { key: 'zgloszenia' as const, label: 'Zgłoszenia' },
                      { key: 'ankieta' as const, label: 'Ankieta' },
                      { key: 'statystyki' as const, label: 'Statystyki' },
                    ] as const
                  ).map((pill) => (
                    <TouchableOpacity
                      key={pill.key}
                      style={[
                        styles.triagePill,
                        triageTab === pill.key && styles.triagePillActive,
                      ]}
                      onPress={() => setTriageTab(pill.key)}
                      activeOpacity={0.85}>
                      <Text
                        style={[
                          styles.triagePillText,
                          triageTab === pill.key && styles.triagePillTextActive,
                        ]}>
                        {pill.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {triageTab === 'zgloszenia' && (
                  <View style={styles.urgentCard}>
                    <View style={styles.urgentHeaderRow}>
                      <View style={[styles.urgentHeaderCell, styles.triageColPatient]}>
                        <Text style={styles.urgentHeaderText}>PACJENT</Text>
                      </View>
                      <View style={[styles.urgentHeaderCell, styles.triageColNip]}>
                        <Text style={styles.urgentHeaderText}>NIP</Text>
                      </View>
                      <View style={[styles.urgentHeaderCell, styles.triageColSymptom]}>
                        <Text style={styles.urgentHeaderText}>GŁÓWNY OBJAW</Text>
                      </View>
                      <View style={[styles.urgentHeaderCell, styles.triageColResult]}>
                        <Text style={styles.urgentHeaderText}>WYNIK ANKIETY</Text>
                      </View>
                      <View style={[styles.urgentHeaderCell, styles.triageColTime]}>
                        <Text style={styles.urgentHeaderText}>CZAS</Text>
                      </View>
                      <View style={[styles.urgentHeaderCell, styles.triageColActions]}>
                        <Text style={[styles.urgentHeaderText, styles.urgentHeaderTextRight]}>
                          AKCJE
                        </Text>
                      </View>
                    </View>
                    {mockTriageList.map((row) => (
                      <View key={row.id} style={styles.urgentRow}>
                        <View style={[styles.urgentCell, styles.triageColPatient]}>
                          <Text style={styles.urgentPatientName}>{row.patient}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.triageColNip]}>
                          <Text style={styles.urgentStatusText}>{row.nip}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.triageColSymptom]}>
                          <Text style={styles.urgentStatusText}>{row.symptom}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.triageColResult]}>
                          <Text style={styles.urgentStatusText}>{row.result}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.triageColTime]}>
                          <Text style={styles.urgentStatusText}>{row.timeLabel}</Text>
                        </View>
                        <View
                          style={[
                            styles.urgentCell,
                            styles.triageColActions,
                            styles.urgentConfirmCell,
                          ]}>
                          <TriageDetailButton onPress={() => setTriageDetailRow(row)} />
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {triageTab === 'ankieta' && (
                  <View style={styles.urgentCard}>
                    <View style={styles.urgentHeaderRow}>
                      <View style={[styles.urgentHeaderCell, styles.triageQColQuestion]}>
                        <Text style={styles.urgentHeaderText}>PYTANIE / OBJAW</Text>
                      </View>
                      <View style={[styles.urgentHeaderCell, styles.triageQColCategory]}>
                        <Text style={styles.urgentHeaderText}>KATEGORIA</Text>
                      </View>
                      <View style={[styles.urgentHeaderCell, styles.triageQColWeight]}>
                        <Text style={styles.urgentHeaderText}>WAGA / ZNACZENIE</Text>
                      </View>
                      <View style={[styles.urgentHeaderCell, styles.triageQColAction]}>
                        <Text style={styles.urgentHeaderText}>REAKCJA SYSTEMU</Text>
                      </View>
                    </View>
                    {mockSurveyQuestions.map((q) => (
                      <View key={q.id} style={styles.urgentRow}>
                        <View style={[styles.urgentCell, styles.triageQColQuestion]}>
                          <Text style={styles.urgentPatientName}>{q.question}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.triageQColCategory]}>
                          <Text style={styles.urgentStatusText}>{q.category}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.triageQColWeight]}>
                          <Text style={styles.urgentStatusText}>{q.weight}</Text>
                        </View>
                        <View style={[styles.urgentCell, styles.triageQColAction]}>
                          <Text style={styles.urgentStatusText}>{q.action}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {triageTab === 'statystyki' && (
                  <View style={styles.triageStatsPage}>
                    <View style={styles.triageStatsHero}>
                      <Text style={styles.triageStatsHeroTitle}>Pulpit analityczny triage</Text>
                      <Text style={styles.triageStatsHeroSub}>
                        KPI i wykresy oparte na mockach — odzwierciedlają metryki, jakie można policzyć z
                        ankiety, flag pilności, ścieżek i rekomendacji w aplikacji mobilnej.
                      </Text>
                    </View>
                    <View style={styles.triageStatsGrid}>
                      {triageStatTiles.map((tile) => (
                        <TriageStatKpiTile key={tile.id} tile={tile} />
                      ))}
                    </View>
                    <Text style={styles.triageChartsSectionTitle}>Wykresy i rozkłady</Text>
                    <Text style={styles.triageChartsSectionSub}>
                      Pięć paneli wizualnych ułatwia szybki odczyt trendów bez zewnętrznych bibliotek
                      wykresów.
                    </Text>
                    <View style={styles.triageChartsGrid}>
                      <View style={styles.triageChartCell}>
                        <TriageWeeklyBarChart />
                      </View>
                      <View style={styles.triageChartCell}>
                        <TriageUrgencyBarsChart />
                      </View>
                      <View style={styles.triageChartCell}>
                        <TriageOutcomeStripChart />
                      </View>
                      <View style={styles.triageChartCell}>
                        <TriageSymptomsRankChart />
                      </View>
                      <View style={styles.triageChartCell}>
                        <TriageHourlyFlowChart />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      {triageDetailRow && (
        <View style={styles.editModalOverlay}>
          <View style={styles.triageDetailModalCard}>
            <View style={styles.triageDetailTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.triageDetailModalTitle}>Szczegóły triage</Text>
                <Text style={styles.triageDetailModalSubtitle}>
                  Podgląd jak w aplikacji pacjenta po zakończeniu wywiadu
                </Text>
              </View>
              <TouchableOpacity
                style={styles.triageDetailCloseBtn}
                onPress={() => setTriageDetailRow(null)}
                accessibilityLabel="Zamknij szczegóły"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.triageDetailScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.triageDetailPatientName}>{triageDetailRow.patient}</Text>
              <Text style={styles.triageDetailMetaLine}>NIP: {triageDetailRow.nip}</Text>
              <Text style={styles.triageDetailMetaLine}>
                Wynik ankiety: {triageDetailRow.result}
              </Text>
              <Text style={styles.triageDetailMetaLine}>Czas zgłoszenia: {triageDetailRow.timeLabel}</Text>
              <Text style={styles.triageDetailSectionLabel}>Główny objaw (z listy)</Text>
              <Text style={styles.triageDetailSectionBody}>{triageDetailRow.symptom}</Text>

              <Text style={styles.triageDetailSummaryLabel}>
                Podsumowanie dla lekarza · pilność: {triageDetailRow.urgencyFlags}
              </Text>
              <View style={styles.triageDetailSummaryBox}>
                <Text style={styles.triageDetailSummaryText}>{triageDetailRow.doctorSummary}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.triageDetailFooterBtn}
              onPress={() => setTriageDetailRow(null)}
              activeOpacity={0.85}>
              <Text style={styles.triageDetailFooterBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isEditModalVisible && (
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalCard}>
            <Text style={styles.editModalTitle}>Edycja paczki</Text>
            <Text style={styles.editModalSubtitle}>
              Zaktualizuj dane pacjenta i załączniki przed przekazaniem do Optimed.
            </Text>

            <View style={styles.editFieldGroup}>
              <Text style={styles.editLabel}>Imię i nazwisko</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.patientName}
                onChangeText={(text) =>
                  setEditForm((prev) => ({
                    ...prev,
                    patientName: text,
                  }))
                }
                placeholder="Imię i nazwisko pacjenta"
              />
            </View>

            <View style={styles.editFieldGroup}>
              <Text style={styles.editLabel}>PESEL</Text>
              <TextInput
                style={styles.editInput}
                value={editForm.pesel}
                onChangeText={(text) =>
                  setEditForm((prev) => ({
                    ...prev,
                    pesel: text,
                  }))
                }
                placeholder="PESEL"
                keyboardType="numeric"
                maxLength={11}
              />
            </View>

            <View style={styles.editFieldGroup}>
              <Text style={styles.editLabel}>Załączniki</Text>
              {editForm.attachments.length === 0 ? (
                <Text style={styles.editAttachmentsEmpty}>
                  Brak załączników. Dodaj co najmniej jeden plik.
                </Text>
              ) : (
                <View style={styles.editAttachmentsList}>
                  {editForm.attachments.map((att, index) => (
                    <View key={`${att}-${index}`} style={styles.editAttachmentChip}>
                      <Text style={styles.editAttachmentText}>{att}</Text>
                      <TouchableOpacity
                        style={styles.editAttachmentRemove}
                        onPress={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== index),
                          }))
                        }>
                        <Text style={styles.editAttachmentRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.editAddAttachmentRow}>
                <TextInput
                  style={[styles.editInput, styles.editAddAttachmentInput]}
                  value={editForm.newAttachmentName}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({
                      ...prev,
                      newAttachmentName: text,
                    }))
                  }
                  placeholder="Nazwa nowego załącznika (np. wypis_szpitalny.pdf)"
                />
                <TouchableOpacity
                  style={styles.editAddAttachmentButton}
                  onPress={() => {
                    if (!editForm.newAttachmentName.trim()) return;
                    setEditForm((prev) => ({
                      ...prev,
                      attachments: [...prev.attachments, prev.newAttachmentName.trim()],
                      newAttachmentName: '',
                    }));
                  }}>
                  <Text style={styles.editAddAttachmentButtonText}>Dodaj</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.editModalButtonsRow}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => {
                  setIsEditModalVisible(false);
                  setEditingPackage(null);
                }}>
                <Text style={styles.editCancelButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editSaveButton} onPress={handleSaveEdit}>
                <Text style={styles.editSaveButtonText}>Zapisz zmiany</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {isDeleteModalVisible && (
        <View style={styles.editModalOverlay}>
          <Animated.View
            style={[
              styles.deleteModalCard,
              {
                opacity: deleteModalAnim,
                transform: [
                  {
                    scale: deleteModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                  {
                    translateY: deleteModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}>
            <Text style={styles.deleteModalTitle}>Usunąć paczkę dokumentów?</Text>
            <Text style={styles.deleteModalSubtitle}>
              Tej operacji nie będzie można cofnąć. Paczka zostanie usunięta z listy importu.
            </Text>

            {deleteCandidate && (
              <View style={styles.deleteSummaryBox}>
                <Text style={styles.deleteSummaryName}>{deleteCandidate.patientName}</Text>
                <Text style={styles.deleteSummaryPesel}>{deleteCandidate.pesel}</Text>
                <Text style={styles.deleteSummaryFile}>{deleteCandidate.fileName}</Text>
              </View>
            )}

            <View style={styles.deleteButtonsRow}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  setDeleteCandidate(null);
                }}>
                <Text style={styles.editCancelButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDeletePackage}>
                <Text style={styles.deleteConfirmButtonText}>Usuń</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
      {transferCandidate && (
        <View style={styles.editModalOverlay}>
          <View style={styles.urgentConfirmCard}>
            <Text style={styles.urgentConfirmTitle}>
              Czy na pewno chcesz przekazać paczkę do Optimed?
            </Text>
            <Text style={styles.urgentConfirmSubtitle}>
              Paczka zostanie oznaczona jako przekazana i pojawi się w zakładce „Przekazane do
              Optimed”.
            </Text>
            <View style={styles.transferSummaryBox}>
              <Text style={styles.transferSummaryName}>{transferCandidate.patientName}</Text>
              <Text style={styles.transferSummaryPesel}>{transferCandidate.pesel}</Text>
              <Text style={styles.transferSummaryFile}>{transferCandidate.fileName}</Text>
            </View>
            <View style={styles.transferModalButtonsRow}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setTransferCandidate(null)}>
                <Text style={styles.editCancelButtonText}>Anuluj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.transferConfirmButton}
                onPress={confirmTransferToOptimed}>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                <Text style={styles.transferConfirmButtonText}>Przekaż</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {isDeleteSuccessVisible && (
        <View pointerEvents="none" style={styles.successToastWrapper}>
          <Animated.View
            style={[
              styles.successToast,
              {
                opacity: deleteSuccessAnim,
                transform: [
                  {
                    translateY: deleteSuccessAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.successTextWrapper}>
              <Text style={styles.successTitle}>{successMessageTitle}</Text>
              <Text style={styles.successSubtitle}>{successMessageSubtitle}</Text>
            </View>
          </Animated.View>
        </View>
      )}
      {confirmingCall && (
        <View style={styles.editModalOverlay}>
          <Animated.View
            style={[
              styles.urgentConfirmCard,
              {
                transform: [
                  {
                    translateY: urgentModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                  {
                    scale: urgentModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
                opacity: urgentModalAnim,
              },
            ]}>
            <Text style={styles.urgentConfirmTitle}>
              Potwierdzam wykonaną rozmowę z pacjentem.
            </Text>
            <Text style={styles.urgentConfirmSubtitle}>Podaj rezultat rozmowy:</Text>
            <View style={styles.urgentConfirmButtonsRow}>
              <Pressable
                onPress={() => handleConfirmUrgent(confirmingCall.id, 'porada')}
                onHoverIn={() => {}}
                onHoverOut={() => {}}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#16A34A" />
                <Text style={styles.urgentConfirmOptionText}>Dokonano porady</Text>
              </Pressable>
              <Pressable
                onPress={() => handleConfirmUrgent(confirmingCall.id, 'wizyta')}
                onHoverIn={() => {}}
                onHoverOut={() => {}}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                <Text style={styles.urgentConfirmOptionText}>Umówiono wizytę</Text>
              </Pressable>
            </View>
            <View style={styles.urgentConfirmButtonsRow}>
              <Pressable
                onPress={() => handleConfirmUrgent(confirmingCall.id, 'e_recepta')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="document-text-outline" size={18} color="#059669" />
                <Text style={styles.urgentConfirmOptionText}>Wystawiono e-receptę / e-ZLA</Text>
              </Pressable>
              <Pressable
                onPress={() => handleConfirmUrgent(confirmingCall.id, 'przekazano_informacje')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="information-circle-outline" size={18} color="#0EA5E9" />
                <Text style={styles.urgentConfirmOptionText}>
                  Przekazano informacje / Wyniki badań
                </Text>
              </Pressable>
            </View>
            <View style={styles.urgentConfirmButtonsRow}>
              <Pressable
                onPress={() => handleConfirmUrgent(confirmingCall.id, 'pacjent_zrezygnowal')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="close-circle-outline" size={18} color="#F97316" />
                <Text style={styles.urgentConfirmOptionText}>Pacjent zrezygnował z pomocy</Text>
              </Pressable>
              <Pressable
                onPress={() => handleConfirmUrgent(confirmingCall.id, 'przekierowano_inna_placowka')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="business-outline" size={18} color="#7C3AED" />
                <Text style={styles.urgentConfirmOptionText}>
                  Przekierowano do innej placówki
                </Text>
              </Pressable>
            </View>
            <View style={styles.urgentConfirmFooterRow}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setConfirmingCall(null)}>
                <Text style={styles.editCancelButtonText}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
      {dangerCall && (
        <View style={styles.editModalOverlay}>
          <Animated.View
            style={[
              styles.urgentConfirmCard,
              {
                transform: [
                  {
                    translateY: urgentModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                  {
                    scale: urgentModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
                opacity: urgentModalAnim,
              },
            ]}>
            <Text style={styles.urgentConfirmTitle}>
              Zgłoszenie zagrożenia dla pacjenta.
            </Text>
            <Text style={styles.urgentConfirmSubtitle}>Wybierz rezultat kontaktu:</Text>
            <View style={styles.urgentConfirmButtonsRow}>
              <Pressable
                onPress={() => handleMarkDanger(dangerCall.id, 'brak_kontaktu')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="call-outline" size={18} color="#F97316" />
                <Text style={styles.urgentConfirmOptionText}>Nie dodzwoniłem się</Text>
              </Pressable>
              <Pressable
                onPress={() => handleMarkDanger(dangerCall.id, 'wezwanie_pogotowia')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="medical-outline" size={18} color="#DC2626" />
                <Text style={styles.urgentConfirmOptionText}>Wezwano pogotowie</Text>
              </Pressable>
            </View>
            <View style={styles.urgentConfirmButtonsRow}>
              <Pressable
                onPress={() => handleMarkDanger(dangerCall.id, 'brak_kontaktu_sms')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color="#2563EB" />
                <Text style={styles.urgentConfirmOptionText}>
                  Brak kontaktu - Wysłano SMS (Próba 1/3)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleMarkDanger(dangerCall.id, 'eskalacja_do_lekarza')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="alert-circle-outline" size={18} color="#F97316" />
                <Text style={styles.urgentConfirmOptionText}>Pilna eskalacja do lekarza</Text>
              </Pressable>
            </View>
            <View style={styles.urgentConfirmButtonsRow}>
              <Pressable
                onPress={() => handleMarkDanger(dangerCall.id, 'bledne_dane')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="call-outline" size={18} color="#9CA3AF" />
                <Text style={styles.urgentConfirmOptionText}>
                  Błędne dane kontaktowe / Zły numer
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleMarkDanger(dangerCall.id, 'brak_terminow')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="time-outline" size={18} color="#0EA5E9" />
                <Text style={styles.urgentConfirmOptionText}>
                  Brak wolnych terminów (Lista rezerwowa)
                </Text>
              </Pressable>
            </View>
            <View style={styles.urgentConfirmButtonsRow}>
              <Pressable
                onPress={() => handleMarkDanger(dangerCall.id, 'agresywny_pacjent')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="hand-left-outline" size={18} color="#DC2626" />
                <Text style={styles.urgentConfirmOptionText}>
                  Agresywny pacjent / Odmowa współpracy
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleMarkDanger(dangerCall.id, 'bariera_jezykowa')}
                style={({ pressed, hovered }) => [
                  styles.urgentConfirmOption,
                  hovered && styles.urgentConfirmOptionHover,
                  pressed && styles.urgentConfirmOptionPressed,
                ]}>
                <Ionicons name="globe-outline" size={18} color="#7C3AED" />
                <Text style={styles.urgentConfirmOptionText}>
                  Bariera językowa / Wymaga tłumacza
                </Text>
              </Pressable>
            </View>
            <View style={styles.urgentConfirmFooterRow}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={() => setDangerCall(null)}>
                <Text style={styles.editCancelButtonText}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
      {historyCall && (
        <View style={styles.editModalOverlay}>
          <Animated.View
            style={[
              styles.urgentConfirmCard,
              {
                transform: [
                  {
                    translateY: urgentModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                  {
                    scale: urgentModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
                opacity: urgentModalAnim,
              },
            ]}>
            <Text style={styles.urgentConfirmTitle}>Historia zgłoszenia</Text>
            <Text style={styles.urgentConfirmSubtitle}>
              {historyCall.patientName} · {historyCall.pesel} · {historyCall.phone}
            </Text>
            {(historyCall.history ?? []).length === 0 ? (
              <Text style={styles.urgentEmptyText}>Brak zapisanych zmian statusu.</Text>
            ) : (
              (historyCall.history ?? []).map((entry, index) => (
                <View key={`${entry.at}-${index}`} style={{ marginBottom: 8 }}>
                  <Text style={styles.urgentStatusText}>{entry.action}</Text>
                  <Text style={styles.urgentEmptyText}>
                    {entry.by} · {entry.at}
                  </Text>
                </View>
              ))
            )}
            <View style={styles.urgentConfirmFooterRow}>
              <TouchableOpacity style={styles.editCancelButton} onPress={() => setHistoryCall(null)}>
                <Text style={styles.editCancelButtonText}>Zamknij</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
      {callingCall && (
        <View style={styles.editModalOverlay}>
          <View style={styles.callMockCard}>
            <View style={styles.callMockIconWrap}>
              <Ionicons name="call" size={48} color="#2563EB" />
            </View>
            <Text style={styles.callMockLabel}>Dzwonienie…</Text>
            <Text style={styles.callMockNumber}>{callingCall.phone}</Text>
            <View style={styles.callMockDotsRow}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.callMockDot,
                    {
                      opacity: callDotsAnim[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.35, 1],
                      }),
                      transform: [
                        {
                          scale: callDotsAnim[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.callMockEndButton}
              onPress={() => setCallingCall(null)}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={styles.callMockEndButtonText}>Rozłącz (mock)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  root: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 260,
    backgroundColor: COLORS.sidebarBg,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sidebarHeader: {
    marginBottom: 32,
  },
  sidebarClinicRole: {
    color: COLORS.textOnSidebarMuted,
    fontSize: 13,
    marginTop: 4,
  },
  sidebarLogo: {
    width: '100%',
    height: 50,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  sidebarMenu: {},
  sidebarMenuItemActivePressed: {
    transform: [{ scale: 1.04 }],
    backgroundColor: '#DBEAFE',
  },
  sidebarMenuItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sidebarMenuItemPrimaryActive: {
    backgroundColor: '#EFF6FF',
  },
  sidebarMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sidebarMenuTextGroup: {
    flex: 1,
  },
  sidebarMenuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  sidebarMenuItemSelected: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  sidebarMenuTitle: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  sidebarMenuSubtitle: {
    color: COLORS.textOnSidebarMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sidebarMenuItemSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 8,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sidebarMenuItemSecondaryPressed: {
    transform: [{ scale: 1.04 }],
    backgroundColor: '#DBEAFE',
  },
  sidebarMenuIconSecondary: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sidebarMenuTitleSecondary: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  sidebarMenuItemUrgentActive: {
    backgroundColor: '#FEF2F2',
  },
  sidebarMenuTitleUrgentActive: {
    color: COLORS.danger,
  },
  sidebarMenuItemTriageActive: {
    backgroundColor: '#EEF2FF',
    shadowColor: '#6366F1',
    shadowOpacity: 0.22,
  },
  sidebarMenuItemSelectedTriage: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  sidebarMenuIconTriage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sidebarMenuTitleTriageActive: {
    color: '#4338CA',
    fontWeight: '700',
  },

  triageMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  triageMainSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    maxWidth: 720,
  },
  triagePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  triagePill: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  triagePillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
    shadowColor: '#6366F1',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  triagePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  triagePillTextActive: {
    color: '#3730A3',
  },
  triageColPatient: {
    flex: 1.2,
    minWidth: 100,
  },
  triageColNip: {
    flex: 0.85,
    minWidth: 88,
  },
  triageColSymptom: {
    flex: 1.1,
    minWidth: 100,
  },
  triageColResult: {
    flex: 1,
    minWidth: 90,
  },
  triageColTime: {
    flex: 0.75,
    minWidth: 80,
  },
  triageColActions: {
    flex: 0.65,
    minWidth: 64,
  },
  triageQColQuestion: {
    flex: 1.35,
    minWidth: 120,
  },
  triageQColCategory: {
    flex: 0.75,
    minWidth: 88,
  },
  triageQColWeight: {
    flex: 1,
    minWidth: 100,
  },
  triageQColAction: {
    flex: 1.2,
    minWidth: 120,
  },
  triageDetailBtnGlow: {
    borderRadius: 22,
    shadowColor: '#2563EB',
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  triageDetailBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  triageStatsPage: {
    marginTop: 8,
    paddingBottom: 32,
  },
  triageStatsHero: {
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#EEF2FF',
  },
  triageStatsHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  triageStatsHeroSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    fontWeight: '500',
  },
  triageStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 8,
  },
  triageStatCard: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 168,
    maxWidth: 240,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#6366F1',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  triageStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  triageStatValueAccent: {
    color: '#4F46E5',
  },
  triageStatValueMuted: {
    color: '#059669',
  },
  triageStatValueWarn: {
    color: '#D97706',
  },
  triageStatValueViolet: {
    color: '#7C3AED',
  },
  triageStatValueCyan: {
    color: '#0891B2',
  },
  triageStatLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 18,
  },
  triageStatHint: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 15,
  },
  triageChartsSectionTitle: {
    marginTop: 36,
    marginBottom: 6,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  triageChartsSectionSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 16,
    fontWeight: '500',
  },
  triageChartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  triageChartCell: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 320,
    maxWidth: 520,
  },
  triageChartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
    marginBottom: 0,
  },
  triageChartCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  triageChartCardHeaderText: {
    flex: 1,
  },
  triageChartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  triageChartSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 17,
  },
  triageVChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    minHeight: 132,
  },
  triageVBarWrap: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 48,
  },
  triageVBarTrack: {
    height: 120,
    width: '100%',
    maxWidth: 36,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  triageVBarFill: {
    width: '85%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4,
  },
  triageVBarLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  triageVBarValue: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  triageHBarGroup: {
    gap: 14,
  },
  triageHBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triageHBarLabel: {
    width: 118,
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  triageHBarTrack: {
    flex: 1,
    height: 9,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    minWidth: 0,
  },
  triageHBarFill: {
    height: '100%',
    borderRadius: 5,
    minWidth: 4,
  },
  triageHBarPct: {
    width: 34,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'right',
  },
  triageStripWrap: {
    marginBottom: 14,
  },
  triageStripRow: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 8,
    overflow: 'hidden',
  },
  triageStripSeg: {
    minWidth: 2,
  },
  triageLegendCol: {
    gap: 8,
  },
  triageLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triageLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triageLegendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  triageLegendPct: {
    fontWeight: '500',
    color: '#94A3B8',
  },
  triageHourChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    minHeight: 118,
    gap: 6,
  },
  triageHourBarWrap: {
    flex: 1,
    alignItems: 'center',
    minWidth: 40,
  },
  triageHourBarTrack: {
    height: 104,
    width: '100%',
    maxWidth: 44,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  triageHourBarFill: {
    width: '78%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 4,
    opacity: 0.92,
  },
  triageHourBarLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  triageHourBarCount: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  triageDetailModalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  triageDetailTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  triageDetailModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  triageDetailModalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  triageDetailCloseBtn: {
    padding: 4,
    marginLeft: 8,
  },
  triageDetailScroll: {
    maxHeight: 420,
    marginBottom: 16,
  },
  triageDetailPatientName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  triageDetailMetaLine: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  triageDetailSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.06,
    marginTop: 16,
    marginBottom: 6,
  },
  triageDetailSectionBody: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  triageDetailSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    marginTop: 20,
  },
  triageDetailSummaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triageDetailSummaryText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  triageDetailFooterBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  triageDetailFooterBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Main
  main: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 40,
    paddingTop: 32,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    maxWidth: 620,
  },
  urgentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  urgentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  urgentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 1,
  },
  urgentHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  urgentHeaderCell: {
    justifyContent: 'center',
  },
  urgentHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.08,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  urgentHeaderTextRight: {
    textAlign: 'right',
  },
  urgentColPatient: {
    flex: 1.5,
  },
  urgentColStatus: {
    flex: 1.2,
  },
  urgentColHandledBy: {
    flex: 1.2,
  },
  urgentColRegisteredUrgent: {
    flex: 1,
    minWidth: 100,
  },
  urgentColReactionUrgent: {
    flex: 1,
    minWidth: 100,
  },
  urgentColPhone: {
    flex: 1,
  },
  urgentColConfirm: {
    flex: 1,
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
  },
  urgentCell: {
    justifyContent: 'center',
  },
  urgentPatientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  urgentPatientPeselSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'lowercase',
  },
  urgentPesel: {
    fontSize: 14,
    color: '#4B5563',
  },
  urgentPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentPhone: {
    fontSize: 14,
    color: '#4B5563',
  },
  urgentCallIconButton: {
    padding: 6,
    borderRadius: 9999,
    backgroundColor: '#EFF6FF',
  },
  urgentStatusText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabLabelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  urgentConfirmCell: {
    alignItems: 'flex-end',
  },
  urgentActionWrapper: {
    position: 'relative',
  },
  urgentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  urgentIconButtonDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  urgentIconButtonHistory: {
    backgroundColor: '#FFEDD5',
    borderColor: '#F97316',
  },
  urgentIconButtonDangerHover: {
    backgroundColor: '#FCA5A5',
  },
  urgentIconButtonCancel: {
    backgroundColor: '#FFEDD5',
    borderColor: '#F97316',
  },
  urgentIconButtonCancelHover: {
    backgroundColor: '#FED7AA',
  },
  urgentIconButtonHover: {
    backgroundColor: '#BBF7D0',
  },
  urgentIconButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  urgentIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
  },
  urgentIconCircleDanger: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
  },
  urgentIconCircleCancel: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
  },
  urgentIconCircleHistory: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
  },
  urgentTooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -6 }],
    width: 160,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 20,
  },
  urgentTooltipText: {
    fontSize: 11,
    color: '#F9FAFB',
  },
  urgentEmptyRow: {
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  urgentEmptyText: {
    fontSize: 14,
    color: '#6B7280',
  },

  importColPatient: {
    flex: 1.7,
  },
  importColNumber: {
    flex: 1,
  },
  importColRegistered: {
    flex: 1,
  },
  importColDocType: {
    flex: 1,
  },
  importColAttachments: {
    flex: 1.4,
  },
  importColActions: {
    flex: 1,
  },
  importCellText: {
    fontSize: 14,
    color: '#4B5563',
  },

  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.danger,
  },
  importActionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Upload
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginBottom: 24,
  },
  uploadInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  uploadAnalyzingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Edit modal
  editModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  editModalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  editModalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  editFieldGroup: {
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.04,
  },
  editInput: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  editAttachmentsEmpty: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingVertical: 8,
  },
  editAttachmentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  editAttachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#EEF2FF',
    marginRight: 8,
    marginBottom: 8,
  },
  editAttachmentText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  editAttachmentRemove: {
    paddingHorizontal: 4,
  },
  editAttachmentRemoveText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  editAddAttachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  editAddAttachmentInput: {
    flex: 1,
    marginRight: 8,
  },
  editAddAttachmentButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: COLORS.primary,
  },
  editAddAttachmentButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editModalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  editCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  editCancelButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  editSaveButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: COLORS.primary,
  },
  editSaveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B91C1C',
    marginBottom: 4,
  },
  deleteModalSubtitle: {
    fontSize: 13,
    color: '#7F1D1D',
    marginBottom: 16,
  },
  deleteSummaryBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  deleteSummaryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F1D1D',
  },
  deleteSummaryPesel: {
    fontSize: 13,
    color: '#9F1239',
    marginTop: 2,
  },
  deleteSummaryFile: {
    fontSize: 12,
    color: '#BE123C',
    marginTop: 4,
  },
  deleteButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  deleteConfirmButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#DC2626',
  },
  deleteConfirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  urgentConfirmCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  urgentConfirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  urgentConfirmSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  urgentConfirmButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  urgentConfirmOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urgentConfirmOptionHover: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  urgentConfirmOptionPressed: {
    backgroundColor: '#DBEAFE',
    borderColor: '#60A5FA',
    transform: [{ scale: 0.97 }],
  },
  urgentConfirmOptionText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  urgentConfirmFooterRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  transferSummaryBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  transferSummaryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  transferSummaryPesel: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  transferSummaryFile: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  transferModalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  transferConfirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#16A34A',
  },
  transferConfirmButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  callMockCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  callMockIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  callMockLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  callMockNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  callMockDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  callMockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  callMockEndButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#DC2626',
    gap: 8,
  },
  callMockEndButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successToastWrapper: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#16A34A',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  successIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  successTextWrapper: {
    flexShrink: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ECFDF3',
  },
  successSubtitle: {
    fontSize: 12,
    color: '#DCFCE7',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    paddingVertical: 10,
    marginRight: 24,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.textPrimary,
  },
  tabButtonErrorActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.danger,
  },
  tabButtonText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: COLORS.textPrimary,
  },

  // List
  tableWrapper: {
    maxHeight: '50vh',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  listContainer: {
    marginTop: 8,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 480,
  },

  packageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  colPatient: {
    flex: 1,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  colPesel: {
    flex: 1,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  colNr: {
    flex: 1,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  colRegistered: {
    flex: 1,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  colDocType: {
    flex: 1,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    alignItems: 'flex-start',
  },
  colAttachments: {
    flex: 1,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  colActions: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: 10,
  },
  namePeselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
    marginRight: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  inlineIcon: {
    marginRight: 4,
  },
  inlineText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  inlineTimeText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  peselBox: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  peselText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  cellNrText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cellText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  aiFileText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  docTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  docTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  headerCellPatient: { flex: 1 },
  headerCellPesel: { flex: 1 },
  headerCellNr: { flex: 1 },
  headerCellRegistered: { flex: 1 },
  headerCellDocType: { flex: 1 },
  headerCellAttachments: { flex: 1 },
  headerCellActions: { flex: 1, textAlign: 'right' },
  transferButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  transferButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  transferButtonDisabled: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.chipGrayBg,
  },
  transferButtonDisabledText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#F97316',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.danger,
  },
});


