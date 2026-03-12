import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PATIENT_NAME = 'Janie';

const COLORS = {
  background: '#F0F4F8',
  primary: '#1A6FBF',
  primaryDark: '#155EA0',
  primaryLight: '#EBF3FC',
  accent: '#E8F5E9',
  accentGreen: '#2E7D32',
  accentPurple: '#4A148C',
  accentPurpleLight: '#F3E5F5',
  white: '#FFFFFF',
  textPrimary: '#1A2B3C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  border: '#D9E2EC',
  shadow: '#A0AEC0',
};

export default function DashboardScreen() {
  const handleTriagePress = () => {
    router.push('/triage' as never);
  };

  const handleQuickAction = (label: string) => {
    Alert.alert(label, 'Ta funkcja będzie dostępna wkrótce.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerGreeting}>Dzień dobry,</Text>
            <Text style={styles.headerName}>{PATIENT_NAME} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => handleQuickAction('Profil pacjenta')}
            accessibilityLabel="Profil pacjenta"
            accessibilityRole="button">
            <Ionicons name="person-circle-outline" size={48} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* ── INFO BADGE ── */}
        <View style={styles.infoBadge}>
          <Ionicons name="information-circle" size={18} color={COLORS.primary} />
          <Text style={styles.infoBadgeText}>
            Twoja kolejna wizyta: <Text style={styles.infoBadgeBold}>Brak zaplanowanych</Text>
          </Text>
        </View>

        {/* ── HERO ACTION ── */}
        <Pressable
          style={({ pressed }) => [styles.heroCard, pressed && styles.heroCardPressed]}
          onPress={handleTriagePress}
          accessibilityLabel="Zgłoś problem lub zamów receptę – wejście do Triage"
          accessibilityRole="button">
          <View style={styles.heroIconWrapper}>
            <Ionicons name="medkit" size={40} color={COLORS.white} />
          </View>
          <View style={styles.heroTextGroup}>
            <Text style={styles.heroTitle}>Zgłoś problem</Text>
            <Text style={styles.heroSubtitle}>Zamów receptę / Triage</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={28}
            color="rgba(255,255,255,0.7)"
            style={styles.heroChevron}
          />
        </Pressable>

        {/* ── SECTION LABEL ── */}
        <Text style={styles.sectionLabel}>Na skróty</Text>

        {/* ── QUICK ACTIONS GRID ── */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardGreen]}
            onPress={() => handleQuickAction('Moje e-Recepty')}
            accessibilityLabel="Moje e-Recepty"
            accessibilityRole="button"
            activeOpacity={0.8}>
            <View style={[styles.quickIconWrapper, { backgroundColor: '#C8E6C9' }]}>
              <Ionicons name="document-text" size={30} color={COLORS.accentGreen} />
            </View>
            <Text style={[styles.quickCardTitle, { color: COLORS.accentGreen }]}>
              Moje{'\n'}e-Recepty
            </Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.accentGreen} style={styles.quickChevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardPurple]}
            onPress={() => handleQuickAction('Historia leczenia')}
            accessibilityLabel="Historia leczenia"
            accessibilityRole="button"
            activeOpacity={0.8}>
            <View style={[styles.quickIconWrapper, { backgroundColor: '#E1BEE7' }]}>
              <Ionicons name="time" size={30} color={COLORS.accentPurple} />
            </View>
            <Text style={[styles.quickCardTitle, { color: COLORS.accentPurple }]}>
              Historia{'\n'}leczenia
            </Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.accentPurple} style={styles.quickChevron} />
          </TouchableOpacity>
        </View>

        {/* ── SECONDARY ACTIONS ── */}
        <Text style={styles.sectionLabel}>Więcej opcji</Text>

        <View style={styles.listCard}>
          {[
            { icon: 'calendar-outline' as const, label: 'Umów wizytę', color: COLORS.primary },
            { icon: 'chatbubble-ellipses-outline' as const, label: 'Wyniki badań', color: '#D84315' },
            { icon: 'shield-checkmark-outline' as const, label: 'Ubezpieczenie', color: '#00695C' },
          ].map((item, index, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.listItem,
                index < arr.length - 1 && styles.listItemBorder,
              ]}
              onPress={() => handleQuickAction(item.label)}
              accessibilityLabel={item.label}
              accessibilityRole="button"
              activeOpacity={0.7}>
              <View style={[styles.listIconWrapper, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.listItemLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const SHADOW = Platform.select({
  ios: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  android: { elevation: 6 },
  default: {},
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  headerName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },

  // ── Info Badge ──
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
    gap: 8,
  },
  infoBadgeText: {
    fontSize: 14,
    color: COLORS.primary,
    flex: 1,
  },
  infoBadgeBold: {
    fontWeight: '700',
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    minHeight: 110,
    ...SHADOW,
  },
  heroCardPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  heroIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroTextGroup: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  heroChevron: {
    marginLeft: 8,
  },

  // ── Section Label ──
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  // ── Quick Grid ──
  quickGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  quickCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    minHeight: 140,
    justifyContent: 'space-between',
    ...SHADOW,
  },
  quickCardGreen: {
    backgroundColor: COLORS.accent,
  },
  quickCardPurple: {
    backgroundColor: COLORS.accentPurpleLight,
  },
  quickIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
  },
  quickChevron: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  // ── List Card ──
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOW,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 64,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  listItemLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },

  bottomSpacer: {
    height: 32,
  },
});
