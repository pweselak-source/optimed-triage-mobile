import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

type Visit = {
  id: string;
  doctorName: string;
  specialty: string;
  date: string; // ISO: YYYY-MM-DD
  time: string; // HH:mm
  location: string;
};

const COLORS = {
  background: '#F0F4F8',
  card: '#FFFFFF',
  primary: '#2F4F9F',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  dangerLight: '#FEE2E2',
  danger: '#DC2626',
  border: '#E5E7EB',
  shadow: '#9CA3AF',
};

export default function MyVisitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [visits, setVisits] = useState<Visit[]>([
    {
      id: 'demo-1',
      doctorName: 'lek. Ewa Nowaczyk-Rogowska',
      specialty: 'Internista',
      date: '2026-04-15',
      time: '10:30',
      location: 'ul. 30-go Stycznia 55',
    },
    {
      id: 'demo-2',
      doctorName: 'lek. Anna Freza',
      specialty: 'Internista',
      date: '2026-04-20',
      time: '14:00',
      location: 'ul. Jasia i Małgosi 8/4',
    },
  ]);

  useEffect(() => {
    if (!params?.newVisit) {
      return;
    }

    try {
      const raw = Array.isArray(params.newVisit) ? params.newVisit[0] : params.newVisit;
      if (!raw) return;

      const parsed = JSON.parse(raw as string) as Visit;
      if (!parsed?.id) return;

      setVisits((prev) => {
        const exists = prev.some((v) => v.id === parsed.id);
        if (exists) return prev;
        return [...prev, parsed];
      });
    } catch {
      // Ignorujemy błędne dane w parametrach
    }
  }, [params.newVisit]);

  const sortedVisits = useMemo(() => {
    return [...visits].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}:00`);
      const dateB = new Date(`${b.date}T${b.time}:00`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [visits]);

  const handleCancelVisit = (id: string) => {
    const visit = visits.find((v) => v.id === id);
    const label = visit
      ? `${visit.date} ${visit.time} – ${visit.doctorName}`
      : 'tej wizyty';

    Alert.alert(
      'Odwołanie wizyty',
      `Czy na pewno chcesz odwołać ${label}?`,
      [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Tak, odwołaj',
          style: 'destructive',
          onPress: () => {
            setVisits((prev) => prev.filter((v) => v.id !== id));
          },
        },
      ],
      { cancelable: true },
    );
  };

  const renderVisit = ({ item }: { item: Visit }) => {
    const formattedDate = new Date(`${item.date}T${item.time}:00`).toLocaleString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.visitCard}>
        <Text style={styles.visitDate}>{formattedDate}</Text>
        <Text style={styles.visitDoctor}>{item.doctorName}</Text>
        <Text style={styles.visitSpecialty}>{item.specialty}</Text>

        <View style={styles.visitLocationRow}>
          <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.visitLocationText}>{item.location}</Text>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelVisit(item.id)}
          activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Odwołaj wizytę</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleGoToBooking = () => {
    router.push('/booking' as never);
  };

  const handleGoBackHome = () => {
    router.replace('/' as never);
  };

  const hasVisits = sortedVisits.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleGoBackHome}
          style={styles.backButton}
          activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moje wizyty</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.content}>
        {!hasVisits ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Brak zaplanowanych wizyt</Text>
            <Text style={styles.emptySubtitle}>
              Gdy umówisz wizytę, pojawi się ona na tej liście.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGoToBooking}
              activeOpacity={0.9}>
              <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Umów nową wizytę</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sortedVisits}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderVisit}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const SHADOW = {
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    ...SHADOW,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  visitCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOW,
  },
  visitDate: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  visitDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  visitSpecialty: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  visitLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  visitLocationText: {
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});

